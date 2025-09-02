from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from . import database, models, schemas, utils

router = APIRouter(prefix="/bugs", tags=["Bugs"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.BugResponse)
def create_bug(request: schemas.BugCreate, db: Session = Depends(get_db),
               current_user: models.User = Depends(utils.get_current_user)):
    if current_user.role not in ["Tester", "Admin"]:
        raise HTTPException(status_code=403, detail="Only Testers/Admin can report bugs")

    bug = models.Bug(
        description=request.description,
        task_id=request.task_id,
        created_by=current_user.id
    )
    db.add(bug)
    db.commit()
    db.refresh(bug)
    return bug

@router.put("/{id}/status")
def update_bug_status(id: int, request: schemas.BugStatusUpdate, db: Session = Depends(get_db),
                      current_user: models.User = Depends(utils.get_current_user)):
    if current_user.role not in ["Developer", "Admin"]:
        raise HTTPException(status_code=403, detail="Only Developers/Admin can update bug status")

    bug = db.query(models.Bug).filter(models.Bug.id == id).first()
    if not bug:
        raise HTTPException(status_code=404, detail="Bug not found")

    bug.status = request.status
    db.commit()
    return {"message": f"Bug status updated to {bug.status}"}

@router.get("/{task_id}", response_model=List[schemas.BugResponse])
def list_bugs(task_id: int, db: Session = Depends(get_db),
              current_user: models.User = Depends(utils.get_current_user)):
    bugs = db.query(models.Bug).filter(models.Bug.task_id == task_id).all()
    return bugs
