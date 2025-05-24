import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { MultipleChoiceQuiz } from "@/components/quiz-types/multiple-choice-quiz"
import { ImageQuiz } from "@/components/quiz-types/image-quiz"
import { ListQuiz } from "@/components/quiz-types/list-quiz"
import { MapQuiz } from "@/components/quiz-types/map-quiz"
import { ImageFillQuiz } from "@/components/quiz-types/image-fill-quiz"
import { MixedQuiz } from "@/components/quiz-types/mixed-quiz"
import type { Metadata, ResolvingMetadata } from 'next';

export const dynamic = "force-dynamic"

type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const supabase = createClient();
  const quizId = params.id;

  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select("title, categories(name), difficulty, time_limit")
    .eq("id", quizId)
    .single();

  if (error || !quiz) {
    // Optionally return default metadata or handle error
    console.error("Error fetching quiz for metadata:", error);
    return {
      title: "Quiz not found",
      // other default tags
    };
  }

  const title = quiz.title || "FarQuiz";
  const category = quiz.categories?.name || "General";
  const time = quiz.time_limit ? `${quiz.time_limit} seconds` : "Not timed";
  const difficulty = quiz.difficulty || "Any";

  // Construct the URL for the dynamic OG image
  const ogImageUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL || "https://farquizapp.vercel.app"}/api/og/quiz-image`);
  ogImageUrl.searchParams.set("title", title);
  ogImageUrl.searchParams.set("category", category);
  ogImageUrl.searchParams.set("time", time);
  ogImageUrl.searchParams.set("difficulty", difficulty);

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
  };

  return {
    title: title,
    description: `Take the ${title} quiz on FarQuiz!`,
    other: {
      "fc:frame": JSON.stringify(frameMetadata),
      // You might want to add standard Open Graph tags here too for other platforms
      "og:title": title,
      "og:description": `Take the ${title} quiz on FarQuiz!`,
      "og:image": ogImageUrl.toString(),
    },
  };
}

export default async function QuizPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  // Fetch quiz data
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select(`
      *,
      categories(*),
      profiles(username, avatar_url, display_name)
    `)
    .eq("id", params.id)
    .single()

  if (quizError || !quiz) {
    console.error("Error fetching quiz:", quizError)
    notFound()
  }

  // Fetch questions
  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("*")
    .eq("quiz_id", params.id)
    .order("order_index", { ascending: true })

  if (questionsError || !questions || questions.length === 0) {
    console.error("Error fetching questions:", questionsError)
    notFound()
  }

  // Increment play count
  await supabase
    .from("quizzes")
    .update({ plays: (quiz.plays || 0) + 1 })
    .eq("id", params.id)

  // Debug information
  console.log("Quiz type:", quiz.quiz_type)
  console.log("First question type:", questions[0].question_type)
  console.log("First question has media:", !!questions[0].media)

  // Check if this is a mixed quiz (has different question types)
  const hasMixedQuestionTypes = () => {
    const types = new Set()
    for (const question of questions) {
      types.add(question.question_type)
    }
    return types.size > 1
  }

  // Determine which quiz component to use
  const renderQuizComponent = () => {
    // If it's a mixed quiz, use the MixedQuiz component
    if (hasMixedQuestionTypes()) {
      return <MixedQuiz quiz={quiz} questions={questions} />
    }

    // Check for image-based fill-in-the-blank quiz
    if (
      (quiz.quiz_type === "image-based" &&
        (questions[0].question_type === "fill-blank")) ||
      (questions[0].media && (questions[0].question_type === "fill-blank"))
    ) {
      return <ImageFillQuiz quiz={quiz} questions={questions} />
    }

    // Check for standard question types
    switch (questions[0].question_type) {
      case "multiple-choice":
        return <MultipleChoiceQuiz quiz={quiz} questions={questions} />
      case "image":
        return <ImageQuiz quiz={quiz} questions={questions} />
      case "list":
        return <ListQuiz quiz={quiz} questions={questions} />
      case "map":
        return <MapQuiz quiz={quiz} questions={questions} />
      case "fill-blank":
        return <ImageFillQuiz quiz={quiz} questions={questions} />
      default:
        // If we can't determine the type, try to infer from the structure
        if (questions[0].media) {
          return <ImageFillQuiz quiz={quiz} questions={questions} />
        }
        return <MultipleChoiceQuiz quiz={quiz} questions={questions} />
    }
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          {quiz.emoji && <span>{quiz.emoji}</span>}
          {quiz.title}
        </h1>
        {quiz.description && <p className="text-gray-400 mb-2">{quiz.description}</p>}
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
          {quiz.categories?.name && <span className="bg-gray-800 px-2 py-1 rounded-full">{quiz.categories.name}</span>}
          {quiz.difficulty && <span className="bg-gray-800 px-2 py-1 rounded-full capitalize">{quiz.difficulty}</span>}
          <span>•</span>
          <span>{quiz.time_limit} seconds</span>
          <span>•</span>
          <span>{questions.length} questions</span>
          <span>•</span>
          <span>{quiz.plays} plays</span>
        </div>
      </div>

      <Suspense fallback={<div className="text-center py-8">Loading quiz...</div>}>{renderQuizComponent()}</Suspense>
    </div>
  )
}
