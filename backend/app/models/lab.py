from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class Lab(Base):
    """Lab/Exercise table - stores all lab information"""
    __tablename__ = "labs"
    
    id = Column(String, primary_key=True)  # lab_steganography, lab_nmap_scanning, etc.
    title = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String)  # Network Security, Web Security, etc.
    difficulty = Column(String)  # Basic, Intermediate, Advanced
    duration = Column(String)  # "2 hours", "45 min", etc.
    semester_level = Column(Integer, default=1)
    
    # Lab content (JSON structure)
    tasks = Column(JSON)  # List of tasks/steps
    objectives = Column(JSON)  # Learning objectives
    tools_required = Column(JSON)  # List of tools needed
    
    # Terminal/VM Configuration
    terminal_type = Column(String, default="vm")  # "none", "simple", "vm" - none=no terminal, simple=basic terminal, vm=full VM
    vm_enabled = Column(Boolean, default=True)  # Kept for backward compatibility
    vm_custom_image = Column(String, nullable=True)  # Custom Docker image if needed
    vm_resources = Column(JSON, nullable=True)  # {"cpu": "50%", "ram": "2g"}
    vm_preload_files = Column(JSON, nullable=True)  # Files to add to VM
    
    # Status
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    tools = relationship("LabTool", back_populates="lab", cascade="all, delete-orphan")
    progress = relationship("LabProgress", back_populates="lab")
    course_associations = relationship("CourseLab", back_populates="lab")


class LabTool(Base):
    """Tools/Software available in each lab"""
    __tablename__ = "lab_tools"
    
    id = Column(Integer, primary_key=True, index=True)
    lab_id = Column(String, ForeignKey("labs.id"))
    
    tool_name = Column(String, nullable=False)  # nmap, wireshark, john, etc.
    tool_version = Column(String, nullable=True)
    install_command = Column(Text, nullable=True)  # apt install nmap, etc.
    description = Column(Text)
    is_preinstalled = Column(Boolean, default=True)
    
    lab = relationship("Lab", back_populates="tools")


class LabFile(Base):
    """Files/Resources to be preloaded in lab VMs"""
    __tablename__ = "lab_files"
    
    id = Column(Integer, primary_key=True, index=True)
    lab_id = Column(String, ForeignKey("labs.id"))
    
    filename = Column(String, nullable=False)
    file_path = Column(String)  # Path where file should be placed in VM
    file_url = Column(String, nullable=True)  # URL to download from
    file_content = Column(Text, nullable=True)  # For small text files
    file_type = Column(String)  # image, text, pcap, log, etc.
    description = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class VMConfiguration(Base):
    """Custom VM configurations for specific labs"""
    __tablename__ = "vm_configurations"
    
    id = Column(Integer, primary_key=True, index=True)
    lab_id = Column(String, ForeignKey("labs.id"), unique=True)
    
    # Resource limits
    cpu_limit = Column(String, default="50%")
    ram_limit = Column(String, default="2g")
    disk_limit = Column(String, nullable=True)
    
    # Network settings
    network_mode = Column(String, default="bridge")  # bridge, host, none
    expose_ports = Column(JSON, nullable=True)  # Additional ports to expose
    
    # Environment variables
    env_vars = Column(JSON, nullable=True)
    
    # Custom startup script
    startup_script = Column(Text, nullable=True)
    
    # Docker image override
    custom_image = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


