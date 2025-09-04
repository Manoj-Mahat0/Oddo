from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from . import database, models, schemas, utils

router = APIRouter(prefix="/auth", tags=["Auth"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/admin-signup")
def admin_signup(request: schemas.AdminSignup, db: Session = Depends(get_db)):
    existing_admin = db.query(models.User).filter(models.User.role == "Admin").first()
    if existing_admin:
        raise HTTPException(status_code=400, detail="Admin already exists")

    hashed = utils.hash_password(request.password)
    admin = models.User(
        full_name=request.full_name,
        email=request.email,
        password=hashed,
        role="Admin"
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return {"id": admin.id, "full_name": admin.full_name, "email": admin.email, "role": admin.role}

@router.post("/login", response_model=schemas.TokenResponse)
def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    # Try login by email first
    user = db.query(models.User).filter(models.User.email == request.email).first()

    # If not found, try by full_name (or code if you add it to User model)
    if not user:
        user = db.query(models.User).filter(models.User.full_name == request.email).first()

    if not user or not utils.verify_password(request.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email/code or password")

    token = utils.create_access_token({"sub": user.email, "role": user.role})

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "access_token": token,
        "token_type": "bearer"
    }


