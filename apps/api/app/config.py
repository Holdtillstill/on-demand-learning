from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "zhongwen-api"
    environment: str = "local"
    database_url: str = "postgresql+psycopg://zhongwen:zhongwen@postgres:5432/zhongwen"
    redis_url: str = "redis://redis:6379/0"
    cors_origins: str = "http://localhost:5173,http://localhost:8080"
    auto_seed: bool = True
    otel_exporter_otlp_endpoint: str | None = "http://jaeger:4318"
    rate_limit_per_minute: int = 120

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
