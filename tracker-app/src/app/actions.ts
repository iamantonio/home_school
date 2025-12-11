'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function addCourse(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const title = formData.get('title') as string
    const subject = formData.get('subject') as string
    const credits = parseFloat(formData.get('credits') as string)
    const gradeLevel = parseInt(formData.get('gradeLevel') as string)
    const term = formData.get('term') as string
    const grade = formData.get('grade') as string || null
    const isLabScience = formData.get('isLabScience') === 'on'
    const isNCAACore = formData.get('isNCAACore') === 'on'

    await prisma.course.create({
        data: {
            title,
            subject,
            credits,
            gradeLevel,
            term,
            grade,
            isLabScience,
            isNCAACore,
            userId: user.id,
        },
    })

    revalidatePath('/')
}

export async function deleteCourse(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Ensure user owns the course
    const course = await prisma.course.findUnique({
        where: { id },
    })

    if (course && course.userId === user.id) {
        // Soft Delete: Mark as archived to preserve syllabus data
        await prisma.course.update({
            where: { id },
            data: { isArchived: true }
        })
        revalidatePath('/')
    }
}

export async function addCourseFromTemplate(templateId: string, gradeLevel: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('User not authenticated')
    }

    const template = await prisma.courseTemplate.findUnique({
        where: { id: templateId }
    })

    if (!template) {
        throw new Error('Course template not found')
    }

    await prisma.course.create({
        data: {
            userId: user.id,
            title: template.title,
            subject: template.subject,
            credits: template.credits,
            gradeLevel: gradeLevel,
            term: "Year", // Default
            isLabScience: template.isLabScience,
            isNCAACore: template.isNCAACore,
        },
    })

    revalidatePath('/')
}
// ... (existing action code)

export async function getCourseTemplates(query?: string) {
    if (!query) {
        return await prisma.courseTemplate.findMany({
            orderBy: { title: 'asc' }
        })
    }

    return await prisma.courseTemplate.findMany({
        where: {
            OR: [
                { title: { contains: query } },  // Lowercase filtering logic to be handled by app/db depending on capability
                { subject: { contains: query } }
            ]
        },
        orderBy: { title: 'asc' }
    })
}

export async function autoGeneratePlan() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('User not authenticated')
    }

    // Standard 4-Year Plan Map
    const plan = [
        // Grade 9
        { title: "English 9", grade: 9 },
        { title: "Algebra I", grade: 9 },
        { title: "Physical Science", grade: 9 },
        { title: "World History", grade: 9 },
        { title: "Spanish I", grade: 9 },
        { title: "Health", grade: 9 },
        { title: "Physical Education", grade: 9 },

        // Grade 10
        { title: "English 10", grade: 10 },
        { title: "Geometry", grade: 10 },
        { title: "Biology", grade: 10 },
        { title: "US History", grade: 10 },
        { title: "Spanish II", grade: 10 },
        { title: "Studio Art", grade: 10 },

        // Grade 11
        { title: "American Literature", grade: 11 },
        { title: "Algebra II", grade: 11 },
        { title: "Chemistry", grade: 11 },
        { title: "Civics", grade: 11 },
        { title: "Economics", grade: 11 },

        // Grade 12
        { title: "British Literature", grade: 12 },
        { title: "Pre-Calculus", grade: 12 },
        { title: "Physics", grade: 12 },
        { title: "Personal Finance", grade: 12 },
    ]

    for (const item of plan) {
        const template = await prisma.courseTemplate.findFirst({
            where: { title: item.title }
        })

        if (template) {
            // Check if course already exists for this user/grade/title to prevent duplicates
            const existing = await prisma.course.findFirst({
                where: {
                    userId: user.id,
                    title: template.title,
                    gradeLevel: item.grade
                }
            })

            if (!existing) {
                await prisma.course.create({
                    data: {
                        userId: user.id,
                        title: template.title,
                        subject: template.subject,
                        credits: template.credits,
                        gradeLevel: item.grade,
                        term: "Year",
                        isLabScience: template.isLabScience,
                        isNCAACore: template.isNCAACore,
                    },
                })
            }
        }
    }

    revalidatePath('/')
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}

export async function submitQuiz(lessonId: string, score: number, total: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    await prisma.lesson.update({
        where: { id: lessonId },
        data: {
            quizScore: score,
            quizTotal: total,
            isCompleted: true
        }
    })

    // Also mark the Unit as completed if all lessons in it are done? 
    // For now, let's just mark the quiz lesson.

    revalidatePath('/course/[id]')
}

export async function addExtracurricular(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    await prisma.extracurricular.create({
        data: {
            userId: user.id,
            title: formData.get('title') as string,
            category: formData.get('category') as string,
            hours: parseInt(formData.get('hours') as string) || 0,
            role: formData.get('role') as string,
            description: formData.get('description') as string,
        }
    })
    revalidatePath('/')
}

export async function deleteExtracurricular(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    await prisma.extracurricular.delete({
        where: { id } // Ideally check ownership
    })
    revalidatePath('/')
}

export async function logHours(courseId: string, minutes: number, date: Date, activity: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // Verify ownership
    const course = await prisma.course.findUnique({
        where: { id: courseId }
    })
    if (!course || course.userId !== user.id) throw new Error("Unauthorized")

    await prisma.hourLog.create({
        data: {
            courseId,
            minutes,
            date,
            activity
        }
    })
    revalidatePath(`/course/${courseId}`)
}
