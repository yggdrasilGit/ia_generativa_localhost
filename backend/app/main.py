from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.chat import router as chat_router
from app.api.health import router as health_router
from app.api.models import router as models_router
from app.api.version import router as version_router
from app.websocket.chat import router as ws_router
from app.auth.routes import router as auth_router
from app.users.routes import router as users_router
from app.projects.routes import router as projects_router
from app.conversations.routes import router as conversations_router
from app.settings.routes import router as settings_router
from app.sessions.routes import router as sessions_router
from app.audit.routes import router as audit_router
from app.backup.routes import router as backup_router
from app.history.routes import router as history_router
from app.documents.upload import router as documents_router
from app.rag.routes import router as rag_router
from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.core.security import limiter, add_cors
from app.middleware.logging import LoggingMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.db import Base, engine
import app.models  # noqa: F401

# Inicia logging
setup_logging()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Plataforma de IA local — Fase 1 Profissional",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
add_cors(app)

# Middleware de log
app.add_middleware(LoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

# Routers
app.include_router(chat_router)
app.include_router(health_router)
app.include_router(models_router)
app.include_router(version_router)
app.include_router(ws_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(projects_router)
app.include_router(conversations_router)
app.include_router(settings_router)
app.include_router(sessions_router)
app.include_router(audit_router)
app.include_router(backup_router)
app.include_router(history_router)
app.include_router(documents_router)
app.include_router(rag_router)
app.include_router(rag_router, prefix="/api/v1")


@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)
    logger.info(f"🌳 {settings.APP_NAME} v{settings.APP_VERSION} iniciado")
    logger.info(f"   Modelo: {settings.OLLAMA_MODEL}")
    logger.info(f"   Ollama: {settings.OLLAMA_BASE_URL}")
    logger.info(f"   Docs:   http://localhost:{settings.PORT}/docs")

