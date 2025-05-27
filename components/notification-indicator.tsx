"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface NotificationIndicatorProps {
  active: boolean
  onClick: () => void
}

export default function NotificationIndicator({ active, onClick }: NotificationIndicatorProps) {
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile
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
    <div
      className={cn(
        "rounded-full notification-indicator",
        active ? "cursor-pointer notification-indicator-active" : "notification-indicator-inactive",
        isMobile ? "mobile-notification-indicator" : "desktop-notification-indicator",
      )}
      onClick={onClick}
      aria-hidden={false}
    />
  )
}
