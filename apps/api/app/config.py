from functools import lru_cache
from ipaddress import ip_network
from urllib.parse import urlparse

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

LOCAL_SOURCE_BUNDLE_ENVIRONMENTS = {"local", "test", "development"}


class Settings(BaseSettings):
    app_name: str = "zhongwen-api"
    environment: str = "local"
    database_url: str = "postgresql+psycopg://zhongwen:zhongwen@postgres:5432/zhongwen"
    redis_url: str = "redis://redis:6379/0"
    cors_origins: str = (
        "http://localhost:5173,http://localhost:5174,http://localhost:8080,http://localhost:8081,http://localhost:8082,http://localhost:8090,"
        "http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:8080,http://127.0.0.1:8081,http://127.0.0.1:8082,http://127.0.0.1:8090"
    )
    auto_seed: bool = True
    create_schema_on_startup: bool = True
    otel_exporter_otlp_endpoint: str | None = "http://jaeger:4318"
    rate_limit_per_minute: int = Field(default=120, ge=0)
    rate_limit_exempt_paths: str = "/healthz,/readyz,/metrics"
    trusted_proxy_cidrs: str = ""
    platform_source_bundle_public: bool = False
    platform_source_bundle_token: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def rate_limit_exempt_path_set(self) -> set[str]:
        return {path.strip() for path in self.rate_limit_exempt_paths.split(",") if path.strip()}

    @model_validator(mode="after")
    def validate_runtime_security(self):
        for origin in self.cors_origin_list:
            if origin == "*" or origin.lower() == "null":
                raise ValueError("CORS_ORIGINS must list explicit origins when credentials are enabled")
            if "\n" in origin or "\r" in origin:
                raise ValueError("CORS_ORIGINS entries must not contain newlines")
            parsed_origin = urlparse(origin)
            if parsed_origin.scheme not in {"http", "https"} or not parsed_origin.netloc:
                raise ValueError("CORS_ORIGINS entries must be http(s) origins")
            if parsed_origin.path or parsed_origin.params or parsed_origin.query or parsed_origin.fragment:
                raise ValueError("CORS_ORIGINS entries must be origins only, without paths, query strings, or fragments")

        for path in self.rate_limit_exempt_path_set:
            if not path.startswith("/"):
                raise ValueError("RATE_LIMIT_EXEMPT_PATHS entries must start with /")
            if path in {"/", "/*"} or path == "/api" or path.startswith("/api/"):
                raise ValueError("RATE_LIMIT_EXEMPT_PATHS must not exempt broad application routes")

        for raw_cidr in self.trusted_proxy_cidrs.split(","):
            cidr = raw_cidr.strip()
            if not cidr:
                continue
            network = ip_network(cidr, strict=False)
            if network.prefixlen == 0:
                raise ValueError("TRUSTED_PROXY_CIDRS must not trust every source address")

        if self.platform_source_bundle_public and self.environment.lower() not in LOCAL_SOURCE_BUNDLE_ENVIRONMENTS:
            raise ValueError("PLATFORM_SOURCE_BUNDLE_PUBLIC=true is only allowed for local, test, or development environments")

        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
