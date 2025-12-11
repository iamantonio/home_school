'use client'

import { useState } from 'react'
import { Sparkles, Youtube, BookOpen, BrainCircuit, Loader2 } from 'lucide-react'
import { generateStudyHelp } from '@/app/ml-actions'

export default function StudyBuddy({ subject }: { subject: string }) {
    const [query, setQuery] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [quizState, setQuizState] = useState<'unanswered' | 'correct' | 'incorrect'>('unanswered')

    const handleAsk = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return

        setIsLoading(true)
        setResult(null)
        setQuizState('unanswered')

        try {
            const data = await generateStudyHelp(query, subject)
            setResult(data)
        } catch (err) {
            alert("AI Tutor is busy. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="glass-panel p-6 h-full flex flex-col relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/10 blur-3xl rounded-full pointer-events-none"></div>

            <div className="flex items-center gap-2 mb-4 relative z-10">
                <BrainCircuit className="text-accent-primary" />
                <h3 className="text-xl font-bold font-serif">AI Tutor</h3>
            </div>

            <p className="text-text-secondary text-sm mb-4">
                Stuck on a concept? Ask for a quick explanation, video, and quiz.
            </p>

            <form onSubmit={handleAsk} className="mb-6 relative z-10">
                <div className="flex gap-2">
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={`e.g. "How does ${subject} work?"`}
                        className="flex-1 bg-bg-tertiary border border-glass-border rounded-xl px-4 py-2 focus:outline-none focus:border-accent-primary transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary px-3 rounded-xl flex items-center justify-center disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                    </button>
                </div>
            </form>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
                {result && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        {/* Explanation */}
                        <div className="bg-bg-tertiary/50 p-4 rounded-xl border border-glass-border">
                            <h4 className="font-bold text-accent-primary flex items-center gap-2 mb-2">
                                <BookOpen size={16} /> Explanation
                            </h4>
                            <p className="text-sm leading-relaxed">{result.explanation}</p>
                        </div>

                        {/* Video */}
                        <a
                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(result.videoQuery)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-red-500/10 hover:bg-red-500/20 text-red-400 p-3 rounded-xl border border-red-500/20 transition-colors flex items-center justify-between group"
                        >
                            <span className="flex items-center gap-2 font-medium">
                                <Youtube size={18} /> Watch Video
                            </span>
                            <span className="text-xs opacity-50 group-hover:opacity-100 transition-opacity">
                                Open YouTube &rarr;
                            </span>
                        </a>

                        {/* Quiz */}
                        <div className="bg-bg-tertiary/50 p-4 rounded-xl border border-glass-border">
                            <h4 className="font-bold text-accent-secondary flex items-center gap-2 mb-3">
                                <BrainCircuit size={16} /> Quick Quiz
                            </h4>
                            <p className="font-medium text-sm mb-3">{result.quiz.question}</p>
                            <div className="space-y-2">
                                {result.quiz.options.map((opt: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setQuizState(idx === result.quiz.answer ? 'correct' : 'incorrect')}
                                        disabled={quizState === 'correct'}
                                        className={`w-full text-left p-2 rounded-lg text-sm transition-all border ${quizState === 'correct' && idx === result.quiz.answer ? 'bg-success/20 border-success text-success' :
                                                quizState === 'incorrect' ? 'disabled:opacity-50 border-glass-border hover:bg-bg-primary' :
                                                    'border-glass-border hover:bg-bg-primary'
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                            {quizState === 'correct' && (
                                <p className="text-xs text-success font-bold mt-2 text-center animate-bounce">Correct! Great job.</p>
                            )}
                            {quizState === 'incorrect' && (
                                <p className="text-xs text-danger font-bold mt-2 text-center">Not quite. Try reading the explanation again!</p>
                            )}
                        </div>
                    </div>
                )}
                {!result && !isLoading && (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                        <Sparkles size={48} className="mb-2" />
                        <p>Ask anything about {subject}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
