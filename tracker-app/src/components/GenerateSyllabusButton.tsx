'use client'

import { useFormStatus } from 'react-dom'
import { Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function GenerateSyllabusButton() {
    const { pending } = useFormStatus()
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        if (pending) {
            setProgress(0)
            const interval = setInterval(() => {
                setProgress(prev => {
                    // Simulate progress: fast at first, then slower, capping at 90%
                    if (prev >= 90) return prev
                    const increment = prev < 50 ? 5 : 2
                    return prev + increment
                })
            }, 800) // Update every 800ms
            return () => clearInterval(interval)
        } else {
            setProgress(0)
        }
    }, [pending])

    if (pending) {
        return (
            <div className="w-full max-w-md mx-auto space-y-2">
                <div className="flex justify-between text-sm text-accent-primary font-semibold">
                    <span>Generating Syllabus...</span>
                    <span>{progress}%</span>
                </div>
                <div className="h-4 w-full bg-bg-secondary rounded-full overflow-hidden border border-glass-border">
                    <div
                        className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-xs text-center text-text-muted animate-pulse">
                    Crafting lesson plans, quizzes, and finding videos...
                </p>
            </div>
        )
    }

    return (
        <button
            type="submit"
            className="btn-primary flex items-center gap-3 mx-auto px-8 py-4 text-xl shadow-lg shadow-accent-primary/20 hover:scale-105 transition-transform"
        >
            <Sparkles size={24} />
            Generate Complete Syllabus
        </button>
    )
}
