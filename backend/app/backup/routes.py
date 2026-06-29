from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.db import get_db
from app.models.entities import Conversation, Message, Project, User, UserSettings

router = APIRouter(prefix="/backup", tags=["backup"])


class BackupImportRequest(BaseModel):
    projects: list[dict] = []
    conversations: list[dict] = []
    messages: list[dict] = []
    settings: dict | None = None


@router.post("/export")
def export_backup(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    projects = db.query(Project).filter(Project.user_id == user.id).all()
    conversations = db.query(Conversation).filter(Conversation.user_id == user.id).all()
    conv_ids = [c.id for c in conversations]
    messages = db.query(Message).filter(Message.conversation_id.in_(conv_ids)).all() if conv_ids else []
    settings = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()

    return {
        "version": "1.0",
        "exported_at": datetime.utcnow().isoformat(),
        "projects": [
            {"id": p.id, "name": p.name, "description": p.description, "created_at": p.created_at.isoformat()}
            for p in projects
        ],
        "conversations": [
            {
                "id": c.id,
                "project_id": c.project_id,
                "title": c.title,
                "model": c.model,
                "favorite": c.favorite,
                "archived": c.archived,
                "pinned": c.pinned,
                "created_at": c.created_at.isoformat(),
            }
            for c in conversations
        ],
        "messages": [
            {
                "conversation_id": m.conversation_id,
                "role": m.role,
                "content": m.content,
                "model": m.model,
                "tokens": m.tokens,
                "elapsed_ms": m.elapsed_ms,
                "tags": m.tags,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ],
        "settings": None
        if not settings
        else {
            "theme": settings.theme,
            "language": settings.language,
            "default_model": settings.default_model,
            "temperature": settings.temperature,
            "top_p": settings.top_p,
            "default_prompt": settings.default_prompt,
            "layout": settings.layout,
            "shortcuts": settings.shortcuts,
        },
    }


@router.post("/import")
def import_backup(body: BackupImportRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project_map: dict[int, int] = {}
    conv_map: dict[int, int] = {}

    for p in body.projects:
        row = Project(user_id=user.id, name=p.get("name", "Projeto importado"), description=p.get("description"))
        db.add(row)
        db.flush()
        old_id = int(p.get("id") or 0)
        if old_id:
            project_map[old_id] = row.id

    for c in body.conversations:
        old_project_id = c.get("project_id")
        row = Conversation(
            user_id=user.id,
            project_id=project_map.get(old_project_id) if old_project_id else None,
            title=c.get("title", "Conversa importada"),
            model=c.get("model"),
            favorite=bool(c.get("favorite", False)),
            archived=bool(c.get("archived", False)),
            pinned=bool(c.get("pinned", False)),
        )
        db.add(row)
        db.flush()
        old_id = int(c.get("id") or 0)
        if old_id:
            conv_map[old_id] = row.id

    for m in body.messages:
        old_conv_id = m.get("conversation_id")
        new_conv_id = conv_map.get(old_conv_id)
        if not new_conv_id:
            continue
        db.add(
            Message(
                conversation_id=new_conv_id,
                role=m.get("role", "user"),
                content=m.get("content", ""),
                model=m.get("model"),
                tokens=m.get("tokens"),
                elapsed_ms=m.get("elapsed_ms"),
                tags=m.get("tags"),
            )
        )

    if body.settings:
        row = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
        if not row:
            row = UserSettings(user_id=user.id)
            db.add(row)
        for key in ["theme", "language", "default_model", "temperature", "top_p", "default_prompt", "layout", "shortcuts"]:
            if key in body.settings:
                setattr(row, key, body.settings[key])

    db.commit()
    return {"ok": True}
