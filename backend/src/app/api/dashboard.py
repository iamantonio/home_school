from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.app.auth.dependencies import get_current_student
from src.app.db.base import get_db
from src.app.models import User, StudentProfile, Session
from src.app.schemas.dashboard import StudentDashboardResponse, SubjectStats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


async def get_student_profile(
    current_user: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
) -> StudentProfile:
    """Get the student profile for the current user."""
    result = await db.execute(
        select(StudentProfile)
        .where(StudentProfile.user_id == current_user.id)
        .options(selectinload(StudentProfile.user))
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found",
        )
    return profile


@router.get("/student", response_model=StudentDashboardResponse)
async def get_student_dashboard(
    student: StudentProfile = Depends(get_student_profile),
    db: AsyncSession = Depends(get_db),
) -> StudentDashboardResponse:
    """Get dashboard stats for the current student."""
    # Get all sessions
    result = await db.execute(
        select(Session)
        .where(Session.student_id == student.id)
        .order_by(Session.created_at.desc())
    )
    sessions = result.scalars().all()

    # Calculate stats by subject
    subject_data: dict[str, dict] = {}
    for session in sessions:
        if session.subject not in subject_data:
            subject_data[session.subject] = {
                "session_count": 0,
                "total_messages": 0,
                "last_session_date": None,
            }
        subject_data[session.subject]["session_count"] += 1
        subject_data[session.subject]["total_messages"] += session.message_count or 0
        if subject_data[session.subject]["last_session_date"] is None:
            subject_data[session.subject]["last_session_date"] = session.created_at.isoformat()

    subjects = [
        SubjectStats(
            subject=subj,
            session_count=data["session_count"],
            total_messages=data["total_messages"],
            last_session_date=data["last_session_date"],
        )
        for subj, data in subject_data.items()
    ]

    # Recent activity (last 5 sessions)
    recent = [
        {
            "id": s.id,
            "subject": s.subject,
            "message_count": s.message_count,
            "date": s.created_at.isoformat(),
        }
        for s in sessions[:5]
    ]

    return StudentDashboardResponse(
        total_sessions=len(sessions),
        total_messages=sum(s.message_count or 0 for s in sessions),
        subjects=subjects,
        recent_activity=recent,
    )
