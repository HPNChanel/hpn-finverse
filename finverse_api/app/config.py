"""
Configuration settings for FinVerse API - Legacy compatibility layer
This file maintains backward compatibility while redirecting to the new config system.
"""

try:
    from app.core.config import (
        settings,
        API_VERSION,
        API_TITLE, 
        API_DESCRIPTION,
        AUTH_TOKEN_EXPIRY,
        AUTH_TOKEN_TYPE,
        MIN_STAKE_AMOUNT,
        MAX_STAKE_AMOUNT,
        DEFAULT_FLEXIBLE_APY,
        DEFAULT_30DAY_APY,
        DEFAULT_90DAY_APY,
        REWARD_CALCULATION_PRECISION
    )
    print("Configuration loaded from app.core.config")
except ImportError:
    print("Core config not available, using fallback values")
    
    # Fallback configuration
    API_VERSION = "v1"
    API_TITLE = "FinVerse API"
    API_DESCRIPTION = "Financial dApp API for staking and managing transactions"
    AUTH_TOKEN_EXPIRY = 3600
    AUTH_TOKEN_TYPE = "bearer"
    MIN_STAKE_AMOUNT = 0.01
    MAX_STAKE_AMOUNT = 1000000.0
    DEFAULT_FLEXIBLE_APY = 5.0
    DEFAULT_30DAY_APY = 7.5
    DEFAULT_90DAY_APY = 12.0
    REWARD_CALCULATION_PRECISION = 6
    
    # Create a mock settings object
    class MockSettings:
        API_VERSION = API_VERSION
        API_TITLE = API_TITLE
        API_DESCRIPTION = API_DESCRIPTION
        
    settings = MockSettings()