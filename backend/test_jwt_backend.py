import asyncio
import httpx
from jose import jwt
from datetime import datetime, timedelta

secret = "Vp4UHoYSbLIGQ278CvV2V0/ItyYH4r1tHyeEUOKGhcku8QW6uHxkgQsOS+yOlPbZqyILEBxitlK8xMvyDJvZVg=="

payload = {
    "aud": "authenticated",
    "exp": int((datetime.now() + timedelta(hours=1)).timestamp()),
    "sub": "some-uuid-1234",
    "email": "googleuser@example.com",
    "app_metadata": {
        "provider": "google",
        "providers": ["google"]
    },
    "user_metadata": {
        "full_name": "Google Test User"
    },
    "role": "authenticated"
}

token = jwt.encode(payload, secret, algorithm="HS256")

async def main():
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            res = await client.get("http://localhost:8000/api/auth/me", headers={"Authorization": f"Bearer {token}"})
            print("Status:", res.status_code)
            print("Body:", res.text)
        except Exception as e:
            print("Failed:", type(e), str(e))

if __name__ == "__main__":
    asyncio.run(main())
