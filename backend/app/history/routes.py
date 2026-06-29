from datetime import date, datetime, time

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.db import get_db
from app.models.entities import Conversation, Message, User

router = APIRouter(prefix="/history", tags=["history"])


@router.get("/search")
def search_history(
    q: str = Query(min_length=2),
    project_id: int | None = None,
    model: str | None = None,
    tag: str | None = None,
    from_date: date | None = None,
    to_date: date | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Message, Conversation)
        .join(Conversation, Message.conversation_id == Conversation.id)
        .filter(Conversation.user_id == user.id)
        .filter(Message.content.ilike(f"%{q}%"))
    )

    if project_id is not None:
        query = query.filter(Conversation.project_id == project_id)
    if model:
        query = query.filter((Message.model == model) | (Conversation.model == model))
    if tag:
        query = query.filter(Message.tags.ilike(f"%{tag}%"))
    if from_date:
        query = query.filter(Message.created_at >= datetime.combine(from_date, time.min))
    if to_date:
        query = query.filter(Message.created_at <= datetime.combine(to_date, time.max))

    rows = query.order_by(Message.created_at.desc()).limit(200).all()
    return [
        {
            "message_id": m.id,
            "conversation_id": c.id,
            "conversation_title": c.title,
            "role": m.role,
            "content": m.content,
            "model": m.model or c.model,
            "tokens": m.tokens,
            "elapsed_ms": m.elapsed_ms,
            "tags": m.tags,
            "created_at": m.created_at,
        }
        for m, c in rows
    ]
