import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, BookOpen, CheckCircle, PlayCircle, FileText, Clock } from 'lucide-react'
import ClassroomView from '@/components/ClassroomView'
import HourLogger from '@/components/HourLogger'
import StudyBuddy from '@/components/StudyBuddy'

import ObjectiveMap from '@/components/ObjectiveMap'
import { getCourseObjectives } from '@/app/mastery-actions'

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const course = await prisma.course.findUnique({
        where: { id },
        include: {
            units: {
                include: { lessons: true },
                orderBy: { weekNumber: 'asc' }
            },
            hourLogs: {
                orderBy: { date: 'desc' }
            }
        }
    })

    if (!course) {
        notFound()
    }

    // Fetch mastery objectives
    const objectives = await getCourseObjectives(id)

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary font-sans p-6 md:p-8 h-screen flex flex-col">
            <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <a href="/" className="text-text-secondary hover:text-white flex items-center gap-2 mb-2 transition-colors text-sm">
                            <ArrowLeft size={16} /> Dashboard
                        </a>
                        <h1 className="text-3xl font-bold font-serif bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent flex items-center gap-3">
                            {course.title}
                            <span className="text-sm font-normal font-sans text-text-muted bg-bg-tertiary px-2 py-1 rounded-lg border border-glass-border">
                                {course.subject}
                            </span>
                        </h1>
                    </div>
                    <div className="flex gap-4 text-text-muted text-sm items-center">
                        <div className="px-3 py-1 bg-bg-tertiary rounded-full border border-glass-border">
                            {course.credits} Credits
                        </div>
                        {course.units.length > 0 && (
                            <div className="px-3 py-1 bg-bg-tertiary rounded-full border border-glass-border">
                                {course.units.length} Weeks
                            </div>
                        )}
                        {(() => {
                            let totalScore = 0
                            let totalMax = 0
                            course.units.forEach(u => u.lessons.forEach(l => {
                                if (l.quizScore !== null && l.quizTotal !== null) {
                                    totalScore += l.quizScore
                                    totalMax += l.quizTotal
                                }
                            }))

                            if (totalMax > 0) {
                                const percent = Math.round((totalScore / totalMax) * 100)
                                return (
                                    <div className={`px-3 py-1 rounded-full border border-glass-border font-bold ${percent >= 90 ? 'bg-success/20 text-success' :
                                        percent >= 80 ? 'bg-accent-primary/20 text-accent-primary' :
                                            percent >= 70 ? 'bg-warning/20 text-warning' :
                                                'bg-danger/20 text-danger'
                                        }`}>
                                        Grade: {percent}%
                                    </div>
                                )
                            }
                            return null
                        })()}
                    </div>
                </div>

                {/* Hour Logging Section (Manual Focus) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <ObjectiveMap courseId={course.id} objectives={objectives} />
                    </div>
                    <div className="space-y-8">
                        <HourLogger courseId={course.id} logs={course.hourLogs} />
                        <StudyBuddy subject={course.subject} />
                    </div>
                </div>
            </div>
        </div>
    )
}
