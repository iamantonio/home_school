import { Link, Outlet } from 'react-router-dom'

export function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-gray-900">
            Homeschool Platform
          </Link>
          <nav className="space-x-4">
            <Link to="/learn" className="text-gray-600 hover:text-gray-900">
              Learn
            </Link>
            <Link to="/sessions" className="text-gray-600 hover:text-gray-900">
              Sessions
            </Link>
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 px-4">
        <Outlet />
      </main>
    </div>
  )
}
