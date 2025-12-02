from enum import Enum

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.app.db.base import Base


class SessionStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class Session(Base):
    """A learning session between a student and the AI tutor."""
    __tablename__ = "sessions"

    student_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("student_profiles.id")
    )
    subject: Mapped[str] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(50), default=SessionStatus.ACTIVE.value)

    # Session content
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Metrics
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    message_count: Mapped[int] = mapped_column(Integer, default=0)

    # Learning objectives covered
    objectives_addressed: Mapped[list[str]] = mapped_column(JSONB, default=list)

    # Relationships
    student: Mapped["StudentProfile"] = relationship(back_populates="sessions")
    messages: Mapped[list["SessionMessage"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )


class SessionMessage(Base):
    """A single message in a tutoring session."""
    __tablename__ = "session_messages"

    session_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("sessions.id"))
    role: Mapped[str] = mapped_column(String(50))  # "user" or "assistant"
    content: Mapped[str] = mapped_column(Text)

    # Metadata
    tokens_used: Mapped[int | None] = mapped_column(Integer, nullable=True)
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Relationships
    session: Mapped["Session"] = relationship(back_populates="messages")
