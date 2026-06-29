from __future__ import annotations

import json
from datetime import datetime

from sqlalchemy.orm import Session

from app.documents.cancellation import registry as cancel_registry
from app.documents.chunker import TextChunk, chunk_text
from app.documents.cleaner import clean_text
from app.documents.embeddings import embed_texts
from app.documents.ocr import OcrUnavailableError, run_ocr
from app.documents.parser import parse_document
from app.models.entities import AuditLog, Document, DocumentChunk
from app.rag.vector_store import VectorStore


def _set_status(db: Session, document_id: int, status: str, error_message: str | None = None) -> bool:
    updated = (
        db.query(Document)
        .filter(Document.id == document_id)
        .update(
            {
                Document.status: status,
                Document.error_message: error_message,
                Document.updated_at: datetime.utcnow(),
            },
            synchronize_session=False,
        )
    )
    db.commit()
    return updated > 0


async def process_document(db: Session, document_id: int):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        return

    user_id = doc.user_id
    project_id = doc.project_id
    title = doc.title
    filename = doc.filename
    stored_path = doc.stored_path

    try:
        # Check if cancelled before even starting
        if cancel_registry.is_cancelled(document_id):
            cancel_registry.clear(document_id)
            return

        if not _set_status(db, document_id, "processing"):
            return

        parsed = parse_document(stored_path)

        # Check after parsing
        if cancel_registry.is_cancelled(document_id):
            cancel_registry.clear(document_id)
            return

        text = parsed.text
        if parsed.needs_ocr:
            if not _set_status(db, document_id, "ocr"):
                return
            try:
                text = run_ocr(stored_path)
            except OcrUnavailableError as exc:
                _set_status(db, document_id, "error", str(exc))
                db.add(AuditLog(user_id=user_id, action="document_ocr_error", details=str(exc)))
                db.commit()
                return

        chunks: list[TextChunk] = []
        if parsed.page_texts:
            global_idx = 0
            for page_num, page_text in parsed.page_texts:
                cleaned_page = clean_text(page_text)
                if not cleaned_page:
                    continue
                page_chunks = chunk_text(cleaned_page)
                for c in page_chunks:
                    c.index = global_idx
                    c.page = page_num
                    chunks.append(c)
                    global_idx += 1
        else:
            cleaned = clean_text(text)
            chunks = chunk_text(cleaned)

        if not chunks:
            _set_status(db, document_id, "error", "Não foi possível extrair conteúdo útil do documento")
            return

        # Check after chunking, before the expensive embedding step
        if cancel_registry.is_cancelled(document_id):
            cancel_registry.clear(document_id)
            return

        if not _set_status(db, document_id, "embedding"):
            return
        vectors = await embed_texts([c.content for c in chunks])

        # Documento pode ter sido removido ou cancelado durante o embedding.
        if not db.query(Document.id).filter(Document.id == document_id).first():
            return

        if cancel_registry.is_cancelled(document_id):
            cancel_registry.clear(document_id)
            return

        store = VectorStore()

        # Limpa chunks anteriores em reindex.
        old_ids = [
            row.vector_id
            for row in db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).all()
        ]
        if old_ids:
            store.delete_by_ids(old_ids)
            db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).delete()
            db.commit()

        ids: list[str] = []
        texts: list[str] = []
        metadatas: list[dict] = []

        for c in chunks:
            vector_id = f"doc-{document_id}-chunk-{c.index}"
            metadata = {
                "user_id": user_id,
                "project_id": project_id,
                "document_id": document_id,
                "document_title": title,
                "filename": filename,
                "chunk_index": c.index,
                "page": c.page,
            }
            ids.append(vector_id)
            texts.append(c.content)
            metadatas.append(metadata)

            db.add(
                DocumentChunk(
                    document_id=document_id,
                    chunk_index=c.index,
                    page=c.page,
                    content=c.content,
                    token_count=c.token_count,
                    embedding_model="ollama",
                    vector_id=vector_id,
                    meta_json=json.dumps(metadata, ensure_ascii=True),
                )
            )

        store.upsert_chunks(ids=ids, embeddings=vectors, documents=texts, metadatas=metadatas)

        updated = (
            db.query(Document)
            .filter(Document.id == document_id)
            .update(
                {
                    Document.total_pages: parsed.total_pages,
                    Document.total_chunks: len(chunks),
                    Document.status: "indexed",
                    Document.error_message: None,
                    Document.indexed_at: datetime.utcnow(),
                    Document.updated_at: datetime.utcnow(),
                },
                synchronize_session=False,
            )
        )

        if updated:
            db.add(AuditLog(user_id=user_id, action="document_indexed", details=f"Documento {filename} indexado"))
        db.commit()
    except Exception as exc:
        _set_status(db, document_id, "error", str(exc))
        db.add(AuditLog(user_id=user_id, action="document_index_error", details=str(exc)))
        db.commit()
