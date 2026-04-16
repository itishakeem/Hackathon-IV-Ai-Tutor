"""Custom HTTP exceptions with consistent error response format."""
from fastapi import HTTPException, status


class FreemiumGateException(HTTPException):
    """Raised when a free-tier user attempts to access premium content."""

    def __init__(self, detail: str = "This content requires a premium or pro subscription."):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            headers={"X-Error-Code": "FREEMIUM_GATE"},
        )


class ChapterNotFoundException(HTTPException):
    """Raised when a requested chapter does not exist in storage."""

    def __init__(self, chapter_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chapter '{chapter_id}' not found.",
            headers={"X-Error-Code": "CHAPTER_NOT_FOUND"},
        )


class InvalidTokenException(HTTPException):
    """Raised when a JWT token is missing, expired, or malformed."""

    def __init__(self, detail: str = "Invalid or expired authentication token."):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={
                "WWW-Authenticate": "Bearer",
                "X-Error-Code": "INVALID_TOKEN",
            },
        )
