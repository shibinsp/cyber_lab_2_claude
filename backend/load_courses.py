"""
Load Course Data from JSON Files into Database
"""

import json
import os
from pathlib import Path
from app.database import SessionLocal
from app.models.user import Course, CourseLab

def load_courses_from_json():
    """Load all course JSON files into the database"""
    db = SessionLocal()
    
    try:
        courses_dir = Path(__file__).parent / "courses"
        
        if not courses_dir.exists():
            print(f"❌ Courses directory not found: {courses_dir}")
            return
        
        # Get all JSON files
        json_files = sorted(courses_dir.glob("course_*.json"))
        
        if not json_files:
            print(f"❌ No course JSON files found in {courses_dir}")
            return
        
        print(f"\n📚 Found {len(json_files)} course files")
        print("=" * 70)
        
        loaded_count = 0
        skipped_count = 0
        
        for json_file in json_files:
            try:
                with open(json_file, 'r') as f:
                    course_data = json.load(f)
                
                # Check if course already exists by title
                existing_course = db.query(Course).filter(
                    Course.title == course_data.get('title')
                ).first()
                
                if existing_course:
                    print(f"⏭️  Skipped: {course_data.get('title')} (already exists)")
                    skipped_count += 1
                    continue
                
                # Create course
                course = Course(
                    title=course_data.get('title'),
                    description=course_data.get('description', ''),
                    category=course_data.get('category', 'General'),
                    difficulty=course_data.get('difficulty', 'Beginner'),
                    duration=course_data.get('duration', '4 weeks'),
                    image_url=course_data.get('image_url'),
                    semester_level=course_data.get('semester_level', 1),
                    is_active=True
                )
                
                db.add(course)
                db.flush()  # Get the course ID
                
                # Add associated labs if present
                if 'labs' in course_data:
                    for idx, lab_id in enumerate(course_data['labs']):
                        course_lab = CourseLab(
                            course_id=course.id,
                            lab_id=lab_id,
                            order=idx
                        )
                        db.add(course_lab)
                
                db.commit()
                print(f"✅ Loaded: {course_data.get('title')} (Semester {course.semester_level})")
                loaded_count += 1
                
            except Exception as e:
                print(f"❌ Error loading {json_file.name}: {str(e)}")
                db.rollback()
                continue
        
        print("=" * 70)
        print(f"\n📊 Summary:")
        print(f"   ✅ Loaded: {loaded_count} courses")
        print(f"   ⏭️  Skipped: {skipped_count} courses (already exist)")
        print(f"   📝 Total in database: {db.query(Course).count()} courses")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("🚀 Loading Courses from JSON Files")
    print("=" * 70)
    load_courses_from_json()
    print("\n✅ Course loading completed!")
    print("=" * 70 + "\n")

