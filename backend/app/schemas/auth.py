from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str = ""


class UserProfileResponse(BaseModel):
    id: str
    email: str
    name: str
    tier: str
    avatar: str | None


class UpdateProfileRequest(BaseModel):
    name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str


class MessageResponse(BaseModel):
    message: str
