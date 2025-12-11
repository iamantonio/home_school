'use client'

import { AcademicProgress, RequirementStatus } from '@/lib/requirements'
import { Trophy, GraduationCap, AlertCircle, CheckCircle2 } from 'lucide-react'

function ProgressRing({ current, required, label, met }: { current: number, required: number, label: string, met: boolean }) {
    const percentage = Math.min(100, (current / required) * 100)
    const radius = 36
    const circumference = radius * 2 * Math.PI
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    const color = met ? 'var(--success)' : (percentage > 50 ? 'var(--warning)' : 'var(--danger)')

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-glass-bg backdrop-blur-xl border border-glass-border rounded-2xl shadow-sm hover:bg-bg-tertiary transition-colors">
            <div className="relative w-24 h-24 mb-3">
                {/* Background Circle */}
                <svg className="transform -rotate-90 w-full h-full">
                    <circle
                        className="text-bg-tertiary"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="48"
                        cy="48"
                    />
                    {/* Progress Circle */}
                    <circle
                        className="transition-all duration-1000 ease-out"
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        stroke={color}
                        fill="transparent"
                        r={radius}
                        cx="48"
                        cy="48"
                    />
                </svg>
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-lg font-bold text-text-primary">
                    {current}/{required}
                </div>
            </div>
            <div className="text-sm font-medium text-center text-text-secondary">{label}</div>
            {met && <CheckCircle2 className="mt-2 text-success" size={16} />}
        </div>
    )
}

export default function ProgressDashboard({ progress }: { progress: AcademicProgress }) {
    return (
        <div className="space-y-8">

            {/* UW Section */}
            <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                    <GraduationCap className="text-accent-primary" size={28} />
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-accent-primary to-white bg-clip-text text-transparent">
                        University of Washington (CADR)
                    </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    <ProgressRing {...progress.uw.english} label="English" />
                    <ProgressRing {...progress.uw.math} label="Math" />
                    <ProgressRing {...progress.uw.socialScience} label="Soc. Sci" />
                    <ProgressRing {...progress.uw.science} label="Lab Sci" />
                    <ProgressRing {...progress.uw.worldLanguage} label="Language" />
                    <ProgressRing {...progress.uw.arts} label="Arts" />
                    <ProgressRing {...progress.uw.seniorQuant} label="Sen. Quant" />
                </div>
            </section>

            {/* NCAA Section */}
            <section className="bg-glass-bg backdrop-blur-xl border border-glass-border rounded-2xl shadow-sm p-6 border-l-4 border-l-accent-secondary">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Trophy className="text-accent-secondary" size={28} />
                        <h2 className="text-2xl font-bold text-text-primary">
                            NCAA Division I Eligibility
                        </h2>
                    </div>

                    <div className="text-right">
                        <div className={`text-3xl font-bold ${progress.ncaa.gpa >= 2.3 ? 'text-success' : 'text-danger'}`}>
                            {progress.ncaa.gpa.toFixed(2)}
                        </div>
                        <div className="text-xs uppercase text-text-muted tracking-wider">Core GPA (&gt;2.3)</div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <div className="flex justify-between mb-2 text-base text-text-primary">
                            <span>Total Core Courses</span>
                            <span className="font-bold">{progress.ncaa.totalCore.current}/16</span>
                        </div>
                        <div className="w-full bg-bg-tertiary rounded-full h-2.5 overflow-hidden">
                            <div
                                className="bg-accent-secondary h-full rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(100, (progress.ncaa.totalCore.current / 16) * 100)}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-text-muted mt-2">Required: 4 Eng, 3 Math, 2 Sci, 1 Add, 2 Soc, 4 Any</p>
                    </div>

                    <div>
                        <div className="flex justify-between mb-2 text-base text-text-primary">
                            <span>10/7 Locked Rule (Pre-Senior Year)</span>
                            <span className={`flex items-center gap-2 font-bold ${progress.ncaa.lockedCourses.met ? 'text-success' : 'text-warning'}`}>
                                {progress.ncaa.lockedCourses.met ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                Status
                            </span>
                        </div>
                        <div className="text-sm text-text-secondary">
                            {progress.ncaa.lockedCourses.message}
                        </div>
                        <p className="text-xs text-text-muted mt-2">
                            Must complete 10 core courses before 7th semester.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}
