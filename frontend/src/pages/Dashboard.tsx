import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

interface SubjectStats {
  subject: string
  session_count: number
  total_messages: number
  last_session_date: string | null
}

interface DashboardData {
  total_sessions: number
  total_messages: number
  subjects: SubjectStats[]
  recent_activity: Array<{
    id: string
    subject: string
    message_count: number
    date: string
  }>
}

export function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      loadDashboard()
    }
  }, [user])

  const loadDashboard = async () => {
    try {
      const response = await api.get('/api/dashboard/student')
      setData(response.data)
    } catch (err) {
      setError('Failed to load dashboard')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please sign in to view your dashboard.</p>
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>
  }

  if (error || !data) {
    return <div className="text-center py-12 text-red-600">{error}</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Your Learning Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border p-6">
          <p className="text-gray-500 text-sm">Total Sessions</p>
          <p className="text-3xl font-bold">{data.total_sessions}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-gray-500 text-sm">Total Messages</p>
          <p className="text-3xl font-bold">{data.total_messages}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-gray-500 text-sm">Subjects Studied</p>
          <p className="text-3xl font-bold">{data.subjects.length}</p>
        </div>
      </div>

      {/* Subjects */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Subjects</h2>
        {data.subjects.length === 0 ? (
          <div className="bg-white rounded-lg border p-6 text-center">
            <p className="text-gray-600 mb-4">No subjects yet. Start learning!</p>
            <Link
              to="/learn"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Start Learning
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.subjects.map((subject) => (
              <div key={subject.subject} className="bg-white rounded-lg border p-4">
                <h3 className="font-semibold capitalize">
                  {subject.subject.replace('_', ' ')}
                </h3>
                <div className="mt-2 text-sm text-gray-600">
                  <p>{subject.session_count} sessions</p>
                  <p>{subject.total_messages} messages</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        {data.recent_activity.length === 0 ? (
          <p className="text-gray-600">No recent activity.</p>
        ) : (
          <div className="bg-white rounded-lg border divide-y">
            {data.recent_activity.map((activity) => (
              <Link
                key={activity.id}
                to={`/sessions/${activity.id}`}
                className="block p-4 hover:bg-gray-50"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium capitalize">
                      {activity.subject.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {activity.message_count} messages
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(activity.date).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
