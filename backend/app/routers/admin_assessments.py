"""
Admin Assessment Management Router
Handles course assessment creation with AI-generated questions
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from ..database import get_db
from ..models import User, Course, CourseAssessment, UserAssessmentAttempt
from ..utils.auth import get_current_user
from ..utils.mistral import generate_quiz_questions

router = APIRouter(tags=["admin-assessments"])


# ========== Pydantic Schemas ==========

class AssessmentCreate(BaseModel):
    course_id: int
    title: str = "Course Assessment"
    description: Optional[str] = None
    pass_percentage: int = 70  # 50, 60, 70, 80, 90
    max_attempts: int = 3  # 1, 2, 3, 5, -1 (unlimited)
    topics: List[str]  # Topics for question generation
    num_questions: int = 10
    difficulty: str = "intermediate"  # easy, intermediate, hard
    time_limit: Optional[int] = None  # Minutes


class AssessmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    pass_percentage: Optional[int] = None
    max_attempts: Optional[int] = None
    topics: Optional[List[str]] = None
    num_questions: Optional[int] = None
    difficulty: Optional[str] = None
    time_limit: Optional[int] = None
    is_active: Optional[bool] = None


class GenerateQuestionsRequest(BaseModel):
    topics: List[str]
    num_questions: int = 10
    difficulty: str = "intermediate"


# ========== Helper Functions ==========

def check_admin(current_user: User):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )


# ========== Assessment Endpoints ==========

@router.post("/")
async def create_assessment(
    data: AssessmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create assessment for a course with AI-generated questions"""
    check_admin(current_user)
    
    # Verify course exists
    course = db.query(Course).filter(Course.id == data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Check if assessment already exists
    existing = db.query(CourseAssessment).filter(
        CourseAssessment.course_id == data.course_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Assessment already exists for this course. Use update instead."
        )
    
    # Generate questions using Mistral AI
    all_questions = []
    questions_per_topic = max(1, data.num_questions // len(data.topics))
    
    for topic in data.topics:
        try:
            questions = await generate_quiz_questions(
                category=topic,
                num_questions=questions_per_topic,
                difficulty=data.difficulty
            )
            for q in questions:
                q["topic"] = topic
            all_questions.extend(questions)
        except Exception as e:
            print(f"Error generating questions for {topic}: {e}")
    
    # Trim to exact number requested
    all_questions = all_questions[:data.num_questions]
    
    # Create assessment
    assessment = CourseAssessment(
        course_id=data.course_id,
        title=data.title,
        description=data.description,
        pass_percentage=data.pass_percentage,
        max_attempts=data.max_attempts,
        topics=data.topics,
        num_questions=data.num_questions,
        difficulty=data.difficulty,
        time_limit=data.time_limit,
        questions=all_questions
    )
    
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    return {
        "message": "Assessment created successfully",
        "assessment_id": assessment.id,
        "questions_generated": len(all_questions),
        "course_id": data.course_id
    }


@router.get("/{course_id}")
def get_assessment(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get assessment for a course"""
    check_admin(current_user)
    
    assessment = db.query(CourseAssessment).filter(
        CourseAssessment.course_id == course_id
    ).first()
    
    if not assessment:
        return {"exists": False, "message": "No assessment configured for this course"}
    
    return {
        "exists": True,
        "id": assessment.id,
        "course_id": assessment.course_id,
        "title": assessment.title,
        "description": assessment.description,
        "pass_percentage": assessment.pass_percentage,
        "max_attempts": assessment.max_attempts,
        "topics": assessment.topics,
        "num_questions": assessment.num_questions,
        "difficulty": assessment.difficulty,
        "time_limit": assessment.time_limit,
        "questions_count": len(assessment.questions) if assessment.questions else 0,
        "is_active": assessment.is_active
    }


@router.put("/{course_id}")
async def update_assessment(
    course_id: int,
    data: AssessmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update assessment configuration"""
    check_admin(current_user)
    
    assessment = db.query(CourseAssessment).filter(
        CourseAssessment.course_id == course_id
    ).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Update fields
    update_data = data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(assessment, field, value)
    
    db.commit()
    db.refresh(assessment)
    
    return {"message": "Assessment updated", "assessment_id": assessment.id}


@router.post("/{course_id}/regenerate")
async def regenerate_questions(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Regenerate assessment questions using AI"""
    check_admin(current_user)
    
    assessment = db.query(CourseAssessment).filter(
        CourseAssessment.course_id == course_id
    ).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Generate new questions
    all_questions = []
    questions_per_topic = max(1, assessment.num_questions // len(assessment.topics))
    
    for topic in assessment.topics:
        try:
            questions = await generate_quiz_questions(
                category=topic,
                num_questions=questions_per_topic,
                difficulty=assessment.difficulty
            )
            for q in questions:
                q["topic"] = topic
            all_questions.extend(questions)
        except Exception as e:
            print(f"Error generating questions for {topic}: {e}")
    
    all_questions = all_questions[:assessment.num_questions]
    assessment.questions = all_questions
    
    db.commit()
    
    return {
        "message": "Questions regenerated",
        "questions_count": len(all_questions)
    }


@router.post("/generate-preview")
async def generate_preview_questions(
    data: GenerateQuestionsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Preview generated questions before saving"""
    check_admin(current_user)
    
    all_questions = []
    questions_per_topic = max(1, data.num_questions // len(data.topics))
    
    for topic in data.topics:
        try:
            questions = await generate_quiz_questions(
                category=topic,
                num_questions=questions_per_topic,
                difficulty=data.difficulty
            )
            for q in questions:
                q["topic"] = topic
            all_questions.extend(questions)
        except Exception as e:
            print(f"Error generating questions for {topic}: {e}")
    
    return {
        "questions": all_questions[:data.num_questions],
        "total": len(all_questions[:data.num_questions])
    }


@router.delete("/{course_id}")
def delete_assessment(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete assessment from a course"""
    check_admin(current_user)
    
    assessment = db.query(CourseAssessment).filter(
        CourseAssessment.course_id == course_id
    ).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    db.delete(assessment)
    db.commit()
    
    return {"message": "Assessment deleted"}


@router.get("/{course_id}/attempts")
def get_assessment_attempts(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all attempts for an assessment (admin view)"""
    check_admin(current_user)
    
    attempts = db.query(UserAssessmentAttempt).filter(
        UserAssessmentAttempt.course_id == course_id
    ).order_by(UserAssessmentAttempt.completed_at.desc()).all()
    
    return {
        "course_id": course_id,
        "total_attempts": len(attempts),
        "attempts": [
            {
                "id": a.id,
                "user_id": a.user_id,
                "attempt_number": a.attempt_number,
                "score": a.score,
                "max_score": a.max_score,
                "percentage": a.percentage,
                "passed": a.passed,
                "completed_at": a.completed_at
            }
            for a in attempts
        ]
    }
