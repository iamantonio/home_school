import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

interface Question {
  id: string
  question_type: string
  question_text: string
  options: string[] | null
  order: number
}

interface Assessment {
  id: string
  objective_id: string
  student_id: string
  status: string
  questions: Question[]
}

interface SubmitResult {
  is_correct: boolean
  hints_used: number
  hint: string | null
  feedback: string | null
  show_answer: boolean
  correct_answer: string | null
}

export function TakeQuiz() {
  const { objectiveId } = useParams<{ objectiveId: string }>()
  const [searchParams] = useSearchParams()
  const studentId = searchParams.get('student')
  const navigate = useNavigate()
  const { user } = useAuth()

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false)
  const [finalResult, setFinalResult] = useState<{
    score: number
    passed_without_hints: boolean
    mastery_updated: boolean
    new_mastery_level: string | null
  } | null>(null)

  useEffect(() => {
    if (user && objectiveId && studentId) {
      generateAssessment()
    }
  }, [user, objectiveId, studentId])

  const generateAssessment = async () => {
    try {
      const response = await api.post('/api/assessments/generate', {
        objective_id: objectiveId,
        student_id: studentId,
      })
      setAssessment(response.data)
    } catch (err) {
      setError('Failed to generate quiz')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!assessment || !answer.trim()) return

    setSubmitting(true)
    setError('')

    try {
      const currentQuestion = assessment.questions[currentQuestionIndex]
      const response = await api.post(`/api/assessments/${assessment.id}/submit`, {
        question_id: currentQuestion.id,
        answer: answer.trim(),
      })
      setResult(response.data)
    } catch (err) {
      setError('Failed to submit answer')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleNext = () => {
    if (currentQuestionIndex < assessment!.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setAnswer('')
      setResult(null)
    } else {
      completeAssessment()
    }
  }

  const handleRetry = () => {
    setAnswer('')
    setResult(null)
  }

  const completeAssessment = async () => {
    if (!assessment) return

    try {
      const response = await api.post(`/api/assessments/${assessment.id}/complete`)
      setFinalResult(response.data)
      setCompleted(true)
    } catch (err) {
      setError('Failed to complete assessment')
      console.error(err)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--color-brown-light)' }}>Please sign in to take quizzes.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--color-brown-light)' }}>Generating quiz questions...</p>
      </div>
    )
  }

  if (error && !assessment) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--color-coral)' }}>{error}</p>
      </div>
    )
  }

  if (completed && finalResult) {
    const percentage = Math.round(finalResult.score * 100)
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-8">
          <h2 className="font-display text-2xl font-bold mb-4" style={{ color: 'var(--color-brown)' }}>
            Quiz Complete!
          </h2>
          <div
            className="text-5xl font-bold mb-4"
            style={{ color: percentage >= 80 ? 'var(--color-forest)' : 'var(--color-amber)' }}
          >
            {percentage}%
          </div>
          <p style={{ color: 'var(--color-brown-light)' }} className="mb-2">
            {finalResult.passed_without_hints
              ? 'Passed without hints!'
              : 'Good effort! Try again for a clean pass.'}
          </p>
          {finalResult.mastery_updated && (
            <p style={{ color: 'var(--color-forest)' }} className="font-semibold mb-4">
              Mastery level updated to: {finalResult.new_mastery_level}
            </p>
          )}
          <div className="flex gap-4 justify-center mt-6">
            <button
              onClick={() => navigate('/curricula')}
              className="btn btn-ghost"
            >
              Back to Curricula
            </button>
            <button
              onClick={() => navigate('/progress')}
              className="btn btn-primary"
            >
              View Progress
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!assessment) return null

  const currentQuestion = assessment.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === assessment.questions.length - 1

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2" style={{ color: 'var(--color-brown-light)' }}>
          <span>Question {currentQuestionIndex + 1} of {assessment.questions.length}</span>
          <span>{currentQuestion.question_type.replace('_', ' ')}</span>
        </div>
        <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--color-cream-dark)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${((currentQuestionIndex + 1) / assessment.questions.length) * 100}%`,
              backgroundColor: 'var(--color-forest)',
            }}
          />
        </div>
      </div>

      <div className="card">
        {/* Question */}
        <h2 className="text-lg font-medium mb-6" style={{ color: 'var(--color-brown)' }}>
          {currentQuestion.question_text}
        </h2>

        {/* Answer input */}
        {!result && (
          <div className="space-y-4">
            {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options ? (
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setAnswer(option.charAt(0))}
                    className="w-full p-4 text-left rounded-lg border transition-colors"
                    style={{
                      borderColor: answer === option.charAt(0)
                        ? 'var(--color-forest)'
                        : 'var(--color-cream-dark)',
                      backgroundColor: answer === option.charAt(0)
                        ? 'rgba(27, 67, 50, 0.08)'
                        : 'white',
                      color: 'var(--color-brown)',
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type={currentQuestion.question_type === 'numeric' ? 'number' : 'text'}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={
                  currentQuestion.question_type === 'numeric'
                    ? 'Enter a number'
                    : currentQuestion.question_type === 'equation'
                    ? 'Enter your answer (e.g., 5x or x+2)'
                    : 'Type your answer'
                }
                className="w-full px-4 py-3 rounded-lg border"
                style={{
                  borderColor: 'var(--color-cream-dark)',
                  color: 'var(--color-brown)',
                }}
              />
            )}

            <button
              onClick={handleSubmit}
              disabled={!answer.trim() || submitting}
              className="w-full btn btn-primary py-3"
              style={{ opacity: !answer.trim() || submitting ? 0.7 : 1 }}
            >
              {submitting ? 'Checking...' : 'Submit Answer'}
            </button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: result.is_correct
                  ? 'rgba(27, 67, 50, 0.1)'
                  : 'rgba(231, 111, 81, 0.1)',
              }}
            >
              <p
                className="font-semibold"
                style={{ color: result.is_correct ? 'var(--color-forest)' : 'var(--color-coral)' }}
              >
                {result.is_correct ? 'Correct!' : 'Not quite right'}
              </p>
              {result.feedback && (
                <p className="mt-2 text-sm" style={{ color: 'var(--color-brown-light)' }}>
                  {result.feedback}
                </p>
              )}
              {result.hint && (
                <p className="mt-2" style={{ color: 'var(--color-brown)' }}>
                  <strong>Hint:</strong> {result.hint}
                </p>
              )}
              {result.show_answer && (
                <p className="mt-2" style={{ color: 'var(--color-brown)' }}>
                  <strong>Answer:</strong> {result.correct_answer}
                </p>
              )}
            </div>

            <div className="flex gap-4">
              {!result.is_correct && !result.show_answer && (
                <button onClick={handleRetry} className="flex-1 btn btn-ghost">
                  Try Again
                </button>
              )}
              <button onClick={handleNext} className="flex-1 btn btn-primary">
                {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4" style={{ color: 'var(--color-coral)' }}>{error}</p>
        )}
      </div>
    </div>
  )
}
