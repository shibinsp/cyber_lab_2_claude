from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Float, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    vm_password = Column(String, nullable=True)  # Password for VM access (stored encrypted)
    semester = Column(Integer)
    department = Column(String, default="Computer Science")
    role = Column(String, default="student")  # student, admin
    quiz_completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    quiz_results = relationship("UserQuizResult", back_populates="user")
    enrollments = relationship("Enrollment", back_populates="user")

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    category = Column(String)  # Network Security, Cryptography, etc.
    difficulty = Column(String)  # Beginner, Intermediate, Advanced
    duration = Column(String)
    image_url = Column(String, nullable=True)
    semester_level = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    labs = relationship("CourseLab", back_populates="course")
    enrollments = relationship("Enrollment", back_populates="course")

class CourseLab(Base):
    __tablename__ = "course_labs"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    lab_id = Column(String, ForeignKey("labs.id"))  # References the labs table
    order = Column(Integer, default=0)

    course = relationship("Course", back_populates="labs")
    lab = relationship("Lab", back_populates="course_associations")

class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())
    completed = Column(Boolean, default=False)
    progress = Column(Float, default=0.0)

    user = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(Text)
    category = Column(String)  # Maps to course categories
    is_active = Column(Boolean, default=True)

    questions = relationship("QuizQuestion", back_populates="quiz")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    question = Column(Text)
    option_a = Column(String)
    option_b = Column(String)
    option_c = Column(String)
    option_d = Column(String)
    correct_answer = Column(String)  # a, b, c, d
    points = Column(Integer, default=10)

    quiz = relationship("Quiz", back_populates="questions")

class UserQuizResult(Base):
    __tablename__ = "user_quiz_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    score = Column(Integer)
    max_score = Column(Integer)
    percentage = Column(Float)
    completed_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="quiz_results")

class AssessmentQuizAttempt(Base):
    """Store assessment quiz attempts with questions and answers"""
    __tablename__ = "assessment_quiz_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    attempt_number = Column(Integer, default=1)
    
    # Questions and answers for this attempt
    questions = Column(JSON)  # JSON - stored quiz questions
    answers = Column(JSON, nullable=True)  # JSON - user's answers
    
    # Scores
    total_score = Column(Integer, default=0)
    max_score = Column(Integer, default=0)
    percentage = Column(Float, default=0.0)
    
    # Category scores (JSON)
    category_scores = Column(JSON, nullable=True)  # JSON - scores per category
    
    # Timing
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

class AdminSettings(Base):
    __tablename__ = "admin_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(Text)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class CourseProgress(Base):
    __tablename__ = "course_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    current_module = Column(Integer, default=0)
    completed_modules = Column(String, default="[]")  # JSON array of completed module IDs
    assessment_attempts = Column(Integer, default=0)
    assessment_score = Column(Float, nullable=True)
    last_attempt_at = Column(DateTime(timezone=True), nullable=True)
    passed = Column(Boolean, default=False)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    quiz_questions = Column(Text, nullable=True)  # JSON - stored quiz questions
    draft_answers = Column(Text, nullable=True)  # JSON - student's draft answers
