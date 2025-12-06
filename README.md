# 🛡️ Cyyberlabs - Security Training Platform

A comprehensive cybersecurity learning platform with hands-on virtual machine labs, course management, and AI-powered assessments.

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd cyber_lab_2_claude

# Start all services
docker compose up -d

# Access the application
# Frontend: http://localhost:1969
# Backend API: http://localhost:2026
# API Docs: http://localhost:2026/docs
```

### Default Credentials
- **Admin**: `admin` / `admin123`

## ✨ Features

### 🎓 Learning Management
- **Course Management** - Create and organize courses with modules
- **Lab Environment** - Hands-on labs with real Linux VMs
- **Progress Tracking** - Track student progress through courses and labs
- **AI-Powered Quizzes** - Auto-generated assessments using Mistral AI

### 🖥️ Virtual Machine Labs
- **Docker-based VMs** - Full Linux desktop environment via noVNC
- **Pre-installed Tools** - nmap, wireshark, nikto, sqlmap, and more
- **Auto-optimization** - Idle VMs are automatically paused to save resources
- **Persistent Storage** - Student work is preserved across sessions

### 👨‍💼 Admin Panel
- **Dashboard** - Platform statistics and monitoring
- **User Management** - Manage students and admins
- **Course Builder** - Visual course creation with modules and content
- **Lab Builder** - Create labs with tasks, objectives, and tools
- **VM Monitoring** - Monitor and manage all running VMs
- **Tool Manager** - Configure tools available in each lab

### 🎨 Modern UI
- **Dark Theme** - Easy on the eyes for long sessions
- **Responsive Design** - Works on desktop and tablet
- **Step-by-step Wizards** - Professional course and lab creation flow
- **Real-time Updates** - Live VM status and progress tracking

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│    Backend      │────▶│    Database     │
│  React + Vite   │     │    FastAPI      │     │   PostgreSQL    │
│   Port: 1969    │     │   Port: 2026    │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   Docker VMs    │
                        │  cyberlab-vm    │
                        │  noVNC + XFCE   │
                        └─────────────────┘
```

## 📁 Project Structure

```
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # Application entry point
│   │   ├── routers/        # API endpoints
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── utils/          # Utilities (auth, VM lifecycle)
│   ├── labs/               # Lab configurations (JSON)
│   └── courses/            # Course configurations
├── frontend/               # React frontend
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable components
│   │   └── context/        # React context (Auth)
│   └── public/             # Static assets
├── vm/                     # VM Docker image
│   ├── Dockerfile          # VM image definition
│   ├── start.sh            # VM startup script
│   └── wallpaper.png       # Desktop wallpaper
└── docker-compose.yml      # Service orchestration
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/cyberlab

# JWT Authentication
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AI Quiz Generation (optional)
MISTRAL_API_KEY=your-mistral-api-key

# CORS Origins
ALLOWED_ORIGINS=http://localhost:1969,http://localhost:5173,https://cyyberlabs.com

# Frontend API URL
VITE_API_URL=http://localhost:2026
```

## 🛠️ Development

### Backend Development

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 2026
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Building VM Image

```bash
docker compose build cyberlab-vm
```

## 📚 API Documentation

Once the backend is running, access the interactive API documentation:
- **Swagger UI**: http://localhost:2026/docs
- **ReDoc**: http://localhost:2026/redoc

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User authentication |
| `/api/auth/register` | POST | User registration |
| `/api/courses/` | GET | List all courses |
| `/api/labs/` | GET | List all labs |
| `/api/admin/stats` | GET | Platform statistics |
| `/api/vm/start/{lab_id}` | POST | Start a lab VM |
| `/api/vm/stop/{lab_id}` | POST | Stop a lab VM |

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- CORS protection
- Role-based access control (Admin/Student)
- VM resource isolation

## 🚀 Deployment

### Production Checklist

- [ ] Set strong `SECRET_KEY`
- [ ] Configure proper `ALLOWED_ORIGINS`
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure database backups
- [ ] Set up monitoring and logging
- [ ] Configure VM resource limits

### Docker Deployment

```bash
# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f

# Stop services
docker compose down
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is proprietary software for Cyyberlabs.

## 📞 Support

For support, contact the Cyyberlabs team.

---

**Built with ❤️ for cybersecurity education**
