from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.db import get_db
from app.models.entities import User

router = APIRouter(prefix="/users", tags=["users"])


class UserMeResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    avatar: str | None
    language: str
    theme: str
    timezone: str
    created_at: datetime
    last_login: datetime | None


class UpdateMeRequest(BaseModel):
    name: str | None = None
    avatar: str | None = None
    language: str | None = None
    theme: str | None = None
    timezone: str | None = None


@router.get("/me", response_model=UserMeResponse)
def get_me(user: User = Depends(get_current_user)):
    return UserMeResponse.model_validate(user, from_attributes=True)


@router.put("/me", response_model=UserMeResponse)
def update_me(body: UpdateMeRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    for field in ["name", "avatar", "language", "theme", "timezone"]:
        value = getattr(body, field)
        if value is not None:
            setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return UserMeResponse.model_validate(user, from_attributes=True)
