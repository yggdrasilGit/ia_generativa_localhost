from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.db import get_db
from app.models.entities import Conversation, Message, User

router = APIRouter(tags=["conversations"])


class ConversationIn(BaseModel):
    title: str
    project_id: int | None = None
    model: str | None = None
    favorite: bool = False
    archived: bool = False
    pinned: bool = False


class ConversationOut(BaseModel):
    id: int
    title: str
    project_id: int | None = None
    model: str | None = None
    favorite: bool
    archived: bool
    pinned: bool
    created_at: datetime
    updated_at: datetime


@router.get("/conversations", response_model=list[ConversationOut])
def list_conversations(
    archived: bool | None = None,
    include_deleted: bool = False,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Conversation).filter(Conversation.user_id == user.id)
    if archived is not None:
        q = q.filter(Conversation.archived == archived)
    if not include_deleted:
        q = q.filter(Conversation.deleted_at.is_(None))
    rows = q.order_by(Conversation.pinned.desc(), Conversation.updated_at.desc()).all()
    return [ConversationOut.model_validate(r, from_attributes=True) for r in rows]


@router.post("/conversations", response_model=ConversationOut)
def create_conversation(body: ConversationIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = Conversation(
        user_id=user.id,
        title=body.title.strip(),
        project_id=body.project_id,
        model=body.model,
        favorite=body.favorite,
        archived=body.archived,
        pinned=body.pinned,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return ConversationOut.model_validate(row, from_attributes=True)


@router.put("/conversations/{conversation_id}", response_model=ConversationOut)
def update_conversation(conversation_id: int, body: ConversationIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")
    row.title = body.title.strip()
    row.project_id = body.project_id
    row.model = body.model
    row.favorite = body.favorite
    row.archived = body.archived
    row.pinned = body.pinned
    db.commit()
    db.refresh(row)
    return ConversationOut.model_validate(row, from_attributes=True)


@router.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: int, trash_days: int = Query(default=30, ge=1, le=90), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")
    row.deleted_at = datetime.utcnow()
    db.commit()
    return {"ok": True, "deleted_until": (datetime.utcnow() + timedelta(days=trash_days)).isoformat()}


@router.post("/conversations/{conversation_id}/duplicate", response_model=ConversationOut)
def duplicate_conversation(conversation_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")

    cloned = Conversation(
        user_id=user.id,
        project_id=row.project_id,
        title=f"{row.title} (cópia)",
        model=row.model,
        favorite=False,
        archived=False,
        pinned=False,
    )
    db.add(cloned)
    db.flush()

    msgs = db.query(Message).filter(Message.conversation_id == row.id).order_by(Message.created_at.asc()).all()
    for m in msgs:
        db.add(
            Message(
                conversation_id=cloned.id,
                role=m.role,
                content=m.content,
                model=m.model,
                tokens=m.tokens,
                elapsed_ms=m.elapsed_ms,
                tags=m.tags,
            )
        )

    db.commit()
    db.refresh(cloned)
    return ConversationOut.model_validate(cloned, from_attributes=True)


class MoveConversationRequest(BaseModel):
    project_id: int | None = None


@router.post("/conversations/{conversation_id}/move", response_model=ConversationOut)
def move_conversation(conversation_id: int, body: MoveConversationRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")
    row.project_id = body.project_id
    db.commit()
    db.refresh(row)
    return ConversationOut.model_validate(row, from_attributes=True)


@router.post("/conversations/{conversation_id}/restore")
def restore_conversation(conversation_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")
    row.deleted_at = None
    db.commit()
    return {"ok": True}


class MessageIn(BaseModel):
    role: str
    content: str
    model: str | None = None
    tokens: int | None = None
    elapsed_ms: float | None = None
    tags: str | None = None


@router.post("/conversations/{conversation_id}/messages")
def add_message(conversation_id: int, body: MessageIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")

    msg = Message(
        conversation_id=conversation_id,
        role=body.role,
        content=body.content,
        model=body.model,
        tokens=body.tokens,
        elapsed_ms=body.elapsed_ms,
        tags=body.tags,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {
        "id": msg.id,
        "conversation_id": msg.conversation_id,
        "role": msg.role,
        "content": msg.content,
        "model": msg.model,
        "tokens": msg.tokens,
        "elapsed_ms": msg.elapsed_ms,
        "tags": msg.tags,
        "created_at": msg.created_at,
    }


@router.get("/messages/{conversation_id}")
def get_messages(conversation_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")
    msgs = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at.asc()).all()
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "model": m.model,
            "tokens": m.tokens,
            "elapsed_ms": m.elapsed_ms,
            "tags": m.tags,
            "created_at": m.created_at,
        }
        for m in msgs
    ]
