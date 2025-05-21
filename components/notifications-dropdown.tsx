"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-kit-context"

export function NotificationsDropdown() {
  const [friendRequests, setFriendRequests] = useState<any[]>([])
  const [challenges, setChallenges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    // Only run if the user is authenticated
    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    // Create the Supabase client inside the effect to ensure it's only created in the browser
    const supabase = createClient()

    const fetchNotifications = async () => {
      setLoading(true)
      try {
        // Get current user
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user) {
          setLoading(false)
          return
        }

        // Store the current user ID for later use in the component
        setCurrentUserId(session.user.id)

        // Get friend requests - using separate queries instead of joins
        const { data: friendsData, error: friendsError } = await supabase
          .from("friends")
          .select("*")
          .eq("recipient_id", session.user.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false })

        if (friendsError) {
          console.error("Error fetching friend requests:", friendsError)
        }

        // If we have friend requests, fetch the sender profiles
        let enrichedFriendRequests: any[] = []
        if (friendsData && friendsData.length > 0) {
          // Get all sender IDs
          const senderIds = friendsData.map((request) => request.sender_id)

          // Fetch profiles for these senders
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url")
            .in("id", senderIds)

          if (profilesError) {
            console.error("Error fetching profiles:", profilesError)
          }

          // Combine the data
          if (profilesData) {
            enrichedFriendRequests = friendsData.map((request) => {
              const senderProfile = profilesData.find((profile) => profile.id === request.sender_id)
              return {
                ...request,
                sender_profile: senderProfile || { username: "Unknown", display_name: "Unknown User" },
              }
            })
          }
        }

        // Get challenge notifications
        const { data: challengeData, error: challengesError } = await supabase
          .from("challenges")
          .select(`
            id,
            status,
            challenger_id,
            recipient_id,
            quiz_id,
            challenger_score,
            recipient_score,
            created_at
          `)
          .or(`challenger_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`)
          .order("created_at", { ascending: false })
          .limit(10)

        if (challengesError) {
          console.error("Error fetching challenges:", challengesError)
        }

        // Enrich challenge data with profiles and quiz info
        let enrichedChallenges: any[] = []
        if (challengeData && challengeData.length > 0) {
          // Get all user IDs involved in challenges
          const userIds = new Set<string>()
          challengeData.forEach((challenge) => {
            userIds.add(challenge.challenger_id)
            userIds.add(challenge.recipient_id)
          })

          // Get all quiz IDs
          const quizIds = challengeData.map((challenge) => challenge.quiz_id)

          // Fetch profiles
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url")
            .in("id", Array.from(userIds))

          if (profilesError) {
            console.error("Error fetching profiles for challenges:", profilesError)
          }

          // Fetch quizzes
          const { data: quizzesData, error: quizzesError } = await supabase
            .from("quizzes")
            .select("id, title, emoji")
            .in("id", quizIds)

          if (quizzesError) {
            console.error("Error fetching quizzes:", quizzesError)
          }

          // Combine the data
          if (profilesData && quizzesData) {
            enrichedChallenges = challengeData.map((challenge) => {
              const challengerProfile = profilesData.find((profile) => profile.id === challenge.challenger_id)
              const recipientProfile = profilesData.find((profile) => profile.id === challenge.recipient_id)
              const quiz = quizzesData.find((quiz) => quiz.id === challenge.quiz_id)

              return {
                ...challenge,
                challenger: challengerProfile || { username: "Unknown", display_name: "Unknown User" },
                recipient: recipientProfile || { username: "Unknown", display_name: "Unknown User" },
                quiz: quiz || { title: "Unknown Quiz", emoji: "❓" },
              }
            })
          }
        }

        setFriendRequests(enrichedFriendRequests || [])
        setChallenges(enrichedChallenges || [])

        // Calculate unread count
        const totalUnread =
          (enrichedFriendRequests?.length || 0) +
          (enrichedChallenges?.filter(
            (c: any) =>
              (c.status === "pending" && c.recipient_id === session.user.id) || (c.status === "completed" && !c.seen),
          )?.length || 0)
        setUnreadCount(totalUnread)
      } catch (error) {
        console.error("Error fetching notifications:", error)
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchNotifications()

    // Set up polling instead of real-time subscriptions
    const pollingInterval = setInterval(fetchNotifications, 10000) // Poll every 10 seconds

    return () => {
      clearInterval(pollingInterval)
    }
  }, [isAuthenticated])

  const handleFriendRequestClick = () => {
    router.push("/social?tab=requests")
  }

  const handleChallengeClick = () => {
    router.push("/profile?tab=challenges")
  }

  // If not authenticated, don't show the notifications button
  if (!isAuthenticated) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">Loading notifications...</div>
        ) : (
          <>
            {friendRequests.length > 0 && (
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs font-normal text-gray-500">Friend Requests</DropdownMenuLabel>
                {friendRequests.slice(0, 3).map((request) => (
                  <DropdownMenuItem key={request.id} onClick={handleFriendRequestClick} className="cursor-pointer">
                    <div className="flex items-start gap-2 py-1">
                      <div className="h-8 w-8 rounded-full bg-slate-700 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {request.sender_profile.display_name || request.sender_profile.username} sent you a friend
                          request
                        </p>
                        <p className="text-xs text-gray-500">{new Date(request.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
                {friendRequests.length > 3 && (
                  <DropdownMenuItem onClick={handleFriendRequestClick} className="cursor-pointer">
                    <p className="text-sm text-center w-full text-blue-500">
                      View all {friendRequests.length} friend requests
                    </p>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </DropdownMenuGroup>
            )}

            {challenges.length > 0 ? (
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs font-normal text-gray-500">Challenges</DropdownMenuLabel>
                {challenges.slice(0, 3).map((challenge) => {
                  const isChallenger = challenge.challenger_id === currentUserId
                  const otherUser = isChallenger ? challenge.recipient : challenge.challenger

                  let statusText = ""
                  let statusBadge = ""

                  if (challenge.status === "pending") {
                    statusText = isChallenger ? "waiting for response" : "challenged you"
                    statusBadge = "pending"
                  } else if (challenge.status === "accepted") {
                    statusText = isChallenger ? "accepted your challenge" : "challenge accepted"
                    statusBadge = "accepted"
                  } else if (challenge.status === "completed") {
                    const userScore = isChallenger ? challenge.challenger_score : challenge.recipient_score
                    const otherScore = isChallenger ? challenge.recipient_score : challenge.challenger_score

                    if (userScore > otherScore) {
                      statusText = "you won"
                      statusBadge = "won"
                    } else if (userScore < otherScore) {
                      statusText = "you lost"
                      statusBadge = "lost"
                    } else {
                      statusText = "it's a draw"
                      statusBadge = "draw"
                    }
                  }

                  return (
                    <DropdownMenuItem key={challenge.id} onClick={handleChallengeClick} className="cursor-pointer">
                      <div className="flex items-start gap-2 py-1">
                        <div className="h-8 w-8 rounded-full bg-slate-700 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {otherUser?.display_name || otherUser?.username || "User"}
                            </p>
                            <Badge
                              variant={
                                statusBadge === "won" ? "success" : statusBadge === "lost" ? "destructive" : "outline"
                              }
                              className="text-xs"
                            >
                              {statusBadge}
                            </Badge>
                          </div>
                          <p className="text-sm truncate">
                            {statusText} - {challenge.quiz?.emoji || "🎮"} {challenge.quiz?.title || "Quiz"}
                          </p>
                          <p className="text-xs text-gray-500">{new Date(challenge.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  )
                })}
                {challenges.length > 3 && (
                  <DropdownMenuItem onClick={handleChallengeClick} className="cursor-pointer">
                    <p className="text-sm text-center w-full text-blue-500">View all {challenges.length} challenges</p>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
