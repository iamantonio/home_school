from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.app.ai.client import get_completion, get_streaming_completion, UTILITY_MODEL
from src.app.ai.prompts import (
    TUTOR_SYSTEM_PROMPT,
    SUMMARIZE_SESSION_PROMPT,
)
from src.app.models import Session, SessionMessage, SessionStatus, StudentProfile
from src.app.services.curriculum import CurriculumService


class TutorService:
    """Service for AI tutoring sessions."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_session(
        self,
        student_id: str,
        subject: str,
    ) -> Session:
        """Get an active session or create a new one."""
        # Look for existing active session
        result = await self.db.execute(
            select(Session)
            .where(Session.student_id == student_id)
            .where(Session.subject == subject)
            .where(Session.status == SessionStatus.ACTIVE.value)
            .order_by(Session.created_at.desc())
        )
        session = result.scalar_one_or_none()

        if session is None:
            session = Session(
                student_id=student_id,
                subject=subject,
                status=SessionStatus.ACTIVE.value,
            )
            self.db.add(session)
            await self.db.flush()

        return session

    async def get_session_with_messages(self, session_id: str) -> Session | None:
        """Get a session with all its messages."""
        result = await self.db.execute(
            select(Session)
            .where(Session.id == session_id)
            .options(selectinload(Session.messages))
        )
        return result.scalar_one_or_none()

    async def build_system_prompt(
        self,
        student: StudentProfile,
        subject: str,
    ) -> str:
        """Build the system prompt for the tutor."""
        # Get current objectives from curriculum
        curriculum_service = CurriculumService(self.db)
        objectives = await curriculum_service.get_current_objectives(
            student.id, subject, limit=5
        )

        if objectives:
            objectives_text = "\n".join([
                f"- {obj.title}" + (f": {obj.description}" if obj.description else "")
                for obj in objectives
            ])
        else:
            objectives_text = f"General learning in {subject}"

        return TUTOR_SYSTEM_PROMPT.format(
            grade_level=student.grade_level,
            subject=subject,
            student_name=student.user.full_name if student.user else "Student",
            learning_preferences=", ".join(student.learning_preferences.get("styles", ["visual"])),
            strengths=", ".join(student.strengths) if student.strengths else "Not yet identified",
            weaknesses=", ".join(student.weaknesses) if student.weaknesses else "Not yet identified",
            current_objectives=objectives_text,
        )

    async def chat(
        self,
        session: Session,
        student: StudentProfile,
        user_message: str,
    ) -> str:
        """Process a chat message and return the tutor's response."""
        # Save user message
        user_msg = SessionMessage(
            session_id=session.id,
            role="user",
            content=user_message,
        )
        self.db.add(user_msg)

        # Build message history
        messages = [
            {"role": "system", "content": await self.build_system_prompt(student, session.subject)}
        ]

        # Add previous messages
        result = await self.db.execute(
            select(SessionMessage)
            .where(SessionMessage.session_id == session.id)
            .order_by(SessionMessage.created_at)
        )
        for msg in result.scalars():
            messages.append({"role": msg.role, "content": msg.content})

        # Get AI response
        response = await get_completion(messages)

        # Save assistant message
        assistant_msg = SessionMessage(
            session_id=session.id,
            role="assistant",
            content=response,
        )
        self.db.add(assistant_msg)

        # Update session metrics
        session.message_count = (session.message_count or 0) + 2

        return response

    async def stream_chat(
        self,
        session: Session,
        student: StudentProfile,
        user_message: str,
    ):
        """Stream a chat response from the tutor."""
        # Save user message
        user_msg = SessionMessage(
            session_id=session.id,
            role="user",
            content=user_message,
        )
        self.db.add(user_msg)
        await self.db.flush()

        # Build message history
        messages = [
            {"role": "system", "content": await self.build_system_prompt(student, session.subject)}
        ]

        result = await self.db.execute(
            select(SessionMessage)
            .where(SessionMessage.session_id == session.id)
            .order_by(SessionMessage.created_at)
        )
        for msg in result.scalars():
            messages.append({"role": msg.role, "content": msg.content})

        # Stream response
        full_response = ""
        async for chunk in get_streaming_completion(messages):
            full_response += chunk
            yield chunk

        # Save complete response
        assistant_msg = SessionMessage(
            session_id=session.id,
            role="assistant",
            content=full_response,
        )
        self.db.add(assistant_msg)
        session.message_count = (session.message_count or 0) + 2

    async def end_session(self, session: Session) -> dict:
        """End a session and generate summary."""
        # Get all messages
        result = await self.db.execute(
            select(SessionMessage)
            .where(SessionMessage.session_id == session.id)
            .order_by(SessionMessage.created_at)
        )
        messages = result.scalars().all()

        # Build transcript
        transcript = "\n".join([f"{m.role}: {m.content}" for m in messages])

        # Generate summary
        summary = await get_completion(
            [{"role": "user", "content": SUMMARIZE_SESSION_PROMPT.format(transcript=transcript)}],
            model=UTILITY_MODEL,
        )

        # Update session
        session.status = SessionStatus.COMPLETED.value
        session.summary = summary

        return {"summary": summary, "message_count": session.message_count}
