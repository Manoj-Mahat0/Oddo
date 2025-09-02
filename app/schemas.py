from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional
# ---------- AUTH ----------
class AdminSignup(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str

# ---------- INVITES ----------
class InviteRequest(BaseModel):
    email: EmailStr
    full_name: str

class InviteSignup(BaseModel):
    code: str
    password: str



# ---------- PROJECTS ----------
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    deadline: Optional[datetime] = None

class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    deadline: Optional[datetime]
    created_at: datetime
    members: List[str]

    class Config:
        from_attributes = True



# --- Sprint ---
class SprintCreate(BaseModel):
    name: str
    project_id: int
    end_date: Optional[datetime] = None

class SprintResponse(BaseModel):
    id: int
    name: str
    project_id: int
    start_date: datetime
    end_date: Optional[datetime]

    class Config:
        from_attributes = True

# --- Task ---
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    sprint_id: int
    assigned_to: Optional[int] = None

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    sprint_id: int
    assigned_to: Optional[int]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class TaskStatusUpdate(BaseModel):
    status: str

# --- Bug ---
class BugCreate(BaseModel):
    task_id: int
    description: str

class BugResponse(BaseModel):
    id: int
    description: str
    task_id: int
    status: str
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True

class BugStatusUpdate(BaseModel):
    status: str
