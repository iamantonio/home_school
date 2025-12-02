from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.app.auth.dependencies import get_current_user
from src.app.db.base import get_db
from src.app.models import (
    User, Progress, Curriculum, Unit, LearningObjective,
    StudentProfile, MasteryLevel,
)
from src.app.schemas.progress import (
    ProgressResponse,
    ProgressUpdate,
    SubjectProgressResponse,
    ObjectiveProgressResponse,
)

router = APIRouter(prefix="/progress", tags=["progress"])


async def get_family_student_ids(user: User, db: AsyncSession) -> list[str]:
    """Get all student IDs in the user's family."""
    result = await db.execute(
        select(StudentProfile.id)
        .join(User, StudentProfile.user_id == User.id)
        .where(User.family_id == user.family_id)
    )
    return [row[0] for row in result.all()]


@router.get("/student/{student_id}", response_model=list[SubjectProgressResponse])
async def get_student_progress(
    student_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[SubjectProgressResponse]:
    """Get progress summary for all subjects for a student."""
    student_ids = await get_family_student_ids(current_user, db)

    if student_id not in student_ids:
        raise HTTPException(status_code=403, detail="Cannot view this student's progress")

    # Get all curricula for the student
    result = await db.execute(
        select(Curriculum)
        .where(Curriculum.student_id == student_id)
        .options(selectinload(Curriculum.units).selectinload(Unit.learning_objectives))
    )
    curricula = result.scalars().all()

    # Get all progress records for this student
    progress_result = await db.execute(
        select(Progress).where(Progress.student_id == student_id)
    )
    progress_map = {p.objective_id: p for p in progress_result.scalars().all()}

    responses = []
    for curriculum in curricula:
        objectives = []
        counts = {"mastered": 0, "practicing": 0, "introduced": 0, "not_started": 0}

        for unit in curriculum.units:
            for obj in unit.learning_objectives:
                progress = progress_map.get(obj.id)
                level = progress.mastery_level if progress else MasteryLevel.NOT_STARTED.value
                session_count = len(progress.session_ids) if progress else 0

                # Count by level
                if level == MasteryLevel.MASTERED.value:
                    counts["mastered"] += 1
                elif level == MasteryLevel.PRACTICING.value:
                    counts["practicing"] += 1
                elif level == MasteryLevel.INTRODUCED.value:
                    counts["introduced"] += 1
                else:
                    counts["not_started"] += 1

                objectives.append(ObjectiveProgressResponse(
                    objective_id=obj.id,
                    objective_title=obj.title,
                    unit_title=unit.title,
                    mastery_level=level,
                    session_count=session_count,
                ))

        responses.append(SubjectProgressResponse(
            subject=curriculum.subject,
            curriculum_id=curriculum.id,
            curriculum_title=curriculum.title,
            total_objectives=len(objectives),
            mastered=counts["mastered"],
            practicing=counts["practicing"],
            introduced=counts["introduced"],
            not_started=counts["not_started"],
            objectives=objectives,
        ))

    return responses


@router.put("/{progress_id}", response_model=ProgressResponse)
async def update_progress(
    progress_id: str,
    data: ProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProgressResponse:
    """Manually update progress (parent override)."""
    student_ids = await get_family_student_ids(current_user, db)

    result = await db.execute(
        select(Progress)
        .where(Progress.id == progress_id)
        .where(Progress.student_id.in_(student_ids))
    )
    progress = result.scalar_one_or_none()

    if not progress:
        raise HTTPException(status_code=404, detail="Progress not found")

    if data.mastery_level:
        progress.mastery_level = data.mastery_level
    if data.notes is not None:
        progress.notes = data.notes

    await db.commit()
    await db.refresh(progress)

    return progress
