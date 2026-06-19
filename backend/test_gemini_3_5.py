import asyncio
import google.generativeai as genai
from app.core.config import settings

async def test_gemini():
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-3.5-flash')
    
    try:
        response = await asyncio.to_thread(
            model.generate_content,
            "Say hello and introduce yourself in one sentence.",
            generation_config={"response_mime_type": "text/plain"}
        )
        print("Response:", response.text)
    except Exception as e:
        print("Error calling Gemini:", str(e))

if __name__ == "__main__":
    asyncio.run(test_gemini())
