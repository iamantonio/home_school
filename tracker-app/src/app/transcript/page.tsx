import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Printer, ArrowLeft, Download } from 'lucide-react'
import SignOutButton from '@/components/SignOutButton'
import PrintButton from '@/components/PrintButton'

export default async function TranscriptPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const courses = await prisma.course.findMany({
        where: { userId: user.id },
        orderBy: [{ gradeLevel: 'asc' }, { title: 'asc' }]
    })

    // Calculate Stats
    const gradePoints: Record<string, number> = {
        'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0
    }

    let totalPoints = 0
    let totalCredits = 0
    const coursesByYear: Record<number, typeof courses> = {}

    courses.forEach(c => {
        if (!coursesByYear[c.gradeLevel]) coursesByYear[c.gradeLevel] = []
        coursesByYear[c.gradeLevel].push(c)

        if (c.grade && gradePoints[c.grade] !== undefined) {
            totalPoints += gradePoints[c.grade] * c.credits
            totalCredits += c.credits
        }
    })

    const cumulativeGPA = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 'N/A'

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary p-8 print:p-0 print:bg-white print:text-black">
            {/* No-Print Header */}
            <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center print:hidden">
                <a href="/" className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors">
                    <ArrowLeft size={20} /> Back to Dashboard
                </a>
                <PrintButton />
            </div>

            {/* Transcript Proper */}
            <div className="max-w-4xl mx-auto bg-white text-black p-12 shadow-2xl rounded-sm print:shadow-none print:w-full">
                <div className="text-center border-b-4 border-black pb-8 mb-8">
                    <h1 className="text-4xl font-serif font-bold tracking-wider mb-2 uppercase">Official High School Transcript</h1>
                    <div className="flex justify-between items-end mt-8">
                        <div className="text-left">
                            <p className="font-bold text-lg">Student Information</p>
                            <p>Name: [Student Name]</p>
                            <p>Date of Birth: [MM/DD/YYYY]</p>
                            <p>Graduation Year: [Year]</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-lg">School Information</p>
                            <p>Homeschool High School</p>
                            <p>123 Education Lane</p>
                            <p>City, State, Zip</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2">
                    {[9, 10, 11, 12].map(year => (
                        <div key={year} className="mb-6">
                            <h3 className="font-bold text-lg border-b-2 border-black mb-2 flex justify-between">
                                <span>Grade {year}</span>
                                <span className="text-sm font-normal pt-1">School Year: 20__ - 20__</span>
                            </h3>
                            {coursesByYear[year]?.length > 0 ? (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-300 text-left italic">
                                            <th className="py-1">Course Title</th>
                                            <th className="py-1 text-center">Grade</th>
                                            <th className="py-1 text-right">Credit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {coursesByYear[year].map(c => (
                                            <tr key={c.id} className="border-b border-gray-100">
                                                <td className="py-1 pr-2">{c.title} {c.isLabScience && '(Lab)'} {c.isNCAACore && '*'}</td>
                                                <td className="py-1 text-center font-mono">{c.grade || 'IP'}</td>
                                                <td className="py-1 text-right font-mono">{c.credits.toFixed(1)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-sm italic text-gray-400 mt-2">No courses recorded.</p>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-8 border-t-4 border-black flex justify-between items-start">
                    <div className="space-y-4">
                        <p className="font-bold uppercase text-sm">Notes:</p>
                        <p className="text-xs max-w-xs text-gray-600">* Indicates NCAA Core Course<br />(Lab) Indicates Lab Science</p>
                    </div>

                    <div className="text-right space-y-2">
                        <div className="flex justify-between gap-8 border-b border-gray-300 pb-1">
                            <span className="font-bold">Cumulative GPA:</span>
                            <span className="font-mono font-bold text-lg">{cumulativeGPA}</span>
                        </div>
                        <div className="flex justify-between gap-8 border-b border-gray-300 pb-1">
                            <span className="font-bold">Total Credits:</span>
                            <span className="font-mono font-bold text-lg">{totalCredits.toFixed(1)}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-16 flex justify-between items-end">
                    <div className="text-center w-64">
                        <div className="h-px bg-black w-full mb-2"></div>
                        <p className="text-sm font-serif italic">Signature of School Administrator</p>
                    </div>
                    <div className="text-center w-48">
                        <div className="h-px bg-black w-full mb-2"></div>
                        <p className="text-sm font-serif italic">Date</p>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { margin: 0.5in; }
                    body { background: white; color: black; }
                    .btn-primary, a { display: none !important; }
                }
            `}</style>
        </div>
    )
}
