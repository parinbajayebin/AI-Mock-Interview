import asyncio
import io
import uuid
from httpx import AsyncClient
from app.main import app
from app.auth.routes import get_current_user
from app.models.user import User

# Override get_current_user for testing
class MockUser:
    id = uuid.uuid4()
    email = "test_user_analysis@example.com"
    full_name = "Jane Analyst"
    auth_provider = "supabase"

app.dependency_overrides[get_current_user] = lambda: MockUser()

async def test_upload_endpoint():
    # Create a simple PDF in memory using ReportLab, or just a dummy PDF structure.
    # Since pypdf is used, it expects a valid PDF. We can create a basic one using reportlab, 
    # but wait: we can just use reportlab if it's installed. Let's see if reportlab is installed, 
    # otherwise we can just use a real pdf file from the project, or write a tiny PDF using a basic byte structure.
    # Let's write a valid PDF string:
    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 50 >>\nstream\nBT /F1 12 Tf 100 700 Td (John Doe: Python, FastAPI, React, SQL) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \n0000000212 00000 n \ntrailer\n<< /Size 5 >>\nstartxref\n311\n%%EOF"
    
    print("Testing /resumes/upload...")
    async with AsyncClient(app=app, base_url="http://test") as ac:
        files = {"file": ("test_resume.pdf", pdf_bytes, "application/pdf")}
        response = await ac.post("/api/resumes/upload", files=files)
        print("Status:", response.status_code)
        if response.status_code == 201:
            print("Response JSON:")
            import pprint
            pprint.pprint(response.json())
        else:
            print("Error response:", response.text)

if __name__ == "__main__":
    asyncio.run(test_upload_endpoint())
