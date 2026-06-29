from __future__ import annotations

from dataclasses import dataclass


@dataclass
class TextChunk:
    index: int
    content: str
    token_count: int
    page: int | None = None


def estimate_tokens(text: str) -> int:
    # Estimativa simples: ~4 chars por token.
    return max(1, len(text) // 4)


def chunk_text(text: str, target_tokens: int = 700, overlap_tokens: int = 80) -> list[TextChunk]:
    words = text.split()
    if not words:
        return []

    target_words = max(120, target_tokens * 4 // 5)
    overlap_words = max(10, overlap_tokens * 4 // 5)

    chunks: list[TextChunk] = []
    start = 0
    idx = 0

    while start < len(words):
        end = min(len(words), start + target_words)
        snippet = " ".join(words[start:end]).strip()
        if snippet:
            chunks.append(TextChunk(index=idx, content=snippet, token_count=estimate_tokens(snippet)))
            idx += 1
        if end == len(words):
            break
        start = max(0, end - overlap_words)

    return chunks
