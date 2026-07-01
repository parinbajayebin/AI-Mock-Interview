import asyncio
import json
import logging
import random
import httpx
import google.generativeai as genai
from app.core.config import settings

logger = logging.getLogger(__name__)

async def _call_llm_json(prompt: str, system_instruction: str = None) -> dict:
    """
    Unified client to fetch structured JSON data from either Gemini, Groq, or OpenRouter.
    """
    provider = settings.LLM_PROVIDER.lower() if settings.LLM_PROVIDER else "gemini"
    
    # Try to auto-fallback/detect provider if the selected provider key is missing
    if provider == "gemini" and not settings.GEMINI_API_KEY:
        if settings.GROQ_API_KEY:
            provider = "groq"
            logger.info("GEMINI_API_KEY missing. Auto-routing to Groq.")
        elif settings.OPENROUTER_API_KEY:
            provider = "openrouter"
            logger.info("GEMINI_API_KEY missing. Auto-routing to OpenRouter.")
        else:
            raise ValueError("No LLM API keys configured.")
            
    if provider == "gemini":
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not configured.")
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        
        full_content = prompt
        if system_instruction:
            full_content = f"{system_instruction}\n\n{prompt}"
            
        response = await asyncio.wait_for(
            asyncio.to_thread(
                model.generate_content,
                full_content,
                generation_config={"response_mime_type": "application/json"}
            ),
            timeout=25.0
        )
        return json.loads(response.text)
        
    elif provider == "groq":
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY is not configured.")
        
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": settings.GROQ_MODEL,
            "messages": messages,
            "response_format": {"type": "json_object"},
            "temperature": 0.3
        }
        
        async with httpx.AsyncClient() as client:
            res = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=25.0
            )
            res.raise_for_status()
            data = res.json()
            content = data["choices"][0]["message"]["content"]
            return json.loads(content)
            
    elif provider == "openrouter":
        if not settings.OPENROUTER_API_KEY:
            raise ValueError("OPENROUTER_API_KEY is not configured.")
        
        headers = {
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/parinbajayebin/AI-Mock-Interview",
            "X-Title": "AI Mock Interview Platform"
        }
        
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": settings.OPENROUTER_MODEL,
            "messages": messages,
            "response_format": {"type": "json_object"},
            "temperature": 0.3
        }
        
        async with httpx.AsyncClient() as client:
            res = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=25.0
            )
            res.raise_for_status()
            data = res.json()
            content = data["choices"][0]["message"]["content"]
            return json.loads(content)
            
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")

async def analyze_resume_text(raw_text: str) -> dict:
    """
    Parses resume text and returns a structured dictionary:
    {
        "skills": ["Skill1", "Skill2", ...],
        "experience_summary": "...",
        "parsed_metadata": { ... }
    }
    """
    has_keys = settings.GEMINI_API_KEY or settings.GROQ_API_KEY or settings.OPENROUTER_API_KEY
    if not has_keys:
        logger.error("No LLM API keys are configured.")
        return {
            "skills": [],
            "experience_summary": "No LLM API key is configured. Could not generate summary.",
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
        result = await _call_llm_json(
            prompt=f"Please analyze the following resume text and output the requested JSON object:\n\n{raw_text}",
            system_instruction=prompt
        )
        return {
            "skills": result.get("skills", []),
            "experience_summary": result.get("experience_summary", ""),
            "parsed_metadata": result.get("parsed_metadata", {})
        }
    except Exception as e:
        logger.exception("Failed to analyze resume with LLM")
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
    and optional resume text/skills.
    """
    has_keys = settings.GEMINI_API_KEY or settings.GROQ_API_KEY or settings.OPENROUTER_API_KEY
    if not has_keys:
        logger.error("No LLM API keys are configured.")
        return _get_fallback_questions(role, difficulty)

    past_questions_context = ""
    if past_questions:
        past_questions_context = f"""
    CRITICAL CONSTRAINT: YOU MUST NOT repeat or generate questions similar to these past questions:
    - """ + "\n    - ".join(past_questions)

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
        questions = await _call_llm_json(prompt=prompt)
        if isinstance(questions, list) and len(questions) > 0:
            return questions
        # Sometimes models wrap lists in an object, try to extract it if so
        if isinstance(questions, dict):
            for key, val in questions.items():
                if isinstance(val, list) and len(val) > 0:
                    return val
        raise ValueError("Invalid format returned by LLM")
    except Exception as e:
        logger.exception("Failed to generate interview questions with LLM")
        return _get_fallback_questions(role, difficulty)

def _get_fallback_questions(role: str, difficulty: str) -> list[dict]:
    """Fallback questions in case Gemini fails, randomized to avoid repetition."""
    role_lower = role.lower()
    
    coding_pool = [
        {
            "question_text": "Write or describe a function to check if a string contains balanced brackets (parentheses, square brackets, curly braces). What is its time complexity?",
            "expected_skills": ["Algorithms", "Data Structures"],
            "ideal_answer": "Use a stack structure. Traverse the string, push open brackets, and pop matching closing brackets. Time complexity is O(N), Space complexity is O(N)."
        },
        {
            "question_text": "Write an efficient function to find the first non-repeating character in a string. Explain the time and space complexity.",
            "expected_skills": ["Algorithms", "Hash Map"],
            "ideal_answer": "Use a hash map or frequency array to count character occurrences, then loop through the string to find the first character with a count of 1. Time complexity: O(N), Space complexity: O(1) (since alphabet size is constant)."
        },
        {
            "question_text": "Explain the difference between a shallow copy and a deep copy in programming. How do you implement a deep copy?",
            "expected_skills": ["Programming Core", "Memory Management"],
            "ideal_answer": "A shallow copy copies references of nested objects, while a deep copy recursively copies all nested structures. Implementation varies (e.g., recursive cloning, JSON serialization fallback)."
        }
    ]
    
    db_pool = [
        {
            "question_text": "How do you handle database optimizations (e.g. indexing, query restructuring) to reduce latency in a high-traffic production application?",
            "expected_skills": ["Databases", "Performance Tuning"],
            "ideal_answer": "Explain standard techniques like indexing, caching (Redis), query profiling (EXPLAIN), connection pooling, and database replication."
        },
        {
            "question_text": "Explain the differences between SQL (Relational) and NoSQL (Document-based) databases. When would you choose one over the other?",
            "expected_skills": ["Databases", "Architecture"],
            "ideal_answer": "SQL databases are tabular, relational, and ACID-compliant (good for transactions). NoSQL databases are schema-less, highly scalable, and document/key-value based (good for unstructured data or high write volumes)."
        },
        {
            "question_text": "What are database transactions, and what does the ACID acronym stand for? Give a practical example of a transaction.",
            "expected_skills": ["Databases", "ACID Principles"],
            "ideal_answer": "ACID stands for Atomicity, Consistency, Isolation, and Durability. A practical example is a bank transfer: debiting account A and crediting account B must both succeed or both fail."
        }
    ]
    
    architecture_pool = [
        {
            "question_text": "Choose the best approach for managing session state in a horizontally scaled microservices architecture: (A) Sticky Sessions, (B) Distributed Cache (Redis), (C) Client-side JWT, (D) Local Memory replication. Explain your choice.",
            "expected_skills": ["Microservices", "Session Management"],
            "ideal_answer": "Options B (Redis) or C (JWT) are preferred. Explain the scalability bottlenecks of sticky sessions and local memory replication."
        },
        {
            "question_text": "Describe the difference between monolithic architecture and microservices. What are the key operational trade-offs of microservices?",
            "expected_skills": ["System Design", "Microservices"],
            "ideal_answer": "Monoliths are single codebases, easy to test/deploy. Microservices split responsibilities into separate services, improving deploy flexibility but adding network, tracing, and data consistency complexity."
        },
        {
            "question_text": "Explain what a Load Balancer is and describe at least two load balancing algorithms.",
            "expected_skills": ["System Design", "Infrastructure"],
            "ideal_answer": "A Load Balancer distributes traffic across servers. Algorithms include Round Robin, Least Connections, and IP Hash."
        }
    ]
    
    frontend_pool = [
        {
            "question_text": "What is the Virtual DOM in modern UI frameworks (like React), and how does it optimize page rendering performance?",
            "expected_skills": ["Frontend Core", "React"],
            "ideal_answer": "The Virtual DOM is a lightweight memory representation of the real DOM. Frameworks compute diffs (reconciliation) and update only the modified DOM elements, reducing costly reflows."
        },
        {
            "question_text": "Explain the differences between Server-Side Rendering (SSR) and Client-Side Rendering (CSR). When is SSR preferred?",
            "expected_skills": ["Frontend Core", "SSR vs CSR"],
            "ideal_answer": "CSR renders pages in the browser (faster interactions, slower initial load). SSR renders HTML on the server (better SEO, faster initial paint). SSR is preferred for content-heavy or public-facing sites."
        },
        {
            "question_text": "Describe the CSS Box Model. How does setting 'box-sizing: border-box' change its default behavior?",
            "expected_skills": ["CSS", "Box Model"],
            "ideal_answer": "The CSS Box Model consists of content, padding, border, and margin. By default, width/height apply only to the content. 'border-box' includes padding and border within the specified width/height."
        }
    ]
    
    generic_pool = [
        {
            "question_text": f"Explain the core responsibilities of a {difficulty} {role} and how you stay up-to-date with emerging tools and frameworks.",
            "expected_skills": [role],
            "ideal_answer": "A solid response should cover technical execution, mentorship (for seniors), continuous learning, and adaptability."
        },
        {
            "question_text": "Describe a challenging technical problem you solved in your past project. What was your approach, and how did you measure success?",
            "expected_skills": ["Problem Solving", "Architecture"],
            "ideal_answer": "Focus on the STAR method: Situation, Task, Action, and Result. Include quantifiable metrics if possible."
        },
        {
            "question_text": "What is Version Control, and how does your team resolve a merge conflict in a collaborative environment?",
            "expected_skills": ["Git", "Collaboration"],
            "ideal_answer": "Version control tracks code history. Merge conflicts happen when concurrent changes occur on the same lines. Resolve by inspecting diffs, communicating, and staging the merged result."
        }
    ]
    
    selected = []
    
    # Selection logic based on role
    if "front" in role_lower or "react" in role_lower or "ui" in role_lower:
        selected.append(random.choice(frontend_pool))
        selected.append(random.choice(coding_pool))
        selected.append(random.choice(generic_pool))
        remaining = [q for q in (frontend_pool + coding_pool + generic_pool) if q not in selected]
        selected.extend(random.sample(remaining, 2))
    elif "data" in role_lower or "python" in role_lower or "ml" in role_lower or "ai" in role_lower:
        ds_pool = [
            {
                "question_text": "Explain the bias-variance tradeoff in machine learning. How do you address high variance in a model?",
                "expected_skills": ["Machine Learning", "Statistics"],
                "ideal_answer": "Bias is error from erroneous assumptions. Variance is error from sensitivity to training data fluctuations. Address high variance (overfitting) by adding regularization, training with more data, or reducing features."
            },
            {
                "question_text": "What is the difference between supervised and unsupervised learning? Give an example of an algorithm for each.",
                "expected_skills": ["Machine Learning", "Algorithms"],
                "ideal_answer": "Supervised uses labeled data (e.g. Linear Regression, SVM). Unsupervised uses unlabeled data to find hidden patterns (e.g. K-Means, PCA)."
            }
        ]
        selected.append(random.choice(ds_pool))
        selected.append(random.choice(db_pool))
        selected.append(random.choice(generic_pool))
        remaining = [q for q in (ds_pool + db_pool + coding_pool) if q not in selected]
        selected.extend(random.sample(remaining, 2))
    else:
        selected.append(random.choice(coding_pool))
        selected.append(random.choice(db_pool))
        selected.append(random.choice(architecture_pool))
        selected.append(random.choice(generic_pool))
        remaining = [q for q in (coding_pool + db_pool + architecture_pool + generic_pool) if q not in selected]
        selected.append(random.choice(remaining))
        
    while len(selected) < 5:
        selected.append(random.choice(generic_pool))
        
    return selected[:5]

async def evaluate_interview_responses(
    role: str,
    difficulty: str,
    questions_and_responses: list[dict]
) -> dict:
    """
    Evaluates candidate responses against ideal answers using LLM.
    Inputs a list of dicts:
    [
      {
        "question_id": "uuid",
        "question_text": "...",
        "ideal_answer": "...",
        "user_answer": "...",
        "duration_seconds": 120
      }
    ]
    Returns a dict with overall_score, general_feedback, and a list of evaluations.
    """
    has_keys = settings.GEMINI_API_KEY or settings.GROQ_API_KEY or settings.OPENROUTER_API_KEY
    if not has_keys:
        logger.error("No LLM API keys are configured. Returning mock evaluation.")
        return _get_fallback_evaluations(questions_and_responses)

    prompt = f"""
    You are an expert technical interviewer mentoring a candidate.
    Please evaluate the candidate's responses for a {difficulty} {role} position.

    CRITICAL STYLE CONSTRAINT: Speak directly to the candidate using "You" or "Your" (e.g., "You explained this well, but I suggest you..."). Do NOT refer to them in the third person as "the candidate".

    Below is the list of questions, the ideal answer for each, and the candidate's actual answer:
    {json.dumps(questions_and_responses, indent=2)}

    Grade the candidate's answers based on technical accuracy, clarity, and depth.
    
    SPEED & CONCISENESS CONSTRAINTS:
    - Keep general_feedback short (2-3 sentences maximum).
    - Keep the feedback for each individual question concise (2 sentences maximum), focusing on one key strength and one actionable improvement.
    
    Response MUST be a valid JSON object matching this structure EXACTLY:
    {{
      "overall_score": 78,
      "general_feedback": "You showed strong conceptual knowledge, but I recommend structuring your code reviews better...",
      "evaluations": [
        {{
          "question_id": "uuid-from-input",
          "score": 85,
          "feedback": "You did an excellent job explaining MVCC. I suggest mentioning Write-Ahead Logging (WAL) in the future for a complete picture."
        }}
      ]
    }}
    """

    try:
        result = await _call_llm_json(prompt=prompt)
        return result
    except Exception as e:
        logger.exception("Failed to evaluate interview with LLM")
        return _get_fallback_evaluations(questions_and_responses)

def _get_fallback_evaluations(questions_and_responses: list[dict]) -> dict:
    """
    Local heuristic evaluator to generate smart, dynamic fallback feedback
    when Gemini API fails or times out.
    """
    evals = []
    total_score = 0
    
    for q in questions_and_responses:
        user_ans = q.get("user_answer", "").strip().lower()
        skills_str = ", ".join(q.get("expected_skills", ["these skills"]))
        
        # 1. Check if empty or skipped
        is_empty = not user_ans or len(user_ans) < 8
        is_dont_know = any(phrase in user_ans for phrase in [
            "no idea", "don't know", "dont know", "no clue", "skip", "pass", "not sure", "dunno", "na", "n/a"
        ])
        
        if is_empty or is_dont_know:
            score = 15
            feedback = f"You did not attempt this question or indicated you didn't know the answer. I suggest you brush up on {skills_str} fundamentals to build your confidence."
        elif len(user_ans) < 40:
            score = 55
            feedback = f"You gave a very brief answer. While your response touches on the correct direction, I recommend you elaborate more on the technical trade-offs of {skills_str}."
        else:
            score = 80
            feedback = f"You provided a solid explanation for this question. To strengthen it further, I suggest you mention a concrete project example where you applied {skills_str}."
            
        evals.append({
            "question_id": str(q["question_id"]),
            "score": score,
            "feedback": feedback
        })
        total_score += score

    overall = total_score // len(questions_and_responses) if questions_and_responses else 0
    
    # Generate general feedback based on overall score
    if overall < 30:
        general_feedback = "You struggled with most of the questions or skipped them entirely. Focus on learning the core concepts before taking another attempt."
    elif overall < 65:
        general_feedback = "You have a decent foundation, but your answers were too brief. Try to structure your answers with the STAR method and provide details."
    else:
        general_feedback = "You demonstrated a strong understanding of these topics! Work on detailing production architecture tradeoffs to stand out even more."
        
    return {
        "overall_score": overall,
        "general_feedback": f"{general_feedback} (Note: Offline fallback evaluation activated due to API timeout)",
        "evaluations": evals
    }
