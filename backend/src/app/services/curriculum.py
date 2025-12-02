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
