import sys
import os

# Add backend directory to PYTHONPATH
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# pyrefly: ignore [missing-import]
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token

def test_password_hashing():
    """Verify password hashing and matching verification logic."""
    password = "super_secure_password_123!"
    hashed = get_password_hash(password)
    
    # Assert hash is different from text
    assert hashed != password
    # Assert correct verification returns True
    assert verify_password(password, hashed) is True
    # Assert incorrect credentials verification returns False
    assert verify_password("wrong_password", hashed) is False

def test_jwt_token_flow():
    """Verify JWT creation, serialization, and decoding functions."""
    user_id = "d22e0f8c-22b4-4e92-bc10-efba70a5996b"
    token = create_access_token(user_id)
    
    assert token is not None
    assert isinstance(token, str)
    
    # Verify signature extraction matches original subject ID
    decoded_id = decode_access_token(token)
    assert decoded_id == user_id

def test_invalid_jwt_verification():
    """Verify decoding a malformed token returns None instead of raising errors."""
    decoded = decode_access_token("malformed.jwt.token")
    assert decoded is None
