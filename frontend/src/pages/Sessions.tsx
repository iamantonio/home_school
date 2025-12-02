import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

interface Session {
  id: string
  subject: string
  status: string
  message_count: number
  summary: string | null
  created_at?: string
}

export function Sessions() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      loadSessions()
    }
  }, [user])

  const loadSessions = async () => {
    try {
      const response = await api.get('/api/tutor/sessions')
      setSessions(response.data)
    } catch (err) {
      setError('Failed to load sessions')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please sign in to view your sessions.</p>
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-12">Loading sessions...</div>
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">{error}</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Your Learning Sessions</h1>

      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-600 mb-4">No sessions yet.</p>
          <Link
            to="/learn"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Start Learning
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Link
              key={session.id}
              to={`/sessions/${session.id}`}
              className="block bg-white rounded-lg border p-4 hover:border-blue-500 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg capitalize">
                    {session.subject.replace('_', ' ')}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {session.message_count} messages
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    session.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {session.status}
                </span>
              </div>
              {session.summary && (
                <p className="mt-2 text-gray-600 text-sm">{session.summary}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
