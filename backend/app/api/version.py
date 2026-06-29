from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(prefix="/api", tags=["version"])


@router.get("/version")
def version():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "phase": "3.0",
    }
