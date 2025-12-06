from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class CourseModule(Base):
    """Course modules/sections - organizes course content"""
    __tablename__ = "course_modules"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"))
    title = Column(String, nullable=False)
    description = Column(Text)
    order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    contents = relationship("CourseContent", back_populates="module", cascade="all, delete-orphan", order_by="CourseContent.order")


class CourseContent(Base):
    """Individual content items within a module"""
    __tablename__ = "course_contents"
    
    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("course_modules.id", ondelete="CASCADE"))
    
    # Content type: video, pdf, document, text, quiz, lab_link
    content_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    
    # For video/pdf/document uploads
    file_url = Column(String, nullable=True)
    file_name = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)  # in bytes
    
    # For text/markdown content
    text_content = Column(Text, nullable=True)
    
    # For video content
    video_duration = Column(Integer, nullable=True)  # in seconds
    video_thumbnail = Column(String, nullable=True)
    
    # For quiz content
    quiz_data = Column(JSON, nullable=True)  # Questions and answers
    
    # For lab links
    linked_lab_id = Column(String, nullable=True)
    
    # Ordering and status
    order = Column(Integer, default=0)
    is_required = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    
    # Metadata
    estimated_duration = Column(Integer, nullable=True)  # in minutes
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    module = relationship("CourseModule", back_populates="contents")


class CourseResource(Base):
    """Additional downloadable resources for a course"""
    __tablename__ = "course_resources"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"))
    
    title = Column(String, nullable=False)
    description = Column(Text)
    file_url = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    file_type = Column(String)  # pdf, zip, doc, etc.
    file_size = Column(Integer)  # in bytes
    
    download_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class UserContentProgress(Base):
    """Track user progress through course content"""
    __tablename__ = "user_content_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    content_id = Column(Integer, ForeignKey("course_contents.id", ondelete="CASCADE"))
    
    completed = Column(Boolean, default=False)
    progress_percent = Column(Integer, default=0)  # For videos
    time_spent = Column(Integer, default=0)  # in seconds
    
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
