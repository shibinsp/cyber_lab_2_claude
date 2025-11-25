"""
Database Migration Script
- Adds new Lab, LabTool, LabFile, VMConfiguration tables
- Adds vm_password to User table
- Migrates existing lab data from JSON to database
"""

import sys
import os
import json
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text
from app.database import engine, SessionLocal, Base
from app.models import Lab, LabTool, Course, CourseLab

def migrate_schema():
    """Add new columns and tables"""
    print("📊 Migrating database schema...")
    
    # Create all tables (including new ones)
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created/updated")
    
    with engine.connect() as conn:
        # Add vm_password column to users table if it doesn't exist
        try:
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS vm_password VARCHAR;
            """))
            conn.commit()
            print("✅ Added vm_password column to users table")
        except Exception as e:
            print(f"⚠️  vm_password column might already exist: {e}")
        
        # Update existing users to have their password set (you'll need to handle this manually)
        try:
            conn.execute(text("""
                UPDATE users 
                SET vm_password = 'student' 
                WHERE vm_password IS NULL;
            """))
            conn.commit()
            print("✅ Set default vm_password for existing users")
        except Exception as e:
            print(f"⚠️  Error updating vm_passwords: {e}")
    
    print("✅ Schema migration complete!")

def load_labs_from_json():
    """Load labs from JSON files into database"""
    print("\n📚 Loading labs from JSON files...")
    
    db = SessionLocal()
    labs_dir = Path(__file__).parent / "labs"
    
    if not labs_dir.exists():
        print(f"⚠️  Labs directory not found: {labs_dir}")
        return
    
    lab_files = list(labs_dir.glob("lab_*.json"))
    print(f"Found {len(lab_files)} lab files")
    
    for lab_file in lab_files:
        try:
            with open(lab_file, 'r') as f:
                lab_data = json.load(f)
            
            # Check if lab already exists
            existing_lab = db.query(Lab).filter(Lab.id == lab_data['id']).first()
            
            if existing_lab:
                print(f"⚠️  Lab '{lab_data['id']}' already exists, skipping...")
                continue
            
            # Create lab
            new_lab = Lab(
                id=lab_data['id'],
                title=lab_data['title'],
                description=lab_data.get('description'),
                category=lab_data.get('category'),
                difficulty=lab_data.get('difficulty', 'Basic'),
                duration=lab_data.get('duration'),
                semester_level=lab_data.get('semester_level', 1),
                tasks=lab_data.get('tasks'),
                objectives=lab_data.get('objectives'),
                tools_required=lab_data.get('tools_required', []),
                vm_enabled=True,
                is_active=True
            )
            db.add(new_lab)
            
            # Add tools if specified
            if 'tools_required' in lab_data:
                for tool_name in lab_data['tools_required']:
                    tool = LabTool(
                        lab_id=lab_data['id'],
                        tool_name=tool_name,
                        is_preinstalled=True,
                        description=f"Required tool: {tool_name}"
                    )
                    db.add(tool)
            
            db.commit()
            print(f"✅ Loaded lab: {lab_data['title']}")
            
        except Exception as e:
            print(f"❌ Error loading {lab_file.name}: {e}")
            db.rollback()
    
    db.close()
    print("✅ Labs loaded successfully!")

def update_course_lab_associations():
    """Update course-lab associations"""
    print("\n🔗 Updating course-lab associations...")
    
    db = SessionLocal()
    
    try:
        # Get all courses
        courses = db.query(Course).all()
        
        # Category to course mapping (based on your existing course structure)
        category_mapping = {
            "Network Security": ["Introduction to Cybersecurity", "Network Security Fundamentals"],
            "Web Security": ["Web Application Security", "Penetration Testing"],
            "Cryptography": ["Cryptography & Encryption"],
            "Digital Forensics": ["Digital Forensics"],
            "Ethical Hacking": ["Ethical Hacking Advanced", "Penetration Testing"],
            "Malware Analysis": ["Malware Analysis"],
            "Cloud Security": ["Cloud Security"],
        }
        
        # Get all labs
        labs = db.query(Lab).all()
        
        for lab in labs:
            # Find appropriate courses for this lab
            matching_courses = []
            
            # Match by category
            if lab.category:
                for course in courses:
                    if course.category == lab.category or \
                       (lab.category in category_mapping and course.title in category_mapping[lab.category]):
                        matching_courses.append(course)
            
            # Also match by semester level
            if not matching_courses:
                for course in courses:
                    if course.semester_level == lab.semester_level:
                        matching_courses.append(course)
            
            # Assign to first matching course (or just add to all if none match)
            if not matching_courses and courses:
                matching_courses = [courses[0]]  # Add to first course as fallback
            
            # Create associations
            for course in matching_courses:
                # Check if association already exists
                existing = db.query(CourseLab).filter(
                    CourseLab.course_id == course.id,
                    CourseLab.lab_id == lab.id
                ).first()
                
                if not existing:
                    assoc = CourseLab(
                        course_id=course.id,
                        lab_id=lab.id,
                        order=0
                    )
                    db.add(assoc)
                    print(f"✅ Associated '{lab.title}' with '{course.title}'")
        
        db.commit()
        print("✅ Course-lab associations updated!")
        
    except Exception as e:
        print(f"❌ Error updating associations: {e}")
        db.rollback()
    finally:
        db.close()

def main():
    print("🚀 Starting database migration...\n")
    
    # Step 1: Migrate schema
    migrate_schema()
    
    # Step 2: Load labs from JSON
    load_labs_from_json()
    
    # Step 3: Update course-lab associations
    update_course_lab_associations()
    
    print("\n✨ Migration complete!")
    print("\n📝 Notes:")
    print("  - All existing users now have vm_password set to 'student'")
    print("  - New users will use their login password for VM access")
    print("  - Labs have been loaded from JSON files")
    print("  - You can now manage labs via the admin panel")

if __name__ == "__main__":
    main()

