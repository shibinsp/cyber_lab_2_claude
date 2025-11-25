from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import User, Course, CourseLab
from ..utils.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/admin/courses", tags=["admin-courses"])

# ========== Pydantic Schemas ==========

class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    difficulty: str = "Beginner"
    duration: Optional[str] = None
    image_url: Optional[str] = None
    semester_level: int = 1
    is_active: bool = True

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = None
    duration: Optional[str] = None
    image_url: Optional[str] = None
    semester_level: Optional[int] = None
    is_active: Optional[bool] = None

class CourseResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category: Optional[str]
    difficulty: str
    duration: Optional[str]
    image_url: Optional[str]
    semester_level: int
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

# ========== Course Management Endpoints ==========

@router.get("/", response_model=List[CourseResponse])
def get_all_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    include_inactive: bool = False
):
    """Get all courses (admin only)"""
    check_admin(current_user)
    
    query = db.query(Course)
    if not include_inactive:
        query = query.filter(Course.is_active == True)
    
    return query.all()

@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    course_data: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new course (admin only)"""
    check_admin(current_user)
    
    # Create course
    new_course = Course(**course_data.dict())
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    
    return new_course

@router.get("/{course_id}", response_model=CourseResponse)
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get course details (admin only)"""
    check_admin(current_user)
    
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with ID {course_id} not found"
        )
    
    return course

@router.put("/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: int,
    course_data: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update course (admin only)"""
    check_admin(current_user)
    
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with ID {course_id} not found"
        )
    
    # Update only provided fields
    update_data = course_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(course, field, value)
    
    db.commit()
    db.refresh(course)
    
    return course

@router.delete("/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete course (admin only)"""
    check_admin(current_user)
    
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with ID {course_id} not found"
        )
    
    db.delete(course)
    db.commit()
    
    return {"message": f"Course '{course.title}' deleted successfully"}

@router.get("/{course_id}/labs")
def get_course_labs(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get labs assigned to a course"""
    check_admin(current_user)
    
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    labs = db.query(CourseLab).filter(CourseLab.course_id == course_id).all()
    
    return {
        "course_id": course_id,
        "course_title": course.title,
        "labs": [{"lab_id": lab.lab_id, "order": lab.order} for lab in labs]
    }

