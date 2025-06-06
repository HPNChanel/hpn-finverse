"""
Core module for FinVerse API

Contains cross-cutting concerns: configuration, security, authentication, and utilities.
This module provides the foundation for the clean architecture implementation.
"""

try:
    from .config import settings
except ImportError:
    print("⚠️ Settings not available, using default configuration")
    settings = None

try:
    from .security import get_password_hash, verify_password
except ImportError:
    print("⚠️ Security utilities not available")
    get_password_hash = None
    verify_password = None

try:
    from .auth import get_current_user, get_current_user_id
except ImportError:
    print("⚠️ Auth utilities not available")
    get_current_user = None
    get_current_user_id = None

# Safe exports
__all__ = []

if settings is not None:
    __all__.append('settings')

if get_password_hash is not None and verify_password is not None:
    __all__.extend(['get_password_hash', 'verify_password'])

if get_current_user is not None and get_current_user_id is not None:
    __all__.extend(['get_current_user', 'get_current_user_id'])

print("✅ Core module loaded with clean architecture")
print(f"✅ Available components: {', '.join(__all__)}")
