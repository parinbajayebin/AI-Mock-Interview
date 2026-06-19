import httpx
import asyncio

URL_SIGNUP = "https://bkjsrjibrpxpwglzrrnd.supabase.co/auth/v1/signup"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJranNyamlicnB4cHdnbHpycm5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTc3OTcsImV4cCI6MjA5NzI3Mzc5N30.yppyRCNsFVHhyX8O_aJNoCYH65N0swSh5wSE1mML4XQ"

async def main():
    async with httpx.AsyncClient() as client:
        # Signup
        payload = {
            "email": "test_sync_fail_1@example.com", 
            "password": "TestPassword123!",
            "data": {"full_name": "Sync Fail User"}
        }
        headers = {"apikey": ANON_KEY, "Content-Type": "application/json"}
        res = await client.post(URL_SIGNUP, json=payload, headers=headers)
        
        if res.status_code != 200:
            print("Signup failed:", res.text)
            return
            
        data = res.json()
        print("Signup Success")
        session = data.get("session")
        if not session:
            print("No session returned. Email confirmation is ON.")
            return
            
        token = session["access_token"]
        
        # Ping backend
        res2 = await client.get("http://localhost:8000/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        print("Backend Response Status:", res2.status_code)
        print("Backend Response Body:", res2.text)

if __name__ == "__main__":
    asyncio.run(main())
