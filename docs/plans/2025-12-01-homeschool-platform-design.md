# Homeschool Platform Design

## Product Vision & Positioning

**What it is:** An AI-powered homeschool platform for grades 6-12 that acts as a teaching partner for the whole family — tutoring students directly, reducing parent workload, and providing visibility into learning progress.

**Core thesis:** LLMs have crossed the threshold to be genuinely useful educators. The timing is now.

**The problem:** Homeschooling demands one adult (almost always the mother) to simultaneously be full-time teacher, curriculum designer, administrator, counselor, and enrichment coordinator while still running a household. Most parents have no formal training, limited money, and no institutional backup. The result is chronic exhaustion, persistent self-doubt, mounting financial pressure, and for some families, damage to education, relationships, or both.

**Target users:**
- **Teaching parent** (usually mom) — needs workload relief, curriculum help, and confidence that learning is happening
- **Student** — needs a patient, always-available tutor that adapts to them
- **Family unit** — including non-teaching spouse who needs visibility without being the bottleneck

**What makes it different from raw ChatGPT:**
- Curriculum-aware (knows what to teach, in what order)
- Persistent memory (remembers this student's history and learning style)
- Structured pedagogy (teaches, doesn't just answer)
- Parent visibility (progress reports, struggle alerts)
- Guardrails (age-appropriate, won't do homework for them)

**MVP scope:** Full AI suite — tutor, parent assistant, evaluator — for all subjects, grades 6-12. No human expert marketplace yet. Web app.

**Business model:** 30-day full trial, then subscription (freemium with conversion).

---

## User Experiences

### The Student Experience

The student opens the app and sees their learning dashboard — today's subjects, recent progress, and a clear "Start Learning" path.

**Learning flow:**
1. Student selects a subject (or follows their schedule)
2. AI tutor engages in a teaching conversation — explains concepts, asks questions, gives practice problems
3. AI adapts in real-time: if student struggles, it slows down and tries different explanations; if they're breezing through, it moves faster
4. Session ends with a summary: what was covered, what was mastered, what needs more work
5. Progress is automatically logged — no manual entry by parent

**Key AI behaviors:**
- Socratic method — asks questions to guide understanding, doesn't just lecture
- Catches "I don't know" loops — if a student is stuck, pivots approach rather than repeating
- Won't do homework for them — teaches how to solve, doesn't give answers
- Encourages without being saccharine — genuine, not condescending

**Between sessions:**
- Student can ask questions anytime ("I'm stuck on this problem")
- AI remembers context from previous sessions
- Spaced repetition surfaces material that needs review

### The Parent Experience

**Daily view:**
Parent opens the app and sees a dashboard answering: "What's happening with my kids' education today?"
- Today's schedule — what each student is working on
- Recent activity — sessions completed, time spent, subjects covered
- Alerts — struggles detected, milestones reached, gaps forming
- Quick actions — adjust schedule, review a session, send encouragement

**Curriculum planning (AI-assisted):**
Instead of spending hours researching curricula, the parent tells the AI:
- "My 8th grader needs to cover Algebra 1 this year"
- "She's strong in reading but struggles with writing"
- "We want to include world history and biology"

The AI generates a year plan: scope, sequence, pacing — mapped to standards if desired. Parent can adjust, approve, or ask for alternatives.

**Progress & evaluation:**
- Weekly summaries — emailed or in-app, no effort required
- Skill mastery tracking — visual map of what's learned vs. gaps
- Objective assessments — periodic evaluations that give real data, not just "completed lesson"
- Transcript-ready records — especially for high schoolers, tracks credits and grades

**The key promise:** The parent should be able to step back from hour-by-hour teaching and into an oversight role — reviewing, adjusting, encouraging — rather than doing all the work themselves.

### Family Visibility (Non-Teaching Spouse)

**The problem this solves:**
In most homeschool families, one parent carries the entire mental load. The other parent is supportive but disconnected — they don't know what's being taught, how kids are doing, or how to help.

**The family dashboard:**
- Weekly digest — email summary of what each kid learned, struggles, wins
- Real-time access — can log in anytime to see current progress
- Conversation starters — "Ask Sarah about the essay she wrote on the Industrial Revolution"
- Milestone celebrations — notifications when a student masters something significant

**Shared responsibility features:**
- Substitute mode — if the teaching parent is sick or traveling, the other parent can see today's plan and keep things moving
- Encouragement prompts — suggests ways the non-teaching parent can be involved

---

## AI Architecture

### Three AI Functions, One Unified System

**1. AI Tutor (Student-Facing)**
- Conversational teaching interface
- Subject-matter expertise across all 6-12 subjects
- Adapts to student's level, pace, and learning style
- Maintains session context and long-term memory of student's history

**2. AI Assistant (Parent-Facing)**
- Curriculum planning and scheduling
- Answers parent questions ("Is this normal?" "What should we do about this gap?")
- Drafts lesson plans, suggests resources
- Helps with administrative tasks (transcript generation, record-keeping)

**3. AI Evaluator (System-Wide)**
- Assesses student understanding during and after sessions
- Identifies knowledge gaps and misconceptions
- Generates periodic assessments (quizzes, tests, written evaluations)
- Provides objective data — not just "lesson completed" but "demonstrated mastery of X"

### Shared Context Layer

All three functions share:
- **Student profile** — learning history, strengths, weaknesses, preferences
- **Curriculum map** — what should be learned, what has been covered
- **Family context** — goals, schedule constraints, values

This means the tutor knows what the parent planned, the evaluator knows what the tutor taught, and the assistant knows what the evaluator found.

### LLM Strategy

- Primary model: modern LLM (Claude, GPT-4 class) for teaching and reasoning
- Consider fine-tuning or RAG for curriculum-specific knowledge
- Structured outputs for progress tracking and evaluation data

---

## Technical Architecture

### Web Application Stack

**Frontend:**
- React or Next.js — component-based, good ecosystem
- Three distinct interfaces: Student, Parent, Family dashboards
- Real-time updates for progress and alerts
- Responsive design (works on tablets, but not mobile-optimized yet)

**Backend:**
- Node.js/TypeScript or Python (FastAPI) — developer preference
- RESTful API + WebSockets for real-time AI conversations
- Background jobs for: generating summaries, running evaluations, sending digests

**Database:**
- PostgreSQL — relational data for users, families, curriculum, progress
- Vector database (Pinecone, pgvector) — for RAG, storing curriculum content, student learning history for semantic search

**AI Integration:**
- LLM API (Anthropic Claude or OpenAI) — core reasoning
- Conversation management — maintain session state, inject relevant context
- Prompt engineering layer — different system prompts for tutor vs. assistant vs. evaluator roles
- Token management — balance context length with cost

### Key Technical Challenges

1. **Context management** — keeping AI aware of student history without exploding token costs
2. **Evaluation reliability** — AI assessments need to be consistent and trustworthy
3. **Conversation memory** — sessions can be long; need to summarize and retrieve effectively
4. **Multi-tenant isolation** — families' data must be strictly separated

---

## Data Model

### Core Entities

**Family**
- Account owner, billing, subscription status
- Family-level settings and preferences

**User**
- Belongs to a family
- Role: `teaching_parent`, `student`, `family_member`
- Auth credentials, profile info

**Student** (extends User)
- Grade level
- Learning profile (strengths, weaknesses, preferences, accommodations)
- Linked to curriculum and progress

**Curriculum**
- Per-student, per-subject yearly plans
- Broken into units → lessons → learning objectives
- Maps to standards (optional: Common Core, state standards)
- Pacing/schedule

**Session**
- A learning conversation between student and AI tutor
- Subject, duration, transcript (stored or summarized)
- Learning objectives addressed

**Progress**
- Per-student, per-learning-objective
- Status: not started, in progress, practiced, mastered
- Evidence: linked sessions, assessments

**Assessment**
- Formal evaluation (quiz, test, written work)
- AI-generated or parent-created
- Score/rubric, linked to objectives

**Alert**
- System-generated notifications
- Types: struggle detected, milestone reached, gap forming, review needed
- Targets: parent, family member, or both

---

## Curriculum & Content Strategy

### The Content Problem

AI can teach, but it needs to know *what* to teach. You need:
- Scope and sequence for every subject, grades 6-12
- Learning objectives that are specific and assessable
- Alignment to standards (for families who want it)
- Quality control — AI shouldn't teach something incorrectly

### Recommended Approach (OER + Standards Hybrid)

- Use open educational resources (Khan Academy, OpenStax, CK-12) to define scope and sequence
- Map to standards to validate coverage
- Let AI generate the actual teaching conversations
- Build a review/feedback loop to catch errors

This gets to market without licensing costs or years of content creation.

---

## Safety, Guardrails & Compliance

### Student Safety

**AI guardrails:**
- Age-appropriate language and content
- Won't discuss violence, self-harm, or inappropriate topics
- Redirects off-topic conversations back to learning
- Detects signs of distress and alerts parents
- Won't provide "do my homework" answers — teaches process, not solutions

**Academic integrity:**
- AI tracks whether student is learning vs. gaming the system
- Detects patterns like: copy-pasting answers, skipping explanations, rushing through
- Reports concerns to parents

### Data Privacy & Compliance

**COPPA (Children's Online Privacy Protection Act):**
- Students under 13 require parental consent (grades 6-8)
- Minimize data collection on minors
- Parent controls what data is stored/shared

**Data security:**
- Encryption at rest and in transit
- Family data isolation (multi-tenant)
- Clear data retention and deletion policies
- GDPR compliance if serving EU families

---

## Post-MVP: Human Expert Marketplace

After MVP proves the AI-only model works, add human experts to fill gaps:

**Expert types:**
- Certified teachers (subject specialists)
- Tutors (college students, retired teachers)
- Specialists (speech therapy, occupational therapy, counselors)
- Co-op organizers (local community builders)

**Use cases:**
- Specialized subjects — AP courses, music lessons, foreign language conversation, lab sciences
- Special needs support — learning disabilities, gifted students, accommodations
- Accountability — periodic check-ins with real educators
- Community — group classes, co-ops, social learning
- Crisis support — when a family is struggling

**Marketplace model:**
- Experts set their own rates and availability
- Families browse, book, and pay through platform
- Platform takes percentage (15-25%)
- AI recommends experts based on student needs

---

## Risks & Mitigations

### Technical Risks

| Risk | Mitigation |
|------|------------|
| AI teaches something wrong | Human review of common topics, feedback loop, parent oversight |
| AI inconsistency | Structured prompts, temperature control, evaluation framework |
| Context window limits | Summarization strategies, selective retrieval, tiered memory |
| LLM costs at scale | Caching, smaller models for simple tasks, usage limits |

### Business Risks

| Risk | Mitigation |
|------|------------|
| Low trial-to-paid conversion | Nail value prop in 30 days, track engagement |
| Competition | Move fast, focus on parent experience, build trust |
| Niche market | Start niche, prove model, expand to tutoring supplement |
| Trust barrier | Transparency, parent visibility, build reputation |

---

## Open Questions

1. **Pricing**: What's the right subscription price? ($30/mo? $100/mo? Per-student?)
2. **Subject depth**: How deep on each subject? Comprehensive or "good enough"?
3. **Offline access**: Do families need to work without internet?
4. **Validation**: How to test with real homeschool families before building?

---

## Next Steps

1. Validate assumptions with real homeschool families
2. Research existing competitors more deeply
3. Define MVP feature set in detail
4. Create implementation plan
5. Set up development environment and begin building
