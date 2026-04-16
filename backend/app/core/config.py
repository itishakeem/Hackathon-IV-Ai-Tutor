from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Supabase Storage
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_BUCKET: str

    # Neon PostgreSQL
    DATABASE_URL: str

    # JWT
    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


settings = Settings()
