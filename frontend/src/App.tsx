import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { MainLayout } from './layouts/MainLayout'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Learn } from './pages/Learn'
import { Sessions } from './pages/Sessions'
import { SessionDetail } from './pages/SessionDetail'
import { Dashboard } from './pages/Dashboard'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="learn" element={<Learn />} />
              <Route path="sessions" element={<Sessions />} />
              <Route path="sessions/:sessionId" element={<SessionDetail />} />
              <Route path="dashboard" element={<Dashboard />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
