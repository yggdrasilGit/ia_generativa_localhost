from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.db import get_db
from app.models.entities import User, UserSettings

router = APIRouter(prefix="/settings", tags=["settings"])


class SettingsIn(BaseModel):
    theme: str = Field(default="dark")
    language: str = Field(default="pt-BR")
    default_model: str = Field(default="qwen3:0.6b")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    top_p: float = Field(default=0.9, ge=0.0, le=1.0)
    default_prompt: str | None = None
    layout: str = Field(default="comfortable")
    shortcuts: str | None = None


class SettingsOut(SettingsIn):
    user_id: int


@router.get("", response_model=SettingsOut)
def get_settings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    if not row:
        row = UserSettings(user_id=user.id)
        db.add(row)
        db.commit()
        db.refresh(row)
    return SettingsOut.model_validate(row, from_attributes=True)


@router.put("", response_model=SettingsOut)
def put_settings(body: SettingsIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    if not row:
        row = UserSettings(user_id=user.id)
        db.add(row)

    for key, value in body.model_dump().items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return SettingsOut.model_validate(row, from_attributes=True)
