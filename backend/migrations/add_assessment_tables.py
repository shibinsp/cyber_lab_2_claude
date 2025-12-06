"""
Migration script to add assessment tables
Run this script to create the course_assessments and user_assessment_attempts tables
"""
import sys
sys.path.append('..')

from app.database import engine, Base
from app.models.assessment import CourseAssessment, UserAssessmentAttempt

def run_migration():
    print("Creating assessment tables...")
    
    # Create only the new tables
    CourseAssessment.__table__.create(engine, checkfirst=True)
    UserAssessmentAttempt.__table__.create(engine, checkfirst=True)
    
    print("✅ Assessment tables created successfully!")
    print("  - course_assessments")
    print("  - user_assessment_attempts")

if __name__ == "__main__":
    run_migration()
