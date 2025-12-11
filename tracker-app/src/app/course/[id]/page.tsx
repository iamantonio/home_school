import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ArrowLeft, BookOpen, CheckCircle, PlayCircle, FileText, Sparkles } from 'lucide-react'
import { generateSyllabus } from '@/app/ml-actions'
import ClassroomView from '@/components/ClassroomView'
import GenerateSyllabusButton from '@/components/GenerateSyllabusButton'

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const course = await prisma.course.findUnique({
        where: { id },
        include: {
            units: {
                include: { lessons: true },
                orderBy: { weekNumber: 'asc' }
            }
        }
    })

    if (!course || course.userId !== user.id) {
        redirect('/')
    }

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary font-sans p-6 md:p-8 h-screen flex flex-col">
            <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <a href="/" className="text-text-secondary hover:text-white flex items-center gap-2 mb-2 transition-colors text-sm">
                            <ArrowLeft size={16} /> Dashboard
                        </a>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent flex items-center gap-3">
                            {course.title}
                            <span className="text-sm font-normal text-text-muted bg-bg-tertiary px-2 py-1 rounded-lg border border-glass-border">
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

                {course.units.length === 0 ? (
                    <div className="glass-panel p-12 text-center space-y-6 flex-1 flex flex-col justify-center items-center">
                        <div className="bg-accent-primary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-accent-primary animate-pulse">
                            <Sparkles size={48} />
                        </div>
                        <h2 className="text-3xl font-bold">Your AI Teacher is Ready</h2>
                        <p className="text-text-secondary max-w-md mx-auto text-lg">
                            Generate a full 36-week syllabus, complete with lessons, reading materials, videos, and quizzes for this course.
                        </p>
                        <form action={generateSyllabus.bind(null, course.id)} className="pt-4">
                            <GenerateSyllabusButton />
                        </form>
                    </div>
                ) : (
                    <ClassroomView course={course} units={course.units} />
                )}
            </div>
        </div>
    )
}
