from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid
import shutil
from datetime import datetime
from ..database import get_db
from ..models import User, Course, Lab, CourseModule, CourseContent, CourseResource
from ..utils.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(tags=["admin-content"])

# Upload directory
UPLOAD_DIR = "/app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(f"{UPLOAD_DIR}/videos", exist_ok=True)
os.makedirs(f"{UPLOAD_DIR}/documents", exist_ok=True)
os.makedirs(f"{UPLOAD_DIR}/images", exist_ok=True)

# ========== Pydantic Schemas ==========

class ModuleCreate(BaseModel):
    title: str
    description: Optional[str] = None
    order: int = 0
    is_active: bool = True

class ModuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None

class ContentCreate(BaseModel):
    content_type: str  # video, pdf, document, text, quiz, lab_link
    title: str
    description: Optional[str] = None
    text_content: Optional[str] = None
    linked_lab_id: Optional[str] = None
    quiz_data: Optional[dict] = None
    order: int = 0
    is_required: bool = True
    estimated_duration: Optional[int] = None

class ContentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    text_content: Optional[str] = None
    linked_lab_id: Optional[str] = None
    quiz_data: Optional[dict] = None
    order: Optional[int] = None
    is_required: Optional[bool] = None
    is_active: Optional[bool] = None
    estimated_duration: Optional[int] = None

class ResourceCreate(BaseModel):
    title: str
    description: Optional[str] = None

# ========== Helper Functions ==========

def check_admin(current_user: User):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

def get_file_type(filename: str) -> str:
    ext = filename.lower().split('.')[-1]
    if ext in ['mp4', 'webm', 'mov', 'avi']:
        return 'video'
    elif ext == 'pdf':
        return 'pdf'
    elif ext in ['doc', 'docx', 'txt', 'md']:
        return 'document'
    elif ext in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
        return 'image'
    return 'other'

# ========== Module Endpoints ==========

@router.get("/courses/{course_id}/modules")
def get_course_modules(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all modules for a course with their contents"""
    check_admin(current_user)
    
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    modules = db.query(CourseModule).filter(
        CourseModule.course_id == course_id
    ).order_by(CourseModule.order).all()
    
    result = []
    for module in modules:
        contents = db.query(CourseContent).filter(
            CourseContent.module_id == module.id
        ).order_by(CourseContent.order).all()
        
        result.append({
            "id": module.id,
            "title": module.title,
            "description": module.description,
            "order": module.order,
            "is_active": module.is_active,
            "contents": [{
                "id": c.id,
                "content_type": c.content_type,
                "title": c.title,
                "description": c.description,
                "file_url": c.file_url,
                "file_name": c.file_name,
                "text_content": c.text_content,
                "linked_lab_id": c.linked_lab_id,
                "quiz_data": c.quiz_data,
                "order": c.order,
                "is_required": c.is_required,
                "is_active": c.is_active,
                "estimated_duration": c.estimated_duration
            } for c in contents]
        })
    
    return {"course_id": course_id, "course_title": course.title, "modules": result}

@router.post("/courses/{course_id}/modules")
def create_module(
    course_id: int,
    module_data: ModuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new module in a course"""
    check_admin(current_user)
    
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    module = CourseModule(course_id=course_id, **module_data.dict())
    db.add(module)
    db.commit()
    db.refresh(module)
    
    return {"message": "Module created", "module": {
        "id": module.id,
        "title": module.title,
        "description": module.description,
        "order": module.order
    }}

@router.put("/modules/{module_id}")
def update_module(
    module_id: int,
    module_data: ModuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a module"""
    check_admin(current_user)
    
    module = db.query(CourseModule).filter(CourseModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    for field, value in module_data.dict(exclude_unset=True).items():
        setattr(module, field, value)
    
    db.commit()
    db.refresh(module)
    
    return {"message": "Module updated", "module_id": module.id}

@router.delete("/modules/{module_id}")
def delete_module(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a module and all its contents"""
    check_admin(current_user)
    
    module = db.query(CourseModule).filter(CourseModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    db.delete(module)
    db.commit()
    
    return {"message": "Module deleted"}

# ========== Content Endpoints ==========

@router.post("/modules/{module_id}/contents")
def create_content(
    module_id: int,
    content_data: ContentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create content item in a module"""
    check_admin(current_user)
    
    module = db.query(CourseModule).filter(CourseModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    content = CourseContent(module_id=module_id, **content_data.dict())
    db.add(content)
    db.commit()
    db.refresh(content)
    
    return {"message": "Content created", "content_id": content.id}

@router.put("/contents/{content_id}")
def update_content(
    content_id: int,
    content_data: ContentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update content item"""
    check_admin(current_user)
    
    content = db.query(CourseContent).filter(CourseContent.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    for field, value in content_data.dict(exclude_unset=True).items():
        setattr(content, field, value)
    
    db.commit()
    db.refresh(content)
    
    return {"message": "Content updated", "content_id": content.id}

@router.delete("/contents/{content_id}")
def delete_content(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete content item"""
    check_admin(current_user)
    
    content = db.query(CourseContent).filter(CourseContent.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Delete associated file if exists
    if content.file_url and os.path.exists(content.file_url.replace('/uploads/', UPLOAD_DIR + '/')):
        try:
            os.remove(content.file_url.replace('/uploads/', UPLOAD_DIR + '/'))
        except:
            pass
    
    db.delete(content)
    db.commit()
    
    return {"message": "Content deleted"}

# ========== File Upload Endpoints ==========

@router.post("/upload/video")
async def upload_video(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a video file"""
    check_admin(current_user)
    
    if not file.filename.lower().endswith(('.mp4', '.webm', '.mov', '.avi')):
        raise HTTPException(status_code=400, detail="Invalid video format")
    
    # Generate unique filename
    ext = file.filename.split('.')[-1]
    unique_name = f"{uuid.uuid4()}.{ext}"
    file_path = f"{UPLOAD_DIR}/videos/{unique_name}"
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    file_size = os.path.getsize(file_path)
    
    return {
        "file_url": f"/uploads/videos/{unique_name}",
        "file_name": file.filename,
        "file_size": file_size,
        "content_type": "video"
    }

@router.post("/upload/document")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a document (PDF, DOC, etc.)"""
    check_admin(current_user)
    
    allowed = ('.pdf', '.doc', '.docx', '.txt', '.md', '.ppt', '.pptx', '.xls', '.xlsx')
    if not file.filename.lower().endswith(allowed):
        raise HTTPException(status_code=400, detail="Invalid document format")
    
    ext = file.filename.split('.')[-1]
    unique_name = f"{uuid.uuid4()}.{ext}"
    file_path = f"{UPLOAD_DIR}/documents/{unique_name}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    file_size = os.path.getsize(file_path)
    
    return {
        "file_url": f"/uploads/documents/{unique_name}",
        "file_name": file.filename,
        "file_size": file_size,
        "content_type": get_file_type(file.filename)
    }

@router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload an image"""
    check_admin(current_user)
    
    if not file.filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
        raise HTTPException(status_code=400, detail="Invalid image format")
    
    ext = file.filename.split('.')[-1]
    unique_name = f"{uuid.uuid4()}.{ext}"
    file_path = f"{UPLOAD_DIR}/images/{unique_name}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    file_size = os.path.getsize(file_path)
    
    return {
        "file_url": f"/uploads/images/{unique_name}",
        "file_name": file.filename,
        "file_size": file_size,
        "content_type": "image"
    }

# ========== Content with File Upload ==========

@router.post("/modules/{module_id}/upload-content")
async def upload_content_with_file(
    module_id: int,
    title: str = Form(...),
    description: str = Form(None),
    order: int = Form(0),
    is_required: bool = Form(True),
    estimated_duration: int = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload content with file in one request"""
    check_admin(current_user)
    
    module = db.query(CourseModule).filter(CourseModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Determine content type and upload directory
    file_type = get_file_type(file.filename)
    if file_type == 'video':
        upload_subdir = 'videos'
        content_type = 'video'
    elif file_type in ['pdf', 'document']:
        upload_subdir = 'documents'
        content_type = file_type
    elif file_type == 'image':
        upload_subdir = 'images'
        content_type = 'image'
    else:
        upload_subdir = 'documents'
        content_type = 'document'
    
    # Save file
    ext = file.filename.split('.')[-1]
    unique_name = f"{uuid.uuid4()}.{ext}"
    file_path = f"{UPLOAD_DIR}/{upload_subdir}/{unique_name}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    file_size = os.path.getsize(file_path)
    
    # Create content record
    content = CourseContent(
        module_id=module_id,
        content_type=content_type,
        title=title,
        description=description,
        file_url=f"/uploads/{upload_subdir}/{unique_name}",
        file_name=file.filename,
        file_size=file_size,
        order=order,
        is_required=is_required,
        estimated_duration=estimated_duration
    )
    db.add(content)
    db.commit()
    db.refresh(content)
    
    return {
        "message": "Content uploaded successfully",
        "content": {
            "id": content.id,
            "title": content.title,
            "content_type": content.content_type,
            "file_url": content.file_url,
            "file_name": content.file_name,
            "file_size": content.file_size
        }
    }

# ========== Course Resources ==========

@router.get("/courses/{course_id}/resources")
def get_course_resources(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all resources for a course"""
    check_admin(current_user)
    
    resources = db.query(CourseResource).filter(
        CourseResource.course_id == course_id
    ).all()
    
    return {"resources": [{
        "id": r.id,
        "title": r.title,
        "description": r.description,
        "file_url": r.file_url,
        "file_name": r.file_name,
        "file_type": r.file_type,
        "file_size": r.file_size,
        "download_count": r.download_count
    } for r in resources]}

@router.post("/courses/{course_id}/resources")
async def upload_resource(
    course_id: int,
    title: str = Form(...),
    description: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a resource file for a course"""
    check_admin(current_user)
    
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    ext = file.filename.split('.')[-1]
    unique_name = f"{uuid.uuid4()}.{ext}"
    file_path = f"{UPLOAD_DIR}/documents/{unique_name}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    file_size = os.path.getsize(file_path)
    
    resource = CourseResource(
        course_id=course_id,
        title=title,
        description=description,
        file_url=f"/uploads/documents/{unique_name}",
        file_name=file.filename,
        file_type=ext,
        file_size=file_size
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    
    return {"message": "Resource uploaded", "resource_id": resource.id}

@router.delete("/resources/{resource_id}")
def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a resource"""
    check_admin(current_user)
    
    resource = db.query(CourseResource).filter(CourseResource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    db.delete(resource)
    db.commit()
    
    return {"message": "Resource deleted"}

# ========== Get Available Labs for Linking ==========

@router.get("/available-labs")
def get_available_labs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of labs available for linking to course content"""
    check_admin(current_user)
    
    labs = db.query(Lab).filter(Lab.is_active == True).all()
    
    return {"labs": [{
        "id": lab.id,
        "title": lab.title,
        "category": lab.category,
        "difficulty": lab.difficulty
    } for lab in labs]}

# ========== Reorder Modules/Contents ==========

@router.put("/courses/{course_id}/reorder-modules")
def reorder_modules(
    course_id: int,
    module_orders: List[dict],  # [{"id": 1, "order": 0}, {"id": 2, "order": 1}]
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reorder modules in a course"""
    check_admin(current_user)
    
    for item in module_orders:
        module = db.query(CourseModule).filter(
            CourseModule.id == item["id"],
            CourseModule.course_id == course_id
        ).first()
        if module:
            module.order = item["order"]
    
    db.commit()
    return {"message": "Modules reordered"}

@router.put("/modules/{module_id}/reorder-contents")
def reorder_contents(
    module_id: int,
    content_orders: List[dict],  # [{"id": 1, "order": 0}, {"id": 2, "order": 1}]
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reorder contents in a module"""
    check_admin(current_user)
    
    for item in content_orders:
        content = db.query(CourseContent).filter(
            CourseContent.id == item["id"],
            CourseContent.module_id == module_id
        ).first()
        if content:
            content.order = item["order"]
    
    db.commit()
    return {"message": "Contents reordered"}


# ========== Course-Lab Linking ==========

@router.get("/courses/{course_id}/linked-labs")
def get_course_linked_labs(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all labs linked to a course through its modules"""
    check_admin(current_user)
    
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Get all modules for this course
    modules = db.query(CourseModule).filter(CourseModule.course_id == course_id).all()
    module_ids = [m.id for m in modules]
    
    # Get all lab_link contents
    lab_contents = db.query(CourseContent).filter(
        CourseContent.module_id.in_(module_ids),
        CourseContent.content_type == 'lab_link',
        CourseContent.linked_lab_id.isnot(None)
    ).all()
    
    linked_labs = []
    for content in lab_contents:
        lab = db.query(Lab).filter(Lab.id == content.linked_lab_id).first()
        if lab:
            module = next((m for m in modules if m.id == content.module_id), None)
            linked_labs.append({
                "content_id": content.id,
                "lab_id": lab.id,
                "lab_title": lab.title,
                "lab_category": lab.category,
                "lab_difficulty": lab.difficulty,
                "module_id": content.module_id,
                "module_title": module.title if module else "Unknown",
                "order": content.order,
                "is_required": content.is_required
            })
    
    return {
        "course_id": course_id,
        "course_title": course.title,
        "linked_labs": linked_labs
    }

@router.post("/courses/{course_id}/link-lab")
def link_lab_to_course(
    course_id: int,
    lab_id: str = Form(...),
    module_id: int = Form(None),
    title: str = Form(None),
    is_required: bool = Form(True),
    order: int = Form(0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Link a lab to a course. Creates a module if none specified."""
    check_admin(current_user)
    
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    lab = db.query(Lab).filter(Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    
    # If no module specified, create a "Labs" module or use existing one
    if not module_id:
        labs_module = db.query(CourseModule).filter(
            CourseModule.course_id == course_id,
            CourseModule.title == "Hands-on Labs"
        ).first()
        
        if not labs_module:
            # Get max order
            max_order = db.query(CourseModule).filter(
                CourseModule.course_id == course_id
            ).count()
            
            labs_module = CourseModule(
                course_id=course_id,
                title="Hands-on Labs",
                description="Practical lab exercises for this course",
                order=max_order
            )
            db.add(labs_module)
            db.commit()
            db.refresh(labs_module)
        
        module_id = labs_module.id
    
    # Check if lab is already linked in this module
    existing = db.query(CourseContent).filter(
        CourseContent.module_id == module_id,
        CourseContent.linked_lab_id == lab_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Lab is already linked to this module")
    
    # Create lab_link content
    content = CourseContent(
        module_id=module_id,
        content_type='lab_link',
        title=title or lab.title,
        description=lab.description,
        linked_lab_id=lab_id,
        order=order,
        is_required=is_required,
        estimated_duration=int(lab.duration.split()[0]) if lab.duration and lab.duration.split()[0].isdigit() else 30
    )
    db.add(content)
    db.commit()
    db.refresh(content)
    
    return {
        "message": "Lab linked to course successfully",
        "content_id": content.id,
        "module_id": module_id
    }

@router.delete("/courses/{course_id}/unlink-lab/{content_id}")
def unlink_lab_from_course(
    course_id: int,
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a lab link from a course"""
    check_admin(current_user)
    
    content = db.query(CourseContent).filter(
        CourseContent.id == content_id,
        CourseContent.content_type == 'lab_link'
    ).first()
    
    if not content:
        raise HTTPException(status_code=404, detail="Lab link not found")
    
    # Verify it belongs to the course
    module = db.query(CourseModule).filter(CourseModule.id == content.module_id).first()
    if not module or module.course_id != course_id:
        raise HTTPException(status_code=404, detail="Lab link not found in this course")
    
    db.delete(content)
    db.commit()
    
    return {"message": "Lab unlinked from course"}

@router.get("/all-courses-with-labs")
def get_all_courses_with_lab_counts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all courses with their linked lab counts"""
    check_admin(current_user)
    
    courses = db.query(Course).filter(Course.is_active == True).all()
    
    result = []
    for course in courses:
        modules = db.query(CourseModule).filter(CourseModule.course_id == course.id).all()
        module_ids = [m.id for m in modules]
        
        lab_count = db.query(CourseContent).filter(
            CourseContent.module_id.in_(module_ids) if module_ids else False,
            CourseContent.content_type == 'lab_link'
        ).count() if module_ids else 0
        
        result.append({
            "id": course.id,
            "title": course.title,
            "category": course.category,
            "difficulty": course.difficulty,
            "semester_level": course.semester_level,
            "linked_labs_count": lab_count
        })
    
    return {"courses": result}
