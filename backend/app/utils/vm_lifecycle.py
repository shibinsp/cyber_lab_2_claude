"""
Cyyber Linux VM Lifecycle Manager
Adds pause/resume functionality to Docker containers for resource optimization
"""
import docker
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class VMLifecycleManager:
    """
    Manages VM lifecycle states for resource optimization
    States: running → paused → stopped
    """

    def __init__(self):
        self.docker_client = docker.from_env()
        self.vm_activity = {}  # Track last activity per VM

    def start_vm(self, container_id: str) -> dict:
        """Start or unpause a VM"""
        try:
            container = self.docker_client.containers.get(container_id)

            if container.status == "paused":
                container.unpause()
                logger.info(f"Unpaused VM: {container_id}")
                return {"action": "unpaused", "status": "running"}

            elif container.status == "exited":
                container.start()
                logger.info(f"Started VM: {container_id}")
                return {"action": "started", "status": "running"}

            else:
                return {"action": "already_running", "status": container.status}

        except docker.errors.NotFound:
            return {"error": "VM not found"}
        except Exception as e:
            logger.error(f"Failed to start VM {container_id}: {e}")
            return {"error": str(e)}

    def pause_vm(self, container_id: str) -> dict:
        """
        Pause VM to save CPU and RAM
        Paused containers: 0% CPU, frozen RAM (still allocated but not actively used)
        """
        try:
            container = self.docker_client.containers.get(container_id)

            if container.status == "running":
                container.pause()
                logger.info(f"Paused VM: {container_id} - Resources freed!")
                return {
                    "action": "paused",
                    "status": "paused",
                    "message": "VM frozen - using 0% CPU"
                }

            return {"action": "already_paused", "status": container.status}

        except docker.errors.NotFound:
            return {"error": "VM not found"}
        except Exception as e:
            logger.error(f"Failed to pause VM {container_id}: {e}")
            return {"error": str(e)}

    def stop_vm(self, container_id: str, timeout: int = 10) -> dict:
        """Stop VM completely"""
        try:
            container = self.docker_client.containers.get(container_id)

            container.stop(timeout=timeout)
            logger.info(f"Stopped VM: {container_id}")

            return {"action": "stopped", "status": "exited"}

        except docker.errors.NotFound:
            return {"error": "VM not found"}
        except Exception as e:
            logger.error(f"Failed to stop VM {container_id}: {e}")
            return {"error": str(e)}

    def get_vm_stats(self, container_id: str) -> dict:
        """Get VM resource usage stats"""
        try:
            container = self.docker_client.containers.get(container_id)

            stats = container.stats(stream=False)

            # Calculate CPU percentage
            cpu_delta = stats["cpu_stats"]["cpu_usage"]["total_usage"] - \
                       stats["precpu_stats"]["cpu_usage"]["total_usage"]
            system_delta = stats["cpu_stats"]["system_cpu_usage"] - \
                          stats["precpu_stats"]["system_cpu_usage"]

            cpu_percent = 0.0
            if system_delta > 0:
                cpu_percent = (cpu_delta / system_delta) * 100.0

            # Calculate memory usage
            mem_usage_mb = stats["memory_stats"]["usage"] / (1024 * 1024)
            mem_limit_mb = stats["memory_stats"]["limit"] / (1024 * 1024)
            mem_percent = (mem_usage_mb / mem_limit_mb) * 100

            return {
                "status": container.status,
                "cpu_percent": round(cpu_percent, 2),
                "memory_used_mb": round(mem_usage_mb, 2),
                "memory_limit_mb": round(mem_limit_mb, 2),
                "memory_percent": round(mem_percent, 2),
                "network_rx_bytes": stats["networks"].get("eth0", {}).get("rx_bytes", 0),
                "network_tx_bytes": stats["networks"].get("eth0", {}).get("tx_bytes", 0)
            }

        except docker.errors.NotFound:
            return {"error": "VM not found"}
        except Exception as e:
            logger.error(f"Failed to get stats for {container_id}: {e}")
            return {"error": str(e)}

    def record_activity(self, container_id: str):
        """Record user activity for a VM"""
        self.vm_activity[container_id] = datetime.now()

    def get_idle_time(self, container_id: str) -> Optional[timedelta]:
        """Get how long VM has been idle"""
        if container_id not in self.vm_activity:
            return None

        return datetime.now() - self.vm_activity[container_id]

    def auto_pause_idle_vms(self, idle_threshold_minutes: int = 10):
        """
        Automatically pause VMs that have been idle
        Call this periodically (e.g., every minute)
        """
        paused_count = 0

        try:
            containers = self.docker_client.containers.list(
                filters={"name": "lab_"}
            )

            for container in containers:
                if container.status != "running":
                    continue

                idle_time = self.get_idle_time(container.id)

                if idle_time and idle_time > timedelta(minutes=idle_threshold_minutes):
                    result = self.pause_vm(container.id)
                    if result.get("action") == "paused":
                        paused_count += 1
                        logger.info(f"Auto-paused {container.name} (idle for {idle_time})")

        except Exception as e:
            logger.error(f"Error in auto-pause: {e}")

        return {"paused_count": paused_count}

    def get_all_vms_status(self) -> list:
        """Get status of all lab VMs"""
        try:
            containers = self.docker_client.containers.list(
                all=True,
                filters={"name": "lab_"}
            )

            vms = []
            for container in containers:
                # Parse lab_id and user_id from container name
                # Expected format: lab_{lab_id}_{user_id}
                parts = container.name.split("_")
                if len(parts) >= 3:
                    lab_id = "_".join(parts[0:2])  # lab_xxx
                    user_id = parts[2]

                    idle_time = self.get_idle_time(container.id)

                    vms.append({
                        "container_id": container.id[:12],
                        "container_name": container.name,
                        "lab_id": lab_id,
                        "user_id": user_id,
                        "status": container.status,
                        "idle_minutes": idle_time.total_seconds() / 60 if idle_time else 0
                    })

            return vms

        except Exception as e:
            logger.error(f"Failed to get all VMs: {e}")
            return []

    def optimize_resources(self) -> dict:
        """
        Optimize resource usage by:
        1. Pausing idle VMs (>10 min)
        2. Stopping very idle VMs (>30 min)
        """
        result = {
            "paused": 0,
            "stopped": 0,
            "running": 0
        }

        try:
            containers = self.docker_client.containers.list(
                all=True,
                filters={"name": "lab_"}
            )

            for container in containers:
                if container.status == "running":
                    result["running"] += 1

                    idle_time = self.get_idle_time(container.id)

                    if idle_time:
                        # Pause after 10 minutes
                        if idle_time > timedelta(minutes=10):
                            self.pause_vm(container.id)
                            result["paused"] += 1

                        # Stop after 30 minutes
                        elif idle_time > timedelta(minutes=30):
                            self.stop_vm(container.id)
                            result["stopped"] += 1

        except Exception as e:
            logger.error(f"Error optimizing resources: {e}")

        return result
