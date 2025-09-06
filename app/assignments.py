from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from . import models, database, utils
from datetime import datetime
import os, shutil, uuid

router = APIRouter(prefix="/assignments", tags=["Assignments"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# config for file saving
MEDIA_DIR = "media/assignments"
os.makedirs(MEDIA_DIR, exist_ok=True)

# 1. Staff: create assignment (to class or to single student)
# imports at top if needed


@router.post("/create")
def create_assignment(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    class_id: Optional[int] = Form(None),
    assigned_to_student: Optional[int] = Form(None),
    due_date: Optional[datetime] = Form(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user)
):
    if current_user.role not in ["Admin", "Staff"]:
        raise HTTPException(status_code=403, detail="Only Staff/Admin can create assignments")

    # ==== Important: treat 0 or negative as None (coming from Swagger form)
    if class_id is not None and int(class_id) <= 0:
        class_id = None
    if assigned_to_student is not None and int(assigned_to_student) <= 0:
        assigned_to_student = None

    # require at least one target
    if not class_id and not assigned_to_student:
        raise HTTPException(status_code=400, detail="Provide class_id or assigned_to_student")

    # if class_id provided, check exists
    if class_id:
        cls = db.query(models.Class).filter(models.Class.id == class_id).first()
        if not cls:
            raise HTTPException(status_code=404, detail="Class not found")

    # if assigned_to_student provided, check exists and role=Student
    if assigned_to_student:
        student = db.query(models.User).filter(models.User.id == assigned_to_student, models.User.role == "Student").first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

    assignment = models.Assignment(
        title=title,
        description=description,
        created_by=current_user.id,
        class_id=class_id,
        assigned_to_student=assigned_to_student,
        due_date=due_date
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return {"message": "Assignment created", "assignment_id": assignment.id}

# 2. Get assignments assigned to a student (student view)
@router.get("/student/{student_id}")
def get_assignments_for_student(student_id: int,
                                db: Session = Depends(get_db),
                                current_user: models.User = Depends(utils.get_current_user)):
    # allow student themselves, staff, admin
    if current_user.role == "Student" and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if current_user.role not in ["Admin", "Staff", "Student", "Tester"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # assignments assigned directly
    direct = db.query(models.Assignment).filter(models.Assignment.assigned_to_student == student_id).all()

    # assignments assigned to student's classes
    student = db.query(models.User).filter(models.User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    class_ids = [c.id for c in student.enrolled_classes]  # from relationship
    class_assignments = []
    if class_ids:
        class_assignments = db.query(models.Assignment).filter(models.Assignment.class_id.in_(class_ids)).all()

    # combine unique assignments
    assignments = {a.id: a for a in (direct + class_assignments)}.values()
    result = []
    for a in assignments:
        result.append({
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "due_date": a.due_date,
            "status": a.status.value if a.status else None,
            "assigned_to_student": a.assigned_to_student,
            "class_id": a.class_id,
            "created_by": a.created_by
        })
    return result

# 3. Student: submit assignment (upload screenshot optional + link optional)
@router.post("/{assignment_id}/submit")
def submit_assignment(
    assignment_id: int,
    screenshot: Optional[UploadFile] = File(None),
    optional_link: Optional[str] = Form(None),
    comment: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user)
):
    # only students can submit (or Admin for testing)
    if current_user.role not in ["Student", "Admin"]:
        raise HTTPException(status_code=403, detail="Only Student can submit assignment")

    assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # check assignment target: if assigned_to_student ensure it's the same student
    if assignment.assigned_to_student and assignment.assigned_to_student != current_user.id:
        raise HTTPException(status_code=403, detail="You are not allowed to submit this assignment")

    # handle file
    file_path = None
    if screenshot:
        # validate content type (basic)
        if not screenshot.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Screenshot must be an image file")
        ext = os.path.splitext(screenshot.filename)[1] or ".png"
        fname = f"{uuid.uuid4().hex}{ext}"
        dest = os.path.join(MEDIA_DIR, fname)
        with open(dest, "wb") as buffer:
            shutil.copyfileobj(screenshot.file, buffer)
        file_path = dest  # you may want to store relative path or URL

    # create submission
    submission = models.AssignmentSubmission(
        assignment_id=assignment.id,
        student_id=current_user.id,
        submitted_at=datetime.utcnow(),
        screenshot_path=file_path,
        optional_link=optional_link,
        comment=comment,
        is_accepted=False
    )
    db.add(submission)
    # update assignment status (optional logic)
    assignment.status = models.AssignmentStatus.submitted
    db.commit()
    db.refresh(submission)
    return {"message": "Submitted", "submission_id": submission.id}

# 4. Get submissions for an assignment (Staff/Admin)
@router.get("/{assignment_id}/submissions")
def get_submissions(assignment_id: int,
                    db: Session = Depends(get_db),
                    current_user: models.User = Depends(utils.get_current_user)):
    if current_user.role not in ["Admin", "Staff"]:
        raise HTTPException(status_code=403, detail="Only Staff/Admin can view submissions")

    assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    subs = db.query(models.AssignmentSubmission).filter(models.AssignmentSubmission.assignment_id == assignment_id).all()
    out = []
    for s in subs:
        out.append({
            "id": s.id,
            "student_id": s.student_id,
            "student_name": s.student.full_name if s.student else None,
            "submitted_at": s.submitted_at,
            "screenshot_path": s.screenshot_path,
            "optional_link": s.optional_link,
            "comment": s.comment,
            "is_accepted": s.is_accepted,
            "grader_id": s.grader_id,
            "grade_comment": s.grade_comment,
            "graded_at": s.graded_at
        })
    return out

# 5. Staff/Admin: grade/accept a submission
@router.post("/submission/{submission_id}/grade")
def grade_submission(submission_id: int,
                     is_accepted: bool = Form(...),
                     grade_comment: Optional[str] = Form(None),
                     db: Session = Depends(get_db),
                     current_user: models.User = Depends(utils.get_current_user)):
    if current_user.role not in ["Admin", "Staff"]:
        raise HTTPException(status_code=403, detail="Only Staff/Admin can grade submissions")

    sub = db.query(models.AssignmentSubmission).filter(models.AssignmentSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    sub.is_accepted = is_accepted
    sub.grade_comment = grade_comment
    sub.grader_id = current_user.id
    sub.graded_at = datetime.utcnow()
    # optionally update assignment status to graded/closed if you want
    db.commit()
    return {"message": "Submission graded"}

@router.get("/my")
def get_my_assignments(db: Session = Depends(get_db),
                       current_user: models.User = Depends(utils.get_current_user)) -> List[dict]:
    """
    Staff can view the list of assignments they created.
    Admin can also view their own created assignments.
    """
    if current_user.role not in ["Staff", "Admin"]:
        raise HTTPException(status_code=403, detail="Only Staff/Admin can view their created assignments")

    assignments = db.query(models.Assignment).filter(models.Assignment.created_by == current_user.id).all()
    return [
        {
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "class_id": a.class_id,
            "assigned_to_student": a.assigned_to_student,
            "due_date": a.due_date,
            "created_at": a.created_at,
            "status": a.status.value if a.status else None
        }
        for a in assignments
    ]