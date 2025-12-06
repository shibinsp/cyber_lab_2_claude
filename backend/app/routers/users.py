from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..models.progress import LabProgress
from ..schemas import UserResponse
from ..utils.auth import get_current_user

router = APIRouter(tags=["users"])

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/progress")
def get_user_progress(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    progress = db.query(LabProgress).filter(LabProgress.user_id == current_user.id).all()
    return [
        {
            "lab_id": p.lab_id,
            "current_step": p.current_step,
            "completed": p.completed,
            "completed_at": p.completed_at
        }
        for p in progress
    ]
