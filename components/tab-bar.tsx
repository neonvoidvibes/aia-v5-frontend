"use client"

import { MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface TabBarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const [isMobile, setIsMobile] = useState(false)

  // Check screen width on mount and when window resizes
  useEffect(() => {
    const checkScreenWidth = () => {
      setIsMobile(window.innerWidth < 640)
    }

    // Initial check
    checkScreenWidth()

    // Add resize listener
    window.addEventListener("resize", checkScreenWidth)

    // Cleanup
    return () => window.removeEventListener("resize", checkScreenWidth)
  }, [])

  return (
    <div className="tab-bar rounded-full p-1 flex w-full max-w-[70%] sm:max-w-lg mx-auto shadow-md">
      <button
        className={cn(
          "flex items-center justify-center py-1.5 px-1 sm:px-3 rounded-full w-1/2 transition-all duration-300 text-sm",
          activeTab === "chat" ? "bg-white/10 text-white" : "text-white/70 hover:text-white/90",
        )}
        onClick={() => onTabChange("chat")}
      >
        <MessageSquare className="h-4 w-4 mr-0 sm:mr-2" />
        <span className="hidden sm:inline">Chat</span>
      </button>
      <button
        className={cn(
          "flex items-center justify-center py-1.5 px-1 sm:px-3 rounded-full w-1/2 transition-all duration-300 text-sm",
          activeTab === "canvas" ? "bg-white/10 text-white" : "text-white/70 hover:text-white/90",
        )}
        onClick={() => onTabChange("canvas")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-0 sm:mr-2"
        >
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
        <span className="hidden sm:inline">Insights</span>
      </button>
    </div>
  )
}
