from pydantic_settings import BaseSettings
from typing import Optional, List
from pydantic import SecretStr
from urllib.parse import quote_plus
from pathlib import Path  # <-- import Path for absolute path

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "SCOPE"
    
    # CORS Settings
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    # Database settings
    DATABASE_URL: str ="mysql+pymysql://yatish:Yatish%40123@localhost:3306/testdb"

    MYSQL_HOST: Optional[str] = "localhost"
    MYSQL_PORT: int = 3306
    MYSQL_DB: Optional[str] = "tesdb"
    MYSQL_USER: Optional[str] = "yatish"
    MYSQL_PASSWORD: Optional[SecretStr] = "Yatish@123"
    
    # JWT Settings
    SECRET_KEY: str = "CHANGE_THIS_TO_A_PROPER_SECRET_IN_PRODUCTION"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Google Gemini API
    GOOGLE_API_KEY: Optional[SecretStr] = None
    
    # ML Model Settings
    # Make MODEL_PATH absolute relative to this settings file
    MODEL_PATH: str = str(Path(__file__).parent / "ml" / "model.pt")
    MODEL: str = 'distilbert-base-uncased'
    
    def _build_mysql_url(self) -> str:
        user = quote_plus(self.MYSQL_USER or "")
        password = ""
        if self.MYSQL_PASSWORD:
            password = quote_plus(self.MYSQL_PASSWORD.get_secret_value())
        auth = f"{user}:{password}" if password else user
        host = self.MYSQL_HOST or "localhost"
        port = self.MYSQL_PORT or 3306
        db = self.MYSQL_DB or "scope"
        return f"mysql+pymysql://{auth}@{host}:{port}/{db}"

    def model_post_init(self, __context) -> None:
        if self.MYSQL_HOST and self.MYSQL_DB and self.MYSQL_USER:
            if self.DATABASE_URL.startswith("sqlite"):
                self.DATABASE_URL = self._build_mysql_url()

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()

