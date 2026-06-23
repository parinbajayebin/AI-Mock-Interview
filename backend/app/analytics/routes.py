from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.routes import get_current_user
from app.models.user import User
from app.repositories.interview_repository import InterviewRepository
from app.schemas.analytics import AnalyticsResponse, ScoreHistoryItem, SkillPerformanceItem

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("", response_model=AnalyticsResponse)
async def get_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Computes aggregated performance metrics and trends for the logged-in user.
    """
    repo = InterviewRepository(db)
    interviews = await repo.get_user_interviews(current_user.id)
    
    # Filter for evaluated interviews
    evaluated = [i for i in interviews if i.status == "Evaluated"]
    
    total_interviews = len(evaluated)
    
    # Calculate overall average score
    all_scores = []
    total_duration_seconds = 0
    
    for i in evaluated:
        for q in i.questions:
            if q.response:
                if q.response.score is not None:
                    # Convert Numeric (Decimal) to float/int
                    all_scores.append(float(q.response.score))
                if q.response.duration_seconds is not None:
                    total_duration_seconds += q.response.duration_seconds
                    
    avg_score = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0.0
    total_duration_minutes = total_duration_seconds // 60
    
    # Compute score history (chronological order)
    score_history = []
    chronological = sorted(evaluated, key=lambda x: x.created_at)
    for i in chronological:
        scores = [float(q.response.score) for q in i.questions if q.response and q.response.score is not None]
        if scores:
            score_history.append(
                ScoreHistoryItem(
                    date=i.created_at.strftime("%b %d"),
                    score=int(sum(scores) / len(scores))
                )
            )
            
    # Compute skill-wise performance
    skill_scores = {}
    for i in evaluated:
        for q in i.questions:
            if q.response and q.response.score is not None:
                score_val = float(q.response.score)
                for skill in q.expected_skills:
                    # Normalize skill name (capitalize first letter, strip whitespace)
                    clean_skill = skill.strip().title()
                    if clean_skill not in skill_scores:
                        skill_scores[clean_skill] = []
                    skill_scores[clean_skill].append(score_val)
                    
    skill_performance = []
    for skill, scores in skill_scores.items():
        skill_performance.append(
            SkillPerformanceItem(
                skill=skill,
                avg_score=round(sum(scores) / len(scores), 1),
                count=len(scores)
            )
        )
        
    # Sort skills by average score desc
    skill_performance.sort(key=lambda x: x.avg_score, reverse=True)
    
    return AnalyticsResponse(
        total_interviews=total_interviews,
        avg_score=avg_score,
        total_duration_minutes=total_duration_minutes,
        score_history=score_history,
        skill_performance=skill_performance
    )
