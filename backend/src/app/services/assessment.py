import json
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.app.ai.client import get_completion, UTILITY_MODEL
from src.app.ai.prompts import GENERATE_QUESTIONS_PROMPT, GRADE_SHORT_ANSWER_PROMPT
from src.app.models import (
    Assessment, Question, Response, MasteryAttempt,
    LearningObjective, Progress, Unit,
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
                .where(MasteryAttempt.passed_clean == True)  # noqa: E712
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
            .where(MasteryAttempt.passed_clean == True)  # noqa: E712
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
