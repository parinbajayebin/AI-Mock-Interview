import asyncio
import sys
from dotenv import load_dotenv
load_dotenv(dotenv_path="../.env")

from app.services.ai_service import generate_interview_questions

async def main():
    print("Testing generate_interview_questions service...")
    role = "Backend Engineer"
    difficulty = "Mid-level"
    resume_text = "Jane Doe. Web Developer with 3 years of experience. Built REST APIs using Python, FastAPI, and PostgreSQL. Familiar with React, Docker, and Redis."
    
    questions = await generate_interview_questions(
        role=role,
        difficulty=difficulty,
        resume_text=resume_text
    )
    
    print(f"Generated {len(questions)} questions:")
    for idx, q in enumerate(questions, 1):
        print(f"\n[{idx}] {q['question_text']}")
        print(f"Skills: {q['expected_skills']}")
        print(f"Ideal Answer Outline: {q['ideal_answer']}")

if __name__ == "__main__":
    asyncio.run(main())
