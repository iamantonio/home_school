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


class StudentSummary(BaseModel):
    """Summary of a student's activity."""
    id: str
    name: str
    grade_level: int
    total_sessions: int
    total_messages: int
    last_active: str | None


class ParentDashboardResponse(BaseModel):
    """Dashboard data for a teaching parent."""
    family_name: str
    students: list[StudentSummary]
    total_family_sessions: int
