from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.app.auth.dependencies import get_current_user
from src.app.db.base import get_db
from src.app.models import User, Assessment, StudentProfile
from src.app.schemas.assessment import (
    AssessmentResponse,
    GenerateAssessmentRequest,
    SubmitAnswerRequest,
    SubmitAnswerResponse,
    CompleteAssessmentResponse,
    AssessmentListItem,
    MasteryStatusResponse,
)
from src.app.services.assessment import AssessmentService

router = APIRouter(prefix="/assessments", tags=["assessments"])


async def get_family_student_ids(user: User, db: AsyncSession) -> list[str]:
    """Get all student IDs in the user's family."""
    result = await db.execute(
        select(StudentProfile.id)
        .join(User, StudentProfile.user_id == User.id)
        .where(User.family_id == user.family_id)
    )
    return [row[0] for row in result.all()]


@router.post("/generate", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
async def generate_assessment(
    data: GenerateAssessmentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AssessmentResponse:
    """Generate a new assessment for an objective."""
    student_ids = await get_family_student_ids(current_user, db)

    if data.student_id not in student_ids:
        raise HTTPException(status_code=403, detail="Cannot create assessment for this student")

    service = AssessmentService(db)
    try:
        assessment = await service.generate_assessment(
            objective_id=data.objective_id,
            student_id=data.student_id,
        )
        return assessment
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{assessment_id}", response_model=AssessmentResponse)
async def get_assessment(
    assessment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AssessmentResponse:
    """Get an assessment by ID."""
    student_ids = await get_family_student_ids(current_user, db)

    service = AssessmentService(db)
    assessment = await service.get_assessment(assessment_id)

    if not assessment or assessment.student_id not in student_ids:
        raise HTTPException(status_code=404, detail="Assessment not found")

    return assessment


@router.post("/{assessment_id}/submit", response_model=SubmitAnswerResponse)
async def submit_answer(
    assessment_id: str,
    data: SubmitAnswerRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SubmitAnswerResponse:
    """Submit an answer for a question."""
    student_ids = await get_family_student_ids(current_user, db)

    # Verify assessment belongs to family
    result = await db.execute(
        select(Assessment).where(Assessment.id == assessment_id)
    )
    assessment = result.scalar_one_or_none()

    if not assessment or assessment.student_id not in student_ids:
        raise HTTPException(status_code=404, detail="Assessment not found")

    service = AssessmentService(db)
    try:
        result = await service.submit_answer(
            assessment_id=assessment_id,
            question_id=data.question_id,
            answer=data.answer,
        )
        return SubmitAnswerResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{assessment_id}/complete", response_model=CompleteAssessmentResponse)
async def complete_assessment(
    assessment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CompleteAssessmentResponse:
    """Complete an assessment and calculate results."""
    student_ids = await get_family_student_ids(current_user, db)

    # Verify assessment belongs to family
    result = await db.execute(
        select(Assessment).where(Assessment.id == assessment_id)
    )
    assessment = result.scalar_one_or_none()

    if not assessment or assessment.student_id not in student_ids:
        raise HTTPException(status_code=404, detail="Assessment not found")

    service = AssessmentService(db)
    try:
        result = await service.complete_assessment(assessment_id)
        return CompleteAssessmentResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/student/{student_id}", response_model=list[AssessmentListItem])
async def list_student_assessments(
    student_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[AssessmentListItem]:
    """List all assessments for a student."""
    student_ids = await get_family_student_ids(current_user, db)

    if student_id not in student_ids:
        raise HTTPException(status_code=403, detail="Cannot view this student's assessments")

    result = await db.execute(
        select(Assessment)
        .where(Assessment.student_id == student_id)
        .options(selectinload(Assessment.objective))
        .order_by(Assessment.created_at.desc())
    )
    assessments = result.scalars().all()

    return [
        AssessmentListItem(
            id=a.id,
            objective_id=a.objective_id,
            objective_title=a.objective.title if a.objective else "Unknown",
            status=a.status,
            score=a.score,
            passed_without_hints=a.passed_without_hints,
            created_at=str(a.created_at),
        )
        for a in assessments
    ]


@router.get("/mastery/{student_id}/{objective_id}", response_model=MasteryStatusResponse)
async def get_mastery_status(
    student_id: str,
    objective_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MasteryStatusResponse:
    """Get mastery status for an objective."""
    student_ids = await get_family_student_ids(current_user, db)

    if student_id not in student_ids:
        raise HTTPException(status_code=403, detail="Cannot view this student's mastery")

    service = AssessmentService(db)
    result = await service.get_mastery_status(student_id, objective_id)
    return MasteryStatusResponse(**result)
