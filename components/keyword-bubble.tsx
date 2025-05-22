"use client"
import { useState, useRef, useEffect } from "react"
import { MicIcon, XIcon, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface KeywordBubbleProps {
  id: string
  text: string
  position: { x: number; y: number }
  tag: string
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
}

export default function KeywordBubble({
  id,
  text,
  position,
  tag,
  onClick,
  isActive,
  insight,
  onClose,
  onVoiceInteraction,
  onChatClick,
  isHighlighted,
}: KeywordBubbleProps) {
  const [isReading, setIsReading] = useState(false)
  const [showChatInput, setShowChatInput] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const [opacity, setOpacity] = useState(0.8)

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

  // Preload animation to avoid first animation jerkiness
  useEffect(() => {
    // Force a small layout calculation to warm up Framer Motion
    const preload = document.createElement("div")
    preload.style.position = "absolute"
    preload.style.opacity = "0"
    preload.style.pointerEvents = "none"
    document.body.appendChild(preload)

    // Force a reflow
    void preload.offsetHeight

    // Clean up
    setTimeout(() => {
      document.body.removeChild(preload)
    }, 100)
  }, [])

  const handleVoiceClick = () => {
    if (!onVoiceInteraction || !insight) return

    setIsReading(true)
    onVoiceInteraction(`${insight.title}. ${insight.content}`)

    // Simulate voice reading completion
    setTimeout(() => {
      setIsReading(false)
    }, insight?.content.length * 50) // Rough estimate of reading time
  }

  const handleChatButtonClick = () => {
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

  // Transition configuration for smooth animations
  const transitionConfig = {
    type: "spring",
    stiffness: 200,
    damping: 25,
    duration: 0.4,
  }

  return (
    <AnimatePresence mode="wait">
      {isActive ? (
        // Expanded card
        <motion.div
          layoutId={`keyword-${id}`}
          className="fixed z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transitionConfig}
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(400px, 85vw)",
          }}
        >
          <div className="keyword-bubble keyword-bubble-expanded overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center flex-1 mr-2">
                <span className="font-medium text-2xl text-white mr-3">{text}</span>
                <div className="tag px-2 py-0.5 text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap flex-shrink-0">
                  {tag}
                </div>
              </div>
              {onClose && (
                <button
                  className="text-white/70 hover:text-white hover:bg-white/10 p-1 rounded-full flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    onClose()
                  }}
                >
                  <XIcon className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Content */}
            <motion.div
              className="px-6 pb-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <div className="h-px bg-white/20 my-2" />
              {insight && (
                <>
                  <p className="text-white/90 my-4 text-lg">{insight.content}</p>
                  {insight.source && <p className="text-sm text-white/60 mt-2 text-base">Source: {insight.source}</p>}

                  <div className="flex space-x-2 mt-3">
                    <button
                      className="px-3 py-1.5 border border-white/30 bg-transparent text-white rounded-full hover:bg-white/10 flex items-center text-base"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleVoiceClick()
                      }}
                      disabled={isReading}
                    >
                      <MicIcon className="h-4 w-4 mr-2" />
                      {isReading ? "Reading..." : "Read Aloud"}
                    </button>

                    <button
                      className={`px-3 py-1.5 border border-white/30 bg-transparent text-white rounded-full hover:bg-white/10 flex items-center text-base ${
                        showChatInput ? "bg-white/10" : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleChatButtonClick()
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Chat
                    </button>
                  </div>
                </>
              )}
            </motion.div>

            {/* Chat input */}
            <AnimatePresence>
              {showChatInput && (
                <motion.div
                  className="border-t border-white/20 pt-3 px-6 pb-4"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      ) : (
        // Collapsed card
        <motion.div
          layoutId={`keyword-${id}`}
          className="absolute cursor-pointer z-30"
          style={{
            left: `${position.x * 100}%`,
            top: `${position.y * 100}%`,
            transform: "translate(-50%, -50%)",
            opacity: isHighlighted ? 1 : opacity,
          }}
          onClick={onClick}
          transition={transitionConfig}
        >
          <div
            className={cn(
              "flex items-center px-4 py-3 sm:px-6 sm:py-4 keyword-bubble",
              isHighlighted ? "keyword-bubble-highlighted" : "keyword-bubble-collapsed",
            )}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-medium text-lg sm:text-xl text-white mr-2 sm:mr-3 break-words">{text}</span>
              <div className="tag px-1.5 py-0.5 sm:px-2 sm:py-0.5 text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap flex-shrink-0">
                {tag}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
