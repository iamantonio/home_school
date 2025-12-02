from enum import Enum

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.app.db.base import Base


class MasteryLevel(str, Enum):
    NOT_STARTED = "not_started"
    INTRODUCED = "introduced"
    PRACTICING = "practicing"
    MASTERED = "mastered"


class Progress(Base):
    """Tracks a student's progress on a specific learning objective."""
    __tablename__ = "progress"

    student_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("student_profiles.id")
    )
    objective_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("learning_objectives.id")
    )

    mastery_level: Mapped[str] = mapped_column(
        String(50), default=MasteryLevel.NOT_STARTED.value
    )

    # Evidence
    session_ids: Mapped[list[str]] = mapped_column(JSONB, default=list)
    assessment_ids: Mapped[list[str]] = mapped_column(JSONB, default=list)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    student: Mapped["StudentProfile"] = relationship(back_populates="progress_records")
    objective: Mapped["LearningObjective"] = relationship(back_populates="progress_records")


class Alert(Base):
    """System-generated alerts for parents."""
    __tablename__ = "alerts"

    family_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("families.id"))
    student_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("student_profiles.id"), nullable=True
    )

    alert_type: Mapped[str] = mapped_column(String(100))  # struggle, milestone, gap, review_needed
    title: Mapped[str] = mapped_column(String(255))
    message: Mapped[str] = mapped_column(Text)

    # Status
    read: Mapped[bool] = mapped_column(default=False)
    dismissed: Mapped[bool] = mapped_column(default=False)

    # Metadata
    metadata: Mapped[dict] = mapped_column(JSONB, default=dict)
