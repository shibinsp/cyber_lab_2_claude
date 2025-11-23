from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import json
import os
from ..database import get_db
from ..models.user import Course, CourseLab, Enrollment, User, CourseProgress
from ..schemas import CourseCreate, CourseResponse, CourseLabCreate, EnrollmentCreate
from ..utils.auth import get_current_user

COURSES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "courses")

router = APIRouter(prefix="/courses", tags=["courses"])

@router.get("/", response_model=List[CourseResponse])
def get_courses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    courses = db.query(Course).filter(Course.is_active == True).all()
    return courses

@router.get("/recommended", response_model=List[CourseResponse])
def get_recommended_courses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from ..models.user import UserQuizResult, Quiz

    # Get user's quiz results to determine interests
    quiz_results = db.query(UserQuizResult).filter(UserQuizResult.user_id == current_user.id).all()

    if not quiz_results:
        # Return beginner courses if no quiz taken
        courses = db.query(Course).filter(
            Course.is_active == True,
            Course.difficulty == "Beginner"
        ).limit(5).all()
        return courses

    # Find categories where user scored well (>= 60%)
    strong_categories = []
    for result in quiz_results:
        if result.percentage >= 60:
            quiz = db.query(Quiz).filter(Quiz.id == result.quiz_id).first()
            if quiz:
                strong_categories.append(quiz.category)

    if strong_categories:
        courses = db.query(Course).filter(
            Course.is_active == True,
            Course.category.in_(strong_categories)
        ).limit(5).all()
    else:
        courses = db.query(Course).filter(Course.is_active == True).limit(5).all()

    return courses

@router.post("/enroll")
def enroll_course(enrollment: EnrollmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if already enrolled
    existing = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == enrollment.course_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled in this course")

    new_enrollment = Enrollment(
        user_id=current_user.id,
        course_id=enrollment.course_id
    )
    db.add(new_enrollment)
    db.commit()

    return {"message": "Successfully enrolled"}

@router.get("/enrolled/list")
def get_enrolled_courses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    enrollments = db.query(Enrollment).filter(Enrollment.user_id == current_user.id).all()
    result = []

    for enrollment in enrollments:
        course = db.query(Course).filter(Course.id == enrollment.course_id).first()
        if course:
            result.append({
                "id": enrollment.id,
                "course_id": course.id,
                "title": course.title,
                "description": course.description,
                "category": course.category,
                "difficulty": course.difficulty,
                "progress": enrollment.progress,
                "completed": enrollment.completed,
                "enrolled_at": enrollment.enrolled_at
            })

    return result

@router.get("/enrolled/labs")
def get_enrolled_labs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all labs from enrolled courses only"""
    import json
    import os

    # Get user's enrolled courses
    enrollments = db.query(Enrollment).filter(Enrollment.user_id == current_user.id).all()

    if not enrollments:
        return []

    enrolled_course_ids = [e.course_id for e in enrollments]

    # Get all labs from enrolled courses
    course_labs = db.query(CourseLab).filter(
        CourseLab.course_id.in_(enrolled_course_ids)
    ).all()

    labs_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "labs")
    labs = []
    seen_lab_ids = set()

    for cl in course_labs:
        if cl.lab_id in seen_lab_ids:
            continue
        seen_lab_ids.add(cl.lab_id)

        lab_file = os.path.join(labs_dir, f"{cl.lab_id}.json")
        if os.path.exists(lab_file):
            with open(lab_file, 'r') as f:
                lab_data = json.load(f)
                labs.append(lab_data)

    return labs

@router.get("/{course_id}", response_model=CourseResponse)
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@router.get("/{course_id}/labs")
def get_course_labs(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    import json
    import os

    course_labs = db.query(CourseLab).filter(CourseLab.course_id == course_id).order_by(CourseLab.order).all()
    labs = []

    labs_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "labs")

    for cl in course_labs:
        lab_file = os.path.join(labs_dir, f"{cl.lab_id}.json")
        if os.path.exists(lab_file):
            with open(lab_file, 'r') as f:
                lab_data = json.load(f)
                labs.append(lab_data)

    return labs

@router.post("/", response_model=CourseResponse)
def create_course(course: CourseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    new_course = Course(**course.dict())
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    return new_course

@router.post("/lab")
def add_lab_to_course(course_lab: CourseLabCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    new_course_lab = CourseLab(**course_lab.dict())
    db.add(new_course_lab)
    db.commit()

    return {"message": "Lab added to course"}

@router.get("/{course_id}/content")
def get_course_content(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get course learning content from JSON file"""
    # Check if enrolled
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == course_id
    ).first()

    if not enrollment and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Must be enrolled to access course content")

    # Load course content from JSON
    course_file = os.path.join(COURSES_DIR, f"course_{course_id}.json")
    if not os.path.exists(course_file):
        raise HTTPException(status_code=404, detail="Course content not found")

    with open(course_file, 'r') as f:
        content = json.load(f)

    # Don't include assessment answers
    if "assessment" in content:
        for q in content["assessment"]["questions"]:
            q.pop("correct", None)

    return content

@router.get("/{course_id}/progress")
def get_course_progress(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get user's progress in a course"""
    progress = db.query(CourseProgress).filter(
        CourseProgress.user_id == current_user.id,
        CourseProgress.course_id == course_id
    ).first()

    if not progress:
        return {
            "current_module": 0,
            "completed_modules": [],
            "assessment_attempts": 0,
            "assessment_score": None,
            "passed": False,
            "can_attempt": True,
            "next_attempt_at": None
        }

    completed = json.loads(progress.completed_modules) if progress.completed_modules else []

    # Check if can attempt assessment
    can_attempt = True
    next_attempt_at = None

    if progress.assessment_attempts >= 3 and not progress.passed:
        if progress.last_attempt_at:
            retry_time = progress.last_attempt_at + timedelta(hours=24)
            if datetime.utcnow() < retry_time:
                can_attempt = False
                next_attempt_at = retry_time.isoformat()
            else:
                # Reset attempts after 24 hours
                progress.assessment_attempts = 0
                db.commit()

    return {
        "current_module": progress.current_module,
        "completed_modules": completed,
        "assessment_attempts": progress.assessment_attempts,
        "assessment_score": progress.assessment_score,
        "passed": progress.passed,
        "can_attempt": can_attempt,
        "next_attempt_at": next_attempt_at
    }

@router.post("/{course_id}/progress")
def update_course_progress(course_id: int, module_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Update progress - mark module as completed"""
    progress = db.query(CourseProgress).filter(
        CourseProgress.user_id == current_user.id,
        CourseProgress.course_id == course_id
    ).first()

    if not progress:
        progress = CourseProgress(
            user_id=current_user.id,
            course_id=course_id,
            current_module=module_id,
            completed_modules="[]"
        )
        db.add(progress)

    completed = json.loads(progress.completed_modules) if progress.completed_modules else []

    if module_id not in completed:
        completed.append(module_id)
        progress.completed_modules = json.dumps(completed)

    progress.current_module = module_id

    # Calculate and update enrollment progress percentage
    course_file = os.path.join(COURSES_DIR, f"course_{course_id}.json")
    if os.path.exists(course_file):
        with open(course_file, 'r') as f:
            content = json.load(f)
            total_modules = len(content.get("modules", []))
            if total_modules > 0:
                progress_percent = (len(completed) / total_modules) * 100

                # Update enrollment progress
                enrollment = db.query(Enrollment).filter(
                    Enrollment.user_id == current_user.id,
                    Enrollment.course_id == course_id
                ).first()
                if enrollment:
                    enrollment.progress = progress_percent

    db.commit()

    return {"status": "success", "completed_modules": completed}

@router.get("/{course_id}/assessment")
def get_course_assessment(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get assessment questions - returns stored quiz or creates new one"""
    # Load course content
    course_file = os.path.join(COURSES_DIR, f"course_{course_id}.json")
    if not os.path.exists(course_file):
        raise HTTPException(status_code=404, detail="Course content not found")

    with open(course_file, 'r') as f:
        content = json.load(f)

    if "assessment" not in content:
        raise HTTPException(status_code=404, detail="No assessment for this course")

    # Get or create progress
    progress = db.query(CourseProgress).filter(
        CourseProgress.user_id == current_user.id,
        CourseProgress.course_id == course_id
    ).first()

    if not progress:
        progress = CourseProgress(
            user_id=current_user.id,
            course_id=course_id,
            completed_modules="[]"
        )
        db.add(progress)
        db.commit()

    # Check if quiz already stored
    if progress.quiz_questions:
        questions = json.loads(progress.quiz_questions)
        draft_answers = json.loads(progress.draft_answers) if progress.draft_answers else {}
    else:
        # Create new quiz and store it
        questions = []
        for q in content["assessment"]["questions"]:
            questions.append({
                "id": q["id"],
                "question": q["question"],
                "options": q["options"]
            })
        progress.quiz_questions = json.dumps(questions)
        progress.draft_answers = "{}"
        db.commit()
        draft_answers = {}

    return {
        "passing_score": content["assessment"]["passing_score"],
        "max_attempts": content["assessment"]["max_attempts"],
        "questions": questions,
        "draft_answers": draft_answers
    }

@router.post("/{course_id}/assessment/regenerate")
def regenerate_assessment(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Regenerate quiz questions - clears stored quiz and drafts"""
    course_file = os.path.join(COURSES_DIR, f"course_{course_id}.json")
    if not os.path.exists(course_file):
        raise HTTPException(status_code=404, detail="Course content not found")

    with open(course_file, 'r') as f:
        content = json.load(f)

    # Get or create progress
    progress = db.query(CourseProgress).filter(
        CourseProgress.user_id == current_user.id,
        CourseProgress.course_id == course_id
    ).first()

    if not progress:
        progress = CourseProgress(
            user_id=current_user.id,
            course_id=course_id,
            completed_modules="[]"
        )
        db.add(progress)

    # Create new quiz
    questions = []
    for q in content["assessment"]["questions"]:
        questions.append({
            "id": q["id"],
            "question": q["question"],
            "options": q["options"]
        })

    progress.quiz_questions = json.dumps(questions)
    progress.draft_answers = "{}"
    db.commit()

    return {
        "passing_score": content["assessment"]["passing_score"],
        "max_attempts": content["assessment"]["max_attempts"],
        "questions": questions,
        "draft_answers": {}
    }

@router.post("/{course_id}/assessment/draft")
def save_assessment_draft(course_id: int, answers: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Save draft answers"""
    progress = db.query(CourseProgress).filter(
        CourseProgress.user_id == current_user.id,
        CourseProgress.course_id == course_id
    ).first()

    if not progress:
        progress = CourseProgress(
            user_id=current_user.id,
            course_id=course_id,
            completed_modules="[]"
        )
        db.add(progress)

    progress.draft_answers = json.dumps(answers)
    db.commit()

    return {"status": "saved"}

@router.post("/{course_id}/assessment")
def submit_course_assessment(course_id: int, answers: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Submit assessment answers and get score"""
    # Get or create progress
    progress = db.query(CourseProgress).filter(
        CourseProgress.user_id == current_user.id,
        CourseProgress.course_id == course_id
    ).first()

    if not progress:
        progress = CourseProgress(
            user_id=current_user.id,
            course_id=course_id,
            completed_modules="[]"
        )
        db.add(progress)
        db.commit()

    # Check if can attempt
    if progress.assessment_attempts >= 3 and not progress.passed:
        if progress.last_attempt_at:
            retry_time = progress.last_attempt_at + timedelta(hours=24)
            if datetime.utcnow() < retry_time:
                raise HTTPException(
                    status_code=429,
                    detail=f"Maximum attempts reached. Try again after {retry_time.isoformat()}"
                )
            else:
                progress.assessment_attempts = 0

    # Load course content with answers
    course_file = os.path.join(COURSES_DIR, f"course_{course_id}.json")
    with open(course_file, 'r') as f:
        content = json.load(f)

    assessment = content["assessment"]
    questions = assessment["questions"]

    # Calculate score
    correct = 0
    total = len(questions)
    results = []

    for q in questions:
        user_answer = answers.get(str(q["id"]))
        is_correct = user_answer == q["correct"]
        if is_correct:
            correct += 1
        results.append({
            "id": q["id"],
            "correct": is_correct,
            "correct_answer": q["correct"],
            "user_answer": user_answer
        })

    score = (correct / total) * 100 if total > 0 else 0
    passed = score >= assessment["passing_score"]

    # Update progress
    progress.assessment_attempts += 1
    progress.assessment_score = score
    progress.last_attempt_at = datetime.utcnow()

    if passed:
        progress.passed = True
        progress.completed_at = datetime.utcnow()

        # Update enrollment progress
        enrollment = db.query(Enrollment).filter(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == course_id
        ).first()
        if enrollment:
            enrollment.completed = True
            enrollment.progress = 100.0

    # Clear draft answers after submission
    progress.draft_answers = "{}"

    db.commit()

    return {
        "score": score,
        "passed": passed,
        "correct": correct,
        "total": total,
        "attempts_remaining": max(0, 3 - progress.assessment_attempts) if not passed else 0,
        "results": results
    }
