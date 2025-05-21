"use client"

import { Suspense, lazy } from "react"

// Use dynamic import with correct path
const LeaderboardClient = lazy(() => import("@/components/leaderboard-client"))

// Simple loading component
function LeaderboardLoading() {
  return (
    <div className="space-y-4">
      {Array(5)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="bg-slate-800 border border-slate-700 rounded-md p-4 w-full">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 rounded-full bg-slate-700 animate-pulse"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-700 rounded animate-pulse"></div>
                <div className="h-3 bg-slate-700 rounded animate-pulse w-3/4"></div>
              </div>
              <div className="h-6 w-16 bg-slate-700 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
    </div>
  )
}

export default function LeaderboardClientWrapper() {
  return (
    <Suspense fallback={<LeaderboardLoading />}>
      <LeaderboardClient />
    </Suspense>
  )
}
