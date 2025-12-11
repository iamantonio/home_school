import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import CourseManager from '@/components/CourseManager'
import ProgressDashboard from '@/components/ProgressDashboard'
import { calculateProgress } from '@/lib/requirements'
import SignOutButton from '@/components/SignOutButton'
import { FileText } from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()

  // For real flow:
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch courses for this user
  const courses = await prisma.course.findMany({
    where: {
      userId: user.id,
      isArchived: false,
    },
    orderBy: {
      title: 'asc'
    }
  })

  // Calculate stats
  const progress = calculateProgress(courses)
  const totalCredits = courses.reduce((acc, c) => acc + c.credits, 0)

  // Simple GPA Calculation for Header (Dashboard has its own NCAA GPA)
  const gradePoints: Record<string, number> = {
    'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0,
    'F': 0.0
  }

  let totalPoints = 0
  let gradedCredits = 0

  courses.forEach(c => {
    if (c.grade && gradePoints[c.grade] !== undefined) {
      totalPoints += gradePoints[c.grade] * c.credits
      gradedCredits += c.credits
    }
  })

  const gpa = gradedCredits > 0 ? (totalPoints / gradedCredits).toFixed(2) : 'N/A'

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent mb-2">
            Academic Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <p className="text-text-secondary text-base">Welcome back</p>
            <a href="/transcript" className="text-sm font-medium text-accent-primary hover:underline flex items-center gap-1">
              <FileText size={16} /> Transcript
            </a>
            <SignOutButton />
          </div>
        </div>

        <div className="flex gap-6">
          <div className="glass-panel px-6 py-3 text-center min-w-[100px] flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-accent-primary leading-tight">{gpa}</div>
            <div className="text-xs text-text-muted uppercase tracking-wider mt-1">GPA</div>
          </div>

          <div className="glass-panel px-6 py-3 text-center min-w-[100px] flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-white leading-tight">{totalCredits}</div>
            <div className="text-xs text-text-muted uppercase tracking-wider mt-1">Credits</div>
          </div>
        </div>
      </header>

      <main className="flex flex-col gap-12">
        <ProgressDashboard progress={progress} />
        <CourseManager courses={courses} />
      </main>
    </div>
  )
}
