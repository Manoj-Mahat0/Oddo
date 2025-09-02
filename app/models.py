from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Table, Enum
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime
import enum


# Many-to-many relationship between Project and User
project_members = Table(
    "project_members",
    Base.metadata,
    Column("project_id", Integer, ForeignKey("projects.id")),
    Column("user_id", Integer, ForeignKey("users.id"))
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="Developer")
    is_active = Column(Boolean, default=True)

    projects = relationship("Project", secondary=project_members, back_populates="members")


class Invite(Base):
    __tablename__ = "invites"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    full_name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    is_used = Column(Boolean, default=False)


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    deadline = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    members = relationship("User", secondary=project_members, back_populates="projects")
    sprints = relationship("Sprint", back_populates="project")




# --- Task Status Enum ---
class TaskStatus(str, enum.Enum):
    backlog = "Backlog"
    in_progress = "In Progress"
    deployed = "Deployed"
    testing = "Testing"
    merged = "Merged"
    done = "Done"

class Sprint(Base):
    __tablename__ = "sprints"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"))
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)

    project = relationship("Project", back_populates="sprints")
    tasks = relationship("Task", back_populates="sprint")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    sprint_id = Column(Integer, ForeignKey("sprints.id"))
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(Enum(TaskStatus), default=TaskStatus.backlog)
    created_at = Column(DateTime, default=datetime.utcnow)

    sprint = relationship("Sprint", back_populates="tasks")
    user = relationship("User")
    bugs = relationship("Bug", back_populates="task")

class Bug(Base):
    __tablename__ = "bugs"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    status = Column(String, default="Open")
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="bugs")
