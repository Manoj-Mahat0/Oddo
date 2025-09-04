from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from . import database, models, utils

router = APIRouter(prefix="/users", tags=["Users"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def list_users(db: Session = Depends(get_db),
               current_user: models.User = Depends(utils.get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admin can view users")

    users = db.query(models.User).filter(models.User.role != "Admin").all()

    return [
        {
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active
        }
        for u in users
    ]
