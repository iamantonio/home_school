'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import OpenAI from 'openai'
import { revalidatePath } from 'next/cache'

// Mastery Settings
const MASTERY_ALPHA = 0.3 // Weight of new attempt vs history
const HINT_PENALTY = 15 // Points deducted per hint
const MASTERY_THRESHOLD = 85
const EXPLANATION_THRESHOLD = 70 // 0-100 scale

export async function submitQuestionAttempt(
    objectiveId: string,
    isCorrect: boolean,
    hintsUsed: number,
    rawAnswer?: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // 1. Record Attempt
    await prisma.questionAttempt.create({
        data: {
            userId: user.id,
            learningObjectiveId: objectiveId,
            isCorrect,
            numHintsUsed: hintsUsed,
            rawAnswer
        }
    })

    // 2. Update Mastery
    let masteryRec = await prisma.objectiveMastery.findUnique({
        where: {
            userId_learningObjectiveId: {
                userId: user.id,
                learningObjectiveId: objectiveId
            }
        }
    })

    if (!masteryRec) {
        masteryRec = await prisma.objectiveMastery.create({
            data: {
                userId: user.id,
                learningObjectiveId: objectiveId,
                masteryScore: 0,
                explanationScore: 0
            }
        })
    }

    // Calculate Attempt Score
    // Base: 100 if correct, 0 if incorrect
    // Penalty: -15 per hint
    let attemptScore = isCorrect ? 100 : 0
    if (isCorrect) {
        attemptScore = Math.max(0, attemptScore - (hintsUsed * HINT_PENALTY))
    }

    // EWMA Update
    // New = Alpha * Current + (1-Alpha) * Old
    // If it's the first attempt (numAttempts=0), we might just take the score? 
    // Let's stick to EWMA to avoid jumping to 100 instantly unless alpha is high.
    // Actually for first attempt, New = AttemptScore makes sense.

    let newScore = masteryRec.masteryScore
    if (masteryRec.numAttempts === 0) {
        newScore = attemptScore
    } else {
        newScore = (MASTERY_ALPHA * attemptScore) + ((1 - MASTERY_ALPHA) * masteryRec.masteryScore)
    }

    // Clamp
    newScore = Math.min(100, Math.max(0, newScore))

    await prisma.objectiveMastery.update({
        where: { id: masteryRec.id },
        data: {
            masteryScore: newScore,
            numAttempts: { increment: 1 },
            numHintsUsed: { increment: hintsUsed },
            lastAssessedAt: new Date()
        }
    })

    return { masteryScore: newScore }
}

export async function scoreExplanation(objectiveId: string, studentAnswer: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    if (!process.env.OPENAI_API_KEY) throw new Error("Missing API Key")

    const objective = await prisma.learningObjective.findUnique({
        where: { id: objectiveId }
    })
    if (!objective) throw new Error("Objective not found")

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const prompt = `
        You are a strict teacher grading a student's explanation.
        Topic: "${objective.description}"
        Student Answer: "${studentAnswer}"

        Evaluate based on:
        1. Accuracy (Is it factually correct?)
        2. Clarity (Can a peer understand it?)
        3. Depth (Does it show true mastery?)

        Return JSON:
        {
            "score": number (0-100),
            "feedback": "string (constructive feedback)",
            "strengths": "string",
            "weaknesses": "string"
        }
    `

    const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-4o",
        response_format: { type: "json_object" }
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    const score = result.score || 0

    // Update Mastery Record
    await prisma.objectiveMastery.upsert({
        where: {
            userId_learningObjectiveId: {
                userId: user.id,
                learningObjectiveId: objectiveId
            }
        },
        create: {
            userId: user.id,
            learningObjectiveId: objectiveId,
            explanationScore: score
        },
        update: {
            explanationScore: score,
            lastAssessedAt: new Date()
        }
    })

    return result
}

export async function generateObjectives(courseId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    if (!process.env.OPENAI_API_KEY) throw new Error("Missing API Key")

    const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: { objectives: true }
    })

    // If we already have objectives, just return them
    if (course && course.objectives.length > 0) return course.objectives

    if (!course) throw new Error("Course not found")

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const prompt = `
        Create a list of 10-12 distinct, high-school level Learning Objectives for the course "${course.title}" (Subject: ${course.subject}).
        Each objective should be a specific skill or concept (e.g. "Solve quadratic equations by factoring", "Analyze the causes of WWI").
        
        Return JSON array:
        { "objectives": [ { "description": "..." }, ... ] }
    `

    const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-4o",
        response_format: { type: "json_object" }
    })

    const content = JSON.parse(completion.choices[0].message.content || '{}')
    const list = content.objectives || []

    // Save to DB
    for (let i = 0; i < list.length; i++) {
        await prisma.learningObjective.create({
            data: {
                courseId: course.id,
                description: list[i].description,
                order: i
            }
        })
    }

    revalidatePath(`/course/${courseId}`)
}

export async function getCourseObjectives(courseId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Fetch objectives AND their mastery status for this user
    return await prisma.learningObjective.findMany({
        where: { courseId },
        orderBy: { order: 'asc' },
        include: {
            mastery: {
                where: { userId: user.id }
            }
        }
    })
}
