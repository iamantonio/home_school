from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.app.auth.dependencies import get_current_student
from src.app.db.base import get_db
from src.app.models import User, StudentProfile, Session
from src.app.schemas.tutor import (
    ChatMessage,
    ChatResponse,
    EndSessionResponse,
    MessageResponse,
    SessionDetailResponse,
    SessionResponse,
)
from src.app.services.tutor import TutorService

router = APIRouter(prefix="/tutor", tags=["tutor"])


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


@router.post("/chat", response_model=ChatResponse)
async def chat(
    data: ChatMessage,
    student: StudentProfile = Depends(get_student_profile),
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:
    """Send a message to the AI tutor."""
    service = TutorService(db)
    session = await service.get_or_create_session(student.id, data.subject)
    response = await service.chat(session, student, data.message)

    return ChatResponse(session_id=session.id, response=response)


@router.post("/chat/stream")
async def chat_stream(
    data: ChatMessage,
    student: StudentProfile = Depends(get_student_profile),
    db: AsyncSession = Depends(get_db),
):
    """Send a message and stream the response."""
    service = TutorService(db)
    session = await service.get_or_create_session(student.id, data.subject)

    async def generate():
        async for chunk in service.stream_chat(session, student, data.message):
            yield chunk
        await db.commit()

    return StreamingResponse(generate(), media_type="text/plain")


@router.get("/sessions", response_model=list[SessionResponse])
async def list_sessions(
    student: StudentProfile = Depends(get_student_profile),
    db: AsyncSession = Depends(get_db),
) -> list[SessionResponse]:
    """List all sessions for the current student."""
    result = await db.execute(
        select(Session)
        .where(Session.student_id == student.id)
        .order_by(Session.created_at.desc())
    )
    return result.scalars().all()


@router.post("/sessions/{session_id}/end", response_model=EndSessionResponse)
async def end_session(
    session_id: str,
    student: StudentProfile = Depends(get_student_profile),
    db: AsyncSession = Depends(get_db),
) -> EndSessionResponse:
    """End a tutoring session."""
    service = TutorService(db)
    session = await service.get_session_with_messages(session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.student_id != student.id:
        raise HTTPException(status_code=403, detail="Not your session")

    result = await service.end_session(session)
    return EndSessionResponse(**result)


@router.get("/sessions/{session_id}", response_model=SessionDetailResponse)
async def get_session(
    session_id: str,
    student: StudentProfile = Depends(get_student_profile),
    db: AsyncSession = Depends(get_db),
) -> SessionDetailResponse:
    """Get a session with all messages."""
    result = await db.execute(
        select(Session)
        .where(Session.id == session_id)
        .where(Session.student_id == student.id)
        .options(selectinload(Session.messages))
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionDetailResponse(
        id=session.id,
        subject=session.subject,
        status=session.status,
        message_count=session.message_count,
        summary=session.summary,
        created_at=session.created_at.isoformat(),
        messages=[
            MessageResponse(
                id=m.id,
                role=m.role,
                content=m.content,
                created_at=m.created_at.isoformat(),
            )
            for m in sorted(session.messages, key=lambda x: x.created_at)
        ],
    )
