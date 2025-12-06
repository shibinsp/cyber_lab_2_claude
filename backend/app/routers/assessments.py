"""
Student Assessment Router
Handles taking assessments and viewing results
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from ..database import get_db
from ..models import User, Course, CourseAssessment, UserAssessmentAttempt
from ..utils.auth import get_current_user

router = APIRouter(tags=["assessments"])


class SubmitAssessmentRequest(BaseModel):
    answers: dict  # {question_index: "a"|"b"|"c"|"d"}


@router.get("/course/{course_id}")
def get_course_assessment(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get assessment for a course (student view - no correct answers)"""
    assessment = db.query(CourseAssessment).filter(
        CourseAssessment.course_id == course_id,
        CourseAssessment.is_active == True
    ).first()
    
    if not assessment:
        return {"exists": False, "message": "No assessment available for this course"}
    
    # Get user's attempt count
    attempt_count = db.query(UserAssessmentAttempt).filter(
        UserAssessmentAttempt.user_id == current_user.id,
        UserAssessmentAttempt.course_id == course_id
    ).count()
    
    # Check if user has passed
    passed_attempt = db.query(UserAssessmentAttempt).filter(
        UserAssessmentAttempt.user_id == current_user.id,
        UserAssessmentAttempt.course_id == course_id,
        UserAssessmentAttempt.passed == True
    ).first()
    
    # Check if attempts exhausted
    can_attempt = True
    if assessment.max_attempts != -1 and attempt_count >= assessment.max_attempts:
        can_attempt = False
    
    # Prepare questions without correct answers
    questions = []
    if assessment.questions:
        for i, q in enumerate(assessment.questions):
            questions.append({
                "index": i,
                "question": q.get("question"),
                "option_a": q.get("option_a"),
                "option_b": q.get("option_b"),
                "option_c": q.get("option_c"),
                "option_d": q.get("option_d"),
                "topic": q.get("topic"),
                "points": q.get("points", 10)
            })
    
    return {
        "exists": True,
        "id": assessment.id,
        "course_id": assessment.course_id,
        "title": assessment.title,
        "description": assessment.description,
        "pass_percentage": assessment.pass_percentage,
        "max_attempts": assessment.max_attempts,
        "time_limit": assessment.time_limit,
        "num_questions": len(questions),
        "questions": questions if can_attempt and not passed_attempt else [],
        "attempts_used": attempt_count,
        "can_attempt": can_attempt and not passed_attempt,
        "already_passed": passed_attempt is not None
    }


@router.post("/course/{course_id}/submit")
def submit_assessment(
    course_id: int,
    submission: SubmitAssessmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit assessment answers"""
    assessment = db.query(CourseAssessment).filter(
        CourseAssessment.course_id == course_id,
        CourseAssessment.is_active == True
    ).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Check attempt count
    attempt_count = db.query(UserAssessmentAttempt).filter(
        UserAssessmentAttempt.user_id == current_user.id,
        UserAssessmentAttempt.course_id == course_id
    ).count()
    
    if assessment.max_attempts != -1 and attempt_count >= assessment.max_attempts:
        raise HTTPException(status_code=400, detail="Maximum attempts reached")
    
    # Check if already passed
    passed = db.query(UserAssessmentAttempt).filter(
        UserAssessmentAttempt.user_id == current_user.id,
        UserAssessmentAttempt.course_id == course_id,
        UserAssessmentAttempt.passed == True
    ).first()
    
    if passed:
        raise HTTPException(status_code=400, detail="You have already passed this assessment")
    
    # Calculate score
    score = 0
    max_score = 0
    results = []
    
    for i, q in enumerate(assessment.questions or []):
        points = q.get("points", 10)
        max_score += points
        
        user_answer = submission.answers.get(str(i), "").lower()
        correct_answer = q.get("correct_answer", "").lower()
        
        is_correct = user_answer == correct_answer
        if is_correct:
            score += points
        
        results.append({
            "question_index": i,
            "user_answer": user_answer,
            "correct_answer": correct_answer,
            "is_correct": is_correct,
            "points_earned": points if is_correct else 0
        })
    
    percentage = (score / max_score * 100) if max_score > 0 else 0
    passed_assessment = percentage >= assessment.pass_percentage
    
    # Save attempt
    attempt = UserAssessmentAttempt(
        user_id=current_user.id,
        assessment_id=assessment.id,
        course_id=course_id,
        attempt_number=attempt_count + 1,
        score=score,
        max_score=max_score,
        percentage=percentage,
        passed=passed_assessment,
        questions_snapshot=assessment.questions,
        answers=submission.answers,
        completed_at=datetime.utcnow()
    )
    db.add(attempt)
    db.commit()
    
    return {
        "attempt_id": attempt.id,
        "score": score,
        "max_score": max_score,
        "percentage": round(percentage, 1),
        "passed": passed_assessment,
        "pass_percentage": assessment.pass_percentage,
        "attempt_number": attempt_count + 1,
        "results": results,
        "message": "Congratulations! You passed!" if passed_assessment else f"You need {assessment.pass_percentage}% to pass. Try again!"
    }


@router.get("/course/{course_id}/attempts")
def get_my_attempts(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's assessment attempts for a course"""
    attempts = db.query(UserAssessmentAttempt).filter(
        UserAssessmentAttempt.user_id == current_user.id,
        UserAssessmentAttempt.course_id == course_id
    ).order_by(UserAssessmentAttempt.completed_at.desc()).all()
    
    return {
        "course_id": course_id,
        "total_attempts": len(attempts),
        "attempts": [
            {
                "id": a.id,
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


@router.get("/my-results")
def get_all_my_results(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all assessment results for current user"""
    attempts = db.query(UserAssessmentAttempt).filter(
        UserAssessmentAttempt.user_id == current_user.id
    ).order_by(UserAssessmentAttempt.completed_at.desc()).all()
    
    # Group by course
    results_by_course = {}
    for a in attempts:
        if a.course_id not in results_by_course:
            course = db.query(Course).filter(Course.id == a.course_id).first()
            results_by_course[a.course_id] = {
                "course_id": a.course_id,
                "course_title": course.title if course else "Unknown",
                "best_score": 0,
                "passed": False,
                "attempts": []
            }
        
        results_by_course[a.course_id]["attempts"].append({
            "attempt_number": a.attempt_number,
            "percentage": a.percentage,
            "passed": a.passed,
            "completed_at": a.completed_at
        })
        
        if a.percentage > results_by_course[a.course_id]["best_score"]:
            results_by_course[a.course_id]["best_score"] = a.percentage
        
        if a.passed:
            results_by_course[a.course_id]["passed"] = True
    
    return {"results": list(results_by_course.values())}
