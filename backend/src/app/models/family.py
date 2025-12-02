from enum import Enum

from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.app.db.base import Base


class SubscriptionStatus(str, Enum):
    TRIAL = "trial"
    ACTIVE = "active"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class Family(Base):
    __tablename__ = "families"

    name: Mapped[str] = mapped_column(String(255))
    subscription_status: Mapped[str] = mapped_column(
        String(50), default=SubscriptionStatus.TRIAL.value
    )
    trial_ends_at: Mapped[str | None] = mapped_column(String(50), nullable=True)
    settings: Mapped[dict] = mapped_column(JSONB, default=dict)

    # Relationships
    users: Mapped[list["User"]] = relationship(back_populates="family")
