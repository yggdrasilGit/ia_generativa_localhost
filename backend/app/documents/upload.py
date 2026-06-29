from __future__ import annotations

import hashlib
import os
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.core.config import settings
from app.db import SessionLocal, get_db
from app.documents.cancellation import registry as cancel_registry
from app.documents.embeddings import embed_texts
from app.documents.indexer import process_document
from app.models.entities import AuditLog, Document, DocumentChunk, User
from app.rag.vector_store import VectorStore

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".epub"}


class DocumentOut(BaseModel):
    id: int
    project_id: int | None
    title: str
    filename: str
    content_type: str | None
    size_bytes: int
    source_hash: str
    status: str
    error_message: str | None
    total_pages: int | None
    total_chunks: int
    created_at: datetime
    updated_at: datetime
    indexed_at: datetime | None


class SearchMatchOut(BaseModel):
    id: str
    score: float
    content: str
    metadata: dict


def _doc_to_out(row: Document) -> DocumentOut:
    return DocumentOut.model_validate(row, from_attributes=True)


async def _run_index_job(document_id: int):
    """Async background task: open its own DB session and run the indexing pipeline."""
    db = SessionLocal()
    try:
        await process_document(db, document_id)
    finally:
        db.close()


@router.post("/upload", response_model=DocumentOut)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    project_id: int | None = Form(default=None),
    title: str | None = Form(default=None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Formato não suportado. Use PDF, DOCX, TXT ou EPUB")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Arquivo vazio")

    source_hash = hashlib.sha256(data).hexdigest()

    duplicate = (
        db.query(Document)
        .filter(Document.user_id == user.id, Document.source_hash == source_hash, Document.status == "indexed")
        .first()
    )
    if duplicate:
        raise HTTPException(status_code=409, detail="Documento já indexado")

    user_dir = Path(settings.DOCUMENTS_UPLOAD_DIR) / str(user.id)
    user_dir.mkdir(parents=True, exist_ok=True)

    stored_name = f"{uuid4().hex}{ext}"
    stored_path = user_dir / stored_name
    stored_path.write_bytes(data)

    row = Document(
        user_id=user.id,
        project_id=project_id,
        title=(title or Path(file.filename or "documento").stem).strip() or "Documento",
        filename=file.filename or stored_name,
        stored_path=str(stored_path),
        content_type=file.content_type,
        source_hash=source_hash,
        size_bytes=len(data),
        status="uploaded",
    )
    db.add(row)
    db.add(AuditLog(user_id=user.id, action="document_upload", details=f"Upload: {row.filename}"))
    db.commit()
    db.refresh(row)

    background_tasks.add_task(_run_index_job, row.id)
    return _doc_to_out(row)


@router.get("/list", response_model=list[DocumentOut])
def list_documents(project_id: int | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(Document).filter(Document.user_id == user.id)
    if project_id is not None:
        q = q.filter(Document.project_id == project_id)
    rows = q.order_by(Document.updated_at.desc()).all()
    return [_doc_to_out(r) for r in rows]


@router.delete("/{document_id}")
def delete_document(document_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(Document).filter(Document.id == document_id, Document.user_id == user.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Documento não encontrado")

    vector_ids = [c.vector_id for c in db.query(DocumentChunk).filter(DocumentChunk.document_id == row.id).all()]
    try:
        store = VectorStore()
        store.delete_by_ids(vector_ids)
    except Exception:
        pass

    if row.stored_path and os.path.exists(row.stored_path):
        os.remove(row.stored_path)

    db.delete(row)
    db.add(AuditLog(user_id=user.id, action="document_delete", details=f"Delete: {row.filename}"))
    db.commit()
    return {"ok": True}


@router.post("/{document_id}/cancel")
def cancel_document(
    document_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = db.query(Document).filter(Document.id == document_id, Document.user_id == user.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Documento nao encontrado")

    active = {"uploaded", "processing", "ocr", "embedding"}
    if row.status not in active:
        raise HTTPException(status_code=400, detail=f"Documento nao esta em processamento (status: {row.status})")

    cancel_registry.request(document_id)

    db.query(Document).filter(Document.id == document_id).update(
        {Document.status: "cancelled", Document.error_message: "Cancelado pelo usuario", Document.updated_at: datetime.utcnow()},
        synchronize_session=False,
    )
    db.add(AuditLog(user_id=user.id, action="document_cancel", details=f"Cancelado: {row.filename}"))
    db.commit()
    return {"ok": True, "cancelled": document_id}


@router.post("/reindex")
async def reindex_documents(
    background_tasks: BackgroundTasks,
    document_id: int | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Document).filter(Document.user_id == user.id)
    if document_id is not None:
        q = q.filter(Document.id == document_id)

    rows = q.all()
    if not rows:
        raise HTTPException(status_code=404, detail="Nenhum documento encontrado")

    ids = [row.id for row in rows]
    for row in rows:
        row.status = "uploaded"
        row.error_message = None
    db.add(AuditLog(user_id=user.id, action="document_reindex", details=f"Reindexados: {len(rows)}"))
    db.commit()

    for doc_id in ids:
        background_tasks.add_task(_run_index_job, doc_id)

    return {"ok": True, "reindexed": len(rows)}


@router.post("/normalize")
async def normalize_documents(
    background_tasks: BackgroundTasks,
    document_id: int | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reprocessa documentos já enviados aplicando o cleaner atualizado e reindexando."""
    q = db.query(Document).filter(Document.user_id == user.id)
    if document_id is not None:
        q = q.filter(Document.id == document_id)

    rows = q.all()
    if not rows:
        raise HTTPException(status_code=404, detail="Nenhum documento encontrado")

    ids = [row.id for row in rows]
    for row in rows:
        row.status = "uploaded"
        row.error_message = None

    db.add(AuditLog(user_id=user.id, action="document_normalize", details=f"Normalizados: {len(rows)}"))
    db.commit()

    for doc_id in ids:
        background_tasks.add_task(_run_index_job, doc_id)

    return {"ok": True, "normalized": len(rows)}


@router.get("/search", response_model=list[SearchMatchOut])
async def search_documents(
    q: str,
    limit: int = 5,
    project_id: int | None = None,
    document_id: int | None = None,
    user: User = Depends(get_current_user),
):
    query = q.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Consulta vazia")

    [query_embedding] = await embed_texts([query])

    where: dict = {"user_id": user.id}
    if project_id is not None:
        where["project_id"] = project_id
    if document_id is not None:
        where["document_id"] = document_id

    store = VectorStore()
    matches = store.query(embedding=query_embedding, limit=max(1, min(limit, 20)), where=where)
    return [SearchMatchOut(id=m.id, score=m.score, content=m.content, metadata=m.metadata) for m in matches]
