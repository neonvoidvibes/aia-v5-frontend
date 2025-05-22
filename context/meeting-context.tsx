"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface MeetingContextType {
  sentiment: number
  setSentiment: (value: number) => void
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined)

export function MeetingProvider({ children }: { children: ReactNode }) {
  const [sentiment, setSentiment] = useState(0.7) // Start with a warm/positive sentiment

  return <MeetingContext.Provider value={{ sentiment, setSentiment }}>{children}</MeetingContext.Provider>
}

export function useMeetingContext() {
  const context = useContext(MeetingContext)
  if (context === undefined) {
    throw new Error("useMeetingContext must be used within a MeetingProvider")
  }
  return context
}
