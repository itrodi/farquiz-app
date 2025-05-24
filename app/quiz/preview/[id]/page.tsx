import { createClient } from "@/lib/supabase/server"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Clock, Users, BarChart2, Award, Calendar, Tag, Trophy, UserPlus } from "lucide-react"
import Image from "next/image"
import type { Metadata, ResolvingMetadata } from 'next'
import { notFound } from "next/navigation"

type Props = {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const supabase = createClient()
  const quizId = params.id

  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select("title, categories(name), difficulty, time_limit, description, emoji")
    .eq("id", quizId)
    .single()

  if (error || !quiz) {
    console.error("Error fetching quiz for metadata:", error)
    return {
      title: "Quiz Preview Not Found",
    }
  }

  const title = quiz.title || "FarQuiz Preview"
  const category = quiz.categories?.name || "General"
  const time = quiz.time_limit ? `${quiz.time_limit} seconds` : "Not timed"
  const difficulty = quiz.difficulty || "Any"

  const ogImageUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL || "https://farquizapp.vercel.app"}/api/og/quiz-image`)
  ogImageUrl.searchParams.set("title", title)
  ogImageUrl.searchParams.set("category", category)
  ogImageUrl.searchParams.set("time", time)
  ogImageUrl.searchParams.set("difficulty", difficulty)

  const frameMetadata = {
    version: "next",
    imageUrl: ogImageUrl.toString(),
    button: {
      title: "Play Now",
      action: {
        type: "launch_frame",
        name: "FarQuiz",
        url: `${process.env.NEXT_PUBLIC_APP_URL || "https://farquizapp.vercel.app"}/quiz/${quizId}`,
        splashImageUrl: process.env.NEXT_PUBLIC_SPLASH_IMAGE_URL || "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/RBv8coHVCER8/farquiz_splash-h61l64V89HzQsrn3v0Ey1RJGCVtPvq.png?Ik5m",
        splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BG_COLOR || "#8B5CF6",
      },
    },
  }

  return {
    title: `${title} - Preview`,
    description: quiz.description || `Preview for ${title} on FarQuiz.`,
    other: {
      "fc:frame": JSON.stringify(frameMetadata),
      "og:title": `${title} - Preview`,
      "og:description": quiz.description || `Preview for ${title} on FarQuiz.`,
      "og:image": ogImageUrl.toString(),
    },
  }
}

export default async function QuizPreviewPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select(`
      *,
      categories(*),
      profiles(username, display_name, avatar_url)
    `)
    .eq("id", params.id)
    .single()

  if (quizError || !quiz) {
    console.error("Error fetching quiz data for page:", quizError)
    notFound()
  }

  const { count: questionsCount, error: countError } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("quiz_id", params.id)

  const { data: topScores, error: scoresError } = await supabase
    .from("user_scores")
    .select(`
      score, 
      percentage,
      profiles(username, display_name, avatar_url)
    `)
    .eq("quiz_id", params.id)
    .order("percentage", { ascending: false })
    .limit(5)

  const safeTopScores = topScores || []

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg">
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
                  <span>{questionsCount ?? "Unknown"}</span>
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
                    {(quiz.tags as string[]).map((tag: string) => (
                      <span key={tag} className="bg-slate-700 px-2 py-1 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              {safeTopScores && safeTopScores.length > 0 ? (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Top Scores</h2>
                  <div className="bg-slate-700 rounded-lg overflow-hidden">
                    <div className="p-4 space-y-3">
                      {safeTopScores.map((score, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-slate-600 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <div className="flex items-center gap-2">
                              {score.profiles?.avatar_url ? (
                                <Image
                                  src={score.profiles.avatar_url || "/placeholder.svg"}
                                  alt={score.profiles.display_name || score.profiles.username || "User"}
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
          </div>
        </div>
      </div>
    </div>
  )
}
