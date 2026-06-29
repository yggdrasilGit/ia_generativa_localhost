from __future__ import annotations

import re
from dataclasses import dataclass, field

from app.rag.vector_store import SearchMatch
from app.rag.web_search import WebResult

# Confidence weights per source type (Fase 6 spec)
_SOURCE_WEIGHTS: dict[str, float] = {
    "book": 0.90,
    "pdf": 0.85,
    "wikipedia": 0.70,
    "academic": 0.85,
    "blog": 0.50,
    "forum": 0.40,
    "web": 0.60,  # generic web default
}

_WIKI_RE = re.compile(r"wikipedia\.org", re.IGNORECASE)
_ACADEMIC_RE = re.compile(r"\.(edu|ac\.|arxiv\.org|scholar\.)", re.IGNORECASE)
_FORUM_RE = re.compile(r"(reddit\.com|stackoverflow\.com|quora\.com)", re.IGNORECASE)
_BLOG_RE = re.compile(r"(medium\.com|dev\.to|substack|blogspot|wordpress)", re.IGNORECASE)


@dataclass
class FusedChunk:
    id: str
    content: str
    source_type: str          # "local" | "web"
    score: float
    title: str | None = None
    page: int | None = None
    url: str | None = None
    document_source: str = ""
    source_weight: float = 0.60


def _url_weight(url: str) -> float:
    if _WIKI_RE.search(url):
        return _SOURCE_WEIGHTS["wikipedia"]
    if _ACADEMIC_RE.search(url):
        return _SOURCE_WEIGHTS["academic"]
    if _FORUM_RE.search(url):
        return _SOURCE_WEIGHTS["forum"]
    if _BLOG_RE.search(url):
        return _SOURCE_WEIGHTS["blog"]
    return _SOURCE_WEIGHTS["web"]


def _rag_to_fused(m: SearchMatch) -> FusedChunk:
    filename = m.metadata.get("filename") or ""
    source_weight = _SOURCE_WEIGHTS["pdf"] if filename.endswith(".pdf") else _SOURCE_WEIGHTS["book"]
    return FusedChunk(
        id=m.id,
        content=m.content or "",
        source_type="local",
        score=m.score,
        title=m.metadata.get("document_title"),
        page=m.metadata.get("page"),
        document_source=filename,
        source_weight=source_weight,
    )


def _web_to_fused(r: WebResult, base_rank: int) -> FusedChunk:
    # Score decays with rank; boosted by source weight
    rank_score = max(0.1, 0.85 - base_rank * 0.08)
    weight = _url_weight(r.url)
    return FusedChunk(
        id=f"web-{hash(r.url) & 0xFFFFFF}",
        content=r.snippet,
        source_type="web",
        score=rank_score,
        title=r.title,
        url=r.url,
        document_source=r.url,
        source_weight=weight,
    )


def _deduplicate(chunks: list[FusedChunk]) -> list[FusedChunk]:
    seen: set[str] = set()
    out: list[FusedChunk] = []
    for c in chunks:
        key = c.content[:80].lower().strip()
        if key and key not in seen:
            seen.add(key)
            out.append(c)
    return out


def _tokens(text: str) -> set[str]:
    return set(re.findall(r"[a-zA-ZÀ-ÿ]{3,}", text.lower()))


def _rerank_fused(query: str, chunks: list[FusedChunk]) -> list[FusedChunk]:
    q = _tokens(query)
    if not q:
        return sorted(chunks, key=lambda c: c.score * c.source_weight, reverse=True)

    for c in chunks:
        t = _tokens(c.content)
        overlap = len(q & t) / max(1, len(q))
        # Combined score: semantic/rank × source trust + lexical overlap
        c.score = 0.6 * c.score + 0.25 * c.source_weight + 0.15 * overlap

    return sorted(chunks, key=lambda c: c.score, reverse=True)


def fuse(
    query: str,
    rag_matches: list[SearchMatch],
    web_results: list[WebResult],
    top_k: int = 8,
) -> list[FusedChunk]:
    local_chunks = [_rag_to_fused(m) for m in rag_matches]
    web_chunks = [_web_to_fused(r, i) for i, r in enumerate(web_results)]

    all_chunks = _deduplicate(local_chunks + web_chunks)
    ranked = _rerank_fused(query, all_chunks)
    return ranked[:top_k]
