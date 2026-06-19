from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError

from app.core.database import get_db
from app.core.config import settings
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.user import UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Setup OAuth2 password scheme to parse Authorization: Bearer <ID_TOKEN>
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> UserResponse:
    """Dependency injection helper to retrieve current logged in user from Supabase JWT.
    Automatically syncs or creates the user in the local database.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not settings.SUPABASE_JWT_SECRET:
        print("[ERROR] SUPABASE_JWT_SECRET is not configured.")
        raise credentials_exception

    try:
        import httpx
        
        # Verify token by fetching user directly from Supabase API
        # Ensure we just get the base URL, stripping /rest/v1 or trailing slashes
        base_url = settings.SUPABASE_URL.split('/rest/v1')[0].rstrip('/')
        supabase_auth_url = f"{base_url}/auth/v1/user"
        
        async with httpx.AsyncClient() as client:
            res = await client.get(
                supabase_auth_url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": settings.SUPABASE_SERVICE_ROLE_KEY or settings.VITE_SUPABASE_ANON_KEY or ""
                }
            )
            
            if res.status_code != 200:
                print(f"[ERROR] Supabase token verification failed: {res.status_code} - {res.text}")
                raise credentials_exception
                
            user_data = res.json()
            
        email = user_data.get("email")
        uid = user_data.get("id")
        
        # Extract metadata
        user_meta = user_data.get("user_metadata", {})
        app_meta = user_data.get("app_metadata", {})
        
        if not email:
            email = user_meta.get("email", f"{uid}@noemail.com")
            
        name = user_meta.get("full_name") or user_meta.get("name") or email.split("@")[0]
        role = user_data.get("role")
        email_verified = role == "authenticated"
        
        if not uid:
            print("[ERROR] No UID found in token.")
            raise credentials_exception
            
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[ERROR] Unexpected error verifying token: {e}")
        raise credentials_exception

    # Retrieve or create user record in local database to sync
    user = await UserRepository.get_by_email(db, email)
    
    provider = app_meta.get("provider", "supabase")
    if provider == "email":
        provider = "supabase"
        
    if not user:
        user = User(
            email=email.strip().lower(),
            full_name=name.strip(),
            hashed_password=None,  # We don't store passwords, Supabase does
            auth_provider=provider,
            provider_id=uid,
            is_active=email_verified
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        # Keep name and active/verification state in sync
        changed = False
        if user.provider_id != uid:
            user.provider_id = uid
            changed = True
        if user.is_active != email_verified:
            user.is_active = email_verified
            changed = True
        if changed:
            db.add(user)
            await db.commit()
            await db.refresh(user)

    return user

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    """Retrieve session details for the logged-in candidate, syncing with database if needed."""
    return current_user
