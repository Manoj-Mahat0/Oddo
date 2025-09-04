from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from . import database, models, utils

router = APIRouter(prefix="/me/projects", tags=["User Projects"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/full")
def get_user_project_lifecycle(db: Session = Depends(get_db),
                               current_user: models.User = Depends(utils.get_current_user)):
    # Get all projects where this user is a member
    projects = db.query(models.Project).join(models.Project.members).filter(models.User.id == current_user.id).all()

    result = []
    for project in projects:
        project_data = {
            "project_id": project.id,
            "name": project.name,
            "description": project.description,
            "deadline": project.deadline,
            "sprints": []
        }

        for sprint in project.sprints:
            sprint_data = {
                "sprint_id": sprint.id,
                "name": sprint.name,
                "start_date": sprint.start_date,
                "end_date": sprint.end_date,
                "tasks": []
            }

            for task in sprint.tasks:
                # Only include tasks assigned to this user
                if task.assigned_to == current_user.id:
                    task_data = {
                        "task_id": task.id,
                        "title": task.title,
                        "description": task.description,
                        "status": task.status,
                        "bugs": []
                    }

                    for bug in task.bugs:
                        bug_data = {
                            "bug_id": bug.id,
                            "description": bug.description,
                            "status": bug.status,
                            "created_at": bug.created_at
                        }
                        task_data["bugs"].append(bug_data)

                    sprint_data["tasks"].append(task_data)

            project_data["sprints"].append(sprint_data)

        result.append(project_data)

    return {
        "user": {
            "id": current_user.id,
            "role": current_user.role,
            "email": current_user.email,
            "full_name": current_user.full_name
        },
        "projects": result
    }
