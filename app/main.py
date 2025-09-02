from fastapi import FastAPI
from . import database, models
from .auth import router as auth_router
from .invites import router as invites_router
from .project import router as projects_router
from .sprints import router as sprints_router
from .tasks import router as tasks_router
from .bugs import router as bugs_router

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="ODDO – Project & Team Management System")

app.include_router(auth_router)
app.include_router(invites_router)
app.include_router(projects_router)
app.include_router(sprints_router)
app.include_router(tasks_router)
app.include_router(bugs_router)


@app.get("/")
def root():
    return {"message": "Welcome to ODDO API"}
