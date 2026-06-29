from __future__ import annotations

import httpx

from app.core.config import settings

_BATCH_SIZE = 16


async def embed_texts(texts: list[str], model: str | None = None) -> list[list[float]]:
    """Embed a list of texts using Ollama /api/embed (batch API)."""
    embed_model = (model or "").strip() or settings.OLLAMA_EMBED_MODEL
    vectors: list[list[float]] = []

    async with httpx.AsyncClient(timeout=300.0) as client:
        # Process in batches to avoid oversized requests
        for i in range(0, len(texts), _BATCH_SIZE):
            batch = texts[i : i + _BATCH_SIZE]
            response = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/embed",
                json={"model": embed_model, "input": batch},
            )
            response.raise_for_status()
            body = response.json()
            # /api/embed returns {"embeddings": [[...], [...], ...]}
            batch_vecs = body.get("embeddings", [])
            vectors.extend(batch_vecs)

    return vectors
