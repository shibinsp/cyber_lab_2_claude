#!/bin/bash

# Set defaults
export USER=${USER:-admin}
export PASSWORD=${PASSWORD:-student}
export VNC_PASSWORD="cyberlab"
export RESOLUTION=${RESOLUTION:-1280x720}

echo "Starting VM for user: $USER"

# Create user if it doesn't exist
if ! id "$USER" &>/dev/null; then
    echo "Creating user: $USER"
    useradd -m -s /bin/bash -G sudo "$USER"
    echo "$USER:$PASSWORD" | chpasswd
    
    # Create Desktop
    mkdir -p /home/$USER/Desktop
    echo "[Desktop Entry]
Type=Application
Name=Firefox
Exec=firefox
Icon=firefox" > /home/$USER/Desktop/firefox.desktop
    
    echo "[Desktop Entry]
Type=Application
Name=Terminal
Exec=xfce4-terminal
Icon=utilities-terminal" > /home/$USER/Desktop/terminal.desktop
    
    chmod +x /home/$USER/Desktop/*.desktop
    
    # Set CyberLabs wallpaper for this user
    mkdir -p /home/$USER/.config/xfce4/xfconf/xfce-perchannel-xml
    cat > /home/$USER/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-desktop.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<channel name="xfce4-desktop" version="1.0">
  <property name="backdrop" type="empty">
    <property name="screen0" type="empty">
      <property name="monitorVNC-0" type="empty">
        <property name="workspace0" type="empty">
          <property name="color-style" type="int" value="0"/>
          <property name="image-style" type="int" value="5"/>
          <property name="last-image" type="string" value="/usr/share/backgrounds/cyberlabs-logo.jpeg"/>
        </property>
      </property>
      <property name="monitor0" type="empty">
        <property name="workspace0" type="empty">
          <property name="color-style" type="int" value="0"/>
          <property name="image-style" type="int" value="5"/>
          <property name="last-image" type="string" value="/usr/share/backgrounds/cyberlabs-logo.jpeg"/>
        </property>
      </property>
    </property>
  </property>
</channel>
EOF
fi

# Set up VNC password directory
mkdir -p /home/$USER/.vnc

# Create VNC password file using x11vnc's method
# This creates the password "cyberlab" for VNC access
echo "$VNC_PASSWORD" | x11vnc -storepasswd /home/$USER/.vnc/passwd 2>/dev/null || \
    echo "cyberlab" > /home/$USER/.vnc/passwd

chmod 600 /home/$USER/.vnc/passwd

# Ensure proper permissions
chown -R $USER:$USER /home/$USER 2>/dev/null || true

# Export for supervisor
export USER
export RESOLUTION
export VNC_PASSWORD

# Start supervisor
echo "Starting supervisor..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
