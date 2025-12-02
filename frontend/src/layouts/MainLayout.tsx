import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const NAV_ITEMS = [
  { path: '/learn', label: 'Learn', icon: '📚' },
  { path: '/sessions', label: 'Sessions', icon: '📝' },
  { path: '/curricula', label: 'Curricula', icon: '📋' },
  { path: '/assessments', label: 'Assessments', icon: '✓' },
  { path: '/progress', label: 'Progress', icon: '📈' },
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
]

export function MainLayout() {
  const location = useLocation()
  const { user, signOut } = useAuth()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-paper">
      {/* Decorative top border */}
      <div className="h-1 bg-gradient-to-r from-transparent via-[var(--color-amber)] to-transparent" />

      <header
        className="sticky top-0 z-50 backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(253, 248, 243, 0.9)',
          borderBottom: '1px solid rgba(61, 44, 31, 0.08)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="group flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{
                  backgroundColor: 'var(--color-forest)',
                  boxShadow: 'var(--shadow-soft)',
                }}
              >
                <span className="transform group-hover:scale-110 transition-transform">🎓</span>
              </div>
              <div>
                <h1
                  className="font-display text-xl font-semibold tracking-tight"
                  style={{ color: 'var(--color-brown)' }}
                >
                  Scholaris
                </h1>
                <p
                  className="text-xs tracking-wide"
                  style={{ color: 'var(--color-brown-light)' }}
                >
                  AI Learning Companion
                </p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative px-4 py-2 rounded-lg font-medium transition-all duration-200"
                  style={{
                    color: isActive(item.path)
                      ? 'var(--color-forest)'
                      : 'var(--color-brown-light)',
                    backgroundColor: isActive(item.path)
                      ? 'rgba(27, 67, 50, 0.08)'
                      : 'transparent',
                  }}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                  {isActive(item.path) && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                      style={{ backgroundColor: 'var(--color-amber)' }}
                    />
                  )}
                </Link>
              ))}
            </nav>

            {/* Auth section */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <div
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--color-cream-dark)' }}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                      style={{
                        backgroundColor: 'var(--color-sage)',
                        color: 'white',
                      }}
                    >
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className="text-sm font-medium max-w-[120px] truncate"
                      style={{ color: 'var(--color-brown)' }}
                    >
                      {user.email?.split('@')[0]}
                    </span>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="btn btn-ghost text-sm"
                    style={{ color: 'var(--color-brown-light)' }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link to="/login" className="btn btn-primary text-sm">
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {/* Mobile navigation */}
          <nav className="md:hidden flex items-center justify-center gap-2 mt-3 pt-3 border-t border-[rgba(61,44,31,0.08)]">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all"
                style={{
                  color: isActive(item.path)
                    ? 'var(--color-forest)'
                    : 'var(--color-brown-light)',
                  backgroundColor: isActive(item.path)
                    ? 'rgba(27, 67, 50, 0.08)'
                    : 'transparent',
                }}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer
        className="mt-auto py-8"
        style={{
          borderTop: '1px solid rgba(61, 44, 31, 0.08)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎓</span>
              <span
                className="font-display font-medium"
                style={{ color: 'var(--color-brown-light)' }}
              >
                Scholaris
              </span>
            </div>
            <p
              className="text-sm"
              style={{ color: 'var(--color-brown-light)' }}
            >
              Nurturing curious minds with AI-powered learning
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
