from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.app.db.base import Base


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id"), unique=True
    )
    grade_level: Mapped[int] = mapped_column(Integer)  # 6-12

    # Learning profile
    strengths: Mapped[list[str]] = mapped_column(JSONB, default=list)
    weaknesses: Mapped[list[str]] = mapped_column(JSONB, default=list)
    learning_preferences: Mapped[dict] = mapped_column(JSONB, default=dict)
    accommodations: Mapped[list[str]] = mapped_column(JSONB, default=list)

    # Notes
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="student_profile")
    sessions: Mapped[list["Session"]] = relationship(back_populates="student")
    progress_records: Mapped[list["Progress"]] = relationship(back_populates="student")
