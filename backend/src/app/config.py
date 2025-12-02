from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_key: str
    database_url: str

    # OpenAI
    openai_api_key: str

    # App
    environment: str = "development"
    debug: bool = True


settings = Settings()  # type: ignore[call-arg]
