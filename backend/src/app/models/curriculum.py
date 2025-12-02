from enum import Enum

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.app.db.base import Base


class Subject(str, Enum):
    MATH = "math"
    ENGLISH = "english"
    SCIENCE = "science"
    SOCIAL_STUDIES = "social_studies"
    FOREIGN_LANGUAGE = "foreign_language"
    ART = "art"
    MUSIC = "music"
    PHYSICAL_EDUCATION = "physical_education"
    COMPUTER_SCIENCE = "computer_science"
    OTHER = "other"


class Curriculum(Base):
    """A year-long curriculum plan for a student in a subject."""
    __tablename__ = "curricula"

    student_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("student_profiles.id")
    )
    subject: Mapped[str] = mapped_column(String(100))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    grade_level: Mapped[int] = mapped_column(Integer)

    # Curriculum structure
    standards: Mapped[list[str]] = mapped_column(JSONB, default=list)  # Optional standard alignment

    # Relationships
    units: Mapped[list["Unit"]] = relationship(back_populates="curriculum", cascade="all, delete-orphan")


class Unit(Base):
    """A unit within a curriculum (e.g., 'Linear Equations')."""
    __tablename__ = "units"

    curriculum_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("curricula.id")
    )
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    order: Mapped[int] = mapped_column(Integer)
    estimated_hours: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Relationships
    curriculum: Mapped["Curriculum"] = relationship(back_populates="units")
    learning_objectives: Mapped[list["LearningObjective"]] = relationship(
        back_populates="unit", cascade="all, delete-orphan"
    )


class LearningObjective(Base):
    """A specific learning objective within a unit."""
    __tablename__ = "learning_objectives"

    unit_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("units.id"))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    order: Mapped[int] = mapped_column(Integer)

    # Standard alignment
    standard_codes: Mapped[list[str]] = mapped_column(JSONB, default=list)

    # Relationships
    unit: Mapped["Unit"] = relationship(back_populates="learning_objectives")
    progress_records: Mapped[list["Progress"]] = relationship(back_populates="objective")
