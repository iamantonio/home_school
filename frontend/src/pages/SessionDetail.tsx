import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { ChatMessage } from '../components/ChatMessage'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface SessionDetail {
  id: string
  subject: string
  status: string
  message_count: number
  summary: string | null
  created_at: string
  messages: Message[]
}

export function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user && sessionId) {
      loadSession()
    }
  }, [user, sessionId])

  const loadSession = async () => {
    try {
      const response = await api.get(`/api/tutor/sessions/${sessionId}`)
      setSession(response.data)
    } catch (err) {
      setError('Failed to load session')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleEndSession = async () => {
    if (!sessionId) return
    try {
      await api.post(`/api/tutor/sessions/${sessionId}/end`)
      loadSession() // Reload to get summary
    } catch (err) {
      console.error('Failed to end session:', err)
    }
  }

  const handleContinue = () => {
    if (session) {
      navigate('/learn', { state: { subject: session.subject, sessionId: session.id } })
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please sign in to view this session.</p>
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-12">Loading session...</div>
  }

  if (error || !session) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || 'Session not found'}</p>
        <Link to="/sessions" className="text-blue-600 hover:underline">
          Back to Sessions
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to="/sessions" className="text-blue-600 hover:underline text-sm">
            &larr; Back to Sessions
          </Link>
          <h1 className="text-2xl font-bold capitalize mt-2">
            {session.subject.replace('_', ' ')} Session
          </h1>
          <p className="text-gray-500 text-sm">
            {session.message_count} messages &middot; {session.status}
          </p>
        </div>
        {session.status === 'active' && (
          <div className="space-x-2">
            <button
              onClick={handleContinue}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Continue Session
            </button>
            <button
              onClick={handleEndSession}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              End Session
            </button>
          </div>
        )}
      </div>

      {session.summary && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Session Summary</h3>
          <p className="text-blue-800">{session.summary}</p>
        </div>
      )}

      <div className="bg-white rounded-lg border p-4">
        {session.messages.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No messages in this session.</p>
        ) : (
          session.messages.map((msg) => (
            <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
          ))
        )}
      </div>
    </div>
  )
}
