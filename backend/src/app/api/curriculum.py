from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.app.auth.dependencies import get_current_user
from src.app.db.base import get_db
from src.app.models import User, Curriculum, Unit, LearningObjective, StudentProfile
from src.app.schemas.curriculum import (
    CurriculumCreate,
    CurriculumResponse,
    CurriculumListResponse,
    UnitCreate,
    UnitResponse,
    LearningObjectiveCreate,
    LearningObjectiveResponse,
    GenerateCurriculumRequest,
)
from src.app.services.curriculum import CurriculumService

router = APIRouter(prefix="/curricula", tags=["curricula"])


async def get_family_student_ids(user: User, db: AsyncSession) -> list[str]:
    """Get all student IDs in the user's family."""
    result = await db.execute(
        select(StudentProfile.id)
        .join(User, StudentProfile.user_id == User.id)
        .where(User.family_id == user.family_id)
    )
    return [row[0] for row in result.all()]


@router.get("", response_model=list[CurriculumListResponse])
async def list_curricula(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[CurriculumListResponse]:
    """List all curricula for the family."""
    student_ids = await get_family_student_ids(current_user, db)

    result = await db.execute(
        select(Curriculum)
        .where(Curriculum.student_id.in_(student_ids))
        .options(selectinload(Curriculum.units).selectinload(Unit.learning_objectives))
        .order_by(Curriculum.created_at.desc())
    )
    curricula = result.scalars().all()

    return [
        CurriculumListResponse(
            id=c.id,
            subject=c.subject,
            title=c.title,
            grade_level=c.grade_level,
            unit_count=len(c.units),
            objective_count=sum(len(u.learning_objectives) for u in c.units),
        )
        for c in curricula
    ]


@router.get("/{curriculum_id}", response_model=CurriculumResponse)
async def get_curriculum(
    curriculum_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CurriculumResponse:
    """Get a curriculum with all units and objectives."""
    student_ids = await get_family_student_ids(current_user, db)

    result = await db.execute(
        select(Curriculum)
        .where(Curriculum.id == curriculum_id)
        .where(Curriculum.student_id.in_(student_ids))
        .options(selectinload(Curriculum.units).selectinload(Unit.learning_objectives))
    )
    curriculum = result.scalar_one_or_none()

    if not curriculum:
        raise HTTPException(status_code=404, detail="Curriculum not found")

    return curriculum


@router.post("", response_model=CurriculumResponse, status_code=status.HTTP_201_CREATED)
async def create_curriculum(
    data: CurriculumCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CurriculumResponse:
    """Create a new curriculum with units and objectives."""
    student_ids = await get_family_student_ids(current_user, db)

    if data.student_id not in student_ids:
        raise HTTPException(status_code=403, detail="Cannot create curriculum for this student")

    curriculum = Curriculum(
        student_id=data.student_id,
        subject=data.subject,
        title=data.title,
        description=data.description,
        grade_level=data.grade_level,
        standards=data.standards,
    )

    for unit_data in data.units:
        unit = Unit(
            title=unit_data.title,
            description=unit_data.description,
            order=unit_data.order,
            estimated_hours=unit_data.estimated_hours,
        )
        for obj_data in unit_data.objectives:
            objective = LearningObjective(
                title=obj_data.title,
                description=obj_data.description,
                order=obj_data.order,
                standard_codes=obj_data.standard_codes,
            )
            unit.learning_objectives.append(objective)
        curriculum.units.append(unit)

    db.add(curriculum)
    await db.commit()
    await db.refresh(curriculum)

    # Reload with relationships
    result = await db.execute(
        select(Curriculum)
        .where(Curriculum.id == curriculum.id)
        .options(selectinload(Curriculum.units).selectinload(Unit.learning_objectives))
    )
    return result.scalar_one()


@router.post("/generate", response_model=CurriculumResponse, status_code=status.HTTP_201_CREATED)
async def generate_curriculum(
    data: GenerateCurriculumRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CurriculumResponse:
    """Generate a curriculum using AI."""
    student_ids = await get_family_student_ids(current_user, db)

    if data.student_id not in student_ids:
        raise HTTPException(status_code=403, detail="Cannot create curriculum for this student")

    service = CurriculumService(db)
    curriculum = await service.generate_curriculum(
        student_id=data.student_id,
        subject=data.subject,
        grade_level=data.grade_level,
        goals=data.goals,
    )

    return curriculum


@router.delete("/{curriculum_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_curriculum(
    curriculum_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a curriculum."""
    student_ids = await get_family_student_ids(current_user, db)

    result = await db.execute(
        select(Curriculum)
        .where(Curriculum.id == curriculum_id)
        .where(Curriculum.student_id.in_(student_ids))
    )
    curriculum = result.scalar_one_or_none()

    if not curriculum:
        raise HTTPException(status_code=404, detail="Curriculum not found")

    await db.delete(curriculum)
    await db.commit()


# Unit management
@router.post("/{curriculum_id}/units", response_model=UnitResponse, status_code=status.HTTP_201_CREATED)
async def add_unit(
    curriculum_id: str,
    data: UnitCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UnitResponse:
    """Add a unit to a curriculum."""
    student_ids = await get_family_student_ids(current_user, db)

    result = await db.execute(
        select(Curriculum)
        .where(Curriculum.id == curriculum_id)
        .where(Curriculum.student_id.in_(student_ids))
    )
    curriculum = result.scalar_one_or_none()

    if not curriculum:
        raise HTTPException(status_code=404, detail="Curriculum not found")

    unit = Unit(
        curriculum_id=curriculum_id,
        title=data.title,
        description=data.description,
        order=data.order,
        estimated_hours=data.estimated_hours,
    )

    for obj_data in data.objectives:
        objective = LearningObjective(
            title=obj_data.title,
            description=obj_data.description,
            order=obj_data.order,
            standard_codes=obj_data.standard_codes,
        )
        unit.learning_objectives.append(objective)

    db.add(unit)
    await db.commit()

    result = await db.execute(
        select(Unit)
        .where(Unit.id == unit.id)
        .options(selectinload(Unit.learning_objectives))
    )
    return result.scalar_one()


@router.delete("/units/{unit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_unit(
    unit_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a unit."""
    student_ids = await get_family_student_ids(current_user, db)

    result = await db.execute(
        select(Unit)
        .join(Curriculum)
        .where(Unit.id == unit_id)
        .where(Curriculum.student_id.in_(student_ids))
    )
    unit = result.scalar_one_or_none()

    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    await db.delete(unit)
    await db.commit()


# Objective management
@router.post("/units/{unit_id}/objectives", response_model=LearningObjectiveResponse, status_code=status.HTTP_201_CREATED)
async def add_objective(
    unit_id: str,
    data: LearningObjectiveCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LearningObjectiveResponse:
    """Add an objective to a unit."""
    student_ids = await get_family_student_ids(current_user, db)

    result = await db.execute(
        select(Unit)
        .join(Curriculum)
        .where(Unit.id == unit_id)
        .where(Curriculum.student_id.in_(student_ids))
    )
    unit = result.scalar_one_or_none()

    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    objective = LearningObjective(
        unit_id=unit_id,
        title=data.title,
        description=data.description,
        order=data.order,
        standard_codes=data.standard_codes,
    )

    db.add(objective)
    await db.commit()
    await db.refresh(objective)

    return objective


@router.delete("/objectives/{objective_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_objective(
    objective_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an objective."""
    student_ids = await get_family_student_ids(current_user, db)

    result = await db.execute(
        select(LearningObjective)
        .join(Unit)
        .join(Curriculum)
        .where(LearningObjective.id == objective_id)
        .where(Curriculum.student_id.in_(student_ids))
    )
    objective = result.scalar_one_or_none()

    if not objective:
        raise HTTPException(status_code=404, detail="Objective not found")

    await db.delete(objective)
    await db.commit()
