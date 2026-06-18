import uuid
import smtplib
import httpx
import random
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
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
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.user import (
    UserCreate,
    UserResponse,
    UserLogin,
    Token,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    GoogleCallbackRequest,
    OTPVerificationRequest,
    OTPResendRequest
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Helper function to send OTP email
def send_otp_email(to_email: str, otp_code: str) -> bool:
    # Fallback log print in case SMTP is not configured
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        print("\n=== [SMTP NOT CONFIGURED] Fallback Verification OTP ===")
        print(f"To Email: {to_email}")
        print(f"OTP Code: {otp_code}")
        print("=======================================================\n")
        return True

    try:
        sender_email = settings.SMTP_SENDER_EMAIL or settings.SMTP_USERNAME
        msg = MIMEMultipart()
        msg['From'] = f"AI Mock Interview <{sender_email}>"
        msg['To'] = to_email
        msg['Subject'] = "Email Verification OTP - AI Mock Interview"

        body = f"""
        <html>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2937; padding: 20px; background-color: #f3f4f6;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <h2 style="color: #4f46e5; margin-top: 0;">AI Mock Interview Platform</h2>
                    <p>Hello,</p>
                    <p>Thank you for signing up! Please verify your email address using the following 6-digit One-Time Password (OTP). This code is valid for <strong>5 minutes</strong>:</p>
                    <div style="margin: 30px 0; text-align: center;">
                        <span style="display: inline-block; padding: 15px 35px; color: #4f46e5; background-color: #f0fdf4; border: 2px dashed #4f46e5; border-radius: 8px; font-size: 2rem; font-weight: bold; letter-spacing: 5px;">{otp_code}</span>
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
            # Strip spaces from App Passwords if present
            smtp_pass = settings.SMTP_PASSWORD.replace(" ", "") if settings.SMTP_PASSWORD else ""
            server.login(settings.SMTP_USERNAME, smtp_pass)
            server.sendmail(sender_email, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"\n[ERROR] Failed to send OTP email via SMTP: {str(e)}")
        print(f"Fallback OTP Code: {otp_code}\n")
        return False

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
            # Strip spaces from App Passwords if present
            smtp_pass = settings.SMTP_PASSWORD.replace(" ", "") if settings.SMTP_PASSWORD else ""
            server.login(settings.SMTP_USERNAME, smtp_pass)
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
async def register(schema: UserCreate, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    """Registers a new email/password candidate account (requires verification)."""
    existing_user = await UserRepository.get_by_email(db, schema.email)
    if existing_user:
        if existing_user.auth_provider == "google":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This email is registered using Google Sign-in. Please use Google authentication."
            )
        
        # If user registered locally but is not verified/active, resend OTP
        if not existing_user.is_active:
            otp_code = f"{random.randint(100000, 999999)}"
            otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
            await UserRepository.update_user_otp(db, existing_user, otp_code, otp_expires_at)
            background_tasks.add_task(send_otp_email, existing_user.email, otp_code)
            return existing_user
            
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists"
        )
    
    otp_code = f"{random.randint(100000, 999999)}"
    otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    
    user = await UserRepository.create_local_user(db, schema, otp_code, otp_expires_at)
    background_tasks.add_task(send_otp_email, user.email, otp_code)
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

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address. An OTP verification code was sent to your inbox."
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

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address. An OTP verification code was sent to your inbox."
        )

    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = create_access_token(user.id)
    return Token(access_token=token, user=UserResponse.model_validate(user))


@router.post("/verify-otp", response_model=Token)
async def verify_otp(schema: OTPVerificationRequest, db: AsyncSession = Depends(get_db)):
    """Verifies OTP code and activates user account, logging them in immediately."""
    user = await UserRepository.get_by_email(db, schema.email)
    if not user or user.auth_provider != "local":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid request: user email not found"
        )
        
    if user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is already verified and active. Please login."
        )
        
    # Allow '123456' as a testing bypass code to bypass SMTP blocks on Render/deployments
    is_bypass = schema.otp_code == "123456"
    
    if not is_bypass:
        if not user.otp_code or user.otp_code != schema.otp_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification OTP code"
            )
            
        expires_at = user.otp_expires_at
        if expires_at:
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) > expires_at:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Verification code has expired. Please request a new one."
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code state"
            )
        
    # Activate user
    await UserRepository.activate_user(db, user)
    
    # Log user in
    token = create_access_token(user.id)
    return Token(access_token=token, user=UserResponse.model_validate(user))


@router.post("/resend-otp")
async def resend_otp(schema: OTPResendRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    """Resends verification OTP code to the inactive user email."""
    user = await UserRepository.get_by_email(db, schema.email)
    if not user or user.auth_provider != "local" or user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code cannot be sent for this account"
        )
        
    otp_code = f"{random.randint(100000, 999999)}"
    otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    
    await UserRepository.update_user_otp(db, user, otp_code, otp_expires_at)
    background_tasks.add_task(send_otp_email, user.email, otp_code)
    return {"message": "A new verification OTP code has been sent to your email."}


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
        # Prevent Google OAuth signup/login if the email is already registered locally
        if user.auth_provider == "local":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This email is already registered with email and password. Please log in using your password."
            )
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
async def forgot_password(schema: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    """Triggers password reset email workflow."""
    user = await UserRepository.get_by_email(db, schema.email)
    
    # Do not reveal user existence to prevent account enumeration attacks
    if not user or user.auth_provider != "local":
        return {"message": "If this email is registered, a password reset link has been sent."}

    # Generate standard secure token
    token = str(uuid.uuid4())
    expiration = datetime.now(timezone.utc) + timedelta(minutes=15)

    await UserRepository.update_reset_token(db, user, token, expiration)
    
    # Send reset mail in background
    background_tasks.add_task(send_reset_email, user.email, token)

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
