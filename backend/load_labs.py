"""
Load Labs and Associate with Courses
"""

import json
import os
from pathlib import Path
from app.database import SessionLocal
from app.models.user import Course, CourseLab

def load_labs_into_courses():
    """Load all labs and associate them with courses based on category and semester"""
    db = SessionLocal()
    
    try:
        labs_dir = Path(__file__).parent / "labs"
        
        if not labs_dir.exists():
            print(f"❌ Labs directory not found: {labs_dir}")
            return
        
        # Get all lab JSON files
        lab_files = sorted(labs_dir.glob("lab_*.json"))
        
        if not lab_files:
            print(f"❌ No lab JSON files found in {labs_dir}")
            return
        
        print("=" * 70)
        print(f"🔬 Loading {len(lab_files)} labs and associating with courses...")
        print("=" * 70)
        
        # First, clear existing course_lab associations
        db.query(CourseLab).delete()
        db.commit()
        print("🗑️  Cleared existing course-lab associations")
        
        loaded_count = 0
        
        # Category to course title keywords mapping
        category_mapping = {
            "Linux Fundamentals": ["Linux", "Privilege Escalation"],
            "Network Security": ["Network Security", "Network Traffic", "Network Architecture"],
            "Web Security": ["Web Application", "Web Exploitation"],
            "Cryptography": ["Cryptography", "Cryptographic", "Hash"],
            "Penetration Testing": ["Metasploit", "Penetration Testing", "Red Team"],
            "Incident Response": ["Incident Response", "Forensics", "SOC"]
        }
        
        # Special handling for beginner/fundamental courses
        beginner_lab_ids = ["lab_linux_101", "lab_log_analysis", "lab_web_recon", "lab_xss_basics"]
        
        for lab_file in lab_files:
            try:
                with open(lab_file, 'r') as f:
                    lab_data = json.load(f)
                
                lab_id = lab_data.get('id')
                lab_title = lab_data.get('title')
                lab_category = lab_data.get('category', 'General')
                lab_semester = lab_data.get('semester_level', 1)
                
                print(f"\n📝 Processing: {lab_title}")
                print(f"   Category: {lab_category}, Semester: {lab_semester}")
                
                # Find matching courses
                matching_courses = []
                
                # Method 1: Match by category and semester
                courses_by_category = db.query(Course).filter(
                    Course.category == lab_category,
                    Course.is_active == True
                ).all()
                
                if courses_by_category:
                    # Prefer courses with matching semester level
                    for course in courses_by_category:
                        if course.semester_level == lab_semester:
                            matching_courses.append((course, 0))  # Priority 0
                        else:
                            matching_courses.append((course, 1))  # Priority 1
                
                # Method 2: Match by course name keywords if category didn't work well
                if not matching_courses:
                    # Try to match based on lab category to course title
                    course_keywords = category_mapping.get(lab_category, [])
                    for keyword in course_keywords:
                        course = db.query(Course).filter(
                            Course.title.ilike(f"%{keyword}%"),
                            Course.is_active == True
                        ).first()
                        if course and (course, 0) not in matching_courses:
                            matching_courses.append((course, 2))  # Priority 2
                
                # Method 3: Associate beginner labs with "Introduction to Cybersecurity" course
                if lab_id in beginner_lab_ids and lab_semester == 1:
                    intro_course = db.query(Course).filter(
                        Course.title == "Introduction to Cybersecurity",
                        Course.is_active == True
                    ).first()
                    if intro_course and (intro_course, 0) not in matching_courses:
                        matching_courses.append((intro_course, 0))  # High priority for intro course
                
                # Sort by priority and take best matches
                matching_courses.sort(key=lambda x: x[1])
                
                if matching_courses:
                    associated_count = 0
                    for course, priority in matching_courses[:3]:  # Associate with up to 3 courses
                        # Check if association already exists
                        existing = db.query(CourseLab).filter(
                            CourseLab.course_id == course.id,
                            CourseLab.lab_id == lab_id
                        ).first()
                        
                        if not existing:
                            course_lab = CourseLab(
                                course_id=course.id,
                                lab_id=lab_id,
                                order=associated_count
                            )
                            db.add(course_lab)
                            associated_count += 1
                            print(f"   ✅ Associated with: {course.title}")
                    
                    db.commit()
                    loaded_count += 1
                else:
                    print(f"   ⚠️  No matching courses found")
                
            except Exception as e:
                print(f"   ❌ Error processing {lab_file.name}: {e}")
                db.rollback()
                continue
        
        print("\n" + "=" * 70)
        print(f"✅ Successfully associated {loaded_count} labs with courses")
        print("=" * 70)
        
        # Summary
        total_associations = db.query(CourseLab).count()
        print(f"\n📊 Total course-lab associations in database: {total_associations}")
        
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    load_labs_into_courses()

