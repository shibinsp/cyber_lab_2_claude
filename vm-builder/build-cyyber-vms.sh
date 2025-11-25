#!/bin/bash
set -e

echo "🚀 Cyyber Linux VM Builder - FAST Mode"
echo "======================================"

# Configuration
BASE_IMAGE_URL="https://cloud-images.ubuntu.com/noble/current/noble-server-cloudimg-amd64.img"
OUTPUT_DIR="/var/lib/libvirt/images/cyyber-labs"
TEMP_DIR="/tmp/cyyber-vm-build"

# Create directories
mkdir -p "$OUTPUT_DIR/base-images"
mkdir -p "$OUTPUT_DIR/user-instances"
mkdir -p "$TEMP_DIR"

# Download Ubuntu cloud image if not exists
BASE_IMAGE="$TEMP_DIR/ubuntu-24.04-base.img"
if [ ! -f "$BASE_IMAGE" ]; then
    echo "📥 Downloading Ubuntu 24.04 cloud image..."
    wget -q --show-progress "$BASE_IMAGE_URL" -O "$BASE_IMAGE"
    echo "✅ Base image downloaded"
else
    echo "✅ Base image already exists"
fi

# Function to build a lab VM
build_lab_vm() {
    local LAB_ID=$1
    local LAB_NAME=$2
    local PACKAGES=$3
    local MOTD=$4

    echo ""
    echo "🔧 Building: $LAB_NAME ($LAB_ID)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Output file
    local OUTPUT_IMAGE="$OUTPUT_DIR/base-images/${LAB_ID}.qcow2"

    # Copy base image
    echo "  📦 Creating VM disk..."
    cp "$BASE_IMAGE" "$OUTPUT_IMAGE"

    # Resize to 20GB
    qemu-img resize "$OUTPUT_IMAGE" 20G

    # Create cloud-init config
    local CLOUD_INIT_DIR="$TEMP_DIR/${LAB_ID}-cloud-init"
    mkdir -p "$CLOUD_INIT_DIR"

    # Meta-data
    cat > "$CLOUD_INIT_DIR/meta-data" <<EOF
instance-id: ${LAB_ID}-001
local-hostname: cyyber-${LAB_ID}
EOF

    # User-data with packages and branding
    cat > "$CLOUD_INIT_DIR/user-data" <<'EOF'
#cloud-config
users:
  - name: student
    sudo: ALL=(ALL) NOPASSWD:ALL
    shell: /bin/bash
    lock_passwd: false
    passwd: $6$rounds=4096$saltsalt$YhAjNr5Z8Z9.lQGw5BzXKv5j2qZJx0qKq4YQz8yZvZQqZ7Z8Z9.lQGw5BzXKv5j2qZJx0qKq4YQz8yZvZQ

timezone: Asia/Kolkata

package_update: true
package_upgrade: false

packages:
EOF

    # Add packages
    for pkg in $PACKAGES; do
        echo "  - $pkg" >> "$CLOUD_INIT_DIR/user-data"
    done

    # Add additional packages for VNC
    cat >> "$CLOUD_INIT_DIR/user-data" <<'EOF'
  - xfce4
  - xfce4-terminal
  - tigervnc-standalone-server
  - tigervnc-common
  - novnc
  - supervisor
  - firefox
  - nano
  - vim
  - git

runcmd:
  - systemctl enable supervisor
  - systemctl start supervisor
EOF

    # Add MOTD
    echo "  - echo '$MOTD' > /etc/motd" >> "$CLOUD_INIT_DIR/user-data"

    # Add Cyyber branding
    cat >> "$CLOUD_INIT_DIR/user-data" <<'EOF'
  - mkdir -p /usr/share/pixmaps
  - mkdir -p /usr/share/backgrounds
  - echo "Cyyber Linux" > /etc/hostname

write_files:
  - path: /etc/supervisor/conf.d/vnc.conf
    content: |
      [program:xvfb]
      command=/usr/bin/Xvfb :1 -screen 0 1280x720x24
      autorestart=true

      [program:vnc]
      command=/usr/bin/x11vnc -display :1 -forever -shared -rfbport 5901 -passwd labpass
      environment=DISPLAY=:1
      autorestart=true

      [program:novnc]
      command=/usr/share/novnc/utils/novnc_proxy --vnc localhost:5901 --listen 6080
      autorestart=true

      [program:xfce]
      command=/usr/bin/startxfce4
      environment=DISPLAY=:1
      autorestart=true

  - path: /home/student/.bashrc
    append: true
    content: |
      echo ""
      echo "  ╔═══════════════════════════════════════╗"
      echo "  ║   Welcome to Cyyber Linux Labs        ║"
      echo "  ╚═══════════════════════════════════════╝"
      cat /etc/motd
      echo ""

power_state:
  mode: reboot
  timeout: 300
  condition: True
EOF

    # Create cloud-init ISO
    echo "  🌩️  Generating cloud-init ISO..."
    genisoimage -output "$TEMP_DIR/${LAB_ID}-cloud-init.iso" \
        -volid cidata -joliet -rock \
        "$CLOUD_INIT_DIR/user-data" "$CLOUD_INIT_DIR/meta-data" 2>/dev/null

    # Boot VM with cloud-init to provision
    echo "  🚀 Provisioning VM (this takes 3-5 minutes)..."

    # Start VM with cloud-init
    virt-install \
        --name "cyyber-build-${LAB_ID}" \
        --memory 2048 \
        --vcpus 2 \
        --disk "$OUTPUT_IMAGE",format=qcow2 \
        --disk "$TEMP_DIR/${LAB_ID}-cloud-init.iso",device=cdrom \
        --os-variant ubuntu24.04 \
        --network network=default \
        --graphics none \
        --console pty,target_type=serial \
        --noautoconsole \
        --import &

    local VM_PID=$!

    # Wait for VM to finish provisioning (cloud-init reboots when done)
    echo "  ⏳ Waiting for provisioning to complete..."
    sleep 180  # 3 minutes for package installation

    # Shutdown the build VM
    echo "  🛑 Shutting down build VM..."
    virsh shutdown "cyyber-build-${LAB_ID}" 2>/dev/null || true
    sleep 10
    virsh destroy "cyyber-build-${LAB_ID}" 2>/dev/null || true
    virsh undefine "cyyber-build-${LAB_ID}" 2>/dev/null || true

    # Cleanup cloud-init ISO
    rm -f "$TEMP_DIR/${LAB_ID}-cloud-init.iso"
    rm -rf "$CLOUD_INIT_DIR"

    # Compress the image
    echo "  📦 Compressing VM image..."
    qemu-img convert -O qcow2 -c "$OUTPUT_IMAGE" "$OUTPUT_IMAGE.compressed"
    mv "$OUTPUT_IMAGE.compressed" "$OUTPUT_IMAGE"

    # Get image size
    local SIZE=$(du -h "$OUTPUT_IMAGE" | cut -f1)

    echo "  ✅ VM built successfully: $SIZE"
    echo "  📁 Location: $OUTPUT_IMAGE"
}

# Build Lab VMs
echo ""
echo "🏗️  Building 2 Lab VMs..."
echo ""

# Lab 1: Network Scanning
build_lab_vm \
    "lab_network_scanning" \
    "Network Scanning Basics" \
    "nmap net-tools tcpdump netcat-openbsd dnsutils iputils-ping traceroute" \
    "Lab 01: Network Scanning — Cyyber Linux\nLearn nmap and network reconnaissance tools"

# Lab 2: Web Reconnaissance
build_lab_vm \
    "lab_web_recon" \
    "Web Reconnaissance" \
    "curl wget nikto dirb whatweb python3-pip python3-requests" \
    "Lab 02: Web Reconnaissance — Cyyber Linux\nMaster web application scanning and enumeration"

echo ""
echo "🎉 BUILD COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Summary:"
ls -lh "$OUTPUT_DIR/base-images/"
echo ""
echo "✅ Ready to deploy Cyyber Linux VMs!"
