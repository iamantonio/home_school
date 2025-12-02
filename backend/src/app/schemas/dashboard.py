from pydantic import BaseModel


class SubjectStats(BaseModel):
    """Stats for a single subject."""
    subject: str
    session_count: int
    total_messages: int
    last_session_date: str | None


class StudentDashboardResponse(BaseModel):
    """Dashboard data for a student."""
    total_sessions: int
    total_messages: int
    subjects: list[SubjectStats]
    recent_activity: list[dict]
