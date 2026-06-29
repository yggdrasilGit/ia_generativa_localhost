from fastapi import APIRouter
from app.services.ollama import get_available_models
from app.core.config import settings

router = APIRouter(prefix="/api", tags=["models"])


@router.get("/models")
async def list_models():
    models = await get_available_models()
    return {
        "models": models,
        "default": settings.OLLAMA_MODEL,
    }
