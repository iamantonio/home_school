const { PrismaClient } = require('../src/generated/prisma')
const prisma = new PrismaClient()

const courses = [
    // English
    { title: "English 9", subject: "English", credits: 1.0, isNCAACore: true },
    { title: "English 10", subject: "English", credits: 1.0, isNCAACore: true },
    { title: "American Literature", subject: "English", credits: 1.0, isNCAACore: true },
    { title: "British Literature", subject: "English", credits: 1.0, isNCAACore: true },
    { title: "AP English Language", subject: "English", credits: 1.0, isNCAACore: true },
    { title: "AP English Literature", subject: "English", credits: 1.0, isNCAACore: true },
    { title: "Creative Writing", subject: "English", credits: 0.5, isNCAACore: true },
    { title: "Speech & Debate", subject: "English", credits: 0.5, isNCAACore: true },

    // Math
    { title: "Algebra I", subject: "Math", credits: 1.0, isNCAACore: true },
    { title: "Geometry", subject: "Math", credits: 1.0, isNCAACore: true },
    { title: "Algebra II", subject: "Math", credits: 1.0, isNCAACore: true },
    { title: "Pre-Calculus", subject: "Math", credits: 1.0, isNCAACore: true },
    { title: "Calculus", subject: "Math", credits: 1.0, isNCAACore: true },
    { title: "AP Calculus AB", subject: "Math", credits: 1.0, isNCAACore: true },
    { title: "AP Statistics", subject: "Math", credits: 1.0, isNCAACore: true },
    { title: "Consumer Math", subject: "Math", credits: 1.0, isNCAACore: false }, // Often not NCAA core

    // Science
    { title: "Physical Science", subject: "Science", credits: 1.0, isLabScience: true, isNCAACore: true },
    { title: "Biology", subject: "Science", credits: 1.0, isLabScience: true, isNCAACore: true },
    { title: "Chemistry", subject: "Science", credits: 1.0, isLabScience: true, isNCAACore: true },
    { title: "Physics", subject: "Science", credits: 1.0, isLabScience: true, isNCAACore: true },
    { title: "Environmental Science", subject: "Science", credits: 1.0, isLabScience: false, isNCAACore: true },
    { title: "Anatomy & Physiology", subject: "Science", credits: 1.0, isLabScience: true, isNCAACore: true },

    // Social Studies
    { title: "World History", subject: "SocialScience", credits: 1.0, isNCAACore: true },
    { title: "US History", subject: "SocialScience", credits: 1.0, isNCAACore: true },
    { title: "Government", subject: "SocialScience", credits: 0.5, isNCAACore: true },
    { title: "Economics", subject: "SocialScience", credits: 0.5, isNCAACore: true },
    { title: "Civics", subject: "SocialScience", credits: 0.5, isNCAACore: true },
    { title: "Psychology", subject: "SocialScience", credits: 0.5, isNCAACore: true },

    // World Languages
    { title: "Spanish I", subject: "WorldLanguage", credits: 1.0, isNCAACore: true },
    { title: "Spanish II", subject: "WorldLanguage", credits: 1.0, isNCAACore: true },
    { title: "French I", subject: "WorldLanguage", credits: 1.0, isNCAACore: true },
    { title: "French II", subject: "WorldLanguage", credits: 1.0, isNCAACore: true },

    // Arts
    { title: "Studio Art", subject: "Arts", credits: 1.0, isNCAACore: false },
    { title: "Music Theory", subject: "Arts", credits: 1.0, isNCAACore: false },
    { title: "Theater Arts", subject: "Arts", credits: 1.0, isNCAACore: false },

    // Electives
    { title: "Computer Science", subject: "Elective", credits: 1.0, isNCAACore: false }, // Sometimes math/science
    { title: "Personal Finance", subject: "Elective", credits: 0.5, isNCAACore: false },
    { title: "Health", subject: "Elective", credits: 0.5, isNCAACore: false },
    { title: "Physical Education", subject: "Elective", credits: 0.5, isNCAACore: false },
]

async function main() {
    console.log('Start seeding...')

    // Clear existing templates to avoid duplicates if re-run
    await prisma.courseTemplate.deleteMany()

    for (const course of courses) {
        const template = await prisma.courseTemplate.create({
            data: course,
        })
        console.log(`Created template with id: ${template.id}`)
    }

    console.log(`Seeding finished. Added ${courses.length} courses.`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
