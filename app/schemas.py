from pydantic import BaseModel, EmailStr, condecimal, Field
from datetime import datetime
from typing import List, Optional, Literal, Dict, Any

# ---------- AUTH ----------
class AdminSignup(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    access_token: str
    token_type: str

# ---------- INVITES ----------
class InviteRequest(BaseModel):
    email: EmailStr
    full_name: str
    code: str   # existing emp/student code

class InviteSignup(BaseModel):
    # full_name: str
    # email: EmailStr
    password: str
    code: str
    role: Literal["Developer", "Tester", "SEO", "HR", "Accountant","Student","Staff","Intern"]




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



# Decimal type (matches Numeric(12,2))
Decimal = condecimal(max_digits=12, decimal_places=2)


# -----------------------------
# Fee Structure
# -----------------------------
class FeeStructureCreate(BaseModel):
    class_id: int
    name: Optional[str] = None
    total_amount: Decimal
    terms: Optional[int] = 3


class FeeStructureOut(BaseModel):
    id: int
    class_id: int
    name: Optional[str] = None
    total_amount: Decimal
    terms: int
    created_at: datetime

    class Config:
        orm_mode = True


# -----------------------------
# Payment Intent (gateway)
# -----------------------------
class PaymentIntentCreate(BaseModel):
    student_id: int
    fee_structure_id: Optional[int] = None
    amount: Decimal
    currency: Optional[str] = "INR"
    term_no: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


class PaymentIntentOut(BaseModel):
    id: int
    intent_id: Optional[str] = None
    student_id: int
    fee_structure_id: Optional[int] = None
    amount: Decimal
    currency: str
    status: str
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        orm_mode = True


# -----------------------------
# Payments
# -----------------------------
class PaymentCreate(BaseModel):
    student_id: int
    fee_structure_id: Optional[int] = None
    payment_intent_id: Optional[int] = None
    amount: Decimal
    payment_date: Optional[datetime] = None
    payment_method: Optional[str] = None
    term_no: Optional[int] = None
    reference: Optional[str] = None
    status: Optional[str] = "completed"
    created_by: Optional[int] = None


class PaymentOut(BaseModel):
    id: int
    student_id: int
    fee_structure_id: Optional[int] = None
    payment_intent_id: Optional[int] = None
    amount: Decimal
    payment_date: datetime
    payment_method: Optional[str] = None
    term_no: Optional[int] = None
    reference: Optional[str] = None
    status: str
    created_by: Optional[int] = None
    created_at: datetime

    class Config:
        orm_mode = True


# -----------------------------
# Expenses
# -----------------------------
class ExpenseCreate(BaseModel):
    title: str
    amount: Decimal
    expense_date: Optional[datetime] = None
    vendor: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    receipt_reference: Optional[str] = None
    created_by: Optional[int] = None


class ExpenseOut(BaseModel):
    id: int
    title: str
    amount: Decimal
    expense_date: datetime
    vendor: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    receipt_reference: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime

    class Config:
        orm_mode = True


# -----------------------------
# Staff Salaries
# -----------------------------
class SalaryCreate(BaseModel):
    staff_id: int
    month: str = Field(..., example="2025-09")  # YYYY-MM or similar
    basic: Decimal
    allowances: Decimal = Decimal("0.00")
    deductions: Decimal = Decimal("0.00")
    reference: Optional[str] = None
    created_by: Optional[int] = None


class SalaryOut(BaseModel):
    id: int
    staff_id: int
    month: str
    basic: Decimal
    allowances: Decimal
    deductions: Decimal
    net_amount: Decimal
    status: str
    paid_date: Optional[datetime] = None
    reference: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime

    class Config:
        orm_mode = True


# -----------------------------
# Student-facing outputs
# -----------------------------
class PerTermBreakdownItem(BaseModel):
    term_no: int
    due: Decimal
    paid: Decimal
    remaining: Decimal


class StudentOutstandingOut(BaseModel):
    student_id: int
    class_id: Optional[int] = None
    fee_structure_id: Optional[int] = None
    total_amount: Decimal
    total_paid: Decimal
    total_remaining: Decimal
    per_term: Optional[List[PerTermBreakdownItem]] = None

    class Config:
        orm_mode = True


# -----------------------------
# Class summary / report pieces
# -----------------------------
class OutstandingStudentItem(BaseModel):
    student_id: int
    full_name: Optional[str] = None
    remaining: Decimal


class ClassSummaryOut(BaseModel):
    class_id: int
    fee_structure_id: int
    expected_total: Decimal
    total_received: Decimal
    outstanding_count: int
    outstanding_students: List[OutstandingStudentItem] = []

    class Config:
        orm_mode = True


class ReportSummaryOut(BaseModel):
    period: Dict[str, Optional[str]]  # {"from": "YYYY-MM-DD", "to": "YYYY-MM-DD"}
    total_fees_received: Decimal
    total_expenses: Decimal
    total_salaries_paid: Optional[Decimal] = Decimal("0.00")
    net: Decimal

    class Config:
        orm_mode = True


# -----------------------------
# Generic audit log schema (optional to return)
# -----------------------------
class AuditLogOut(BaseModel):
    id: int
    actor_id: Optional[int] = None
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[int] = None
    details: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        orm_mode = True
