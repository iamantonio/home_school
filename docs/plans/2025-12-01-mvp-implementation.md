# Homeschool Platform MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a working MVP of an AI-powered homeschool platform with student tutoring, parent oversight, and family visibility for grades 6-12.

**Architecture:** Separate FastAPI backend + React frontend. Supabase for auth and PostgreSQL database. OpenAI GPT-5.1 for AI tutoring with GPT-4.1-mini for cost-optimized operations. Real-time chat via WebSockets.

**Tech Stack:**
- Backend: Python 3.12, FastAPI, SQLAlchemy, Alembic
- Frontend: React 18, TypeScript, Vite, TailwindCSS
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth
- AI: OpenAI API (gpt-5.1, gpt-4.1-mini)
- Real-time: WebSockets (FastAPI)

---

## Phase 1: Project Setup

### Task 1.1: Initialize Backend Project

**Files:**
- Create: `backend/`
- Create: `backend/pyproject.toml`
- Create: `backend/src/app/__init__.py`
- Create: `backend/src/app/main.py`

**Step 1: Create backend directory structure**

```bash
mkdir -p backend/src/app
mkdir -p backend/tests
touch backend/src/__init__.py
touch backend/src/app/__init__.py
```

**Step 2: Create pyproject.toml**

Create `backend/pyproject.toml`:
```toml
[project]
name = "homeschool-api"
version = "0.1.0"
description = "AI-powered homeschool platform API"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "sqlalchemy>=2.0.0",
    "alembic>=1.14.0",
    "pydantic>=2.10.0",
    "pydantic-settings>=2.6.0",
    "python-dotenv>=1.0.0",
    "httpx>=0.28.0",
    "openai>=1.57.0",
    "supabase>=2.10.0",
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.7.4",
    "asyncpg>=0.30.0",
    "websockets>=14.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.3.0",
    "pytest-asyncio>=0.24.0",
    "pytest-cov>=6.0.0",
    "ruff>=0.8.0",
    "mypy>=1.13.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]

[tool.ruff]
line-length = 100
target-version = "py312"

[tool.mypy]
python_version = "3.12"
strict = true
```

**Step 3: Create minimal FastAPI app**

Create `backend/src/app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Homeschool Platform API",
    description="AI-powered homeschool platform for grades 6-12",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "healthy"}
```

**Step 4: Create virtual environment and install dependencies**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

**Step 5: Verify the app runs**

```bash
cd backend
source .venv/bin/activate
uvicorn src.app.main:app --reload
```

Expected: Server starts at http://127.0.0.1:8000

**Step 6: Test health endpoint**

```bash
curl http://localhost:8000/health
```

Expected: `{"status":"healthy"}`

**Step 7: Commit**

```bash
git add backend/
git commit -m "feat: initialize FastAPI backend project"
```

---

### Task 1.2: Initialize Frontend Project

**Files:**
- Create: `frontend/` (Vite scaffold)

**Step 1: Create React app with Vite**

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

**Step 2: Install additional dependencies**

```bash
cd frontend
npm install @tanstack/react-query axios react-router-dom @supabase/supabase-js
npm install -D tailwindcss postcss autoprefixer @types/react-router-dom
npx tailwindcss init -p
```

**Step 3: Configure Tailwind**

Update `frontend/tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Step 4: Update CSS**

Replace `frontend/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 5: Create basic App structure**

Replace `frontend/src/App.tsx`:
```tsx
function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Homeschool Platform
          </h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 px-4">
        <p className="text-gray-600">Welcome to your AI-powered learning companion.</p>
      </main>
    </div>
  )
}

export default App
```

**Step 6: Verify frontend runs**

```bash
cd frontend
npm run dev
```

Expected: App runs at http://localhost:5173 with styled header

**Step 7: Commit**

```bash
git add frontend/
git commit -m "feat: initialize React frontend with Vite and Tailwind"
```

---

### Task 1.3: Environment Configuration

**Files:**
- Create: `backend/.env.example`
- Create: `backend/src/app/config.py`
- Create: `frontend/.env.example`

**Step 1: Create backend environment template**

Create `backend/.env.example`:
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
DATABASE_URL=postgresql+asyncpg://postgres:password@db.your-project.supabase.co:5432/postgres

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# App
ENVIRONMENT=development
DEBUG=true
```

**Step 2: Create config module**

Create `backend/src/app/config.py`:
```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_key: str
    database_url: str

    # OpenAI
    openai_api_key: str

    # App
    environment: str = "development"
    debug: bool = True


settings = Settings()  # type: ignore[call-arg]
```

**Step 3: Create frontend environment template**

Create `frontend/.env.example`:
```bash
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Step 4: Add .env to gitignore**

Create `.gitignore` at project root:
```
# Environment
.env
.env.local

# Python
__pycache__/
*.py[cod]
.venv/
*.egg-info/
.pytest_cache/
.mypy_cache/
.ruff_cache/

# Node
node_modules/
dist/

# IDE
.idea/
.vscode/
*.swp

# OS
.DS_Store
```

**Step 5: Commit**

```bash
git add .gitignore backend/.env.example backend/src/app/config.py frontend/.env.example
git commit -m "feat: add environment configuration"
```

---

### Task 1.4: Set Up Supabase Project

**Files:**
- Create: `backend/.env` (local only, not committed)
- Create: `frontend/.env` (local only, not committed)

**Step 1: Create Supabase project**

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Name it "homeschool-platform"
4. Generate a strong database password (save it!)
5. Select region closest to you
6. Wait for project to provision

**Step 2: Get credentials**

1. Go to Project Settings > API
2. Copy the Project URL
3. Copy the anon/public key
4. Copy the service_role key (keep secret!)
5. Go to Project Settings > Database
6. Copy the connection string (Transaction mode)

**Step 3: Create backend .env**

Create `backend/.env` with your actual values:
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...
DATABASE_URL=postgresql+asyncpg://postgres.xxxxx:password@aws-0-region.pooler.supabase.com:6543/postgres

OPENAI_API_KEY=sk-...

ENVIRONMENT=development
DEBUG=true
```

**Step 4: Create frontend .env**

Create `frontend/.env`:
```bash
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

**Step 5: Verify config loads**

```bash
cd backend
source .venv/bin/activate
python -c "from src.app.config import settings; print(settings.supabase_url)"
```

Expected: Prints your Supabase URL

**Step 6: Commit (no secrets)**

```bash
git add -A
git commit -m "docs: add Supabase setup instructions"
```

---

## Phase 2: Database Schema

### Task 2.1: Set Up SQLAlchemy and Alembic

**Files:**
- Create: `backend/src/app/db/__init__.py`
- Create: `backend/src/app/db/base.py`
- Create: `backend/alembic.ini`
- Create: `backend/alembic/`

**Step 1: Create database module**

```bash
mkdir -p backend/src/app/db
touch backend/src/app/db/__init__.py
```

**Step 2: Create base model**

Create `backend/src/app/db/base.py`:
```python
from datetime import datetime
from typing import Any
from uuid import uuid4

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.asyncio import AsyncAttrs, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from src.app.config import settings


class Base(AsyncAttrs, DeclarativeBase):
    """Base class for all database models."""

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid4()),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


engine = create_async_engine(settings.database_url, echo=settings.debug)
async_session = async_sessionmaker(engine, expire_on_commit=False)


async def get_db():
    """Dependency for getting database sessions."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

**Step 3: Initialize Alembic**

```bash
cd backend
source .venv/bin/activate
alembic init alembic
```

**Step 4: Configure Alembic**

Update `backend/alembic/env.py` (replace entire file):
```python
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from src.app.config import settings
from src.app.db.base import Base

# Import all models so Alembic can detect them
from src.app.models import *  # noqa: F401, F403

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

**Step 5: Create models directory**

```bash
mkdir -p backend/src/app/models
touch backend/src/app/models/__init__.py
```

**Step 6: Commit**

```bash
git add backend/src/app/db backend/alembic.ini backend/alembic backend/src/app/models
git commit -m "feat: set up SQLAlchemy and Alembic"
```

---

### Task 2.2: Create Core Models

**Files:**
- Create: `backend/src/app/models/family.py`
- Create: `backend/src/app/models/user.py`
- Create: `backend/src/app/models/student.py`
- Modify: `backend/src/app/models/__init__.py`

**Step 1: Create Family model**

Create `backend/src/app/models/family.py`:
```python
from enum import Enum

from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.app.db.base import Base


class SubscriptionStatus(str, Enum):
    TRIAL = "trial"
    ACTIVE = "active"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class Family(Base):
    __tablename__ = "families"

    name: Mapped[str] = mapped_column(String(255))
    subscription_status: Mapped[str] = mapped_column(
        String(50), default=SubscriptionStatus.TRIAL.value
    )
    trial_ends_at: Mapped[str | None] = mapped_column(String(50), nullable=True)
    settings: Mapped[dict] = mapped_column(JSONB, default=dict)

    # Relationships
    users: Mapped[list["User"]] = relationship(back_populates="family")
```

**Step 2: Create User model**

Create `backend/src/app/models/user.py`:
```python
from enum import Enum

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.app.db.base import Base


class UserRole(str, Enum):
    TEACHING_PARENT = "teaching_parent"
    STUDENT = "student"
    FAMILY_MEMBER = "family_member"


class User(Base):
    __tablename__ = "users"

    # Supabase auth user id
    auth_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(50))

    # Family relationship
    family_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("families.id"))
    family: Mapped["Family"] = relationship(back_populates="users")

    # Student profile (if role is student)
    student_profile: Mapped["StudentProfile | None"] = relationship(
        back_populates="user", uselist=False
    )
```

**Step 3: Create StudentProfile model**

Create `backend/src/app/models/student.py`:
```python
from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.app.db.base import Base


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id"), unique=True
    )
    grade_level: Mapped[int] = mapped_column(Integer)  # 6-12

    # Learning profile
    strengths: Mapped[list[str]] = mapped_column(JSONB, default=list)
    weaknesses: Mapped[list[str]] = mapped_column(JSONB, default=list)
    learning_preferences: Mapped[dict] = mapped_column(JSONB, default=dict)
    accommodations: Mapped[list[str]] = mapped_column(JSONB, default=list)

    # Notes
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="student_profile")
    sessions: Mapped[list["Session"]] = relationship(back_populates="student")
    progress_records: Mapped[list["Progress"]] = relationship(back_populates="student")
```

**Step 4: Update models __init__.py**

Update `backend/src/app/models/__init__.py`:
```python
from src.app.models.family import Family, SubscriptionStatus
from src.app.models.user import User, UserRole
from src.app.models.student import StudentProfile

__all__ = [
    "Family",
    "SubscriptionStatus",
    "User",
    "UserRole",
    "StudentProfile",
]
```

**Step 5: Commit**

```bash
git add backend/src/app/models/
git commit -m "feat: add Family, User, and StudentProfile models"
```

---

### Task 2.3: Create Curriculum Models

**Files:**
- Create: `backend/src/app/models/curriculum.py`
- Modify: `backend/src/app/models/__init__.py`

**Step 1: Create Curriculum models**

Create `backend/src/app/models/curriculum.py`:
```python
from enum import Enum

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.app.db.base import Base


class Subject(str, Enum):
    MATH = "math"
    ENGLISH = "english"
    SCIENCE = "science"
    SOCIAL_STUDIES = "social_studies"
    FOREIGN_LANGUAGE = "foreign_language"
    ART = "art"
    MUSIC = "music"
    PHYSICAL_EDUCATION = "physical_education"
    COMPUTER_SCIENCE = "computer_science"
    OTHER = "other"


class Curriculum(Base):
    """A year-long curriculum plan for a student in a subject."""
    __tablename__ = "curricula"

    student_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("student_profiles.id")
    )
    subject: Mapped[str] = mapped_column(String(100))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    grade_level: Mapped[int] = mapped_column(Integer)

    # Curriculum structure
    standards: Mapped[list[str]] = mapped_column(JSONB, default=list)  # Optional standard alignment

    # Relationships
    units: Mapped[list["Unit"]] = relationship(back_populates="curriculum", cascade="all, delete-orphan")


class Unit(Base):
    """A unit within a curriculum (e.g., 'Linear Equations')."""
    __tablename__ = "units"

    curriculum_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("curricula.id")
    )
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    order: Mapped[int] = mapped_column(Integer)
    estimated_hours: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Relationships
    curriculum: Mapped["Curriculum"] = relationship(back_populates="units")
    learning_objectives: Mapped[list["LearningObjective"]] = relationship(
        back_populates="unit", cascade="all, delete-orphan"
    )


class LearningObjective(Base):
    """A specific learning objective within a unit."""
    __tablename__ = "learning_objectives"

    unit_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("units.id"))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    order: Mapped[int] = mapped_column(Integer)

    # Standard alignment
    standard_codes: Mapped[list[str]] = mapped_column(JSONB, default=list)

    # Relationships
    unit: Mapped["Unit"] = relationship(back_populates="learning_objectives")
    progress_records: Mapped[list["Progress"]] = relationship(back_populates="objective")
```

**Step 2: Update models __init__.py**

Update `backend/src/app/models/__init__.py`:
```python
from src.app.models.family import Family, SubscriptionStatus
from src.app.models.user import User, UserRole
from src.app.models.student import StudentProfile
from src.app.models.curriculum import Curriculum, Unit, LearningObjective, Subject

__all__ = [
    "Family",
    "SubscriptionStatus",
    "User",
    "UserRole",
    "StudentProfile",
    "Curriculum",
    "Unit",
    "LearningObjective",
    "Subject",
]
```

**Step 3: Commit**

```bash
git add backend/src/app/models/
git commit -m "feat: add Curriculum, Unit, and LearningObjective models"
```

---

### Task 2.4: Create Session and Progress Models

**Files:**
- Create: `backend/src/app/models/session.py`
- Create: `backend/src/app/models/progress.py`
- Modify: `backend/src/app/models/__init__.py`

**Step 1: Create Session model**

Create `backend/src/app/models/session.py`:
```python
from enum import Enum

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.app.db.base import Base


class SessionStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class Session(Base):
    """A learning session between a student and the AI tutor."""
    __tablename__ = "sessions"

    student_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("student_profiles.id")
    )
    subject: Mapped[str] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(50), default=SessionStatus.ACTIVE.value)

    # Session content
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Metrics
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    message_count: Mapped[int] = mapped_column(Integer, default=0)

    # Learning objectives covered
    objectives_addressed: Mapped[list[str]] = mapped_column(JSONB, default=list)

    # Relationships
    student: Mapped["StudentProfile"] = relationship(back_populates="sessions")
    messages: Mapped[list["SessionMessage"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )


class SessionMessage(Base):
    """A single message in a tutoring session."""
    __tablename__ = "session_messages"

    session_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("sessions.id"))
    role: Mapped[str] = mapped_column(String(50))  # "user" or "assistant"
    content: Mapped[str] = mapped_column(Text)

    # Metadata
    tokens_used: Mapped[int | None] = mapped_column(Integer, nullable=True)
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Relationships
    session: Mapped["Session"] = relationship(back_populates="messages")
```

**Step 2: Create Progress model**

Create `backend/src/app/models/progress.py`:
```python
from enum import Enum

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.app.db.base import Base


class MasteryLevel(str, Enum):
    NOT_STARTED = "not_started"
    INTRODUCED = "introduced"
    PRACTICING = "practicing"
    MASTERED = "mastered"


class Progress(Base):
    """Tracks a student's progress on a specific learning objective."""
    __tablename__ = "progress"

    student_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("student_profiles.id")
    )
    objective_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("learning_objectives.id")
    )

    mastery_level: Mapped[str] = mapped_column(
        String(50), default=MasteryLevel.NOT_STARTED.value
    )

    # Evidence
    session_ids: Mapped[list[str]] = mapped_column(JSONB, default=list)
    assessment_ids: Mapped[list[str]] = mapped_column(JSONB, default=list)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    student: Mapped["StudentProfile"] = relationship(back_populates="progress_records")
    objective: Mapped["LearningObjective"] = relationship(back_populates="progress_records")


class Alert(Base):
    """System-generated alerts for parents."""
    __tablename__ = "alerts"

    family_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("families.id"))
    student_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("student_profiles.id"), nullable=True
    )

    alert_type: Mapped[str] = mapped_column(String(100))  # struggle, milestone, gap, review_needed
    title: Mapped[str] = mapped_column(String(255))
    message: Mapped[str] = mapped_column(Text)

    # Status
    read: Mapped[bool] = mapped_column(default=False)
    dismissed: Mapped[bool] = mapped_column(default=False)

    # Metadata
    metadata: Mapped[dict] = mapped_column(JSONB, default=dict)
```

**Step 3: Update models __init__.py**

Update `backend/src/app/models/__init__.py`:
```python
from src.app.models.family import Family, SubscriptionStatus
from src.app.models.user import User, UserRole
from src.app.models.student import StudentProfile
from src.app.models.curriculum import Curriculum, Unit, LearningObjective, Subject
from src.app.models.session import Session, SessionMessage, SessionStatus
from src.app.models.progress import Progress, Alert, MasteryLevel

__all__ = [
    "Family",
    "SubscriptionStatus",
    "User",
    "UserRole",
    "StudentProfile",
    "Curriculum",
    "Unit",
    "LearningObjective",
    "Subject",
    "Session",
    "SessionMessage",
    "SessionStatus",
    "Progress",
    "Alert",
    "MasteryLevel",
]
```

**Step 4: Commit**

```bash
git add backend/src/app/models/
git commit -m "feat: add Session, Progress, and Alert models"
```

---

### Task 2.5: Create and Run Initial Migration

**Files:**
- Create: `backend/alembic/versions/001_initial_schema.py` (auto-generated)

**Step 1: Generate migration**

```bash
cd backend
source .venv/bin/activate
alembic revision --autogenerate -m "initial schema"
```

**Step 2: Review the generated migration**

Check the file in `backend/alembic/versions/` and verify it creates all tables.

**Step 3: Run migration**

```bash
cd backend
source .venv/bin/activate
alembic upgrade head
```

Expected: Migration runs successfully, tables created in Supabase

**Step 4: Verify tables in Supabase**

1. Go to Supabase Dashboard > Table Editor
2. Verify tables exist: families, users, student_profiles, curricula, units, learning_objectives, sessions, session_messages, progress, alerts

**Step 5: Commit**

```bash
git add backend/alembic/versions/
git commit -m "feat: add initial database migration"
```

---

## Phase 3: Authentication

### Task 3.1: Create Auth Dependencies

**Files:**
- Create: `backend/src/app/auth/__init__.py`
- Create: `backend/src/app/auth/dependencies.py`

**Step 1: Create auth module**

```bash
mkdir -p backend/src/app/auth
touch backend/src/app/auth/__init__.py
```

**Step 2: Create auth dependencies**

Create `backend/src/app/auth/dependencies.py`:
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.config import settings
from src.app.db.base import get_db
from src.app.models import User

security = HTTPBearer()

SUPABASE_JWT_SECRET = settings.supabase_anon_key  # For validating Supabase JWTs


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Validate JWT and return the current user."""
    token = credentials.credentials

    try:
        # Decode Supabase JWT
        # Note: In production, use the JWT secret from Supabase settings
        payload = jwt.decode(
            token,
            settings.supabase_anon_key,
            algorithms=["HS256"],
            audience="authenticated",
        )
        auth_id: str = payload.get("sub")
        if auth_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    # Get user from database
    result = await db.execute(select(User).where(User.auth_id == auth_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


async def get_current_teaching_parent(
    current_user: User = Depends(get_current_user),
) -> User:
    """Require the current user to be a teaching parent."""
    if current_user.role != "teaching_parent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teaching parent access required",
        )
    return current_user


async def get_current_student(
    current_user: User = Depends(get_current_user),
) -> User:
    """Require the current user to be a student."""
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required",
        )
    return current_user
```

**Step 3: Commit**

```bash
git add backend/src/app/auth/
git commit -m "feat: add authentication dependencies"
```

---

### Task 3.2: Create Registration Endpoint

**Files:**
- Create: `backend/src/app/api/__init__.py`
- Create: `backend/src/app/api/auth.py`
- Create: `backend/src/app/schemas/__init__.py`
- Create: `backend/src/app/schemas/auth.py`
- Modify: `backend/src/app/main.py`

**Step 1: Create API and schemas directories**

```bash
mkdir -p backend/src/app/api
mkdir -p backend/src/app/schemas
touch backend/src/app/api/__init__.py
touch backend/src/app/schemas/__init__.py
```

**Step 2: Create auth schemas**

Create `backend/src/app/schemas/auth.py`:
```python
from pydantic import BaseModel, EmailStr


class FamilyRegistration(BaseModel):
    """Schema for registering a new family."""
    family_name: str
    parent_name: str
    parent_email: EmailStr
    auth_id: str  # From Supabase auth


class UserResponse(BaseModel):
    """Schema for user responses."""
    id: str
    email: str
    full_name: str
    role: str
    family_id: str

    class Config:
        from_attributes = True


class FamilyResponse(BaseModel):
    """Schema for family responses."""
    id: str
    name: str
    subscription_status: str

    class Config:
        from_attributes = True


class RegistrationResponse(BaseModel):
    """Response after successful registration."""
    user: UserResponse
    family: FamilyResponse
```

**Step 3: Create auth router**

Create `backend/src/app/api/auth.py`:
```python
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.db.base import get_db
from src.app.models import Family, User, UserRole
from src.app.schemas.auth import FamilyRegistration, RegistrationResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=RegistrationResponse)
async def register_family(
    data: FamilyRegistration,
    db: AsyncSession = Depends(get_db),
) -> RegistrationResponse:
    """Register a new family with the teaching parent."""
    # Create family with 30-day trial
    trial_end = datetime.now(timezone.utc) + timedelta(days=30)
    family = Family(
        name=data.family_name,
        subscription_status="trial",
        trial_ends_at=trial_end.isoformat(),
    )
    db.add(family)
    await db.flush()  # Get the family ID

    # Create teaching parent user
    user = User(
        auth_id=data.auth_id,
        email=data.parent_email,
        full_name=data.parent_name,
        role=UserRole.TEACHING_PARENT.value,
        family_id=family.id,
    )
    db.add(user)
    await db.flush()

    return RegistrationResponse(
        user=user,
        family=family,
    )
```

**Step 4: Update main.py to include router**

Update `backend/src/app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.app.api.auth import router as auth_router

app = FastAPI(
    title="Homeschool Platform API",
    description="AI-powered homeschool platform for grades 6-12",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api")


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "healthy"}
```

**Step 5: Commit**

```bash
git add backend/src/app/api backend/src/app/schemas backend/src/app/main.py
git commit -m "feat: add family registration endpoint"
```

---

## Phase 4: AI Tutor Integration

### Task 4.1: Create OpenAI Client

**Files:**
- Create: `backend/src/app/ai/__init__.py`
- Create: `backend/src/app/ai/client.py`

**Step 1: Create AI module**

```bash
mkdir -p backend/src/app/ai
touch backend/src/app/ai/__init__.py
```

**Step 2: Create OpenAI client wrapper**

Create `backend/src/app/ai/client.py`:
```python
from openai import AsyncOpenAI

from src.app.config import settings

# Initialize the OpenAI client
openai_client = AsyncOpenAI(api_key=settings.openai_api_key)

# Model configuration
TUTOR_MODEL = "gpt-5.1"  # Primary model for tutoring
UTILITY_MODEL = "gpt-4.1-mini"  # Cost-optimized for simple tasks


async def get_completion(
    messages: list[dict],
    model: str = TUTOR_MODEL,
    temperature: float = 0.7,
    max_tokens: int = 2000,
) -> str:
    """Get a completion from OpenAI."""
    response = await openai_client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content or ""


async def get_streaming_completion(
    messages: list[dict],
    model: str = TUTOR_MODEL,
    temperature: float = 0.7,
    max_tokens: int = 2000,
):
    """Get a streaming completion from OpenAI."""
    stream = await openai_client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        stream=True,
    )
    async for chunk in stream:
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content
```

**Step 3: Commit**

```bash
git add backend/src/app/ai/
git commit -m "feat: add OpenAI client wrapper"
```

---

### Task 4.2: Create Tutor System Prompts

**Files:**
- Create: `backend/src/app/ai/prompts.py`

**Step 1: Create tutor prompts**

Create `backend/src/app/ai/prompts.py`:
```python
"""System prompts for the AI tutor."""

TUTOR_SYSTEM_PROMPT = """You are a patient, encouraging AI tutor helping a {grade_level}th grade student learn {subject}.

## Your Teaching Style
- Use the Socratic method: ask guiding questions rather than just giving answers
- Break complex concepts into smaller, digestible pieces
- Celebrate progress and effort, not just correct answers
- If a student is stuck, try a different explanation or analogy
- Be encouraging without being condescending

## Rules
1. NEVER do the student's homework for them. Guide them to the answer.
2. If asked to solve a problem, walk through the thinking process instead.
3. Keep responses focused and concise - this is a conversation, not a lecture.
4. Adapt your language to be age-appropriate for a {grade_level}th grader.
5. If you detect frustration, acknowledge it and offer encouragement.
6. Periodically check understanding: "Does that make sense?" or "Can you explain that back to me?"

## Student Context
Name: {student_name}
Grade: {grade_level}
Subject: {subject}
Learning preferences: {learning_preferences}
Known strengths: {strengths}
Areas to work on: {weaknesses}

## Current Learning Focus
{current_objectives}

Begin by greeting the student warmly and asking what they'd like to work on today, or continue from where you left off if there's context from previous sessions.
"""

SUMMARIZE_SESSION_PROMPT = """Summarize this tutoring session in 2-3 sentences. Include:
1. What topics were covered
2. What the student seemed to understand well
3. What might need more practice

Session transcript:
{transcript}
"""

EVALUATE_UNDERSTANDING_PROMPT = """Based on this tutoring session, evaluate the student's understanding of the topics covered.

For each topic discussed, rate understanding as:
- NOT_DEMONSTRATED: Student didn't engage with this topic enough to assess
- STRUGGLING: Student showed significant confusion or misconceptions
- DEVELOPING: Student understands basics but makes errors on application
- PROFICIENT: Student demonstrates solid understanding with minor gaps
- MASTERED: Student can explain concepts and apply them correctly

Respond in JSON format:
{{
  "topics": [
    {{"topic": "topic name", "level": "LEVEL", "evidence": "brief explanation"}}
  ],
  "overall_engagement": "high/medium/low",
  "recommended_next_steps": ["suggestion 1", "suggestion 2"]
}}

Session transcript:
{transcript}
"""
```

**Step 2: Commit**

```bash
git add backend/src/app/ai/prompts.py
git commit -m "feat: add AI tutor system prompts"
```

---

### Task 4.3: Create Tutoring Service

**Files:**
- Create: `backend/src/app/services/__init__.py`
- Create: `backend/src/app/services/tutor.py`

**Step 1: Create services module**

```bash
mkdir -p backend/src/app/services
touch backend/src/app/services/__init__.py
```

**Step 2: Create tutor service**

Create `backend/src/app/services/tutor.py`:
```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.app.ai.client import get_completion, get_streaming_completion, UTILITY_MODEL
from src.app.ai.prompts import (
    TUTOR_SYSTEM_PROMPT,
    SUMMARIZE_SESSION_PROMPT,
    EVALUATE_UNDERSTANDING_PROMPT,
)
from src.app.models import Session, SessionMessage, SessionStatus, StudentProfile


class TutorService:
    """Service for AI tutoring sessions."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_session(
        self,
        student_id: str,
        subject: str,
    ) -> Session:
        """Get an active session or create a new one."""
        # Look for existing active session
        result = await self.db.execute(
            select(Session)
            .where(Session.student_id == student_id)
            .where(Session.subject == subject)
            .where(Session.status == SessionStatus.ACTIVE.value)
            .order_by(Session.created_at.desc())
        )
        session = result.scalar_one_or_none()

        if session is None:
            session = Session(
                student_id=student_id,
                subject=subject,
                status=SessionStatus.ACTIVE.value,
            )
            self.db.add(session)
            await self.db.flush()

        return session

    async def get_session_with_messages(self, session_id: str) -> Session | None:
        """Get a session with all its messages."""
        result = await self.db.execute(
            select(Session)
            .where(Session.id == session_id)
            .options(selectinload(Session.messages))
        )
        return result.scalar_one_or_none()

    async def build_system_prompt(
        self,
        student: StudentProfile,
        subject: str,
    ) -> str:
        """Build the system prompt for the tutor."""
        return TUTOR_SYSTEM_PROMPT.format(
            grade_level=student.grade_level,
            subject=subject,
            student_name=student.user.full_name if student.user else "Student",
            learning_preferences=", ".join(student.learning_preferences.get("styles", ["visual"])),
            strengths=", ".join(student.strengths) if student.strengths else "Not yet identified",
            weaknesses=", ".join(student.weaknesses) if student.weaknesses else "Not yet identified",
            current_objectives="General learning in " + subject,
        )

    async def chat(
        self,
        session: Session,
        student: StudentProfile,
        user_message: str,
    ) -> str:
        """Process a chat message and return the tutor's response."""
        # Save user message
        user_msg = SessionMessage(
            session_id=session.id,
            role="user",
            content=user_message,
        )
        self.db.add(user_msg)

        # Build message history
        messages = [
            {"role": "system", "content": await self.build_system_prompt(student, session.subject)}
        ]

        # Add previous messages
        result = await self.db.execute(
            select(SessionMessage)
            .where(SessionMessage.session_id == session.id)
            .order_by(SessionMessage.created_at)
        )
        for msg in result.scalars():
            messages.append({"role": msg.role, "content": msg.content})

        # Get AI response
        response = await get_completion(messages)

        # Save assistant message
        assistant_msg = SessionMessage(
            session_id=session.id,
            role="assistant",
            content=response,
        )
        self.db.add(assistant_msg)

        # Update session metrics
        session.message_count = (session.message_count or 0) + 2

        return response

    async def stream_chat(
        self,
        session: Session,
        student: StudentProfile,
        user_message: str,
    ):
        """Stream a chat response from the tutor."""
        # Save user message
        user_msg = SessionMessage(
            session_id=session.id,
            role="user",
            content=user_message,
        )
        self.db.add(user_msg)
        await self.db.flush()

        # Build message history
        messages = [
            {"role": "system", "content": await self.build_system_prompt(student, session.subject)}
        ]

        result = await self.db.execute(
            select(SessionMessage)
            .where(SessionMessage.session_id == session.id)
            .order_by(SessionMessage.created_at)
        )
        for msg in result.scalars():
            messages.append({"role": msg.role, "content": msg.content})

        # Stream response
        full_response = ""
        async for chunk in get_streaming_completion(messages):
            full_response += chunk
            yield chunk

        # Save complete response
        assistant_msg = SessionMessage(
            session_id=session.id,
            role="assistant",
            content=full_response,
        )
        self.db.add(assistant_msg)
        session.message_count = (session.message_count or 0) + 2

    async def end_session(self, session: Session) -> dict:
        """End a session and generate summary."""
        # Get all messages
        result = await self.db.execute(
            select(SessionMessage)
            .where(SessionMessage.session_id == session.id)
            .order_by(SessionMessage.created_at)
        )
        messages = result.scalars().all()

        # Build transcript
        transcript = "\n".join([f"{m.role}: {m.content}" for m in messages])

        # Generate summary
        summary = await get_completion(
            [{"role": "user", "content": SUMMARIZE_SESSION_PROMPT.format(transcript=transcript)}],
            model=UTILITY_MODEL,
        )

        # Update session
        session.status = SessionStatus.COMPLETED.value
        session.summary = summary

        return {"summary": summary, "message_count": session.message_count}
```

**Step 3: Commit**

```bash
git add backend/src/app/services/
git commit -m "feat: add tutor service with chat and session management"
```

---

### Task 4.4: Create Tutoring API Endpoints

**Files:**
- Create: `backend/src/app/api/tutor.py`
- Create: `backend/src/app/schemas/tutor.py`
- Modify: `backend/src/app/main.py`

**Step 1: Create tutor schemas**

Create `backend/src/app/schemas/tutor.py`:
```python
from pydantic import BaseModel


class ChatMessage(BaseModel):
    """A chat message from the user."""
    message: str
    subject: str


class ChatResponse(BaseModel):
    """Response from the tutor."""
    session_id: str
    response: str


class SessionResponse(BaseModel):
    """Session information."""
    id: str
    subject: str
    status: str
    message_count: int
    summary: str | None = None

    class Config:
        from_attributes = True


class EndSessionResponse(BaseModel):
    """Response when ending a session."""
    summary: str
    message_count: int
```

**Step 2: Create tutor router**

Create `backend/src/app/api/tutor.py`:
```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.app.auth.dependencies import get_current_student
from src.app.db.base import get_db
from src.app.models import User, StudentProfile
from src.app.schemas.tutor import ChatMessage, ChatResponse, EndSessionResponse, SessionResponse
from src.app.services.tutor import TutorService

router = APIRouter(prefix="/tutor", tags=["tutor"])


async def get_student_profile(
    current_user: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_db),
) -> StudentProfile:
    """Get the student profile for the current user."""
    result = await db.execute(
        select(StudentProfile)
        .where(StudentProfile.user_id == current_user.id)
        .options(selectinload(StudentProfile.user))
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found",
        )
    return profile


@router.post("/chat", response_model=ChatResponse)
async def chat(
    data: ChatMessage,
    student: StudentProfile = Depends(get_student_profile),
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:
    """Send a message to the AI tutor."""
    service = TutorService(db)
    session = await service.get_or_create_session(student.id, data.subject)
    response = await service.chat(session, student, data.message)

    return ChatResponse(session_id=session.id, response=response)


@router.post("/chat/stream")
async def chat_stream(
    data: ChatMessage,
    student: StudentProfile = Depends(get_student_profile),
    db: AsyncSession = Depends(get_db),
):
    """Send a message and stream the response."""
    service = TutorService(db)
    session = await service.get_or_create_session(student.id, data.subject)

    async def generate():
        async for chunk in service.stream_chat(session, student, data.message):
            yield chunk
        await db.commit()

    return StreamingResponse(generate(), media_type="text/plain")


@router.get("/sessions", response_model=list[SessionResponse])
async def list_sessions(
    student: StudentProfile = Depends(get_student_profile),
    db: AsyncSession = Depends(get_db),
) -> list[SessionResponse]:
    """List all sessions for the current student."""
    result = await db.execute(
        select(Session)
        .where(Session.student_id == student.id)
        .order_by(Session.created_at.desc())
    )
    return result.scalars().all()


@router.post("/sessions/{session_id}/end", response_model=EndSessionResponse)
async def end_session(
    session_id: str,
    student: StudentProfile = Depends(get_student_profile),
    db: AsyncSession = Depends(get_db),
) -> EndSessionResponse:
    """End a tutoring session."""
    service = TutorService(db)
    session = await service.get_session_with_messages(session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.student_id != student.id:
        raise HTTPException(status_code=403, detail="Not your session")

    result = await service.end_session(session)
    return EndSessionResponse(**result)
```

**Step 3: Add missing import and update main.py**

Update `backend/src/app/api/tutor.py` to add missing import at top:
```python
from src.app.models import User, StudentProfile, Session
```

Update `backend/src/app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.app.api.auth import router as auth_router
from src.app.api.tutor import router as tutor_router

app = FastAPI(
    title="Homeschool Platform API",
    description="AI-powered homeschool platform for grades 6-12",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api")
app.include_router(tutor_router, prefix="/api")


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "healthy"}
```

**Step 4: Commit**

```bash
git add backend/src/app/api/tutor.py backend/src/app/schemas/tutor.py backend/src/app/main.py
git commit -m "feat: add tutoring API endpoints"
```

---

## Phase 5: Frontend Core

### Task 5.1: Set Up React Router and Layout

**Files:**
- Modify: `frontend/src/App.tsx`
- Create: `frontend/src/layouts/MainLayout.tsx`
- Create: `frontend/src/pages/Home.tsx`

**Step 1: Create layouts directory**

```bash
mkdir -p frontend/src/layouts
mkdir -p frontend/src/pages
```

**Step 2: Create MainLayout**

Create `frontend/src/layouts/MainLayout.tsx`:
```tsx
import { Link, Outlet } from 'react-router-dom'

export function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-gray-900">
            Homeschool Platform
          </Link>
          <nav className="space-x-4">
            <Link to="/learn" className="text-gray-600 hover:text-gray-900">
              Learn
            </Link>
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 px-4">
        <Outlet />
      </main>
    </div>
  )
}
```

**Step 3: Create Home page**

Create `frontend/src/pages/Home.tsx`:
```tsx
import { Link } from 'react-router-dom'

export function Home() {
  return (
    <div className="text-center py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Welcome to Your AI Learning Companion
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        Personalized tutoring for grades 6-12, powered by AI
      </p>
      <div className="space-x-4">
        <Link
          to="/learn"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
        >
          Start Learning
        </Link>
        <Link
          to="/dashboard"
          className="inline-block bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300"
        >
          View Dashboard
        </Link>
      </div>
    </div>
  )
}
```

**Step 4: Update App.tsx with router**

Replace `frontend/src/App.tsx`:
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MainLayout } from './layouts/MainLayout'
import { Home } from './pages/Home'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
```

**Step 5: Verify app runs**

```bash
cd frontend
npm run dev
```

Expected: App shows home page with navigation

**Step 6: Commit**

```bash
git add frontend/src/
git commit -m "feat: add React Router and main layout"
```

---

### Task 5.2: Create Supabase Client

**Files:**
- Create: `frontend/src/lib/supabase.ts`
- Create: `frontend/src/lib/api.ts`

**Step 1: Create lib directory**

```bash
mkdir -p frontend/src/lib
```

**Step 2: Create Supabase client**

Create `frontend/src/lib/supabase.ts`:
```tsx
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Step 3: Create API client**

Create `frontend/src/lib/api.ts`:
```tsx
import axios from 'axios'
import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
})

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})
```

**Step 4: Commit**

```bash
git add frontend/src/lib/
git commit -m "feat: add Supabase and API clients"
```

---

### Task 5.3: Create Auth Context and Login Page

**Files:**
- Create: `frontend/src/contexts/AuthContext.tsx`
- Create: `frontend/src/pages/Login.tsx`
- Modify: `frontend/src/App.tsx`

**Step 1: Create contexts directory**

```bash
mkdir -p frontend/src/contexts
```

**Step 2: Create AuthContext**

Create `frontend/src/contexts/AuthContext.tsx`:
```tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

**Step 3: Create Login page**

Create `frontend/src/pages/Login.tsx`:
```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        await signUp(email, password)
        setError('Check your email to confirm your account')
      } else {
        await signIn(email, password)
        navigate('/')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <h1 className="text-3xl font-bold text-center mb-8">
        {isSignUp ? 'Create Account' : 'Sign In'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>

      <p className="mt-4 text-center text-gray-600">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-blue-600 hover:underline"
        >
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </p>
    </div>
  )
}
```

**Step 4: Update App.tsx**

Replace `frontend/src/App.tsx`:
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { MainLayout } from './layouts/MainLayout'
import { Home } from './pages/Home'
import { Login } from './pages/Login'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
```

**Step 5: Commit**

```bash
git add frontend/src/
git commit -m "feat: add authentication context and login page"
```

---

### Task 5.4: Create Tutor Chat Interface

**Files:**
- Create: `frontend/src/pages/Learn.tsx`
- Create: `frontend/src/components/ChatMessage.tsx`
- Modify: `frontend/src/App.tsx`

**Step 1: Create components directory**

```bash
mkdir -p frontend/src/components
```

**Step 2: Create ChatMessage component**

Create `frontend/src/components/ChatMessage.tsx`:
```tsx
interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  )
}
```

**Step 3: Create Learn page**

Create `frontend/src/pages/Learn.tsx`:
```tsx
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { ChatMessage } from '../components/ChatMessage'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUBJECTS = [
  'Math',
  'English',
  'Science',
  'Social Studies',
  'Foreign Language',
  'Computer Science',
]

export function Learn() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [subject, setSubject] = useState('Math')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const response = await api.post('/api/tutor/chat', {
        message: userMessage,
        subject: subject.toLowerCase().replace(' ', '_'),
      })

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.data.response },
      ])
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please sign in to start learning.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Subject selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subject
        </label>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="block w-48 rounded-md border border-gray-300 px-3 py-2"
        >
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto bg-white rounded-lg border border-gray-200 p-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Start a conversation with your AI tutor!</p>
            <p className="text-sm mt-2">Ask a question about {subject}</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <ChatMessage key={idx} role={msg.role} content={msg.content} />
          ))
        )}
        {loading && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <p className="text-gray-500">Thinking...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <form onSubmit={sendMessage} className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your tutor a question..."
          className="flex-1 rounded-md border border-gray-300 px-4 py-2"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}
```

**Step 4: Add Learn route to App.tsx**

Update `frontend/src/App.tsx`:
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { MainLayout } from './layouts/MainLayout'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Learn } from './pages/Learn'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="learn" element={<Learn />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
```

**Step 5: Commit**

```bash
git add frontend/src/
git commit -m "feat: add AI tutor chat interface"
```

---

## Phase 6: Testing

### Task 6.1: Add Backend Tests

**Files:**
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_health.py`

**Step 1: Create test configuration**

Create `backend/tests/conftest.py`:
```python
import pytest
from httpx import ASGITransport, AsyncClient

from src.app.main import app


@pytest.fixture
async def client():
    """Create test client."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        yield client
```

**Step 2: Create health check test**

Create `backend/tests/test_health.py`:
```python
import pytest


@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}
```

**Step 3: Run tests**

```bash
cd backend
source .venv/bin/activate
pytest -v
```

Expected: Tests pass

**Step 4: Commit**

```bash
git add backend/tests/
git commit -m "test: add health check test"
```

---

## Summary

This implementation plan covers:

1. **Phase 1**: Project setup (FastAPI backend, React frontend, environment config, Supabase)
2. **Phase 2**: Database schema (Family, User, Student, Curriculum, Session, Progress models)
3. **Phase 3**: Authentication (Supabase Auth integration, registration endpoint)
4. **Phase 4**: AI Tutor (OpenAI client, tutor prompts, tutoring service, API endpoints)
5. **Phase 5**: Frontend (React Router, auth context, chat interface)
6. **Phase 6**: Testing (pytest setup, initial tests)

**After completing these phases, you will have:**
- A working backend API with authentication
- Database models for all core entities
- AI tutoring capability with GPT-5.1
- A frontend with login and chat interface
- Basic test infrastructure

**Next steps after MVP:**
- Add parent dashboard
- Add family visibility features
- Add curriculum planning UI
- Add progress tracking visualization
- Add assessment generation
- Add alert system
