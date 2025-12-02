# Phase 3a: Curriculum & Progress System

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add AI-generated curriculum planning with full hierarchy (Units → Lessons → Objectives), standards mapping, and session-based progress tracking.

**Architecture:** Extend existing FastAPI backend with curriculum and progress endpoints. Add React pages for curriculum management and progress visualization. Integrate with tutor to track objective mastery during sessions.

**Tech Stack:**
- Backend: Python 3.12, FastAPI, SQLAlchemy (existing)
- Frontend: React 18, TypeScript, TailwindCSS (existing)
- Database: Supabase PostgreSQL (existing)
- AI: Claude API for curriculum generation

---

## Data Model

### New Tables

**Curriculum** - Per student, per subject, per year
- `id` (UUID, PK)
- `student_id` (FK → StudentProfile)
- `subject` (string)
- `year` (string, e.g., "2024-2025")
- `title` (string)
- `description` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Unit** - Major topic area within a curriculum
- `id` (UUID, PK)
- `curriculum_id` (FK → Curriculum)
- `title` (string)
- `description` (text, nullable)
- `sequence_order` (int)
- `target_start_date` (date, nullable)
- `target_end_date` (date, nullable)

**Lesson** - Specific lesson within a unit
- `id` (UUID, PK)
- `unit_id` (FK → Unit)
- `title` (string)
- `description` (text, nullable)
- `sequence_order` (int)

**LearningObjective** - Specific, assessable skill
- `id` (UUID, PK)
- `lesson_id` (FK → Lesson)
- `description` (text)
- `standard_codes` (array of strings, nullable)
- `sequence_order` (int)

**Progress** - Student progress on each objective
- `id` (UUID, PK)
- `student_id` (FK → StudentProfile)
- `objective_id` (FK → LearningObjective)
- `status` (enum: not_started, in_progress, practiced, mastered)
- `evidence_session_ids` (array of UUIDs)
- `updated_at` (timestamp)

**Standard** - Reference data for Common Core standards
- `id` (UUID, PK)
- `code` (string, e.g., "CCSS.MATH.CONTENT.7.EE.A.1")
- `description` (text)
- `subject` (string)
- `grade_level` (int)

---

## AI Curriculum Generation

### Flow

1. Parent opens "Create Curriculum" for a student
2. Parent fills form: subject, grade level, year, goals/notes
3. AI generates full curriculum structure
4. Parent reviews, edits, and approves

### Generation Prompt Strategy

Input:
- Subject
- Grade level
- Year
- Parent goals/notes
- Available standards for subject/grade

Output (structured JSON):
- 6-10 units with pacing dates
- 3-6 lessons per unit
- 2-5 learning objectives per lesson
- Standard codes mapped to objectives

### Standards Data

Seed database with Common Core standards for:
- Mathematics (grades 6-12)
- English Language Arts (grades 6-12)

Other subjects use custom objectives without standard codes initially.

---

## Progress Tracking

### Session Integration

1. Tutor receives curriculum context at session start:
   - Current curriculum for subject
   - Progress on objectives
   - Due objectives based on pacing

2. Tutor focuses on current/upcoming objectives

3. At session end, tutor outputs:
   ```json
   {
     "objectives_practiced": ["obj-uuid-1", "obj-uuid-2"],
     "objectives_showing_mastery": ["obj-uuid-1"]
   }
   ```

4. System updates Progress records:
   - `not_started` → `in_progress` (practiced)
   - `in_progress` → `practiced` (multiple sessions)
   - `practiced` → `mastered` (strong understanding shown)

### Progress Visibility

- Student: current unit, next objectives, progress bar
- Parent: per-student progress across subjects, struggling areas
- Evidence: sessions linked to each Progress record

---

## API Endpoints

### Curriculum CRUD

- `POST /api/curricula` - Create curriculum
- `GET /api/curricula` - List curricula for family
- `GET /api/curricula/:id` - Get full curriculum with hierarchy
- `PUT /api/curricula/:id` - Update curriculum metadata
- `DELETE /api/curricula/:id` - Delete curriculum

### AI Generation

- `POST /api/curricula/generate` - Generate from prompt
- `POST /api/curricula/:id/regenerate-unit` - Regenerate specific unit

### Structure Management

- `POST /api/curricula/:id/units` - Add unit
- `PUT /api/units/:id` - Update unit
- `DELETE /api/units/:id` - Delete unit
- `POST /api/units/:id/lessons` - Add lesson
- `PUT /api/lessons/:id` - Update lesson
- `DELETE /api/lessons/:id` - Delete lesson
- `POST /api/lessons/:id/objectives` - Add objective
- `PUT /api/objectives/:id` - Update objective
- `DELETE /api/objectives/:id` - Delete objective

### Progress

- `GET /api/progress/student/:id` - All progress for student
- `GET /api/progress/student/:id/subject/:subject` - Subject progress
- `PUT /api/progress/:id` - Manual update (parent override)

### Standards

- `GET /api/standards?subject=math&grade=7` - Query standards

---

## UI Pages

### New Pages

1. **Curriculum List** (`/curricula`)
   - All curricula grouped by student
   - "Create Curriculum" button

2. **Create Curriculum** (`/curricula/new`)
   - Form: student, subject, grade, year, goals
   - "Generate with AI" button
   - Loading state during generation

3. **Curriculum Detail** (`/curricula/:id`)
   - Expandable tree: units → lessons → objectives
   - Inline editing
   - Progress indicators per objective
   - Standards codes displayed

4. **Progress Dashboard** (`/progress`)
   - Per-student progress overview
   - Subject cards with % mastery
   - "Needs attention" section

### Updated Pages

- **Student Dashboard** - Current objectives widget
- **Parent Dashboard** - Progress summary per student
- **Learn** - Show current unit/objective context

---

## Implementation Tasks

### Phase 3a.1: Database & Models
1. Create Alembic migration for new tables
2. Add SQLAlchemy models: Curriculum, Unit, Lesson, LearningObjective, Progress, Standard
3. Seed Common Core standards data (Math + ELA, grades 6-12)

### Phase 3a.2: Curriculum CRUD API
4. Create curriculum schemas (Pydantic)
5. Create curriculum router with CRUD endpoints
6. Add unit/lesson/objective management endpoints
7. Add standards query endpoint

### Phase 3a.3: AI Generation
8. Create curriculum generation service
9. Design generation prompt with structured output
10. Add generate endpoint
11. Add regenerate-unit endpoint

### Phase 3a.4: Progress Tracking
12. Create progress schemas and router
13. Integrate progress context into tutor service
14. Update tutor to output objectives practiced
15. Add post-session progress update logic

### Phase 3a.5: Frontend - Curriculum
16. Create CurriculumList page
17. Create CreateCurriculum page with form
18. Create CurriculumDetail page with tree view
19. Add inline editing for curriculum items

### Phase 3a.6: Frontend - Progress
20. Create Progress dashboard page
21. Update Student dashboard with objectives widget
22. Update Parent dashboard with progress summary
23. Update Learn page with curriculum context

---

## Success Criteria

- Parent can generate a full year curriculum with AI in under 2 minutes
- Curriculum has proper hierarchy with standards mapping
- Tutor sessions automatically update objective progress
- Parents can see clear progress visualization per student/subject
- System tracks evidence (sessions) for each objective's progress
