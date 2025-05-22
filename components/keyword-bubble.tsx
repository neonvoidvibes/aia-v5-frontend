"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { MicIcon, XIcon, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

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
  // Helper function to calculate optimal position for expanded card
  const calculateOptimalPosition = (rect: DOMRect) => {
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight

    // Calculate the expanded card dimensions (approximate)
    const expandedWidth = Math.min(400, windowWidth * 0.85)
    const expandedHeight = 300 // Approximate height of expanded card

    // Start with the current position
    let left = rect.left
    let top = rect.top

    // Adjust position to ensure the expanded card stays within viewport
    // Check right edge
    if (left + expandedWidth > windowWidth - 20) {
      left = windowWidth - expandedWidth - 20
    }

    // Check left edge
    if (left < 20) {
      left = 20
    }

    // Check bottom edge
    if (top + expandedHeight > windowHeight - 20) {
      top = windowHeight - expandedHeight - 20
    }

    // Check top edge
    if (top < 20) {
      top = 20
    }

    return { left, top }
  }

  const [opacity, setOpacity] = useState(0.8)
  const [isReading, setIsReading] = useState(false)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const [expandDirection, setExpandDirection] = useState<"left" | "right">("right")
  const [textPosition, setTextPosition] = useState({ top: 0, left: 0 })
  const [showChatInput, setShowChatInput] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const initialPositionRef = useRef<{ left: number; top: number } | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionStyles, setTransitionStyles] = useState<React.CSSProperties>({})
  const targetPositionRef = useRef<{ left: number; top: number } | null>(null)

  // Determine expand direction and position based on original position and viewport boundaries
  useEffect(() => {
    const handlePositioning = () => {
      if (bubbleRef.current) {
        const rect = bubbleRef.current.getBoundingClientRect()
        const windowWidth = window.innerWidth

        // Calculate if expanding right would go off-screen
        const rightEdgeIfExpandRight = rect.left + 400 // 400px is max card width
        const leftEdgeIfExpandLeft = rect.right - 400

        // Determine direction based on available space and position
        if (rightEdgeIfExpandRight > windowWidth - 20) {
          setExpandDirection("left")
        } else if (leftEdgeIfExpandLeft < 20) {
          setExpandDirection("right")
        } else {
          // Default based on position in viewport
          setExpandDirection(position.x > 0.5 ? "left" : "right")
        }
      }
    }

    // Run on mount and when active state changes
    handlePositioning()

    // Also run on resize
    window.addEventListener("resize", handlePositioning)
    return () => window.removeEventListener("resize", handlePositioning)
  }, [position.x, isActive])

  // Save text position before expanding
  useEffect(() => {
    if (!isActive && textRef.current && bubbleRef.current) {
      const textRect = textRef.current.getBoundingClientRect()
      const bubbleRect = bubbleRef.current.getBoundingClientRect()
      setTextPosition({
        top: textRect.top - bubbleRect.top,
        left: textRect.left - bubbleRect.left,
      })
    }
  }, [isActive])

  // Fade in and out slightly instead of moving
  useEffect(() => {
    const fadeInterval = setInterval(() => {
      // Random opacity between 0.7 and 1
      setOpacity(0.7 + Math.random() * 0.3)
    }, 3000)

    return () => clearInterval(fadeInterval)
  }, [])

  // Calculate target position for smooth transitions
  const calculateTargetPosition = () => {
    if (!bubbleRef.current) return null

    // Get the current viewport dimensions
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Calculate the absolute position based on percentage
    const targetLeft = position.x * viewportWidth
    const targetTop = position.y * viewportHeight

    return { left: targetLeft, top: targetTop }
  }

  // Handle click outside
  useEffect(() => {
    if (!isActive || !onClose) return

    const handleClickOutside = (event: MouseEvent) => {
      if (bubbleRef.current && !bubbleRef.current.contains(event.target as Node)) {
        handleCloseCard()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isActive, onClose])

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

  useEffect(() => {
    if (showChatInput && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showChatInput])

  // Capture initial position when card becomes active
  useEffect(() => {
    if (isActive && bubbleRef.current && !initialPositionRef.current && !isTransitioning) {
      const rect = bubbleRef.current.getBoundingClientRect()
      initialPositionRef.current = calculateOptimalPosition(rect)
    }

    // Reset when card is closed and not transitioning
    if (!isActive && !isTransitioning) {
      initialPositionRef.current = null
      targetPositionRef.current = null
      setTransitionStyles({})
    }
  }, [isActive, isTransitioning])

  // Handle smooth closing transition
  const handleCloseCard = () => {
    if (isClosing || isTransitioning) return

    setIsClosing(true)
    setShowChatInput(false)

    // Calculate the target position (where the card should animate to)
    targetPositionRef.current = calculateTargetPosition()

    if (targetPositionRef.current && initialPositionRef.current) {
      setIsTransitioning(true)

      // Create transition styles that animate from current fixed position to target position
      setTransitionStyles({
        position: "fixed",
        left: `${initialPositionRef.current.left}px`,
        top: `${initialPositionRef.current.top}px`,
        width: "300px", // Approximate width of collapsed card
        height: "80px", // Approximate height of collapsed card
        transform: `translate(${targetPositionRef.current.left - initialPositionRef.current.left}px, ${targetPositionRef.current.top - initialPositionRef.current.top}px) translate(-50%, -50%)`,
        opacity: 0.8,
        transition: "transform 0.3s ease-out, width 0.3s ease-out, height 0.3s ease-out, opacity 0.3s ease-out",
        zIndex: 40,
      })

      // After animation completes, reset and close
      setTimeout(() => {
        onClose?.()
        setIsClosing(false)
        setIsTransitioning(false)
        setTransitionStyles({})
      }, 300)
    } else {
      // Fallback if we can't calculate positions
      onClose?.()
      setIsClosing(false)
    }
  }

  // Determine which styles to use based on component state
  const getPositionStyles = () => {
    // If we're in the middle of a closing transition, use the transition styles
    if (isTransitioning && Object.keys(transitionStyles).length > 0) {
      return transitionStyles
    }

    // If active and we have an initial position, use fixed positioning
    if (isActive && initialPositionRef.current) {
      return {
        position: "fixed" as const,
        left: `${initialPositionRef.current.left}px`,
        top: `${initialPositionRef.current.top}px`,
        transform: "none",
        opacity: 1,
        padding: "0",
        margin: "0",
        zIndex: 50,
        transition:
          "width 0.3s ease-out, height 0.3s ease-out, background-color 0.3s ease-out, box-shadow 0.3s ease-out",
      }
    }

    // Default to absolute positioning for inactive state
    return {
      position: "absolute" as const,
      left: `${position.x * 100}%`,
      top: `${position.y * 100}%`,
      transform: "translate(-50%, -50%)",
      opacity: opacity,
      padding: "15px",
      margin: "15px",
      transition: "transform 0.3s ease-out, opacity 0.3s ease-out",
    }
  }

  const handleBubbleClick = () => {
    if (!isActive && bubbleRef.current) {
      const rect = bubbleRef.current.getBoundingClientRect()
      initialPositionRef.current = calculateOptimalPosition(rect)
    }
    onClick()
  }

  return (
    <div
      ref={bubbleRef}
      className={cn(
        "absolute transition-all duration-300 ease-in-out",
        isActive ? "z-40" : "cursor-pointer z-30",
        isTransitioning ? "pointer-events-none" : "",
      )}
      style={getPositionStyles()}
    >
      {/* For collapsed state */}
      {!isActive && !isTransitioning && (
        <div
          className={cn(
            "flex items-center px-4 py-3 sm:px-6 sm:py-4 keyword-bubble",
            isHighlighted ? "keyword-bubble-highlighted" : "keyword-bubble-collapsed",
          )}
          onClick={handleBubbleClick}
        >
          <div className="flex items-center justify-between w-full">
            <span ref={textRef} className="font-medium text-lg sm:text-xl text-white mr-2 sm:mr-3 break-words">
              {text}
            </span>
            <div className="tag px-1.5 py-0.5 sm:px-2 sm:py-0.5 text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap flex-shrink-0">
              {tag}
            </div>
          </div>
        </div>
      )}

      {/* For expanded state */}
      {(isActive || isTransitioning) && insight && (
        <div
          className={cn(
            "keyword-bubble keyword-bubble-expanded overflow-hidden flex flex-col",
            isTransitioning ? "pointer-events-none" : "",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center flex-1 mr-2">
              <span ref={textRef} className="font-medium text-2xl text-white mr-3">
                {text}
              </span>
              <div className="tag px-2 py-0.5 text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap flex-shrink-0">
                {tag}
              </div>
            </div>
            {onClose && !isTransitioning && (
              <button
                className="text-white/70 hover:text-white hover:bg-white/10 p-1 rounded-full flex-shrink-0"
                onClick={handleCloseCard}
              >
                <XIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Content - only show if not transitioning */}
          {!isTransitioning && (
            <div className="px-6 pb-4 animate-expand-content">
              <div className="h-px bg-white/20 my-2" />
              <p className="text-white/90 my-4 text-lg">{insight.content}</p>
              {insight.source && <p className="text-sm text-white/60 mt-2 text-base">Source: {insight.source}</p>}

              <div className="flex space-x-2 mt-3">
                <button
                  className="px-3 py-1.5 border border-white/30 bg-transparent text-white rounded-full hover:bg-white/10 flex items-center text-base"
                  onClick={handleVoiceClick}
                  disabled={isReading}
                >
                  <MicIcon className="h-4 w-4 mr-2" />
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
          )}

          {/* Chat input - only shown when chat button is clicked and not transitioning */}
          {showChatInput && !isTransitioning && (
            <div className="border-t border-white/20 pt-3 px-6 pb-4">
              <div className="flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  className="flex-1 bg-transparent outline-none text-white px-3 py-2 text-base"
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && inputValue.trim() && handleChatSubmit(inputValue)}
                />
                <button
                  className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
                  onClick={() => inputValue.trim() && handleChatSubmit(inputValue)}
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
          )}
        </div>
      )}
    </div>
  )
}
