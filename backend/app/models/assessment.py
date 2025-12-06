"""
Course Assessment Model
Stores assessment configuration for each course
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, JSON, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class CourseAssessment(Base):
    """Assessment configuration for a course"""
    __tablename__ = "course_assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), unique=True)
    
    # Assessment settings
    title = Column(String, default="Course Assessment")
    description = Column(Text, nullable=True)
    
    # Pass criteria
    pass_percentage = Column(Integer, default=70)  # Admin selects: 50, 60, 70, 80, 90
    max_attempts = Column(Integer, default=3)  # Admin selects: 1, 2, 3, 5, unlimited(-1)
    
    # Question configuration
    topics = Column(JSON)  # List of topics for question generation
    num_questions = Column(Integer, default=10)
    difficulty = Column(String, default="intermediate")  # easy, intermediate, hard
    time_limit = Column(Integer, nullable=True)  # Time limit in minutes (null = no limit)
    
    # Generated questions (cached)
    questions = Column(JSON, nullable=True)  # Cached generated questions
    
    # Status
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class UserAssessmentAttempt(Base):
    """Track user assessment attempts"""
    __tablename__ = "user_assessment_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    assessment_id = Column(Integer, ForeignKey("course_assessments.id", ondelete="CASCADE"))
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"))
    
    # Attempt details
    attempt_number = Column(Integer, default=1)
    score = Column(Integer, default=0)
    max_score = Column(Integer, default=0)
    percentage = Column(Float, default=0.0)
    passed = Column(Boolean, default=False)
    
    # Questions and answers for this attempt
    questions_snapshot = Column(JSON)  # Questions shown in this attempt
    answers = Column(JSON)  # User's answers
    
    # Timing
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    time_taken = Column(Integer, nullable=True)  # Seconds
