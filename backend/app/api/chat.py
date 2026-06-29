import time
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.auth.tokens import decode_token
from app.documents.retrieval import inject_knowledge_context
from app.schemas.chat import ChatRequest
from app.services.ollama import stream_chat, OllamaUnavailableError
from app.core.logging import logger
from app.core.security import limiter

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat")
@limiter.limit("30/minute")
async def chat(request: Request, body: ChatRequest):
    """Chat com streaming. Injeta system prompt automaticamente."""
    messages = [{"role": m.role, "content": m.content} for m in body.messages]
    user_id = None
    auth = request.headers.get("authorization", "")
    if auth.lower().startswith("bearer "):
        token = auth.split(" ", 1)[1].strip()
        try:
            payload = decode_token(token)
            if payload.get("type") == "access":
                user_id = int(payload.get("sub", "0"))
        except Exception:
            user_id = None

    messages = await inject_knowledge_context(
        messages=messages,
        user_id=user_id,
        project_id=body.project_id,
    )
    t0 = time.perf_counter()

    async def generate():
        try:
            async for chunk in stream_chat(messages, model=body.model):
                yield chunk
        except OllamaUnavailableError as e:
            yield f"\n\n❌ **Ollama indisponível:** {e}"
        except Exception as e:
            logger.error(f"Erro no chat: {e}")
            yield f"\n\n❌ **Erro:** {e}"

    return StreamingResponse(generate(), media_type="text/plain; charset=utf-8")
