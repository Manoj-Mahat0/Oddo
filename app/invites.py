from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from . import database, models, schemas, utils

router = APIRouter(prefix="/invites", tags=["Invites"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- Admin creates invite (with existing code) ---
@router.post("/")
def create_invite(request: schemas.InviteRequest, 
                  db: Session = Depends(get_db), 
                  current_user: models.User = Depends(utils.get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admin can invite users")

    # Admin provides existing employee/student code
    invite = models.Invite(
        email=request.email,
        full_name=request.full_name,
        code=request.code   # ✅ no UUID, use provided code
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)

    # Send email with provided code
    try:
        utils.send_invite_email(request.email, request.full_name, request.code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {e}")

    return {"message": f"Invite sent to {request.email}", "code": request.code}


# --- Signup (no invite check, user enters their own code) ---
@router.post("/signup")
def signup_with_invite(request: schemas.InviteSignup, db: Session = Depends(get_db)):
    # Find invite by code
    invite = db.query(models.Invite).filter(
        models.Invite.code == request.code,
        models.Invite.is_used == False
    ).first()

    if not invite:
        raise HTTPException(status_code=400, detail="Invalid or used invite code")

    # Check if email already registered
    existing_user = db.query(models.User).filter(models.User.email == invite.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="This email is already registered")

    hashed = utils.hash_password(request.password)

    # Create user with data from invite + role from request
    user = models.User(
        full_name=invite.full_name,
        email=invite.email,
        password=hashed,
        role=request.role
    )
    db.add(user)

    # Mark invite as used
    invite.is_used = True

    db.commit()
    db.refresh(user)

    return {
        "message": "User registered successfully",
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role
    }



# --- List all invites ---
@router.get("/")
def list_invites(db: Session = Depends(get_db),
                 current_user: models.User = Depends(utils.get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admin can view invites")

    invites = db.query(models.Invite).all()
    return [
        {
            "id": i.id,
            "email": i.email,
            "full_name": i.full_name,
            "code": i.code,
            "status": "Used" if i.is_used else "Pending"
        }
        for i in invites
    ]
