# models.py
from sqlalchemy import (
    Column, Integer, String, Boolean, ForeignKey, DateTime, Table, Enum, UniqueConstraint,
    Index, Float, Text, Numeric, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum
from datetime import datetime

# --- Task Status Enum ---
class TaskStatus(str, enum.Enum):
    backlog = "Backlog"
    in_progress = "In Progress"
    deployed = "Deployed"
    testing = "Testing"
    merged = "Merged"
    done = "Done"

# Many-to-many: Project <-> User (composite PK)
project_members = Table(
    "project_members",
    Base.metadata,
    Column("project_id", Integer, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
)

# Staff <-> Class (many-to-many)
staff_classes = Table(
    "staff_classes",
    Base.metadata,
    Column("staff_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("class_id", Integer, ForeignKey("classes.id", ondelete="CASCADE"), primary_key=True),
)

# Student <-> Class (many-to-many)
student_classes = Table(
    "student_classes",
    Base.metadata,
    Column("student_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("class_id", Integer, ForeignKey("classes.id", ondelete="CASCADE"), primary_key=True),
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False, index=True)
    email = Column(String(191), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(50), default="Developer", index=True)
    is_active = Column(Boolean, default=True)

    # relationships
    projects = relationship("Project", secondary=project_members, back_populates="members", lazy="selectin")
    assigned_classes = relationship("Class", secondary=staff_classes, back_populates="staff", lazy="selectin")
    enrolled_classes = relationship("Class", secondary=student_classes, back_populates="students", lazy="selectin")

    # attendance bookkeeping
    failed_attendance_attempts = Column(Integer, default=0, nullable=False)
    is_blocked = Column(Boolean, default=False, nullable=False)

    # relationship to Attendance (must match Attendance.user back_populates)
    attendances = relationship(
        "Attendance",
        back_populates="user",
        lazy="selectin",
        cascade="all, delete-orphan"
    )


class Invite(Base):
    __tablename__ = "invites"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(191), unique=True, nullable=False)
    full_name = Column(String(120), nullable=False)
    code = Column(String(100), unique=True, nullable=False)
    is_used = Column(Boolean, default=False)


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    description = Column(String(1000), nullable=True)
    deadline = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    members = relationship("User", secondary=project_members, back_populates="projects", lazy="selectin")
    sprints = relationship("Sprint", back_populates="project", cascade="all, delete-orphan", lazy="selectin")

    __table_args__ = (UniqueConstraint("name", name="uq_projects_name"),)


class Sprint(Base):
    __tablename__ = "sprints"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    start_date = Column(DateTime, server_default=func.now())
    end_date = Column(DateTime, nullable=True)

    project = relationship("Project", back_populates="sprints")
    tasks = relationship("Task", back_populates="sprint", cascade="all, delete-orphan", lazy="selectin")

    __table_args__ = (Index("ix_sprints_project_id_name", "project_id", "name"),)


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(String(2000), nullable=True)
    sprint_id = Column(Integer, ForeignKey("sprints.id", ondelete="SET NULL"), nullable=True, index=True)
    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(Enum(TaskStatus, native_enum=True), default=TaskStatus.backlog, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    sprint = relationship("Sprint", back_populates="tasks")
    user = relationship("User", foreign_keys=[assigned_to])
    bugs = relationship("Bug", back_populates="task", cascade="all, delete-orphan", lazy="selectin")


class Bug(Base):
    __tablename__ = "bugs"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String(1000), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), index=True)
    status = Column(String(50), default="Open", index=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime, server_default=func.now())

    task = relationship("Task", back_populates="bugs")


class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), unique=True, nullable=False, index=True)

    staff = relationship("User", secondary=staff_classes, back_populates="assigned_classes", lazy="selectin")
    students = relationship("User", secondary=student_classes, back_populates="enrolled_classes", lazy="selectin")


# --- Assignment related tables
class AssignmentStatus(str, enum.Enum):
    open = "Open"
    submitted = "Submitted"
    graded = "Graded"
    closed = "Closed"

class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=True)
    assigned_to_student = Column(Integer, ForeignKey("users.id"), nullable=True)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(Enum(AssignmentStatus, native_enum=False), default=AssignmentStatus.open)

    creator = relationship("User", foreign_keys=[created_by])
    class_ref = relationship("Class", foreign_keys=[class_id])
    assigned_student = relationship("User", foreign_keys=[assigned_to_student])

    submissions = relationship("AssignmentSubmission", back_populates="assignment", cascade="all, delete-orphan")


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"
    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    submitted_at = Column(DateTime, default=datetime.utcnow)
    screenshot_path = Column(String(512), nullable=True)
    optional_link = Column(String(512), nullable=True)
    comment = Column(Text, nullable=True)
    is_accepted = Column(Boolean, default=False)
    grader_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    graded_at = Column(DateTime, nullable=True)
    grade_comment = Column(Text, nullable=True)

    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("User", foreign_keys=[student_id])
    grader = relationship("User", foreign_keys=[grader_id])


# --- Attendance (kept from your file)
class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    date = Column(DateTime, nullable=True)
    punch_in_time = Column(DateTime, nullable=True)
    punch_out_time = Column(DateTime, nullable=True)

    punch_in_lat = Column(Float, nullable=True)
    punch_in_lng = Column(Float, nullable=True)
    punch_out_lat = Column(Float, nullable=True)
    punch_out_lng = Column(Float, nullable=True)

    punch_in_ip = Column(String(100), nullable=True)
    punch_out_ip = Column(String(100), nullable=True)

    punch_in_ssid = Column(String(255), nullable=True)
    punch_out_ssid = Column(String(255), nullable=True)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    ssid = Column(String(255), nullable=True)

    note = Column(Text, nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=True)
    updated_at = Column(DateTime, onupdate=func.now(), nullable=True)

    user = relationship("User", back_populates="attendances", lazy="joined")


# ------------------------
# ACCOUNTING / FINANCE MODELS
# ------------------------

class FeeStructure(Base):
    __tablename__ = "fee_structures"
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=True)
    total_amount = Column(Numeric(12,2), nullable=False)
    terms = Column(Integer, default=3, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    class_ref = relationship("Class", foreign_keys=[class_id], lazy="joined")

    __table_args__ = (Index("ix_fee_structures_class_id", "class_id"),)


class PaymentIntent(Base):
    """
    Optional: holds a gateway-like payment intent (pi_xxx).
    Useful when integrating Stripe / Razorpay so we track intent status separately.
    """
    __tablename__ = "payment_intents"
    id = Column(Integer, primary_key=True, index=True)
    intent_id = Column(String(200), unique=True, nullable=True, index=True)   # gateway's id (eg. stripe/pi_xxx)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    fee_structure_id = Column(Integer, ForeignKey("fee_structures.id", ondelete="SET NULL"), nullable=True)
    amount = Column(Numeric(12,2), nullable=False)
    currency = Column(String(10), default="INR")
    status = Column(String(50), default="created")  # created, requires_action, succeeded, canceled
    metadata_ = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    student = relationship("User", foreign_keys=[student_id], lazy="joined")
    fee_structure = relationship("FeeStructure", foreign_keys=[fee_structure_id], lazy="joined")


class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    fee_structure_id = Column(Integer, ForeignKey("fee_structures.id", ondelete="SET NULL"), nullable=True, index=True)
    payment_intent_id = Column(Integer, ForeignKey("payment_intents.id", ondelete="SET NULL"), nullable=True, index=True)
    amount = Column(Numeric(12,2), nullable=False)
    payment_date = Column(DateTime, nullable=False, server_default=func.now())
    payment_method = Column(String(100), nullable=True)
    term_no = Column(Integer, nullable=True, index=True)   # 1..terms or NULL for generic
    reference = Column(String(200), nullable=True)         # txn id
    status = Column(String(50), default="completed")      # completed, pending, failed, refunded
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    student = relationship("User", foreign_keys=[student_id], lazy="joined")
    fee_structure = relationship("FeeStructure", foreign_keys=[fee_structure_id], lazy="joined")
    payment_intent = relationship("PaymentIntent", foreign_keys=[payment_intent_id], lazy="joined")

    __table_args__ = (Index("ix_payments_student_fee_date", "student_id", "fee_structure_id", "payment_date"),)


class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(250), nullable=False)
    description = Column(Text, nullable=True)
    vendor = Column(String(200), nullable=True)
    amount = Column(Numeric(12,2), nullable=False)
    expense_date = Column(DateTime, nullable=False, server_default=func.now())
    category = Column(String(120), nullable=True)
    receipt_reference = Column(String(200), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    creator = relationship("User", foreign_keys=[created_by], lazy="joined")

    __table_args__ = (Index("ix_expenses_date_category", "expense_date", "category"),)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(120), nullable=False)
    resource_type = Column(String(80), nullable=True)
    resource_id = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    actor = relationship("User", foreign_keys=[actor_id], lazy="joined")


class StaffSalary(Base):
    __tablename__ = "staff_salaries"
    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    month = Column(String(20), nullable=False)  # e.g. "2025-09"
    basic = Column(Numeric(12,2), nullable=False, default=0)
    allowances = Column(Numeric(12,2), nullable=False, default=0)
    deductions = Column(Numeric(12,2), nullable=False, default=0)
    net_amount = Column(Numeric(12,2), nullable=False)
    status = Column(String(20), default="pending")  # pending, paid
    paid_date = Column(DateTime, nullable=True)
    reference = Column(String(200), nullable=True)  # txn id / cheque no
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    staff = relationship("User", foreign_keys=[staff_id], lazy="joined")
    creator = relationship("User", foreign_keys=[created_by], lazy="joined")

    __table_args__ = (Index("ix_staff_salaries_staff_month", "staff_id", "month"),)
