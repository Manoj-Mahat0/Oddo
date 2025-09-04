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


# ---------------- CREATE TASK ----------------
@router.post("/", response_model=schemas.TaskResponse)
def create_task(request: schemas.TaskCreate, db: Session = Depends(get_db),
                current_user: models.User = Depends(utils.get_current_user)):
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


# ---------------- UPDATE STATUS ----------------
@router.put("/{id}/status")
def update_task_status(id: int, request: schemas.TaskStatusUpdate,
                       db: Session = Depends(get_db),
                       current_user: models.User = Depends(utils.get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if request.status not in [s.value for s in models.TaskStatus]:
        raise HTTPException(status_code=400, detail="Invalid status")

    if current_user.role != "Admin" and task.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="You cannot update this task")

    task.status = request.status
    db.commit()
    return {"message": f"Task status updated to {task.status}"}


# ---------------- LIST ALL TASKS (ADMIN) ----------------
@router.get("/", response_model=List[schemas.TaskResponse])
def list_all_tasks(db: Session = Depends(get_db),
                   current_user: models.User = Depends(utils.get_current_user)):
    if current_user.role not in ["Admin", "Tester"]:
        raise HTTPException(status_code=403, detail="Only Admin can view all tasks")

    return db.query(models.Task).all()


# ---------------- LIST MY TASKS ----------------
@router.get("/my", response_model=List[schemas.TaskResponse])
def list_my_tasks(db: Session = Depends(get_db),
                  current_user: models.User = Depends(utils.get_current_user)):
    return db.query(models.Task).filter(models.Task.assigned_to == current_user.id).all()


# ---------------- GET ALL TASKS WITH BUGS ----------------
@router.get("/full")
def list_all_tasks_with_bugs(db: Session = Depends(get_db),
                             current_user: models.User = Depends(utils.get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admin can view full details")

    tasks = db.query(models.Task).all()
    result = []
    for t in tasks:
        task_data = {
            "task_id": t.id,
            "title": t.title,
            "description": t.description,
            "status": t.status,
            "sprint_id": t.sprint_id,
            "assigned_to": t.assigned_to,
            "created_at": t.created_at,
            "bugs": [
                {
                    "bug_id": b.id,
                    "description": b.description,
                    "status": b.status,
                    "created_by": b.created_by,
                    "created_at": b.created_at
                }
                for b in t.bugs
            ]
        }
        result.append(task_data)
    return result


# ---------------- GET TASK DETAIL ----------------
@router.get("/detail/{id}")
def get_task(id: int, db: Session = Depends(get_db),
             current_user: models.User = Depends(utils.get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "sprint_id": task.sprint_id,
        "assigned_to": task.assigned_to,
        "created_at": task.created_at,
        "bugs": [
            {"id": b.id, "description": b.description, "status": b.status}
            for b in task.bugs
        ]
    }


# ---------------- DELETE TASK (ADMIN) ----------------
@router.delete("/{id}")
def delete_task(id: int, db: Session = Depends(get_db),
                current_user: models.User = Depends(utils.get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admin can delete tasks")

    task = db.query(models.Task).filter(models.Task.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}


# ---------------- ASSIGN/REASSIGN TASK (ADMIN) ----------------
@router.put("/{id}/assign/{user_id}")
def assign_task(id: int, user_id: int,
                db: Session = Depends(get_db),
                current_user: models.User = Depends(utils.get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admin can reassign tasks")

    task = db.query(models.Task).filter(models.Task.id == id).first()
    user = db.query(models.User).filter(models.User.id == user_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    task.assigned_to = user.id
    db.commit()
    db.refresh(task)

    return {
        "message": f"Task '{task.title}' assigned to {user.role} (ID {user.id})",
        "task_id": task.id,
        "new_assigned_user": user.id,
        "user_role": user.role
    }


# ---------------- LIST TASKS BY SPRINT ----------------
@router.get("/sprint/{sprint_id}", response_model=List[schemas.TaskResponse])
def list_tasks(sprint_id: int, db: Session = Depends(get_db),
               current_user: models.User = Depends(utils.get_current_user)):
    tasks = db.query(models.Task).filter(models.Task.sprint_id == sprint_id).all()
    return tasks
