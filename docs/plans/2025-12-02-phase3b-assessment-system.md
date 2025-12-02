# Phase 3b: Assessment System

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add adaptive per-objective quizzes with hints, supporting multiple question types including math, with threshold-based mastery progression.

**Architecture:** Extend existing FastAPI backend with assessment generation, grading, and mastery tracking. Add React pages for taking quizzes and reviewing history.

**Tech Stack:**
- Backend: Python 3.12, FastAPI, SQLAlchemy (existing)
- Frontend: React 18, TypeScript, TailwindCSS (existing)
- AI: Claude API for question generation and short-answer grading
- Math: SymPy for equation equivalence checking

---

## Core Concept

**Adaptive Per-Objective Quizzes with Hints**

Each learning objective in the curriculum gets a mini-assessment (3-5 questions). When a student feels ready, they take the quiz for that specific objective. The system uses a supportive multi-attempt approach:

- **First attempt**: Student answers the question
- **If wrong**: System provides a hint, student tries again
- **If still wrong**: System provides a stronger hint or the answer with explanation
- **Tracking**: Record whether answered correctly without hints, with hints, or failed

**Question Types:**
- Multiple choice (4 options)
- Short answer (AI-graded with confidence score)
- Numeric input (for math - exact or range matching)
- Equation input (for algebra - symbolic comparison)

**Progress Updates (threshold-based):**
- Pass without hints → counts as a "mastery attempt"
- Need 2 mastery attempts on different days → objective marked "mastered"
- Pass with hints → stays at "practicing"
- Fail after hints → stays at "introduced" or drops back

---

## Data Model

### New Tables

**Assessment** - A generated quiz for an objective
- `id` (UUID, PK)
- `objective_id` (FK → LearningObjective)
- `student_id` (FK → StudentProfile)
- `status` (enum: not_started, in_progress, completed)
- `score` (float, 0-1, nullable)
- `passed_without_hints` (boolean)
- `created_at`, `completed_at`

**Question** - Individual question in an assessment
- `id` (UUID, PK)
- `assessment_id` (FK → Assessment)
- `question_type` (enum: multiple_choice, short_answer, numeric, equation)
- `question_text` (text)
- `options` (JSONB, for MCQ: ["A", "B", "C", "D"])
- `correct_answer` (text)
- `hint_1`, `hint_2` (text)
- `order` (int)

**Response** - Student's answer to a question
- `id` (UUID, PK)
- `question_id` (FK → Question)
- `student_answer` (text)
- `is_correct` (boolean)
- `hints_used` (int, 0-2)
- `ai_feedback` (text, for short answers)
- `created_at`

**MasteryAttempt** - Track threshold attempts
- `id` (UUID, PK)
- `student_id` (FK → StudentProfile)
- `objective_id` (FK → LearningObjective)
- `assessment_id` (FK → Assessment)
- `passed_clean` (boolean - no hints used)
- `attempt_date` (date)

---

## AI Question Generation & Grading

### Question Generation Flow

When student starts a quiz for an objective:
1. Send to Claude: objective title, description, standard codes, subject, grade level
2. Request: 4-5 questions with specified type mix (2 MCQ, 1-2 short answer, 1 numeric if math)
3. Each question includes: text, correct answer, two progressive hints
4. Store generated questions in database

### Grading Logic by Type

| Type | Auto-Grade | Method |
|------|------------|--------|
| Multiple Choice | Yes | Exact match |
| Numeric | Yes | Exact or within tolerance (e.g., ±0.01) |
| Equation | Yes | Symbolic equivalence via SymPy (2x+4 = 4+2x) |
| Short Answer | Partial | AI grades with confidence 0-1. If confidence < 0.8, flag for parent review |

### Hint System

- Hint 1: Gentle nudge (e.g., "Think about what happens when...")
- Hint 2: Stronger clue (e.g., "The formula you need is...")
- After hint 2 fails: Show answer with full explanation

### Short Answer AI Grading Prompt

```
Question: {question}
Expected answer: {correct_answer}
Student answer: {student_answer}

Is this answer correct? Consider partial credit for partially correct answers.
Respond: {"correct": true/false, "confidence": 0.0-1.0, "feedback": "..."}
```

---

## API Endpoints

### Assessment Management

- `POST /api/assessments/generate` - Generate quiz for an objective
  - Body: `{ objective_id, student_id }`
  - Returns: Assessment with questions (no answers/hints yet)

- `GET /api/assessments/{id}` - Get assessment with questions
- `GET /api/assessments/student/{student_id}` - List all assessments for student
- `GET /api/assessments/objective/{objective_id}` - Assessment history for objective

### Taking the Quiz

- `POST /api/assessments/{id}/submit` - Submit answer for a question
  - Body: `{ question_id, answer }`
  - Returns: `{ is_correct, hint (if wrong), feedback }`

- `POST /api/assessments/{id}/use-hint` - Request next hint
  - Body: `{ question_id }`
  - Returns: `{ hint_text, hints_remaining }`

- `POST /api/assessments/{id}/complete` - Finish assessment
  - Calculates score, updates mastery attempts
  - Returns: `{ score, passed_without_hints, mastery_updated }`

### Progress Integration

- `GET /api/mastery/{student_id}/{objective_id}` - Get mastery attempts
  - Returns: `{ attempts: [...], can_achieve_mastery: boolean }`

---

## UI Pages

### New Pages

**1. Objective Quiz Page** (`/assessments/:objectiveId`)
- Shows objective title and description
- "Start Quiz" button generates new assessment
- Question display: one at a time, progress indicator (2/5)
- Answer input based on question type
- Feedback after each answer (correct/incorrect + hint if wrong)
- Final score screen with mastery status update

**2. Assessment History** (`/assessments`)
- List of completed assessments by subject
- Filter by student (for parents)
- Shows: objective, date, score, passed clean (yes/no)
- Click to review answers and feedback

### Updates to Existing Pages

**Curriculum Detail Page:**
- Each objective shows "Take Quiz" button
- Badge showing mastery status and attempt count
- "1 more clean pass needed for mastery" indicator

**Progress Dashboard:**
- Add "Ready to assess" section for objectives at "practicing" level
- Quick-launch quiz buttons

**Student Dashboard:**
- "Prove your skills" widget showing objectives ready for assessment

---

## Implementation Tasks

### Phase 3b.1: Database & Models
1. Create Alembic migration for Assessment, Question, Response, MasteryAttempt tables
2. Add SQLAlchemy models with relationships
3. Add enums for AssessmentStatus and QuestionType

### Phase 3b.2: Assessment Generation
4. Create assessment schemas (Pydantic)
5. Create question generation prompt
6. Create assessment service with generate method
7. Add generate endpoint

### Phase 3b.3: Quiz Taking Flow
8. Add submit answer endpoint with grading logic
9. Add hint request endpoint
10. Add complete assessment endpoint
11. Add mastery attempt tracking and progress updates

### Phase 3b.4: Short Answer & Math Grading
12. Create AI grading service for short answers
13. Add SymPy integration for equation equivalence
14. Add numeric tolerance checking

### Phase 3b.5: Frontend - Quiz Taking
15. Create TakeQuiz page component
16. Add question type renderers (MCQ, short answer, numeric, equation)
17. Add hint display and retry flow
18. Add completion screen with results

### Phase 3b.6: Frontend - History & Integration
19. Create AssessmentHistory page
20. Update CurriculumDetail with quiz buttons
21. Update Progress dashboard with "ready to assess" section

---

## Success Criteria

- Student can generate and take a quiz for any objective
- Questions include mix of types appropriate to subject
- Hints support learning without just giving answers
- Mastery requires 2 clean passes on different days
- Parents can review assessment history and AI-graded answers
- Math equations are graded symbolically (2x = x+x recognized as equivalent)
