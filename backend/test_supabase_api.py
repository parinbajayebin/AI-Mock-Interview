import asyncio
import httpx

token = "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJranNyamlicnB4cHdnbHpycm5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTc3OTcsImV4cCI6MjA5NzI3Mzc5N30.yppyRCNsFVHhyX8O_aJNoCYH65N0swSh5wSE1mML4XQ" # This is the anon key
URL = "https://bkjsrjibrpxpwglzrrnd.supabase.co/auth/v1/user"

async def main():
    async with httpx.AsyncClient() as client:
        res = await client.get(URL, headers={"Authorization": f"Bearer {token}", "apikey": token})
        print(res.status_code, res.text)

if __name__ == "__main__":
    asyncio.run(main())
