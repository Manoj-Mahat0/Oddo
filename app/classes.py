from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, database, utils

router = APIRouter(prefix="/classes", tags=["Classes"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 1. Create Class (Admin only)
@router.post("/")
def create_class(name: str,
                 db: Session = Depends(get_db),
                 current_user: models.User = Depends(utils.get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admin can create classes")

    existing = db.query(models.Class).filter(models.Class.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Class already exists")

    new_class = models.Class(name=name)
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    return {"message": "Class created", "id": new_class.id, "name": new_class.name}

# 2. Get all classes (Admin/Tester/Staff allowed)
@router.get("/")
def get_all_classes(db: Session = Depends(get_db),
                    current_user: models.User = Depends(utils.get_current_user)):
    if current_user.role not in ["Admin", "Tester", "Staff"]:
        raise HTTPException(status_code=403, detail="Not authorized to view classes")
    return db.query(models.Class).all()

# 3. Delete class (Admin only)
@router.delete("/{class_id}")
def delete_class(class_id: int,
                 db: Session = Depends(get_db),
                 current_user: models.User = Depends(utils.get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admin can delete classes")

    cls = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    db.delete(cls)
    db.commit()
    return {"message": "Class deleted"}
