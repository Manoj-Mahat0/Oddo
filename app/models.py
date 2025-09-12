# from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Table, Enum
# from sqlalchemy.orm import relationship
# from .database import Base
# from datetime import datetime
# import enum


# # Many-to-many relationship between Project and User
# project_members = Table(
#     "project_members",
#     Base.metadata,
#     Column("project_id", Integer, ForeignKey("projects.id")),
#     Column("user_id", Integer, ForeignKey("users.id"))
# )

# # Association: Staff <-> Class (many-to-many)
# staff_classes = Table(
#     "staff_classes",
#     Base.metadata,
#     Column("staff_id", Integer, ForeignKey("users.id"), primary_key=True),
#     Column("class_id", Integer, ForeignKey("classes.id"), primary_key=True),
# )

# # Association: Student <-> Class (many-to-many)
# student_classes = Table(
#     "student_classes",
#     Base.metadata,
#     Column("student_id", Integer, ForeignKey("users.id"), primary_key=True),
#     Column("class_id", Integer, ForeignKey("classes.id"), primary_key=True),
# )

# class User(Base):
#     __tablename__ = "users"

#     id = Column(Integer, primary_key=True, index=True)
#     full_name = Column(String, nullable=False)
#     email = Column(String, unique=True, index=True, nullable=False)
#     password = Column(String, nullable=False)
#     role = Column(String, default="Developer")
#     is_active = Column(Boolean, default=True)

#     projects = relationship("Project", secondary=project_members, back_populates="members")


# class Invite(Base):
#     __tablename__ = "invites"

#     id = Column(Integer, primary_key=True, index=True)
#     email = Column(String, unique=True, nullable=False)
#     full_name = Column(String, nullable=False)
#     code = Column(String, unique=True, nullable=False)
#     is_used = Column(Boolean, default=False)


# class Project(Base):
#     __tablename__ = "projects"

#     id = Column(Integer, primary_key=True, index=True)
#     name = Column(String, nullable=False)
#     description = Column(String, nullable=True)
#     deadline = Column(DateTime, nullable=True)
#     created_at = Column(DateTime, default=datetime.utcnow)

#     members = relationship("User", secondary=project_members, back_populates="projects")
#     sprints = relationship("Sprint", back_populates="project")




# # --- Task Status Enum ---
# class TaskStatus(str, enum.Enum):
#     backlog = "Backlog"
#     in_progress = "In Progress"
#     deployed = "Deployed"
#     testing = "Testing"
#     merged = "Merged"
#     done = "Done"

# class Sprint(Base):
#     __tablename__ = "sprints"

#     id = Column(Integer, primary_key=True, index=True)
#     name = Column(String, nullable=False)
#     project_id = Column(Integer, ForeignKey("projects.id"))
#     start_date = Column(DateTime, default=datetime.utcnow)
#     end_date = Column(DateTime, nullable=True)

#     project = relationship("Project", back_populates="sprints")
#     tasks = relationship("Task", back_populates="sprint")

# class Task(Base):
#     __tablename__ = "tasks"

#     id = Column(Integer, primary_key=True, index=True)
#     title = Column(String, nullable=False)
#     description = Column(String, nullable=True)
#     sprint_id = Column(Integer, ForeignKey("sprints.id"))
#     assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
#     status = Column(Enum(TaskStatus), default=TaskStatus.backlog)
#     created_at = Column(DateTime, default=datetime.utcnow)

#     sprint = relationship("Sprint", back_populates="tasks")
#     user = relationship("User")
#     bugs = relationship("Bug", back_populates="task")

# class Bug(Base):
#     __tablename__ = "bugs"

#     id = Column(Integer, primary_key=True, index=True)
#     description = Column(String, nullable=False)
#     task_id = Column(Integer, ForeignKey("tasks.id"))
#     status = Column(String, default="Open")
#     created_by = Column(Integer, ForeignKey("users.id"))
#     created_at = Column(DateTime, default=datetime.utcnow)

#     task = relationship("Task", back_populates="bugs")
# # --- Class & Staff/Student Management ---



# class Class(Base):
#     __tablename__ = "classes"

#     id = Column(Integer, primary_key=True, index=True)
#     name = Column(String, unique=True, nullable=False)

#     # staff assigned to this class
#     staff = relationship("User", secondary=staff_classes, back_populates="assigned_classes")
#     # students enrolled in this class
#     students = relationship("User", secondary=student_classes, back_populates="enrolled_classes")


# # Extend User model with reverse relations
# User.assigned_classes = relationship("Class", secondary=staff_classes, back_populates="staff")
# User.enrolled_classes = relationship("Class", secondary=student_classes, back_populates="students")

# models.py
from sqlalchemy import (
    Column, Integer, String, Boolean, ForeignKey, DateTime, Table, Enum, UniqueConstraint, Index, Float, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum
from sqlalchemy import Text
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
# --- Assignment related tables (corrected for MySQL) ---
class AssignmentStatus(str, enum.Enum):
    open = "Open"
    submitted = "Submitted"
    graded = "Graded"
    closed = "Closed"

class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)          # specify length for MySQL
    description = Column(Text, nullable=True)           # long text use Text
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
    screenshot_path = Column(String(512), nullable=True)   # URL or path length; increase if storing long URLs
    optional_link = Column(String(512), nullable=True)     # allow long links
    comment = Column(Text, nullable=True)
    is_accepted = Column(Boolean, default=False)
    grader_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    graded_at = Column(DateTime, nullable=True)
    grade_comment = Column(Text, nullable=True)

    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("User", foreign_keys=[student_id])
    grader = relationship("User", foreign_keys=[grader_id])



# paste this into your app/models.py replacing the old Attendance class
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base  # adjust if your Base import path differs

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # canonical pair columns (preferred)
    date = Column(DateTime, nullable=True)  # optional date-only (DB had it)
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

    # legacy / fallback single-column fields (some rows may still use these)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    ssid = Column(String(255), nullable=True)

    note = Column(Text, nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=True)
    updated_at = Column(DateTime, onupdate=func.now(), nullable=True)

    # relationship to user (optional convenience)
    user = relationship("User", back_populates="attendances", lazy="joined")

