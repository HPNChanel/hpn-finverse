"""
Error handling middleware for FinVerse API
"""

from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable, Dict, Any
import traceback
import logging
import jwt

logger = logging.getLogger(__name__)

class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable):
        try:
            return await call_next(request)
        except jwt.ExpiredSignatureError:
            # Handle expired JWT token
            logger.warning("JWT token expired")
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content=self._format_error_response(
                    "Authentication error",
                    "Token has expired. Please log in again.",
                    status.HTTP_401_UNAUTHORIZED
                ),
                headers={"WWW-Authenticate": "Bearer"},
            )
        except jwt.InvalidTokenError:
            # Handle invalid JWT token
            logger.warning("Invalid JWT token")
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content=self._format_error_response(
                    "Authentication error",
                    "Invalid authentication token",
                    status.HTTP_401_UNAUTHORIZED
                ),
                headers={"WWW-Authenticate": "Bearer"},
            )
        except Exception as e:
            # Log the error
            logger.error(f"Unhandled exception: {str(e)}")
            logger.error(traceback.format_exc())
            
            # Return a standard error response
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            # Handle common HTTP exceptions with their status codes
            if hasattr(e, "status_code"):
                status_code = e.status_code
            
            return JSONResponse(
                status_code=status_code,
                content=self._format_error_response(
                    "Error processing request",
                    str(e) if str(e) else "An internal server error occurred",
                    status_code
                )
            )
    
    def _format_error_response(self, message: str, detail: str, status_code: int) -> Dict[str, Any]:
        """Format the error response in a consistent structure"""
        return {
            "success": False,
            "message": message,
            "errors": [{"detail": detail}] if detail else None,
            "status_code": status_code
        }
