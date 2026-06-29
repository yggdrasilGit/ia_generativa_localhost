import httpx
import json
import time
from dataclasses import dataclass, field

from app.core.config import settings
from app.core.logging import logger


class OllamaUnavailableError(Exception):
    pass


@dataclass
class StreamMeta:
    model: str = ""
    elapsed: float = 0.0
    tokens: int = 0


def _resolve_model(model: str | None) -> str:
    return (model or "").strip() or settings.OLLAMA_MODEL


def _build_messages(messages: list[dict]) -> list[dict]:
    """Injeta o system prompt se não houver um na lista."""
    has_system = any(m.get("role") == "system" for m in messages)
    if not has_system and settings.SYSTEM_PROMPT:
        return [{"role": "system", "content": settings.SYSTEM_PROMPT}] + list(messages)
    return list(messages)


async def stream_chat(messages: list[dict], model: str | None = None):
    """Streaming de tokens do Ollama. Gera chunks de texto."""
    resolved_model = _resolve_model(model)
    full_messages = _build_messages(messages)
    payload = {
        "model": resolved_model,
        "messages": full_messages,
        "stream": True,
    }
    meta = StreamMeta(model=resolved_model)
    t0 = time.perf_counter()

    logger.info(f"Chat iniciado | modelo={resolved_model} | mensagens={len(full_messages)}")

    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            async with client.stream(
                "POST",
                f"{settings.OLLAMA_BASE_URL}/api/chat",
                json=payload,
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line:
                        continue
                    chunk = json.loads(line)
                    if chunk.get("done"):
                        meta.elapsed = round(time.perf_counter() - t0, 2)
                        meta.tokens = chunk.get("eval_count", 0)
                        logger.info(
                            f"Chat concluído | modelo={resolved_model} "
                            f"| tempo={meta.elapsed}s | tokens={meta.tokens}"
                        )
                    else:
                        content = chunk.get("message", {}).get("content", "")
                        if content:
                            yield content

    except httpx.ConnectError:
        raise OllamaUnavailableError(
            f"Não foi possível conectar ao Ollama em {settings.OLLAMA_BASE_URL}. "
            "Certifique-se de que o Ollama está rodando (`ollama serve`)."
        )


async def get_available_models() -> list[str]:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            return [m["name"] for m in r.json().get("models", [])]
    except Exception:
        return []


async def is_ollama_online() -> bool:
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.get(settings.OLLAMA_BASE_URL)
            return r.status_code == 200
    except Exception:
        return False

