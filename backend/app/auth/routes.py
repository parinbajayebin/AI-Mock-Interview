from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from firebase_admin import auth as firebase_auth

from app.core.database import get_db
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.user import UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Setup OAuth2 password scheme to parse Authorization: Bearer <ID_TOKEN>
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> UserResponse:
    """Dependency injection helper to retrieve current logged in user from Firebase ID Token.
    Automatically syncs or creates the user in the local database.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Verify the Firebase ID token
        decoded_token = firebase_auth.verify_id_token(token)
        email = decoded_token.get("email")
        uid = decoded_token.get("uid")
        name = decoded_token.get("name") or decoded_token.get("email", "").split("@")[0]
        email_verified = decoded_token.get("email_verified", False)
        
        if not email:
            raise credentials_exception
            
    except Exception as e:
        print(f"[ERROR] Firebase token verification failed: {e}")
        raise credentials_exception

    # Retrieve or create user record in local database to sync
    user = await UserRepository.get_by_email(db, email)
    if not user:
        # Check if Google provider or standard password provider
        firebase_provider = "firebase"
        firebase_identities = decoded_token.get("firebase", {}).get("identities", {})
        if "google.com" in firebase_identities:
            firebase_provider = "google"
            
        user = User(
            email=email.strip().lower(),
            full_name=name.strip(),
            hashed_password=None,
            auth_provider=firebase_provider,
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
