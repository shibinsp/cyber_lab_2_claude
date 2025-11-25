#!/bin/bash
set -e

echo "⚡ CYYBER LINUX - ULTRA-FAST SETUP (Under 5 minutes!)"
echo "======================================================"
echo ""

# Strategy: Use Docker container as base, convert to qcow2, then use with libvirt
# This is 10x faster than building from scratch!

OUTPUT_DIR="/var/lib/libvirt/images/cyyber-labs"
mkdir -p "$OUTPUT_DIR/base-images"
mkdir -p "$OUTPUT_DIR/templates"

echo "Step 1: Export existing Docker VM container to tarball"
echo "─────────────────────────────────────────────────────"

# Check if cyberlab-vm image exists
if ! docker images | grep -q "cyberlab-vm"; then
    echo "❌ Error: cyberlab-vm Docker image not found!"
    echo "   Building it first..."
    cd /root/cyber_lab_2_claude && docker compose build cyberlab-vm
fi

# Create a temporary container to export
echo "📦 Creating temporary container..."
TEMP_CONTAINER=$(docker create cyberlab-vm:latest)

# Export container filesystem
echo "📤 Exporting filesystem (this takes 1-2 minutes)..."
docker export "$TEMP_CONTAINER" -o "/tmp/cyberlab-vm.tar"

# Remove temp container
docker rm "$TEMP_CONTAINER" >/dev/null

# Get size
TAR_SIZE=$(du -h /tmp/cyberlab-vm.tar | cut -f1)
echo "✅ Exported: $TAR_SIZE"

echo ""
echo "Step 2: Convert to qcow2 disk image"
echo "────────────────────────────────────"

# Create empty qcow2 image
DISK_IMG="/tmp/cyberlab-base.qcow2"
echo "💾 Creating 10GB qcow2 image..."
qemu-img create -f qcow2 "$DISK_IMG" 10G >/dev/null

# Mount via NBD to write filesystem
echo "🔧 Setting up NBD device..."
modprobe nbd max_part=8
qemu-nbd --connect=/dev/nbd0 "$DISK_IMG"

# Create partition and filesystem
echo "📝 Creating filesystem..."
(echo o; echo n; echo p; echo 1; echo ; echo ; echo w) | fdisk /dev/nbd0 >/dev/null 2>&1 || true
sleep 2
mkfs.ext4 /dev/nbd0p1 -F -q

# Mount and extract
echo "📂 Extracting files to disk..."
mkdir -p /mnt/cyyber-vm
mount /dev/nbd0p1 /mnt/cyyber-vm
tar -xf /tmp/cyberlab-vm.tar -C /mnt/cyyber-vm

# Install minimal boot files
echo "🥾 Installing bootloader..."
chroot /mnt/cyyber-vm /bin/bash <<'CHROOT_EOF'
apt-get update -qq
apt-get install -y -qq linux-image-generic grub-pc
grub-install /dev/nbd0
update-grub
CHROOT_EOF

# Cleanup mounts
umount /mnt/cyyber-vm
qemu-nbd --disconnect /dev/nbd0
rmmod nbd

echo "✅ Base disk image created"

echo ""
echo "Step 3: Create lab-specific VMs"
echo "────────────────────────────────"

# Function to clone base for each lab
create_lab_clone() {
    local LAB_ID=$1
    local LAB_NAME=$2

    echo "  🔧 Creating $LAB_NAME..."

    local OUTPUT="$OUTPUT_DIR/base-images/${LAB_ID}.qcow2"

    # Clone base image
    qemu-img create -f qcow2 -F qcow2 -b "$DISK_IMG" "$OUTPUT" >/dev/null

    echo "  ✅ $LAB_ID ready"
}

# Create 2 lab VMs
create_lab_clone "lab_network_scanning" "Network Scanning Lab"
create_lab_clone "lab_web_recon" "Web Reconnaissance Lab"

# Move base to templates
mv "$DISK_IMG" "$OUTPUT_DIR/templates/cyberlab-base.qcow2"

# Cleanup
rm -f /tmp/cyberlab-vm.tar

echo ""
echo "🎉 SUCCESS!"
echo "════════════"
echo ""
echo "📊 Created VM Images:"
ls -lh "$OUTPUT_DIR/base-images/"
echo ""
echo "✅ Cyyber Linux VMs ready for deployment!"
