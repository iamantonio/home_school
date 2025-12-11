export type Course = {
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

export type RequirementStatus = {
    name: string
    current: number
    required: number
    met: boolean
    message?: string
}

export type AcademicProgress = {
    uw: {
        english: RequirementStatus
        math: RequirementStatus
        socialScience: RequirementStatus
        worldLanguage: RequirementStatus
        science: RequirementStatus
        seniorQuant: RequirementStatus
        arts: RequirementStatus
    }
    ncaa: {
        totalCore: RequirementStatus // 16 credits
        lockedCourses: RequirementStatus // 10/7 rule
        gpa: number
    }
}

export function calculateProgress(courses: Course[]): AcademicProgress {
    // UW Requirements
    const english = courses.filter(c => c.subject === 'English').reduce((acc, c) => acc + c.credits, 0)
    const math = courses.filter(c => c.subject === 'Math').reduce((acc, c) => acc + c.credits, 0)
    const socialScience = courses.filter(c => c.subject === 'SocialScience').reduce((acc, c) => acc + c.credits, 0)
    const worldLanguage = courses.filter(c => c.subject === 'WorldLanguage').reduce((acc, c) => acc + c.credits, 0)
    const science = courses.filter(c => c.subject === 'Science' && c.isLabScience).reduce((acc, c) => acc + c.credits, 0) // UW requires Lab? Mostly.
    const arts = courses.filter(c => c.subject === 'Arts').reduce((acc, c) => acc + c.credits, 0)

    // Senior Quant: Math or Algebra-based science in 12th grade
    const seniorQuantCourses = courses.filter(c =>
        c.gradeLevel === 12 &&
        (c.subject === 'Math' || (c.subject === 'Science' && c.title.includes('Algebra') /* simplified check, ideally specific flag */)) // Simplified for now
    )
    // Actually, any math-based quantitative course. Let's assume all Math in 12th grade counts.
    const seniorQuant = seniorQuantCourses.reduce((acc, c) => acc + c.credits, 0)


    // NCAA Requirements
    const ncaaCore = courses.filter(c => c.isNCAACore)
    const totalNcaaCredits = ncaaCore.reduce((acc, c) => acc + c.credits, 0)

    // 10/7 Rule: 10 core courses by start of 7th semester (start of 12th grade, so end of 11th)
    // 7 of those must be English, Math, or Science.
    const ncaaLockedTimestamp = courses.filter(c => c.gradeLevel < 12 && c.isNCAACore)
    const lockedCount = ncaaLockedTimestamp.reduce((acc, c) => acc + c.credits, 0) // Approximation using credits as count for simplicity, ideally it's "courses" but usually 0.5 cr = 1 course for semester? NCAA counts "units". 1 unit = 1 year.
    // Actually NCAA counts "courses" as 16 core COURSES (units). So credits sum is correct if 1.0 = 1 year.

    const sevenLockedSubjects = ['English', 'Math', 'Science']
    const lockedSevenCount = ncaaLockedTimestamp
        .filter(c => sevenLockedSubjects.includes(c.subject))
        .reduce((acc, c) => acc + c.credits, 0)

    // GPA (NCAA Core)
    let ncaaPoints = 0
    let ncaaGradedCredits = 0
    const gradeMap: Record<string, number> = { 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'D': 1.0 }

    ncaaCore.forEach(c => {
        if (c.grade && gradeMap[c.grade]) {
            ncaaPoints += gradeMap[c.grade] * c.credits
            ncaaGradedCredits += c.credits
        }
    })
    const ncaaGpa = ncaaGradedCredits > 0 ? ncaaPoints / ncaaGradedCredits : 0

    return {
        uw: {
            english: { name: 'English', current: english, required: 4, met: english >= 4 },
            math: { name: 'Math', current: math, required: 3, met: math >= 3 },
            socialScience: { name: 'Social Science', current: socialScience, required: 3, met: socialScience >= 3 },
            worldLanguage: { name: 'World Language', current: worldLanguage, required: 2, met: worldLanguage >= 2 },
            science: { name: 'Lab Science', current: science, required: 3, met: science >= 3 },
            seniorQuant: { name: 'Senior Quant', current: seniorQuant, required: 1, met: seniorQuant >= 1 || math >= 4 }, // If taken Pre-Calc (4th year math) earlier, technically met, but let's stick to simple rule first.
            arts: { name: 'Arts', current: arts, required: 1, met: arts >= 1 }
        },
        ncaa: {
            totalCore: { name: 'Total Core Courses', current: totalNcaaCredits, required: 16, met: totalNcaaCredits >= 16 },
            lockedCourses: {
                name: '10/7 Locked',
                current: lockedCount,
                required: 10,
                met: lockedCount >= 10 && lockedSevenCount >= 7,
                message: `${lockedCount}/10 Core, ${lockedSevenCount}/7 Eng/Math/Sci`
            },
            gpa: parseFloat(ncaaGpa.toFixed(2))
        }
    }
}
