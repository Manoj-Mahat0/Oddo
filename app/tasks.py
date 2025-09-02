from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from . import database, models, schemas, utils

router = APIRouter(prefix="/tasks", tags=["Tasks"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.TaskResponse)
def create_task(request: schemas.TaskCreate, db: Session = Depends(get_db),
                current_user: models.User = Depends(utils.get_current_user)):
    # Only Admin, Developer, SEO can create tasks
    if current_user.role not in ["Admin", "Developer", "SEO"]:
        raise HTTPException(status_code=403, detail="You are not allowed to create tasks")

    task = models.Task(
        title=request.title,
        description=request.description,
        sprint_id=request.sprint_id,
        assigned_to=request.assigned_to
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/{id}/status")
def update_task_status(id: int, request: schemas.TaskStatusUpdate,
                       db: Session = Depends(get_db),
                       current_user: models.User = Depends(utils.get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if request.status not in [s.value for s in models.TaskStatus]:
        raise HTTPException(status_code=400, detail="Invalid status")

    task.status = request.status
    db.commit()
    return {"message": f"Task status updated to {task.status}"}

@router.get("/{sprint_id}", response_model=List[schemas.TaskResponse])
def list_tasks(sprint_id: int, db: Session = Depends(get_db),
               current_user: models.User = Depends(utils.get_current_user)):
    tasks = db.query(models.Task).filter(models.Task.sprint_id == sprint_id).all()
    return tasks
