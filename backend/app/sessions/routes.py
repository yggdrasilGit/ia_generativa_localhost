from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.db import get_db
from app.models.entities import User, UserSession

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.get("")
def list_sessions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(UserSession)
        .filter(UserSession.user_id == user.id)
        .order_by(UserSession.created_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "device": r.device,
            "ip": r.ip,
            "user_agent": r.user_agent,
            "created_at": r.created_at,
            "expires_at": r.expires_at,
            "expired": r.expires_at < datetime.utcnow(),
        }
        for r in rows
    ]


@router.delete("/{session_id}")
def revoke_session(session_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(UserSession).filter(UserSession.id == session_id, UserSession.user_id == user.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    db.delete(row)
    db.commit()
    return {"ok": True}
