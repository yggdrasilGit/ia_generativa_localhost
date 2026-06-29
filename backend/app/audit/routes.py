from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.db import get_db
from app.models.entities import AuditLog, User

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("")
def list_audit(limit: int = Query(default=200, ge=1, le=1000), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(AuditLog)
        .filter(AuditLog.user_id == user.id)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return [{"id": r.id, "action": r.action, "details": r.details, "created_at": r.created_at} for r in rows]
