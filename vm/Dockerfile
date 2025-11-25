FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV USER=student
ENV PASSWORD=student
ENV VNC_PASSWORD=cyberlab
ENV RESOLUTION=1280x720
ENV DISPLAY=:1

# Install base packages
RUN apt-get update && apt-get install -y \
    xfce4 \
    xfce4-goodies \
    x11vnc \
    xvfb \
    novnc \
    websockify \
    supervisor \
    firefox \
    dbus-x11 \
    sudo \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install developer tools
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    python3 \
    python3-pip \
    openssh-client \
    build-essential \
    vim \
    nano \
    net-tools \
    iputils-ping \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install cybersecurity tools
RUN apt-get update && apt-get install -y \
    nmap \
    nikto \
    hydra \
    sqlmap \
    john \
    tcpdump \
    netcat-traditional \
    wireshark \
    tshark \
    aircrack-ng \
    dirb \
    gobuster \
    whatweb \
    wfuzz \
    steghide \
    binwalk \
    exiftool \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Download rockyou wordlist
RUN mkdir -p /usr/share/wordlists && \
    cd /usr/share/wordlists && \
    wget https://github.com/brannondorsey/naive-hashcat/releases/download/data/rockyou.txt -O rockyou.txt 2>/dev/null || echo "rockyou wordlist will be downloaded on first use"

# Create user
RUN useradd -m -s /bin/bash $USER && \
    echo "$USER:$PASSWORD" | chpasswd && \
    usermod -aG sudo $USER && \
    echo "$USER ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Setup VNC password
RUN mkdir -p /home/$USER/.vnc && \
    x11vnc -storepasswd $VNC_PASSWORD /home/$USER/.vnc/passwd && \
    chown -R $USER:$USER /home/$USER/.vnc

# Copy configuration files
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Copy CyberLabs logo for wallpaper
COPY logo.jpeg /usr/share/backgrounds/cyberlabs-logo.jpeg
RUN chmod 644 /usr/share/backgrounds/cyberlabs-logo.jpeg

# Create desktop shortcuts
RUN mkdir -p /home/$USER/Desktop && \
    echo "[Desktop Entry]\nType=Application\nName=Firefox\nExec=firefox\nIcon=firefox" > /home/$USER/Desktop/firefox.desktop && \
    echo "[Desktop Entry]\nType=Application\nName=Terminal\nExec=xfce4-terminal\nIcon=utilities-terminal" > /home/$USER/Desktop/terminal.desktop && \
    chmod +x /home/$USER/Desktop/*.desktop && \
    chown -R $USER:$USER /home/$USER/Desktop

# Set CyberLabs logo as desktop wallpaper for XFCE
RUN mkdir -p /home/$USER/.config/xfce4/xfconf/xfce-perchannel-xml && \
    echo '<?xml version="1.0" encoding="UTF-8"?>\n\
<channel name="xfce4-desktop" version="1.0">\n\
  <property name="backdrop" type="empty">\n\
    <property name="screen0" type="empty">\n\
      <property name="monitorVNC-0" type="empty">\n\
        <property name="workspace0" type="empty">\n\
          <property name="color-style" type="int" value="0"/>\n\
          <property name="image-style" type="int" value="5"/>\n\
          <property name="last-image" type="string" value="/usr/share/backgrounds/cyberlabs-logo.jpeg"/>\n\
        </property>\n\
      </property>\n\
    </property>\n\
  </property>\n\
</channel>' > /home/$USER/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-desktop.xml

# Set proper permissions
RUN chown -R $USER:$USER /home/$USER

EXPOSE 6080 5901

CMD ["/start.sh"]
