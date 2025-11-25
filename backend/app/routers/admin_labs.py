from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import User, Lab, LabTool, LabFile, VMConfiguration, Course, CourseLab
from ..utils.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/admin/labs", tags=["admin-labs"])

# ========== Pydantic Schemas ==========

class LabToolCreate(BaseModel):
    tool_name: str
    tool_version: Optional[str] = None
    install_command: Optional[str] = None
    description: Optional[str] = None
    is_preinstalled: bool = True

class LabToolResponse(LabToolCreate):
    id: int
    lab_id: str
    
    class Config:
        from_attributes = True

class VMConfigCreate(BaseModel):
    cpu_limit: str = "50%"
    ram_limit: str = "2g"
    disk_limit: Optional[str] = None
    network_mode: str = "bridge"
    expose_ports: Optional[dict] = None
    env_vars: Optional[dict] = None
    startup_script: Optional[str] = None
    custom_image: Optional[str] = None

class LabCreate(BaseModel):
    id: str  # lab_steganography, lab_nmap_scanning, etc.
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    difficulty: str = "Basic"
    duration: Optional[str] = None
    semester_level: int = 1
    tasks: Optional[list] = None
    objectives: Optional[list] = None
    tools_required: Optional[list] = None
    vm_enabled: bool = True
    vm_custom_image: Optional[str] = None
    vm_resources: Optional[dict] = None
    vm_preload_files: Optional[list] = None
    is_active: bool = True

class LabUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = None
    duration: Optional[str] = None
    semester_level: Optional[int] = None
    tasks: Optional[list] = None
    objectives: Optional[list] = None
    tools_required: Optional[list] = None
    vm_enabled: Optional[bool] = None
    vm_custom_image: Optional[str] = None
    vm_resources: Optional[dict] = None
    vm_preload_files: Optional[list] = None
    is_active: Optional[bool] = None

class LabResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    category: Optional[str]
    difficulty: str
    duration: Optional[str]
    semester_level: int
    tasks: Optional[list]
    objectives: Optional[list]
    tools_required: Optional[list]
    vm_enabled: bool
    vm_custom_image: Optional[str]
    vm_resources: Optional[dict]
    vm_preload_files: Optional[list]
    is_active: bool
    
    class Config:
        from_attributes = True

# ========== Helper Functions ==========

def check_admin(current_user: User):
    """Verify user is admin"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

# ========== Lab Management Endpoints ==========

@router.get("/")
def get_all_labs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    include_inactive: bool = False,
    page: int = 1,
    per_page: int = 10,
    search: Optional[str] = None,
    category: Optional[str] = None,
    difficulty: Optional[str] = None
):
    """Get all labs with pagination (admin only)"""
    check_admin(current_user)

    # Base query
    query = db.query(Lab)

    # Filter inactive
    if not include_inactive:
        query = query.filter(Lab.is_active == True)

    # Search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Lab.title.ilike(search_term)) |
            (Lab.description.ilike(search_term)) |
            (Lab.id.ilike(search_term))
        )

    # Category filter
    if category:
        query = query.filter(Lab.category == category)

    # Difficulty filter
    if difficulty:
        query = query.filter(Lab.difficulty == difficulty)

    # Get total count
    total = query.count()

    # Apply pagination
    offset = (page - 1) * per_page
    labs = query.order_by(Lab.id.desc()).offset(offset).limit(per_page).all()

    # Calculate pagination metadata
    total_pages = (total + per_page - 1) // per_page

    return {
        "labs": labs,
        "pagination": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }
    }

@router.post("/", response_model=LabResponse, status_code=status.HTTP_201_CREATED)
def create_lab(
    lab_data: LabCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new lab (admin only)"""
    check_admin(current_user)
    
    # Check if lab ID already exists
    existing = db.query(Lab).filter(Lab.id == lab_data.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Lab with ID '{lab_data.id}' already exists"
        )
    
    # Create lab
    new_lab = Lab(**lab_data.dict())
    db.add(new_lab)
    db.commit()
    db.refresh(new_lab)
    
    return new_lab

@router.get("/{lab_id}", response_model=LabResponse)
def get_lab(
    lab_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get lab details (admin only)"""
    check_admin(current_user)
    
    lab = db.query(Lab).filter(Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lab '{lab_id}' not found"
        )
    
    return lab

@router.put("/{lab_id}", response_model=LabResponse)
def update_lab(
    lab_id: str,
    lab_data: LabUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update lab (admin only)"""
    check_admin(current_user)
    
    lab = db.query(Lab).filter(Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lab '{lab_id}' not found"
        )
    
    # Update only provided fields
    update_data = lab_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lab, field, value)
    
    db.commit()
    db.refresh(lab)
    
    return lab

@router.delete("/{lab_id}")
def delete_lab(
    lab_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete lab (admin only)"""
    check_admin(current_user)
    
    lab = db.query(Lab).filter(Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lab '{lab_id}' not found"
        )
    
    db.delete(lab)
    db.commit()
    
    return {"message": f"Lab '{lab_id}' deleted successfully"}

# ========== Lab Tools Management ==========

@router.get("/{lab_id}/tools", response_model=List[LabToolResponse])
def get_lab_tools(
    lab_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get tools for a specific lab"""
    check_admin(current_user)
    
    tools = db.query(LabTool).filter(LabTool.lab_id == lab_id).all()
    return tools

@router.post("/{lab_id}/tools", response_model=LabToolResponse, status_code=status.HTTP_201_CREATED)
def add_lab_tool(
    lab_id: str,
    tool_data: LabToolCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a tool to a lab"""
    check_admin(current_user)
    
    # Verify lab exists
    lab = db.query(Lab).filter(Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lab '{lab_id}' not found"
        )
    
    # Create tool
    new_tool = LabTool(lab_id=lab_id, **tool_data.dict())
    db.add(new_tool)
    db.commit()
    db.refresh(new_tool)
    
    return new_tool

@router.delete("/{lab_id}/tools/{tool_id}")
def delete_lab_tool(
    lab_id: str,
    tool_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a tool from a lab"""
    check_admin(current_user)
    
    tool = db.query(LabTool).filter(
        LabTool.id == tool_id,
        LabTool.lab_id == lab_id
    ).first()
    
    if not tool:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tool not found"
        )
    
    db.delete(tool)
    db.commit()
    
    return {"message": "Tool deleted successfully"}

# ========== VM Configuration Management ==========

@router.get("/{lab_id}/vm-config")
def get_vm_config(
    lab_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get VM configuration for a lab"""
    check_admin(current_user)
    
    config = db.query(VMConfiguration).filter(
        VMConfiguration.lab_id == lab_id
    ).first()
    
    return config or {"message": "No custom VM configuration"}

@router.post("/{lab_id}/vm-config")
def set_vm_config(
    lab_id: str,
    config_data: VMConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Set VM configuration for a lab"""
    check_admin(current_user)
    
    # Verify lab exists
    lab = db.query(Lab).filter(Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lab '{lab_id}' not found"
        )
    
    # Check if config exists
    config = db.query(VMConfiguration).filter(
        VMConfiguration.lab_id == lab_id
    ).first()
    
    if config:
        # Update existing
        for field, value in config_data.dict().items():
            setattr(config, field, value)
    else:
        # Create new
        config = VMConfiguration(lab_id=lab_id, **config_data.dict())
        db.add(config)
    
    db.commit()
    db.refresh(config)
    
    return config

# ========== Course-Lab Association ==========

@router.post("/assign-to-course")
def assign_lab_to_course(
    lab_id: str,
    course_id: int,
    order: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Assign a lab to a course"""
    check_admin(current_user)
    
    # Verify course and lab exist
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    lab = db.query(Lab).filter(Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    # Check if already assigned
    existing = db.query(CourseLab).filter(
        CourseLab.course_id == course_id,
        CourseLab.lab_id == lab_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Lab already assigned to this course"
        )
    
    # Create association
    association = CourseLab(
        course_id=course_id,
        lab_id=lab_id,
        order=order
    )
    db.add(association)
    db.commit()
    
    return {"message": "Lab assigned to course successfully"}

@router.delete("/unassign-from-course")
def unassign_lab_from_course(
    lab_id: str,
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove lab from course"""
    check_admin(current_user)
    
    association = db.query(CourseLab).filter(
        CourseLab.course_id == course_id,
        CourseLab.lab_id == lab_id
    ).first()
    
    if not association:
        raise HTTPException(
            status_code=404,
            detail="Lab not assigned to this course"
        )
    
    db.delete(association)
    db.commit()
    
    return {"message": "Lab unassigned from course successfully"}

