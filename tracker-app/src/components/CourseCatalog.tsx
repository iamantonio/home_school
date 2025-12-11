'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, BookOpen, Loader2 } from 'lucide-react'
import { getCourseTemplates, addCourseFromTemplate } from '@/app/actions'

interface CourseTemplate {
    id: string
    title: string
    subject: string
    credits: number
    isLabScience: boolean
    isNCAACore: boolean
}

interface CourseCatalogProps {
    gradeLevel: number
    onClose: () => void
}

export default function CourseCatalog({ gradeLevel, onClose }: CourseCatalogProps) {
    const [query, setQuery] = useState('')
    const [templates, setTemplates] = useState<CourseTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [addingId, setAddingId] = useState<string | null>(null)

    useEffect(() => {
        // Initial load
        fetchTemplates()
    }, [])

    // Debounced search could be added here, but simple effect is okay for now
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTemplates(query)
        }, 300)
        return () => clearTimeout(timer)
    }, [query])

    const fetchTemplates = async (q?: string) => {
        setLoading(true)
        try {
            const data = await getCourseTemplates(q)
            setTemplates(data)
        } finally {
            setLoading(false)
        }
    }

    const handleAdd = async (templateId: string) => {
        setAddingId(templateId)
        try {
            await addCourseFromTemplate(templateId, gradeLevel)
            onClose() // Close modal after adding
        } catch (error) {
            console.error("Failed to add course", error)
        } finally {
            setAddingId(null)
        }
    }

    return (
        <div className="flex flex-col h-[500px]">
            <div className="p-4 border-b border-glass-border">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input
                        type="text"
                        placeholder="Search curriculum (e.g. Algebra, History)..."
                        className="w-full pl-10 pr-4 py-2 bg-bg-tertiary border border-glass-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {loading ? (
                    <div className="flex justify-center py-8 text-text-muted">
                        <Loader2 className="animate-spin" size={24} />
                    </div>
                ) : templates.length === 0 ? (
                    <div className="text-center py-8 text-text-muted">
                        <BookOpen size={48} className="mx-auto mb-2 opacity-50" />
                        <p>No courses found matching "{query}"</p>
                    </div>
                ) : (
                    templates.map(template => (
                        <div key={template.id} className="flex items-center justify-between p-3 bg-bg-tertiary border border-glass-border rounded-xl hover:border-accent-primary transition-colors group">
                            <div>
                                <h4 className="font-semibold text-text-primary">{template.title}</h4>
                                <div className="flex gap-2 text-xs text-text-secondary mt-1">
                                    <span className="bg-bg-primary px-2 py-0.5 rounded-md border border-glass-border">{template.subject}</span>
                                    <span>{template.credits} Credits</span>
                                    {template.isNCAACore && <span className="text-success flex items-center gap-1">• NCAA Core</span>}
                                    {template.isLabScience && <span className="text-accent-secondary flex items-center gap-1">• Lab Science</span>}
                                </div>
                            </div>

                            <button
                                onClick={() => handleAdd(template.id)}
                                disabled={addingId === template.id}
                                className="p-2 bg-accent-primary/10 text-accent-primary rounded-lg hover:bg-accent-primary hover:text-white transition-colors disabled:opacity-50"
                            >
                                {addingId === template.id ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                            </button>
                        </div>
                    ))
                )}
            </div>

            <div className="p-3 bg-bg-secondary border-t border-glass-border text-xs text-center text-text-muted">
                Adding to Grade {gradeLevel}
            </div>
        </div>
    )
}
