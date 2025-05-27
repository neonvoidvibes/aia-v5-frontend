"use client"
import { useState, useRef, useEffect } from "react"
import type React from "react"

import { XIcon, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

// Classic Waveform Icon Component
const ClassicWaveform = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <rect x="2" y="8" width="2" height="8" rx="0" />
    <rect x="6" y="4" width="2" height="16" rx="0" />
    <rect x="10" y="10" width="2" height="4" rx="0" />
    <rect x="14" y="6" width="2" height="12" rx="0" />
    <rect x="18" y="2" width="2" height="20" rx="0" />
    <rect x="22" y="9" width="2" height="6" rx="0" />
  </svg>
)

interface Insight {
  id: string
  title: string
  content: string
  source?: string
}

interface KeywordBubbleProps {
  id: string
  text: string
  position: { x: number; y: number }
  tag: string
  secondaryTag?: string
  onClick: () => void
  isActive: boolean
  insight?: {
    title: string
    content: string
    source?: string
  }
  onClose?: () => void
  onVoiceInteraction?: (text: string) => void
  onChatClick?: (message: string) => void
  isHighlighted?: boolean
  gridPosition?: { row: number; col: number }
  isDimmed?: boolean
}

// Helper function to get tag border color classes
const getTagBorderClasses = (tag: string) => {
  switch (tag.toLowerCase()) {
    case "mirror":
      return "border-orange-400 text-white bg-transparent"
    case "lens":
      return "border-green-400 text-white bg-transparent"
    case "portal":
      return "border-blue-600 text-white bg-transparent"
    case "question":
      return "border-white/70 text-white bg-transparent"
    default:
      return "border-white/70 text-white bg-transparent"
  }
}

export default function KeywordBubble({
  id,
  text,
  position,
  tag,
  secondaryTag,
  onClick,
  isActive,
  insight,
  onClose,
  onVoiceInteraction,
  onChatClick,
  isHighlighted,
  gridPosition,
  isDimmed,
}: KeywordBubbleProps) {
  const [isReading, setIsReading] = useState(false)
  const [showChatInput, setShowChatInput] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const [opacity, setOpacity] = useState(0.8)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLDivElement>(null)

  // Fade in and out slightly
  useEffect(() => {
    const fadeInterval = setInterval(() => {
      // Random opacity between 0.7 and 1
      setOpacity(0.7 + Math.random() * 0.3)
    }, 3000)

    return () => clearInterval(fadeInterval)
  }, [])

  // Focus input when chat input is shown
  useEffect(() => {
    if (showChatInput && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showChatInput])

  // Handle scrolling when card is expanded (initial expansion)
  useEffect(() => {
    if (isActive && insight && bubbleRef.current) {
      // Small delay to allow the expansion animation to complete
      setTimeout(() => {
        if (bubbleRef.current) {
          // Find the scrollable container (app-content)
          const scrollContainer = document.querySelector(".app-content")
          if (scrollContainer) {
            const bubbleRect = bubbleRef.current.getBoundingClientRect()
            const containerRect = scrollContainer.getBoundingClientRect()

            // Calculate the bottom of the expanded card relative to the viewport
            const cardBottom = bubbleRect.bottom
            const viewportBottom = containerRect.bottom

            // Check if the bottom of the card is outside the visible area
            if (cardBottom > viewportBottom) {
              // Calculate how much we need to scroll to show the full card
              // Add extra padding to ensure the bottom is clearly visible
              const scrollAmount = cardBottom - viewportBottom + 40 // Add 40px padding

              scrollContainer.scrollTo({
                top: scrollContainer.scrollTop + scrollAmount,
                behavior: "smooth",
              })
            }
          }
        }
      }, 350) // Wait for animation to complete (300ms + buffer)
    }
  }, [isActive, insight]) // Trigger when card becomes active

  // Handle scrolling when chat input is shown (additional expansion)
  useEffect(() => {
    if (showChatInput && bubbleRef.current) {
      // Small delay to allow the input to render and animations to complete
      setTimeout(() => {
        if (bubbleRef.current) {
          // Find the scrollable container (app-content)
          const scrollContainer = document.querySelector(".app-content")
          if (scrollContainer) {
            const bubbleRect = bubbleRef.current.getBoundingClientRect()
            const containerRect = scrollContainer.getBoundingClientRect()

            // Calculate the bottom of the expanded card relative to the viewport
            const cardBottom = bubbleRect.bottom
            const viewportBottom = containerRect.bottom

            // Check if the bottom of the card is outside the visible area
            if (cardBottom > viewportBottom) {
              // Calculate how much we need to scroll to show the full card
              // Add extra padding to ensure the bottom is clearly visible
              const scrollAmount = cardBottom - viewportBottom + 40 // Add 40px padding

              scrollContainer.scrollTo({
                top: scrollContainer.scrollTop + scrollAmount,
                behavior: "smooth",
              })
            }
          }
        }
      }, 350) // Wait for animation to complete (300ms + buffer)
    }
  }, [showChatInput])

  const handleVoiceClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onVoiceInteraction || !insight) return

    setIsReading(true)
    onVoiceInteraction(`${insight.title}. ${insight.content}`)

    // Simulate voice reading completion
    setTimeout(() => {
      setIsReading(false)
    }, insight?.content.length * 50) // Rough estimate of reading time
  }

  const handleChatButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowChatInput(!showChatInput)
  }

  const handleChatSubmit = (message: string) => {
    if (onChatClick) {
      // Pass the message up to the parent component
      onChatClick(message)
      setShowChatInput(false)
      setInputValue("")
    }
  }

  return (
    <div className="keyword-bubble-container">
      {/* REMOVED: motion.div with layout="position" - replaced with regular div */}
      <div
        className={cn(
          "keyword-bubble w-full",
          isActive ? "keyword-bubble-expanded" : "keyword-bubble-collapsed",
          isHighlighted && !isActive ? "keyword-bubble-highlighted" : "",
          isDimmed ? "keyword-bubble-dimmed" : "",
        )}
        onClick={!isActive ? onClick : undefined}
        ref={bubbleRef}
        style={{
          zIndex: isActive ? 10 : 1,
          opacity: isHighlighted ? 1 : isDimmed ? 0.3 : opacity,
        }}
      >
        {/* Header - Always visible */}
        <div className="flex items-center justify-between p-4 min-h-[80px]">
          <div className="flex items-center flex-1 min-w-0">
            <span className="font-medium text-lg sm:text-xl text-white break-words flex-1 mr-2 sm:mr-3">{text}</span>
            <div className="flex flex-col items-end flex-shrink-0">
              <div
                className={cn(
                  "px-1.5 py-0.5 sm:px-2 sm:py-0.5 text-xs font-medium uppercase tracking-wider whitespace-nowrap border rounded",
                  getTagBorderClasses(tag),
                )}
              >
                {tag}
              </div>
              {secondaryTag && (
                <div
                  className={cn(
                    "px-1.5 py-0.5 sm:px-2 sm:py-0.5 text-xs font-medium uppercase tracking-wider whitespace-nowrap mt-1 border rounded",
                    getTagBorderClasses(secondaryTag),
                  )}
                >
                  Q
                </div>
              )}
            </div>
          </div>
          {isActive && onClose && (
            <button
              className="text-white/70 hover:text-white hover:bg-white/10 p-1 rounded-full flex-shrink-0 ml-2"
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
            >
              <XIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Expandable Content */}
        <AnimatePresence initial={false}>
          {isActive && insight && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4">
                <div className="h-px bg-white/20 mb-4" />
                <p className="text-white mb-4 text-lg">{insight.content}</p>
                {insight.source && <p className="text-sm text-white/60 mb-4 text-base">Source: {insight.source}</p>}

                <div className="flex space-x-2">
                  <button
                    className="px-3 py-1.5 border border-white/30 bg-transparent text-white rounded-full hover:bg-white/10 flex items-center text-base"
                    onClick={handleVoiceClick}
                    disabled={isReading}
                  >
                    <ClassicWaveform className="h-4 w-4 mr-2" />
                    {isReading ? "Reading..." : "Read Aloud"}
                  </button>

                  <button
                    className={`px-3 py-1.5 border border-white/30 bg-transparent text-white rounded-full hover:bg-white/10 flex items-center text-base ${
                      showChatInput ? "bg-white/10" : ""
                    }`}
                    onClick={handleChatButtonClick}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat
                  </button>
                </div>
              </div>

              {/* Chat input */}
              <AnimatePresence>
                {showChatInput && (
                  <motion.div
                    ref={chatInputRef}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-white/20 pt-3 px-4 pb-4">
                      <div className="flex items-center">
                        <input
                          ref={inputRef}
                          type="text"
                          className="flex-1 bg-transparent outline-none text-white px-3 py-2 text-base"
                          placeholder="Type your message..."
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && inputValue.trim() && handleChatSubmit(inputValue)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
                          onClick={(e) => {
                            e.stopPropagation()
                            inputValue.trim() && handleChatSubmit(inputValue)
                          }}
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
                            className="lucide lucide-arrow-up"
                          >
                            <path d="m5 12 7-7 7 7" />
                            <path d="M12 19V5" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
