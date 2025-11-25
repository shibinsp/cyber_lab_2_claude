"""
Database Initialization Script
Creates all tables and optionally seeds with sample data
"""

import sys
from sqlalchemy import text
from app.database import engine, Base, SessionLocal
from app.models.user import User, Course, CourseLab, Enrollment, Quiz, QuizQuestion, UserQuizResult, AdminSettings, CourseProgress
from app.models.progress import LabProgress
from app.utils.auth import get_password_hash

def init_database(seed_data=False):
    print("=" * 70)
    print("🚀 ISC Cyber Range - Database Initialization")
    print("=" * 70)
    
    try:
        # Create all tables
        print("\n📋 Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created successfully!")
        
        # List created tables
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"\n📊 Created Tables ({len(tables)}):")
        for table in tables:
            print(f"   • {table}")
        
        if seed_data:
            print("\n🌱 Seeding database with sample data...")
            seed_sample_data()
        
        print("\n" + "=" * 70)
        print("✅ Database initialization completed successfully!")
        print("=" * 70)
        return True
        
    except Exception as e:
        print(f"\n❌ Initialization failed!")
        print(f"   Error: {str(e)}")
        print("\n" + "=" * 70)
        return False

def seed_sample_data():
    """Seed database with sample data for testing"""
    db = SessionLocal()
    
    try:
        # Create admin user
        admin = User(
            username="admin",
            email="admin@cyberlab.com",
            hashed_password=get_password_hash("admin123"),
            semester=0,
            department="Administration",
            role="admin",
            quiz_completed=True
        )
        db.add(admin)
        
        # Create sample student
        student = User(
            username="student",
            email="student@cyberlab.com",
            hashed_password=get_password_hash("student123"),
            semester=3,
            department="Computer Science",
            role="student",
            quiz_completed=False
        )
        db.add(student)
        
        # Create sample courses
        courses_data = [
            {
                "title": "Introduction to Cybersecurity",
                "description": "Learn the fundamentals of cybersecurity including CIA triad, threat landscape, and basic security principles.",
                "category": "Fundamentals",
                "difficulty": "Beginner",
                "duration": "4 weeks",
                "semester_level": 1
            },
            {
                "title": "Network Security",
                "description": "Explore network protocols, firewalls, IDS/IPS, and network security best practices.",
                "category": "Network Security",
                "difficulty": "Intermediate",
                "duration": "6 weeks",
                "semester_level": 2
            },
            {
                "title": "Web Application Security",
                "description": "Master web vulnerabilities including SQL injection, XSS, CSRF, and secure coding practices.",
                "category": "Web Security",
                "difficulty": "Intermediate",
                "duration": "6 weeks",
                "semester_level": 3
            },
            {
                "title": "Cryptography",
                "description": "Understand encryption algorithms, hash functions, digital signatures, and PKI.",
                "category": "Cryptography",
                "difficulty": "Advanced",
                "duration": "8 weeks",
                "semester_level": 4
            }
        ]
        
        for course_data in courses_data:
            course = Course(**course_data)
            db.add(course)
        
        db.commit()
        print("   ✅ Sample users created (admin/admin123, student/student123)")
        print("   ✅ Sample courses created")
        
    except Exception as e:
        print(f"   ⚠️  Seeding warning: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # Check for --seed flag
    seed = "--seed" in sys.argv
    
    if seed:
        print("\n🌱 Will seed database with sample data\n")
    
    success = init_database(seed_data=seed)
    
    if success and seed:
        print("\n📝 Sample Credentials:")
        print("   Admin:   username=admin    password=admin123")
        print("   Student: username=student  password=student123")
    
    sys.exit(0 if success else 1)

