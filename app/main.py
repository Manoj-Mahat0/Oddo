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
from fastapi.middleware.cors import CORSMiddleware

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="ODDO – Project & Team Management System")

origins = [
    "http://localhost:5173",  # Vite dev server
    "http://127.0.0.1:5173",
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


@app.get("/")
def root():
    return {"message": "Welcome to ODDO API"}
