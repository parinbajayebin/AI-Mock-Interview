import io
import uuid
import asyncio
from pypdf import PdfReader
from supabase import create_client, Client
from app.core.config import settings
from fastapi import HTTPException

# Initialize Supabase client
# Ensure we pass the base URL without /rest/v1/ to the client
base_url = settings.SUPABASE_URL.split('/rest/v1')[0].rstrip('/') if settings.SUPABASE_URL else settings.VITE_SUPABASE_URL

supabase: Client = create_client(
    base_url,
    settings.SUPABASE_SERVICE_ROLE_KEY
)

def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"
    return text

async def upload_resume_to_storage(user_id: uuid.UUID, file_name: str, file_bytes: bytes) -> str:
    """Uploads a resume to Supabase Storage and returns the path."""
    file_extension = file_name.split(".")[-1]
    unique_file_name = f"{user_id}/{uuid.uuid4()}.{file_extension}"
    
    def _upload():
        try:
            # We are using 'resumes' bucket
            res = supabase.storage.from_("resumes").upload(
                path=unique_file_name,
                file=file_bytes,
                file_options={"content-type": "application/pdf"}
            )
            return unique_file_name
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload resume to storage: {str(e)}")
            
    return await asyncio.to_thread(_upload)
