"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Trophy, Users, User } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileNav() {
  const pathname = usePathname()

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-slate-800 border-t border-slate-700">
      <div className="grid h-full grid-cols-5">
        <Link
          href="/"
          className={cn(
            "inline-flex flex-col items-center justify-center px-5 hover:bg-slate-700",
            pathname === "/" && "text-purple-400",
          )}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs mt-1">Home</span>
        </Link>
        <Link
          href="/explore"
          className={cn(
            "inline-flex flex-col items-center justify-center px-5 hover:bg-slate-700",
            pathname === "/explore" && "text-purple-400",
          )}
        >
          <Search className="w-5 h-5" />
          <span className="text-xs mt-1">Explore</span>
        </Link>
        <Link
          href="/social"
          className={cn(
            "inline-flex flex-col items-center justify-center px-5 hover:bg-slate-700",
            pathname === "/social" && "text-purple-400",
          )}
        >
          <Users className="w-5 h-5" />
          <span className="text-xs mt-1">Social</span>
        </Link>
        {/* Use a direct href instead of Link component for testing */}
        <a
          href="/leaderboard"
          className={cn(
            "inline-flex flex-col items-center justify-center px-5 hover:bg-slate-700",
            pathname === "/leaderboard" && "text-purple-400",
          )}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-xs mt-1">Leaderboard</span>
        </a>
        <Link
          href="/profile"
          className={cn(
            "inline-flex flex-col items-center justify-center px-5 hover:bg-slate-700",
            pathname === "/profile" && "text-purple-400",
          )}
        >
          <User className="w-5 h-5" />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </div>
  )
}
