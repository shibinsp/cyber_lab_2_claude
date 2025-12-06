import json
import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models import User, LabProgress
from ..schemas import ProgressUpdate, ProgressResponse
from ..utils.auth import get_current_user

router = APIRouter(tags=["labs"])

LABS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "labs")

@router.get("/public")
def get_public_labs(db: Session = Depends(get_db)):
    """Public endpoint to get all labs without authentication (no progress data)"""
    labs = []
    for filename in os.listdir(LABS_DIR):
        if filename.endswith(".json"):
            with open(os.path.join(LABS_DIR, filename)) as f:
                lab = json.load(f)
                # Don't include progress for public endpoint
                lab["progress"] = {
                    "current_step": 0,
                    "completed": False,
                    "total_steps": len(lab.get("tasks", []))
                }
                labs.append(lab)
    return labs

@router.get("/")
def get_all_labs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    labs = []
    for filename in os.listdir(LABS_DIR):
        if filename.endswith(".json"):
            with open(os.path.join(LABS_DIR, filename)) as f:
                lab = json.load(f)
                progress = db.query(LabProgress).filter(
                    LabProgress.user_id == current_user.id,
                    LabProgress.lab_id == lab["id"]
                ).first()
                lab["progress"] = {
                    "current_step": progress.current_step if progress else 0,
                    "completed": progress.completed if progress else False,
                    "total_steps": len(lab["tasks"])
                }
                labs.append(lab)
    return labs

@router.get("/{lab_id}")
def get_lab(lab_id: str, current_user: User = Depends(get_current_user)):
    # Validate lab_id to prevent path traversal
    if not lab_id.replace("_", "").replace("-", "").isalnum():
        raise HTTPException(status_code=400, detail="Invalid lab ID")

    lab_path = os.path.join(LABS_DIR, f"{lab_id}.json")

    # Ensure path is within LABS_DIR
    if not os.path.realpath(lab_path).startswith(os.path.realpath(LABS_DIR)):
        raise HTTPException(status_code=400, detail="Invalid lab path")

    if not os.path.exists(lab_path):
        raise HTTPException(status_code=404, detail="Lab not found")
    with open(lab_path) as f:
        return json.load(f)

@router.post("/progress")
def update_progress(
    progress: ProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_progress = db.query(LabProgress).filter(
        LabProgress.user_id == current_user.id,
        LabProgress.lab_id == progress.lab_id
    ).first()

    if not db_progress:
        db_progress = LabProgress(user_id=current_user.id, lab_id=progress.lab_id)
        db.add(db_progress)

    db_progress.current_step = progress.current_step
    db_progress.completed = progress.completed
    if progress.flag_submitted:
        db_progress.flag_submitted = progress.flag_submitted
    if progress.completed:
        db_progress.completed_at = datetime.utcnow()

    db.commit()
    return {"status": "success"}

@router.get("/progress/all")
def get_all_progress(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    progress = db.query(LabProgress).filter(LabProgress.user_id == current_user.id).all()
    return [{"lab_id": p.lab_id, "current_step": p.current_step, "completed": p.completed} for p in progress]
