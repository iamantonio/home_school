import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

interface LearningObjective {
  id: string
  title: string
  description: string | null
  order: number
  standard_codes: string[]
}

interface Unit {
  id: string
  title: string
  description: string | null
  order: number
  estimated_hours: number | null
  learning_objectives: LearningObjective[]
}

interface Curriculum {
  id: string
  subject: string
  title: string
  description: string | null
  grade_level: number
  units: Unit[]
}

export function CurriculumDetail() {
  const { curriculumId } = useParams<{ curriculumId: string }>()
  const { user } = useAuth()
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user && curriculumId) {
      loadCurriculum()
    }
  }, [user, curriculumId])

  const loadCurriculum = async () => {
    try {
      const response = await api.get(`/api/curricula/${curriculumId}`)
      setCurriculum(response.data)
      // Expand first unit by default
      if (response.data.units.length > 0) {
        setExpandedUnits(new Set([response.data.units[0].id]))
      }
    } catch (err) {
      setError('Failed to load curriculum')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleUnit = (unitId: string) => {
    setExpandedUnits((prev) => {
      const next = new Set(prev)
      if (next.has(unitId)) {
        next.delete(unitId)
      } else {
        next.add(unitId)
      }
      return next
    })
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--color-brown-light)' }}>Please sign in to view this curriculum.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--color-brown-light)' }}>Loading curriculum...</p>
      </div>
    )
  }

  if (error || !curriculum) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--color-coral)' }} className="mb-4">{error || 'Curriculum not found'}</p>
        <Link to="/curricula" style={{ color: 'var(--color-forest)' }} className="hover:underline">
          Back to Curricula
        </Link>
      </div>
    )
  }

  const totalObjectives = curriculum.units.reduce(
    (sum, unit) => sum + unit.learning_objectives.length,
    0
  )

  return (
    <div>
      <Link
        to="/curricula"
        style={{ color: 'var(--color-forest)' }}
        className="text-sm hover:underline"
      >
        &larr; Back to Curricula
      </Link>

      <div className="mt-4 mb-6">
        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--color-brown)' }}>
          {curriculum.title}
        </h1>
        <p className="capitalize" style={{ color: 'var(--color-brown-light)' }}>
          {curriculum.subject.replace('_', ' ')} &middot; Grade {curriculum.grade_level}
        </p>
        {curriculum.description && (
          <p className="mt-2" style={{ color: 'var(--color-brown-light)' }}>
            {curriculum.description}
          </p>
        )}
        <p className="text-sm mt-2" style={{ color: 'var(--color-brown-light)' }}>
          {curriculum.units.length} units &middot; {totalObjectives} objectives
        </p>
      </div>

      <div className="space-y-4">
        {curriculum.units
          .sort((a, b) => a.order - b.order)
          .map((unit) => (
            <div key={unit.id} className="card overflow-hidden">
              <button
                onClick={() => toggleUnit(unit.id)}
                className="w-full p-4 text-left flex justify-between items-center hover:opacity-80 transition-opacity"
                style={{ backgroundColor: 'transparent' }}
              >
                <div>
                  <h3 className="font-semibold" style={{ color: 'var(--color-brown)' }}>
                    {unit.title}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--color-brown-light)' }}>
                    {unit.learning_objectives.length} objectives
                    {unit.estimated_hours && ` · ~${unit.estimated_hours} hours`}
                  </p>
                </div>
                <span style={{ color: 'var(--color-brown-light)' }}>
                  {expandedUnits.has(unit.id) ? '−' : '+'}
                </span>
              </button>

              {expandedUnits.has(unit.id) && (
                <div
                  className="p-4"
                  style={{ borderTop: '1px solid var(--color-cream-dark)' }}
                >
                  {unit.description && (
                    <p className="text-sm mb-4" style={{ color: 'var(--color-brown-light)' }}>
                      {unit.description}
                    </p>
                  )}
                  <ul className="space-y-3">
                    {unit.learning_objectives
                      .sort((a, b) => a.order - b.order)
                      .map((obj) => (
                        <li key={obj.id} className="flex items-start gap-3">
                          <span
                            className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                            style={{ backgroundColor: 'var(--color-forest)' }}
                          />
                          <div>
                            <p className="font-medium" style={{ color: 'var(--color-brown)' }}>
                              {obj.title}
                            </p>
                            {obj.description && (
                              <p className="text-sm" style={{ color: 'var(--color-brown-light)' }}>
                                {obj.description}
                              </p>
                            )}
                            {obj.standard_codes.length > 0 && (
                              <p className="text-xs mt-1" style={{ color: 'var(--color-brown-light)', opacity: 0.7 }}>
                                Standards: {obj.standard_codes.join(', ')}
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  )
}
