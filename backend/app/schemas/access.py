from pydantic import BaseModel


class AccessCheckResponse(BaseModel):
    allowed: bool
    reason: str | None = None
    tier: str
