from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from . import database, models, schemas, utils

router = APIRouter(prefix="/sprints", tags=["Sprints"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.SprintResponse)
def create_sprint(request: schemas.SprintCreate, db: Session = Depends(get_db),
                  current_user: models.User = Depends(utils.get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admin can create sprints")

    sprint = models.Sprint(name=request.name, project_id=request.project_id, end_date=request.end_date)
    db.add(sprint)
    db.commit()
    db.refresh(sprint)
    return sprint

@router.get("/{project_id}", response_model=List[schemas.SprintResponse])
def list_sprints(project_id: int, db: Session = Depends(get_db),
                 current_user: models.User = Depends(utils.get_current_user)):
    sprints = db.query(models.Sprint).filter(models.Sprint.project_id == project_id).all()
    return sprints
