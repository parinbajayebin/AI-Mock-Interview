import httpx

def check_health():
    try:
        res = httpx.get("http://localhost:8000/")
        print("Status Code:", res.status_code)
        print("Response JSON:", res.json())
    except Exception as e:
        print("Error connecting to server:", str(e))

if __name__ == "__main__":
    check_health()
