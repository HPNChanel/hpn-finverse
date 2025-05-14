"""
Configuration settings for FinVerse API
"""

# API configuration
API_VERSION = "v1"
API_TITLE = "FinVerse API"
API_DESCRIPTION = "Financial dApp API for staking and managing transactions"

# Mock authentication settings
AUTH_TOKEN_EXPIRY = 3600  # 1 hour in seconds
AUTH_TOKEN_TYPE = "bearer"

# Staking settings
MIN_STAKE_AMOUNT = 0.01
MAX_STAKE_AMOUNT = 1000000.0 