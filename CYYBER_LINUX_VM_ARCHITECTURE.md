# Cyyber Linux Custom VM System - Architecture Design

## Executive Summary

This document outlines the architecture for transitioning from Docker-based VMs to custom-branded QEMU/KVM virtual machines with lifecycle management and resource optimization.

## Current System vs. New System

### Current Architecture (Docker-based):
```
┌─────────────────────────────────────────┐
│  Frontend (React)                       │
│  - Lab interface                        │
│  - NoVNC embed                          │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  Backend (FastAPI)                      │
│  - VM start/stop API                    │
│  - Docker SDK                           │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  Docker Containers                      │
│  - Single image: cyberlab-vm            │
│  - Same tools for all labs              │
│  - No persistence                       │
└─────────────────────────────────────────┘
```

**Limitations:**
- ❌ No lab-specific tool preinstallation
- ❌ No custom branding per lab
- ❌ No resource optimization (always running or terminated)
- ❌ Limited isolation
- ❌ Docker overhead

### New Architecture (QEMU/KVM-based):
```
┌────────────────────────────────────────────────┐
│  Frontend (React)                              │
│  - Lab interface                               │
│  - NoVNC embed                                 │
│  - VM lifecycle controls                       │
└───────────────┬────────────────────────────────┘
                │
                ▼
┌────────────────────────────────────────────────┐
│  Backend (FastAPI)                             │
│  - VM lifecycle API (start/stop/pause/resume)  │
│  - libvirt Python bindings                     │
│  - Resource monitoring                         │
└───────────────┬────────────────────────────────┘
                │
                ▼
┌────────────────────────────────────────────────┐
│  QEMU/KVM Hypervisor                           │
│  ┌──────────────────────────────────────────┐  │
│  │  Lab-Specific VMs (qcow2 images)        │  │
│  │  - lab01: Network Scanning VM           │  │
│  │  - lab02: Web Exploitation VM           │  │
│  │  - lab03: Password Attacks VM           │  │
│  │  - lab04: Wireless Security VM          │  │
│  │  - lab05: Reverse Engineering VM        │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  States: running | paused | stopped            │
└────────────────────────────────────────────────┘
```

**Advantages:**
- ✅ Lab-specific tools pre-installed
- ✅ Custom "Cyyber Linux" branding per lab
- ✅ Resource optimization (pause inactive VMs)
- ✅ Better isolation and performance
- ✅ Persistent storage per VM
- ✅ Professional appearance

## System Components

### 1. VM Builder System

**Purpose**: Automated creation of lab-specific VM images from JSON specifications

**Technology Stack**:
- Packer (HashiCorp) for automated builds
- Cloud-init for provisioning
- QEMU/KVM for virtualization
- Python for orchestration

**Input Format** (JSON):
```json
{
  "lab_id": "lab01",
  "lab_name": "Network Scanning Basics",
  "packages": ["nmap", "net-tools", "wireshark"],
  "motd": "Lab 01: Network Scanning — Cyyber Linux"
}
```

**Output**:
- `cyyber-labs-output/lab01.qcow2` (VM disk image)
- `cyyber-labs-output/lab01.xml` (libvirt domain config)
- `cyyber-labs-output/lab01-metadata.json` (VM info)

### 2. VM Lifecycle Manager

**Purpose**: Manage VM states for resource optimization

**States**:
1. **Stopped**: VM not allocated (0% resources)
2. **Starting**: VM booting (100% CPU, 100% RAM)
3. **Running**: VM active, user connected (100% CPU, 100% RAM)
4. **Idle**: VM running, no user activity (50% CPU, 100% RAM)
5. **Paused**: VM suspended to disk (0% CPU, 0% RAM, disk storage only)

**Lifecycle Flow**:
```
User clicks "Start Lab"
    ↓
[Stopped] → VM domain defined
    ↓
[Starting] → virsh start lab01_user123
    ↓
[Running] → User working in lab
    ↓
Timeout: 10 minutes no activity
    ↓
[Idle] → CPU throttled to 50%
    ↓
Timeout: 20 minutes no activity
    ↓
[Paused] → virsh suspend lab01_user123
    ↓
User clicks "Resume Lab"
    ↓
[Running] → virsh resume lab01_user123
```

**Resource Savings**:
- 20 active labs running: **80GB RAM, 40 vCPUs**
- With auto-pause (10 min idle): **~20GB RAM, 10 vCPUs** (75% savings!)

### 3. Branding System

**Assets Required**:
1. **Logo**: `/usr/share/pixmaps/cyyber-logo.png`
2. **Wallpaper**: `/usr/share/backgrounds/cyyber-wallpaper.jpg`
3. **Boot Logo**: `/boot/grub/themes/cyyber/splash.png`
4. **MOTD**: `/etc/motd` (Lab-specific welcome message)

**Implementation**:
```bash
# During VM build:
- Install logo → Desktop + login screen
- Set wallpaper → XFCE4/GNOME settings
- Configure GRUB theme → /etc/default/grub
- Customize MOTD → Lab name + instructions
- Hostname → cyyber-lab-{lab_id}
```

### 4. Backend API Extensions

**New Endpoints**:
```python
POST   /vm/start/{lab_id}        # Start or resume VM
POST   /vm/stop/{lab_id}         # Stop VM
POST   /vm/pause/{lab_id}        # Pause VM (save resources)
POST   /vm/resume/{lab_id}       # Resume from pause
GET    /vm/status/{lab_id}       # Get VM state
GET    /vm/stats/{lab_id}        # Resource usage stats
GET    /vm/list                  # List user's VMs
DELETE /vm/cleanup               # Admin: cleanup inactive VMs
```

**Activity Monitoring**:
- Track VNC connections (user active if connected)
- Monitor keyboard/mouse events via VNC
- Auto-pause after 10 min inactivity
- Auto-stop after 30 min inactivity

### 5. Storage Architecture

**Directory Structure**:
```
/var/lib/libvirt/images/cyyber-labs/
├── base-images/              # Golden images (read-only)
│   ├── lab01-base.qcow2
│   ├── lab02-base.qcow2
│   ├── lab03-base.qcow2
│   ├── lab04-base.qcow2
│   └── lab05-base.qcow2
│
└── user-instances/           # User-specific instances (COW)
    ├── lab01_user_1.qcow2    # Backed by lab01-base.qcow2
    ├── lab01_user_3.qcow2
    ├── lab02_user_2.qcow2
    └── ...
```

**Copy-on-Write (COW) Strategy**:
- Base image: 20GB (shared, read-only)
- User instance: Only stores deltas (typically 1-3GB)
- Benefits: Fast VM creation, storage efficiency

**Capacity Planning**:
- Base images: 5 labs × 20GB = **100GB**
- User instances: 50 users × 3GB avg = **150GB**
- Total: **250GB** (vs 1TB for full copies!)

## Technical Implementation Details

### Phase 1: VM Builder Setup

**1.1 Install Dependencies**:
```bash
apt-get update
apt-get install -y \
    qemu-kvm \
    libvirt-daemon-system \
    libvirt-clients \
    virtinst \
    virt-manager \
    packer \
    cloud-image-utils
```

**1.2 Create Packer Template**:
```hcl
# cyyber-vm-template.pkr.hcl
source "qemu" "cyyber-ubuntu" {
  iso_url      = "https://cloud-images.ubuntu.com/releases/24.04/release/ubuntu-24.04-server-cloudimg-amd64.img"
  iso_checksum = "sha256:..."

  disk_size    = "20G"
  format       = "qcow2"
  memory       = 4096
  cpus         = 2

  ssh_username = "student"
  ssh_password = "labpass"

  output_directory = "cyyber-labs-output"
  vm_name         = "{{user `lab_id`}}"
}

build {
  sources = ["source.qemu.cyyber-ubuntu"]

  provisioner "shell" {
    inline = [
      "sudo apt-get update",
      "sudo apt-get install -y {{user `packages`}}",
      "echo '{{user `motd`}}' | sudo tee /etc/motd",
      "sudo hostnamectl set-hostname cyyber-{{user `lab_id`}}"
    ]
  }

  provisioner "file" {
    source      = "branding/logo.png"
    destination = "/tmp/logo.png"
  }

  provisioner "shell" {
    inline = [
      "sudo mv /tmp/logo.png /usr/share/pixmaps/cyyber-logo.png",
      "sudo apt-get clean"
    ]
  }
}
```

**1.3 Build Script** (`build-vm.py`):
```python
#!/usr/bin/env python3
import json
import subprocess
import sys

def build_vm(lab_config):
    """Build a VM from lab configuration"""
    cmd = [
        "packer", "build",
        "-var", f"lab_id={lab_config['lab_id']}",
        "-var", f"packages={' '.join(lab_config['packages'])}",
        "-var", f"motd={lab_config['motd']}",
        "cyyber-vm-template.pkr.hcl"
    ]

    print(f"Building VM for {lab_config['lab_name']}...")
    subprocess.run(cmd, check=True)
    print(f"✓ Built: {lab_config['lab_id']}.qcow2")

if __name__ == "__main__":
    with open("labs-config.json") as f:
        config = json.load(f)

    for lab in config["labs"]:
        build_vm(lab)
```

### Phase 2: Backend Integration

**2.1 Install libvirt Python Bindings**:
```bash
pip install libvirt-python
```

**2.2 VM Manager Module** (`backend/app/utils/vm_manager.py`):
```python
import libvirt
import logging

class CyyberVMManager:
    def __init__(self):
        self.conn = libvirt.open('qemu:///system')

    def create_user_vm(self, lab_id, user_id):
        """Create user-specific VM from base image"""
        base_img = f"/var/lib/libvirt/images/cyyber-labs/base-images/{lab_id}-base.qcow2"
        user_img = f"/var/lib/libvirt/images/cyyber-labs/user-instances/{lab_id}_user_{user_id}.qcow2"

        # Create COW backing file
        subprocess.run([
            "qemu-img", "create",
            "-f", "qcow2",
            "-F", "qcow2",
            "-b", base_img,
            user_img
        ])

        # Define VM domain
        domain_xml = self._generate_domain_xml(lab_id, user_id, user_img)
        domain = self.conn.defineXML(domain_xml)

        return domain

    def start_vm(self, lab_id, user_id):
        """Start a VM"""
        domain_name = f"{lab_id}_user_{user_id}"

        try:
            domain = self.conn.lookupByName(domain_name)
        except libvirt.libvirtError:
            # VM doesn't exist, create it
            domain = self.create_user_vm(lab_id, user_id)

        if domain.state()[0] == libvirt.VIR_DOMAIN_SHUTOFF:
            domain.create()
        elif domain.state()[0] == libvirt.VIR_DOMAIN_PAUSED:
            domain.resume()

        return self._get_vnc_port(domain)

    def pause_vm(self, lab_id, user_id):
        """Pause VM to save resources"""
        domain_name = f"{lab_id}_user_{user_id}"
        domain = self.conn.lookupByName(domain_name)
        domain.suspend()

    def stop_vm(self, lab_id, user_id):
        """Stop VM"""
        domain_name = f"{lab_id}_user_{user_id}"
        domain = self.conn.lookupByName(domain_name)
        domain.destroy()  # Force stop

    def get_vm_stats(self, lab_id, user_id):
        """Get resource usage"""
        domain_name = f"{lab_id}_user_{user_id}"
        domain = self.conn.lookupByName(domain_name)

        info = domain.info()
        return {
            "state": self._state_to_string(info[0]),
            "memory_used_mb": info[1] / 1024,
            "cpu_time": info[4],
            "cpu_count": info[3]
        }

    def _generate_domain_xml(self, lab_id, user_id, disk_path):
        """Generate libvirt domain XML"""
        vnc_port = 5900 + (user_id * 10) + int(lab_id.split("lab")[1]) if "lab" in lab_id else 5900

        return f"""
        <domain type='kvm'>
          <name>{lab_id}_user_{user_id}</name>
          <memory unit='MiB'>2048</memory>
          <vcpu>2</vcpu>
          <os>
            <type arch='x86_64' machine='pc'>hvm</type>
            <boot dev='hd'/>
          </os>
          <devices>
            <disk type='file' device='disk'>
              <driver name='qemu' type='qcow2'/>
              <source file='{disk_path}'/>
              <target dev='vda' bus='virtio'/>
            </disk>
            <graphics type='vnc' port='{vnc_port}' autoport='no' listen='0.0.0.0'/>
            <interface type='network'>
              <source network='default'/>
              <model type='virtio'/>
            </interface>
          </devices>
        </domain>
        """

    def _state_to_string(self, state):
        states = {
            libvirt.VIR_DOMAIN_RUNNING: "running",
            libvirt.VIR_DOMAIN_PAUSED: "paused",
            libvirt.VIR_DOMAIN_SHUTOFF: "stopped",
            libvirt.VIR_DOMAIN_SHUTDOWN: "shutting_down"
        }
        return states.get(state, "unknown")

    def _get_vnc_port(self, domain):
        """Extract VNC port from domain XML"""
        xml = domain.XMLDesc()
        # Parse XML and extract VNC port
        import xml.etree.ElementTree as ET
        root = ET.fromstring(xml)
        graphics = root.find(".//graphics[@type='vnc']")
        return int(graphics.get('port'))
```

**2.3 Updated VM Router** (`backend/app/routers/vm_v2.py`):
```python
from fastapi import APIRouter, Depends
from ..utils.vm_manager import CyyberVMManager
from ..utils.auth import get_current_user

router = APIRouter(prefix="/vm/v2", tags=["vm-v2"])
vm_manager = CyyberVMManager()

@router.post("/start/{lab_id}")
def start_vm(lab_id: str, current_user = Depends(get_current_user)):
    """Start or resume lab VM"""
    vnc_port = vm_manager.start_vm(lab_id, current_user.id)

    return {
        "status": "started",
        "lab_id": lab_id,
        "vnc_port": vnc_port,
        "novnc_port": vnc_port + 1000,  # noVNC proxy on port+1000
        "message": f"Cyyber Linux VM for {lab_id} is ready"
    }

@router.post("/pause/{lab_id}")
def pause_vm(lab_id: str, current_user = Depends(get_current_user)):
    """Pause VM to save resources"""
    vm_manager.pause_vm(lab_id, current_user.id)
    return {"status": "paused", "message": "VM paused successfully"}

@router.get("/stats/{lab_id}")
def get_stats(lab_id: str, current_user = Depends(get_current_user)):
    """Get VM resource usage"""
    stats = vm_manager.get_vm_stats(lab_id, current_user.id)
    return stats
```

### Phase 3: Resource Optimization

**3.1 Activity Monitor** (`backend/app/utils/activity_monitor.py`):
```python
import asyncio
from datetime import datetime, timedelta

class VMActivityMonitor:
    def __init__(self, vm_manager):
        self.vm_manager = vm_manager
        self.last_activity = {}  # {(user_id, lab_id): timestamp}

    def record_activity(self, user_id, lab_id):
        """Record user activity"""
        self.last_activity[(user_id, lab_id)] = datetime.now()

    async def monitor_loop(self):
        """Background task to auto-pause idle VMs"""
        while True:
            await asyncio.sleep(60)  # Check every minute

            now = datetime.now()
            idle_threshold = timedelta(minutes=10)

            for (user_id, lab_id), last_active in self.last_activity.items():
                idle_time = now - last_active

                if idle_time > idle_threshold:
                    try:
                        self.vm_manager.pause_vm(lab_id, user_id)
                        print(f"Auto-paused {lab_id} for user {user_id} (idle {idle_time})")
                    except Exception as e:
                        print(f"Failed to pause VM: {e}")
```

**3.2 Start Monitor in main.py**:
```python
from fastapi import FastAPI
from .utils.activity_monitor import VMActivityMonitor
from .utils.vm_manager import CyyberVMManager

app = FastAPI()

vm_manager = CyyberVMManager()
activity_monitor = VMActivityMonitor(vm_manager)

@app.on_event("startup")
async def startup():
    asyncio.create_task(activity_monitor.monitor_loop())
```

### Phase 4: Frontend Updates

**4.1 VM Control Panel** (`frontend/src/components/VMControl.jsx`):
```jsx
const VMControl = ({ labId }) => {
  const [vmState, setVmState] = useState('stopped');
  const [stats, setStats] = useState(null);

  const startVM = async () => {
    const res = await axios.post(`${API_URL}/vm/v2/start/${labId}`);
    setVmState('running');
    // Connect to VNC...
  };

  const pauseVM = async () => {
    await axios.post(`${API_URL}/vm/v2/pause/${labId}`);
    setVmState('paused');
  };

  const resumeVM = async () => {
    await axios.post(`${API_URL}/vm/v2/start/${labId}`);
    setVmState('running');
  };

  useEffect(() => {
    // Poll VM stats every 10 seconds
    const interval = setInterval(async () => {
      const res = await axios.get(`${API_URL}/vm/v2/stats/${labId}`);
      setStats(res.data);
    }, 10000);

    return () => clearInterval(interval);
  }, [labId]);

  return (
    <div className="vm-control-panel">
      <h3>Cyyber Linux VM - {labId}</h3>

      <div className="vm-status">
        State: <span className={`status-${vmState}`}>{vmState}</span>
      </div>

      {stats && (
        <div className="vm-stats">
          <p>Memory: {stats.memory_used_mb} MB</p>
          <p>CPUs: {stats.cpu_count}</p>
        </div>
      )}

      <div className="vm-actions">
        {vmState === 'stopped' && (
          <button onClick={startVM}>Start VM</button>
        )}
        {vmState === 'running' && (
          <>
            <button onClick={pauseVM}>Pause (Save Resources)</button>
            <button onClick={stopVM}>Stop</button>
          </>
        )}
        {vmState === 'paused' && (
          <button onClick={resumeVM}>Resume</button>
        )}
      </div>
    </div>
  );
};
```

## Implementation Roadmap

### Week 1: Foundation
- [ ] Install QEMU/KVM on server
- [ ] Set up Packer templates
- [ ] Create branding assets (logo, wallpaper)
- [ ] Build first test VM (lab01)

### Week 2: Backend Development
- [ ] Implement libvirt integration
- [ ] Create VM manager module
- [ ] Add new API endpoints
- [ ] Test VM lifecycle operations

### Week 3: Resource Optimization
- [ ] Implement activity monitoring
- [ ] Add auto-pause logic
- [ ] Create admin dashboard for VM monitoring
- [ ] Performance testing

### Week 4: Build All VMs
- [ ] Build all 5 lab VMs with Packer
- [ ] Configure COW backing files
- [ ] Test multi-user scenarios
- [ ] Documentation

### Week 5: Frontend Integration
- [ ] Update VM control components
- [ ] Add pause/resume buttons
- [ ] Show VM stats in UI
- [ ] User testing

### Week 6: Production Deployment
- [ ] Migration from Docker to QEMU/KVM
- [ ] Data migration (if needed)
- [ ] Performance tuning
- [ ] Go live!

## Performance Benchmarks

### Resource Usage Comparison

**Current Docker System**:
- 20 active labs: 40GB RAM, 20 vCPUs
- No optimization: Always running or terminated
- Storage: 20GB × 20 = 400GB (full copies)

**New QEMU/KVM System**:
- 20 active labs (all running): 40GB RAM, 40 vCPUs
- With auto-pause (50% idle): 20GB RAM, 20 vCPUs (50% savings)
- With auto-pause (75% idle): 10GB RAM, 10 vCPUs (75% savings!)
- Storage: 100GB (base) + 150GB (user deltas) = 250GB (37% savings)

### Cost Savings (50 concurrent users):
- RAM: **$200/month saved** (40GB → 20GB average)
- Storage: **$150/month saved** (1TB → 250GB)
- **Total: $350/month = $4,200/year**

## Security Considerations

1. **Network Isolation**: Each VM on isolated virtual network
2. **Resource Limits**: CPU/RAM caps via libvirt
3. **Snapshot Protection**: Base images read-only
4. **Access Control**: User can only access their own VMs
5. **Auto-Cleanup**: Destroy VMs after 24 hours inactivity

## Monitoring & Observability

**Metrics to Track**:
- VMs per state (running/paused/stopped)
- Average resource usage per VM
- Auto-pause effectiveness (% of VMs paused)
- User activity patterns
- Build times for new VMs

**Alerting**:
- High resource usage (>80% RAM/CPU)
- Failed VM starts
- Disk space warnings (<10% free)

## Conclusion

This custom Cyyber Linux VM system provides:
- ✅ Professional branding
- ✅ Lab-specific tool preinstallation
- ✅ Significant resource optimization (up to 75% savings)
- ✅ Better user experience (faster starts with COW)
- ✅ Scalability (support 100+ concurrent users)

**Next Steps**: Review this architecture, then proceed with Phase 1 implementation.

---

**Document Version**: 1.0
**Date**: 2025-11-24
**Author**: Claude Code
**Status**: Ready for Review
