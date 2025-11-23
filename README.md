# ISC Cyber Range - PoC

A cybersecurity learning platform with dynamic lab environment provisioning.

## Quick Start

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at: http://localhost:8000

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

## Features

- **JWT Authentication** - Register/Login with semester selection
- **Dashboard** - Grid view of labs with progress tracking
- **Split-screen Lab Interface** - Instructions on left, terminal/web form on right
- **Dynamic Labs** - Labs loaded from JSON configs
- **Click-to-inject** - Click code snippets to auto-fill terminal

## Demo Labs

1. **Linux File System Basics** - Navigate filesystem, find hidden flags
2. **SQL Injection Fundamentals** - Bypass authentication with SQL injection

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Lucide Icons
- **Backend**: FastAPI, SQLAlchemy, SQLite
- **Auth**: JWT with bcrypt password hashing
