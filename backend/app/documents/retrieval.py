from __future__ import annotations

from app.documents.embeddings import embed_texts
from app.rag.vector_store import VectorStore


def _last_user_message(messages: list[dict]) -> str:
    for m in reversed(messages):
        if m.get("role") == "user" and (m.get("content") or "").strip():
            return m["content"].strip()
    return ""


async def inject_knowledge_context(
    messages: list[dict],
    user_id: int | None,
    project_id: int | None = None,
    limit: int = 4,
) -> list[dict]:
    """Inject a context system message with top semantic matches from vector store."""
    if not user_id:
        return messages

    query = _last_user_message(messages)
    if not query:
        return messages

    [query_embedding] = await embed_texts([query])
    where: dict = {"user_id": user_id}
    if project_id is not None:
        where["project_id"] = project_id

    store = VectorStore()
    matches = store.query(embedding=query_embedding, limit=max(1, min(limit, 8)), where=where)
    if not matches:
        return messages

    context_lines = [
        "Use o contexto recuperado abaixo para responder com precisão.",
        "Se não houver evidência suficiente, diga explicitamente que não encontrou no material.",
        "Contexto recuperado:",
    ]

    for idx, m in enumerate(matches, start=1):
        source = m.metadata.get("document_title") or m.metadata.get("filename") or "Documento"
        chunk = (m.content or "").strip()
        if len(chunk) > 1400:
            chunk = chunk[:1400] + "..."
        context_lines.append(f"[{idx}] Fonte: {source} | Score: {m.score:.3f}")
        context_lines.append(chunk)

    context_message = {"role": "system", "content": "\n".join(context_lines)}

    # Keep existing conversation flow and just prepend context.
    return [context_message, *messages]
