"use client"

import { useState } from "react"
import { MicIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Insight {
  id: string
  title: string
  content: string
  source?: string
}

interface InsightBubbleProps {
  insight: Insight
  onClose: () => void
  onVoiceInteraction: (text: string) => void
}

export default function InsightBubble({ insight, onClose, onVoiceInteraction }: InsightBubbleProps) {
  const [isReading, setIsReading] = useState(false)

  const handleVoiceClick = () => {
    setIsReading(true)
    onVoiceInteraction(`${insight.title}. ${insight.content}`)

    // Simulate voice reading completion
    setTimeout(() => {
      setIsReading(false)
    }, insight.content.length * 50) // Rough estimate of reading time
  }

  return (
    <div
      className={cn(
        "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
        "insight-bubble p-6 max-w-md w-full",
        "text-white z-20 animate-fadeIn",
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-2xl font-semibold">{insight.title}</h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-white/70 hover:text-white hover:bg-white/10"
          onClick={onClose}
        >
          <XIcon className="h-5 w-5" />
        </Button>
      </div>

      <div className="h-px bg-white/20 my-2" />

      <p className="text-white/90 my-4">{insight.content}</p>

      {insight.source && <p className="text-sm text-white/60 mt-2">Source: {insight.source}</p>}

      <Button
        variant="outline"
        size="sm"
        className="mt-2 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
        onClick={handleVoiceClick}
        disabled={isReading}
      >
        <MicIcon className="h-4 w-4 mr-2" />
        {isReading ? "Reading..." : "Read Aloud"}
      </Button>
    </div>
  )
}
