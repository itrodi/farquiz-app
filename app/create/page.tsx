"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"
import Link from "next/link"

export default function CreatePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home after a short delay
    const timer = setTimeout(() => {
      router.push("/")
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="container max-w-md mx-auto px-4 py-8">
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-slate-700 p-3 rounded-full">
              <Lock className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
          <h1 className="text-xl font-bold mb-2">Admin Access Only</h1>
          <p className="text-slate-400 mb-6">
            Quiz creation is restricted to administrators only. Please contact an administrator if you need to create a
            quiz.
          </p>
          <Button asChild>
            <Link href="/">Return to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
