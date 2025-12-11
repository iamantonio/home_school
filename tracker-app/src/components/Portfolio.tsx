'use client'

import { useState } from 'react'
import { Plus, Trophy, Clock, X, Briefcase } from 'lucide-react'
import { addExtracurricular, deleteExtracurricular } from '@/app/actions'

interface Extracurricular {
    id: string
    title: string
    role: string | null
    hours: number
    description: string | null
    category: string
}

export default function Portfolio({ activities }: { activities: Extracurricular[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <div className="glass-panel p-6 h-full flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-xl font-bold font-serif text-text-primary">
                        Extracurriculars
                    </h2>
                    <p className="text-text-secondary text-xs mt-1">Sports, Clubs, Service.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="p-2 rounded-lg border border-glass-border hover:bg-bg-tertiary transition-colors text-accent-primary"
                    title="Add Activity"
                >
                    <Plus size={20} />
                </button>
            </div>

            <div className="space-y-4 flex-1">
                {activities.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center py-8 text-text-secondary border-2 border-dashed border-glass-border rounded-xl bg-bg-tertiary/30">
                        <Trophy className="opacity-20 mb-2" size={32} />
                        <p className="text-sm italic">No activities yet.</p>
                        <p className="text-xs text-text-muted mt-1 max-w-[150px]">Colleges love well-rounded students!</p>
                    </div>
                )}
                {activities.map(activity => (
                    <div key={activity.id} className="bg-bg-tertiary rounded-xl p-4 border border-glass-border flex justify-between items-start group">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-bold text-lg">{activity.title}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColors[activity.category] || 'bg-gray-100 text-gray-800'}`}>
                                    {activity.category}
                                </span>
                            </div>
                            <p className="text-text-secondary text-sm mb-2">{activity.role || 'Participant'}</p>
                            <p className="text-sm text-text-muted">{activity.description}</p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center justify-end gap-1 text-accent-secondary font-bold mb-2">
                                <Clock size={16} /> {activity.hours} hrs
                            </div>
                            <button
                                onClick={() => deleteExtracurricular(activity.id)}
                                className="text-danger opacity-0 group-hover:opacity-100 transition-opacity hover:underline text-xs"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-bg-secondary border border-glass-border rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Add Activity</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="text-text-secondary" /></button>
                        </div>
                        <form action={async (formData) => {
                            await addExtracurricular(formData)
                            setIsModalOpen(false)
                        }}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Title</label>
                                    <input name="title" required placeholder="e.g. Debate Club" className="w-full p-2 rounded-xl bg-bg-tertiary border border-glass-border focus:border-accent-primary focus:outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Category</label>
                                        <select name="category" className="w-full p-2 rounded-xl bg-bg-tertiary border border-glass-border focus:border-accent-primary focus:outline-none">
                                            <option value="Club">Club</option>
                                            <option value="Sport">Sport</option>
                                            <option value="Volunteer">Volunteer</option>
                                            <option value="Work">Work</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Hours</label>
                                        <input name="hours" type="number" required defaultValue="0" className="w-full p-2 rounded-xl bg-bg-tertiary border border-glass-border focus:border-accent-primary focus:outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Role / Position</label>
                                    <input name="role" placeholder="e.g. Treasurer" className="w-full p-2 rounded-xl bg-bg-tertiary border border-glass-border focus:border-accent-primary focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea name="description" rows={3} placeholder="What did you achieve?" className="w-full p-2 rounded-xl bg-bg-tertiary border border-glass-border focus:border-accent-primary focus:outline-none" />
                                </div>
                                <button type="submit" className="btn-primary w-full py-3">Save Activity</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

const categoryColors: Record<string, string> = {
    'Sport': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Club': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'Volunteer': 'bg-green-500/10 text-green-400 border-green-500/20',
    'Work': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    'Other': 'bg-gray-500/10 text-gray-400 border-gray-500/20'
}
