'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import OpenAI from 'openai'

// Remove top-level init
// const openai = new OpenAI(...) 

export async function generateSyllabus(courseId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('User not authenticated')

    const course = await prisma.course.findUnique({
        where: { id: courseId }
    })

    if (!course) throw new Error("Course not found")

    // Enforce Real AI Content
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("Missing OPENAI_API_KEY. Cannot generate real content.")
    }

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    })

    try {
        const prompt = `
            You are an expert high school teacher. Create a comprehensive 36-week syllabus for a high school course titled "${course.title}" (Subject: ${course.subject}).
            
            For EACH of the 36 weeks, provide:
            1. Title: A concise topic title.
            2. Description: A brief summary of what will be learned.
            3. Reading: A 3-paragraph educational reading passage explaining the key concepts of the week.
            4. VideoQuery: The best 3-5 word YouTube search query to find a video for this topic.
            5. Quiz: An array of 3 multiple choice questions. Each must have:
                - question: The question text
                - options: Array of 4 possible answers
                - answer: The index (0-3) of the correct answer

            Return the response STRICTLY as a raw JSON array of objects.
            Format:
            [
                { 
                    "week": 1, 
                    "title": "Topic", 
                    "description": "...", 
                    "reading": "...", 
                    "videoQuery": "CrashCourse Biology Cells",
                    "quiz": [
                        { "question": "...", "options": ["A", "B", "C", "D"], "answer": 0 }
                    ]
                }
            ]
        `

        let completion;
        try {
            // Attempt to use the latest model found in search (December 2025)
            completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "gpt-5",
                response_format: { type: "json_object" },
            });
        } catch (error: any) {
            // Fallback to GPT-4o if GPT-5 is not accessible (404/400)
            if (error?.code === 'model_not_found' || error?.status === 404 || error?.status === 400) {
                console.warn("GPT-5 not available, falling back to GPT-4o");
                completion = await openai.chat.completions.create({
                    messages: [{ role: "user", content: prompt }],
                    model: "gpt-4o",
                    response_format: { type: "json_object" },
                });
            } else {
                throw error;
            }
        }

        // Some models need "json_object" flag and the word "JSON" in prompt. 
        // Parsing the content (handling potential markdown wrappers if model ignores instruction)
        let content = completion.choices[0].message.content || '[]'

        // Clean markdown if present
        if (content.startsWith('```json')) {
            content = content.replace(/^```json/, '').replace(/```$/, '')
        }

        // Handle "response_format" wrapper if it returns { syllabus: [] } or just []
        let unitsData = []
        try {
            const parsed = JSON.parse(content)
            unitsData = Array.isArray(parsed) ? parsed : (parsed.syllabus || parsed.weeks || [])
        } catch (e) {
            console.error("Failed to parse OpenAI response", e)
            throw new Error("AI Generation Failed")
        }

        if (unitsData.length === 0) throw new Error("No units generated")

        // Clear existing units to prevent duplicates (and allow regeneration)
        await prisma.unit.deleteMany({
            where: { courseId: course.id }
        })

        // Save to Database
        // Limit to 36 just in case
        for (const unit of unitsData.slice(0, 36)) {
            await prisma.unit.create({
                data: {
                    courseId: course.id,
                    weekNumber: unit.week,
                    title: unit.title,
                    description: unit.description,
                    lessons: {
                        create: [
                            {
                                title: "Reading Assignment",
                                contentType: "reading",
                                content: unit.reading
                            },
                            {
                                title: "Video Lecture",
                                contentType: "video",
                                // Store the direct YouTube search URL for the user to click
                                videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(unit.videoQuery)}`,
                                content: unit.videoQuery // Store the query itself in content
                            },
                            {
                                title: "Weekly Quiz",
                                contentType: "quiz",
                                // Stringify the structured quiz object so the frontend can parse it
                                content: JSON.stringify(unit.quiz)
                            }
                        ]
                    }
                }
            })
        }

        revalidatePath(`/course/${courseId}`)

    } catch (error) {
        console.error("OpenAI Generation Error:", error)
        // Fallback or rethrow
        throw error
    }
}

export async function generateStudyHelp(topic: string, subject: string) {
    // "Private" AI helper - returns data, doesn't save to DB
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    if (!process.env.OPENAI_API_KEY) {
        throw new Error("Missing API Key")
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const prompt = `
        You are an expert tutor for "${subject}". The student needs help understanding: "${topic}".
        
        Provide:
        1. Explanation: A clear, high-school level explanation (2 paragraphs).
        2. VideoQuery: The best YouTube search query.
        3. Quiz: ONE multiple choice question to check understanding.
           - question
           - options (4)
           - answer (index)

        Return strictly JSON:
        {
            "explanation": "...",
            "videoQuery": "...",
            "quiz": { "question": "...", "options": ["..."], "answer": 0 }
        }
    `

    const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-4o",
        response_format: { type: "json_object" }
    })

    const content = completion.choices[0].message.content || '{}'
    return JSON.parse(content)
}
