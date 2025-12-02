from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.models import Alert, StudentProfile, Session, User


class AlertService:
    """Service for generating and managing alerts."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_alert(
        self,
        family_id: str,
        alert_type: str,
        title: str,
        message: str,
        student_id: str | None = None,
        metadata: dict | None = None,
    ) -> Alert:
        """Create a new alert."""
        alert = Alert(
            family_id=family_id,
            student_id=student_id,
            alert_type=alert_type,
            title=title,
            message=message,
            alert_metadata=metadata or {},
        )
        self.db.add(alert)
        await self.db.flush()
        return alert

    async def check_inactivity(
        self,
        student: StudentProfile,
        family_id: str,
        days_threshold: int = 7,
    ) -> Alert | None:
        """Create alert if student hasn't been active recently."""
        cutoff = datetime.now(timezone.utc) - timedelta(days=days_threshold)

        result = await self.db.execute(
            select(Session)
            .where(Session.student_id == student.id)
            .where(Session.created_at > cutoff)
        )
        recent_sessions = result.scalars().all()

        if len(recent_sessions) == 0:
            # Get student name
            user_result = await self.db.execute(
                select(User).where(User.id == student.user_id)
            )
            user = user_result.scalar_one_or_none()
            name = user.full_name if user else "Student"

            return await self.create_alert(
                family_id=family_id,
                student_id=student.id,
                alert_type="inactivity",
                title=f"{name} hasn't studied recently",
                message=f"{name} hasn't had any learning sessions in the past {days_threshold} days.",
            )
        return None

    async def celebrate_milestone(
        self,
        student: StudentProfile,
        family_id: str,
        milestone_type: str,
        count: int,
    ) -> Alert:
        """Create celebration alert for a milestone."""
        user_result = await self.db.execute(
            select(User).where(User.id == student.user_id)
        )
        user = user_result.scalar_one_or_none()
        name = user.full_name if user else "Student"

        milestones = {
            "sessions": f"{name} completed {count} learning sessions!",
            "messages": f"{name} has exchanged {count} messages with their tutor!",
        }

        return await self.create_alert(
            family_id=family_id,
            student_id=student.id,
            alert_type="milestone",
            title="Milestone reached!",
            message=milestones.get(milestone_type, f"{name} reached a new milestone!"),
            metadata={"milestone_type": milestone_type, "count": count},
        )
