from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.app.auth.dependencies import get_current_student, get_current_teaching_parent
from src.app.db.base import get_db
from src.app.models import User, StudentProfile, Session, Family
from src.app.schemas.dashboard import (
    ParentDashboardResponse,
    StudentDashboardResponse,
    StudentSummary,
    SubjectStats,
)

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


@router.get("/parent", response_model=ParentDashboardResponse)
async def get_parent_dashboard(
    current_user: User = Depends(get_current_teaching_parent),
    db: AsyncSession = Depends(get_db),
) -> ParentDashboardResponse:
    """Get dashboard for teaching parent with all students in family."""
    # Get family with users
    result = await db.execute(
        select(Family)
        .where(Family.id == current_user.family_id)
        .options(selectinload(Family.users))
    )
    family = result.scalar_one_or_none()
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")

    # Get all student profiles in family
    student_users = [u for u in family.users if u.role == "student"]

    students = []
    total_sessions = 0

    for user in student_users:
        # Get student profile
        profile_result = await db.execute(
            select(StudentProfile).where(StudentProfile.user_id == user.id)
        )
        profile = profile_result.scalar_one_or_none()

        if profile:
            # Get session stats
            sessions_result = await db.execute(
                select(Session)
                .where(Session.student_id == profile.id)
                .order_by(Session.created_at.desc())
            )
            sessions = sessions_result.scalars().all()

            student_sessions = len(sessions)
            student_messages = sum(s.message_count or 0 for s in sessions)
            last_active = sessions[0].created_at.isoformat() if sessions else None

            total_sessions += student_sessions

            students.append(StudentSummary(
                id=profile.id,
                name=user.full_name,
                grade_level=profile.grade_level,
                total_sessions=student_sessions,
                total_messages=student_messages,
                last_active=last_active,
            ))

    return ParentDashboardResponse(
        family_name=family.name,
        students=students,
        total_family_sessions=total_sessions,
    )
