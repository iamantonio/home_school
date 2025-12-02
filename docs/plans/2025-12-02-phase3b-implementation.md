# Phase 3b: Assessment System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add adaptive per-objective quizzes with hints, supporting multiple question types including math, with threshold-based mastery progression.

**Architecture:** Extend existing FastAPI backend with assessment models, AI question generation service, grading logic, and mastery tracking. Add React pages for taking quizzes with hint support.

**Tech Stack:**
- Backend: Python 3.12, FastAPI, SQLAlchemy, SymPy (new)
- Frontend: React 18, TypeScript, TailwindCSS
- AI: Claude API for question generation and short-answer grading

---

## Phase 3b.1: Database Models

### Task 1: Create Assessment Models

**Files:**
- Create: `backend/src/app/models/assessment.py`
- Modify: `backend/src/app/models/__init__.py`

**Step 1: Create assessment models file**

Create `backend/src/app/models/assessment.py`:
```python
from enum import Enum
from datetime import date

from sqlalchemy import Boolean, Date, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.app.db.base import Base


class AssessmentStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    SHORT_ANSWER = "short_answer"
    NUMERIC = "numeric"
    EQUATION = "equation"


class Assessment(Base):
    """A generated quiz for a learning objective."""
    __tablename__ = "assessments"

    objective_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("learning_objectives.id")
    )
    student_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("student_profiles.id")
    )
    status: Mapped[str] = mapped_column(
        String(50), default=AssessmentStatus.NOT_STARTED.value
    )
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    passed_without_hints: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Relationships
    objective: Mapped["LearningObjective"] = relationship()
    student: Mapped["StudentProfile"] = relationship()
    questions: Mapped[list["Question"]] = relationship(
        back_populates="assessment", cascade="all, delete-orphan"
    )


class Question(Base):
    """A question within an assessment."""
    __tablename__ = "questions"

    assessment_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("assessments.id")
    )
    question_type: Mapped[str] = mapped_column(String(50))
    question_text: Mapped[str] = mapped_column(Text)
    options: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)  # For MCQ
    correct_answer: Mapped[str] = mapped_column(Text)
    hint_1: Mapped[str | None] = mapped_column(Text, nullable=True)
    hint_2: Mapped[str | None] = mapped_column(Text, nullable=True)
    order: Mapped[int] = mapped_column(Integer)

    # Relationships
    assessment: Mapped["Assessment"] = relationship(back_populates="questions")
    responses: Mapped[list["Response"]] = relationship(
        back_populates="question", cascade="all, delete-orphan"
    )


class Response(Base):
    """A student's response to a question."""
    __tablename__ = "responses"

    question_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("questions.id")
    )
    student_answer: Mapped[str] = mapped_column(Text)
    is_correct: Mapped[bool] = mapped_column(Boolean)
    hints_used: Mapped[int] = mapped_column(Integer, default=0)
    ai_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    question: Mapped["Question"] = relationship(back_populates="responses")


class MasteryAttempt(Base):
    """Tracks clean passes for threshold-based mastery."""
    __tablename__ = "mastery_attempts"

    student_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("student_profiles.id")
    )
    objective_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("learning_objectives.id")
    )
    assessment_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("assessments.id")
    )
    passed_clean: Mapped[bool] = mapped_column(Boolean)
    attempt_date: Mapped[date] = mapped_column(Date)
```

**Step 2: Update models __init__.py**

Add to `backend/src/app/models/__init__.py`:
```python
from src.app.models.assessment import (
    Assessment,
    Question,
    Response,
    MasteryAttempt,
    AssessmentStatus,
    QuestionType,
)
```

And update `__all__` list.

**Step 3: Verify imports**

Run: `cd backend && source .venv/bin/activate && python -c "from src.app.models import Assessment, Question, Response, MasteryAttempt; print('OK')"`
Expected: OK

**Step 4: Commit**

```bash
git add backend/src/app/models/assessment.py backend/src/app/models/__init__.py
git commit -m "feat: add assessment models"
```

---

### Task 2: Create Database Migration

**Files:**
- Create: `backend/alembic/versions/XXXX_add_assessment_tables.py`

**Step 1: Generate migration**

Run: `cd backend && source .venv/bin/activate && alembic revision -m "add assessment tables"`

**Step 2: Edit migration file**

Update the generated migration:
```python
"""add assessment tables

Revision ID: [generated]
Revises: 24f61150ba75
Create Date: [generated]
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '[generated]'
down_revision = '24f61150ba75'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'assessments',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('objective_id', postgresql.UUID(as_uuid=False), sa.ForeignKey('learning_objectives.id'), nullable=False),
        sa.Column('student_id', postgresql.UUID(as_uuid=False), sa.ForeignKey('student_profiles.id'), nullable=False),
        sa.Column('status', sa.String(50), default='not_started'),
        sa.Column('score', sa.Float, nullable=True),
        sa.Column('passed_without_hints', sa.Boolean, default=False),
        sa.Column('completed_at', sa.Date, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_table(
        'questions',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('assessment_id', postgresql.UUID(as_uuid=False), sa.ForeignKey('assessments.id'), nullable=False),
        sa.Column('question_type', sa.String(50), nullable=False),
        sa.Column('question_text', sa.Text, nullable=False),
        sa.Column('options', postgresql.JSONB, nullable=True),
        sa.Column('correct_answer', sa.Text, nullable=False),
        sa.Column('hint_1', sa.Text, nullable=True),
        sa.Column('hint_2', sa.Text, nullable=True),
        sa.Column('order', sa.Integer, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_table(
        'responses',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('question_id', postgresql.UUID(as_uuid=False), sa.ForeignKey('questions.id'), nullable=False),
        sa.Column('student_answer', sa.Text, nullable=False),
        sa.Column('is_correct', sa.Boolean, nullable=False),
        sa.Column('hints_used', sa.Integer, default=0),
        sa.Column('ai_feedback', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_table(
        'mastery_attempts',
        sa.Column('id', postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column('student_id', postgresql.UUID(as_uuid=False), sa.ForeignKey('student_profiles.id'), nullable=False),
        sa.Column('objective_id', postgresql.UUID(as_uuid=False), sa.ForeignKey('learning_objectives.id'), nullable=False),
        sa.Column('assessment_id', postgresql.UUID(as_uuid=False), sa.ForeignKey('assessments.id'), nullable=False),
        sa.Column('passed_clean', sa.Boolean, nullable=False),
        sa.Column('attempt_date', sa.Date, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('mastery_attempts')
    op.drop_table('responses')
    op.drop_table('questions')
    op.drop_table('assessments')
```

**Step 3: Run migration**

Run: `cd backend && source .venv/bin/activate && alembic upgrade head`
Expected: Migration applied successfully

**Step 4: Commit**

```bash
git add backend/alembic/versions/
git commit -m "feat: add assessment tables migration"
```

---

## Phase 3b.2: Assessment Schemas & Generation

### Task 3: Create Assessment Schemas

**Files:**
- Create: `backend/src/app/schemas/assessment.py`

**Step 1: Create schemas file**

Create `backend/src/app/schemas/assessment.py`:
```python
from pydantic import BaseModel, ConfigDict


class QuestionResponse(BaseModel):
    """Schema for question in assessment (no answers/hints for student)."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    question_type: str
    question_text: str
    options: list[str] | None = None
    order: int


class QuestionWithAnswer(QuestionResponse):
    """Schema for question with answer (for review)."""
    correct_answer: str
    hint_1: str | None = None
    hint_2: str | None = None


class AssessmentResponse(BaseModel):
    """Schema for assessment response."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    objective_id: str
    student_id: str
    status: str
    score: float | None = None
    passed_without_hints: bool
    questions: list[QuestionResponse] = []


class AssessmentWithAnswers(BaseModel):
    """Schema for completed assessment with answers (for review)."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    objective_id: str
    student_id: str
    status: str
    score: float | None = None
    passed_without_hints: bool
    questions: list[QuestionWithAnswer] = []


class GenerateAssessmentRequest(BaseModel):
    """Request to generate an assessment."""
    objective_id: str
    student_id: str


class SubmitAnswerRequest(BaseModel):
    """Request to submit an answer."""
    question_id: str
    answer: str


class SubmitAnswerResponse(BaseModel):
    """Response after submitting an answer."""
    is_correct: bool
    hints_used: int
    hint: str | None = None  # Next hint if wrong
    feedback: str | None = None  # AI feedback for short answers
    show_answer: bool = False  # True if all hints exhausted
    correct_answer: str | None = None  # Only if show_answer is True


class UseHintRequest(BaseModel):
    """Request to use a hint."""
    question_id: str


class UseHintResponse(BaseModel):
    """Response with hint."""
    hint_text: str
    hints_remaining: int


class CompleteAssessmentResponse(BaseModel):
    """Response after completing assessment."""
    score: float
    passed_without_hints: bool
    mastery_updated: bool
    new_mastery_level: str | None = None


class AssessmentListItem(BaseModel):
    """Schema for assessment in list."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    objective_id: str
    objective_title: str
    status: str
    score: float | None = None
    passed_without_hints: bool
    created_at: str


class MasteryAttemptResponse(BaseModel):
    """Schema for mastery attempt."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    assessment_id: str
    passed_clean: bool
    attempt_date: str


class MasteryStatusResponse(BaseModel):
    """Schema for mastery status of an objective."""
    objective_id: str
    current_level: str
    clean_passes: int
    passes_needed: int = 2
    can_achieve_mastery: bool
    attempts: list[MasteryAttemptResponse] = []
```

**Step 2: Verify imports**

Run: `cd backend && source .venv/bin/activate && python -c "from src.app.schemas.assessment import *; print('OK')"`
Expected: OK

**Step 3: Commit**

```bash
git add backend/src/app/schemas/assessment.py
git commit -m "feat: add assessment schemas"
```

---

### Task 4: Create Question Generation Prompt

**Files:**
- Modify: `backend/src/app/ai/prompts.py`

**Step 1: Add question generation prompt**

Add to `backend/src/app/ai/prompts.py`:
```python
GENERATE_QUESTIONS_PROMPT = """You are an expert assessment designer for homeschool education.

Generate {num_questions} questions to assess this learning objective:

**Objective:** {objective_title}
**Description:** {objective_description}
**Subject:** {subject}
**Grade Level:** {grade_level}
**Standard Codes:** {standard_codes}

**Question Types to Include:**
{question_types}

For each question, provide:
- Clear, unambiguous question text
- For multiple choice: exactly 4 options (A, B, C, D) with one correct answer
- For numeric: the exact numeric answer (accept small tolerance)
- For equation: the algebraic expression answer
- For short answer: expected answer and key points to look for
- Two progressive hints:
  - Hint 1: Gentle nudge toward the right approach
  - Hint 2: Stronger clue that almost gives away the answer

Respond with ONLY valid JSON in this exact format:
{{
  "questions": [
    {{
      "question_type": "multiple_choice",
      "question_text": "What is 2 + 2?",
      "options": ["A. 3", "B. 4", "C. 5", "D. 6"],
      "correct_answer": "B",
      "hint_1": "Think about counting on your fingers.",
      "hint_2": "Start with 2, then count 2 more: 2, 3, 4..."
    }},
    {{
      "question_type": "short_answer",
      "question_text": "Explain why the sky is blue.",
      "options": null,
      "correct_answer": "Light scattering by the atmosphere makes shorter blue wavelengths more visible.",
      "hint_1": "Think about what happens to sunlight in the atmosphere.",
      "hint_2": "Different colors of light scatter differently. Which colors scatter most?"
    }},
    {{
      "question_type": "numeric",
      "question_text": "Calculate: 15 * 3",
      "options": null,
      "correct_answer": "45",
      "hint_1": "Try breaking it down: 15 * 3 = (10 * 3) + (5 * 3)",
      "hint_2": "10 * 3 = 30, and 5 * 3 = 15. Now add them."
    }},
    {{
      "question_type": "equation",
      "question_text": "Simplify: 2x + 3x",
      "options": null,
      "correct_answer": "5x",
      "hint_1": "When you have like terms, you can combine them.",
      "hint_2": "2 of something plus 3 of something equals how many of that thing?"
    }}
  ]
}}"""

GRADE_SHORT_ANSWER_PROMPT = """You are grading a student's short answer response.

**Question:** {question}
**Expected Answer:** {expected_answer}
**Student's Answer:** {student_answer}

Evaluate if the student's answer is correct. Consider:
- Partial credit for partially correct answers
- Accept equivalent phrasings and explanations
- Focus on conceptual understanding, not exact wording

Respond with ONLY valid JSON:
{{
  "correct": true/false,
  "confidence": 0.0-1.0,
  "feedback": "Brief explanation of what was right/wrong"
}}"""
```

**Step 2: Verify imports**

Run: `cd backend && source .venv/bin/activate && python -c "from src.app.ai.prompts import GENERATE_QUESTIONS_PROMPT, GRADE_SHORT_ANSWER_PROMPT; print('OK')"`
Expected: OK

**Step 3: Commit**

```bash
git add backend/src/app/ai/prompts.py
git commit -m "feat: add assessment generation prompts"
```

---

### Task 5: Create Assessment Service

**Files:**
- Create: `backend/src/app/services/assessment.py`

**Step 1: Create assessment service**

Create `backend/src/app/services/assessment.py`:
```python
import json
from datetime import date

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.app.ai.client import get_completion, UTILITY_MODEL
from src.app.ai.prompts import GENERATE_QUESTIONS_PROMPT, GRADE_SHORT_ANSWER_PROMPT
from src.app.models import (
    Assessment, Question, Response, MasteryAttempt,
    LearningObjective, Progress, StudentProfile, Unit, Curriculum,
    AssessmentStatus, QuestionType, MasteryLevel,
)


class AssessmentService:
    """Service for assessment operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate_assessment(
        self,
        objective_id: str,
        student_id: str,
    ) -> Assessment:
        """Generate a new assessment for an objective."""
        # Get objective with curriculum context
        result = await self.db.execute(
            select(LearningObjective)
            .where(LearningObjective.id == objective_id)
            .options(selectinload(LearningObjective.unit).selectinload(Unit.curriculum))
        )
        objective = result.scalar_one_or_none()
        if not objective:
            raise ValueError("Objective not found")

        curriculum = objective.unit.curriculum
        subject = curriculum.subject
        grade_level = curriculum.grade_level

        # Determine question types based on subject
        if subject in ["math", "computer_science"]:
            question_types = "- 2 multiple choice\n- 1 numeric\n- 1 equation"
            num_questions = 4
        else:
            question_types = "- 2 multiple choice\n- 2 short answer"
            num_questions = 4

        # Generate questions with AI
        prompt = GENERATE_QUESTIONS_PROMPT.format(
            num_questions=num_questions,
            objective_title=objective.title,
            objective_description=objective.description or "No description provided",
            subject=subject,
            grade_level=grade_level,
            standard_codes=", ".join(objective.standard_codes) if objective.standard_codes else "None",
            question_types=question_types,
        )

        response = await get_completion([{"role": "user", "content": prompt}])

        # Parse JSON response
        try:
            json_str = response
            if "```json" in response:
                json_str = response.split("```json")[1].split("```")[0]
            elif "```" in response:
                json_str = response.split("```")[1].split("```")[0]
            data = json.loads(json_str.strip())
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse questions JSON: {e}")

        # Create assessment
        assessment = Assessment(
            objective_id=objective_id,
            student_id=student_id,
            status=AssessmentStatus.NOT_STARTED.value,
        )

        # Add questions
        for i, q_data in enumerate(data.get("questions", [])):
            question = Question(
                question_type=q_data.get("question_type", "multiple_choice"),
                question_text=q_data.get("question_text", ""),
                options=q_data.get("options"),
                correct_answer=q_data.get("correct_answer", ""),
                hint_1=q_data.get("hint_1"),
                hint_2=q_data.get("hint_2"),
                order=i + 1,
            )
            assessment.questions.append(question)

        self.db.add(assessment)
        await self.db.commit()

        # Reload with relationships
        result = await self.db.execute(
            select(Assessment)
            .where(Assessment.id == assessment.id)
            .options(selectinload(Assessment.questions))
        )
        return result.scalar_one()

    async def get_assessment(self, assessment_id: str) -> Assessment | None:
        """Get an assessment by ID."""
        result = await self.db.execute(
            select(Assessment)
            .where(Assessment.id == assessment_id)
            .options(selectinload(Assessment.questions).selectinload(Question.responses))
        )
        return result.scalar_one_or_none()

    async def submit_answer(
        self,
        assessment_id: str,
        question_id: str,
        answer: str,
    ) -> dict:
        """Submit an answer and return result with hint if wrong."""
        # Get question
        result = await self.db.execute(
            select(Question)
            .where(Question.id == question_id)
            .where(Question.assessment_id == assessment_id)
            .options(selectinload(Question.responses))
        )
        question = result.scalar_one_or_none()
        if not question:
            raise ValueError("Question not found")

        # Count existing responses to determine hints used
        hints_used = len(question.responses)

        # Grade the answer
        is_correct, feedback = await self._grade_answer(question, answer)

        # Create response record
        response = Response(
            question_id=question_id,
            student_answer=answer,
            is_correct=is_correct,
            hints_used=hints_used,
            ai_feedback=feedback,
        )
        self.db.add(response)

        # Update assessment status
        assessment_result = await self.db.execute(
            select(Assessment).where(Assessment.id == assessment_id)
        )
        assessment = assessment_result.scalar_one()
        if assessment.status == AssessmentStatus.NOT_STARTED.value:
            assessment.status = AssessmentStatus.IN_PROGRESS.value

        await self.db.commit()

        # Determine next hint or show answer
        result_data = {
            "is_correct": is_correct,
            "hints_used": hints_used + 1,
            "hint": None,
            "feedback": feedback,
            "show_answer": False,
            "correct_answer": None,
        }

        if not is_correct:
            if hints_used == 0 and question.hint_1:
                result_data["hint"] = question.hint_1
            elif hints_used == 1 and question.hint_2:
                result_data["hint"] = question.hint_2
            else:
                result_data["show_answer"] = True
                result_data["correct_answer"] = question.correct_answer

        return result_data

    async def _grade_answer(self, question: Question, answer: str) -> tuple[bool, str | None]:
        """Grade an answer based on question type."""
        q_type = question.question_type
        correct = question.correct_answer.strip()
        student = answer.strip()

        if q_type == QuestionType.MULTIPLE_CHOICE.value:
            # Exact match for MCQ (just the letter)
            is_correct = student.upper() == correct.upper()
            return is_correct, None

        elif q_type == QuestionType.NUMERIC.value:
            # Numeric with tolerance
            try:
                student_num = float(student)
                correct_num = float(correct)
                tolerance = abs(correct_num * 0.01) if correct_num != 0 else 0.01
                is_correct = abs(student_num - correct_num) <= tolerance
                return is_correct, None
            except ValueError:
                return False, "Please enter a valid number"

        elif q_type == QuestionType.EQUATION.value:
            # Symbolic equivalence with SymPy
            try:
                from sympy import sympify, simplify
                student_expr = sympify(student)
                correct_expr = sympify(correct)
                is_correct = simplify(student_expr - correct_expr) == 0
                return is_correct, None
            except Exception:
                return False, "Please enter a valid mathematical expression"

        elif q_type == QuestionType.SHORT_ANSWER.value:
            # AI grading for short answers
            prompt = GRADE_SHORT_ANSWER_PROMPT.format(
                question=question.question_text,
                expected_answer=correct,
                student_answer=student,
            )
            response = await get_completion(
                [{"role": "user", "content": prompt}],
                model=UTILITY_MODEL,
            )
            try:
                json_str = response
                if "```json" in response:
                    json_str = response.split("```json")[1].split("```")[0]
                data = json.loads(json_str.strip())
                return data.get("correct", False), data.get("feedback")
            except (json.JSONDecodeError, KeyError):
                # Fallback to simple substring match
                return correct.lower() in student.lower(), None

        return False, None

    async def complete_assessment(self, assessment_id: str) -> dict:
        """Complete an assessment and update mastery."""
        result = await self.db.execute(
            select(Assessment)
            .where(Assessment.id == assessment_id)
            .options(selectinload(Assessment.questions).selectinload(Question.responses))
        )
        assessment = result.scalar_one_or_none()
        if not assessment:
            raise ValueError("Assessment not found")

        # Calculate score
        total_questions = len(assessment.questions)
        correct_answers = 0
        used_any_hints = False

        for question in assessment.questions:
            # Get the final response for each question
            responses = sorted(question.responses, key=lambda r: r.created_at)
            if responses:
                final_response = responses[-1]
                if final_response.is_correct:
                    correct_answers += 1
                if final_response.hints_used > 0:
                    used_any_hints = True

        score = correct_answers / total_questions if total_questions > 0 else 0
        passed_without_hints = score >= 0.8 and not used_any_hints

        # Update assessment
        assessment.status = AssessmentStatus.COMPLETED.value
        assessment.score = score
        assessment.passed_without_hints = passed_without_hints
        assessment.completed_at = date.today()

        # Record mastery attempt
        mastery_attempt = MasteryAttempt(
            student_id=assessment.student_id,
            objective_id=assessment.objective_id,
            assessment_id=assessment.id,
            passed_clean=passed_without_hints,
            attempt_date=date.today(),
        )
        self.db.add(mastery_attempt)

        # Check if mastery should be updated
        mastery_updated = False
        new_mastery_level = None

        if passed_without_hints:
            # Check for 2 clean passes on different days
            result = await self.db.execute(
                select(MasteryAttempt)
                .where(MasteryAttempt.student_id == assessment.student_id)
                .where(MasteryAttempt.objective_id == assessment.objective_id)
                .where(MasteryAttempt.passed_clean == True)
            )
            clean_attempts = result.scalars().all()
            unique_dates = set(a.attempt_date for a in clean_attempts)
            # Include today's attempt
            unique_dates.add(date.today())

            if len(unique_dates) >= 2:
                # Update progress to mastered
                progress_result = await self.db.execute(
                    select(Progress)
                    .where(Progress.student_id == assessment.student_id)
                    .where(Progress.objective_id == assessment.objective_id)
                )
                progress = progress_result.scalar_one_or_none()

                if progress:
                    progress.mastery_level = MasteryLevel.MASTERED.value
                    progress.assessment_ids = progress.assessment_ids + [assessment.id]
                else:
                    progress = Progress(
                        student_id=assessment.student_id,
                        objective_id=assessment.objective_id,
                        mastery_level=MasteryLevel.MASTERED.value,
                        assessment_ids=[assessment.id],
                    )
                    self.db.add(progress)

                mastery_updated = True
                new_mastery_level = MasteryLevel.MASTERED.value
        else:
            # Update progress to practicing if not already mastered
            progress_result = await self.db.execute(
                select(Progress)
                .where(Progress.student_id == assessment.student_id)
                .where(Progress.objective_id == assessment.objective_id)
            )
            progress = progress_result.scalar_one_or_none()

            if progress:
                if progress.mastery_level != MasteryLevel.MASTERED.value:
                    progress.mastery_level = MasteryLevel.PRACTICING.value
                    progress.assessment_ids = progress.assessment_ids + [assessment.id]
                    new_mastery_level = MasteryLevel.PRACTICING.value
            else:
                progress = Progress(
                    student_id=assessment.student_id,
                    objective_id=assessment.objective_id,
                    mastery_level=MasteryLevel.PRACTICING.value,
                    assessment_ids=[assessment.id],
                )
                self.db.add(progress)
                new_mastery_level = MasteryLevel.PRACTICING.value

        await self.db.commit()

        return {
            "score": score,
            "passed_without_hints": passed_without_hints,
            "mastery_updated": mastery_updated,
            "new_mastery_level": new_mastery_level,
        }

    async def get_mastery_status(
        self,
        student_id: str,
        objective_id: str,
    ) -> dict:
        """Get mastery status for an objective."""
        # Get clean passes
        result = await self.db.execute(
            select(MasteryAttempt)
            .where(MasteryAttempt.student_id == student_id)
            .where(MasteryAttempt.objective_id == objective_id)
            .where(MasteryAttempt.passed_clean == True)
        )
        clean_attempts = result.scalars().all()
        unique_dates = set(a.attempt_date for a in clean_attempts)

        # Get current progress level
        progress_result = await self.db.execute(
            select(Progress)
            .where(Progress.student_id == student_id)
            .where(Progress.objective_id == objective_id)
        )
        progress = progress_result.scalar_one_or_none()
        current_level = progress.mastery_level if progress else MasteryLevel.NOT_STARTED.value

        # Check if can achieve mastery today
        can_achieve = len(unique_dates) >= 1 and date.today() not in unique_dates

        return {
            "objective_id": objective_id,
            "current_level": current_level,
            "clean_passes": len(unique_dates),
            "passes_needed": 2,
            "can_achieve_mastery": can_achieve,
            "attempts": [
                {
                    "id": a.id,
                    "assessment_id": a.assessment_id,
                    "passed_clean": a.passed_clean,
                    "attempt_date": str(a.attempt_date),
                }
                for a in clean_attempts
            ],
        }
```

**Step 2: Install SymPy**

Run: `cd backend && source .venv/bin/activate && pip install sympy && pip freeze | grep -i sympy >> requirements.txt`

**Step 3: Verify service imports**

Run: `cd backend && source .venv/bin/activate && python -c "from src.app.services.assessment import AssessmentService; print('OK')"`
Expected: OK

**Step 4: Commit**

```bash
git add backend/src/app/services/assessment.py backend/requirements.txt
git commit -m "feat: add assessment service with AI generation and grading"
```

---

## Phase 3b.3: Assessment API

### Task 6: Create Assessment Router

**Files:**
- Create: `backend/src/app/api/assessment.py`
- Modify: `backend/src/app/main.py`

**Step 1: Create assessment router**

Create `backend/src/app/api/assessment.py`:
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.app.auth.dependencies import get_current_user
from src.app.db.base import get_db
from src.app.models import User, Assessment, LearningObjective, StudentProfile, Unit, Curriculum
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
```

**Step 2: Register router in main.py**

Add to `backend/src/app/main.py`:
```python
from src.app.api.assessment import router as assessment_router

# Add with other routers:
app.include_router(assessment_router, prefix="/api")
```

**Step 3: Verify backend runs**

Run: `cd backend && source .venv/bin/activate && python -c "from src.app.main import app; print('OK')"`
Expected: OK

**Step 4: Commit**

```bash
git add backend/src/app/api/assessment.py backend/src/app/main.py
git commit -m "feat: add assessment API endpoints"
```

---

## Phase 3b.4: Frontend - Quiz Taking

### Task 7: Create Take Quiz Page

**Files:**
- Create: `frontend/src/pages/TakeQuiz.tsx`
- Modify: `frontend/src/App.tsx`

**Step 1: Create TakeQuiz page**

Create `frontend/src/pages/TakeQuiz.tsx`:
```tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

interface Question {
  id: string
  question_type: string
  question_text: string
  options: string[] | null
  order: number
}

interface Assessment {
  id: string
  objective_id: string
  student_id: string
  status: string
  questions: Question[]
}

interface SubmitResult {
  is_correct: boolean
  hints_used: number
  hint: string | null
  feedback: string | null
  show_answer: boolean
  correct_answer: string | null
}

export function TakeQuiz() {
  const { objectiveId } = useParams<{ objectiveId: string }>()
  const [searchParams] = useSearchParams()
  const studentId = searchParams.get('student')
  const navigate = useNavigate()
  const { user } = useAuth()

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false)
  const [finalResult, setFinalResult] = useState<{
    score: number
    passed_without_hints: boolean
    mastery_updated: boolean
    new_mastery_level: string | null
  } | null>(null)

  useEffect(() => {
    if (user && objectiveId && studentId) {
      generateAssessment()
    }
  }, [user, objectiveId, studentId])

  const generateAssessment = async () => {
    try {
      const response = await api.post('/api/assessments/generate', {
        objective_id: objectiveId,
        student_id: studentId,
      })
      setAssessment(response.data)
    } catch (err) {
      setError('Failed to generate quiz')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!assessment || !answer.trim()) return

    setSubmitting(true)
    setError('')

    try {
      const currentQuestion = assessment.questions[currentQuestionIndex]
      const response = await api.post(`/api/assessments/${assessment.id}/submit`, {
        question_id: currentQuestion.id,
        answer: answer.trim(),
      })
      setResult(response.data)
    } catch (err) {
      setError('Failed to submit answer')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleNext = () => {
    if (currentQuestionIndex < assessment!.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setAnswer('')
      setResult(null)
    } else {
      completeAssessment()
    }
  }

  const handleRetry = () => {
    setAnswer('')
    setResult(null)
  }

  const completeAssessment = async () => {
    if (!assessment) return

    try {
      const response = await api.post(`/api/assessments/${assessment.id}/complete`)
      setFinalResult(response.data)
      setCompleted(true)
    } catch (err) {
      setError('Failed to complete assessment')
      console.error(err)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--color-brown-light)' }}>Please sign in to take quizzes.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--color-brown-light)' }}>Generating quiz questions...</p>
      </div>
    )
  }

  if (error && !assessment) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--color-coral)' }}>{error}</p>
      </div>
    )
  }

  if (completed && finalResult) {
    const percentage = Math.round(finalResult.score * 100)
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-8">
          <h2 className="font-display text-2xl font-bold mb-4" style={{ color: 'var(--color-brown)' }}>
            Quiz Complete!
          </h2>
          <div
            className="text-5xl font-bold mb-4"
            style={{ color: percentage >= 80 ? 'var(--color-forest)' : 'var(--color-amber)' }}
          >
            {percentage}%
          </div>
          <p style={{ color: 'var(--color-brown-light)' }} className="mb-2">
            {finalResult.passed_without_hints
              ? 'Passed without hints!'
              : 'Good effort! Try again for a clean pass.'}
          </p>
          {finalResult.mastery_updated && (
            <p style={{ color: 'var(--color-forest)' }} className="font-semibold mb-4">
              Mastery level updated to: {finalResult.new_mastery_level}
            </p>
          )}
          <div className="flex gap-4 justify-center mt-6">
            <button
              onClick={() => navigate('/curricula')}
              className="btn btn-ghost"
            >
              Back to Curricula
            </button>
            <button
              onClick={() => navigate('/progress')}
              className="btn btn-primary"
            >
              View Progress
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!assessment) return null

  const currentQuestion = assessment.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === assessment.questions.length - 1

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2" style={{ color: 'var(--color-brown-light)' }}>
          <span>Question {currentQuestionIndex + 1} of {assessment.questions.length}</span>
          <span>{currentQuestion.question_type.replace('_', ' ')}</span>
        </div>
        <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--color-cream-dark)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${((currentQuestionIndex + 1) / assessment.questions.length) * 100}%`,
              backgroundColor: 'var(--color-forest)',
            }}
          />
        </div>
      </div>

      <div className="card">
        {/* Question */}
        <h2 className="text-lg font-medium mb-6" style={{ color: 'var(--color-brown)' }}>
          {currentQuestion.question_text}
        </h2>

        {/* Answer input */}
        {!result && (
          <div className="space-y-4">
            {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options ? (
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setAnswer(option.charAt(0))}
                    className="w-full p-4 text-left rounded-lg border transition-colors"
                    style={{
                      borderColor: answer === option.charAt(0)
                        ? 'var(--color-forest)'
                        : 'var(--color-cream-dark)',
                      backgroundColor: answer === option.charAt(0)
                        ? 'rgba(27, 67, 50, 0.08)'
                        : 'white',
                      color: 'var(--color-brown)',
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type={currentQuestion.question_type === 'numeric' ? 'number' : 'text'}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={
                  currentQuestion.question_type === 'numeric'
                    ? 'Enter a number'
                    : currentQuestion.question_type === 'equation'
                    ? 'Enter your answer (e.g., 5x or x+2)'
                    : 'Type your answer'
                }
                className="w-full px-4 py-3 rounded-lg border"
                style={{
                  borderColor: 'var(--color-cream-dark)',
                  color: 'var(--color-brown)',
                }}
              />
            )}

            <button
              onClick={handleSubmit}
              disabled={!answer.trim() || submitting}
              className="w-full btn btn-primary py-3"
              style={{ opacity: !answer.trim() || submitting ? 0.7 : 1 }}
            >
              {submitting ? 'Checking...' : 'Submit Answer'}
            </button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: result.is_correct
                  ? 'rgba(27, 67, 50, 0.1)'
                  : 'rgba(231, 111, 81, 0.1)',
              }}
            >
              <p
                className="font-semibold"
                style={{ color: result.is_correct ? 'var(--color-forest)' : 'var(--color-coral)' }}
              >
                {result.is_correct ? 'Correct!' : 'Not quite right'}
              </p>
              {result.feedback && (
                <p className="mt-2 text-sm" style={{ color: 'var(--color-brown-light)' }}>
                  {result.feedback}
                </p>
              )}
              {result.hint && (
                <p className="mt-2" style={{ color: 'var(--color-brown)' }}>
                  <strong>Hint:</strong> {result.hint}
                </p>
              )}
              {result.show_answer && (
                <p className="mt-2" style={{ color: 'var(--color-brown)' }}>
                  <strong>Answer:</strong> {result.correct_answer}
                </p>
              )}
            </div>

            <div className="flex gap-4">
              {!result.is_correct && !result.show_answer && (
                <button onClick={handleRetry} className="flex-1 btn btn-ghost">
                  Try Again
                </button>
              )}
              <button onClick={handleNext} className="flex-1 btn btn-primary">
                {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4" style={{ color: 'var(--color-coral)' }}>{error}</p>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Add route to App.tsx**

Add import and route to `frontend/src/App.tsx`:
```tsx
import { TakeQuiz } from './pages/TakeQuiz'

// Add route:
<Route path="quiz/:objectiveId" element={<TakeQuiz />} />
```

**Step 3: Verify frontend compiles**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add frontend/src/pages/TakeQuiz.tsx frontend/src/App.tsx
git commit -m "feat: add quiz taking page with hints support"
```

---

### Task 8: Create Assessment History Page

**Files:**
- Create: `frontend/src/pages/AssessmentHistory.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/layouts/MainLayout.tsx`

**Step 1: Create AssessmentHistory page**

Create `frontend/src/pages/AssessmentHistory.tsx`:
```tsx
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

interface AssessmentItem {
  id: string
  objective_id: string
  objective_title: string
  status: string
  score: number | null
  passed_without_hints: boolean
  created_at: string
}

interface Student {
  id: string
  name: string
}

export function AssessmentHistory() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [assessments, setAssessments] = useState<AssessmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      loadStudents()
    }
  }, [user])

  useEffect(() => {
    if (selectedStudent) {
      loadAssessments()
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
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  const loadAssessments = async () => {
    try {
      const response = await api.get(`/api/assessments/student/${selectedStudent}`)
      setAssessments(response.data)
    } catch (err) {
      setError('Failed to load assessments')
      console.error(err)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--color-brown-light)' }}>Please sign in to view assessments.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--color-brown-light)' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--color-brown)' }}>
          Assessment History
        </h1>
        {students.length > 1 && (
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="px-4 py-2 rounded-lg border"
            style={{ borderColor: 'var(--color-cream-dark)', color: 'var(--color-brown)' }}
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && <div className="mb-4" style={{ color: 'var(--color-coral)' }}>{error}</div>}

      {assessments.length === 0 ? (
        <div className="card text-center py-12">
          <p style={{ color: 'var(--color-brown-light)' }}>No assessments taken yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assessments.map((assessment) => {
            const score = assessment.score !== null ? Math.round(assessment.score * 100) : null
            return (
              <div key={assessment.id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--color-brown)' }}>
                      {assessment.objective_title}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--color-brown-light)' }}>
                      {new Date(assessment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {score !== null ? (
                      <>
                        <p
                          className="text-2xl font-bold"
                          style={{ color: score >= 80 ? 'var(--color-forest)' : 'var(--color-amber)' }}
                        >
                          {score}%
                        </p>
                        {assessment.passed_without_hints && (
                          <span
                            className="text-xs px-2 py-1 rounded"
                            style={{ backgroundColor: 'rgba(27, 67, 50, 0.1)', color: 'var(--color-forest)' }}
                          >
                            Clean Pass
                          </span>
                        )}
                      </>
                    ) : (
                      <span
                        className="text-sm px-2 py-1 rounded"
                        style={{ backgroundColor: 'var(--color-cream-dark)', color: 'var(--color-brown-light)' }}
                      >
                        {assessment.status}
                      </span>
                    )}
                  </div>
                </div>
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
import { AssessmentHistory } from './pages/AssessmentHistory'

// Add route:
<Route path="assessments" element={<AssessmentHistory />} />
```

Update `frontend/src/layouts/MainLayout.tsx` NAV_ITEMS:
```tsx
{ path: '/assessments', label: 'Assessments', icon: '✓' },
```

**Step 3: Verify frontend compiles**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add frontend/src/pages/AssessmentHistory.tsx frontend/src/App.tsx frontend/src/layouts/MainLayout.tsx
git commit -m "feat: add assessment history page"
```

---

### Task 9: Update Curriculum Detail with Quiz Buttons

**Files:**
- Modify: `frontend/src/pages/CurriculumDetail.tsx`

**Step 1: Add quiz buttons to objectives**

Update the objective list item in `frontend/src/pages/CurriculumDetail.tsx` to include a "Take Quiz" button. In the `<li>` element that displays objectives, add a Link:

```tsx
import { Link } from 'react-router-dom'

// Update the objective display to include quiz button:
<li key={obj.id} className="flex items-start justify-between gap-3">
  <div className="flex items-start gap-3">
    <span
      className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
      style={{ backgroundColor: 'var(--color-forest)' }}
    />
    <div>
      <p className="font-medium" style={{ color: 'var(--color-brown)' }}>
        {obj.title}
      </p>
      {obj.description && (
        <p className="text-sm" style={{ color: 'var(--color-brown-light)' }}>
          {obj.description}
        </p>
      )}
      {obj.standard_codes.length > 0 && (
        <p className="text-xs mt-1" style={{ color: 'var(--color-brown-light)', opacity: 0.7 }}>
          Standards: {obj.standard_codes.join(', ')}
        </p>
      )}
    </div>
  </div>
  <Link
    to={`/quiz/${obj.id}?student=${curriculum.student_id}`}
    className="btn btn-ghost text-sm flex-shrink-0"
    style={{ color: 'var(--color-forest)' }}
  >
    Take Quiz
  </Link>
</li>
```

Note: Need to also add `student_id` to the Curriculum interface and fetch.

**Step 2: Update CurriculumResponse interface**

Add `student_id` to the Curriculum interface if not already present.

**Step 3: Verify frontend compiles**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add frontend/src/pages/CurriculumDetail.tsx
git commit -m "feat: add quiz buttons to curriculum objectives"
```

---

## Summary

**Phase 3b Implementation:**

| Task | Description | Files |
|------|-------------|-------|
| 1 | Assessment models | `models/assessment.py` |
| 2 | Database migration | `alembic/versions/` |
| 3 | Assessment schemas | `schemas/assessment.py` |
| 4 | Generation prompts | `ai/prompts.py` |
| 5 | Assessment service | `services/assessment.py` |
| 6 | Assessment API | `api/assessment.py`, `main.py` |
| 7 | Take Quiz page | `pages/TakeQuiz.tsx` |
| 8 | Assessment History | `pages/AssessmentHistory.tsx` |
| 9 | Curriculum integration | `pages/CurriculumDetail.tsx` |

**Total: 9 tasks, ~9 commits**
