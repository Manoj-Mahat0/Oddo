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

# Get classes assigned to a student
@router.get("/{student_id}/classes")
def get_classes_by_student(student_id: int,
                           db: Session = Depends(get_db),
                           current_user: models.User = Depends(utils.get_current_user)) -> List[dict]:
    """
    Returns list of classes the given student is enrolled in.

    - Admin/Tester can view any student's classes.
    - Staff can view only if the staff is assigned to at least one of those classes (optional policy),
      or you can allow Staff to view any student (choose as per your policy).
    - Student can view their own classes.
    """
    # role based access: allow Admin/Tester always
    if current_user.role in ["Admin", "Tester"]:
        pass
    elif current_user.role == "Student":
        # students can only view their own classes
        if current_user.id != student_id:
            raise HTTPException(status_code=403, detail="Not authorized to view other student's classes")
    elif current_user.role == "Staff":
        # optional: allow staff to view any student; or restrict to classes staff manages
        # If you want restriction: check intersection between staff.assigned_classes and student's classes
        # For now we'll allow Staff to view any student's classes (change if you want stricter)
        pass
    else:
        raise HTTPException(status_code=403, detail="Not authorized to view student classes")

    student = db.query(models.User).filter(models.User.id == student_id, models.User.role == "Student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Use relationship: student.enrolled_classes
    return [{"id": cls.id, "name": cls.name} for cls in student.enrolled_classes]