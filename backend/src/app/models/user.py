from enum import Enum

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.app.db.base import Base


class UserRole(str, Enum):
    TEACHING_PARENT = "teaching_parent"
    STUDENT = "student"
    FAMILY_MEMBER = "family_member"


class User(Base):
    __tablename__ = "users"

    # Supabase auth user id
    auth_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(50))

    # Family relationship
    family_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("families.id"))
    family: Mapped["Family"] = relationship(back_populates="users")

    # Student profile (if role is student)
    student_profile: Mapped["StudentProfile | None"] = relationship(
        back_populates="user", uselist=False
    )
