'use client'

import { useState } from 'react'
import { CheckCircle, Circle, BrainCircuit, Play, MessageSquare, ArrowRight, Loader2 } from 'lucide-react'
import { scoreExplanation, submitQuestionAttempt } from '@/app/mastery-actions'
import { generateStudyHelp } from '@/app/ml-actions' // reusing for content gen

type Phase = 'WARMUP' | 'LESSON' | 'PRACTICE' | 'EXPLAIN' | 'QUIZ' | 'COMPLETE'

export default function MasteryLesson({ objective, onClose }: { objective: any, onClose: () => void }) {
    const [phase, setPhase] = useState<Phase>('WARMUP')
    const [content, setContent] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [input, setInput] = useState('')
    const [feedback, setFeedback] = useState<any>(null)

    // Load content on mount (simulated for now, would typically act based on phase)
    // For MVP, let's just generate the "Lesson" content immediately.

    // Helper to advance
    const next = () => {
        if (phase === 'WARMUP') setPhase('LESSON')
        else if (phase === 'LESSON') setPhase('PRACTICE')
        else if (phase === 'PRACTICE') setPhase('EXPLAIN')
        else if (phase === 'EXPLAIN') setPhase('QUIZ')
        else if (phase === 'QUIZ') setPhase('COMPLETE')
    }

    // Handlers
    const handleGenerateContent = async () => {
        setLoading(true)
        // We reuse the study helper to get an explanation + quiz
        const data = await generateStudyHelp(objective.description, "General")
        // We really need a specific "Generate Phase Content" action, but this works for MVP
        setContent(data)
        setLoading(false)
        setPhase('LESSON')
    }

    const handleExplainSubmit = async () => {
        setLoading(true)
        const res = await scoreExplanation(objective.id, input)
        setFeedback(res)
        setLoading(false)
    }

    const handleQuizSubmit = async (answerIdx: number) => {
        const isCorrect = answerIdx === content.quiz.answer
        await submitQuestionAttempt(objective.id, isCorrect, 0) // Hints 0 for now
        if (isCorrect) next()
        else alert("Incorrect, try again!")
    }

    if (phase === 'WARMUP' && !content) {
        return (
            <div className="flex flex-col items-center justify-center p-10 text-center h-[500px]">
                <h2 className="text-2xl font-bold font-serif mb-4">{objective.description}</h2>
                <p className="mb-6 text-text-secondary">Ready to master this concept?</p>
                <button onClick={handleGenerateContent} disabled={loading} className="btn-primary px-8 py-3 text-lg flex items-center gap-2">
                    {loading ? <Loader2 className="animate-spin" /> : <Play />} Start Lesson
                </button>
            </div>
        )
    }

    return (
        <div className="h-[600px] flex flex-col">
            {/* Progress Header */}
            <div className="flex items-center justify-between mb-6 p-4 border-b border-glass-border">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <span className={phase === 'LESSON' ? 'text-accent-primary' : 'text-text-muted'}>Details</span>
                    <ArrowRight size={14} />
                    <span className={phase === 'PRACTICE' ? 'text-accent-primary' : 'text-text-muted'}>Practice</span>
                    <ArrowRight size={14} />
                    <span className={phase === 'EXPLAIN' ? 'text-accent-primary' : 'text-text-muted'}>Explain</span>
                    <ArrowRight size={14} />
                    <span className={phase === 'QUIZ' ? 'text-accent-primary' : 'text-text-muted'}>Quiz</span>
                </div>
                <button onClick={onClose} className="text-sm text-text-muted hover:text-white">Close</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {phase === 'LESSON' && (
                    <div className="animate-in fade-in">
                        <h3 className="text-2xl font-bold font-serif mb-4 flex items-center gap-2">
                            <BrainCircuit /> Mini-Lesson
                        </h3>
                        <div className="prose prose-invert max-w-none">
                            <p className="text-lg leading-relaxed">{content?.explanation}</p>
                        </div>
                        <button onClick={next} className="mt-8 btn-primary w-full">I understand, let's practice</button>
                    </div>
                )}

                {phase === 'PRACTICE' && (
                    <div className="animate-in fade-in">
                        <h3 className="text-xl font-bold mb-4">Guided Practice</h3>
                        <p className="mb-4">Let's try a simple example first.</p>
                        {/* Placeholder for interactive practice */}
                        <div className="bg-bg-tertiary p-4 rounded-xl border border-glass-border mb-4">
                            What is the first step?
                            <input className="w-full mt-2 bg-bg-secondary p-2 rounded border border-glass-border" />
                        </div>
                        <button onClick={next} className="btn-primary w-full">Next Step</button>
                    </div>
                )}

                {phase === 'EXPLAIN' && (
                    <div className="animate-in fade-in">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <MessageSquare /> Explain It Back
                        </h3>
                        <p className="mb-4 text-text-secondary">
                            In your own words, explain <strong>{objective.description}</strong>.
                            Imagine you are teaching a friend.
                        </p>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="w-full h-32 bg-bg-tertiary border border-glass-border rounded-xl p-4 focus:border-accent-primary focus:outline-none mb-4"
                            placeholder="Type your explanation here..."
                        />

                        {feedback && (
                            <div className={`p-4 rounded-xl mb-4 border ${feedback.score > 70 ? 'bg-success/10 border-success' : 'bg-orange-500/10 border-orange-500'}`}>
                                <div className="font-bold flex justify-between">
                                    <span>Score: {feedback.score}/100</span>
                                </div>
                                <p className="text-sm mt-2">{feedback.feedback}</p>
                            </div>
                        )}

                        {!feedback ? (
                            <button onClick={handleExplainSubmit} disabled={!input || loading} className="btn-primary w-full">
                                {loading ? <Loader2 className="animate-spin" /> : 'Submit Explanation'}
                            </button>
                        ) : (
                            <button onClick={next} disabled={feedback.score < 70} className="btn-secondary w-full disabled:opacity-50">
                                {feedback.score >= 70 ? 'Continue to Quiz' : 'Try Again'}
                            </button>
                        )}
                    </div>
                )}

                {phase === 'QUIZ' && (
                    <div className="animate-in fade-in">
                        <h3 className="text-xl font-bold mb-4">Final Check</h3>
                        <div className="bg-bg-tertiary p-6 rounded-xl border border-glass-border">
                            <p className="text-lg font-medium mb-6">{content?.quiz.question}</p>
                            <div className="space-y-3">
                                {content?.quiz.options.map((opt: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleQuizSubmit(idx)}
                                        className="w-full text-left p-4 rounded-xl border border-glass-border hover:bg-bg-secondary hover:border-accent-primary transition-all"
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {phase === 'COMPLETE' && (
                    <div className="text-center py-20 animate-in zoom-in">
                        <div className="inline-block p-4 rounded-full bg-success/20 text-success mb-4">
                            <CheckCircle size={48} />
                        </div>
                        <h2 className="text-3xl font-bold font-serif mb-2">Objective Mastered!</h2>
                        <p className="text-text-secondary mb-8">You have proven your understanding.</p>
                        <button onClick={onClose} className="btn-primary px-8">Return to Course</button>
                    </div>
                )}
            </div>
        </div>
    )
}
