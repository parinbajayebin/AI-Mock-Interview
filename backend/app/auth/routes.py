import uuid
import smtplib
import httpx
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token
)
from app.repositories.user import UserRepository
from app.schemas.user import (
    UserCreate,
    UserResponse,
    UserLogin,
    Token,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    GoogleCallbackRequest
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Setup OAuth2 password scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# Helper function to send reset email
def send_reset_email(to_email: str, reset_token: str) -> bool:
    reset_link = f"http://localhost:5173/reset-password?token={reset_token}"
    
    # Fallback log print in case SMTP is not configured
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        print("\n=== [SMTP NOT CONFIGURED] Fallback Password Reset URL ===")
        print(f"To Email: {to_email}")
        print(f"Reset Link: {reset_link}")
        print("=========================================================\n")
        return True

    try:
        sender_email = settings.SMTP_SENDER_EMAIL or settings.SMTP_USERNAME
        msg = MIMEMultipart()
        msg['From'] = f"AI Mock Interview <{sender_email}>"
        msg['To'] = to_email
        msg['Subject'] = "Reset Your Password - AI Mock Interview"

        body = f"""
        <html>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2937; padding: 20px; background-color: #f3f4f6;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <h2 style="color: #4f46e5; margin-top: 0;">AI Mock Interview Platform</h2>
                    <p>Hello,</p>
                    <p>We received a request to reset the password for your account. Click the button below to set a new password. This link is valid for <strong>15 minutes</strong>:</p>
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="{reset_link}" style="display: inline-block; padding: 12px 24px; color: #ffffff; background-color: #4f46e5; text-decoration: none; border-radius: 8px; font-weight: bold; transition: background-color 0.2s;">Reset Password</a>
                    </div>
                    <p>If you did not request this, you can safely ignore this email.</p>
                    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
                    <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0;">Best regards,<br/>The AI Mock Interview Team</p>
                </div>
            </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(sender_email, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"\n[ERROR] Failed to send email via SMTP: {str(e)}")
        print(f"Fallback Reset Link: {reset_link}\n")
        return False


async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> UserResponse:
    """Dependency injection helper to retrieve current logged in user from JWT."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user_id_str = decode_access_token(token)
    if user_id_str is None:
        raise credentials_exception
    
    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise credentials_exception

    user = await UserRepository.get_by_id(db, user_uuid)
    if user is None:
        raise credentials_exception
    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(schema: UserCreate, db: AsyncSession = Depends(get_db)):
    """Registers a new email/password candidate account."""
    existing_user = await UserRepository.get_by_email(db, schema.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists"
        )
    
    user = await UserRepository.create_local_user(db, schema)
    return user


@router.post("/login", response_model=Token)
async def login(schema: UserLogin, db: AsyncSession = Depends(get_db)):
    """Logs in an email/password candidate, returning a JWT token."""
    user = await UserRepository.get_by_email(db, schema.email)
    if not user or user.auth_provider != "local" or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(schema.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = create_access_token(user.id)
    return Token(access_token=token, user=UserResponse.model_validate(user))


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    """Logs in an email/password candidate using standard form-data (OAuth2 format), returning a JWT token."""
    user = await UserRepository.get_by_email(db, form_data.username)
    if not user or user.auth_provider != "local" or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = create_access_token(user.id)
    return Token(access_token=token, user=UserResponse.model_validate(user))


@router.get("/google/config")
async def get_google_config():
    """Exposes Google Client ID to frontend dynamically."""
    return {"client_id": settings.GOOGLE_CLIENT_ID}


@router.post("/google/callback", response_model=Token)
async def google_callback(payload: GoogleCallbackRequest, db: AsyncSession = Depends(get_db)):
    """Verifies Google Client credential tokens and returns session JWT."""
    id_token = payload.id_token
    
    # Query Google's tokeninfo endpoint to verify token validity
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": id_token},
                timeout=5.0
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Unable to reach Google OAuth services: {str(e)}"
            )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google token verification failed"
        )

    token_info = response.json()
    
    # Verify Audience client ID matches ours
    if settings.GOOGLE_CLIENT_ID and token_info.get("aud") != settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Audience claim mismatch (Token was not generated for this client)"
        )

    email = token_info.get("email")
    full_name = token_info.get("name", "Google User")
    google_sub = token_info.get("sub")  # Google's unique user ID

    if not email or not google_sub:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google token payload is missing email or user identifier"
        )

    user = await UserRepository.get_by_email(db, email)
    if user:
        # Link user if they logged in before locally or provider details aren't stored
        if user.auth_provider == "local":
            user.auth_provider = "google"
            user.provider_id = google_sub
            db.add(user)
            await db.commit()
            await db.refresh(user)
        elif user.provider_id != google_sub:
            user.provider_id = google_sub
            db.add(user)
            await db.commit()
            await db.refresh(user)
    else:
        # Create new OAuth user
        user = await UserRepository.create_oauth_user(
            db,
            email=email,
            full_name=full_name,
            provider="google",
            provider_id=google_sub
        )

    token = create_access_token(user.id)
    return Token(access_token=token, user=UserResponse.model_validate(user))


@router.post("/forgot-password")
async def forgot_password(schema: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Triggers password reset email workflow."""
    user = await UserRepository.get_by_email(db, schema.email)
    
    # Do not reveal user existence to prevent account enumeration attacks
    if not user or user.auth_provider != "local":
        return {"message": "If this email is registered, a password reset link has been sent."}

    # Generate standard secure token
    token = str(uuid.uuid4())
    expiration = datetime.now(timezone.utc) + timedelta(minutes=15)

    await UserRepository.update_reset_token(db, user, token, expiration)
    
    # Send reset mail
    mail_sent = send_reset_email(user.email, token)
    if not mail_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send password recovery email"
        )

    return {"message": "If this email is registered, a password reset link has been sent."}


@router.post("/reset-password")
async def reset_password(schema: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Verifies reset token and changes password."""
    # Find user by token
    from sqlalchemy import select
    result = await db.execute(
        select(User).filter(User.reset_token == schema.token)
    )
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    # Check expiration (ensure reset_token_expires_at is offset-aware)
    expires_at = user.reset_token_expires_at
    if expires_at:
        # Convert DB datetime to timezone-aware if needed
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
            
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    # Update password and clear reset tokens
    new_hash = get_password_hash(schema.new_password)
    await UserRepository.update_password(db, user, new_hash)
    
    return {"message": "Password successfully updated. You may now log in."}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    """Retrieve session details for the logged-in candidate."""
    return current_user
