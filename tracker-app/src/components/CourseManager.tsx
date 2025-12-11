'use client'


import { useState } from 'react'
import { Plus, Trash2, X, GraduationCap, FlaskConical, Trophy, BookOpen, Sparkles, Loader2 } from 'lucide-react'
import { addCourse, deleteCourse, autoGeneratePlan } from '@/app/actions'
import CourseCatalog from './CourseCatalog'

interface Course {
    id: string
    title: string
    subject: string
    credits: number
    gradeLevel: number
    grade: string | null
    isLabScience: boolean
    isNCAACore: boolean
    term: string
}

interface CourseManagerProps {
    courses: Course[]
}

export default function CourseManager({ courses }: CourseManagerProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isCatalogOpen, setIsCatalogOpen] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [selectedYear, setSelectedYear] = useState<number>(9)

    const handleOpenModal = (year: number) => {
        setSelectedYear(year)
        setIsModalOpen(true)
    }

    const handleOpenCatalog = (year: number) => {
        setSelectedYear(year)
        setIsCatalogOpen(true)
    }

    const handleAutoGenerate = async () => {
        if (!confirm("This will add a standard 4-year curriculum to your plan (20+ courses). existing courses will be kept. Continue?")) {
            return
        }

        setIsGenerating(true)
        try {
            await autoGeneratePlan()
        } catch (error) {
            console.error("Failed to auto-generate plan", error)
            alert("Something went wrong. Please try again.")
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-text-primary">Course Plan</h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleAutoGenerate}
                        disabled={isGenerating}
                        className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-xl border border-glass-border hover:bg-bg-tertiary transition-colors text-accent-secondary disabled:opacity-50"
                    >
                        {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                        Auto-Fill Plan
                    </button>
                    <button className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-xl border border-glass-border hover:bg-bg-tertiary transition-colors" onClick={() => handleOpenCatalog(9)}>
                        <BookOpen size={20} /> Browse Catalog
                    </button>
                    <button className="btn-primary flex items-center gap-2" onClick={() => handleOpenModal(9)}>
                        <Plus size={20} /> Add Custom
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {[9, 10, 11, 12].map((year) => (
                    <div key={year} className="bg-bg-secondary rounded-2xl p-5 border border-glass-border">
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-glass-border">
                            <span className="text-lg font-semibold text-accent-primary">Grade {year}</span>
                            <div className="flex gap-2">
                                <button
                                    className="text-xs text-text-secondary hover:text-accent-primary hover:underline flex items-center gap-1"
                                    onClick={() => handleOpenCatalog(year)}
                                >
                                    <BookOpen size={12} /> Catalog
                                </button>
                                <button
                                    className="text-xs text-accent-primary hover:underline"
                                    onClick={() => handleOpenModal(year)}
                                >
                                    + Custom
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {courses.filter(c => c.gradeLevel === year).map(course => (
                                <div key={course.id} className="relative group bg-bg-tertiary border border-glass-border rounded-xl p-3 hover:-translate-y-0.5 hover:border-accent-primary hover:shadow-md transition-all cursor-default overflow-hidden">
                                    <div className="flex justify-between items-center mb-1">
                                        <a href={`/course/${course.id}`} className="font-medium text-text-primary text-sm truncate pr-2 hover:text-accent-primary hover:underline transition-colors block flex-1">
                                            {course.title}
                                        </a>
                                        {course.grade && (
                                            <span className="text-xs font-bold text-success bg-success/10 px-1.5 py-0.5 rounded">
                                                {course.grade}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex gap-3 text-xs text-text-secondary">
                                        <span>{course.credits} Cr</span>
                                        <span>•</span>
                                        <span>{course.subject}</span>
                                    </div>

                                    <div className="flex gap-2 mt-2">
                                        {course.isLabScience && (
                                            <span title="Lab Science" className="text-accent-secondary">
                                                <FlaskConical size={14} />
                                            </span>
                                        )}
                                        {course.isNCAACore && (
                                            <span title="NCAA Core" className="text-success">
                                                <Trophy size={14} />
                                            </span>
                                        )}
                                    </div>

                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => deleteCourse(course.id)}
                                            className="p-1 text-danger hover:bg-bg-primary rounded transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Catalog Modal */}
            {isCatalogOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-bg-secondary border border-glass-border rounded-2xl w-full max-w-2xl shadow-2xl animate-in slide-in-from-bottom-5 duration-300 flex flex-col max-h-[80vh]">
                        <div className="flex justify-between items-center p-4 border-b border-glass-border">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <BookOpen className="text-accent-primary" /> Browse Curriculum
                            </h3>
                            <button onClick={() => setIsCatalogOpen(false)} className="text-text-secondary hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <CourseCatalog gradeLevel={selectedYear} onClose={() => setIsCatalogOpen(false)} />
                    </div>
                </div>
            )}

            {/* Custom Course Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-bg-secondary border border-glass-border rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Add Custom Course - Grade {selectedYear}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-text-secondary hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form action={async (formData) => {
                            await addCourse(formData);
                            setIsModalOpen(false);
                        }}>
                            <input type="hidden" name="gradeLevel" value={selectedYear} />

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-text-muted mb-1.5">Course Title</label>
                                <input required name="title" className="w-full p-2.5 bg-bg-tertiary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors" placeholder="e.g. Zoology" />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1.5">Subject</label>
                                    <select name="subject" className="w-full p-2.5 bg-bg-tertiary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:border-accent-primary">
                                        <option value="English">English</option>
                                        <option value="Math">Math</option>
                                        <option value="Science">Science (Lab/Gen)</option>
                                        <option value="SocialScience">Social Science</option>
                                        <option value="WorldLanguage">World Language</option>
                                        <option value="Arts">Arts</option>
                                        <option value="Elective">Elective</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1.5">Credits</label>
                                    <select name="credits" className="w-full p-2.5 bg-bg-tertiary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:border-accent-primary" defaultValue="1.0">
                                        <option value="0.5">0.5 (Semester)</option>
                                        <option value="1.0">1.0 (Year)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-5">
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1.5">Term</label>
                                    <select name="term" className="w-full p-2.5 bg-bg-tertiary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:border-accent-primary">
                                        <option value="Year">Full Year</option>
                                        <option value="Fall">Fall</option>
                                        <option value="Spring">Spring</option>
                                        <option value="Summer">Summer</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1.5">Grade (Optional)</label>
                                    <select name="grade" className="w-full p-2.5 bg-bg-tertiary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:border-accent-primary">
                                        <option value="">In Progress</option>
                                        <option value="A">A (4.0)</option>
                                        <option value="A-">A- (3.7)</option>
                                        <option value="B+">B+ (3.3)</option>
                                        <option value="B">B (3.0)</option>
                                        <option value="B-">B- (2.7)</option>
                                        <option value="C+">C+ (2.3)</option>
                                        <option value="C">C (2.0)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <label className="flex items-center gap-3 text-sm text-text-primary cursor-pointer">
                                    <input type="checkbox" name="isLabScience" className="w-4 h-4 rounded border-glass-border bg-bg-tertiary text-accent-primary focus:ring-accent-primary" />
                                    <span className="flex items-center gap-2"><FlaskConical size={16} /> counts as Lab Science</span>
                                </label>

                                <label className="flex items-center gap-3 text-sm text-text-primary cursor-pointer">
                                    <input type="checkbox" name="isNCAACore" defaultChecked className="w-4 h-4 rounded border-glass-border bg-bg-tertiary text-accent-primary focus:ring-accent-primary" />
                                    <span className="flex items-center gap-2"><Trophy size={16} /> counts for NCAA Division I</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-glass-border rounded-xl text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors">Cancel</button>
                                <button type="submit" className="btn-primary">Save Course</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
