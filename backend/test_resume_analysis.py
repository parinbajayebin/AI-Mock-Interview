import asyncio
from app.services.ai_service import analyze_resume_text

async def test_analysis():
    sample_text = """
    John Doe
    john.doe@example.com | (123) 456-7890 | linkedin.com/in/johndoe | johndoe.dev
    
    Professional Summary:
    Full Stack Developer with 4 years of experience building scalable web applications.
    Specialized in Python, React, and AWS cloud solutions.
    
    Education:
    Bachelor of Science in Computer Science, Tech University (Graduated 2021)
    
    Skills:
    Python, Django, FastAPI, React, Node.js, AWS (S3, EC2, Lambda), Docker, Git, SQL, Postgres
    
    Experience:
    Software Engineer, Tech Corp (2021 - Present)
    - Developed API backend using FastAPI and Postgres.
    - Improved frontend render times by 30% using React optimizations.
    
    Certifications:
    AWS Certified Solutions Architect - Associate
    """
    
    print("Analyzing sample resume...")
    result = await analyze_resume_text(sample_text)
    print("Analysis Result:")
    import pprint
    pprint.pprint(result)

if __name__ == "__main__":
    asyncio.run(test_analysis())
