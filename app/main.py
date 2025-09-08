from fastapi import FastAPI
from . import database, models
from .auth import router as auth_router
from .invites import router as invites_router
from .project import router as projects_router
from .sprints import router as sprints_router
from .tasks import router as tasks_router
from .bugs import router as bugs_router
from .users import router as users_router
from .projects_user_view import router as projects_user_view_router
from .classes import router as classes_router
from .staff import router as staff_router
from .students import router as students_router
from .assignments import router as assignments_router
from .attendance import router as attendance_router   # 👈 new
from .finance import router as finance_router
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import pathlib, os

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="ODDO – Project & Team Management System")
# MEDIA_DIR absolute path (better than relative)
PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[1]   # <-- repo root
MEDIA_DIR = PROJECT_ROOT / "media"

os.makedirs(MEDIA_DIR, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(MEDIA_DIR)), name="media")

origins = [
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],   # <-- allow POST, GET, OPTIONS, etc.
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(invites_router)
app.include_router(projects_router)
app.include_router(sprints_router)
app.include_router(tasks_router)
app.include_router(bugs_router)
app.include_router(users_router)
app.include_router(projects_user_view_router)
app.include_router(classes_router)
app.include_router(staff_router)
app.include_router(students_router)
app.include_router(assignments_router)
app.include_router(attendance_router)   # 👈 new
# app.include_router(finance_router)



@app.get("/")
def root():
    return {"message": "Welcome to ODDO API"}
