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
import { ParentDashboard } from './pages/ParentDashboard'
import { CurriculumList } from './pages/CurriculumList'
import { CreateCurriculum } from './pages/CreateCurriculum'
import { CurriculumDetail } from './pages/CurriculumDetail'
import { Progress } from './pages/Progress'
import { TakeQuiz } from './pages/TakeQuiz'
import { AssessmentHistory } from './pages/AssessmentHistory'

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
              <Route path="parent" element={<ParentDashboard />} />
              <Route path="curricula" element={<CurriculumList />} />
              <Route path="curricula/new" element={<CreateCurriculum />} />
              <Route path="curricula/:curriculumId" element={<CurriculumDetail />} />
              <Route path="progress" element={<Progress />} />
              <Route path="quiz/:objectiveId" element={<TakeQuiz />} />
              <Route path="assessments" element={<AssessmentHistory />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
