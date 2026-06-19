import asyncio
import json
import logging
import google.generativeai as genai
from app.core.config import settings

logger = logging.getLogger(__name__)

async def analyze_resume_text(raw_text: str) -> dict:
    """
    Parses resume text using Gemini 3.5 Flash and returns a structured dictionary:
    {
        "skills": ["Skill1", "Skill2", ...],
        "experience_summary": "...",
        "parsed_metadata": { ... }
    }
    """
    if not settings.GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY is not configured.")
        return {
            "skills": [],
            "experience_summary": "Gemini API key is not configured. Could not generate summary.",
            "parsed_metadata": {}
        }

    prompt = """
    You are an expert Applicant Tracking System (ATS) and resume parser.
    Your task is to analyze the provided resume text and extract the following information:
    1. A list of technical and professional skills (as a list of strings).
    2. A brief, professional experience summary (string, max 3-4 sentences).
    3. Additional structured metadata, including:
       - contact_info (email, phone, linkedin, website - if found)
       - education (list of dicts with school, degree, field_of_study, graduation_year)
       - experience_years (estimated number of years of professional experience, float or int)
       - certifications (list of strings)

    Response MUST be a valid JSON object matching this structure EXACTLY (do not include markdown wrapping other than valid JSON):
    {
      "skills": ["Python", "FastAPI", "React"],
      "experience_summary": "Experienced software engineer with a focus on web development...",
      "parsed_metadata": {
        "contact_info": {
          "email": "candidate@example.com",
          "phone": "123-456-7890",
          "linkedin": "linkedin.com/in/candidate",
          "website": "candidate.dev"
        },
        "education": [
          {"school": "State University", "degree": "Bachelor of Science", "field_of_study": "Computer Science", "graduation_year": "2022"}
        ],
        "experience_years": 3.5,
        "certifications": ["AWS Certified Cloud Practitioner"]
      }
    }
    """

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-3.5-flash')
        
        response = await asyncio.to_thread(
            model.generate_content,
            f"{prompt}\n\nResume Text:\n{raw_text}",
            generation_config={"response_mime_type": "application/json"}
        )
        
        result = json.loads(response.text)
        return {
            "skills": result.get("skills", []),
            "experience_summary": result.get("experience_summary", ""),
            "parsed_metadata": result.get("parsed_metadata", {})
        }
    except Exception as e:
        logger.exception("Failed to analyze resume with Gemini")
        # Return fallback values so the application does not crash
        return {
            "skills": [],
            "experience_summary": f"Failed to parse resume with AI. Error: {str(e)}",
            "parsed_metadata": {}
        }
