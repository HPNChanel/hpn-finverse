"""
Configuration settings for FinVerse API using Pydantic Settings
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings using Pydantic BaseSettings"""
    
    # API Configuration
    API_VERSION: str = "v1"
    API_TITLE: str = "FinVerse API"
    API_DESCRIPTION: str = "Financial dApp API for staking and managing transactions"
    DEBUG: bool = True
    
    # Database Configuration
    DATABASE_URL: Optional[str] = None
    DATABASE_HOST: str = "localhost"
    DATABASE_PORT: int = 3306
    DATABASE_USER: str = "root"
    DATABASE_PASSWORD: str = "HPNChanel1312$"
    DATABASE_NAME: str = "finverse_db"
    
    # Security Configuration
    SECRET_KEY: str = "LL_XTuzukSzO8veTgP2LyMRBfqn37wRb4fiFdg7O15Y="
    JWT_SECRET_KEY: str = "DOQTZuoVXFAiSemiHm70Ykl0qWG5FWSxRVk13rMb2ds="
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # Authentication Settings
    AUTH_TOKEN_EXPIRY: int = 3600  # 1 hour in seconds
    AUTH_TOKEN_TYPE: str = "bearer"
    
    # Staking Settings
    MIN_STAKE_AMOUNT: float = 0.01
    MAX_STAKE_AMOUNT: float = 1000000.0
    
    # Staking Pool Settings
    DEFAULT_FLEXIBLE_APY: float = 5.0
    DEFAULT_30DAY_APY: float = 7.5
    DEFAULT_90DAY_APY: float = 12.0
    REWARD_CALCULATION_PRECISION: int = 6
    
    # CORS Settings
    CORS_ORIGINS: list = ["http://localhost:5173"]
    
    # Blockchain sync configuration
    WEB3_RPC_URL: str = "http://127.0.0.1:8545"
    WEB3_WS_URL: str = "ws://127.0.0.1:8545"
    WEB3_WEBSOCKET_URL: str = "ws://127.0.0.1:8546"
    TOKEN_ADDRESS: str = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    STAKE_VAULT_ADDRESS: str = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
    
    # Sync service settings
    AUTO_START_SYNC: bool = False
    SYNC_INTERVAL_SECONDS: int = 10
    SYNC_BATCH_SIZE: int = 100
    
    @property
    def database_url(self) -> str:
        """Build database URL from components"""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"mysql+pymysql://{self.DATABASE_USER}:{self.DATABASE_PASSWORD}@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Create global settings instance
settings = Settings()

# Legacy compatibility exports
API_VERSION = settings.API_VERSION
API_TITLE = settings.API_TITLE
API_DESCRIPTION = settings.API_DESCRIPTION
AUTH_TOKEN_EXPIRY = settings.AUTH_TOKEN_EXPIRY
AUTH_TOKEN_TYPE = settings.AUTH_TOKEN_TYPE
MIN_STAKE_AMOUNT = settings.MIN_STAKE_AMOUNT
MAX_STAKE_AMOUNT = settings.MAX_STAKE_AMOUNT
DEFAULT_FLEXIBLE_APY = settings.DEFAULT_FLEXIBLE_APY
DEFAULT_30DAY_APY = settings.DEFAULT_30DAY_APY
DEFAULT_90DAY_APY = settings.DEFAULT_90DAY_APY
REWARD_CALCULATION_PRECISION = settings.REWARD_CALCULATION_PRECISION
