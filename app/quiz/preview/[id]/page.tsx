"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Clock, Users, BarChart2, Award, Calendar, Tag, Trophy, UserPlus } from "lucide-react"
import Image from "next/image"
import { UserSearchModal } from "@/components/user-search-modal"
import { useAuth } from "@/contexts/auth-kit-context"

export default function QuizPreviewPage({ params }: { params: { id: string } }) {
  const [quiz, setQuiz] = useState<any>(null)
  const [questionsCount, setQuestionsCount] = useState<number | null>(null)
  const [topScores, setTopScores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showChallengeModal, setShowChallengeModal] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  useState(() => {
    const fetchQuizData = async () => {
      setLoading(true)
      try {
        // Fetch quiz data
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes")
          .select(`
            *,
            categories(*),
            profiles(username, display_name, avatar_url)
          `)
          .eq("id", params.id)
          .single()

        if (quizError) throw quizError
        setQuiz(quizData)

        // Fetch questions count
        const { count, error: countError } = await supabase
          .from("questions")
          .select("*", { count: "exact", head: true })
          .eq("quiz_id", params.id)

        if (!countError) {
          setQuestionsCount(count)
        }

        // Fetch top scores
        const { data: scoresData, error: scoresError } = await supabase
          .from("user_scores")
          .select(`
            score, 
            percentage,
            profiles(username, display_name, avatar_url)
          `)
          .eq("quiz_id", params.id)
          .order("percentage", { ascending: false })
          .limit(5)

        if (!scoresError) {
          setTopScores(scoresData || [])
        }
      } catch (error: any) {
        console.error("Error fetching quiz:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchQuizData()
  }, [params.id])

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  if (loading) {
    return (
      <div className="container flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 rounded-full border-t-transparent"></div>
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="container flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Quiz not found</h2>
          <p className="text-gray-400 mb-4">{error || "The quiz you're looking for doesn't exist."}</p>
          <Button asChild>
            <Link href="/explore">Browse Quizzes</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg">
        {/* Quiz Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-full p-4 backdrop-blur-sm">
              <span className="text-4xl">{quiz.emoji || "🎮"}</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{quiz.title}</h1>
              <p className="text-white/80 mt-1">{quiz.description}</p>
            </div>
          </div>
        </div>

        {/* Quiz Details */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Quiz Details</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-300">
                  <Tag className="h-5 w-5 text-blue-400" />
                  <span>Category:</span>
                  <span className="bg-slate-700 px-2 py-1 rounded-full text-sm">
                    {quiz.categories?.name || "Uncategorized"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-300">
                  <Clock className="h-5 w-5 text-blue-400" />
                  <span>Time Limit:</span>
                  <span>{quiz.time_limit} seconds</span>
                </div>

                <div className="flex items-center gap-2 text-gray-300">
                  <Award className="h-5 w-5 text-blue-400" />
                  <span>Difficulty:</span>
                  <span className="capitalize">{quiz.difficulty || "Not specified"}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-300">
                  <BarChart2 className="h-5 w-5 text-blue-400" />
                  <span>Questions:</span>
                  <span>{questionsCount || "Unknown"}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-300">
                  <Users className="h-5 w-5 text-blue-400" />
                  <span>Plays:</span>
                  <span>{quiz.plays}</span>
                </div>

                {quiz.quiz_type && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <BarChart2 className="h-5 w-5 text-blue-400" />
                    <span>Quiz Type:</span>
                    <span className="capitalize">{quiz.quiz_type.replace(/-/g, " ")}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="h-5 w-5 text-blue-400" />
                  <span>Created:</span>
                  <span>{formatDate(quiz.created_at)}</span>
                </div>
              </div>

              {quiz.tags && quiz.tags.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {quiz.tags.map((tag: string) => (
                      <span key={tag} className="bg-slate-700 px-2 py-1 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              {topScores && topScores.length > 0 ? (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Top Scores</h2>
                  <div className="bg-slate-700 rounded-lg overflow-hidden">
                    <div className="p-4 space-y-3">
                      {topScores.map((score, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-slate-600 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <div className="flex items-center gap-2">
                              {score.profiles?.avatar_url ? (
                                <Image
                                  src={score.profiles.avatar_url || "/placeholder.svg"}
                                  alt={score.profiles.display_name || "User"}
                                  width={24}
                                  height={24}
                                  className="rounded-full"
                                />
                              ) : (
                                <div className="bg-slate-500 h-6 w-6 rounded-full" />
                              )}
                              <span>{score.profiles?.display_name || score.profiles?.username || "Anonymous"}</span>
                            </div>
                          </div>
                          <div className="font-bold text-green-400">{score.percentage}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-700 rounded-lg p-6 flex flex-col items-center justify-center h-full">
                  <Trophy className="h-12 w-12 text-yellow-500 mb-3" />
                  <h3 className="text-lg font-medium mb-1">Be the first to complete this quiz!</h3>
                  <p className="text-gray-400 text-center">No one has taken this quiz yet. Will you be the first?</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Button asChild size="lg" className="px-8">
              <Link href={`/quiz/${params.id}`}>Start Quiz</Link>
            </Button>

            {isAuthenticated && (
              <Button variant="outline" size="lg" className="px-8" onClick={() => setShowChallengeModal(true)}>
                <UserPlus className="mr-2 h-5 w-5" />
                Challenge Friend
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Challenge Modal */}
      <UserSearchModal
        isOpen={showChallengeModal}
        onClose={() => setShowChallengeModal(false)}
        quizId={params.id}
        quizTitle={quiz.title}
      />
    </div>
  )
}
