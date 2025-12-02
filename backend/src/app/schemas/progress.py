from pydantic import BaseModel, ConfigDict


class ProgressResponse(BaseModel):
    """Schema for progress response."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    student_id: str
    objective_id: str
    mastery_level: str
    session_ids: list[str] = []
    notes: str | None = None


class ProgressUpdate(BaseModel):
    """Schema for updating progress."""
    mastery_level: str | None = None
    notes: str | None = None


class ObjectiveProgressResponse(BaseModel):
    """Progress with objective details."""
    objective_id: str
    objective_title: str
    unit_title: str
    mastery_level: str
    session_count: int


class SubjectProgressResponse(BaseModel):
    """Progress summary for a subject."""
    subject: str
    curriculum_id: str
    curriculum_title: str
    total_objectives: int
    mastered: int
    practicing: int
    introduced: int
    not_started: int
    objectives: list[ObjectiveProgressResponse] = []
