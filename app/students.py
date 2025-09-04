from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, database, utils
from typing import List

router = APIRouter(prefix="/students", tags=["Students"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 🔹 New: Get all students (Admin only, or Staff if you prefer)
@router.get("/")
def get_all_students(db: Session = Depends(get_db),
                     current_user: models.User = Depends(utils.get_current_user)):
    if current_user.role not in ["Admin", "Staff", "Tester"]:
        raise HTTPException(status_code=403, detail="Not authorized to view students")
    return db.query(models.User).filter(models.User.role == "Student").all()

# 6. Enroll student in a class (Staff/Admin allowed)
@router.post("/{student_id}/enroll/{class_id}")
def enroll_student(student_id: int, class_id: int,
                   db: Session = Depends(get_db),
                   current_user: models.User = Depends(utils.get_current_user)):
    if current_user.role not in ["Admin", "Staff"]:
        raise HTTPException(status_code=403, detail="Only Staff/Admin can enroll students")

    student = db.query(models.User).filter(models.User.id == student_id, models.User.role == "Student").first()
    cls = db.query(models.Class).filter(models.Class.id == class_id).first()

    if not student or not cls:
        raise HTTPException(status_code=404, detail="Student or Class not found")

    if cls in student.enrolled_classes:
        raise HTTPException(status_code=400, detail="Already enrolled")

    student.enrolled_classes.append(cls)
    db.commit()
    return {"message": f"Student {student.full_name} enrolled in {cls.name}"}

# Get all students of a specific class
@router.get("/class/{class_id}")
def get_class_students(class_id: int,
                       db: Session = Depends(get_db),
                       current_user: models.User = Depends(utils.get_current_user)):
    if current_user.role not in ["Admin", "Staff", "Tester"]:
        raise HTTPException(status_code=403, detail="Not authorized to view class students")

    cls = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    return cls.students
