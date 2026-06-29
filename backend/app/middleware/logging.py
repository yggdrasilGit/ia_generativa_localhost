import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.logging import logger


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        t0 = time.perf_counter()
        response = await call_next(request)
        elapsed = round((time.perf_counter() - t0) * 1000, 1)

        # Ignora WebSocket e assets estáticos
        if not request.url.path.startswith("/ws"):
            logger.info(
                f"{request.method} {request.url.path} "
                f"→ {response.status_code} [{elapsed}ms] "
                f"| {request.client.host if request.client else '-'}"
            )
        return response
