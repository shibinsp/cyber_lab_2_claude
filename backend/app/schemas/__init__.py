from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    semester: int
    department: str = "Computer Science"

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    semester: int
    department: str
    role: str
    quiz_completed: bool

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class ProgressUpdate(BaseModel):
    lab_id: str
    current_step: int
    completed: Optional[bool] = False
    flag_submitted: Optional[str] = None

class ProgressResponse(BaseModel):
    lab_id: str
    current_step: int
    completed: bool
    completed_at: Optional[datetime]

# Course schemas
class CourseCreate(BaseModel):
    title: str
    description: str
    category: str
    difficulty: str
    duration: str
    image_url: Optional[str] = None
    semester_level: int = 1

class CourseResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    difficulty: str
    duration: str
    image_url: Optional[str]
    semester_level: int
    is_active: bool

class CourseLabCreate(BaseModel):
    course_id: int
    lab_id: str
    order: int = 0

# Quiz schemas
class QuizQuestionCreate(BaseModel):
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    points: int = 10

class QuizQuestionResponse(BaseModel):
    id: int
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    points: int

class QuizCreate(BaseModel):
    title: str
    description: str
    category: str
    questions: List[QuizQuestionCreate]

class QuizResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    questions: List[QuizQuestionResponse]

class QuizSubmission(BaseModel):
    quiz_id: int
    answers: dict  # {question_id: "a/b/c/d"}

class QuizResultResponse(BaseModel):
    quiz_id: int
    score: int
    max_score: int
    percentage: float
    category: str

# Enrollment schemas
class EnrollmentCreate(BaseModel):
    course_id: int

class EnrollmentResponse(BaseModel):
    id: int
    course_id: int
    enrolled_at: datetime
    completed: bool
    progress: float
    course: CourseResponse

# Dashboard schemas
class DashboardStats(BaseModel):
    total_courses: int
    enrolled_courses: int
    completed_labs: int
    total_labs: int
    quiz_scores: List[QuizResultResponse]
    recommended_courses: List[CourseResponse]

# Admin schemas
class AdminSettingUpdate(BaseModel):
    key: str
    value: str

class UserAdminResponse(BaseModel):
    id: int
    username: str
    email: str
    semester: int
    department: str
    role: str
    quiz_completed: bool
    created_at: datetime
