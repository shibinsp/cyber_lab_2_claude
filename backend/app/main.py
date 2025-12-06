import os
import asyncio
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base
from .routers import auth, labs, users, courses, quiz, admin, dashboard, vm, admin_labs, admin_courses, admin_content, admin_assessments, assessments
from .utils.vm_lifecycle import VMLifecycleManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Cyyberlabs API", version="2.0.0")

# Initialize VM Lifecycle Manager
vm_lifecycle = VMLifecycleManager()

# Get allowed origins from environment variable (required for production)
ALLOWED_ORIGINS_STR = os.getenv("ALLOWED_ORIGINS")
if not ALLOWED_ORIGINS_STR:
    # Default to localhost only for development
    ALLOWED_ORIGINS_STR = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:1969,http://127.0.0.1:1969"
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_STR.split(',')]

print(f"🔧 CORS Allowed Origins: {ALLOWED_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth")
app.include_router(labs.router, prefix="/api/labs")
app.include_router(users.router, prefix="/api/users")
app.include_router(courses.router, prefix="/api/courses")
app.include_router(quiz.router, prefix="/api/quiz")
app.include_router(admin.router, prefix="/api/admin")
app.include_router(dashboard.router, prefix="/api/dashboard")
app.include_router(vm.router, prefix="/api/vm")
app.include_router(admin_labs.router, prefix="/api/admin/labs")
app.include_router(admin_courses.router, prefix="/api/admin/courses")
app.include_router(admin_content.router, prefix="/api/admin/content")
app.include_router(admin_assessments.router, prefix="/api/admin/assessments")
app.include_router(assessments.router, prefix="/api/assessments")

# Mount uploads directory for serving uploaded files
UPLOAD_DIR = "/app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.on_event("startup")
async def startup_event():
    """Start background tasks on application startup"""
    logger.info("🚀 CyberLabs API starting up...")
    logger.info("🔧 Starting automatic VM optimization background task...")
    asyncio.create_task(auto_optimize_vms_loop())
    logger.info("✅ Startup complete!")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown"""
    logger.info("🛑 CyberLabs API shutting down...")

async def auto_optimize_vms_loop():
    """
    Background task that automatically optimizes VM resources.
    Runs every 5 minutes to pause idle VMs and stop very idle VMs.
    """
    await asyncio.sleep(60)  # Wait 1 minute after startup before first optimization
    
    while True:
        try:
            logger.info("🔄 Running automatic VM optimization...")
            result = vm_lifecycle.auto_pause_idle_vms(
                idle_threshold_minutes=10
            )
            
            paused = result.get('paused_count', 0)
            stopped = result.get('stopped_count', 0)
            
            if paused > 0 or stopped > 0:
                logger.info(f"✅ Optimization complete: Paused {paused} VMs, Stopped {stopped} VMs")
            else:
                logger.debug("✓ All VMs are active or already optimized")
                
        except Exception as e:
            logger.error(f"❌ Error in auto-optimization: {e}")
        
        # Wait 5 minutes before next optimization
        await asyncio.sleep(300)

@app.get("/")
def root():
    return {
        "message": "Cyyberlabs API",
        "status": "online",
        "version": "2.0.0",
        "features": [
            "VM Lifecycle Management",
            "Auto-pause Optimization",
            "Resource Monitoring",
            "Pause/Resume VMs"
        ]
    }

@app.get("/health")
def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "api": "online",
        "auto_optimization": "active"
    }
