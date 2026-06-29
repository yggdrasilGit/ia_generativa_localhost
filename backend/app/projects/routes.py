from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.db import get_db
from app.models.entities import Project, User

router = APIRouter(prefix="/projects", tags=["projects"])


class ProjectIn(BaseModel):
    name: str
    description: str | None = None


class ProjectOut(BaseModel):
    id: int
    name: str
    description: str | None = None
    created_at: datetime
    updated_at: datetime


@router.get("", response_model=list[ProjectOut])
def list_projects(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(Project).filter(Project.user_id == user.id).order_by(Project.updated_at.desc()).all()
    return [ProjectOut.model_validate(r, from_attributes=True) for r in rows]


@router.post("", response_model=ProjectOut)
def create_project(body: ProjectIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = Project(user_id=user.id, name=body.name.strip(), description=body.description)
    db.add(row)
    db.commit()
    db.refresh(row)
    return ProjectOut.model_validate(row, from_attributes=True)


@router.put("/{project_id}", response_model=ProjectOut)
def update_project(project_id: int, body: ProjectIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(Project).filter(Project.id == project_id, Project.user_id == user.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    row.name = body.name.strip()
    row.description = body.description
    db.commit()
    db.refresh(row)
    return ProjectOut.model_validate(row, from_attributes=True)


@router.delete("/{project_id}")
def delete_project(project_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(Project).filter(Project.id == project_id, Project.user_id == user.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    db.delete(row)
    db.commit()
    return {"ok": True}
