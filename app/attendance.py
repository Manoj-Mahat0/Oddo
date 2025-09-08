# attendance.py
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request, Body, Header, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
from . import models, database, utils
from .config import settings
from .attendance_utils import (
    get_allowed_ssids,
    extract_ssid,
    haversine_distance_m,
    get_client_ip,
    is_ip_allowed,
    is_client_on_router_network,
)

router = APIRouter(prefix="/attendance", tags=["Attendance"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ----------------- Pydantic payloads -----------------
class PunchPayload(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    ssid: Optional[str] = None
    note: Optional[str] = None
    ip: Optional[str] = None   # optional — useful for swagger/manual testing

class AdminMarkPayload(BaseModel):
    user_id: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    ssid: Optional[str] = None
    note: Optional[str] = None

class AdminMarkOutPayload(BaseModel):
    user_id: int
    attendance_id: Optional[int] = None  # optional: target record id
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    ssid: Optional[str] = None
    note: Optional[str] = None
    punch_out_time: Optional[str] = None   # ISO string (optional). If omitted, server time UTC used.
    ip: Optional[str] = None

# ----------------- Settings -----------------
MAX_ATTEMPTS = int(getattr(settings, "ATTEMPT_LIMIT", 15))
OFFICE_LAT = float(getattr(settings, "OFFICE_LAT", 0.0))
OFFICE_LNG = float(getattr(settings, "OFFICE_LNG", 0.0))
ALLOWED_RADIUS_METERS = int(getattr(settings, "ALLOWED_RADIUS_METERS", 150))

# ----------------- Helpers -----------------
def is_ssid_allowed(ssid: Optional[str]) -> bool:
    if not ssid:
        return False
    ss = ssid.strip().lower()
    allowed = [a.strip().lower() for a in get_allowed_ssids()]
    return ss in allowed

def check_and_increment_fail(db: Session, user: models.User, reason_msg: str):
    """Increment failed attempts, possibly block, commit and raise HTTPException."""
    user.failed_attendance_attempts = (user.failed_attendance_attempts or 0) + 1
    if user.failed_attendance_attempts >= MAX_ATTEMPTS:
        user.is_blocked = True
    db.add(user)
    db.commit()
    remaining = max(0, MAX_ATTEMPTS - user.failed_attendance_attempts)
    if user.is_blocked:
        raise HTTPException(status_code=403, detail=f"{reason_msg} You have been blocked after {MAX_ATTEMPTS} failed attempts.")
    else:
        raise HTTPException(status_code=403, detail=f"{reason_msg} Attempts left: {remaining}")

# ----------------- Endpoints -----------------

@router.post("/punch-in")
def punch_in(
    payload: PunchPayload = Body(...),
    request: Request = None,
    x_client_ssid: Optional[str] = Header(None, alias="X-Client-SSID"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user),
):
    """
    Punch-in requires SSID, geo, and network IP to match allowed values.
    Router-network based check is supported (ALLOWED_ROUTER_IPS).
    """
    # role-based optional restriction (adjust as needed)
    if getattr(current_user, "role", None) not in ["Developer", "Tester", "SEO", "HR", "Accountant","Student","Staff","Intern", None]:
        raise HTTPException(status_code=403, detail="Not allowed to punch in")

    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if getattr(user, "is_blocked", False):
        raise HTTPException(status_code=403, detail="Your account is blocked due to multiple failed attempts. Contact admin.")

    # SSID check
    ssid = extract_ssid(request, payload.ssid, x_client_ssid)
    ssid_ok = is_ssid_allowed(ssid)

    # Geo check
    lat = payload.latitude
    lng = payload.longitude
    geo_ok = False
    if lat is not None and lng is not None:
        dist_m = haversine_distance_m(lat, lng, OFFICE_LAT, OFFICE_LNG)
        geo_ok = dist_m <= ALLOWED_RADIUS_METERS

    # IP check — prefer payload.ip (manual tests) else read headers/request
    client_ip = (payload.ip or "").strip() or get_client_ip(request)
    ip_allowed_direct = is_ip_allowed(client_ip)
    ip_allowed_router_net = is_client_on_router_network(client_ip)
    ip_ok = ip_allowed_direct or ip_allowed_router_net

    if not (ssid_ok and geo_ok and ip_ok):
        # build reason string
        reasons = []
        if not ssid_ok:
            reasons.append("SSID mismatch")
        if not geo_ok:
            reasons.append("location outside allowed area")
        if not ip_ok:
            reasons.append("network IP not allowed")
        reason = " and ".join(reasons) + "."
        check_and_increment_fail(db, user, reason)

    # success -> reset attempts and record attendance (punch-in)
    user.failed_attendance_attempts = 0
    db.add(user)
    db.commit()

    att = models.Attendance(
        user_id=user.id,
        punch_in_time=datetime.utcnow(),
        latitude=lat,
        longitude=lng,
        ssid=ssid,
        note=payload.note or "punch-in",
    )
    db.add(att)
    db.commit()
    db.refresh(att)

    return {
        "message": "Attendance recorded (punch-in)",
        "attendance_id": att.id,
        "punch_in_time": att.punch_in_time.isoformat(),
        "client_ip": client_ip,
    }

@router.post("/punch-out")
def punch_out(
    payload: PunchPayload = Body(...),
    request: Request = None,
    x_client_ssid: Optional[str] = Header(None, alias="X-Client-SSID"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user),
):
    # role & user checks
    if getattr(current_user, "role", None) not in ["Developer", "Tester", "SEO", "HR", "Accountant","Student","Staff","Intern", None]:
        raise HTTPException(status_code=403, detail="Not allowed to punch out")

    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if getattr(user, "is_blocked", False):
        raise HTTPException(status_code=403, detail="Your account is blocked.")

    # validation checks (SSID, geo, IP) - same logic as before
    ssid = extract_ssid(request, payload.ssid, x_client_ssid)
    ssid_ok = is_ssid_allowed(ssid)

    lat = payload.latitude
    lng = payload.longitude
    geo_ok = False
    if lat is not None and lng is not None:
        dist_m = haversine_distance_m(lat, lng, OFFICE_LAT, OFFICE_LNG)
        geo_ok = dist_m <= ALLOWED_RADIUS_METERS

    client_ip = (payload.ip or "").strip() or get_client_ip(request)
    ip_allowed_direct = is_ip_allowed(client_ip)
    ip_allowed_router_net = is_client_on_router_network(client_ip)
    ip_ok = ip_allowed_direct or ip_allowed_router_net

    if not (ssid_ok and geo_ok and ip_ok):
        reasons = []
        if not ssid_ok:
            reasons.append("SSID mismatch")
        if not geo_ok:
            reasons.append("location outside allowed area")
        if not ip_ok:
            reasons.append("network IP not allowed")
        reason = " and ".join(reasons) + "."
        check_and_increment_fail(db, user, reason)

    # success -> reset attempts
    user.failed_attendance_attempts = 0
    db.add(user)
    db.commit()

    now = datetime.utcnow()

    # Try to find latest open attendance row for this user (no punch_out_time)
    open_att = (
        db.query(models.Attendance)
        .filter(models.Attendance.user_id == user.id)
        .filter((models.Attendance.punch_out_time == None) | (models.Attendance.punch_out_time == ""))
        .order_by(models.Attendance.punch_in_time.desc())
        .first()
    )

    if open_att:
        # Update existing row with punch_out_* columns
        open_att.punch_out_time = now
        # If your schema uses punch_out_lat / punch_out_lng etc
        if hasattr(open_att, "punch_out_lat"):
            open_att.punch_out_lat = lat
        if hasattr(open_att, "punch_out_lng"):
            open_att.punch_out_lng = lng
        if hasattr(open_att, "punch_out_ip"):
            open_att.punch_out_ip = client_ip
        if hasattr(open_att, "punch_out_ssid"):
            open_att.punch_out_ssid = ssid
        open_att.note = payload.note or (open_att.note or "") + " | punch-out"
        open_att.updated_at = datetime.utcnow() if hasattr(open_att, "updated_at") else open_att.updated_at
        db.add(open_att)
        db.commit()
        db.refresh(open_att)

        # compute duration if punch_in_time exists
        duration_seconds = None
        if open_att.punch_in_time and open_att.punch_out_time:
            delta = open_att.punch_out_time - open_att.punch_in_time
            duration_seconds = int(delta.total_seconds()) if delta.total_seconds() >= 0 else 0

        return {
            "message": "Punch-out updated on existing record",
            "attendance_id": open_att.id,
            "punch_in_time": open_att.punch_in_time.isoformat() if open_att.punch_in_time else None,
            "punch_out_time": open_att.punch_out_time.isoformat() if open_att.punch_out_time else None,
            "duration_seconds": duration_seconds,
            "client_ip": client_ip,
        }
    else:
        # No open row found — create a new row containing punch_out_* only
        att = models.Attendance(
            user_id=user.id,
            date=now.date() if hasattr(models.Attendance, "date") else None,
            punch_out_time=now,
            punch_out_lat=lat if hasattr(models.Attendance, "punch_out_lat") else None,
            punch_out_lng=lng if hasattr(models.Attendance, "punch_out_lng") else None,
            punch_out_ip=client_ip if hasattr(models.Attendance, "punch_out_ip") else None,
            punch_out_ssid=ssid if hasattr(models.Attendance, "punch_out_ssid") else None,
            note=payload.note or "punch-out (no open in)",
        )
        db.add(att)
        db.commit()
        db.refresh(att)
        return {
            "message": "Punch-out recorded as new record (no open punch-in found)",
            "attendance_id": att.id,
            "punch_out_time": att.punch_out_time.isoformat() if att.punch_out_time else None,
            "client_ip": client_ip,
        }



@router.get("/me")
def my_attendance(
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user),
):
    """
    Return attendance records for current user.
    - If DB has punch_out_time column, calculate per-row durations (preferred).
    - Otherwise fallback to pairing separate rows by note detection.
    """
    def format_duration_seconds(sec: Optional[int]) -> Optional[str]:
        if sec is None:
            return None
        h = sec // 3600
        m = (sec % 3600) // 60
        s = sec % 60
        return f"{h:02d}:{m:02d}:{s:02d}"

    # Fetch rows newest-first (we'll slice by limit later)
    rows = (
        db.query(models.Attendance)
        .filter(models.Attendance.user_id == current_user.id)
        .order_by(models.Attendance.punch_in_time.desc())
        .all()
    )

    # Preferred branch: per-row punch_in_time + punch_out_time columns exist
    if hasattr(models.Attendance, "punch_out_time"):
        pairs = []
        total_seconds = 0
        for r in rows[:limit]:
            in_time = getattr(r, "punch_in_time", None)
            out_time = getattr(r, "punch_out_time", None)
            duration_sec = None
            if in_time and out_time:
                delta = out_time - in_time
                duration_sec = max(0, int(delta.total_seconds()))
                total_seconds += duration_sec
            pairs.append({
                "punch_in_time": in_time.isoformat() if in_time else None,
                "punch_out_time": out_time.isoformat() if out_time else None,
                "duration_seconds": duration_sec,
                "duration": format_duration_seconds(duration_sec) if duration_sec is not None else None,
                "in_id": getattr(r, "id", None),
                "out_id": getattr(r, "id", None),
                "punch_in_lat": getattr(r, "punch_in_lat", None) or getattr(r, "latitude", None),
                "punch_out_lat": getattr(r, "punch_out_lat", None),
                "punch_in_ip": getattr(r, "punch_in_ip", None),
                "punch_out_ip": getattr(r, "punch_out_ip", None),
                "note": getattr(r, "note", None),
            })
        return {
            "count": len(pairs),
            "total_work_seconds": total_seconds,
            "total_work_time": format_duration_seconds(total_seconds) if total_seconds else "00:00:00",
            "pairs": pairs,
        }

    # Fallback branch: older schema using separate rows (pairing by notes)
    # We'll operate ascending so pairing logic is straightforward
    rows_asc = list(reversed(rows))

    def note_is_punch_in(note: Optional[str]) -> bool:
        if not note:
            return False
        s = str(note).lower()
        return "punch-in" in s or s.strip() in ("in", "punchin", "punch in") or "in office" in s

    def note_is_punch_out(note: Optional[str]) -> bool:
        if not note:
            return False
        s = str(note).lower()
        return "punch-out" in s or s.strip() in ("out", "punchout", "punch out") or "leaving" in s

    pairs = []
    total_seconds = 0
    pending_in = None

    for r in rows_asc:
        note = getattr(r, "note", "") or ""
        if pending_in is None:
            if note_is_punch_in(note) or not note_is_punch_out(note):
                pending_in = r
                continue
            else:
                # standalone punch-out without an earlier in
                out_time = getattr(r, "punch_in_time", None)
                pairs.append({
                    "punch_in_time": None,
                    "punch_out_time": out_time.isoformat() if out_time else None,
                    "duration_seconds": None,
                    "duration": None,
                    "in_id": None,
                    "out_id": getattr(r, "id", None),
                    "note": note,
                })
                continue
        else:
            if note_is_punch_out(note):
                in_time = getattr(pending_in, "punch_in_time", None)
                out_time = getattr(r, "punch_in_time", None)
                duration_sec = None
                if in_time and out_time:
                    delta = out_time - in_time
                    duration_sec = max(0, int(delta.total_seconds()))
                    total_seconds += duration_sec
                pairs.append({
                    "punch_in_time": in_time.isoformat() if in_time else None,
                    "punch_out_time": out_time.isoformat() if out_time else None,
                    "duration_seconds": duration_sec,
                    "duration": format_duration_seconds(duration_sec) if duration_sec is not None else None,
                    "in_id": getattr(pending_in, "id", None),
                    "out_id": getattr(r, "id", None),
                    "note": f"{getattr(pending_in,'note',None)} | {note}",
                })
                pending_in = None
                continue
            else:
                # treat current as a new in, close previous as open
                in_time = getattr(pending_in, "punch_in_time", None)
                pairs.append({
                    "punch_in_time": in_time.isoformat() if in_time else None,
                    "punch_out_time": None,
                    "duration_seconds": None,
                    "duration": None,
                    "in_id": getattr(pending_in, "id", None),
                    "out_id": None,
                    "note": getattr(pending_in, "note", None),
                })
                pending_in = r
                continue

    # if still open at end, include it
    if pending_in is not None:
        pairs.append({
            "punch_in_time": getattr(pending_in, "punch_in_time", None).isoformat() if getattr(pending_in, "punch_in_time", None) else None,
            "punch_out_time": None,
            "duration_seconds": None,
            "duration": None,
            "in_id": getattr(pending_in, "id", None),
            "out_id": None,
            "note": getattr(pending_in, "note", None),
        })

    # sort pairs by punch_in_time desc for recent-first, then limit
    pairs_sorted = sorted(pairs, key=lambda x: x["punch_in_time"] or "", reverse=True)
    return {
        "count": len(pairs_sorted),
        "total_work_seconds": total_seconds,
        "total_work_time": format_duration_seconds(total_seconds) if total_seconds else "00:00:00",
        "pairs": pairs_sorted[:limit],
    }


# Admin endpoints
@router.post("/admin/mark")
def admin_mark(
    payload: AdminMarkPayload = Body(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user),
):
    """
    Admin can manually create an attendance entry for any user.
    """
    if getattr(current_user, "role", None) != "Admin":
        raise HTTPException(status_code=403, detail="Only Admin can manually mark attendance")

    target = db.query(models.User).filter(models.User.id == payload.user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    att = models.Attendance(
        user_id=target.id,
        punch_in_time=datetime.utcnow(),
        latitude=payload.latitude,
        longitude=payload.longitude,
        ssid=payload.ssid,
        note=payload.note or "admin-mark",
    )
    db.add(att)
    db.commit()
    db.refresh(att)
    return {"message": "Marked", "attendance_id": att.id}

@router.post("/admin/mark-out")
def admin_mark_out(
    payload: AdminMarkOutPayload = Body(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user),
):
    """
    Admin: close (punch-out) a user's open attendance record, or close specific attendance_id.
    If no open record found, creates a new punch-out-only record.
    """
    if getattr(current_user, "role", None) != "Admin":
        raise HTTPException(status_code=403, detail="Only Admin can perform this action")

    target = db.query(models.User).filter(models.User.id == payload.user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    # parse provided punch_out_time if any
    if payload.punch_out_time:
        try:
            # support ISO like "2025-09-06T07:18:39" or "2025-09-06 07:18:39"
            pout = datetime.fromisoformat(payload.punch_out_time.replace(" ", "T"))
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid punch_out_time format. Use ISO format.")
    else:
        pout = datetime.utcnow()

    # prefer explicit attendance_id if given
    open_att = None
    if payload.attendance_id:
        open_att = db.query(models.Attendance).filter(models.Attendance.id == payload.attendance_id,
                                                     models.Attendance.user_id == payload.user_id).first()
        if not open_att:
            raise HTTPException(status_code=404, detail="Attendance record not found for given attendance_id")
    else:
        # find latest open attendance for user (punch_out_time is NULL)
        # If model doesn't have punch_out_time column, fall back to None -> handled below
        if hasattr(models.Attendance, "punch_out_time"):
            open_att = (
                db.query(models.Attendance)
                .filter(models.Attendance.user_id == payload.user_id)
                .filter(models.Attendance.punch_out_time == None)
                .order_by(models.Attendance.punch_in_time.desc())
                .first()
            )

    client_ip = (payload.ip or "").strip()
    ssid = payload.ssid

    if open_att:
        # update existing row's punch_out_* fields if those columns exist
        if hasattr(open_att, "punch_out_time"):
            open_att.punch_out_time = pout
        if hasattr(open_att, "punch_out_lat"):
            open_att.punch_out_lat = payload.latitude
        if hasattr(open_att, "punch_out_lng"):
            open_att.punch_out_lng = payload.longitude
        if hasattr(open_att, "punch_out_ip") and client_ip:
            open_att.punch_out_ip = client_ip
        if hasattr(open_att, "punch_out_ssid") and ssid:
            open_att.punch_out_ssid = ssid
        # if legacy single-column fields exist, set them carefully (do not overwrite existing punch_in_* fields)
        if not hasattr(open_att, "punch_out_time") and hasattr(open_att, "ssid") and ssid:
            open_att.ssid = ssid

        open_att.note = payload.note or (open_att.note or "") + " | admin-punch-out"
        if hasattr(open_att, "updated_at"):
            open_att.updated_at = datetime.utcnow()

        try:
            db.add(open_att)
            db.commit()
            db.refresh(open_att)
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"DB error saving punch-out: {e}")

        # compute duration if punch_in_time present
        duration_seconds = None
        if getattr(open_att, "punch_in_time", None) and getattr(open_att, "punch_out_time", None):
            delta = open_att.punch_out_time - open_att.punch_in_time
            duration_seconds = max(0, int(delta.total_seconds()))

        return {
            "message": "Attendance updated with punch-out (admin)",
            "attendance_id": open_att.id,
            "punch_in_time": getattr(open_att, "punch_in_time", None).isoformat() if getattr(open_att, "punch_in_time", None) else None,
            "punch_out_time": getattr(open_att, "punch_out_time", None).isoformat() if getattr(open_att, "punch_out_time", None) else None,
            "duration_seconds": duration_seconds,
        }

    # else: no open_att found -> create a new row that contains punch_out_* only (fallback)
    att_kwargs = {"user_id": payload.user_id, "note": payload.note or "admin-punch-out (no open in)"}
    if hasattr(models.Attendance, "punch_out_time"):
        att_kwargs["punch_out_time"] = pout
        if hasattr(models.Attendance, "punch_out_lat"):
            att_kwargs["punch_out_lat"] = payload.latitude
        if hasattr(models.Attendance, "punch_out_lng"):
            att_kwargs["punch_out_lng"] = payload.longitude
        if hasattr(models.Attendance, "punch_out_ip") and client_ip:
            att_kwargs["punch_out_ip"] = client_ip
        if hasattr(models.Attendance, "punch_out_ssid") and ssid:
            att_kwargs["punch_out_ssid"] = ssid
    else:
        # legacy fallback: create a row using punch_in_time field as a standalone out-record
        att_kwargs.update({
            "punch_in_time": pout,
            "latitude": payload.latitude,
            "longitude": payload.longitude,
            "ssid": ssid,
        })

    att = models.Attendance(**att_kwargs)
    try:
        db.add(att)
        db.commit()
        db.refresh(att)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"DB error creating punch-out record: {e}")

    return {
        "message": "Punch-out recorded as new record (admin fallback)",
        "attendance_id": att.id,
        "punch_out_time": getattr(att, "punch_out_time", None).isoformat() if getattr(att, "punch_out_time", None) else getattr(att, "punch_in_time", None).isoformat() if getattr(att, "punch_in_time", None) else None,
    }

@router.get("/admin/all")
def admin_list_all(
    user_id: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=2000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user),
):
    """
    Admin: list all attendance records with optional user_id filter, pagination.
    Returns per-record punch_in/punch_out and duration; also returns total_work_seconds/time.
    """
    if getattr(current_user, "role", None) != "Admin":
        raise HTTPException(status_code=403, detail="Only Admin can view all attendance")

    q = db.query(models.Attendance)
    if user_id is not None:
        q = q.filter(models.Attendance.user_id == user_id)
    total = q.count()
    rows = q.order_by(models.Attendance.id.desc()).offset(offset).limit(limit).all()

    def fmt_seconds(sec: Optional[int]) -> Optional[str]:
        if sec is None:
            return None
        h = sec // 3600
        m = (sec % 3600) // 60
        s = sec % 60
        return f"{h:02d}:{m:02d}:{s:02d}"

    records = []
    total_work_seconds = 0

    for r in rows:
        in_time = getattr(r, "punch_in_time", None)
        out_time = getattr(r, "punch_out_time", None)

        duration_seconds = None
        if in_time and out_time:
            try:
                delta = out_time - in_time
                duration_seconds = max(0, int(delta.total_seconds()))
                total_work_seconds += duration_seconds
            except Exception:
                duration_seconds = None

        # pick lat/lng fields intelligently (prefer punch_in_*/punch_out_* if present)
        punch_in_lat = getattr(r, "punch_in_lat", None)
        punch_out_lat = getattr(r, "punch_out_lat", None)
        punch_in_lng = getattr(r, "punch_in_lng", None)
        punch_out_lng = getattr(r, "punch_out_lng", None)
        legacy_lat = getattr(r, "latitude", None)
        legacy_lng = getattr(r, "longitude", None)

        # IP & SSID fields
        punch_in_ip = getattr(r, "punch_in_ip", None)
        punch_out_ip = getattr(r, "punch_out_ip", None)
        punch_in_ssid = getattr(r, "punch_in_ssid", None)
        punch_out_ssid = getattr(r, "punch_out_ssid", None)
        legacy_ssid = getattr(r, "ssid", None)

        records.append({
            "id": r.id,
            "user_id": r.user_id,
            "punch_in_time": in_time.isoformat() if in_time else None,
            "punch_out_time": out_time.isoformat() if out_time else None,
            "duration_seconds": duration_seconds,
            "duration": fmt_seconds(duration_seconds) if duration_seconds is not None else None,
            "punch_in_lat": punch_in_lat,
            "punch_in_lng": punch_in_lng,
            "punch_out_lat": punch_out_lat,
            "punch_out_lng": punch_out_lng,
            "latitude": legacy_lat,
            "longitude": legacy_lng,
            "punch_in_ip": punch_in_ip,
            "punch_out_ip": punch_out_ip,
            "punch_in_ssid": punch_in_ssid,
            "punch_out_ssid": punch_out_ssid,
            "ssid": legacy_ssid,
            "note": getattr(r, "note", None),
            "created_at": getattr(r, "created_at", None).isoformat() if getattr(r, "created_at", None) else None,
        })

    return {
        "total": total,
        "count": len(records),
        "offset": offset,
        "limit": limit,
        "total_work_seconds": total_work_seconds,
        "total_work_time": fmt_seconds(total_work_seconds) if total_work_seconds else "00:00:00",
        "records": records,
    }


@router.post("/admin/unblock/{user_id}")
def admin_unblock_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user),
):
    """
    Admin: Unblock a user (reset failed attempts).
    """
    if getattr(current_user, "role", None) != "Admin":
        raise HTTPException(status_code=403, detail="Only Admin can unblock users")

    target = db.query(models.User).filter(models.User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    target.is_blocked = False
    target.failed_attendance_attempts = 0
    db.add(target)
    db.commit()
    db.refresh(target)

    return {
        "message": f"User {target.email} has been unblocked",
        "user_id": target.id,
        "is_blocked": target.is_blocked,
        "failed_attempts": target.failed_attendance_attempts,
    }

@router.get("/admin/blocked")
def admin_list_blocked(
    q: Optional[str] = Query(None, description="search by email or name"),
    limit: int = Query(50, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(utils.get_current_user),
):
    """
    Admin: list blocked users. Optional search (email or full_name).
    """
    if getattr(current_user, "role", None) != "Admin":
        raise HTTPException(status_code=403, detail="Only Admin can view blocked users")

    query = db.query(models.User).filter(models.User.is_blocked == True)
    if q:
        q_like = f"%{q.strip().lower()}%"
        # case-insensitive search (DB collation may already handle case insensitivity)
        query = query.filter(
            (models.User.email.ilike(q_like)) | (models.User.full_name.ilike(q_like))
        )
    total = query.count()
    rows = query.order_by(models.User.failed_attendance_attempts.desc(), models.User.id.desc()).offset(offset).limit(limit).all()

    out = []
    for u in rows:
        out.append({
            "id": u.id,
            "full_name": getattr(u, "full_name", None),
            "email": getattr(u, "email", None),
            "role": getattr(u, "role", None),
            "failed_attendance_attempts": getattr(u, "failed_attendance_attempts", 0),
            "is_blocked": getattr(u, "is_blocked", False),
        })

    return {
        "total_blocked": total,
        "count": len(out),
        "offset": offset,
        "limit": limit,
        "users": out,
    }