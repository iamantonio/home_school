from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.auth.dependencies import get_current_teaching_parent
from src.app.db.base import get_db
from src.app.models import User, Alert, StudentProfile
from src.app.schemas.alerts import AlertResponse, AlertsListResponse

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=AlertsListResponse)
async def list_alerts(
    current_user: User = Depends(get_current_teaching_parent),
    db: AsyncSession = Depends(get_db),
) -> AlertsListResponse:
    """Get all alerts for the family."""
    result = await db.execute(
        select(Alert)
        .where(Alert.family_id == current_user.family_id)
        .where(Alert.dismissed == False)  # noqa: E712
        .order_by(Alert.created_at.desc())
    )
    alerts = result.scalars().all()

    alert_responses = []
    for alert in alerts:
        student_name = None
        if alert.student_id:
            profile_result = await db.execute(
                select(StudentProfile)
                .where(StudentProfile.id == alert.student_id)
            )
            profile = profile_result.scalar_one_or_none()
            if profile:
                user_result = await db.execute(
                    select(User).where(User.id == profile.user_id)
                )
                user = user_result.scalar_one_or_none()
                if user:
                    student_name = user.full_name

        alert_responses.append(AlertResponse(
            id=alert.id,
            alert_type=alert.alert_type,
            title=alert.title,
            message=alert.message,
            read=alert.read,
            created_at=alert.created_at.isoformat(),
            student_name=student_name,
        ))

    unread_count = sum(1 for a in alerts if not a.read)

    return AlertsListResponse(alerts=alert_responses, unread_count=unread_count)


@router.post("/{alert_id}/read")
async def mark_read(
    alert_id: str,
    current_user: User = Depends(get_current_teaching_parent),
    db: AsyncSession = Depends(get_db),
):
    """Mark an alert as read."""
    result = await db.execute(
        select(Alert)
        .where(Alert.id == alert_id)
        .where(Alert.family_id == current_user.family_id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.read = True
    await db.commit()
    return {"status": "ok"}


@router.post("/{alert_id}/dismiss")
async def dismiss_alert(
    alert_id: str,
    current_user: User = Depends(get_current_teaching_parent),
    db: AsyncSession = Depends(get_db),
):
    """Dismiss an alert."""
    result = await db.execute(
        select(Alert)
        .where(Alert.id == alert_id)
        .where(Alert.family_id == current_user.family_id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.dismissed = True
    await db.commit()
    return {"status": "ok"}
