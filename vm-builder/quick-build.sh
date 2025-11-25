#!/bin/bash
set -e

echo "⚡ CYYBER LINUX - RAPID VM BUILDER"
echo "=================================="
echo ""
echo "Strategy: Convert existing Docker VM to QEMU/KVM base image"
echo ""

OUTPUT_DIR="/var/lib/libvirt/images/cyyber-labs"
mkdir -p "$OUTPUT_DIR/base-images"

# Download minimal Ubuntu cloud image
BASE_IMG="$OUTPUT_DIR/ubuntu-24.04-minimal.qcow2"

if [ ! -f "$BASE_IMG" ]; then
    echo "📥 Downloading Ubuntu 24.04 minimal cloud image..."
    wget -q --show-progress \
        https://cloud-images.ubuntu.com/minimal/releases/noble/release/ubuntu-24.04-minimal-cloudimg-amd64.img \
        -O "$BASE_IMG"

    # Resize to 15GB (smaller = faster)
    qemu-img resize "$BASE_IMG" 15G
    echo "✅ Base image ready: $(du -h $BASE_IMG | cut -f1)"
fi

# Function to create a customized VM quickly
create_lab_vm() {
    local LAB_ID=$1
    local LAB_NAME=$2
    local TOOLS=$3

    echo ""
    echo "🔧 Creating: $LAB_NAME"
    echo "─────────────────────────────────────"

    local OUTPUT="$OUTPUT_DIR/base-images/${LAB_ID}.qcow2"

    # Create copy-on-write image
    qemu-img create -f qcow2 -F qcow2 -b "$BASE_IMG" "$OUTPUT"

    # Create cloud-init user-data
    cat > "/tmp/${LAB_ID}-user-data.yaml" <<EOF
#cloud-config
hostname: cyyber-${LAB_ID}
fqdn: cyyber-${LAB_ID}.local

users:
  - name: student
    sudo: ALL=(ALL) NOPASSWD:ALL
    shell: /bin/bash
    plain_text_passwd: labpass
    lock_passwd: false

timezone: Asia/Kolkata

packages:
  - xfce4
  - xfce4-terminal
  - tigervnc-standalone-server
  - novnc
  - supervisor
  - firefox
  - nano
  - vim
  - git
  - net-tools
  - iputils-ping
${TOOLS}

write_files:
  - path: /etc/motd
    content: |
      ╔═══════════════════════════════════════════╗
      ║        Cyyber Linux Labs                  ║
      ║   $LAB_NAME
      ╚═══════════════════════════════════════════╝

  - path: /etc/supervisor/conf.d/desktop.conf
    content: |
      [program:xvfb]
      command=/usr/bin/Xvfb :1 -screen 0 1280x720x24
      autorestart=true

      [program:x11vnc]
      command=/usr/bin/x11vnc -display :1 -forever -shared -rfbport 5901 -passwd labpass
      environment=DISPLAY=:1
      autorestart=true

      [program:novnc]
      command=/usr/share/novnc/utils/novnc_proxy --vnc localhost:5901 --listen 6080
      autorestart=true

      [program:xfce4]
      command=/usr/bin/startxfce4
      environment=DISPLAY=:1
      autorestart=true

runcmd:
  - systemctl enable supervisor
  - systemctl start supervisor
  - echo "DISPLAY=:1" >> /etc/environment

power_state:
  mode: reboot
  message: Cloud-init setup complete
  timeout: 60
EOF

    # Create meta-data
    cat > "/tmp/${LAB_ID}-meta-data" <<EOF
instance-id: ${LAB_ID}-base
local-hostname: cyyber-${LAB_ID}
EOF

    # Generate cloud-init ISO
    genisoimage -quiet -output "/tmp/${LAB_ID}-seed.iso" \
        -volid cidata -joliet -rock \
        "/tmp/${LAB_ID}-user-data.yaml" "/tmp/${LAB_ID}-meta-data"

    echo "  🚀 Provisioning VM..."

    # Launch VM for provisioning
    virt-install \
        --name "cyyber-${LAB_ID}-build" \
        --memory 2048 \
        --vcpus 2 \
        --disk "$OUTPUT",format=qcow2,bus=virtio \
        --disk "/tmp/${LAB_ID}-seed.iso",device=cdrom \
        --os-variant ubuntu24.04 \
        --network network=default,model=virtio \
        --graphics none \
        --console pty,target_type=serial \
        --noautoconsole \
        --import &

    # Wait for cloud-init to complete
    echo "  ⏳ Installing packages (2-3 minutes)..."
    sleep 120  # Give time for apt update + package install

    # Wait for reboot signal
    sleep 60

    # Shutdown build VM
    echo "  🛑 Finalizing..."
    virsh shutdown "cyyber-${LAB_ID}-build" 2>/dev/null || true
    sleep 10
    virsh destroy "cyyber-${LAB_ID}-build" 2>/dev/null || true
    sleep 5
    virsh undefine "cyyber-${LAB_ID}-build" --remove-all-storage 2>/dev/null || true

    # Cleanup
    rm -f "/tmp/${LAB_ID}-seed.iso" "/tmp/${LAB_ID}-user-data.yaml" "/tmp/${LAB_ID}-meta-data"

    # Commit changes to base image (no more COW)
    echo "  📦 Committing changes..."
    qemu-img commit "$OUTPUT"
    qemu-img create -f qcow2 "$OUTPUT.final" 15G
    virt-resize --expand /dev/sda1 "$OUTPUT" "$OUTPUT.final" >/dev/null 2>&1 || cp "$OUTPUT" "$OUTPUT.final"
    mv "$OUTPUT.final" "$OUTPUT"

    local SIZE=$(du -h "$OUTPUT" | cut -f1)
    echo "  ✅ Complete! Size: $SIZE"
}

# Build Lab 1: Network Scanning
create_lab_vm \
    "lab_network_scanning" \
    "Network Scanning Basics" \
    "  - nmap
  - tcpdump
  - netcat-openbsd
  - dnsutils
  - traceroute
  - masscan"

# Build Lab 2: Web Reconnaissance
create_lab_vm \
    "lab_web_recon" \
    "Web Reconnaissance" \
    "  - curl
  - wget
  - nikto
  - dirb
  - whatweb
  - python3-requests
  - python3-bs4"

echo ""
echo "🎉 CYYBER LINUX VMS READY!"
echo "=========================="
echo ""
ls -lh "$OUTPUT_DIR/base-images/"
echo ""
echo "✅ 2 custom-branded lab VMs created successfully!"
