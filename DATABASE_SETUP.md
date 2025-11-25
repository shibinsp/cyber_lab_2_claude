# 🗄️ PostgreSQL Database Configuration

## Database Connection Details

The ISC Cyber Range application is now connected to PostgreSQL with the following configuration:

```
Database: cyberlab
Host: localhost
Port: 5432
Username: postgress
Password: shibin
```

## 📊 Database Schema

The application uses **10 database tables** to manage the cybersecurity learning platform:

### Core Tables

#### 1. **users**
Stores user accounts with authentication and profile information
- `id` (Primary Key)
- `username` (Unique)
- `email` (Unique)
- `hashed_password` (bcrypt)
- `semester` (Student's current semester)
- `department` (e.g., Computer Science)
- `role` (student/admin)
- `quiz_completed` (Boolean flag)
- `created_at` (Timestamp)

#### 2. **courses**
Cybersecurity courses catalog
- `id` (Primary Key)
- `title`
- `description`
- `category` (Network Security, Cryptography, etc.)
- `difficulty` (Beginner, Intermediate, Advanced)
- `duration`
- `image_url`
- `semester_level` (Recommended semester)
- `is_active` (Boolean flag)
- `created_at` (Timestamp)

#### 3. **course_labs**
Links courses to specific lab exercises
- `id` (Primary Key)
- `course_id` (Foreign Key → courses)
- `lab_id` (References JSON lab file)
- `order` (Sequence in course)

#### 4. **enrollments**
Student course enrollments
- `id` (Primary Key)
- `user_id` (Foreign Key → users)
- `course_id` (Foreign Key → courses)
- `enrolled_at` (Timestamp)
- `completed` (Boolean)
- `progress` (Float 0.0-1.0)

#### 5. **lab_progress**
Tracks individual lab completion
- `id` (Primary Key)
- `user_id` (Foreign Key → users)
- `lab_id` (String identifier)
- `current_step` (Integer)
- `completed` (Boolean)
- `flag_submitted` (Capture-the-flag submission)
- `completed_at` (Timestamp)
- `updated_at` (Timestamp)

#### 6. **course_progress**
Detailed module-level progress tracking
- `id` (Primary Key)
- `user_id` (Foreign Key → users)
- `course_id` (Foreign Key → courses)
- `current_module` (Integer)
- `completed_modules` (JSON array)
- `assessment_attempts` (Integer)
- `assessment_score` (Float)
- `last_attempt_at` (Timestamp)
- `passed` (Boolean)
- `started_at` (Timestamp)
- `completed_at` (Timestamp)
- `quiz_questions` (JSON)
- `draft_answers` (JSON)

### Quiz & Assessment Tables

#### 7. **quizzes**
Quiz definitions
- `id` (Primary Key)
- `title`
- `description`
- `category` (Maps to course categories)
- `is_active` (Boolean)

#### 8. **quiz_questions**
Individual quiz questions
- `id` (Primary Key)
- `quiz_id` (Foreign Key → quizzes)
- `question` (Text)
- `option_a`, `option_b`, `option_c`, `option_d`
- `correct_answer` (a/b/c/d)
- `points` (Default: 10)

#### 9. **user_quiz_results**
Stores quiz attempt results
- `id` (Primary Key)
- `user_id` (Foreign Key → users)
- `quiz_id` (Foreign Key → quizzes)
- `score` (Integer)
- `max_score` (Integer)
- `percentage` (Float)
- `completed_at` (Timestamp)

### Administration Tables

#### 10. **admin_settings**
Platform configuration key-value store
- `id` (Primary Key)
- `key` (Unique string)
- `value` (Text)
- `updated_at` (Timestamp)

## 🔐 Sample Credentials

The database has been seeded with test accounts:

### Admin Account
```
Username: admin
Password: admin123
Email: admin@cyberlab.com
```

### Student Account
```
Username: student
Password: student123
Email: student@cyberlab.com
Semester: 3
```

### Sample Courses
4 courses have been pre-loaded:
1. **Introduction to Cybersecurity** (Beginner, Semester 1)
2. **Network Security** (Intermediate, Semester 2)
3. **Web Application Security** (Intermediate, Semester 3)
4. **Cryptography** (Advanced, Semester 4)

## 🚀 Quick Start Commands

### Test Database Connection
```bash
cd backend
source venv/bin/activate
python test_db_connection.py
```

### Initialize/Reset Database
```bash
# Create tables only
python init_database.py

# Create tables and seed with sample data
python init_database.py --seed
```

### Start Backend Server
```bash
uvicorn app.main:app --reload
```

The API will be available at: `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- Alternative Docs: `http://localhost:8000/redoc`

### Start Frontend (in another terminal)
```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at: `http://localhost:5173`

## 🔧 Database Configuration Files

### 1. `/root/cyber_lab_2_claude/backend/app/config.py`
Contains database connection string and security configuration:
```python
DATABASE_URL = "postgresql://postgress:shibin@localhost:5432/cyberlab"
SECRET_KEY = "isc-cyber-range-secret-key-2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours
```

### 2. `/root/cyber_lab_2_claude/backend/app/database.py`
SQLAlchemy database engine configuration:
- Creates database engine
- Provides session management
- Implements dependency injection for FastAPI

## 📚 API Endpoints

The backend provides the following router groups:

### Authentication (`/auth`)
- `POST /auth/register` - User registration
- `POST /auth/login` - JWT authentication

### Labs (`/labs`)
- Lab exercises management
- Progress tracking
- Flag submission

### Courses (`/courses`)
- Course catalog
- Enrollment management
- Course-lab associations

### Users (`/users`)
- User profile management
- User-specific data

### Quizzes (`/quiz`)
- Quiz retrieval
- Answer submission
- Score calculation

### Dashboard (`/dashboard`)
- Student statistics
- Progress overview
- Recommended courses

### Admin (`/admin`)
- User management
- System configuration
- Platform settings

## 🔄 Database Relationships

```
users ──┬─→ enrollments ──→ courses ──→ course_labs
        ├─→ lab_progress
        ├─→ course_progress
        └─→ user_quiz_results ──→ quizzes ──→ quiz_questions
```

## 🛠️ Troubleshooting

### Connection Issues
If you encounter database connection errors:

1. **Check PostgreSQL is running:**
   ```bash
   sudo systemctl status postgresql
   sudo systemctl start postgresql  # if not running
   ```

2. **Verify database exists:**
   ```bash
   sudo -u postgres psql -l | grep cyberlab
   ```

3. **Check user permissions:**
   ```bash
   sudo -u postgres psql -d cyberlab -c "\du postgress"
   ```

4. **Grant permissions if needed:**
   ```bash
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE cyberlab TO postgress;"
   sudo -u postgres psql -d cyberlab -c "GRANT ALL ON SCHEMA public TO postgress;"
   ```

### Reset Database
To completely reset the database:
```bash
cd backend
source venv/bin/activate
python -c "from app.database import engine, Base; Base.metadata.drop_all(engine)"
python init_database.py --seed
```

## 📦 Dependencies

The application uses the following key dependencies:
- **FastAPI** (0.104.1) - Modern web framework
- **SQLAlchemy** (2.0.23) - ORM for database operations
- **psycopg2-binary** (2.9.9) - PostgreSQL adapter
- **python-jose** (3.3.0) - JWT token handling
- **passlib** (1.7.4) - Password hashing with bcrypt
- **pydantic** (2.5.2) - Data validation

## 🎯 Next Steps

1. ✅ PostgreSQL connected successfully
2. ✅ Database schema created (10 tables)
3. ✅ Sample data seeded
4. 🔄 Start the backend server
5. 🔄 Start the frontend application
6. 🔄 Test the complete application flow

---

**Status:** ✅ Database fully configured and operational

