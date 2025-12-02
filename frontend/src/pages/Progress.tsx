import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

interface ObjectiveProgress {
  objective_id: string
  objective_title: string
  unit_title: string
  mastery_level: string
  session_count: number
}

interface SubjectProgress {
  subject: string
  curriculum_id: string
  curriculum_title: string
  total_objectives: number
  mastered: number
  practicing: number
  introduced: number
  not_started: number
  objectives: ObjectiveProgress[]
}

interface Student {
  id: string
  name: string
}

const MASTERY_COLORS: Record<string, string> = {
  mastered: 'var(--color-forest)',
  practicing: 'var(--color-amber)',
  introduced: 'var(--color-sage)',
  not_started: 'var(--color-cream-dark)',
}

const MASTERY_LABELS: Record<string, string> = {
  mastered: 'Mastered',
  practicing: 'Practicing',
  introduced: 'Introduced',
  not_started: 'Not Started',
}

export function Progress() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [progress, setProgress] = useState<SubjectProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadStudents()
    }
  }, [user])

  useEffect(() => {
    if (selectedStudent) {
      loadProgress()
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
      // Not a parent, might be a student
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  const loadProgress = async () => {
    try {
      const response = await api.get(`/api/progress/student/${selectedStudent}`)
      setProgress(response.data)
    } catch (err) {
      setError('Failed to load progress')
      console.error(err)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--color-brown-light)' }}>Please sign in to view progress.</p>
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
          Learning Progress
        </h1>
        {students.length > 1 && (
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="px-4 py-2 rounded-lg border"
            style={{
              borderColor: 'var(--color-cream-dark)',
              color: 'var(--color-brown)',
            }}
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="mb-4" style={{ color: 'var(--color-coral)' }}>{error}</div>
      )}

      {progress.length === 0 ? (
        <div className="card text-center py-12">
          <p style={{ color: 'var(--color-brown-light)' }} className="mb-4">
            No curricula found for this student.
          </p>
          <Link
            to="/curricula/new"
            className="btn btn-primary"
          >
            Create a Curriculum
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {progress.map((subject) => {
            const percentage = subject.total_objectives > 0
              ? Math.round((subject.mastered / subject.total_objectives) * 100)
              : 0

            return (
              <div key={subject.curriculum_id} className="card">
                <button
                  onClick={() => setExpandedSubject(
                    expandedSubject === subject.subject ? null : subject.subject
                  )}
                  className="w-full p-6 text-left"
                  style={{ backgroundColor: 'transparent' }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg" style={{ color: 'var(--color-brown)' }}>
                        {subject.curriculum_title}
                      </h3>
                      <p className="capitalize" style={{ color: 'var(--color-brown-light)' }}>
                        {subject.subject.replace('_', ' ')}
                      </p>
                    </div>
                    <span
                      className="text-2xl font-bold"
                      style={{ color: 'var(--color-forest)' }}
                    >
                      {percentage}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div
                    className="h-3 rounded-full overflow-hidden flex"
                    style={{ backgroundColor: 'var(--color-cream-dark)' }}
                  >
                    <div
                      className="transition-all"
                      style={{
                        width: `${(subject.mastered / subject.total_objectives) * 100}%`,
                        backgroundColor: 'var(--color-forest)',
                      }}
                    />
                    <div
                      className="transition-all"
                      style={{
                        width: `${(subject.practicing / subject.total_objectives) * 100}%`,
                        backgroundColor: 'var(--color-amber)',
                      }}
                    />
                    <div
                      className="transition-all"
                      style={{
                        width: `${(subject.introduced / subject.total_objectives) * 100}%`,
                        backgroundColor: 'var(--color-sage)',
                      }}
                    />
                  </div>

                  {/* Legend */}
                  <div className="flex gap-4 mt-2 text-sm" style={{ color: 'var(--color-brown-light)' }}>
                    <span className="flex items-center gap-1">
                      <span
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: 'var(--color-forest)' }}
                      />
                      {subject.mastered} Mastered
                    </span>
                    <span className="flex items-center gap-1">
                      <span
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: 'var(--color-amber)' }}
                      />
                      {subject.practicing} Practicing
                    </span>
                    <span className="flex items-center gap-1">
                      <span
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: 'var(--color-sage)' }}
                      />
                      {subject.introduced} Introduced
                    </span>
                    <span className="flex items-center gap-1">
                      <span
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: 'var(--color-cream-dark)' }}
                      />
                      {subject.not_started} Not Started
                    </span>
                  </div>
                </button>

                {expandedSubject === subject.subject && (
                  <div className="p-6" style={{ borderTop: '1px solid var(--color-cream-dark)' }}>
                    <div className="space-y-2">
                      {subject.objectives.map((obj) => (
                        <div
                          key={obj.objective_id}
                          className="flex items-center justify-between p-3 rounded-lg"
                          style={{ backgroundColor: 'var(--color-cream)' }}
                        >
                          <div>
                            <p className="font-medium" style={{ color: 'var(--color-brown)' }}>
                              {obj.objective_title}
                            </p>
                            <p className="text-sm" style={{ color: 'var(--color-brown-light)' }}>
                              {obj.unit_title}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className="px-2 py-1 rounded text-xs text-white"
                              style={{ backgroundColor: MASTERY_COLORS[obj.mastery_level] }}
                            >
                              {MASTERY_LABELS[obj.mastery_level]}
                            </span>
                            {obj.session_count > 0 && (
                              <span className="text-xs" style={{ color: 'var(--color-brown-light)' }}>
                                {obj.session_count} sessions
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
