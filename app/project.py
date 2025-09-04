from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from . import database, models, schemas, utils
from typing import List

router = APIRouter(prefix="/projects", tags=["Projects"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.ProjectResponse)
def create_project(request: schemas.ProjectCreate,
                   db: Session = Depends(get_db),
                   current_user: models.User = Depends(utils.get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admin can create projects")

    project = models.Project(
        name=request.name,
        description=request.description,
        deadline=request.deadline
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return schemas.ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        deadline=project.deadline,
        created_at=project.created_at,
        members=[]
    )

@router.post("/{project_id}/add-member/{user_id}")
def add_member(project_id: int, user_id: int,
               db: Session = Depends(get_db),
               current_user: models.User = Depends(utils.get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admin can add members")

    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    user = db.query(models.User).filter(models.User.id == user_id).first()

    if not project or not user:
        raise HTTPException(status_code=404, detail="Project or User not found")

    project.members.append(user)
    db.commit()
    return {"message": f"User {user.full_name} added to project {project.name}"}

@router.delete("/{project_id}/remove-member/{user_id}")
def remove_member(project_id: int, user_id: int,
                  db: Session = Depends(get_db),
                  current_user: models.User = Depends(utils.get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admin can remove members")

    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    user = db.query(models.User).filter(models.User.id == user_id).first()

    if not project or not user:
        raise HTTPException(status_code=404, detail="Project or User not found")

    if user not in project.members:
        raise HTTPException(status_code=400, detail="User not a member of this project")

    project.members.remove(user)
    db.commit()
    return {"message": f"User {user.full_name} removed from project {project.name}"}

@router.get("/")
def list_projects(db: Session = Depends(get_db),
                  current_user: models.User = Depends(utils.get_current_user)):
    # Only Admin or Tester allowed
    if current_user.role not in ["Admin", "Tester"]:
        raise HTTPException(status_code=403, detail="Only Admin/Tester can view projects")

    projects = db.query(models.Project).all()

    results = []
    for p in projects:
        project_data = {
            "project_id": p.id,
            "name": p.name,
            "description": p.description,
            "deadline": p.deadline,
            "created_at": p.created_at,
            "members": [
                {"id": u.id, "code": u.email, "role": u.role}
                for u in p.members
            ]
        }
        results.append(project_data)

    return results


