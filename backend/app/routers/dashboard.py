from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User, Course, Enrollment, UserQuizResult, Quiz
from ..models.progress import LabProgress
from ..utils.auth import get_current_user

router = APIRouter(tags=["dashboard"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Total courses
    total_courses = db.query(Course).filter(Course.is_active == True).count()

    # Enrolled courses
    enrolled_courses = db.query(Enrollment).filter(Enrollment.user_id == current_user.id).count()

    # Completed labs
    completed_labs = db.query(LabProgress).filter(
        LabProgress.user_id == current_user.id,
        LabProgress.completed == True
    ).count()

    # Total labs (from enrolled courses)
    total_labs = 0
    enrollments = db.query(Enrollment).filter(Enrollment.user_id == current_user.id).all()
    for enrollment in enrollments:
        from ..models.user import CourseLab
        labs_count = db.query(CourseLab).filter(CourseLab.course_id == enrollment.course_id).count()
        total_labs += labs_count

    # Quiz scores
    quiz_results = db.query(UserQuizResult).filter(UserQuizResult.user_id == current_user.id).all()
    quiz_scores = []
    for result in quiz_results:
        quiz = db.query(Quiz).filter(Quiz.id == result.quiz_id).first()
        quiz_scores.append({
            "quiz_id": result.quiz_id,
            "category": quiz.category if quiz else "Unknown",
            "score": result.score,
            "max_score": result.max_score,
            "percentage": result.percentage
        })

    # Recommended courses based on quiz performance
    recommended = []
    if quiz_scores:
        # Find strong categories
        strong_categories = [qs["category"] for qs in quiz_scores if qs["percentage"] >= 60]

        if strong_categories:
            courses = db.query(Course).filter(
                Course.is_active == True,
                Course.category.in_(strong_categories)
            ).limit(3).all()
        else:
            courses = db.query(Course).filter(
                Course.is_active == True,
                Course.difficulty == "Beginner"
            ).limit(3).all()

        for course in courses:
            recommended.append({
                "id": course.id,
                "title": course.title,
                "description": course.description,
                "category": course.category,
                "difficulty": course.difficulty,
                "duration": course.duration
            })
    else:
        # No quiz taken, recommend beginner courses
        courses = db.query(Course).filter(
            Course.is_active == True,
            Course.difficulty == "Beginner"
        ).limit(3).all()

        for course in courses:
            recommended.append({
                "id": course.id,
                "title": course.title,
                "description": course.description,
                "category": course.category,
                "difficulty": course.difficulty,
                "duration": course.duration
            })

    return {
        "total_courses": total_courses,
        "enrolled_courses": enrolled_courses,
        "completed_labs": completed_labs,
        "total_labs": total_labs if total_labs > 0 else completed_labs,
        "quiz_completed": current_user.quiz_completed,
        "quiz_scores": quiz_scores,
        "recommended_courses": recommended
    }

@router.get("/recent-activity")
def get_recent_activity(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Get recent lab completions
    recent_progress = db.query(LabProgress).filter(
        LabProgress.user_id == current_user.id
    ).order_by(LabProgress.completed_at.desc()).limit(5).all()

    activities = []
    for progress in recent_progress:
        activities.append({
            "type": "lab_progress",
            "lab_id": progress.lab_id,
            "step": progress.current_step,
            "completed": progress.completed,
            "date": progress.completed_at
        })

    # Get recent enrollments
    recent_enrollments = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id
    ).order_by(Enrollment.enrolled_at.desc()).limit(3).all()

    for enrollment in recent_enrollments:
        course = db.query(Course).filter(Course.id == enrollment.course_id).first()
        if course:
            activities.append({
                "type": "enrollment",
                "course_title": course.title,
                "date": enrollment.enrolled_at
            })

    return activities

@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Get top users by completed labs
    users = db.query(User).all()
    leaderboard = []

    for user in users:
        completed = db.query(LabProgress).filter(
            LabProgress.user_id == user.id,
            LabProgress.completed == True
        ).count()

        leaderboard.append({
            "username": user.username,
            "completed_labs": completed,
            "department": user.department
        })

    leaderboard.sort(key=lambda x: x["completed_labs"], reverse=True)

    return leaderboard[:10]
