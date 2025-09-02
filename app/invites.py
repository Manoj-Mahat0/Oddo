import uuid
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

@router.post("/")
def create_invite(request: schemas.InviteRequest, 
                  db: Session = Depends(get_db), 
                  current_user: models.User = Depends(utils.get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Only Admin can invite users")

    code = str(uuid.uuid4())
    invite = models.Invite(email=request.email, full_name=request.full_name, code=code)
    db.add(invite)
    db.commit()
    db.refresh(invite)

    # Send email
    try:
        utils.send_invite_email(request.email, request.full_name, code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {e}")

    return {"invite_code": invite.code, "message": f"Invite sent to {request.email}"}


@router.post("/signup")
def signup_with_invite(request: schemas.InviteSignup, db: Session = Depends(get_db)):
    invite = db.query(models.Invite).filter(models.Invite.code == request.code, models.Invite.is_used == False).first()
    if not invite:
        raise HTTPException(status_code=400, detail="Invalid or used invite code")

    hashed = utils.hash_password(request.password)
    user = models.User(
        full_name=invite.full_name,
        email=invite.email,
        password=hashed,
        role="Developer"
    )
    db.add(user)
    invite.is_used = True
    db.commit()
    return {"message": "User registered successfully", "email": user.email, "role": user.role}

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

