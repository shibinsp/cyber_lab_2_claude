"""
Virtual Machine Management for Labs
"""
import docker
import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..utils.auth import get_current_user
from ..utils.vm_lifecycle import VMLifecycleManager

router = APIRouter(tags=["vm"])

# Docker client
docker_client = docker.from_env()

# VM Lifecycle Manager
vm_lifecycle = VMLifecycleManager()

# Store active VMs (in production, use Redis or database)
active_vms = {}

@router.post("/start/{lab_id}")
def start_vm(lab_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Start a VM container for a specific lab"""
    try:
        # Check if user already has a VM running for this lab
        vm_key = f"{current_user.id}_{lab_id}"
        
        if vm_key in active_vms:
            container_id = active_vms[vm_key]["container_id"]
            try:
                container = docker_client.containers.get(container_id)
                if container.status == "running":
                    return {
                        "status": "already_running",
                        "container_id": container_id,
                        "vnc_port": active_vms[vm_key]["vnc_port"],
                        "novnc_port": active_vms[vm_key]["novnc_port"],
                        "message": "VM is already running"
                    }
            except docker.errors.NotFound:
                # Container was removed, clean up
                del active_vms[vm_key]
        
        # Remove any existing container with the same name (cleanup)
        container_name = f"lab_{lab_id}_{current_user.id}"
        try:
            old_container = docker_client.containers.get(container_name)
            old_container.remove(force=True)
        except docker.errors.NotFound:
            pass  # No old container to remove
        
        # Assign random ports to avoid conflicts
        vnc_port = random.randint(6000, 6999)
        novnc_port = random.randint(7000, 7999)
        
        # Get user's password for VM (use their login password)
        user_password = current_user.vm_password or "student"  # Fallback to default
        
        # Start a new container
        container = docker_client.containers.run(
            "cyberlab-vm:latest",
            detach=True,
            name=container_name,
            ports={
                '5901/tcp': vnc_port,
                '6080/tcp': novnc_port
            },
            environment={
                "USER": current_user.username,  # Use actual username
                "PASSWORD": user_password,  # Use user's login password
                "VNC_PASSWORD": user_password,  # Use same password for VNC
                "RESOLUTION": "1280x720"
            },
            # remove=True,  # DISABLED - Keep container for debugging if it crashes
            mem_limit="2g",  # Limit memory
            cpu_period=100000,
            cpu_quota=50000,  # 50% CPU
            restart_policy={"Name": "unless-stopped"}  # Auto-restart if crashes
        )
        
        # Get the ACTUAL ports assigned by Docker (may differ from requested)
        container.reload()  # Refresh container info
        actual_vnc_port = None
        actual_novnc_port = None
        
        if container.ports:
            if '5901/tcp' in container.ports and container.ports['5901/tcp']:
                actual_vnc_port = int(container.ports['5901/tcp'][0]['HostPort'])
            if '6080/tcp' in container.ports and container.ports['6080/tcp']:
                actual_novnc_port = int(container.ports['6080/tcp'][0]['HostPort'])
        
        # Use actual ports or fallback to requested
        final_vnc_port = actual_vnc_port or vnc_port
        final_novnc_port = actual_novnc_port or novnc_port
        
        # Store VM info
        active_vms[vm_key] = {
            "container_id": container.id,
            "lab_id": lab_id,
            "user_id": current_user.id,
            "vnc_port": final_vnc_port,
            "novnc_port": final_novnc_port
        }
        
        return {
            "status": "started",
            "container_id": container.id[:12],
            "vnc_port": final_vnc_port,
            "novnc_port": final_novnc_port,
            "message": "VM started successfully"
        }
        
    except docker.errors.ImageNotFound:
        raise HTTPException(status_code=404, detail="VM image not found. Please build it first.")
    except docker.errors.APIError as e:
        raise HTTPException(status_code=500, detail=f"Docker error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start VM: {str(e)}")

@router.post("/stop/{lab_id}")
def stop_vm(lab_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Stop a running VM container"""
    try:
        vm_key = f"{current_user.id}_{lab_id}"
        
        if vm_key not in active_vms:
            return {"status": "not_running", "message": "No VM running for this lab"}
        
        container_id = active_vms[vm_key]["container_id"]
        
        try:
            container = docker_client.containers.get(container_id)
            container.stop(timeout=5)
            del active_vms[vm_key]
            
            return {
                "status": "stopped",
                "message": "VM stopped successfully"
            }
        except docker.errors.NotFound:
            del active_vms[vm_key]
            return {"status": "not_found", "message": "Container not found, cleaned up"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop VM: {str(e)}")

@router.get("/status/{lab_id}")
def get_vm_status(lab_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get status of VM for a specific lab"""
    vm_key = f"{current_user.id}_{lab_id}"
    
    if vm_key not in active_vms:
        return {
            "status": "not_running",
            "running": False
        }
    
    container_id = active_vms[vm_key]["container_id"]
    
    try:
        container = docker_client.containers.get(container_id)
        
        # Get actual ports from the running container
        container.reload()
        actual_vnc_port = None
        actual_novnc_port = None
        
        if container.ports:
            if '5901/tcp' in container.ports and container.ports['5901/tcp']:
                actual_vnc_port = int(container.ports['5901/tcp'][0]['HostPort'])
            if '6080/tcp' in container.ports and container.ports['6080/tcp']:
                actual_novnc_port = int(container.ports['6080/tcp'][0]['HostPort'])
        
        # Use actual ports or fallback to stored
        final_vnc_port = actual_vnc_port or active_vms[vm_key]["vnc_port"]
        final_novnc_port = actual_novnc_port or active_vms[vm_key]["novnc_port"]
        
        # Update stored ports if they changed
        if actual_vnc_port:
            active_vms[vm_key]["vnc_port"] = actual_vnc_port
        if actual_novnc_port:
            active_vms[vm_key]["novnc_port"] = actual_novnc_port
        
        return {
            "status": container.status,
            "running": container.status == "running",
            "container_id": container_id[:12],
            "vnc_port": final_vnc_port,
            "novnc_port": final_novnc_port
        }
    except docker.errors.NotFound:
        del active_vms[vm_key]
        return {
            "status": "not_found",
            "running": False
        }

@router.get("/list")
def list_user_vms(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List all running VMs for the current user"""
    user_vms = []
    
    for vm_key, vm_info in list(active_vms.items()):
        if vm_info["user_id"] == current_user.id:
            try:
                container = docker_client.containers.get(vm_info["container_id"])
                user_vms.append({
                    "lab_id": vm_info["lab_id"],
                    "container_id": vm_info["container_id"][:12],
                    "status": container.status,
                    "vnc_port": vm_info["vnc_port"],
                    "novnc_port": vm_info["novnc_port"]
                })
            except docker.errors.NotFound:
                del active_vms[vm_key]
    
    return {"vms": user_vms}

@router.delete("/cleanup")
def cleanup_stopped_vms(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Clean up stopped or removed VM entries"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    cleaned = 0
    for vm_key in list(active_vms.keys()):
        container_id = active_vms[vm_key]["container_id"]
        try:
            container = docker_client.containers.get(container_id)
            if container.status != "running":
                container.remove(force=True)
                del active_vms[vm_key]
                cleaned += 1
        except docker.errors.NotFound:
            del active_vms[vm_key]
            cleaned += 1
    
    return {"cleaned": cleaned, "message": f"Cleaned up {cleaned} VM(s)"}

# ═══════════════════════════════════════════════════════════════
# Cyyber Linux VM Lifecycle Endpoints (Resource Optimization)
# ═══════════════════════════════════════════════════════════════

@router.post("/pause/{lab_id}")
def pause_vm(lab_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Pause VM to save resources
    Paused VMs use 0% CPU (frozen state)
    """
    vm_key = f"{current_user.id}_{lab_id}"

    if vm_key not in active_vms:
        raise HTTPException(status_code=404, detail="No VM running for this lab")

    container_id = active_vms[vm_key]["container_id"]

    result = vm_lifecycle.pause_vm(container_id)

    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])

    return {
        "status": "paused",
        "lab_id": lab_id,
        "container_id": container_id[:12],
        "message": "VM paused - Resources saved!",
        "resource_savings": "~1 vCPU freed"
    }

@router.post("/resume/{lab_id}")
def resume_vm(lab_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Resume a paused VM"""
    vm_key = f"{current_user.id}_{lab_id}"

    if vm_key not in active_vms:
        raise HTTPException(status_code=404, detail="No VM found for this lab")

    container_id = active_vms[vm_key]["container_id"]

    result = vm_lifecycle.start_vm(container_id)

    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])

    # Record activity
    vm_lifecycle.record_activity(container_id)

    return {
        "status": "running",
        "lab_id": lab_id,
        "container_id": container_id[:12],
        "vnc_port": active_vms[vm_key]["vnc_port"],
        "novnc_port": active_vms[vm_key]["novnc_port"],
        "message": "VM resumed successfully"
    }

@router.get("/stats/{lab_id}")
def get_vm_stats(lab_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get VM resource usage statistics"""
    vm_key = f"{current_user.id}_{lab_id}"

    if vm_key not in active_vms:
        return {"error": "No VM found"}

    container_id = active_vms[vm_key]["container_id"]

    stats = vm_lifecycle.get_vm_stats(container_id)

    # Record activity (user checking stats = active)
    vm_lifecycle.record_activity(container_id)

    return stats

@router.post("/activity/{lab_id}")
def record_vm_activity(lab_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Record user activity (called by frontend on VNC interaction)"""
    vm_key = f"{current_user.id}_{lab_id}"

    if vm_key not in active_vms:
        return {"status": "not_found"}

    container_id = active_vms[vm_key]["container_id"]
    vm_lifecycle.record_activity(container_id)

    return {"status": "activity_recorded"}

@router.get("/admin/all-vms")
def list_all_vms(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Admin: List all VMs across all users"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    vms = vm_lifecycle.get_all_vms_status()

    return {
        "total_vms": len(vms),
        "vms": vms
    }

@router.post("/admin/optimize")
def optimize_resources(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Admin: Run resource optimization (pause idle VMs)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    result = vm_lifecycle.optimize_resources()

    return {
        "optimization_result": result,
        "message": f"Paused {result['paused']} idle VMs, Stopped {result['stopped']} very idle VMs"
    }
