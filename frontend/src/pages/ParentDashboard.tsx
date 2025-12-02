import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

interface StudentSummary {
  id: string
  name: string
  grade_level: number
  total_sessions: number
  total_messages: number
  last_active: string | null
}

interface ParentDashboardData {
  family_name: string
  students: StudentSummary[]
  total_family_sessions: number
}

interface Alert {
  id: string
  alert_type: string
  title: string
  message: string
  read: boolean
  created_at: string
  student_name: string | null
}

interface AlertsData {
  alerts: Alert[]
  unread_count: number
}

export function ParentDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<ParentDashboardData | null>(null)
  const [alerts, setAlerts] = useState<AlertsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      loadDashboard()
      loadAlerts()
    }
  }, [user])

  const loadDashboard = async () => {
    try {
      const response = await api.get('/api/dashboard/parent')
      setData(response.data)
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } }
      if (error.response?.status === 403) {
        setError('This page is for teaching parents only.')
      } else {
        setError('Failed to load dashboard')
      }
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadAlerts = async () => {
    try {
      const response = await api.get('/api/alerts')
      setAlerts(response.data)
    } catch (err) {
      console.error('Failed to load alerts:', err)
    }
  }

  const markAlertRead = async (alertId: string) => {
    try {
      await api.post(`/api/alerts/${alertId}/read`)
      loadAlerts()
    } catch (err) {
      console.error('Failed to mark alert read:', err)
    }
  }

  const dismissAlert = async (alertId: string) => {
    try {
      await api.post(`/api/alerts/${alertId}/dismiss`)
      loadAlerts()
    } catch (err) {
      console.error('Failed to dismiss alert:', err)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please sign in to view the parent dashboard.</p>
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">{error}</div>
  }

  if (!data) {
    return <div className="text-center py-12">No data available.</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Parent Dashboard</h1>
      <p className="text-gray-600 mb-6">{data.family_name}</p>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-lg border p-6">
          <p className="text-gray-500 text-sm">Students</p>
          <p className="text-3xl font-bold">{data.students.length}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-gray-500 text-sm">Total Learning Sessions</p>
          <p className="text-3xl font-bold">{data.total_family_sessions}</p>
        </div>
      </div>

      {/* Alerts */}
      {alerts && alerts.alerts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Alerts {alerts.unread_count > 0 && (
              <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full ml-2">
                {alerts.unread_count}
              </span>
            )}
          </h2>
          <div className="space-y-2">
            {alerts.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white rounded-lg border p-4 ${
                  !alert.read ? 'border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{alert.title}</p>
                    <p className="text-gray-600 text-sm">{alert.message}</p>
                    {alert.student_name && (
                      <p className="text-gray-400 text-xs mt-1">
                        Student: {alert.student_name}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!alert.read && (
                      <button
                        onClick={() => markAlertRead(alert.id)}
                        className="text-blue-600 text-sm hover:underline"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="text-gray-400 text-sm hover:text-gray-600"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student Cards */}
      <h2 className="text-xl font-semibold mb-4">Students</h2>
      {data.students.length === 0 ? (
        <div className="bg-white rounded-lg border p-6 text-center">
          <p className="text-gray-600">No students in your family yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.students.map((student) => (
            <div key={student.id} className="bg-white rounded-lg border p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{student.name}</h3>
                  <p className="text-gray-500">Grade {student.grade_level}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Sessions</p>
                  <p className="font-semibold">{student.total_sessions}</p>
                </div>
                <div>
                  <p className="text-gray-500">Messages</p>
                  <p className="font-semibold">{student.total_messages}</p>
                </div>
              </div>
              {student.last_active && (
                <p className="text-sm text-gray-500 mt-4">
                  Last active: {new Date(student.last_active).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
