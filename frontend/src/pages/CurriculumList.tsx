import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

interface CurriculumSummary {
  id: string
  subject: string
  title: string
  grade_level: number
  unit_count: number
  objective_count: number
}

export function CurriculumList() {
  const { user } = useAuth()
  const [curricula, setCurricula] = useState<CurriculumSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      loadCurricula()
    }
  }, [user])

  const loadCurricula = async () => {
    try {
      const response = await api.get('/api/curricula')
      setCurricula(response.data)
    } catch (err) {
      setError('Failed to load curricula')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--color-brown-light)' }}>Please sign in to view curricula.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--color-brown-light)' }}>Loading curricula...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--color-coral)' }}>{error}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--color-brown)' }}>
          Curricula
        </h1>
        <Link
          to="/curricula/new"
          className="btn btn-primary"
        >
          Create Curriculum
        </Link>
      </div>

      {curricula.length === 0 ? (
        <div className="card text-center py-12">
          <p style={{ color: 'var(--color-brown-light)' }} className="mb-4">No curricula yet.</p>
          <Link
            to="/curricula/new"
            className="btn btn-primary"
          >
            Create Your First Curriculum
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {curricula.map((curriculum) => (
            <Link
              key={curriculum.id}
              to={`/curricula/${curriculum.id}`}
              className="card hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-lg" style={{ color: 'var(--color-brown)' }}>
                {curriculum.title}
              </h3>
              <p className="capitalize" style={{ color: 'var(--color-brown-light)' }}>
                {curriculum.subject.replace('_', ' ')}
              </p>
              <div className="mt-4 text-sm" style={{ color: 'var(--color-brown-light)' }}>
                <p>{curriculum.unit_count} units</p>
                <p>{curriculum.objective_count} objectives</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
