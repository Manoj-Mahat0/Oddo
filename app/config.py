# config.py
from pydantic_settings import BaseSettings   # ✅ new import (not from pydantic)

class Settings(BaseSettings):
    ALLOWED_SSID: str = "E DIGITAL INDIA"
    ALLOWED_SSID_ALT: str = "E DIGITAL INDIA 5g"  # optional comma-separated more SSIDs
    OFFICE_LAT: float = 22.804925060054416
    OFFICE_LNG: float = 86.203053378007
    ALLOWED_RADIUS_METERS: int = 50
    ATTEMPT_LIMIT: int = 15
    ALLOWED_IPS: str = "192.168.1.1"

    class Config:
        env_file = ".env"

settings = Settings()
