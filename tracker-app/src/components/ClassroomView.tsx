'use client'

import { useState } from 'react'
import { BookOpen, CheckCircle, PlayCircle, FileText, Sparkles, ChevronRight, CheckSquare } from 'lucide-react'
import { submitQuiz } from '@/app/actions'


interface Lesson {
    id: string
    title: string
    contentType: string
    content: string | null
    videoUrl: string | null
    quizScore: number | null
    quizTotal: number | null
    isCompleted: boolean
}

interface Unit {
    id: string
    title: string
    weekNumber: number
    description: string | null
    isCompleted: boolean
    lessons: Lesson[]
}

interface Course {
    id: string
    title: string
    subject: string
    credits: number
}

interface ClassroomViewProps {
    course: Course
    units: Unit[]
}

export default function ClassroomView({ course, units }: ClassroomViewProps) {
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(units[0]?.id || null)

    const selectedUnit = units.find(u => u.id === selectedUnitId)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
            {/* Sidebar / Syllabus List */}
            <div className="lg:col-span-1 flex flex-col h-full">
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                    <BookOpen size={20} className="text-accent-primary" /> Syllabus
                </h3>
                <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar pb-4">
                    {units.map((unit) => (
                        <button
                            key={unit.id}
                            onClick={() => setSelectedUnitId(unit.id)}
                            className={`w-full text-left p-4 border rounded-xl transition-all group ${selectedUnitId === unit.id
                                ? 'bg-accent-primary/10 border-accent-primary shadow-md'
                                : 'bg-bg-secondary border-glass-border hover:border-text-secondary'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-xs font-bold uppercase tracking-wider ${selectedUnitId === unit.id ? 'text-accent-primary' : 'text-text-muted'
                                    }`}>
                                    Week {unit.weekNumber}
                                </span>
                                {unit.isCompleted && <CheckCircle size={16} className="text-success" />}
                            </div>
                            <h4 className={`font-semibold ${selectedUnitId === unit.id ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary'}`}>
                                {unit.title}
                            </h4>
                            <div className="text-xs text-text-muted mt-2 flex gap-3">
                                <span className="flex items-center gap-1"><BookOpen size={12} /> Read</span>
                                <span className="flex items-center gap-1"><PlayCircle size={12} /> Watch</span>
                                <span className="flex items-center gap-1"><CheckSquare size={12} /> Quiz</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area (Lesson Player) */}
            <div className="lg:col-span-2 h-full flex flex-col">
                <div className="glass-panel p-0 h-full flex flex-col overflow-hidden">
                    {selectedUnit ? (
                        <>
                            <div className="p-6 border-b border-glass-border bg-bg-tertiary">
                                <span className="text-sm font-bold text-accent-primary mb-1 block">Week {selectedUnit.weekNumber}</span>
                                <h2 className="text-2xl font-bold">{selectedUnit.title}</h2>
                                <p className="text-text-secondary mt-2">{selectedUnit.description}</p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                {selectedUnit.lessons.map((lesson) => (
                                    <div key={lesson.id} className="space-y-4">
                                        <div className="flex items-center gap-3 text-lg font-semibold border-l-4 border-accent-primary pl-3">
                                            {lesson.contentType === 'reading' && <BookOpen size={24} className="text-accent-primary" />}
                                            {lesson.contentType === 'video' && <PlayCircle size={24} className="text-accent-secondary" />}
                                            {lesson.contentType === 'quiz' && <CheckSquare size={24} className="text-success" />}
                                            {lesson.title}
                                        </div>

                                        <div className="bg-bg-primary/50 rounded-xl p-6 border border-glass-border">
                                            {lesson.contentType === 'reading' && (
                                                <div className="prose prose-invert max-w-none whitespace-pre-wrap font-serif leading-relaxed text-lg">
                                                    {lesson.content}
                                                </div>
                                            )}

                                            {lesson.contentType === 'video' && (
                                                <div className="flex flex-col items-center justify-center p-8 bg-black/50 rounded-xl border border-glass-border space-y-4">
                                                    <PlayCircle size={64} className="text-accent-primary animate-pulse" />
                                                    <div className="text-center">
                                                        <h3 className="text-xl font-bold mb-2">Watch Video Lecture</h3>
                                                        <p className="text-text-muted mb-6">Click below to find the best explanation on YouTube for this topic.</p>
                                                        <a
                                                            href={lesson.videoUrl || '#'}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn-primary inline-flex items-center gap-2 px-6 py-3"
                                                        >
                                                            <PlayCircle size={20} /> Watch "{lesson.content}" on YouTube
                                                        </a>
                                                    </div>
                                                </div>
                                            )}

                                            {lesson.contentType === 'quiz' && (
                                                <QuizPlayer
                                                    lessonId={lesson.id}
                                                    content={lesson.content}
                                                    previousScore={lesson.quizScore}
                                                    totalRaw={lesson.quizTotal}
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <div className="pt-8 flex justify-end">
                                    <button className="btn-primary flex items-center gap-2 px-6 py-3">
                                        Complete Week {selectedUnit.weekNumber} <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-text-muted">
                            Select a week to begin
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function QuizPlayer({ lessonId, content, previousScore, totalRaw }: { lessonId: string, content: string | null, previousScore: number | null, totalRaw: number | null }) {
    const [answers, setAnswers] = useState<Record<number, number>>({})
    const [showResults, setShowResults] = useState(previousScore !== null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!content) return <div>No quiz content</div>

    let questions = []
    let isLegacy = false

    try {
        questions = JSON.parse(content)
        if (!Array.isArray(questions)) throw new Error("Invalid format")
    } catch (e) {
        // Fallback for legacy text-based quizzes
        isLegacy = true
    }

    if (isLegacy) {
        return (
            <div className="space-y-4">
                <div className="p-4 bg-bg-tertiary rounded-xl border border-glass-border whitespace-pre-wrap">
                    {content}
                </div>
                <div className="text-sm text-text-muted text-center italic">
                    (This is a legacy quiz. Generate a new syllabus for interactive mode.)
                </div>
            </div>
        )
    }

    const calculateScore = () => {
        let correct = 0
        questions.forEach((q: any, idx: number) => {
            if (answers[idx] === q.answer) correct++
        })
        return correct
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        const score = calculateScore()
        const total = questions.length

        try {
            await submitQuiz(lessonId, score, total)
            setShowResults(true)
        } catch (e) {
            alert("Failed to save grade")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-8">
            {previousScore !== null && (
                <div className="bg-success/10 border border-success/30 p-4 rounded-xl flex items-center gap-3 text-success">
                    <CheckCircle size={20} />
                    <span className="font-bold">Completed! Score: {Math.round((previousScore / (totalRaw || 1)) * 100)}% ({previousScore}/{totalRaw})</span>
                </div>
            )}
            {questions.map((q: any, qIdx: number) => (
                <div key={qIdx} className="space-y-3">
                    <h4 className="font-semibold text-lg">{qIdx + 1}. {q.question}</h4>
                    <div className="space-y-2">
                        {q.options.map((opt: string, oIdx: number) => (
                            <button
                                key={oIdx}
                                onClick={() => !showResults && setAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                                className={`w-full text-left p-4 rounded-lg border transition-colors ${showResults
                                    ? oIdx === q.answer
                                        ? 'bg-success/20 border-success text-success'
                                        : answers[qIdx] === oIdx
                                            ? 'bg-danger/20 border-danger text-danger'
                                            : 'bg-bg-tertiary border-glass-border opacity-50'
                                    : answers[qIdx] === oIdx
                                        ? 'bg-accent-primary/20 border-accent-primary'
                                        : 'bg-bg-tertiary border-glass-border hover:border-accent-primary/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-sm ${showResults && oIdx === q.answer ? 'border-success bg-success text-black' :
                                        answers[qIdx] === oIdx ? 'border-accent-primary bg-accent-primary text-white' : 'border-text-muted'
                                        }`}>
                                        {['A', 'B', 'C', 'D'][oIdx]}
                                    </div>
                                    {opt}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            <div className="pt-4 border-t border-glass-border">
                {!showResults ? (
                    <button
                        onClick={handleSubmit}
                        disabled={Object.keys(answers).length !== questions.length || isSubmitting}
                        className="btn-primary w-full md:w-auto px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Saving Grade..." : "Submit Answers"}
                    </button>
                ) : (
                    <div className="p-4 bg-bg-secondary rounded-xl border border-glass-border text-center">
                        <p className="text-xl font-bold mb-2">
                            You scored {previousScore !== null ? previousScore : calculateScore()} / {questions.length}
                        </p>
                        <button
                            onClick={() => {
                                setShowResults(false)
                                setAnswers({})
                            }}
                            className="text-accent-primary hover:underline"
                        >
                            Retake Quiz
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
