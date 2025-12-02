from pydantic import BaseModel, ConfigDict


class QuestionResponse(BaseModel):
    """Schema for question in assessment (no answers/hints for student)."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    question_type: str
    question_text: str
    options: list[str] | None = None
    order: int


class QuestionWithAnswer(QuestionResponse):
    """Schema for question with answer (for review)."""
    correct_answer: str
    hint_1: str | None = None
    hint_2: str | None = None


class AssessmentResponse(BaseModel):
    """Schema for assessment response."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    objective_id: str
    student_id: str
    status: str
    score: float | None = None
    passed_without_hints: bool
    questions: list[QuestionResponse] = []


class AssessmentWithAnswers(BaseModel):
    """Schema for completed assessment with answers (for review)."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    objective_id: str
    student_id: str
    status: str
    score: float | None = None
    passed_without_hints: bool
    questions: list[QuestionWithAnswer] = []


class GenerateAssessmentRequest(BaseModel):
    """Request to generate an assessment."""
    objective_id: str
    student_id: str


class SubmitAnswerRequest(BaseModel):
    """Request to submit an answer."""
    question_id: str
    answer: str


class SubmitAnswerResponse(BaseModel):
    """Response after submitting an answer."""
    is_correct: bool
    hints_used: int
    hint: str | None = None  # Next hint if wrong
    feedback: str | None = None  # AI feedback for short answers
    show_answer: bool = False  # True if all hints exhausted
    correct_answer: str | None = None  # Only if show_answer is True


class UseHintRequest(BaseModel):
    """Request to use a hint."""
    question_id: str


class UseHintResponse(BaseModel):
    """Response with hint."""
    hint_text: str
    hints_remaining: int


class CompleteAssessmentResponse(BaseModel):
    """Response after completing assessment."""
    score: float
    passed_without_hints: bool
    mastery_updated: bool
    new_mastery_level: str | None = None


class AssessmentListItem(BaseModel):
    """Schema for assessment in list."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    objective_id: str
    objective_title: str
    status: str
    score: float | None = None
    passed_without_hints: bool
    created_at: str


class MasteryAttemptResponse(BaseModel):
    """Schema for mastery attempt."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    assessment_id: str
    passed_clean: bool
    attempt_date: str


class MasteryStatusResponse(BaseModel):
    """Schema for mastery status of an objective."""
    objective_id: str
    current_level: str
    clean_passes: int
    passes_needed: int = 2
    can_achieve_mastery: bool
    attempts: list[MasteryAttemptResponse] = []
