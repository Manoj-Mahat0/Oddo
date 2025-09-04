from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, database, utils

router = APIRouter(prefix="/staff", tags=["Staff"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 4. Get all staff (Admin only)
@router.get("/")
def get_all_staff(db: Session = Depends(get_db),
                  current_user: models.User = Depends(utils.get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admin can view staff")
    return db.query(models.User).filter(models.User.role == "Staff").all()

# 5. Assign class to staff (Admin only)
@router.post("/{staff_id}/assign/{class_id}")
def assign_class(staff_id: int, class_id: int,
                 db: Session = Depends(get_db),
                 current_user: models.User = Depends(utils.get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admin can assign classes")

    staff = db.query(models.User).filter(models.User.id == staff_id, models.User.role == "Staff").first()
    cls = db.query(models.Class).filter(models.Class.id == class_id).first()

    if not staff or not cls:
        raise HTTPException(status_code=404, detail="Staff or Class not found")

    if cls in staff.assigned_classes:
        raise HTTPException(status_code=400, detail="Class already assigned")

    staff.assigned_classes.append(cls)
    db.commit()
    return {"message": f"Class '{cls.name}' assigned to {staff.full_name}"}

# 7. Revoke class (Admin only)
@router.delete("/{staff_id}/revoke/{class_id}")
def revoke_class(staff_id: int, class_id: int,
                 db: Session = Depends(get_db),
                 current_user: models.User = Depends(utils.get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admin can revoke classes")

    staff = db.query(models.User).filter(models.User.id == staff_id, models.User.role == "Staff").first()
    cls = db.query(models.Class).filter(models.Class.id == class_id).first()

    if not staff or not cls:
        raise HTTPException(status_code=404, detail="Staff or Class not found")

    if cls not in staff.assigned_classes:
        raise HTTPException(status_code=400, detail="Class not assigned")

    staff.assigned_classes.remove(cls)
    db.commit()
    return {"message": f"Class '{cls.name}' revoked from {staff.full_name}"}

# 🔹 New: Get all staff by class id
@router.get("/class/{class_id}")
def get_staff_by_class(class_id: int,
                       db: Session = Depends(get_db),
                       current_user: models.User = Depends(utils.get_current_user)):
    if current_user.role not in ["Admin", "Tester"]:
        raise HTTPException(status_code=403, detail="Not authorized to view staff by class")

    cls = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    return [{"id": s.id, "name": s.full_name, "email": s.email, "role": s.role}
            for s in cls.staff]

@router.get("/{staff_id}/classes")
def get_classes_by_staff(staff_id: int,
                         db: Session = Depends(get_db),
                         current_user: models.User = Depends(utils.get_current_user)):
    if current_user.role not in ["Admin", "Tester", "Staff"]:
        raise HTTPException(status_code=403, detail="Not authorized to view staff classes")

    staff = db.query(models.User).filter(models.User.id == staff_id, models.User.role == "Staff").first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    return [
        {"id": cls.id, "name": cls.name}
        for cls in staff.assigned_classes
    ]