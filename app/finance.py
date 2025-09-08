# finance.py
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime, date
import json, uuid

from . import database, models
from . import schemas as schemas

# try to import auth helpers (optional)
try:
    from .auth import get_db as auth_get_db  # for reference only
except Exception:
    auth_get_db = None

# try to import utils (token helpers) if present in repo
try:
    from . import utils
except Exception:
    utils = None

router = APIRouter(prefix="/finance", tags=["Finance"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Basic get_current_user: tries to decode Authorization Bearer token using utils if available.
# If utils has a method `decode_token(payload)` or `verify_token`, it'll be used.
# Otherwise this returns None and endpoints allow created_by in payloads (convenience for testing).
from fastapi import Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
security = HTTPBearer(auto_error=False)

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security), db: Session = Depends(get_db)):
    """
    Attempts to return models.User for the current Bearer token.
    If utils.decode_token / utils.verify_token exists it will be used; otherwise returns None.
    """
    if not credentials:
        return None
    token = credentials.credentials
    if utils:
        # try a few likely function names
        payload = None
        if hasattr(utils, "decode_token"):
            try:
                payload = utils.decode_token(token)
            except Exception:
                payload = None
        elif hasattr(utils, "verify_token"):
            try:
                payload = utils.verify_token(token)
            except Exception:
                payload = None
        elif hasattr(utils, "get_payload_from_token"):
            try:
                payload = utils.get_payload_from_token(token)
            except Exception:
                payload = None
        # fallback: if utils.create_access_token exists but no decoder, we cannot decode safely
        if payload and isinstance(payload, dict):
            sub = payload.get("sub") or payload.get("email")
            if sub:
                user = db.query(models.User).filter(models.User.email == sub).first()
                return user
    return None


# -----------------------
# FEE STRUCTURES
# -----------------------
@router.post("/fee-structures", response_model=schemas.FeeStructureOut)
def create_fee_structure(payload: schemas.FeeStructureCreate, current_user: Optional[models.User] = Depends(get_current_user), db: Session = Depends(get_db)):
    # Optionally restrict to admins: if current_user and current_user.role != "Admin": raise
    fs = models.FeeStructure(
        class_id=payload.class_id,
        name=payload.name,
        total_amount=payload.total_amount,
        terms=payload.terms or 3
    )
    db.add(fs)
    db.commit()
    db.refresh(fs)
    # audit
    try:
        actor = current_user.id if current_user else None
    except Exception:
        actor = None
    db.add(models.AuditLog(actor_id=actor, action="create_fee_structure", resource_type="fee_structures", resource_id=fs.id, details={"payload": payload.dict()}))
    db.commit()
    return fs

@router.get("/fee-structures", response_model=List[schemas.FeeStructureOut])
def list_fee_structures(class_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(models.FeeStructure)
    if class_id:
        q = q.filter(models.FeeStructure.class_id == class_id)
    return q.order_by(models.FeeStructure.created_at.desc()).all()


# -----------------------
# PAYMENT INTENT (gateway-sim)
# -----------------------
@router.post("/students/{student_id}/create-intent", response_model=schemas.PaymentIntentOut)
def create_payment_intent(student_id: int, payload: schemas.PaymentIntentCreate, current_user: Optional[models.User] = Depends(get_current_user), db: Session = Depends(get_db)):
    student = db.query(models.User).filter(models.User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    # create a fake intent id (in production call real gateway)
    fake_intent = "pi_" + uuid.uuid4().hex
    pi = models.PaymentIntent(
        intent_id=fake_intent,
        student_id=student_id,
        fee_structure_id=payload.fee_structure_id,
        amount=payload.amount,
        currency=payload.currency or "INR",
        status="created",
        metadata=payload.metadata or {}
    )
    db.add(pi)
    db.commit()
    db.refresh(pi)
    actor = current_user.id if current_user else None
    db.add(models.AuditLog(actor_id=actor, action="create_payment_intent", resource_type="payment_intents", resource_id=pi.id, details={"intent_id": pi.intent_id}))
    db.commit()
    return pi

@router.post("/students/{student_id}/confirm-payment")
def confirm_payment(student_id: int, intent_id: str, payment_method: Optional[str] = None,
                    reference: Optional[str] = None, term_no: Optional[int] = None,
                    current_user: Optional[models.User] = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    For testing: mark a PaymentIntent succeeded and create Payment record.
    In production, use webhook to mark completed.
    """
    pi = db.query(models.PaymentIntent).filter(models.PaymentIntent.intent_id == intent_id, models.PaymentIntent.student_id == student_id).first()
    if not pi:
        raise HTTPException(status_code=404, detail="Payment intent not found")
    if pi.status == "succeeded":
        return {"detail": "already succeeded"}
    # mark intent succeeded
    pi.status = "succeeded"
    db.add(pi)
    db.commit()
    # create payment
    payment = models.Payment(
        student_id=student_id,
        fee_structure_id=pi.fee_structure_id,
        payment_intent_id=pi.id,
        amount=pi.amount,
        payment_date=datetime.utcnow(),
        payment_method=payment_method or "card",
        term_no=term_no,
        reference=reference or pi.intent_id,
        status="completed",
        created_by=(current_user.id if current_user else None)
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    db.add(models.AuditLog(actor_id=current_user.id if current_user else None, action="confirm_payment", resource_type="payments", resource_id=payment.id, details={"intent": pi.intent_id}))
    db.commit()
    return {"status": "ok", "payment_id": payment.id}


# Webhook skeleton (secure in production)
@router.post("/webhook")
async def webhook(request: Request, x_signature: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """
    Receive gateway events here (Stripe/Razorpay). MUST verify signature in production.
    Expected event example:
    {"type":"payment_intent.succeeded","data":{"object":{"id":"pi_xxx","amount":10000}}}
    """
    raw = await request.body()
    try:
        data = json.loads(raw.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="invalid payload")
    ev_type = data.get("type")
    obj = data.get("data", {}).get("object", {})
    if ev_type in ("payment_intent.succeeded", "payment.succeeded"):
        intent_id = obj.get("id") or obj.get("payment_intent")
        amount = obj.get("amount") or obj.get("amount_received")
        pi = db.query(models.PaymentIntent).filter(models.PaymentIntent.intent_id == intent_id).first()
        if pi:
            pi.status = "succeeded"
            db.add(pi)
            db.commit()
            # create payment if not exists
            exists = db.query(models.Payment).filter(models.Payment.payment_intent_id == pi.id).first()
            if not exists:
                # Note: many gateways report amount in paise; adapt if needed.
                amt = pi.amount
                # if amount looks large and integer, you may need to /100.0 here depending on provider
                payment = models.Payment(
                    student_id=pi.student_id,
                    fee_structure_id=pi.fee_structure_id,
                    payment_intent_id=pi.id,
                    amount=amt,
                    payment_date=datetime.utcnow(),
                    payment_method=obj.get("payment_method", "gateway"),
                    reference=intent_id,
                    status="completed",
                    created_by=None
                )
                db.add(payment)
                db.commit()
                db.add(models.AuditLog(actor_id=None, action="webhook_create_payment", resource_type="payments", resource_id=payment.id, details={"raw_event": data}))
                db.commit()
    return {"received": True}


# -----------------------
# PAYMENTS (admin / manual)
# -----------------------
@router.post("/payments", response_model=schemas.PaymentOut)
def create_payment(payload: schemas.PaymentCreate, current_user: Optional[models.User] = Depends(get_current_user), db: Session = Depends(get_db)):
    # validation: ensure student exists
    student = db.query(models.User).filter(models.User.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    pay = models.Payment(
        student_id=payload.student_id,
        fee_structure_id=payload.fee_structure_id,
        payment_intent_id=payload.payment_intent_id,
        amount=payload.amount,
        payment_date=payload.payment_date or datetime.utcnow(),
        payment_method=payload.payment_method,
        term_no=payload.term_no,
        reference=payload.reference,
        status=payload.status or "completed",
        created_by=(current_user.id if current_user else payload.created_by)
    )
    db.add(pay)
    db.commit()
    db.refresh(pay)
    db.add(models.AuditLog(actor_id=(current_user.id if current_user else None), action="create_payment", resource_type="payments", resource_id=pay.id, details={"payload": payload.dict()}))
    db.commit()
    return pay

@router.get("/payments", response_model=List[schemas.PaymentOut])
def list_payments(student_id: Optional[int] = None, class_id: Optional[int] = None, from_date: Optional[date] = None, to_date: Optional[date] = None, term_no: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(models.Payment)
    if student_id:
        q = q.filter(models.Payment.student_id == student_id)
    if class_id:
        q = q.join(models.FeeStructure, models.Payment.fee_structure).filter(models.FeeStructure.class_id == class_id)
    if term_no:
        q = q.filter(models.Payment.term_no == term_no)
    if from_date:
        q = q.filter(models.Payment.payment_date >= from_date)
    if to_date:
        q = q.filter(models.Payment.payment_date <= to_date)
    return q.order_by(models.Payment.payment_date.desc()).limit(500).all()


# -----------------------
# EXPENSES
# -----------------------
@router.post("/expenses", response_model=schemas.ExpenseOut)
def create_expense(payload: schemas.ExpenseCreate, current_user: Optional[models.User] = Depends(get_current_user), db: Session = Depends(get_db)):
    exp = models.Expense(
        title=payload.title,
        description=payload.description,
        vendor=payload.vendor,
        amount=payload.amount,
        expense_date=payload.expense_date or datetime.utcnow(),
        category=payload.category,
        receipt_reference=payload.receipt_reference,
        created_by=(current_user.id if current_user else payload.created_by)
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    db.add(models.AuditLog(actor_id=(current_user.id if current_user else None), action="create_expense", resource_type="expenses", resource_id=exp.id, details={"payload": payload.dict()}))
    db.commit()
    return exp

@router.get("/expenses", response_model=List[schemas.ExpenseOut])
def list_expenses(from_date: Optional[date] = None, to_date: Optional[date] = None, category: Optional[str] = None, vendor: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(models.Expense)
    if from_date:
        q = q.filter(models.Expense.expense_date >= from_date)
    if to_date:
        q = q.filter(models.Expense.expense_date <= to_date)
    if category:
        q = q.filter(models.Expense.category == category)
    if vendor:
        q = q.filter(models.Expense.vendor == vendor)
    return q.order_by(models.Expense.expense_date.desc()).limit(500).all()


# -----------------------
# STAFF SALARIES
# -----------------------
@router.post("/salaries", response_model=schemas.SalaryOut)
def create_salary(payload: schemas.SalaryCreate, current_user: Optional[models.User] = Depends(get_current_user), db: Session = Depends(get_db)):
    staff = db.query(models.User).filter(models.User.id == payload.staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    net = float(payload.basic) + float(payload.allowances) - float(payload.deductions)
    sal = models.StaffSalary(
        staff_id=payload.staff_id,
        month=payload.month,
        basic=payload.basic,
        allowances=payload.allowances,
        deductions=payload.deductions,
        net_amount=net,
        status="pending",
        reference=payload.reference,
        created_by=(current_user.id if current_user else payload.created_by)
    )
    db.add(sal)
    db.commit()
    db.refresh(sal)
    db.add(models.AuditLog(actor_id=(current_user.id if current_user else None), action="create_salary", resource_type="staff_salaries", resource_id=sal.id, details={"month": payload.month, "net": net} ))
    db.commit()
    return sal

@router.post("/salaries/{salary_id}/pay", response_model=schemas.SalaryOut)
def pay_salary(salary_id: int, reference: Optional[str] = None, current_user: Optional[models.User] = Depends(get_current_user), db: Session = Depends(get_db)):
    sal = db.query(models.StaffSalary).filter(models.StaffSalary.id == salary_id).first()
    if not sal:
        raise HTTPException(status_code=404, detail="Salary record not found")
    if sal.status == "paid":
        return sal
    sal.status = "paid"
    sal.paid_date = datetime.utcnow()
    if reference:
        sal.reference = reference
    db.add(sal)
    db.commit()
    db.refresh(sal)
    db.add(models.AuditLog(actor_id=(current_user.id if current_user else None), action="pay_salary", resource_type="staff_salaries", resource_id=sal.id, details={"net_amount": float(sal.net_amount)}))
    db.commit()
    return sal

@router.get("/salaries", response_model=List[schemas.SalaryOut])
def list_salaries(staff_id: Optional[int] = None, month: Optional[str] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(models.StaffSalary)
    if staff_id:
        q = q.filter(models.StaffSalary.staff_id == staff_id)
    if month:
        q = q.filter(models.StaffSalary.month == month)
    if status:
        q = q.filter(models.StaffSalary.status == status)
    return q.order_by(models.StaffSalary.month.desc()).limit(500).all()


# -----------------------
# STUDENT-FACING: outstanding & per-term
# -----------------------
@router.get("/students/{student_id}/outstanding", response_model=schemas.StudentOutstandingOut)
def student_outstanding(student_id: int, db: Session = Depends(get_db)):
    student = db.query(models.User).filter(models.User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    classes = student.enrolled_classes
    if not classes:
        raise HTTPException(status_code=404, detail="Student not enrolled in any class")
    class_obj = classes[0]
    fs = db.query(models.FeeStructure).filter(models.FeeStructure.class_id == class_obj.id).order_by(models.FeeStructure.created_at.desc()).first()
    if not fs:
        raise HTTPException(status_code=404, detail="No fee structure for class")
    payments = db.query(models.Payment).filter(models.Payment.student_id == student_id, models.Payment.fee_structure_id == fs.id, models.Payment.status == "completed").all()
    total_paid = sum([float(p.amount) for p in payments])
    per_term = []
    per_term_amount = float(fs.total_amount) / int(fs.terms)
    paid_by_term = {}
    for p in payments:
        if p.term_no:
            paid_by_term.setdefault(p.term_no, 0.0)
            paid_by_term[p.term_no] += float(p.amount)
    for i in range(1, fs.terms + 1):
        paid = paid_by_term.get(i, 0.0)
        per_term.append({"term_no": i, "due": per_term_amount, "paid": paid, "remaining": max(0, per_term_amount - paid)})
    return {
        "student_id": student_id,
        "class_id": class_obj.id,
        "fee_structure_id": fs.id,
        "total_amount": float(fs.total_amount),
        "total_paid": total_paid,
        "total_remaining": max(0, float(fs.total_amount) - total_paid),
        "per_term": per_term
    }


# -----------------------
# CLASS SUMMARY & REPORTS
# -----------------------
@router.get("/classes/{class_id}/summary", response_model=schemas.ClassSummaryOut)
def class_summary(class_id: int, db: Session = Depends(get_db)):
    fs = db.query(models.FeeStructure).filter(models.FeeStructure.class_id == class_id).order_by(models.FeeStructure.created_at.desc()).first()
    if not fs:
        raise HTTPException(status_code=404, detail="No fee structure for class")
    # students in class
    students = db.query(models.User).join(models.student_classes).filter(models.student_classes.c.class_id == class_id).all()
    expected = len(students) * float(fs.total_amount)
    paid_rows = db.query(models.Payment.student_id, models.func.sum(models.Payment.amount).label("paid")).filter(models.Payment.fee_structure_id == fs.id).group_by(models.Payment.student_id).all()
    paid_map = {r.student_id: float(r.paid) for r in paid_rows}
    total_received = sum(paid_map.values())
    unpaid_list = []
    per_student_expected = float(fs.total_amount)
    for s in students:
        paid = paid_map.get(s.id, 0.0)
        if paid < per_student_expected:
            unpaid_list.append({"student_id": s.id, "full_name": getattr(s, "full_name", None), "remaining": per_student_expected - paid})
    return {
        "class_id": class_id,
        "fee_structure_id": fs.id,
        "expected_total": expected,
        "total_received": total_received,
        "outstanding_count": len(unpaid_list),
        "outstanding_students": unpaid_list[:200]
    }


@router.get("/reports/summary", response_model=schemas.ReportSummaryOut)
def report_summary(from_date: Optional[date] = None, to_date: Optional[date] = None, class_id: Optional[int] = None, db: Session = Depends(get_db)):
    q_pay = db.query(models.Payment)
    q_exp = db.query(models.Expense)
    q_sal = db.query(models.StaffSalary)
    if from_date:
        q_pay = q_pay.filter(models.Payment.payment_date >= from_date)
        q_exp = q_exp.filter(models.Expense.expense_date >= from_date)
        q_sal = q_sal.filter(models.StaffSalary.paid_date >= from_date)
    if to_date:
        q_pay = q_pay.filter(models.Payment.payment_date <= to_date)
        q_exp = q_exp.filter(models.Expense.expense_date <= to_date)
        q_sal = q_sal.filter(models.StaffSalary.paid_date <= to_date)
    if class_id:
        q_pay = q_pay.join(models.FeeStructure, models.Payment.fee_structure).filter(models.FeeStructure.class_id == class_id)
    total_fees_received = sum([float(r.amount) for r in q_pay.all()])
    total_expenses = sum([float(r.amount) for r in q_exp.all()])
    total_salaries_paid = sum([float(r.net_amount) for r in q_sal.filter(models.StaffSalary.status == "paid").all()])
    net = total_fees_received - (total_expenses + total_salaries_paid)
    return {"period": {"from": str(from_date) if from_date else None, "to": str(to_date) if to_date else None}, "total_fees_received": total_fees_received, "total_expenses": total_expenses, "total_salaries_paid": total_salaries_paid, "net": net}


# -----------------------
# AUDIT LOGS (simple)
# -----------------------
@router.get("/audit-logs", response_model=List[schemas.AuditLogOut])
def audit_logs(resource_type: Optional[str] = None, resource_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(models.AuditLog)
    if resource_type:
        q = q.filter(models.AuditLog.resource_type == resource_type)
    if resource_id:
        q = q.filter(models.AuditLog.resource_id == resource_id)
    return q.order_by(models.AuditLog.created_at.desc()).limit(500).all()
