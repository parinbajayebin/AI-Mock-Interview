

import logging
from app.services.ai_service import _call_llm_json
from app.schemas.byok import UserAPIKeys

logger = logging.getLogger(__name__)

_ATS_SYSTEM_PROMPT = """
You are a world-class ATS (Applicant Tracking System) coach, senior technical recruiter,
and company research analyst. You help candidates dramatically improve their chances of
passing ATS screening and impressing human interviewers with company-specific knowledge.

Be honest, direct, and highly specific. Avoid generic advice. Always reference the
actual company products, tech stack, and business model when available.
""".strip()


async def run_ats_analysis(
    resume_text: str,
    job_description: str,
    company_context: str = "",
    user_keys: UserAPIKeys = None
) -> dict:
    """
    Core ATS (Applicant Tracking System) analysis engine.

    Args:
        resume_text: Raw text from the user's uploaded resume.
        job_description: Full job description text (scraped or pasted).
        company_context: Optional scraped company homepage / product info.
        user_keys: Optional BYOK keys for LLM selection.

    Returns a structured dict:
    {
        "match_score": int (0-100),
        "matching_keywords": [str],
        "missing_keywords": [str],
        "bullet_suggestions": [str],
        "ats_checklist": [{"item": str, "passed": bool}],
        "overall_feedback": str,
        "role_detected": str,
        "company_summary": str,
        "interview_questions": [{"question": str, "context": str}],
        "resume_edits": [{"section": str, "original": str, "suggested": str, "reason": str}]
    }
    """
    if not resume_text or len(resume_text.strip()) < 50:
        return _error_result("Resume text is too short or empty. Please upload a valid resume.")

    if not job_description or len(job_description.strip()) < 50:
        return _error_result("Job description is too short or empty.")

    resume_snippet = resume_text[:4000]
    jd_snippet = job_description[:4000]
    company_snippet = company_context[:3000] if company_context else ""

    company_section = ""
    if company_snippet:
        company_section = f"""
--- COMPANY BACKGROUND & PRODUCTS ---
{company_snippet}
"""

    prompt = f"""
You are analyzing a candidate's resume against a specific job description{' and company context' if company_snippet else ''}.

--- RESUME ---
{resume_snippet}

--- JOB DESCRIPTION ---
{jd_snippet}
{company_section}

--- YOUR TASK ---
Perform a comprehensive ATS (Applicant Tracking System) analysis. Respond with a single valid JSON object
matching EXACTLY this structure (no markdown, no extra text):

{{
  "match_score": <integer 0-100 representing overall ATS compatibility>,
  "role_detected": "<job title/role inferred from job description>",
  "company_summary": "<2-3 sentence summary of the company, their key products, and tech stack — only if company context was provided, else empty string>",
  "mismatch_warning": "<If company context is provided, cross-reference it with the Job Description. If they refer to different/mismatched companies (e.g. JD is for Google but company homepage is for S&P Global), return a clear warning message starting with 'Warning:'. If they refer to the same company or no company context is provided, return an empty string>",
  "overall_feedback": "<2-3 sentence personalized summary of the candidate's fit and top priority improvement>",
  "matching_keywords": ["<keyword from JD present in the resume>"],
  "missing_keywords": ["<important keyword/skill from JD absent from resume>"],
  "bullet_suggestions": [
    "<specific, rewritten resume bullet point the candidate should add or improve, tailored to this JD and company>"
  ],
  "ats_checklist": [
    {{"item": "Contains measurable achievements (e.g. 'reduced load time by 40%')", "passed": <true/false>}},
    {{"item": "Job title in resume aligns with target role", "passed": <true/false>}},
    {{"item": "Key technical skills from JD are present in resume", "passed": <true/false>}},
    {{"item": "Resume uses standard section headers (Experience, Education, Skills)", "passed": <true/false>}},
    {{"item": "No tables, columns, or graphics that confuse ATS parsers", "passed": <true/false>}},
    {{"item": "Action verbs used at start of bullet points (Led, Built, Optimized, etc.)", "passed": <true/false>}},
    {{"item": "Certifications or courses relevant to the role are listed", "passed": <true/false>}}
  ],
  "interview_questions": [
    {{
      "question": "<A specific, company-aware interview question. If company products are known, reference them directly. E.g. if the company has a payment API and the role is Cloud Engineer, ask about scaling that payment service on cloud.>",
      "context": "<1 sentence explaining why this question is relevant to this company/role>"
    }}
  ],
  "resume_edits": [
    {{
      "section": "<Which resume section to modify: e.g. 'Skills', 'Work Experience - Job Title', 'Summary', 'Projects'>",
      "original": "<The existing content or placeholder if it's a missing section>",
      "suggested": "<Exact replacement text or new bullet point to add>",
      "reason": "<Why this edit improves ATS score or company fit>"
    }}
  ]
}}

Rules:
- match_score: 0-40 poor, 41-65 moderate, 66-85 good, 86-100 excellent.
- missing_keywords: top 8-12 most impactful gaps.
- matching_keywords: up to 15 matched keywords.
- bullet_suggestions: exactly 3 tailored bullet points.
- interview_questions: exactly 5 questions. {'If company context is available, AT LEAST 3 must reference specific company products, services, or tech stack directly.' if company_snippet else 'Make them role-specific and challenging.'}
- resume_edits: exactly 4 specific, actionable edits with section, original text, suggested replacement, and reason.
- Be highly specific and role+company-aware. Do NOT give generic advice.
"""

    try:
        result = await _call_llm_json(
            prompt=prompt,
            system_instruction=_ATS_SYSTEM_PROMPT,
            user_keys=user_keys
        )

        return {
            "match_score": _clamp(result.get("match_score", 0), 0, 100),
            "role_detected": result.get("role_detected", "Unknown Role"),
            "company_summary": result.get("company_summary", ""),
            "mismatch_warning": result.get("mismatch_warning", ""),
            "overall_feedback": result.get("overall_feedback", ""),
            "matching_keywords": result.get("matching_keywords", [])[:20],
            "missing_keywords": result.get("missing_keywords", [])[:15],
            "bullet_suggestions": result.get("bullet_suggestions", [])[:5],
            "ats_checklist": _normalize_checklist(result.get("ats_checklist", [])),
            "interview_questions": _normalize_questions(result.get("interview_questions", [])),
            "resume_edits": _normalize_edits(result.get("resume_edits", [])),
            "error": None
        }

    except Exception as e:
        logger.exception("[ATS] LLM analysis failed")
        return _error_result(f"ATS (Applicant Tracking System) analysis failed: {str(e)}")


def _clamp(value, min_val, max_val) -> int:
    try:
        return max(min_val, min(max_val, int(value)))
    except (TypeError, ValueError):
        return 0


def _normalize_checklist(raw: list) -> list:
    result = []
    for item in raw:
        if isinstance(item, dict) and "item" in item:
            result.append({
                "item": str(item.get("item", "")),
                "passed": bool(item.get("passed", False))
            })
    return result


def _normalize_questions(raw: list) -> list:
    result = []
    for item in raw:
        if isinstance(item, dict) and "question" in item:
            result.append({
                "question": str(item.get("question", "")),
                "context": str(item.get("context", ""))
            })
    return result


def _normalize_edits(raw: list) -> list:
    result = []
    for item in raw:
        if isinstance(item, dict) and "section" in item:
            result.append({
                "section": str(item.get("section", "")),
                "original": str(item.get("original", "")),
                "suggested": str(item.get("suggested", "")),
                "reason": str(item.get("reason", ""))
            })
    return result


def _error_result(message: str) -> dict:
    return {
        "match_score": 0,
        "role_detected": "",
        "company_summary": "",
        "mismatch_warning": "",
        "overall_feedback": "",
        "matching_keywords": [],
        "missing_keywords": [],
        "bullet_suggestions": [],
        "ats_checklist": [],
        "interview_questions": [],
        "resume_edits": [],
        "error": message
    }
