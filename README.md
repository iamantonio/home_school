# Scholaris - AI-Powered Homeschool Platform

An AI tutoring platform for homeschool families (grades 6-12) that uses the Socratic method to guide students through personalized learning experiences.

## Features

- **AI Tutor Chat** - Conversational tutoring across 6 subjects using the Socratic method
- **Curriculum Generation** - AI-generated personalized curricula with learning objectives
- **Progress Tracking** - Visual insights into mastery across all subjects
- **Quizzes & Assessments** - Test knowledge with hints available when stuck
- **Family Dashboard** - Parents can track multiple students' progress
- **Session History** - Review past tutoring conversations

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS, React Query
- **Backend**: Python 3.12+, FastAPI, SQLAlchemy, Alembic
- **Database**: PostgreSQL (via Supabase)
- **Auth**: Supabase Auth
- **AI**: OpenAI API

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18+) and npm
- **Python** (3.12+)
- **A Supabase account** (free tier works) - [supabase.com](https://supabase.com)
- **An OpenAI API key** - [platform.openai.com](https://platform.openai.com)

---

## Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd home_school
```

---

## Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned
3. Go to **Project Settings > API** and note down:
   - **Project URL** (e.g., `https://abc123.supabase.co`)
   - **anon/public key**
   - **service_role key** (keep this secret!)
4. Go to **Project Settings > Database** and note down:
   - **Connection string** (use the one for "Connection pooling" with `postgresql://`)

---

## Step 3: Set Up the Backend

```bash
cd backend
```

### Create a virtual environment

```bash
python -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate
```

### Install dependencies

```bash
pip install -e ".[dev]"
```

### Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
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

### Run database migrations

```bash
alembic upgrade head
```

### Start the backend server

```bash
uvicorn src.app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. You can view the API docs at `http://localhost:8000/docs`.

---

## Step 4: Set Up the Frontend

Open a new terminal:

```bash
cd frontend
```

### Install dependencies

```bash
npm install
```

### Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Step 5: Create Your Account

1. Open `http://localhost:5173` in your browser
2. Click **"Start Learning Free"** or go to `/login`
3. Choose your role:
   - **Student** - If you're the learner
   - **Teaching Parent** - If you're managing students
4. Fill in your details and create an account
5. You'll be logged in automatically

---

## Using the App

### For Students

1. **Learn Page** (`/learn`)
   - Select a subject (Math, English, Science, etc.)
   - Chat with the AI tutor
   - The tutor uses the Socratic method to guide you to understanding

2. **Curricula** (`/curricula`)
   - View your personalized curricula
   - Click on a curriculum to see learning objectives
   - Take quizzes on specific objectives

3. **Progress** (`/progress`)
   - Track your mastery across subjects
   - See which objectives you've mastered

4. **Assessment History** (`/assessments`)
   - Review past quiz attempts
   - See your scores and performance

### For Teaching Parents

1. **Parent Dashboard** (`/parent`)
   - Overview of all students in your family
   - See session counts and activity

2. **Create Curriculum** (`/curricula/new`)
   - Select a student
   - Choose a subject and grade level
   - Add optional learning goals
   - AI generates a personalized curriculum

3. **Add Students**
   - From the Create Curriculum page, click "Add Your First Student" or "+ Add another student"
   - Enter the student's name and grade level

---

## Running Tests

### Backend

```bash
cd backend
source .venv/bin/activate
pytest
```

### Frontend

```bash
cd frontend
npm run lint
npm run build  # Type checking included
```

---

## Project Structure

```
home_school/
├── backend/
│   ├── src/app/
│   │   ├── api/          # API route handlers
│   │   ├── auth/         # Authentication dependencies
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   └── ai/           # AI client configuration
│   ├── alembic/          # Database migrations
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── contexts/     # React contexts (Auth)
│   │   ├── layouts/      # Page layouts
│   │   ├── lib/          # Utilities (API client, Supabase)
│   │   └── pages/        # Page components
│   └── public/
└── docs/
```

---

## Troubleshooting

### CORS Errors
Make sure the backend is running on port 8000 and the frontend `.env` has `VITE_API_URL=http://localhost:8000`.

### Database Connection Issues
- Verify your `DATABASE_URL` in the backend `.env`
- Make sure you're using `postgresql+asyncpg://` (not just `postgresql://`)
- Check that your Supabase project is active

### Authentication Issues
- Ensure both frontend and backend have matching Supabase URLs and keys
- The backend needs the `SUPABASE_SERVICE_KEY` (service role key)
- The frontend uses the `SUPABASE_ANON_KEY` (public key)

### "Student profile not found" Error
This happens when a user exists in Supabase Auth but not in the backend database. Try signing out and signing back in - the app will auto-register you.

---

## License

Private project.
