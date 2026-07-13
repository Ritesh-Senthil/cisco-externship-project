"""Application settings."""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    database_url: str = "postgresql+asyncpg://eventshield:eventshield@localhost:5432/eventshield"
    redis_url: str = "redis://localhost:6379/0"
    persistence_enabled: bool = True
    cors_origins: str = "http://localhost:3000"

    llm_provider: Literal["openai", "ollama"] = "ollama"
    llm_model: str = "llama3.2"
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    ollama_base_url: str = "http://localhost:11434"
    llm_timeout_seconds: float = 5.0
    ai_fallback_default: bool = True

    splunk_hec_url: str = "https://localhost:8088/services/collector"
    splunk_hec_token: str = "eventshield-hec-token-change-me"
    splunk_hec_verify_ssl: bool = False
    splunk_enabled: bool = True

    demo_seed: int = 42

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def postgres_dsn(self) -> str:
        """asyncpg wants a plain libpq DSN, not the SQLAlchemy '+asyncpg' form."""
        return self.database_url.replace("postgresql+asyncpg://", "postgresql://").replace(
            "+asyncpg", ""
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
