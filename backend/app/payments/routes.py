"""
Payments API — Razorpay order creation and HMAC signature verification.

Provides two endpoints:
  POST /payments/create-order  — creates a Razorpay order for the ₹199/month
                                 Premium subscription (falls back to mock if keys
                                 are not configured).
  POST /payments/verify        — verifies the Razorpay HMAC signature and
                                 upgrades the authenticated user's is_premium flag.

Author: parinbajayebin
"""
import time
import hmac
import hashlib
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import razorpay

from app.core.database import get_db
from app.core.config import settings
from app.auth.routes import get_current_user
from app.models.user import User

router = APIRouter(prefix="/payments", tags=["Payments"])

class OrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    key_id: str
    is_mock: bool = False

class VerificationRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    is_mock: bool = False

@router.post("/create-order", response_model=OrderResponse)
async def create_payment_order(
    current_user: User = Depends(get_current_user)
):
    """Create a Razorpay payment order for the ₹199/month Premium subscription.
    Falls back to a developer mock order when Razorpay keys are not configured.
    """
    amount_in_paise = 19900  # ₹199
    
    # Fallback to mock order if Razorpay keys are not configured
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET or settings.RAZORPAY_KEY_SECRET == "your_razorpay_secret_here":
        mock_order_id = f"order_mock_{int(time.time())}"
        print(f"[PAYMENT] Razorpay keys not configured. Returning mock order_id: {mock_order_id}")
        return OrderResponse(
            order_id=mock_order_id,
            amount=amount_in_paise,
            currency="INR",
            key_id="rzp_test_mockkey",
            is_mock=True
        )
    
    try:
        # Initialize Razorpay Client
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        
        # Create order in Razorpay
        order_data = {
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": f"receipt_sub_{current_user.id}_{int(time.time())}",
            "payment_capture": 1
        }
        
        razorpay_order = client.order.create(data=order_data)
        
        return OrderResponse(
            order_id=razorpay_order["id"],
            amount=amount_in_paise,
            currency="INR",
            key_id=settings.RAZORPAY_KEY_ID,
            is_mock=False
        )
    except Exception as e:
        print(f"[ERROR] Failed to create Razorpay order: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Razorpay order generation failed: {str(e)}"
        )

@router.post("/verify")
async def verify_payment(
    payload: VerificationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Verify Razorpay payment signature and upgrade user subscription status to Premium."""
    # Handle mock signature verification
    if payload.is_mock:
        print(f"[PAYMENT] Verifying mock order: {payload.razorpay_order_id}")
        if not payload.razorpay_order_id.startswith("order_mock_"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid mock order ID"
            )
        
        # Update user status to premium
        current_user.is_premium = True
        db.add(current_user)
        await db.commit()
        await db.refresh(current_user)
        
        return {
            "status": "success",
            "message": "Successfully upgraded to Premium Tier (Mock Mode)!",
            "is_premium": True
        }
        
    if not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Razorpay is not configured on this server."
        )
        
    try:
        # Verify signature locally
        # Razorpay signature formula: HMAC-SHA256(order_id + "|" + payment_id, secret)
        msg = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}"
        generated_signature = hmac.new(
            key=settings.RAZORPAY_KEY_SECRET.encode('utf-8'),
            msg=msg.encode('utf-8'),
            digestmod=hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(generated_signature, payload.razorpay_signature):
            print(f"[ERROR] Razorpay Signature verification failed. Expected: {generated_signature}, Got: {payload.razorpay_signature}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment signature verification failed. Transaction was not completed securely."
            )
            
        # Update user to premium
        current_user.is_premium = True
        db.add(current_user)
        await db.commit()
        await db.refresh(current_user)
        
        print(f"[PAYMENT SUCCESS] User {current_user.email} upgraded to Premium. Order ID: {payload.razorpay_order_id}")
        return {
            "status": "success",
            "message": "Payment verified! Your account has been upgraded to Premium Tier.",
            "is_premium": True
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Exception during payment verification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Verification error: {str(e)}"
        )
