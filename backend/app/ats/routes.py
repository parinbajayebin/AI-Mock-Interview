"""
backend/app/ats/routes.py
Author: parinbajayebin

ATS (Applicant Tracking System) & Job Targeting API Routes — Tasks A.4 and A.5

Endpoints:
  POST /api/ats/scrape-job      — Scrape a specific job posting URL
  POST /api/ats/scrape-company  — Scrape company homepage for background context
  POST /api/ats/analyze         — Run full ATS (Applicant Tracking System) gap analysis
"""

import uuid
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_byok_keys
from app.auth.routes import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.models.ats_history import ATSHistory
from app.schemas.byok import UserAPIKeys
from app.services.scraper import scrape_job_description, scrape_company_homepage
from app.services.ats import run_ats_analysis

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ats", tags=["ATS (Applicant Tracking System) & Job Targeting"])


# ── Request / Response Schemas ──────────────────────────────────────────────

class ScrapeJobRequest(BaseModel):
    url: str


class ScrapeCompanyRequest(BaseModel):
    url: str  # Company homepage URL (e.g. https://razorpay.com)


class AnalyzeRequest(BaseModel):
    resume_id: uuid.UUID
    job_description: str        # Raw JD text (pasted or pre-scraped)
    company_context: str = ""   # Optional: scraped company background text
    job_url: Optional[str] = None
    company_name: Optional[str] = None


# ── Endpoints ────────────────────────────────────────────────────────────────

def _require_premium(user: User):
    """Helper that raises 403 if user is not premium."""
    if not user.is_premium:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Job Targeting is a Premium feature. Please upgrade your plan."
        )


@router.post("/scrape-job")
async def scrape_job_page(
    body: ScrapeJobRequest,
    current_user: User = Depends(get_current_user),
):
    """
    [Premium] Scrapes a specific job posting URL and returns clean job description text.
    Supports Lever, Greenhouse, Workday, LinkedIn, and direct company career pages.
    """
    _require_premium(current_user)

    result = await scrape_job_description(body.url)
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=result["error"]
        )

    return {
        "url": result["url"],
        "text": result["text"],
        "char_count": result["char_count"]
    }


@router.post("/scrape-company")
async def scrape_company_page(
    body: ScrapeCompanyRequest,
    current_user: User = Depends(get_current_user),
):
    """
    [Premium] Scrapes a company's homepage and sub-pages (/about, /products, /platform)
    to extract background context: products, tech stack, mission, and business model.
    This context is used to generate company-aware interview questions.
    """
    _require_premium(current_user)

    result = await scrape_company_homepage(body.url)
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=result["error"]
        )

    return {
        "url": result["url"],
        "text": result["text"],
        "char_count": result["char_count"]
    }


@router.post("/analyze")
async def analyze_ats_match(
    body: AnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    user_keys: UserAPIKeys = Depends(get_byok_keys)
):
    """
    [Premium] Runs full ATS (Applicant Tracking System) gap analysis comparing the
    user's selected resume against a job description, with optional company context.

    Returns:
    - Match score (0-100)
    - Matching / missing keywords
    - Tailored resume bullet suggestions
    - ATS formatting checklist
    - Company-aware interview questions (references actual products if company context provided)
    - Specific resume edit recommendations per section
    """
    _require_premium(current_user)

    # Fetch and authorize the selected resume
    stmt = select(Resume).where(
        Resume.id == body.resume_id,
        Resume.user_id == current_user.id
    )
    result = await db.execute(stmt)
    resume = result.scalar_one_or_none()

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or does not belong to you."
        )

    if not resume.raw_text or len(resume.raw_text.strip()) < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The selected resume has no parseable text. Please re-upload it."
        )

    logger.info(
        f"[ATS] Analyzing resume={body.resume_id} for user={current_user.id} "
        f"— JD: {len(body.job_description)} chars, "
        f"Company context: {len(body.company_context)} chars"
    )

    analysis = await run_ats_analysis(
        resume_text=resume.raw_text,
        job_description=body.job_description,
        company_context=body.company_context,
        user_keys=user_keys
    )

    if analysis.get("error"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=analysis["error"]
        )

    # Save to history
    try:
        # Deduce company name from role if not explicitly provided
        deduced_company = body.company_name
        if not deduced_company and analysis.get("role_detected") and " at " in analysis["role_detected"]:
            deduced_company = analysis["role_detected"].split(" at ")[-1].strip()

        history_record = ATSHistory(
            user_id=current_user.id,
            resume_id=body.resume_id,
            job_url=body.job_url,
            company_name=deduced_company,
            job_description=body.job_description,
            company_context=body.company_context,
            match_score=analysis.get("match_score"),
            role_detected=analysis.get("role_detected"),
            overall_feedback=analysis.get("overall_feedback"),
            analysis_result=analysis
        )
        db.add(history_record)
        await db.commit()
    except Exception as db_err:
        logger.error(f"[ATS] Failed to save history: {db_err}")
        await db.rollback()

    return analysis


@router.get("/history")
async def get_ats_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    [Premium] Retrieves all ATS analysis records taken by this premium user.
    """
    _require_premium(current_user)

    stmt = (
        select(ATSHistory)
        .options(selectinload(ATSHistory.resume))
        .where(ATSHistory.user_id == current_user.id)
        .order_by(ATSHistory.created_at.desc())
    )
    result = await db.execute(stmt)
    records = result.scalars().all()

    res = []
    for r in records:
      res.append({
          "id": str(r.id),
          "resume_id": str(r.resume_id),
          "resume_name": r.resume.file_name if r.resume else "Unknown Resume",
          "job_url": r.job_url,
          "company_name": r.company_name,
          "job_description": r.job_description,
          "company_context": r.company_context,
          "match_score": r.match_score,
          "role_detected": r.role_detected,
          "overall_feedback": r.overall_feedback,
          "analysis_result": r.analysis_result,
          "created_at": r.created_at.isoformat()
      })
    return res
