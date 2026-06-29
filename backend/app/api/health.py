import time
from fastapi import APIRouter
from app.core.config import settings
from app.services.ollama import get_available_models, is_ollama_online

router = APIRouter(prefix="/api", tags=["health"])

_start_time = time.time()


@router.get("/health")
async def health():
    uptime_secs = int(time.time() - _start_time)
    h, rem = divmod(uptime_secs, 3600)
    m, s = divmod(rem, 60)
    uptime_str = f"{h:02d}h {m:02d}m {s:02d}s"

    ollama_ok = await is_ollama_online()
    models = await get_available_models() if ollama_ok else []

    return {
        "status": "online",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "model": settings.OLLAMA_MODEL,
        "ollama": "online" if ollama_ok else "offline",
        "available_models": models,
        "uptime": uptime_str,
    }
