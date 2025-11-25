# 🐳 Docker Deployment Guide

## ✅ Deployment Status

**Application is successfully deployed and running!**

- **Frontend**: http://localhost:1969
- **Backend API**: http://localhost:2026
- **API Documentation**: http://localhost:2026/docs
- **Database**: PostgreSQL (localhost:5432)

---

## 📋 Deployment Architecture

### Services Overview

```
┌─────────────────────────────────────────────────────────┐
│                     HOST SYSTEM                         │
│                                                          │
│  ┌──────────────────┐  ┌───────────────────┐           │
│  │   PostgreSQL     │  │  Docker Containers │           │
│  │   :5432          │  │  (host network)   │           │
│  └──────────────────┘  └───────────────────┘           │
│           ▲                      │                       │
│           │              ┌───────┴────────┐              │
│           │              │                │              │
│           │         ┌────▼─────┐    ┌────▼─────┐        │
│           └─────────┤ Backend  │    │ Frontend │        │
│                     │ :2026    │    │ :1969    │        │
│                     └──────────┘    └──────────┘        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Container Details

#### 1. **Backend Container** (`cyberlab_backend`)
- **Image**: `cyber_lab_2_claude-backend`
- **Port**: 2026
- **Network Mode**: host
- **Technology**: FastAPI + Python 3.12
- **Database**: Connects to host PostgreSQL
- **Features**:
  - JWT Authentication
  - RESTful API
  - SQLAlchemy ORM
  - Auto-reload enabled

#### 2. **Frontend Container** (`cyberlab_frontend`)
- **Image**: `cyber_lab_2_claude-frontend`
- **Port**: 1969
- **Network Mode**: host
- **Technology**: React + Vite + Nginx
- **Features**:
  - Modern UI with Tailwind CSS
  - Client-side routing
  - Optimized production build
  - Gzip compression enabled

#### 3. **PostgreSQL Database** (Host Service)
- **Port**: 5432
- **Database**: cyberlab
- **User**: postgress
- **Tables**: 10 tables (users, courses, labs, etc.)
- **Status**: Running on host system

---

## 🚀 Quick Start Commands

### Start Application
```bash
cd /root/cyber_lab_2_claude
docker compose up -d
```

### Stop Application
```bash
docker compose down
```

### View Logs
```bash
# All services
docker compose logs -f

# Backend only
docker logs -f cyberlab_backend

# Frontend only
docker logs -f cyberlab_frontend
```

### Restart Services
```bash
docker compose restart
```

### Rebuild and Deploy
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Check Status
```bash
docker compose ps
```

---

## 📂 Project Structure

```
/root/cyber_lab_2_claude/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── config.py            # Configuration (env-aware)
│   │   ├── database.py          # Database connection
│   │   ├── models/              # SQLAlchemy models
│   │   ├── routers/             # API endpoints
│   │   ├── schemas/             # Pydantic schemas
│   │   └── utils/               # Utilities (auth, mistral)
│   ├── courses/                 # Course JSON files
│   ├── labs/                    # Lab JSON files
│   ├── Dockerfile               # Backend container image
│   ├── requirements.txt         # Python dependencies
│   ├── init_database.py         # DB initialization script
│   └── test_db_connection.py   # DB connection tester
├── frontend/
│   ├── src/
│   │   ├── pages/               # React pages
│   │   ├── components/          # Reusable components
│   │   ├── context/             # React context (auth)
│   │   ├── App.jsx              # Main app component
│   │   └── main.jsx             # Entry point
│   ├── Dockerfile               # Frontend container image
│   ├── nginx.conf               # Nginx configuration
│   ├── package.json             # Node dependencies
│   └── vite.config.js           # Vite configuration
├── docker-compose.yml           # Service orchestration
├── DATABASE_SETUP.md            # Database documentation
└── DOCKER_DEPLOYMENT.md         # This file
```

---

## 🔧 Configuration Files

### docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    container_name: cyberlab_backend
    network_mode: host
    environment:
      DATABASE_URL: postgresql://postgress:shibin@localhost:5432/cyberlab
      SECRET_KEY: isc-cyber-range-secret-key-2024
    volumes:
      - ./backend/courses:/app/courses
      - ./backend/labs:/app/labs

  frontend:
    build: ./frontend
    container_name: cyberlab_frontend
    network_mode: host
    depends_on:
      - backend
```

### Backend Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT token secret
- `ALGORITHM`: JWT algorithm (HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration (1440 = 24h)

### Frontend Environment Variables
- `VITE_API_URL`: Backend API URL (http://localhost:2026)

---

## 🧪 Testing the Deployment

### 1. Test Backend API
```bash
# Health check
curl http://localhost:2026/

# Expected output:
# {"message":"ISC Cyber Range API","status":"online"}

# API documentation
curl http://localhost:2026/docs
```

### 2. Test Frontend
```bash
# Homepage
curl -I http://localhost:1969/

# Expected: HTTP/1.1 200 OK
```

### 3. Test Authentication
```bash
# Login with sample account
curl -X POST http://localhost:2026/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Expected: JWT token response
```

### 4. Access in Browser
- **Frontend**: http://localhost:1969
- **API Docs**: http://localhost:2026/docs
- **Alternative Docs**: http://localhost:2026/redoc

---

## 📊 Default Credentials

### Admin Account
```
Username: admin
Password: admin123
Role: admin
```

### Student Account
```
Username: student
Password: student123
Role: student
Semester: 3
```

---

## 🔍 Monitoring & Troubleshooting

### Check Container Health
```bash
docker compose ps
```

### View Resource Usage
```bash
docker stats
```

### Inspect Container
```bash
docker inspect cyberlab_backend
docker inspect cyberlab_frontend
```

### Access Container Shell
```bash
# Backend
docker exec -it cyberlab_backend /bin/bash

# Frontend
docker exec -it cyberlab_frontend /bin/sh
```

### Common Issues & Solutions

#### 1. **Port Already in Use**
```bash
# Check what's using the port
sudo lsof -i :2026
sudo lsof -i :1969

# Kill the process or change port in docker-compose.yml
```

#### 2. **Database Connection Failed**
```bash
# Test PostgreSQL is running
sudo systemctl status postgresql

# Test connection from host
psql -U postgress -d cyberlab -h localhost

# Check backend logs
docker logs cyberlab_backend
```

#### 3. **Frontend Shows 502 Bad Gateway**
```bash
# Check if backend is running
curl http://localhost:2026/

# Restart services
docker compose restart
```

#### 4. **Container Keeps Restarting**
```bash
# Check logs for errors
docker logs cyberlab_backend --tail 50
docker logs cyberlab_frontend --tail 50

# Check docker compose logs
docker compose logs
```

---

## 🔄 Update & Maintenance

### Update Application Code
```bash
cd /root/cyber_lab_2_claude

# Pull latest changes (if using git)
git pull

# Rebuild containers
docker compose down
docker compose build
docker compose up -d
```

### Update Dependencies

#### Backend
```bash
cd backend
# Edit requirements.txt
docker compose build backend
docker compose up -d backend
```

#### Frontend
```bash
cd frontend
# Edit package.json
docker compose build frontend
docker compose up -d frontend
```

### Database Migrations
```bash
# Access backend container
docker exec -it cyberlab_backend /bin/bash

# Run migration script
python init_database.py --seed
```

### Backup Database
```bash
# Create backup
pg_dump -U postgress -d cyberlab > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql -U postgress -d cyberlab < backup_20251123_082400.sql
```

---

## 🌐 Network Configuration

### Host Network Mode
Both containers use `network_mode: host` which means:
- ✅ Direct access to host services (PostgreSQL)
- ✅ No port mapping needed
- ✅ Better performance
- ⚠️ Containers share host network namespace

### Ports Used
- **1969**: Frontend (React/Nginx)
- **2026**: Backend (FastAPI/Uvicorn)
- **5432**: PostgreSQL (Host service)

---

## 📈 Performance Optimization

### Backend Optimizations
- **Uvicorn** with auto-reload for development
- **SQLAlchemy** connection pooling
- **JWT** token caching
- **CORS** configured for specific origins

### Frontend Optimizations
- **Vite** for fast builds
- **Code splitting** recommended
- **Gzip compression** enabled
- **Static asset caching** (1 year)
- **Nginx** as production server

---

## 🔒 Security Considerations

### Current Setup (Development)
- ⚠️ Using default SECRET_KEY (change for production)
- ⚠️ CORS allows specific origins
- ⚠️ Database credentials in docker-compose.yml

### Production Recommendations
1. Use environment variables for secrets
2. Enable HTTPS/SSL
3. Implement rate limiting
4. Use secrets management (Docker Secrets, Vault)
5. Regular security updates
6. Database connection pooling limits
7. Firewall rules for port access

---

## 📝 Logs & Debugging

### Log Locations

#### Container Logs
```bash
docker logs cyberlab_backend > backend.log
docker logs cyberlab_frontend > frontend.log
```

#### Application Logs
- Backend: stdout (captured by Docker)
- Frontend: Nginx access/error logs

### Debug Mode
```bash
# Backend with verbose logging
docker exec -it cyberlab_backend python -m pdb app/main.py

# Frontend with debug
docker exec -it cyberlab_frontend cat /var/log/nginx/error.log
```

---

## 🎯 Next Steps

### For Development
1. ✅ Update environment variables for your needs
2. ✅ Add more lab exercises in `backend/labs/`
3. ✅ Customize courses in `backend/courses/`
4. ✅ Modify frontend UI in `frontend/src/`
5. ✅ Add authentication providers

### For Production
1. 📋 Set up CI/CD pipeline
2. 📋 Configure reverse proxy (Nginx/Traefik)
3. 📋 Enable SSL certificates
4. 📋 Set up monitoring (Prometheus/Grafana)
5. 📋 Implement log aggregation
6. 📋 Configure auto-scaling
7. 📋 Set up backup automation

---

## 📞 Support & Documentation

- **Database Setup**: See `DATABASE_SETUP.md`
- **API Documentation**: http://localhost:2026/docs
- **Project README**: `README.md`

---

## ✅ Deployment Checklist

- [x] PostgreSQL connected and configured
- [x] Backend Docker image built
- [x] Frontend Docker image built
- [x] Docker Compose configured
- [x] Containers running on correct ports
- [x] Backend API accessible (port 2026)
- [x] Frontend accessible (port 1969)
- [x] Database tables created
- [x] Sample data seeded
- [x] Health checks passing
- [x] Documentation created

**Status**: 🎉 **DEPLOYMENT SUCCESSFUL!**

---

*Last Updated: November 23, 2025*
*Docker Compose Version: 2.40.3*
*Docker Version: 29.0.2*

