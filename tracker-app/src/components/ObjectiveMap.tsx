'use client'

import { useState } from 'react'
import { CheckCircle, Circle, AlertCircle, BrainCircuit, Play, Sparkles } from 'lucide-react'
import MasteryLesson from './MasteryLesson'
import { generateObjectives } from '@/app/mastery-actions'

type Objective = {
    id: string
    description: string
    mastery: {
        masteryScore: number
        explanationScore: number
        numAttempts: number
    }[]
}

export default function ObjectiveMap({ courseId, objectives: initialObjectives }: { courseId: string, objectives: Objective[] }) {
    const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)

    const handleGenerate = async () => {
        setIsGenerating(true)
        try {
            await generateObjectives(courseId)
            // Ideally we'd trigger a router refresh here, but for now we rely on the parent or user refresh
            window.location.reload()
        } catch (e) {
            alert("Failed to generate objectives")
        } finally {
            setIsGenerating(false)
        }
    }

    if (selectedObjective) {
        return (
            <div className="glass-panel p-0 overflow-hidden">
                <MasteryLesson
                    objective={selectedObjective}
                    onClose={() => {
                        setSelectedObjective(null)
                        window.location.reload() // quick way to refresh scores
                    }}
                />
            </div>
        )
    }

    if (!initialObjectives || initialObjectives.length === 0) {
        return (
            <div className="glass-panel p-10 text-center flex flex-col items-center justify-center min-h-[400px]">
                <BrainCircuit size={48} className="text-text-muted mb-4" />
                <h3 className="text-xl font-bold mb-2">No Learning Map Yet</h3>
                <p className="text-text-secondary mb-6 max-w-md">
                    Switch to Mastery Learning mode. Generate a map of specific skills to master for this course.
                </p>
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="btn-primary px-6 py-3 flex items-center gap-2"
                >
                    {isGenerating ? <Sparkles className="animate-spin" /> : <Sparkles />}
                    Generate Objective Map
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold font-serif text-text-primary">Mastery Map</h3>
                <span className="text-xs text-text-muted">
                    {initialObjectives.filter(o => (o.mastery[0]?.masteryScore || 0) >= 85).length} / {initialObjectives.length} Mastered
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {initialObjectives.map((obj, idx) => {
                    const status = obj.mastery[0] || { masteryScore: 0, explanationScore: 0, numAttempts: 0 }
                    const isMastered = status.masteryScore >= 85 && status.explanationScore >= 70
                    const isProcedural = status.masteryScore >= 85 && status.explanationScore < 70
                    const isStarted = status.numAttempts > 0

                    let borderColor = 'border-glass-border'
                    if (isMastered) borderColor = 'border-success'
                    else if (isProcedural) borderColor = 'border-accent-secondary' // Knowledge but no explain
                    else if (isStarted) borderColor = 'border-accent-primary'

                    return (
                        <div
                            key={obj.id}
                            onClick={() => setSelectedObjective(obj)}
                            className={`p-4 rounded-xl border ${borderColor} bg-bg-tertiary cursor-pointer hover:bg-bg-secondary hover:translate-y-[-2px] transition-all relative group`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-mono text-text-muted">Unit {idx + 1}</span>
                                {isMastered && <CheckCircle size={16} className="text-success" />}
                                {isProcedural && <AlertCircle size={16} className="text-accent-secondary" />}
                                {!isStarted && !isMastered && <Circle size={16} className="text-glass-border" />}
                            </div>

                            <h4 className="font-bold text-sm mb-3 leading-snug">{obj.description}</h4>

                            <div className="flex items-center gap-2 text-xs">
                                <div className="flex-1 h-1.5 bg-bg-primary rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${isMastered ? 'bg-success' : 'bg-accent-primary'}`}
                                        style={{ width: `${status.masteryScore}%` }}
                                    ></div>
                                </div>
                                <span className="w-8 text-right font-mono">{Math.round(status.masteryScore)}%</span>
                            </div>

                            <button className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px] rounded-xl font-bold gap-2">
                                <Play size={16} /> Start Lesson
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
