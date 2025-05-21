"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { QuizResults } from "@/components/quiz-results"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { shuffleArray } from "@/lib/array-utils"
import type { Tables } from "@/lib/supabase/database.types"

type QuizProps = {
  quiz: Tables<"quizzes"> & {
    categories: Tables<"categories"> | null
    profiles: Pick<Tables<"profiles">, "username" | "display_name" | "avatar_url"> | null
  }
  questions: Tables<"questions">[]
}

export function MultipleChoiceQuiz({ quiz, questions: originalQuestions }: QuizProps) {
  // Shuffle questions on component mount
  const [questions] = useState(() => shuffleArray(originalQuestions))
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(quiz.time_limit || 60)
  const [isFinished, setIsFinished] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [startTime] = useState<number>(Date.now())

  const router = useRouter()
  const supabase = createClient()

  const currentQuestion = questions[currentQuestionIndex]

  // Handle both option formats (string[] or {id, text}[])
  const getOptions = () => {
    const options = currentQuestion?.options
    if (!options) return []

    // If options is an array of objects with text property
    if (typeof options === "object" && options.length > 0 && typeof options[0] === "object" && "text" in options[0]) {
      return options.map((opt: any) => opt.text)
    }

    // If options is already a string array
    return options as string[]
  }

  const options = getOptions()
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  // Timer effect
  useEffect(() => {
    if (isFinished) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleFinish()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isFinished])

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return
    setSelectedOption(option)
    setIsAnswered(true)

    // Handle both formats for correct_answer
    const isCorrect = checkCorrectAnswer(option)
    if (isCorrect) {
      setScore((prev) => prev + 1)
    }

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: option,
    }))

    // Move to next question after a delay
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1)
        setSelectedOption(null)
        setIsAnswered(false)
      } else {
        handleFinish()
      }
    }, 1000)
  }

  // Helper function to check if the selected option is correct
  const checkCorrectAnswer = (selectedOption: string): boolean => {
    const correctAnswer = currentQuestion.correct_answer

    // If the correct_answer is a direct match
    if (correctAnswer === selectedOption) {
      return true
    }

    // If the options are in {id, text} format and correct_answer is an id
    const optionsArray = currentQuestion.options as any[]
    if (
      Array.isArray(optionsArray) &&
      optionsArray.length > 0 &&
      typeof optionsArray[0] === "object" &&
      "id" in optionsArray[0]
    ) {
      // Find the option with matching text
      const selectedOptionObj = optionsArray.find((opt: any) => opt.text === selectedOption)
      if (selectedOptionObj && selectedOptionObj.id === correctAnswer) {
        return true
      }
    }

    return false
  }

  const handleFinish = async () => {
    setIsFinished(true)
    const timeTaken = Math.floor((Date.now() - startTime) / 1000)

    // Save score to database if user is logged in - removed authentication requirement
    try {
      // Create an anonymous record instead
      const { data: anonymousUser } = await supabase
        .from("user_scores")
        .insert({
          quiz_id: quiz.id,
          score: score,
          max_score: questions.length,
          percentage: Math.round((score / questions.length) * 100),
          time_taken: timeTaken,
          // No user_id for anonymous users
        })
        .select()

      console.log("Anonymous score saved:", anonymousUser)
    } catch (error) {
      console.error("Error saving score:", error)
    }
  }

  if (isFinished) {
    return (
      <QuizResults
        score={score}
        totalQuestions={questions.length}
        timeTaken={quiz.time_limit - timeLeft}
        quizId={quiz.id}
        quizTitle={quiz.title}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm font-medium">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
        <div className="text-sm font-medium">Time left: {timeLeft}s</div>
      </div>

      <Progress value={progress} className="h-2" />

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">{currentQuestion.text}</h2>

        <div className="grid gap-3">
          {options.map((option, index) => (
            <Button
              key={index}
              variant={
                isAnswered
                  ? checkCorrectAnswer(option)
                    ? "success"
                    : option === selectedOption
                      ? "destructive"
                      : "outline"
                  : "outline"
              }
              className="justify-start text-left h-auto py-3 px-4"
              onClick={() => handleOptionSelect(option)}
              disabled={isAnswered}
            >
              {option}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  )
}
