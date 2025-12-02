import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

interface AssessmentItem {
  id: string
  objective_id: string
  objective_title: string
  status: string
  score: number | null
  passed_without_hints: boolean
  created_at: string
}

interface Student {
  id: string
  name: string
}

export function AssessmentHistory() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [assessments, setAssessments] = useState<AssessmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      loadStudents()
    }
  }, [user])

  useEffect(() => {
    if (selectedStudent) {
      loadAssessments()
    }
  }, [selectedStudent])

  const loadStudents = async () => {
    try {
      const response = await api.get('/api/dashboard/parent')
      const studentList = response.data.students.map((s: { id: string; name: string }) => ({
        id: s.id,
        name: s.name,
      }))
      setStudents(studentList)
      if (studentList.length > 0) {
        setSelectedStudent(studentList[0].id)
      }
    } catch {
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  const loadAssessments = async () => {
    try {
      const response = await api.get(`/api/assessments/student/${selectedStudent}`)
      setAssessments(response.data)
    } catch (err) {
      setError('Failed to load assessments')
      console.error(err)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--color-brown-light)' }}>Please sign in to view assessments.</p>
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--color-brown)' }}>
          Assessment History
        </h1>
        {students.length > 1 && (
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="px-4 py-2 rounded-lg border"
            style={{ borderColor: 'var(--color-cream-dark)', color: 'var(--color-brown)' }}
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && <div className="mb-4" style={{ color: 'var(--color-coral)' }}>{error}</div>}

      {assessments.length === 0 ? (
        <div className="card text-center py-12">
          <p style={{ color: 'var(--color-brown-light)' }}>No assessments taken yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assessments.map((assessment) => {
            const score = assessment.score !== null ? Math.round(assessment.score * 100) : null
            return (
              <div key={assessment.id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--color-brown)' }}>
                      {assessment.objective_title}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--color-brown-light)' }}>
                      {new Date(assessment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {score !== null ? (
                      <>
                        <p
                          className="text-2xl font-bold"
                          style={{ color: score >= 80 ? 'var(--color-forest)' : 'var(--color-amber)' }}
                        >
                          {score}%
                        </p>
                        {assessment.passed_without_hints && (
                          <span
                            className="text-xs px-2 py-1 rounded"
                            style={{ backgroundColor: 'rgba(27, 67, 50, 0.1)', color: 'var(--color-forest)' }}
                          >
                            Clean Pass
                          </span>
                        )}
                      </>
                    ) : (
                      <span
                        className="text-sm px-2 py-1 rounded"
                        style={{ backgroundColor: 'var(--color-cream-dark)', color: 'var(--color-brown-light)' }}
                      >
                        {assessment.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
