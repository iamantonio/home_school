'use client'

import { useState } from 'react'
import { Clock, Plus } from 'lucide-react'
import { logHours } from '@/app/actions'

interface HourLog {
    id: string
    date: Date
    minutes: number
    activity: string | null
}

export default function HourLogger({ courseId, logs }: { courseId: string, logs: HourLog[] }) {
    const [isLogging, setIsLogging] = useState(false)

    const totalMinutes = logs.reduce((acc, l) => acc + l.minutes, 0)
    const totalHours = (totalMinutes / 60).toFixed(1)

    // Illinois Requirement: ~120-180 hours for 1 credit
    // Progress bar for 120 hours (standard minimum)
    const progress = Math.min((totalMinutes / (120 * 60)) * 100, 100)

    return (
        <div className="glass-panel p-6">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Clock className="text-accent-primary" /> Instructional Hours
                    </h3>
                    <p className="text-text-secondary text-sm">Track time for state compliance.</p>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-bold font-mono">{totalHours}</span>
                    <span className="text-sm text-text-muted ml-1">hrs</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6 space-y-1">
                <div className="flex justify-between text-xs text-text-secondary">
                    <span>Progress to 1 Credit (120h)</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 w-full bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                        className="h-full bg-accent-primary transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 mb-4 custom-scrollbar">
                {logs.length === 0 && (
                    <div className="text-center py-4 text-text-muted text-sm italic">
                        No hours logged yet.
                    </div>
                )}
                {logs.map(log => (
                    <div key={log.id} className="text-sm flex justify-between items-center py-2 border-b border-glass-border last:border-0">
                        <div>
                            <span className="font-mono text-text-secondary">{new Date(log.date).toLocaleDateString()}</span>
                            <span className="mx-2 text-text-muted">-</span>
                            <span>{log.activity || 'Instruction'}</span>
                        </div>
                        <div className="font-bold text-accent-secondary">
                            {log.minutes}m
                        </div>
                    </div>
                ))}
            </div>

            {isLogging ? (
                <form action={async (formData) => {
                    const mins = parseInt(formData.get('minutes') as string)
                    const activity = formData.get('activity') as string
                    const date = new Date(formData.get('date') as string)

                    await logHours(courseId, mins, date, activity)
                    setIsLogging(false)
                }} className="bg-bg-tertiary p-4 rounded-xl border border-glass-border space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-text-muted block mb-1">Date</label>
                            <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-2 rounded bg-bg-secondary border border-glass-border focus:border-accent-primary focus:outline-none" />
                        </div>
                        <div>
                            <label className="text-xs text-text-muted block mb-1">Minutes</label>
                            <input name="minutes" type="number" required defaultValue="60" className="w-full p-2 rounded bg-bg-secondary border border-glass-border focus:border-accent-primary focus:outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-text-muted block mb-1">Activity</label>
                        <input name="activity" placeholder="e.g. Chapter 5 Quiz" required className="w-full p-2 rounded bg-bg-secondary border border-glass-border focus:border-accent-primary focus:outline-none" />
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                        <button type="button" onClick={() => setIsLogging(false)} className="text-xs text-text-secondary hover:text-white">Cancel</button>
                        <button type="submit" className="btn-primary py-1 px-3 text-sm">Save Log</button>
                    </div>
                </form>
            ) : (
                <button
                    onClick={() => setIsLogging(true)}
                    className="w-full py-2 border border-dashed border-glass-border rounded-xl text-text-secondary hover:bg-bg-tertiary hover:text-accent-primary transition-colors flex items-center justify-center gap-2"
                >
                    <Plus size={16} /> Log Hours
                </button>
            )}
        </div>
    )
}
