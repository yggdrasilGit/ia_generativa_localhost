from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Yggdrasil AI"
    APP_VERSION: str = "0.1.0"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False

    # Ollama
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen3:0.6b"
    OLLAMA_EMBED_MODEL: str = "nomic-embed-text:latest"

    # Database
    DATABASE_URL: str = "sqlite:///./yggdrasil.db"
    DOCUMENTS_UPLOAD_DIR: str = "./storage/documents"
    CHROMA_PERSIST_DIR: str = "./storage/chroma"

    # Auth
    JWT_SECRET_KEY: str = "change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Logs
    LOG_LEVEL: str = "INFO"

    # Rate limit
    RATE_LIMIT: str = "60/minute"

    # CORS
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    # System prompt
    SYSTEM_PROMPT: str = (
        "Você é Yggdrasil AI, um assistente de inteligência artificial pessoal. "
        "Responda sempre em português brasileiro. "
        "Explique passo a passo quando necessário. "
        "Utilize Markdown nas respostas. "
        "Quando houver código, utilize blocos com a linguagem especificada. "
        "Seja direto, preciso e útil."
    )

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
