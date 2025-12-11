# Homeschool Tracker & College Prep App

A comprehensive, Next.js-powered application designed to manage high school homeschooling, specifically tailored for Illinois requirements and University of Washington (UW) admissions.

![Dark Academia Dashboard](https://github.com/user-attachments/assets/placeholder)

## 🎯 Core Features

### 📚 Academic Management
- **Course Planning**: Manage 4-year high school curriculum (Grades 9-12).
- **Manual Hour Logging**: Track instructional hours (Critical for IL compliance, 120-180h/credit).
- **Gradebook**: Record grades and view real-time GPA calculations.
- **Transcript Generation**: One-click official PDF export for college applications.

### 🧠 AI Study Buddy
- **On-Demand Tutor**: Ask questions about any subject.
- **Smart Explanations**: Get high-school level summaries of complex topics.
- **Video Curation**: Direct links to the best educational YouTube videos.
- **Interactive Quizzes**: Instant practice questions to verify understanding.

### 🎨 Premium Experience
- **"Dark Academia" Theme**: Elegant interface with *Playfair Display* serif typography and subtle ambient glow.
- **Progress Tracking**: Visual dashboards for Credits, GPA, and UW CADR requirements.
- **Extracurricular Portfolio**: Log sports, clubs, and volunteer work.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: SQLite (via Prisma)
- **Styling**: Tailwind CSS + Custom "Glassmorphism" UI
- **AI**: OpenAI GPT-4o Integration
- **Auth**: Supabase Auth

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- OpenAI API Key (for AI Tutor)
- Supabase Account (for Auth)

### Installation

1. **Navigate to the app directory:**
   ```bash
   cd tracker-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env` file in `tracker-app/`:
   ```env
   DATABASE_URL="file:./dev.db"
   OPENAI_API_KEY="sk-..."
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   ```

4. **Initialize Database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

## 📝 Usage Guide

1. **Dashboard**: View your GPA, Credit progress, and upcoming schedule.
2. **Add Courses**: Use the "+ Add Custom" button to build your transcript.
3. **Log Hours**: Click into a course and use the **Instructional Hours** panel to log daily work.
4. **Get Help**: Use the **AI Tutor** sidebar to explain difficult concepts instantly.
5. **Print Transcript**: Click "Transcript" in the header to generate a PDF for colleges.

---

## ⚖️ Compliance Notes

- **Illinois**: Logs tracked in "Instructional Hours" serve as proof of schooling (~120h = 1 Credit).
- **UW Seattle**: The "Progress Dashboard" automatically checks against CADR requirements (4 English, 3 Math, etc.).

---

## License

Private Personal Project.
