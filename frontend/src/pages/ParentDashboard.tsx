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

export function ParentDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<ParentDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      loadDashboard()
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
