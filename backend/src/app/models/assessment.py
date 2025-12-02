from enum import Enum
from datetime import date

from sqlalchemy import Boolean, Date, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.app.db.base import Base


class AssessmentStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    SHORT_ANSWER = "short_answer"
    NUMERIC = "numeric"
    EQUATION = "equation"


class Assessment(Base):
    """A generated quiz for a learning objective."""
    __tablename__ = "assessments"

    objective_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("learning_objectives.id")
    )
    student_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("student_profiles.id")
    )
    status: Mapped[str] = mapped_column(
        String(50), default=AssessmentStatus.NOT_STARTED.value
    )
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    passed_without_hints: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Relationships
    objective: Mapped["LearningObjective"] = relationship()
    student: Mapped["StudentProfile"] = relationship()
    questions: Mapped[list["Question"]] = relationship(
        back_populates="assessment", cascade="all, delete-orphan"
    )


class Question(Base):
    """A question within an assessment."""
    __tablename__ = "questions"

    assessment_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("assessments.id")
    )
    question_type: Mapped[str] = mapped_column(String(50))
    question_text: Mapped[str] = mapped_column(Text)
    options: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)  # For MCQ
    correct_answer: Mapped[str] = mapped_column(Text)
    hint_1: Mapped[str | None] = mapped_column(Text, nullable=True)
    hint_2: Mapped[str | None] = mapped_column(Text, nullable=True)
    order: Mapped[int] = mapped_column(Integer)

    # Relationships
    assessment: Mapped["Assessment"] = relationship(back_populates="questions")
    responses: Mapped[list["Response"]] = relationship(
        back_populates="question", cascade="all, delete-orphan"
    )


class Response(Base):
    """A student's response to a question."""
    __tablename__ = "responses"

    question_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("questions.id")
    )
    student_answer: Mapped[str] = mapped_column(Text)
    is_correct: Mapped[bool] = mapped_column(Boolean)
    hints_used: Mapped[int] = mapped_column(Integer, default=0)
    ai_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    question: Mapped["Question"] = relationship(back_populates="responses")


class MasteryAttempt(Base):
    """Tracks clean passes for threshold-based mastery."""
    __tablename__ = "mastery_attempts"

    student_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("student_profiles.id")
    )
    objective_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("learning_objectives.id")
    )
    assessment_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("assessments.id")
    )
    passed_clean: Mapped[bool] = mapped_column(Boolean)
    attempt_date: Mapped[date] = mapped_column(Date)
