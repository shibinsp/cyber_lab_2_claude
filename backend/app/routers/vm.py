"""
Virtual Machine Management for Labs
"""
import docker
import random
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..utils.auth import get_current_user
from ..utils.vm_lifecycle import VMLifecycleManager
from ..utils.redis_client import redis_client

logger = logging.getLogger(__name__)

router = APIRouter(tags=["vm"])

# Docker client
docker_client = docker.from_env()

# VM Lifecycle Manager
vm_lifecycle = VMLifecycleManager()

# Redis key prefix for VM state
VM_KEY_PREFIX = "vm:state:"
VM_TTL = 7200  # 2 hours TTL for VM state

def get_vm_key(user_id: int, lab_id: str) -> str:
    """Generate Redis key for VM state"""
    return f"{VM_KEY_PREFIX}{user_id}:{lab_id}"

def get_vm_state(user_id: int, lab_id: str) -> dict:
    """Get VM state from Redis"""
    key = get_vm_key(user_id, lab_id)
    state = redis_client.get_json(key)
    return state if state else {}

def set_vm_state(user_id: int, lab_id: str, state: dict) -> bool:
    """Store VM state in Redis"""
    key = get_vm_key(user_id, lab_id)
    return redis_client.set_json(key, state, ttl=VM_TTL)

def delete_vm_state(user_id: int, lab_id: str) -> bool:
    """Delete VM state from Redis"""
    key = get_vm_key(user_id, lab_id)
    return redis_client.delete(key)

def get_all_user_vms(user_id: int) -> list:
    """Get all VMs for a user from Redis"""
    pattern = f"{VM_KEY_PREFIX}{user_id}:*"
    keys = []
    if redis_client.is_connected():
        try:
            keys = redis_client.client.keys(pattern)
        except:
            pass
    
    vms = []
    for key in keys:
        lab_id = key.split(":")[-1]
        state = redis_client.get_json(key)
        if state:
            state["lab_id"] = lab_id
            vms.append(state)
    return vms

@router.post("/start/{lab_id}")
def start_vm(lab_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Start a VM container for a specific lab"""
    try:
        # Check if user already has a VM running for this lab
        vm_state = get_vm_state(current_user.id, lab_id)
        
        if vm_state and vm_state.get("container_id"):
            container_id = vm_state["container_id"]
            try:
                container = docker_client.containers.get(container_id)
                if container.status == "running":
                    return {
                        "status": "already_running",
                        "container_id": container_id,
                        "vnc_port": vm_state.get("vnc_port"),
                        "novnc_port": vm_state.get("novnc_port"),
                        "message": "VM is already running"
                    }
            except docker.errors.NotFound:
                # Container was removed, clean up
                delete_vm_state(current_user.id, lab_id)
        
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
        
        # Store VM info in Redis
        vm_state = {
            "container_id": container.id,
            "lab_id": lab_id,
            "user_id": current_user.id,
            "vnc_port": final_vnc_port,
            "novnc_port": final_novnc_port
        }
        set_vm_state(current_user.id, lab_id, vm_state)
        
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
        vm_state = get_vm_state(current_user.id, lab_id)
        
        if not vm_state or not vm_state.get("container_id"):
            return {"status": "not_running", "message": "No VM running for this lab"}
        
        container_id = vm_state["container_id"]
        
        try:
            container = docker_client.containers.get(container_id)
            container.stop(timeout=5)
            delete_vm_state(current_user.id, lab_id)
            
            return {
                "status": "stopped",
                "message": "VM stopped successfully"
            }
        except docker.errors.NotFound:
            delete_vm_state(current_user.id, lab_id)
            return {"status": "not_found", "message": "Container not found, cleaned up"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop VM: {str(e)}")

@router.get("/status/{lab_id}")
def get_vm_status(lab_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get status of VM for a specific lab"""
    vm_state = get_vm_state(current_user.id, lab_id)
    
    if not vm_state or not vm_state.get("container_id"):
        return {
            "status": "not_running",
            "running": False
        }
    
    container_id = vm_state["container_id"]
    
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
        final_vnc_port = actual_vnc_port or vm_state.get("vnc_port")
        final_novnc_port = actual_novnc_port or vm_state.get("novnc_port")
        
        # Update stored ports if they changed
        if actual_vnc_port or actual_novnc_port:
            vm_state["vnc_port"] = final_vnc_port
            vm_state["novnc_port"] = final_novnc_port
            set_vm_state(current_user.id, lab_id, vm_state)
        
        return {
            "status": container.status,
            "running": container.status == "running",
            "container_id": container_id[:12],
            "vnc_port": final_vnc_port,
            "novnc_port": final_novnc_port
        }
    except docker.errors.NotFound:
        delete_vm_state(current_user.id, lab_id)
        return {
            "status": "not_found",
            "running": False
        }

@router.get("/list")
def list_user_vms(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List all running VMs for the current user"""
    user_vms = []
    vms = get_all_user_vms(current_user.id)
    
    for vm_info in vms:
        if vm_info.get("user_id") == current_user.id:
            try:
                container = docker_client.containers.get(vm_info["container_id"])
                user_vms.append({
                    "lab_id": vm_info["lab_id"],
                    "container_id": vm_info["container_id"][:12],
                    "status": container.status,
                    "vnc_port": vm_info.get("vnc_port"),
                    "novnc_port": vm_info.get("novnc_port")
                })
            except docker.errors.NotFound:
                delete_vm_state(current_user.id, vm_info["lab_id"])
    
    return {"vms": user_vms}

@router.delete("/cleanup")
def cleanup_stopped_vms(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Clean up stopped or removed VM entries"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    cleaned = 0
    if redis_client.is_connected():
        try:
            pattern = f"{VM_KEY_PREFIX}*"
            keys = redis_client.client.keys(pattern)
            
            for key in keys:
                vm_state = redis_client.get_json(key)
                if vm_state and vm_state.get("container_id"):
                    container_id = vm_state["container_id"]
                    user_id = vm_state.get("user_id")
                    lab_id = vm_state.get("lab_id")
                    
                    try:
                        container = docker_client.containers.get(container_id)
                        if container.status != "running":
                            container.remove(force=True)
                            delete_vm_state(user_id, lab_id)
                            cleaned += 1
                    except docker.errors.NotFound:
                        delete_vm_state(user_id, lab_id)
                        cleaned += 1
        except Exception as e:
            logger.error(f"Cleanup error: {e}")
    
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
    vm_state = get_vm_state(current_user.id, lab_id)

    if not vm_state or not vm_state.get("container_id"):
        raise HTTPException(status_code=404, detail="No VM running for this lab")

    container_id = vm_state["container_id"]

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
    vm_state = get_vm_state(current_user.id, lab_id)

    if not vm_state or not vm_state.get("container_id"):
        raise HTTPException(status_code=404, detail="No VM found for this lab")

    container_id = vm_state["container_id"]

    result = vm_lifecycle.start_vm(container_id)

    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])

    # Record activity
    vm_lifecycle.record_activity(container_id)

    return {
        "status": "running",
        "lab_id": lab_id,
        "container_id": container_id[:12],
        "vnc_port": vm_state.get("vnc_port"),
        "novnc_port": vm_state.get("novnc_port"),
        "message": "VM resumed successfully"
    }

@router.get("/stats/{lab_id}")
def get_vm_stats(lab_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get VM resource usage statistics"""
    vm_state = get_vm_state(current_user.id, lab_id)

    if not vm_state or not vm_state.get("container_id"):
        return {"error": "No VM found"}

    container_id = vm_state["container_id"]

    stats = vm_lifecycle.get_vm_stats(container_id)

    # Record activity (user checking stats = active)
    vm_lifecycle.record_activity(container_id)

    return stats

@router.post("/activity/{lab_id}")
def record_vm_activity(lab_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Record user activity (called by frontend on VNC interaction)"""
    vm_state = get_vm_state(current_user.id, lab_id)

    if not vm_state or not vm_state.get("container_id"):
        return {"status": "not_found"}

    container_id = vm_state["container_id"]
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
