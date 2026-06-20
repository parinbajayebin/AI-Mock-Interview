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

async def generate_interview_questions(
    role: str,
    difficulty: str,
    resume_text: str | None = None,
    past_questions: list[str] | None = None
) -> list[dict]:
    """
    Generates 5 tailored technical interview questions based on target role, difficulty,
    and optional resume text/skills. Uses Gemini 3.5 Flash.
    """
    if not settings.GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY is not configured.")
        # Fallback hardcoded questions
        return _get_fallback_questions(role, difficulty)

    past_questions_context = ""
    if past_questions:
        past_questions_context = f"\nDO NOT repeat or generate questions similar to these past questions:\n- " + "\n- ".join(past_questions)

    resume_context = ""
    if resume_text:
        resume_context = f"\nUse the candidate's resume/experience/skills to craft some personalized questions:\nResume Text:\n{resume_text}"

    prompt = f"""
    You are an elite technical interviewer. Generate EXACTLY 5 high-quality, challenging technical questions for a candidate.
    
    Target Role: {role}
    Difficulty: {difficulty}
    {resume_context}
    {past_questions_context}

    To make the interview diverse, engaging, and realistic, mix the following question types:
    1. 1-2 Project/Experience-Specific Questions: Ask questions directly related to a project or experience mentioned in their resume (only if resume text is provided).
    2. 1 Coding/Debugging Question: Provide a small code snippet with a bug, or ask them to write/explain code to solve a specific problem.
    3. 1 Multiple-Choice (MCQ) Scenario Question: Describe a scenario, present 3-4 options (A, B, C, D), and ask them to choose one and justify their choice.
    4. 1-2 Conceptual/Architectural Questions: Drill down into core concepts, performance, microservices, scaling, database optimizations, or caching suitable for the difficulty level.

    Difficulty Constraints:
    - Entry-Level: Focus on syntax, standard libraries, basic data structures, OOP principles, and simple logic.
    - Mid-Level: Focus on systems integration, debugging, database queries/indexing, testing, security, and performance.
    - Senior: Focus on system design, microservices, horizontal/vertical scaling, distributed locks, concurrency, architectural trade-offs, and complex query optimizations.

    Response MUST be a valid JSON array of EXACTLY 5 objects matching the structure below:
    [
      {{
        "question_text": "...",
        "expected_skills": ["SkillA", "SkillB"],
        "ideal_answer": "..."
      }}
    ]
    """

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-3.5-flash')
        
        response = await asyncio.to_thread(
            model.generate_content,
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        
        questions = json.loads(response.text)
        if isinstance(questions, list) and len(questions) > 0:
            return questions
        raise ValueError("Invalid format returned by Gemini")
    except Exception as e:
        logger.exception("Failed to generate interview questions with Gemini")
        return _get_fallback_questions(role, difficulty)

def _get_fallback_questions(role: str, difficulty: str) -> list[dict]:
    """Fallback questions in case Gemini fails."""
    return [
        {
            "question_text": f"Explain the core responsibilities of a {difficulty} {role} and how you stay up-to-date with emerging tools and frameworks.",
            "expected_skills": [role],
            "ideal_answer": "A solid response should cover technical execution, mentorship (for seniors), continuous learning, and adaptability."
        },
        {
            "question_text": "Describe a challenging technical problem you solved in your past project. What was your approach, and how did you measure success?",
            "expected_skills": ["Problem Solving", "Architecture"],
            "ideal_answer": "A structured STAR method answer detailing: Situation, Task, Action, and measurable Results."
        },
        {
            "question_text": "How do you handle database optimization? What tools or techniques do you use to locate slow queries and fix them?",
            "expected_skills": ["Database", "SQL Optimization"],
            "ideal_answer": "Explain plans, indexes (B-Tree, Hash), caching (Redis), partition tables, and avoiding N+1 query problems."
        },
        {
            "question_text": "Choose the best approach for managing state in a distributed microservices environment:\n\nA) Store state locally in the memory of each microservice instance\nB) Use a centralized distributed cache like Redis or Memcached\nC) Save state in cookies on the client's browser\n\nExplain your choice.",
            "expected_skills": ["System Design", "Microservices"],
            "ideal_answer": "Option B is correct because centralized distributed caches are fast, scalable, and independent of specific service instances, preventing session loss when instances auto-scale."
        },
        {
            "question_text": "Write or describe a function to check if a string contains balanced brackets (parentheses, square brackets, curly braces). What is its time complexity?",
            "expected_skills": ["Algorithms", "Data Structures"],
            "ideal_answer": "Use a stack structure. Traverse the string, push open brackets, and pop matching closing brackets. Time complexity is O(N), Space complexity is O(N)."
        }
    ]
