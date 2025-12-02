# Phase 3a: Curriculum & Progress Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add AI-generated curriculum planning and session-based progress tracking to the homeschool platform.

**Architecture:** Database models already exist. Add Pydantic schemas, CRUD endpoints, AI generation service, tutor integration, and React frontend pages.

**Tech Stack:**
- Backend: Python 3.12, FastAPI, SQLAlchemy (existing)
- Frontend: React 18, TypeScript, TailwindCSS (existing)
- AI: Claude API via existing `src/app/ai/client.py`

---

## Phase 3a.1: Curriculum Schemas & CRUD API

### Task 1: Create Curriculum Schemas

**Files:**
- Create: `backend/src/app/schemas/curriculum.py`

**Step 1: Create the schemas file**

Create `backend/src/app/schemas/curriculum.py`:
```python
from pydantic import BaseModel, ConfigDict


class LearningObjectiveBase(BaseModel):
    """Base schema for learning objectives."""
    title: str
    description: str | None = None
    order: int = 0
    standard_codes: list[str] = []


class LearningObjectiveCreate(LearningObjectiveBase):
    """Schema for creating a learning objective."""
    pass


class LearningObjectiveResponse(LearningObjectiveBase):
    """Schema for learning objective response."""
    model_config = ConfigDict(from_attributes=True)
    id: str


class UnitBase(BaseModel):
    """Base schema for units."""
    title: str
    description: str | None = None
    order: int = 0
    estimated_hours: int | None = None


class UnitCreate(UnitBase):
    """Schema for creating a unit."""
    objectives: list[LearningObjectiveCreate] = []


class UnitResponse(UnitBase):
    """Schema for unit response."""
    model_config = ConfigDict(from_attributes=True)
    id: str
    learning_objectives: list[LearningObjectiveResponse] = []


class CurriculumBase(BaseModel):
    """Base schema for curriculum."""
    subject: str
    title: str
    description: str | None = None
    grade_level: int
    standards: list[str] = []


class CurriculumCreate(CurriculumBase):
    """Schema for creating a curriculum."""
    student_id: str
    units: list[UnitCreate] = []


class CurriculumResponse(CurriculumBase):
    """Schema for curriculum response."""
    model_config = ConfigDict(from_attributes=True)
    id: str
    student_id: str
    units: list[UnitResponse] = []


class CurriculumListResponse(BaseModel):
    """Schema for listing curricula."""
    model_config = ConfigDict(from_attributes=True)
    id: str
    subject: str
    title: str
    grade_level: int
    unit_count: int = 0
    objective_count: int = 0


class GenerateCurriculumRequest(BaseModel):
    """Request to generate a curriculum with AI."""
    student_id: str
    subject: str
    grade_level: int
    goals: str | None = None
```

**Step 2: Verify imports work**

Run: `cd backend && source .venv/bin/activate && python -c "from src.app.schemas.curriculum import *; print('OK')"`
Expected: OK

**Step 3: Commit**

```bash
git add backend/src/app/schemas/curriculum.py
git commit -m "feat: add curriculum schemas"
```

---

### Task 2: Create Curriculum CRUD Router

**Files:**
- Create: `backend/src/app/api/curriculum.py`
- Modify: `backend/src/app/main.py`

**Step 1: Create the curriculum router**

Create `backend/src/app/api/curriculum.py`:
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
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
)

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
```

**Step 2: Register the router in main.py**

Add to `backend/src/app/main.py`:
```python
from src.app.api.curriculum import router as curriculum_router

# Add with other routers:
app.include_router(curriculum_router, prefix="/api")
```

**Step 3: Verify backend runs**

Run: `cd backend && source .venv/bin/activate && python -c "from src.app.main import app; print('OK')"`
Expected: OK

**Step 4: Commit**

```bash
git add backend/src/app/api/curriculum.py backend/src/app/main.py
git commit -m "feat: add curriculum CRUD endpoints"
```

---

## Phase 3a.2: AI Curriculum Generation

### Task 3: Create Curriculum Generation Service

**Files:**
- Create: `backend/src/app/services/curriculum.py`
- Modify: `backend/src/app/ai/prompts.py`

**Step 1: Add curriculum generation prompt**

Add to `backend/src/app/ai/prompts.py`:
```python
GENERATE_CURRICULUM_PROMPT = """You are an expert curriculum designer for homeschool education.

Create a comprehensive year-long curriculum for:
- Subject: {subject}
- Grade Level: {grade_level}
- Student Goals: {goals}

Generate a curriculum with:
- 6-10 units that cover the full scope of the subject for this grade level
- Each unit should have 3-6 specific, measurable learning objectives
- Order units and objectives logically for progressive learning
- Include Common Core standard codes where applicable (format: CCSS.MATH.CONTENT.7.EE.A.1 for math, CCSS.ELA-LITERACY.RL.7.1 for ELA)

Respond with ONLY valid JSON in this exact format:
{{
  "title": "Grade {grade_level} {subject} Curriculum",
  "description": "A comprehensive curriculum covering...",
  "units": [
    {{
      "title": "Unit 1: Topic Name",
      "description": "Overview of what this unit covers",
      "order": 1,
      "estimated_hours": 20,
      "objectives": [
        {{
          "title": "Objective title - specific and measurable",
          "description": "Detailed description of what the student will learn",
          "order": 1,
          "standard_codes": ["CCSS.XXX.XXX"]
        }}
      ]
    }}
  ]
}}"""
```

**Step 2: Create the curriculum generation service**

Create `backend/src/app/services/curriculum.py`:
```python
import json
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.app.ai.client import get_completion
from src.app.ai.prompts import GENERATE_CURRICULUM_PROMPT
from src.app.models import Curriculum, Unit, LearningObjective, StudentProfile


class CurriculumService:
    """Service for curriculum operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate_curriculum(
        self,
        student_id: str,
        subject: str,
        grade_level: int,
        goals: str | None = None,
    ) -> Curriculum:
        """Generate a curriculum using AI."""
        # Build the prompt
        prompt = GENERATE_CURRICULUM_PROMPT.format(
            subject=subject,
            grade_level=grade_level,
            goals=goals or "Cover all standard topics for this grade level",
        )

        # Get AI response
        response = await get_completion([
            {"role": "user", "content": prompt}
        ])

        # Parse JSON response
        try:
            # Handle potential markdown code blocks
            json_str = response
            if "```json" in response:
                json_str = response.split("```json")[1].split("```")[0]
            elif "```" in response:
                json_str = response.split("```")[1].split("```")[0]

            data = json.loads(json_str.strip())
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse curriculum JSON: {e}")

        # Create curriculum
        curriculum = Curriculum(
            student_id=student_id,
            subject=subject,
            title=data.get("title", f"Grade {grade_level} {subject}"),
            description=data.get("description"),
            grade_level=grade_level,
            standards=[],
        )

        # Add units and objectives
        for unit_data in data.get("units", []):
            unit = Unit(
                title=unit_data.get("title", "Untitled Unit"),
                description=unit_data.get("description"),
                order=unit_data.get("order", 0),
                estimated_hours=unit_data.get("estimated_hours"),
            )

            for obj_data in unit_data.get("objectives", []):
                objective = LearningObjective(
                    title=obj_data.get("title", "Untitled Objective"),
                    description=obj_data.get("description"),
                    order=obj_data.get("order", 0),
                    standard_codes=obj_data.get("standard_codes", []),
                )
                unit.learning_objectives.append(objective)

            curriculum.units.append(unit)

        self.db.add(curriculum)
        await self.db.commit()

        # Reload with relationships
        result = await self.db.execute(
            select(Curriculum)
            .where(Curriculum.id == curriculum.id)
            .options(selectinload(Curriculum.units).selectinload(Unit.learning_objectives))
        )
        return result.scalar_one()

    async def get_student_curriculum(
        self,
        student_id: str,
        subject: str,
    ) -> Curriculum | None:
        """Get a student's curriculum for a subject."""
        result = await self.db.execute(
            select(Curriculum)
            .where(Curriculum.student_id == student_id)
            .where(Curriculum.subject == subject)
            .options(selectinload(Curriculum.units).selectinload(Unit.learning_objectives))
            .order_by(Curriculum.created_at.desc())
        )
        return result.scalar_one_or_none()

    async def get_current_objectives(
        self,
        student_id: str,
        subject: str,
        limit: int = 5,
    ) -> list[LearningObjective]:
        """Get current learning objectives for a student in a subject."""
        curriculum = await self.get_student_curriculum(student_id, subject)
        if not curriculum:
            return []

        # Flatten all objectives, sorted by unit order then objective order
        objectives = []
        for unit in sorted(curriculum.units, key=lambda u: u.order):
            for obj in sorted(unit.learning_objectives, key=lambda o: o.order):
                objectives.append(obj)

        # TODO: Filter by progress to get "current" objectives
        # For now, return first N objectives
        return objectives[:limit]
```

**Step 3: Verify service imports**

Run: `cd backend && source .venv/bin/activate && python -c "from src.app.services.curriculum import CurriculumService; print('OK')"`
Expected: OK

**Step 4: Commit**

```bash
git add backend/src/app/services/curriculum.py backend/src/app/ai/prompts.py
git commit -m "feat: add AI curriculum generation service"
```

---

### Task 4: Add Generate Endpoint

**Files:**
- Modify: `backend/src/app/api/curriculum.py`

**Step 1: Add generate endpoint to curriculum router**

Add to `backend/src/app/api/curriculum.py` (after imports):
```python
from src.app.schemas.curriculum import GenerateCurriculumRequest
from src.app.services.curriculum import CurriculumService
```

Add endpoint (after create_curriculum):
```python
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
```

**Step 2: Verify backend runs**

Run: `cd backend && source .venv/bin/activate && python -c "from src.app.main import app; print('OK')"`
Expected: OK

**Step 3: Commit**

```bash
git add backend/src/app/api/curriculum.py
git commit -m "feat: add AI curriculum generation endpoint"
```

---

## Phase 3a.3: Progress Tracking

### Task 5: Create Progress Schemas & Router

**Files:**
- Create: `backend/src/app/schemas/progress.py`
- Create: `backend/src/app/api/progress.py`
- Modify: `backend/src/app/main.py`

**Step 1: Create progress schemas**

Create `backend/src/app/schemas/progress.py`:
```python
from pydantic import BaseModel, ConfigDict


class ProgressResponse(BaseModel):
    """Schema for progress response."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    student_id: str
    objective_id: str
    mastery_level: str
    session_ids: list[str] = []
    notes: str | None = None


class ProgressUpdate(BaseModel):
    """Schema for updating progress."""
    mastery_level: str | None = None
    notes: str | None = None


class ObjectiveProgressResponse(BaseModel):
    """Progress with objective details."""
    objective_id: str
    objective_title: str
    unit_title: str
    mastery_level: str
    session_count: int


class SubjectProgressResponse(BaseModel):
    """Progress summary for a subject."""
    subject: str
    curriculum_id: str
    curriculum_title: str
    total_objectives: int
    mastered: int
    practicing: int
    introduced: int
    not_started: int
    objectives: list[ObjectiveProgressResponse] = []
```

**Step 2: Create progress router**

Create `backend/src/app/api/progress.py`:
```python
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
```

**Step 3: Register the router**

Add to `backend/src/app/main.py`:
```python
from src.app.api.progress import router as progress_router

# Add with other routers:
app.include_router(progress_router, prefix="/api")
```

**Step 4: Verify backend runs**

Run: `cd backend && source .venv/bin/activate && python -c "from src.app.main import app; print('OK')"`
Expected: OK

**Step 5: Commit**

```bash
git add backend/src/app/schemas/progress.py backend/src/app/api/progress.py backend/src/app/main.py
git commit -m "feat: add progress tracking endpoints"
```

---

### Task 6: Integrate Curriculum into Tutor

**Files:**
- Modify: `backend/src/app/services/tutor.py`

**Step 1: Update tutor to inject curriculum objectives**

Update `backend/src/app/services/tutor.py`:

Add import at top:
```python
from src.app.services.curriculum import CurriculumService
```

Update `build_system_prompt` method:
```python
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
```

**Step 2: Verify backend runs**

Run: `cd backend && source .venv/bin/activate && python -c "from src.app.main import app; print('OK')"`
Expected: OK

**Step 3: Commit**

```bash
git add backend/src/app/services/tutor.py
git commit -m "feat: integrate curriculum objectives into tutor prompts"
```

---

## Phase 3a.4: Frontend - Curriculum Pages

### Task 7: Create Curriculum List Page

**Files:**
- Create: `frontend/src/pages/CurriculumList.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/layouts/MainLayout.tsx`

**Step 1: Create CurriculumList page**

Create `frontend/src/pages/CurriculumList.tsx`:
```tsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

interface CurriculumSummary {
  id: string
  subject: string
  title: string
  grade_level: number
  unit_count: number
  objective_count: number
}

export function CurriculumList() {
  const { user } = useAuth()
  const [curricula, setCurricula] = useState<CurriculumSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      loadCurricula()
    }
  }, [user])

  const loadCurricula = async () => {
    try {
      const response = await api.get('/api/curricula')
      setCurricula(response.data)
    } catch (err) {
      setError('Failed to load curricula')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please sign in to view curricula.</p>
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-12">Loading curricula...</div>
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">{error}</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Curricula</h1>
        <Link
          to="/curricula/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Create Curriculum
        </Link>
      </div>

      {curricula.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-600 mb-4">No curricula yet.</p>
          <Link
            to="/curricula/new"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Create Your First Curriculum
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {curricula.map((curriculum) => (
            <Link
              key={curriculum.id}
              to={`/curricula/${curriculum.id}`}
              className="bg-white rounded-lg border p-6 hover:border-blue-500 transition-colors"
            >
              <h3 className="font-semibold text-lg">{curriculum.title}</h3>
              <p className="text-gray-500 capitalize">{curriculum.subject.replace('_', ' ')}</p>
              <div className="mt-4 text-sm text-gray-600">
                <p>{curriculum.unit_count} units</p>
                <p>{curriculum.objective_count} objectives</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Add route and navigation**

Update `frontend/src/App.tsx` imports:
```tsx
import { CurriculumList } from './pages/CurriculumList'
```

Add route:
```tsx
<Route path="curricula" element={<CurriculumList />} />
```

Update `frontend/src/layouts/MainLayout.tsx` nav:
```tsx
<Link to="/curricula" className="text-gray-600 hover:text-gray-900">
  Curricula
</Link>
```

**Step 3: Verify frontend compiles**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add frontend/src/pages/CurriculumList.tsx frontend/src/App.tsx frontend/src/layouts/MainLayout.tsx
git commit -m "feat: add curriculum list page"
```

---

### Task 8: Create Curriculum Generator Page

**Files:**
- Create: `frontend/src/pages/CreateCurriculum.tsx`
- Modify: `frontend/src/App.tsx`

**Step 1: Create CreateCurriculum page**

Create `frontend/src/pages/CreateCurriculum.tsx`:
```tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

interface Student {
  id: string
  name: string
  grade_level: number
}

const SUBJECTS = [
  { value: 'math', label: 'Mathematics' },
  { value: 'english', label: 'English Language Arts' },
  { value: 'science', label: 'Science' },
  { value: 'social_studies', label: 'Social Studies' },
  { value: 'foreign_language', label: 'Foreign Language' },
  { value: 'computer_science', label: 'Computer Science' },
]

export function CreateCurriculum() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const [studentId, setStudentId] = useState('')
  const [subject, setSubject] = useState('')
  const [gradeLevel, setGradeLevel] = useState(7)
  const [goals, setGoals] = useState('')

  useEffect(() => {
    if (user) {
      loadStudents()
    }
  }, [user])

  const loadStudents = async () => {
    try {
      // Get students from parent dashboard endpoint
      const response = await api.get('/api/dashboard/parent')
      setStudents(response.data.students.map((s: { id: string; name: string; grade_level: number }) => ({
        id: s.id,
        name: s.name,
        grade_level: s.grade_level,
      })))
    } catch (err) {
      // If not a parent, try to get current student
      try {
        const response = await api.get('/api/dashboard/student')
        // For students, we'd need a different approach
        setStudents([])
      } catch {
        setError('Failed to load students')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId || !subject) {
      setError('Please select a student and subject')
      return
    }

    setGenerating(true)
    setError('')

    try {
      const response = await api.post('/api/curricula/generate', {
        student_id: studentId,
        subject,
        grade_level: gradeLevel,
        goals: goals || null,
      })
      navigate(`/curricula/${response.data.id}`)
    } catch (err) {
      setError('Failed to generate curriculum')
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please sign in to create curricula.</p>
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create Curriculum</h1>

      <form onSubmit={handleGenerate} className="bg-white rounded-lg border p-6 space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Student
          </label>
          <select
            value={studentId}
            onChange={(e) => {
              setStudentId(e.target.value)
              const student = students.find(s => s.id === e.target.value)
              if (student) setGradeLevel(student.grade_level)
            }}
            className="w-full border rounded-md p-2"
            required
          >
            <option value="">Select a student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} (Grade {student.grade_level})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border rounded-md p-2"
            required
          >
            <option value="">Select a subject</option>
            {SUBJECTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Grade Level
          </label>
          <select
            value={gradeLevel}
            onChange={(e) => setGradeLevel(Number(e.target.value))}
            className="w-full border rounded-md p-2"
          >
            {[6, 7, 8, 9, 10, 11, 12].map((grade) => (
              <option key={grade} value={grade}>
                Grade {grade}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Goals & Notes (Optional)
          </label>
          <textarea
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder="E.g., 'Focus on algebra fundamentals, she struggles with word problems'"
            className="w-full border rounded-md p-2 h-24"
          />
        </div>

        <button
          type="submit"
          disabled={generating}
          className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {generating ? 'Generating Curriculum...' : 'Generate with AI'}
        </button>

        {generating && (
          <p className="text-sm text-gray-500 text-center">
            This may take 30-60 seconds...
          </p>
        )}
      </form>
    </div>
  )
}
```

**Step 2: Add route**

Update `frontend/src/App.tsx`:
```tsx
import { CreateCurriculum } from './pages/CreateCurriculum'

// Add route:
<Route path="curricula/new" element={<CreateCurriculum />} />
```

**Step 3: Verify frontend compiles**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add frontend/src/pages/CreateCurriculum.tsx frontend/src/App.tsx
git commit -m "feat: add AI curriculum generator page"
```

---

### Task 9: Create Curriculum Detail Page

**Files:**
- Create: `frontend/src/pages/CurriculumDetail.tsx`
- Modify: `frontend/src/App.tsx`

**Step 1: Create CurriculumDetail page**

Create `frontend/src/pages/CurriculumDetail.tsx`:
```tsx
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

interface LearningObjective {
  id: string
  title: string
  description: string | null
  order: number
  standard_codes: string[]
}

interface Unit {
  id: string
  title: string
  description: string | null
  order: number
  estimated_hours: number | null
  learning_objectives: LearningObjective[]
}

interface Curriculum {
  id: string
  subject: string
  title: string
  description: string | null
  grade_level: number
  units: Unit[]
}

export function CurriculumDetail() {
  const { curriculumId } = useParams<{ curriculumId: string }>()
  const { user } = useAuth()
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user && curriculumId) {
      loadCurriculum()
    }
  }, [user, curriculumId])

  const loadCurriculum = async () => {
    try {
      const response = await api.get(`/api/curricula/${curriculumId}`)
      setCurriculum(response.data)
      // Expand first unit by default
      if (response.data.units.length > 0) {
        setExpandedUnits(new Set([response.data.units[0].id]))
      }
    } catch (err) {
      setError('Failed to load curriculum')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleUnit = (unitId: string) => {
    setExpandedUnits((prev) => {
      const next = new Set(prev)
      if (next.has(unitId)) {
        next.delete(unitId)
      } else {
        next.add(unitId)
      }
      return next
    })
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please sign in to view this curriculum.</p>
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-12">Loading curriculum...</div>
  }

  if (error || !curriculum) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || 'Curriculum not found'}</p>
        <Link to="/curricula" className="text-blue-600 hover:underline">
          Back to Curricula
        </Link>
      </div>
    )
  }

  const totalObjectives = curriculum.units.reduce(
    (sum, unit) => sum + unit.learning_objectives.length,
    0
  )

  return (
    <div>
      <Link to="/curricula" className="text-blue-600 hover:underline text-sm">
        &larr; Back to Curricula
      </Link>

      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-bold">{curriculum.title}</h1>
        <p className="text-gray-500 capitalize">
          {curriculum.subject.replace('_', ' ')} &middot; Grade {curriculum.grade_level}
        </p>
        {curriculum.description && (
          <p className="text-gray-600 mt-2">{curriculum.description}</p>
        )}
        <p className="text-sm text-gray-500 mt-2">
          {curriculum.units.length} units &middot; {totalObjectives} objectives
        </p>
      </div>

      <div className="space-y-4">
        {curriculum.units
          .sort((a, b) => a.order - b.order)
          .map((unit) => (
            <div key={unit.id} className="bg-white rounded-lg border">
              <button
                onClick={() => toggleUnit(unit.id)}
                className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50"
              >
                <div>
                  <h3 className="font-semibold">{unit.title}</h3>
                  <p className="text-sm text-gray-500">
                    {unit.learning_objectives.length} objectives
                    {unit.estimated_hours && ` · ~${unit.estimated_hours} hours`}
                  </p>
                </div>
                <span className="text-gray-400">
                  {expandedUnits.has(unit.id) ? '−' : '+'}
                </span>
              </button>

              {expandedUnits.has(unit.id) && (
                <div className="border-t p-4">
                  {unit.description && (
                    <p className="text-gray-600 text-sm mb-4">{unit.description}</p>
                  )}
                  <ul className="space-y-3">
                    {unit.learning_objectives
                      .sort((a, b) => a.order - b.order)
                      .map((obj) => (
                        <li key={obj.id} className="flex items-start gap-3">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          <div>
                            <p className="font-medium">{obj.title}</p>
                            {obj.description && (
                              <p className="text-sm text-gray-600">{obj.description}</p>
                            )}
                            {obj.standard_codes.length > 0 && (
                              <p className="text-xs text-gray-400 mt-1">
                                Standards: {obj.standard_codes.join(', ')}
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  )
}
```

**Step 2: Add route**

Update `frontend/src/App.tsx`:
```tsx
import { CurriculumDetail } from './pages/CurriculumDetail'

// Add route:
<Route path="curricula/:curriculumId" element={<CurriculumDetail />} />
```

**Step 3: Verify frontend compiles**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add frontend/src/pages/CurriculumDetail.tsx frontend/src/App.tsx
git commit -m "feat: add curriculum detail page with expandable units"
```

---

## Phase 3a.5: Frontend - Progress Page

### Task 10: Create Progress Dashboard Page

**Files:**
- Create: `frontend/src/pages/Progress.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/layouts/MainLayout.tsx`

**Step 1: Create Progress page**

Create `frontend/src/pages/Progress.tsx`:
```tsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

interface ObjectiveProgress {
  objective_id: string
  objective_title: string
  unit_title: string
  mastery_level: string
  session_count: number
}

interface SubjectProgress {
  subject: string
  curriculum_id: string
  curriculum_title: string
  total_objectives: number
  mastered: number
  practicing: number
  introduced: number
  not_started: number
  objectives: ObjectiveProgress[]
}

interface Student {
  id: string
  name: string
}

const MASTERY_COLORS = {
  mastered: 'bg-green-500',
  practicing: 'bg-yellow-500',
  introduced: 'bg-blue-500',
  not_started: 'bg-gray-300',
}

const MASTERY_LABELS = {
  mastered: 'Mastered',
  practicing: 'Practicing',
  introduced: 'Introduced',
  not_started: 'Not Started',
}

export function Progress() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [progress, setProgress] = useState<SubjectProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadStudents()
    }
  }, [user])

  useEffect(() => {
    if (selectedStudent) {
      loadProgress()
    }
  }, [selectedStudent])

  const loadStudents = async () => {
    try {
      const response = await api.get('/api/dashboard/parent')
      const studentList = response.data.students.map((s: { id: string; name: string }) => ({
        id: s.id,
        name: s.name,
      }))
      setStudents(studentList)
      if (studentList.length > 0) {
        setSelectedStudent(studentList[0].id)
      }
    } catch {
      // Not a parent, might be a student
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  const loadProgress = async () => {
    try {
      const response = await api.get(`/api/progress/student/${selectedStudent}`)
      setProgress(response.data)
    } catch (err) {
      setError('Failed to load progress')
      console.error(err)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please sign in to view progress.</p>
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Learning Progress</h1>
        {students.length > 1 && (
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="border rounded-md p-2"
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {progress.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-600 mb-4">No curricula found for this student.</p>
          <Link
            to="/curricula/new"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Create a Curriculum
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {progress.map((subject) => {
            const percentage = subject.total_objectives > 0
              ? Math.round((subject.mastered / subject.total_objectives) * 100)
              : 0

            return (
              <div key={subject.curriculum_id} className="bg-white rounded-lg border">
                <button
                  onClick={() => setExpandedSubject(
                    expandedSubject === subject.subject ? null : subject.subject
                  )}
                  className="w-full p-6 text-left"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{subject.curriculum_title}</h3>
                      <p className="text-gray-500 capitalize">
                        {subject.subject.replace('_', ' ')}
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">{percentage}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden flex">
                    <div
                      className="bg-green-500 transition-all"
                      style={{ width: `${(subject.mastered / subject.total_objectives) * 100}%` }}
                    />
                    <div
                      className="bg-yellow-500 transition-all"
                      style={{ width: `${(subject.practicing / subject.total_objectives) * 100}%` }}
                    />
                    <div
                      className="bg-blue-500 transition-all"
                      style={{ width: `${(subject.introduced / subject.total_objectives) * 100}%` }}
                    />
                  </div>

                  {/* Legend */}
                  <div className="flex gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-green-500 rounded" />
                      {subject.mastered} Mastered
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-yellow-500 rounded" />
                      {subject.practicing} Practicing
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-blue-500 rounded" />
                      {subject.introduced} Introduced
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-gray-300 rounded" />
                      {subject.not_started} Not Started
                    </span>
                  </div>
                </button>

                {expandedSubject === subject.subject && (
                  <div className="border-t p-6">
                    <div className="space-y-2">
                      {subject.objectives.map((obj) => (
                        <div
                          key={obj.objective_id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded"
                        >
                          <div>
                            <p className="font-medium">{obj.objective_title}</p>
                            <p className="text-sm text-gray-500">{obj.unit_title}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded text-xs text-white ${
                                MASTERY_COLORS[obj.mastery_level as keyof typeof MASTERY_COLORS]
                              }`}
                            >
                              {MASTERY_LABELS[obj.mastery_level as keyof typeof MASTERY_LABELS]}
                            </span>
                            {obj.session_count > 0 && (
                              <span className="text-xs text-gray-400">
                                {obj.session_count} sessions
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Add route and navigation**

Update `frontend/src/App.tsx`:
```tsx
import { Progress } from './pages/Progress'

// Add route:
<Route path="progress" element={<Progress />} />
```

Update `frontend/src/layouts/MainLayout.tsx` nav:
```tsx
<Link to="/progress" className="text-gray-600 hover:text-gray-900">
  Progress
</Link>
```

**Step 3: Verify frontend compiles**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add frontend/src/pages/Progress.tsx frontend/src/App.tsx frontend/src/layouts/MainLayout.tsx
git commit -m "feat: add progress dashboard page"
```

---

## Summary

**Phase 3a Implementation:**

| Task | Description | Files |
|------|-------------|-------|
| 1 | Curriculum schemas | `schemas/curriculum.py` |
| 2 | Curriculum CRUD API | `api/curriculum.py`, `main.py` |
| 3 | AI generation service | `services/curriculum.py`, `ai/prompts.py` |
| 4 | Generate endpoint | `api/curriculum.py` |
| 5 | Progress schemas & API | `schemas/progress.py`, `api/progress.py` |
| 6 | Tutor integration | `services/tutor.py` |
| 7 | Curriculum list page | `pages/CurriculumList.tsx` |
| 8 | Create curriculum page | `pages/CreateCurriculum.tsx` |
| 9 | Curriculum detail page | `pages/CurriculumDetail.tsx` |
| 10 | Progress dashboard | `pages/Progress.tsx` |

**Total: 10 tasks, ~10 commits**
