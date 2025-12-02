import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

const GRADE_LEVELS = [6, 7, 8, 9, 10, 11, 12]

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [gradeLevel, setGradeLevel] = useState(8)
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (isSignUp) {
        // Validate fields
        if (!name.trim()) {
          setError('Please enter your name')
          setLoading(false)
          return
        }

        // 1. Create Supabase auth account
        await signUp(email, password)

        // Note: In a real app, you'd want to wait for email confirmation
        // For now, we'll try to sign in immediately and register
        try {
          await signIn(email, password)

          // 2. Get the auth user ID from the session
          const { data: { session } } = await import('../lib/supabase').then(m => m.supabase.auth.getSession())

          if (session?.user) {
            // 3. Register in our backend
            await api.post('/api/auth/register-student', {
              student_name: name,
              student_email: email,
              auth_id: session.user.id,
              grade_level: gradeLevel,
            })

            navigate('/learn')
          } else {
            setSuccess('Account created! Please check your email to confirm, then sign in.')
          }
        } catch {
          // If sign in fails (email not confirmed), show success message
          setSuccess('Account created! Please check your email to confirm your account, then sign in.')
        }
      } else {
        // Sign in
        await signIn(email, password)

        // Check if user is registered in our backend
        const { data: { session } } = await import('../lib/supabase').then(m => m.supabase.auth.getSession())

        if (session?.user) {
          try {
            // Try to access a protected endpoint to see if user is registered
            await api.get('/api/tutor/sessions')
            navigate('/learn')
          } catch (err: unknown) {
            // User not registered in backend - try to register them
            const error = err as { response?: { status?: number } }
            if (error.response?.status === 404) {
              // User exists in Supabase but not in our backend
              // Try to register them as a student
              try {
                await api.post('/api/auth/register-student', {
                  student_name: session.user.email?.split('@')[0] || 'Student',
                  student_email: session.user.email,
                  auth_id: session.user.id,
                  grade_level: 8, // Default grade level
                })
                navigate('/learn')
              } catch {
                setError('Failed to complete profile setup. Please try again or contact support.')
              }
            } else {
              navigate('/learn')
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-8 animate-page-enter">
      {/* Header */}
      <div className="text-center mb-8">
        <Link to="/" className="inline-block mb-6 group">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto transform group-hover:scale-105 transition-transform"
            style={{
              backgroundColor: 'var(--color-forest)',
              boxShadow: 'var(--shadow-medium)',
            }}
          >
            🎓
          </div>
        </Link>
        <h1
          className="font-display text-3xl font-semibold mb-2"
          style={{ color: 'var(--color-brown)' }}
        >
          {isSignUp ? 'Start Your Learning Journey' : 'Welcome Back'}
        </h1>
        <p style={{ color: 'var(--color-brown-light)' }}>
          {isSignUp
            ? 'Create an account to begin learning with your AI tutor'
            : 'Sign in to continue where you left off'}
        </p>
      </div>

      {/* Form Card */}
      <div
        className="card p-8"
        style={{
          boxShadow: 'var(--shadow-medium)',
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Error message */}
          {error && (
            <div
              className="p-4 rounded-xl flex items-start gap-3"
              style={{
                backgroundColor: 'rgba(220, 38, 38, 0.08)',
                border: '1px solid rgba(220, 38, 38, 0.2)',
              }}
            >
              <span className="text-lg">⚠️</span>
              <p className="text-sm" style={{ color: '#dc2626' }}>
                {error}
              </p>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div
              className="p-4 rounded-xl flex items-start gap-3"
              style={{
                backgroundColor: 'rgba(149, 168, 141, 0.15)',
                border: '1px solid var(--color-sage)',
              }}
            >
              <span className="text-lg">✓</span>
              <p className="text-sm" style={{ color: 'var(--color-forest)' }}>
                {success}
              </p>
            </div>
          )}

          {/* Sign up fields */}
          {isSignUp && (
            <>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-brown)' }}
                >
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input rounded-xl"
                  placeholder="What should we call you?"
                  required
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-brown)' }}
                >
                  Grade Level
                </label>
                <div className="flex flex-wrap gap-2">
                  {GRADE_LEVELS.map((grade) => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => setGradeLevel(grade)}
                      className="px-4 py-2 rounded-full font-medium transition-all"
                      style={{
                        backgroundColor:
                          gradeLevel === grade
                            ? 'var(--color-forest)'
                            : 'var(--color-cream-dark)',
                        color:
                          gradeLevel === grade
                            ? 'var(--color-cream)'
                            : 'var(--color-brown)',
                        border:
                          gradeLevel === grade
                            ? 'none'
                            : '1px solid rgba(61, 44, 31, 0.1)',
                      }}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-brown)' }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input rounded-xl"
              placeholder="you@example.com"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--color-brown)' }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input rounded-xl"
              placeholder={isSignUp ? 'At least 6 characters' : 'Enter your password'}
              minLength={6}
              required
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-3 rounded-xl text-base"
            style={{
              boxShadow: loading ? 'none' : 'var(--shadow-medium)',
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  className="w-4 h-4 border-2 rounded-full animate-spin"
                  style={{
                    borderColor: 'var(--color-cream)',
                    borderTopColor: 'transparent',
                  }}
                />
                {isSignUp ? 'Creating Account...' : 'Signing In...'}
              </span>
            ) : (
              <>
                {isSignUp ? 'Create Account' : 'Sign In'}
                <span className="ml-2">→</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div
            className="flex-1 h-px"
            style={{ backgroundColor: 'rgba(61, 44, 31, 0.1)' }}
          />
          <span
            className="text-sm"
            style={{ color: 'var(--color-brown-light)' }}
          >
            or
          </span>
          <div
            className="flex-1 h-px"
            style={{ backgroundColor: 'rgba(61, 44, 31, 0.1)' }}
          />
        </div>

        {/* Toggle sign up/sign in */}
        <p className="text-center" style={{ color: 'var(--color-brown-light)' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
              setSuccess('')
            }}
            className="font-semibold transition-colors"
            style={{ color: 'var(--color-forest)' }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>

      {/* Footer note */}
      <p
        className="text-center text-sm mt-6"
        style={{ color: 'var(--color-brown-light)' }}
      >
        By signing up, you agree to our Terms of Service
      </p>
    </div>
  )
}
