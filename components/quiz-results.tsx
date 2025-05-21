"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Clock, ArrowRight, Share2, Check, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

interface QuizResultsProps {
  score: number
  totalQuestions: number
  timeTaken: number
  quizId: string
  quizTitle: string
  quiz?: any
  questions?: any[]
  answers?: string[]
  results?: boolean[]
}

export function QuizResults({
  score,
  totalQuestions,
  timeTaken,
  quizId,
  quizTitle,
  quiz,
  questions,
  answers,
  results,
}: QuizResultsProps) {
  const [leaderboardPosition, setLeaderboardPosition] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [submittingChallenge, setSubmittingChallenge] = useState(false)
  const [challengeSubmitted, setChallengeSubmitted] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const challengeId = searchParams.get("challenge")
  const supabase = createClient()

  const percentage = Math.round((score / totalQuestions) * 100)

  useEffect(() => {
    // If this is a challenge, submit the score and redirect to the challenge result page
    if (challengeId && !challengeSubmitted) {
      const submitChallengeScore = async () => {
        setSubmittingChallenge(true)
        try {
          console.log("Submitting challenge score:", { challengeId, score })

          const response = await fetch(`/api/challenges/${challengeId}/complete`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ score }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || "Failed to submit challenge score")
          }

          setChallengeSubmitted(true)

          // Redirect to the challenge result page
          console.log("Challenge score submitted, redirecting to result page")
          router.push(`/quiz/challenge-result/${challengeId}`)
        } catch (error) {
          console.error("Error submitting challenge score:", error)
          toast({
            title: "Error submitting challenge score",
            description: error instanceof Error ? error.message : "An unknown error occurred",
            variant: "destructive",
          })
          // Continue showing the regular results if there's an error
          setSubmittingChallenge(false)
        }
      }

      submitChallengeScore()
      return
    }

    // If not a challenge, check leaderboard position
    if (!challengeId) {
      async function checkLeaderboard() {
        setIsLoading(true)
        try {
          // Get all scores for this quiz
          const { data: scores } = await supabase
            .from("user_scores")
            .select("score, percentage")
            .eq("quiz_id", quizId)
            .order("percentage", { ascending: false })

          if (scores && scores.length > 0) {
            // Find position of current score
            const position = scores.findIndex((s) => s.percentage < percentage) + 1
            setLeaderboardPosition(position > 0 ? position : scores.length + 1)
          }
        } catch (error) {
          console.error("Error checking leaderboard:", error)
        } finally {
          setIsLoading(false)
        }
      }

      checkLeaderboard()
    }
  }, [quizId, percentage, supabase, challengeId, score, router, challengeSubmitted])

  // If submitting challenge score, show loading
  if (submittingChallenge) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
        <p className="text-center text-gray-400">Submitting your challenge result...</p>
        <p className="text-center text-gray-500 text-sm mt-2">Please wait, you'll be redirected to the results page.</p>
      </div>
    )
  }

  const getResultMessage = () => {
    if (percentage >= 90) return "Excellent! You're a master!"
    if (percentage >= 70) return "Great job! You know your stuff!"
    if (percentage >= 50) return "Good effort! Keep practicing!"
    return "Nice try! Study up and try again!"
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `My ${quizTitle} Quiz Result`,
        text: `I scored ${score}/${totalQuestions} (${percentage}%) on the ${quizTitle} quiz!`,
        url: window.location.href,
      })
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(
        `I scored ${score}/${totalQuestions} (${percentage}%) on the ${quizTitle} quiz! Try it yourself: ${window.location.href}`,
      )
      alert("Result copied to clipboard!")
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  // Helper function to get the correct answer text for display
  const getCorrectAnswerText = (question: any) => {
    // For multiple choice questions with structured options
    if (question.options && Array.isArray(question.options) && typeof question.options[0] === "object") {
      const correctOption = question.options.find((opt: any) => opt.id === question.correctAnswer)
      if (correctOption) return correctOption.text
    }

    // For other formats
    return (
      question.correctAnswer ||
      question.correct_answer ||
      (question.correctAnswers && question.correctAnswers[0]) ||
      (question.correct_answers && question.correct_answers[0]) ||
      "N/A"
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-center">Quiz Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">
              {score}/{totalQuestions}
            </div>
            <div className="text-2xl font-semibold text-purple-400">{percentage}%</div>
            <p className="mt-2 text-gray-400">{getResultMessage()}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-slate-700 p-3 rounded-lg flex flex-col items-center">
              <Clock className="h-5 w-5 text-blue-400 mb-1" />
              <div className="text-sm text-gray-400">Time Taken</div>
              <div className="font-semibold">{formatTime(timeTaken)}</div>
            </div>
            <div className="bg-slate-700 p-3 rounded-lg flex flex-col items-center">
              <Trophy className="h-5 w-5 text-yellow-400 mb-1" />
              <div className="text-sm text-gray-400">Rank</div>
              <div className="font-semibold">
                {isLoading ? "..." : leaderboardPosition ? `#${leaderboardPosition}` : "N/A"}
              </div>
            </div>
          </div>

          {challengeId && (
            <div className="mt-4 p-3 bg-purple-900/30 border border-purple-800/50 rounded-lg">
              <p className="text-center text-sm">
                This was a challenge quiz. Your score has been submitted.
                {challengeSubmitted ? (
                  <Button
                    variant="link"
                    className="p-0 h-auto text-purple-400 ml-1"
                    onClick={() => router.push(`/quiz/challenge-result/${challengeId}`)}
                  >
                    View challenge results
                  </Button>
                ) : null}
              </p>
            </div>
          )}

          {questions && answers && results && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Question Summary</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {questions.map((question, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded-md text-sm ${
                      results[index]
                        ? "bg-green-900/30 border border-green-800/50"
                        : "bg-red-900/30 border border-red-800/50"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {results[index] ? (
                        <Check className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium mb-1">{question.text}</p>
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                          <div>
                            <span className="text-gray-400">Your answer: </span>
                            <span className={results[index] ? "text-green-400" : "text-red-400"}>
                              {answers[index] || "No answer"}
                            </span>
                          </div>
                          {!results[index] && (
                            <div>
                              <span className="text-gray-400">Correct: </span>
                              <span className="text-green-400">{getCorrectAnswerText(question)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" className="flex-1" onClick={handleShare}>
          <Share2 className="mr-2 h-4 w-4" />
          Share Result
        </Button>
        <Button asChild className="flex-1">
          <Link href="/explore">
            Try More Quizzes
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
