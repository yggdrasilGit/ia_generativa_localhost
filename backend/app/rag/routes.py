from __future__ import annotations

import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.documents.embeddings import embed_texts
from app.models.entities import Document, User
from app.rag.vector_store import SearchMatch, VectorStore
from app.rag.web_search import WebResult, search_web
from app.services.ollama import stream_chat
from app.db import get_db

router = APIRouter(prefix="/rag", tags=["rag"])


class RagSearchIn(BaseModel):
    query: str
    top_k: int = 5
    project_id: int | None = None
    document_id: int | None = None
    rerank: bool = True


class CitationOut(BaseModel):
    source: str
    title: str | None = None
    page: int | None = None
    chunk_id: str
    score: float
    excerpt: str


class RagSearchOut(BaseModel):
    query: str
    top_k: int
    confidence: str
    matches: list[CitationOut]


class RagChatIn(BaseModel):
    question: str
    top_k: int = 5
    model: str | None = None
    project_id: int | None = None
    document_id: int | None = None
    rerank: bool = True
    web_fallback: bool = True


class WebCitationOut(BaseModel):
    title: str
    url: str
    excerpt: str
    source: str = "internet"


class RagChatOut(BaseModel):
    answer: str
    confidence: str
    citations: list[CitationOut]
    web_citations: list[WebCitationOut] = []
    used_fallback: bool = False


class WebSearchIn(BaseModel):
    query: str
    max_results: int = 5


class WebSearchOut(BaseModel):
    query: str
    results: list[WebCitationOut]


class SourceOut(BaseModel):
    id: int
    title: str
    filename: str
    total_chunks: int
    total_pages: int | None
    indexed_at: str | None


class ChunkOut(BaseModel):
    chunk_id: str
    source: str
    title: str | None = None
    page: int | None = None
    content: str


class ChunkWindowItemOut(BaseModel):
    chunk_id: str
    chunk_index: int
    page: int | None = None
    relation: str
    content: str


class ChunkWindowOut(BaseModel):
    document_id: int
    center_chunk_id: str
    items: list[ChunkWindowItemOut]
    merged_content: str


def _confidence_label(matches: list[SearchMatch]) -> str:
    if not matches:
        return "baixa"
    avg = sum(m.score for m in matches) / len(matches)
    if avg >= 0.72:
        return "alta"
    if avg >= 0.5:
        return "media"
    return "baixa"


def _tokens(text: str) -> set[str]:
    return set(re.findall(r"[a-zA-ZÀ-ÿ]{3,}", text.lower()))


def _rerank(query: str, matches: list[SearchMatch]) -> list[SearchMatch]:
    q = _tokens(query)
    if not q:
        return matches

    rescored: list[tuple[float, SearchMatch]] = []
    for m in matches:
        t = _tokens(m.content)
        overlap = len(q & t) / max(1, len(q))
        combined = 0.75 * m.score + 0.25 * overlap
        m.score = combined
        rescored.append((combined, m))

    rescored.sort(key=lambda x: x[0], reverse=True)
    return [m for _, m in rescored]


def _to_citation(m: SearchMatch) -> CitationOut:
    src = m.metadata.get("filename") or "documento"
    title = m.metadata.get("document_title")
    page = m.metadata.get("page")
    excerpt = (m.content or "").strip()
    if len(excerpt) > 900:
        excerpt = excerpt[:900] + "..."
    return CitationOut(
        source=src,
        title=title,
        page=page,
        chunk_id=m.id,
        score=round(m.score, 3),
        excerpt=excerpt,
    )


async def _search_internal(user_id: int, body: RagSearchIn) -> list[SearchMatch]:
    query = body.query.strip()
    if not query:
        return []

    [query_embedding] = await embed_texts([query])
    where: dict = {"user_id": user_id}
    if body.project_id is not None:
        where["project_id"] = body.project_id
    if body.document_id is not None:
        where["document_id"] = body.document_id

    store = VectorStore()
    candidates = store.query(query_embedding, limit=max(body.top_k * 3, body.top_k), where=where)
    if body.rerank:
        candidates = _rerank(query, candidates)
    return candidates[: body.top_k]


@router.post("/search", response_model=RagSearchOut)
async def rag_search(body: RagSearchIn, user: User = Depends(get_current_user)):
    matches = await _search_internal(user.id, body)
    return RagSearchOut(
        query=body.query,
        top_k=body.top_k,
        confidence=_confidence_label(matches),
        matches=[_to_citation(m) for m in matches],
    )


async def _chat_once(messages: list[dict], model: str | None = None) -> str:
    chunks: list[str] = []
    async for chunk in stream_chat(messages, model=model):
        chunks.append(chunk)
    return "".join(chunks).strip()


@router.post("/chat", response_model=RagChatOut)
async def rag_chat(body: RagChatIn, user: User = Depends(get_current_user)):
    search_body = RagSearchIn(
        query=body.question,
        top_k=body.top_k,
        project_id=body.project_id,
        document_id=body.document_id,
        rerank=body.rerank,
    )
    matches = await _search_internal(user.id, search_body)
    confidence = _confidence_label(matches)

    # --- Web fallback when no local documents match ---
    if not matches:
        if not body.web_fallback:
            return RagChatOut(
                answer="Nao encontrei informacao relevante nos documentos indexados para essa pergunta.",
                confidence="baixa",
                citations=[],
                web_citations=[],
                used_fallback=False,
            )

        web_results = await search_web(body.question, max_results=5)
        if not web_results:
            return RagChatOut(
                answer="Nao encontrei informacao relevante nos documentos nem na internet.",
                confidence="baixa",
                citations=[],
                web_citations=[],
                used_fallback=True,
            )

        web_context_parts = [
            "Voce e um assistente que responde com base nos resultados de busca abaixo.",
            "Cite as fontes no final usando o formato [Fonte: URL].",
            "Se nao tiver informacao suficiente, diga claramente.",
            "",
        ]
        for idx, r in enumerate(web_results, start=1):
            web_context_parts.append(f"[{idx}] {r.title}")
            web_context_parts.append(f"URL: {r.url}")
            web_context_parts.append(r.snippet[:800])
            web_context_parts.append("")

        web_messages = [
            {"role": "system", "content": "\n".join(web_context_parts)},
            {"role": "user", "content": body.question},
        ]
        web_answer = await _chat_once(web_messages, model=body.model)
        web_citations = [
            WebCitationOut(title=r.title, url=r.url, excerpt=r.snippet[:400])
            for r in web_results
        ]
        return RagChatOut(
            answer=web_answer,
            confidence="baixa",
            citations=[],
            web_citations=web_citations,
            used_fallback=True,
        )

    # --- Normal RAG flow with local documents ---
    context_parts = [
        "Responda usando prioritariamente os trechos abaixo.",
        "Se nao houver evidencia suficiente, diga claramente.",
        "Sempre cite as fontes no final no formato [Fonte: ...].",
        "",
    ]
    for idx, m in enumerate(matches, start=1):
        source = m.metadata.get("document_title") or m.metadata.get("filename") or "Documento"
        page = m.metadata.get("page")
        page_label = f", pagina {page}" if page else ""
        context_parts.append(f"[{idx}] {source}{page_label}")
        context_parts.append((m.content or "")[:1200])
        context_parts.append("")

    messages = [
        {"role": "system", "content": "\n".join(context_parts)},
        {"role": "user", "content": body.question},
    ]
    answer = await _chat_once(messages, model=body.model)

    return RagChatOut(
        answer=answer,
        confidence=confidence,
        citations=[_to_citation(m) for m in matches],
        web_citations=[],
        used_fallback=False,
    )


@router.get("/sources", response_model=list[SourceOut])
def rag_sources(project_id: int | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(Document).filter(Document.user_id == user.id, Document.status == "indexed")
    if project_id is not None:
        q = q.filter(Document.project_id == project_id)

    rows = q.order_by(Document.updated_at.desc()).all()
    return [
        SourceOut(
            id=r.id,
            title=r.title,
            filename=r.filename,
            total_chunks=r.total_chunks,
            total_pages=r.total_pages,
            indexed_at=r.indexed_at.isoformat() if r.indexed_at else None,
        )
        for r in rows
    ]


@router.get("/chunks/{chunk_id}", response_model=ChunkOut)
def rag_chunk(chunk_id: str, user: User = Depends(get_current_user)):
    store = VectorStore()
    match = store.get_by_id(chunk_id, where={"user_id": user.id})
    if not match:
        raise HTTPException(status_code=404, detail="Chunk nao encontrado")

    return ChunkOut(
        chunk_id=match.id,
        source=match.metadata.get("filename") or "documento",
        title=match.metadata.get("document_title"),
        page=match.metadata.get("page"),
        content=match.content or "",
    )


@router.get("/chunks/{chunk_id}/window", response_model=ChunkWindowOut)
def rag_chunk_window(chunk_id: str, radius: int = 1, user: User = Depends(get_current_user)):
    radius = max(1, min(radius, 3))

    match_obj = re.match(r"^doc-(\d+)-chunk-(\d+)$", chunk_id)
    if not match_obj:
        raise HTTPException(status_code=400, detail="Formato de chunk_id invalido")

    document_id = int(match_obj.group(1))
    center_index = int(match_obj.group(2))

    store = VectorStore()
    center = store.get_by_id(chunk_id, where={"user_id": user.id})
    if not center:
        raise HTTPException(status_code=404, detail="Chunk nao encontrado")

    requested_ids: list[str] = []
    for idx in range(center_index - radius, center_index + radius + 1):
        if idx < 0:
            continue
        requested_ids.append(f"doc-{document_id}-chunk-{idx}")

    neighbors = store.get_by_ids(requested_ids, where={"user_id": user.id})
    by_id = {m.id: m for m in neighbors}

    items: list[ChunkWindowItemOut] = []
    for idx in range(center_index - radius, center_index + radius + 1):
        if idx < 0:
            continue
        current_id = f"doc-{document_id}-chunk-{idx}"
        row = by_id.get(current_id)
        if not row:
            continue

        if idx < center_index:
            relation = "previous"
        elif idx > center_index:
            relation = "next"
        else:
            relation = "current"

        items.append(
            ChunkWindowItemOut(
                chunk_id=row.id,
                chunk_index=idx,
                page=row.metadata.get("page"),
                relation=relation,
                content=row.content or "",
            )
        )

    merged = "\n\n".join(item.content.strip() for item in items if item.content and item.content.strip())

    return ChunkWindowOut(
        document_id=document_id,
        center_chunk_id=chunk_id,
        items=items,
        merged_content=merged,
    )


@router.post("/web-search", response_model=WebSearchOut)
async def rag_web_search(body: WebSearchIn, user: User = Depends(get_current_user)):
    results = await search_web(body.query, max_results=max(1, min(body.max_results, 10)))
    return WebSearchOut(
        query=body.query,
        results=[WebCitationOut(title=r.title, url=r.url, excerpt=r.snippet[:600]) for r in results],
    )
