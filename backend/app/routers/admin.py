from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from ..database import get_db
from ..models.user import User, Course, Quiz, QuizQuestion, AdminSettings, Enrollment, UserQuizResult
from ..schemas import AdminSettingUpdate, UserAdminResponse, CourseCreate, QuizCreate
from ..utils.auth import get_current_user

router = APIRouter(tags=["admin"])

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    try:
        total_users = db.query(User).count()
        total_courses = db.query(Course).count()
        total_quizzes = db.query(Quiz).count()
        total_enrollments = db.query(Enrollment).count()

        # Users by department
        departments = db.query(User.department, func.count(User.id)).group_by(User.department).all()

        # Users by role
        roles = db.query(User.role, func.count(User.id)).group_by(User.role).all()

        # Quiz completion stats
        quiz_completed = db.query(User).filter(User.quiz_completed == True).count()

        # Recent users (last 5)
        recent_users = db.query(User).order_by(User.id.desc()).limit(5).all()

        return {
            "total_users": total_users,
            "total_courses": total_courses,
            "total_quizzes": total_quizzes,
            "total_enrollments": total_enrollments,
            "users_by_department": [{"department": d or "Not Set", "count": c} for d, c in departments],
            "users_by_role": [{"role": r or "student", "count": c} for r, c in roles],
            "quiz_completed": quiz_completed,
            "recent_users": [{"id": u.id, "username": u.username, "email": u.email, "department": u.department or "N/A", "role": u.role or "student"} for u in recent_users]
        }
    except Exception as e:
        print(f"Admin stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users", response_model=List[UserAdminResponse])
def get_all_users(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    users = db.query(User).all()
    return users

@router.put("/users/{user_id}/role")
def update_user_role(user_id: int, role: str, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if role not in ["student", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    user.role = role
    db.commit()

    return {"message": f"User role updated to {role}"}

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    db.delete(user)
    db.commit()

    return {"message": "User deleted"}

@router.get("/courses")
def get_all_courses(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    courses = db.query(Course).all()
    return courses

@router.put("/courses/{course_id}")
def update_course(course_id: int, course_data: CourseCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    for key, value in course_data.dict().items():
        setattr(course, key, value)

    db.commit()

    return {"message": "Course updated"}

@router.delete("/courses/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    db.delete(course)
    db.commit()

    return {"message": "Course deleted"}

@router.get("/quizzes")
def get_all_quizzes(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    quizzes = db.query(Quiz).all()
    result = []

    for quiz in quizzes:
        questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz.id).all()
        result.append({
            "id": quiz.id,
            "title": quiz.title,
            "description": quiz.description,
            "category": quiz.category,
            "is_active": quiz.is_active,
            "question_count": len(questions)
        })

    return result

@router.delete("/quizzes/{quiz_id}")
def delete_quiz(quiz_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # Delete questions first
    db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz_id).delete()
    db.delete(quiz)
    db.commit()

    return {"message": "Quiz deleted"}

@router.get("/settings")
def get_settings(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    settings = db.query(AdminSettings).all()
    return {s.key: s.value for s in settings}

@router.put("/settings")
def update_setting(setting: AdminSettingUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    existing = db.query(AdminSettings).filter(AdminSettings.key == setting.key).first()

    if existing:
        existing.value = setting.value
    else:
        new_setting = AdminSettings(key=setting.key, value=setting.value)
        db.add(new_setting)

    db.commit()

    return {"message": "Setting updated"}

@router.post("/init-data")
def initialize_data(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    """Initialize courses with linked labs"""
    from ..models.user import CourseLab

    # Define courses with their associated labs
    courses_data = [
        {
            "title": "Linux Security Essentials",
            "description": "Master Linux commands and file system security for cybersecurity professionals.",
            "category": "Linux Fundamentals",
            "difficulty": "Beginner",
            "duration": "3 weeks",
            "semester_level": 1,
            "labs": ["lab_linux_101", "lab_privilege_escalation"]
        },
        {
            "title": "Network Security Fundamentals",
            "description": "Learn network scanning, firewall configuration, and traffic analysis.",
            "category": "Network Security",
            "difficulty": "Beginner",
            "duration": "4 weeks",
            "semester_level": 1,
            "labs": ["lab_network_scanning", "lab_firewall_config", "lab_wireshark_analysis"]
        },
        {
            "title": "Web Application Security",
            "description": "Identify and exploit web vulnerabilities including XSS and SQL Injection.",
            "category": "Web Security",
            "difficulty": "Intermediate",
            "duration": "5 weeks",
            "semester_level": 2,
            "labs": ["lab_sql_injection", "lab_xss_basics", "lab_web_recon"]
        },
        {
            "title": "Cryptography & Hash Analysis",
            "description": "Understand encryption, hashing, and password cracking techniques.",
            "category": "Cryptography",
            "difficulty": "Intermediate",
            "duration": "4 weeks",
            "semester_level": 2,
            "labs": ["lab_password_cracking", "lab_hash_cracking_advanced", "lab_steganography"]
        },
        {
            "title": "Penetration Testing Basics",
            "description": "Learn offensive security techniques and ethical hacking methodologies.",
            "category": "Penetration Testing",
            "difficulty": "Intermediate",
            "duration": "6 weeks",
            "semester_level": 2,
            "labs": ["lab_network_scanning", "lab_reverse_shell", "lab_metasploit_basics"]
        },
        {
            "title": "Incident Response & Forensics",
            "description": "Master incident detection, log analysis, and digital forensics.",
            "category": "Incident Response",
            "difficulty": "Intermediate",
            "duration": "5 weeks",
            "semester_level": 2,
            "labs": ["lab_log_analysis", "lab_forensics_basics", "lab_wireshark_analysis"]
        },
        {
            "title": "Advanced Web Exploitation",
            "description": "Deep dive into advanced web attacks and bypass techniques.",
            "category": "Web Security",
            "difficulty": "Advanced",
            "duration": "6 weeks",
            "semester_level": 3,
            "labs": ["lab_sql_injection", "lab_xss_basics", "lab_web_recon"]
        },
        {
            "title": "Linux Privilege Escalation",
            "description": "Advanced techniques for escalating privileges on Linux systems.",
            "category": "Linux Fundamentals",
            "difficulty": "Advanced",
            "duration": "4 weeks",
            "semester_level": 3,
            "labs": ["lab_linux_101", "lab_privilege_escalation"]
        },
        {
            "title": "Network Traffic Analysis",
            "description": "Advanced packet analysis and network forensics techniques.",
            "category": "Network Security",
            "difficulty": "Advanced",
            "duration": "5 weeks",
            "semester_level": 3,
            "labs": ["lab_wireshark_analysis", "lab_firewall_config"]
        },
        {
            "title": "Metasploit Mastery",
            "description": "Comprehensive training on the Metasploit Framework for penetration testing.",
            "category": "Penetration Testing",
            "difficulty": "Advanced",
            "duration": "6 weeks",
            "semester_level": 3,
            "labs": ["lab_metasploit_basics", "lab_reverse_shell"]
        },
        {
            "title": "Digital Forensics Deep Dive",
            "description": "Advanced digital forensics and malware analysis techniques.",
            "category": "Incident Response",
            "difficulty": "Advanced",
            "duration": "7 weeks",
            "semester_level": 3,
            "labs": ["lab_forensics_basics", "lab_log_analysis"]
        },
        {
            "title": "Cryptographic Attacks",
            "description": "Study cryptographic weaknesses and advanced cracking techniques.",
            "category": "Cryptography",
            "difficulty": "Advanced",
            "duration": "5 weeks",
            "semester_level": 3,
            "labs": ["lab_hash_cracking_advanced", "lab_steganography", "lab_password_cracking"]
        },
        {
            "title": "Red Team Operations",
            "description": "Complete red team methodology from reconnaissance to post-exploitation.",
            "category": "Penetration Testing",
            "difficulty": "Advanced",
            "duration": "8 weeks",
            "semester_level": 3,
            "labs": ["lab_network_scanning", "lab_web_recon", "lab_reverse_shell", "lab_metasploit_basics", "lab_privilege_escalation"]
        },
        {
            "title": "Security Operations Center (SOC) Analyst",
            "description": "Train to become a SOC analyst with log analysis and incident response.",
            "category": "Incident Response",
            "difficulty": "Intermediate",
            "duration": "6 weeks",
            "semester_level": 2,
            "labs": ["lab_log_analysis", "lab_wireshark_analysis", "lab_forensics_basics"]
        },
        {
            "title": "Secure Network Architecture",
            "description": "Design and implement secure network infrastructures.",
            "category": "Network Security",
            "difficulty": "Intermediate",
            "duration": "5 weeks",
            "semester_level": 2,
            "labs": ["lab_firewall_config", "lab_network_scanning"]
        }
    ]

    for course_data in courses_data:
        labs = course_data.pop("labs", [])
        existing = db.query(Course).filter(Course.title == course_data["title"]).first()

        if not existing:
            course = Course(**course_data)
            db.add(course)
            db.commit()
            db.refresh(course)
        else:
            course = existing

        # Link labs to course (always check and add missing links)
        for order, lab_id in enumerate(labs):
            existing_link = db.query(CourseLab).filter(
                CourseLab.course_id == course.id,
                CourseLab.lab_id == lab_id
            ).first()

            if not existing_link:
                course_lab = CourseLab(
                    course_id=course.id,
                    lab_id=lab_id,
                    order=order
                )
                db.add(course_lab)

    # Create assessment quizzes
    quizzes_data = [
        {
            "title": "Network Security Assessment",
            "description": "Test your knowledge of network security concepts",
            "category": "Network Security",
            "questions": [
                {
                    "question": "What port does HTTPS typically use?",
                    "option_a": "80",
                    "option_b": "443",
                    "option_c": "22",
                    "option_d": "21",
                    "correct_answer": "b"
                },
                {
                    "question": "Which device inspects traffic at the application layer?",
                    "option_a": "Router",
                    "option_b": "Switch",
                    "option_c": "Firewall",
                    "option_d": "WAF",
                    "correct_answer": "d"
                },
                {
                    "question": "What does IDS stand for?",
                    "option_a": "Internet Data System",
                    "option_b": "Intrusion Detection System",
                    "option_c": "Internal Defense Service",
                    "option_d": "Integrated Data Security",
                    "correct_answer": "b"
                }
            ]
        },
        {
            "title": "Cryptography Assessment",
            "description": "Test your cryptography knowledge",
            "category": "Cryptography",
            "questions": [
                {
                    "question": "Which is a symmetric encryption algorithm?",
                    "option_a": "RSA",
                    "option_b": "AES",
                    "option_c": "ECC",
                    "option_d": "DSA",
                    "correct_answer": "b"
                },
                {
                    "question": "What is the output size of SHA-256?",
                    "option_a": "128 bits",
                    "option_b": "160 bits",
                    "option_c": "256 bits",
                    "option_d": "512 bits",
                    "correct_answer": "c"
                },
                {
                    "question": "Which protocol provides end-to-end encryption for web traffic?",
                    "option_a": "HTTP",
                    "option_b": "FTP",
                    "option_c": "TLS",
                    "option_d": "SMTP",
                    "correct_answer": "c"
                }
            ]
        },
        {
            "title": "Linux Fundamentals Assessment",
            "description": "Test your Linux command line knowledge",
            "category": "Linux Fundamentals",
            "questions": [
                {
                    "question": "Which command shows current directory?",
                    "option_a": "cd",
                    "option_b": "pwd",
                    "option_c": "ls",
                    "option_d": "dir",
                    "correct_answer": "b"
                },
                {
                    "question": "What permission does chmod 755 give to the owner?",
                    "option_a": "Read only",
                    "option_b": "Read and write",
                    "option_c": "Read, write, execute",
                    "option_d": "Execute only",
                    "correct_answer": "c"
                },
                {
                    "question": "Which command finds files by name?",
                    "option_a": "grep",
                    "option_b": "find",
                    "option_c": "locate",
                    "option_d": "Both b and c",
                    "correct_answer": "d"
                }
            ]
        }
    ]

    for quiz_data in quizzes_data:
        existing = db.query(Quiz).filter(Quiz.title == quiz_data["title"]).first()
        if not existing:
            quiz = Quiz(
                title=quiz_data["title"],
                description=quiz_data["description"],
                category=quiz_data["category"]
            )
            db.add(quiz)
            db.commit()
            db.refresh(quiz)

            for q in quiz_data["questions"]:
                question = QuizQuestion(
                    quiz_id=quiz.id,
                    question=q["question"],
                    option_a=q["option_a"],
                    option_b=q["option_b"],
                    option_c=q["option_c"],
                    option_d=q["option_d"],
                    correct_answer=q["correct_answer"],
                    points=10
                )
                db.add(question)

    db.commit()

    return {"message": "Sample data initialized"}
