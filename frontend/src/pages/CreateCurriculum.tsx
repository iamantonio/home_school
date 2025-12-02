import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

interface Student {
  id: string
  name: string
  grade_level: number
}

const SUBJECTS = [
  { value: 'math', label: 'Mathematics' },
  { value: 'english', label: 'English Language Arts' },
  { value: 'science', label: 'Science' },
  { value: 'social_studies', label: 'Social Studies' },
  { value: 'foreign_language', label: 'Foreign Language' },
  { value: 'computer_science', label: 'Computer Science' },
]

export function CreateCurriculum() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const [studentId, setStudentId] = useState('')
  const [subject, setSubject] = useState('')
  const [gradeLevel, setGradeLevel] = useState(7)
  const [goals, setGoals] = useState('')

  useEffect(() => {
    if (user) {
      loadStudents()
    }
  }, [user])

  const loadStudents = async () => {
    try {
      // Get students from parent dashboard endpoint
      const response = await api.get('/api/dashboard/parent')
      setStudents(response.data.students.map((s: { id: string; name: string; grade_level: number }) => ({
        id: s.id,
        name: s.name,
        grade_level: s.grade_level,
      })))
    } catch (err) {
      // If not a parent, try to get current student
      try {
        await api.get('/api/dashboard/student')
        // For students, we'd need a different approach
        setStudents([])
      } catch {
        setError('Failed to load students')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId || !subject) {
      setError('Please select a student and subject')
      return
    }

    setGenerating(true)
    setError('')

    try {
      const response = await api.post('/api/curricula/generate', {
        student_id: studentId,
        subject,
        grade_level: gradeLevel,
        goals: goals || null,
      })
      navigate(`/curricula/${response.data.id}`)
    } catch (err) {
      setError('Failed to generate curriculum')
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--color-brown-light)' }}>Please sign in to create curricula.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--color-brown-light)' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold mb-6" style={{ color: 'var(--color-brown)' }}>
        Create Curriculum
      </h1>

      <form onSubmit={handleGenerate} className="card space-y-6">
        {error && (
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: 'rgba(231, 111, 81, 0.1)', color: 'var(--color-coral)' }}
          >
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-brown)' }}>
            Student
          </label>
          <select
            value={studentId}
            onChange={(e) => {
              setStudentId(e.target.value)
              const student = students.find(s => s.id === e.target.value)
              if (student) setGradeLevel(student.grade_level)
            }}
            className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2"
            style={{
              borderColor: 'var(--color-cream-dark)',
              backgroundColor: 'white',
              color: 'var(--color-brown)',
            }}
            required
          >
            <option value="">Select a student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} (Grade {student.grade_level})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-brown)' }}>
            Subject
          </label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2"
            style={{
              borderColor: 'var(--color-cream-dark)',
              backgroundColor: 'white',
              color: 'var(--color-brown)',
            }}
            required
          >
            <option value="">Select a subject</option>
            {SUBJECTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-brown)' }}>
            Grade Level
          </label>
          <select
            value={gradeLevel}
            onChange={(e) => setGradeLevel(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2"
            style={{
              borderColor: 'var(--color-cream-dark)',
              backgroundColor: 'white',
              color: 'var(--color-brown)',
            }}
          >
            {[6, 7, 8, 9, 10, 11, 12].map((grade) => (
              <option key={grade} value={grade}>
                Grade {grade}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-brown)' }}>
            Goals & Notes (Optional)
          </label>
          <textarea
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder="E.g., 'Focus on algebra fundamentals, she struggles with word problems'"
            className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 h-24 resize-none"
            style={{
              borderColor: 'var(--color-cream-dark)',
              backgroundColor: 'white',
              color: 'var(--color-brown)',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={generating}
          className="w-full btn btn-primary py-3 text-lg"
          style={{ opacity: generating ? 0.7 : 1 }}
        >
          {generating ? 'Generating Curriculum...' : 'Generate with AI'}
        </button>

        {generating && (
          <p className="text-sm text-center" style={{ color: 'var(--color-brown-light)' }}>
            This may take 30-60 seconds...
          </p>
        )}
      </form>
    </div>
  )
}
