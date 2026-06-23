from pydantic import BaseModel
from typing import List

class ScoreHistoryItem(BaseModel):
    date: str
    score: int

class SkillPerformanceItem(BaseModel):
    skill: str
    avg_score: float
    count: int

class AnalyticsResponse(BaseModel):
    total_interviews: int
    avg_score: float
    total_duration_minutes: int
    score_history: List[ScoreHistoryItem]
    skill_performance: List[SkillPerformanceItem]
