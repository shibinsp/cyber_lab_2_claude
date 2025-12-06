from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..models.progress import LabProgress
from ..models.user import UserQuizResult, CourseProgress, AssessmentQuizAttempt
from ..models.assessment import UserAssessmentAttempt
from ..schemas import UserResponse
from ..utils.auth import get_current_user

router = APIRouter(tags=["users"])

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/progress")
def get_user_progress(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    progress = db.query(LabProgress).filter(LabProgress.user_id == current_user.id).all()
    return [
        {
            "lab_id": p.lab_id,
            "current_step": p.current_step,
            "completed": p.completed,
            "completed_at": p.completed_at
        }
        for p in progress
    ]

@router.get("/rank")
def get_user_rank(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Calculate and return the user's rank based on:
    - Assessment scores (average percentage)
    - Quiz scores (average percentage)
    - Lab completions (count)
    - Course completions (count of passed courses)
    """
    from ..utils.redis_client import redis_client
    
    # Try to get from cache (5 minute TTL)
    cache_key = f"leaderboard:all"
    cached_result = redis_client.get_json(cache_key)
    if cached_result:
        # Find current user's rank in cached data
        current_user_rank = None
        current_user_score = None
        for idx, user_score in enumerate(cached_result.get("all_students", []), start=1):
            if user_score["user_id"] == current_user.id:
                current_user_rank = idx
                current_user_score = user_score
                break
        
        if current_user_rank:
            return {
                "rank": current_user_rank,
                "total_students": cached_result.get("total_students", 0),
                "total_score": current_user_score.get("total_score", 0),
                "assessment_score": current_user_score.get("assessment_score", 0),
                "quiz_score": current_user_score.get("quiz_score", 0),
                "completed_labs": current_user_score.get("completed_labs", 0),
                "passed_courses": current_user_score.get("passed_courses", 0),
                "quiz_attempts": current_user_score.get("quiz_attempts", 0),
                "top_10": cached_result.get("all_students", [])[:10],
                "all_students": cached_result.get("all_students", [])
            }
    
    # Get all students (exclude admins)
    all_students = db.query(User).filter(User.role == "student").all()
    
    user_scores = []
    
    for user in all_students:
        # Calculate assessment score (average percentage of all assessment attempts)
        assessment_attempts = db.query(UserAssessmentAttempt).filter(
            UserAssessmentAttempt.user_id == user.id
        ).all()
        
        avg_assessment_score = 0
        if assessment_attempts:
            total_percentage = sum(attempt.percentage for attempt in assessment_attempts)
            avg_assessment_score = total_percentage / len(assessment_attempts)
        
        # Calculate quiz score (average percentage of all quiz results)
        quiz_results = db.query(UserQuizResult).filter(
            UserQuizResult.user_id == user.id
        ).all()
        
        avg_quiz_score = 0
        if quiz_results:
            total_percentage = sum(result.percentage for result in quiz_results)
            avg_quiz_score = total_percentage / len(quiz_results)
        
        # Count completed labs
        completed_labs = db.query(LabProgress).filter(
            LabProgress.user_id == user.id,
            LabProgress.completed == True
        ).count()
        
        # Count passed courses (courses with passed=True in CourseProgress)
        passed_courses = db.query(CourseProgress).filter(
            CourseProgress.user_id == user.id,
            CourseProgress.passed == True
        ).count()
        
        # Count completed quiz attempts
        completed_quiz_attempts = db.query(AssessmentQuizAttempt).filter(
            AssessmentQuizAttempt.user_id == user.id,
            AssessmentQuizAttempt.completed_at.isnot(None)
        ).count()
        
        # Calculate total score with weights:
        # - Assessment: 40% weight
        # - Quiz: 30% weight
        # - Labs: 20 points per lab
        # - Courses: 50 points per passed course
        total_score = (
            (avg_assessment_score * 0.4) +
            (avg_quiz_score * 0.3) +
            (completed_labs * 20) +
            (passed_courses * 50)
        )
        
        user_scores.append({
            "user_id": user.id,
            "username": user.username,
            "total_score": round(total_score, 2),
            "assessment_score": round(avg_assessment_score, 2),
            "quiz_score": round(avg_quiz_score, 2),
            "completed_labs": completed_labs,
            "passed_courses": passed_courses,
            "quiz_attempts": completed_quiz_attempts
        })
    
    # Sort by total score (descending)
    user_scores.sort(key=lambda x: x["total_score"], reverse=True)
    
    # Find current user's rank
    current_user_rank = None
    for idx, user_score in enumerate(user_scores, start=1):
        if user_score["user_id"] == current_user.id:
            current_user_rank = idx
            break
    
    # Get current user's score details
    current_user_score = next(
        (score for score in user_scores if score["user_id"] == current_user.id),
        None
    )
    
    if not current_user_score:
        current_user_score = {
            "user_id": current_user.id,
            "username": current_user.username,
            "total_score": 0,
            "assessment_score": 0,
            "quiz_score": 0,
            "completed_labs": 0,
            "passed_courses": 0,
            "quiz_attempts": 0
        }
        current_user_rank = len(user_scores) + 1
    
    total_students = len(user_scores)
    
    result = {
        "rank": current_user_rank,
        "total_students": total_students,
        "total_score": current_user_score["total_score"],
        "assessment_score": current_user_score["assessment_score"],
        "quiz_score": current_user_score["quiz_score"],
        "completed_labs": current_user_score["completed_labs"],
        "passed_courses": current_user_score["passed_courses"],
        "quiz_attempts": current_user_score["quiz_attempts"],
        "top_10": user_scores[:10],  # Return top 10 for quick display
        "all_students": user_scores  # Return all students for full leaderboard
    }
    
    # Cache the full leaderboard for 5 minutes
    cache_key = f"leaderboard:all"
    redis_client.set_json(cache_key, {
        "total_students": total_students,
        "all_students": user_scores
    }, ttl=300)
    
    return result
