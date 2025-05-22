"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import Canvas from "@/components/canvas"
import KeywordBubble from "@/components/keyword-bubble"
import NotificationIndicator from "@/components/notification-indicator"
import TabBar from "@/components/tab-bar"
import RecordingControls from "@/components/recording-controls"
import TagFilter from "@/components/tag-filter"
import { mockKeywords, mockInsights } from "@/lib/mock-data"
import { useMeetingContext } from "@/context/meeting-context"
import { ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

// Update the PositionedKeyword interface to include secondaryTag
interface PositionedKeyword {
  id: string
  text: string
  position: { x: number; y: number }
  tag: string
  secondaryTag?: string
  absoluteX?: number
  absoluteY?: number
  width?: number
  height?: number
  isBelowFold?: boolean
  gridPosition?: { row: number; col: number }
}

interface ChatMessage {
  sender: "You" | "AI"
  text: string
  insightTitle?: string
  insightContent?: string
}

interface HistoricInsight {
  id: string
  timestamp: Date
}

export default function Page() {
  const { sentiment, setSentiment } = useMeetingContext()
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null)
  const [hasNotification, setHasNotification] = useState(false)
  const [importantInsights, setImportantInsights] = useState<string[]>([])
  const [historicInsights, setHistoricInsights] = useState<HistoricInsight[]>([])
  const [activeTab, setActiveTab] = useState("canvas")
  const [notificationModal, setNotificationModal] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const notificationRef = useRef<HTMLDivElement>(null)
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const [recordingMinimized, setRecordingMinimized] = useState(true) // Default to minimized
  const [hoveredInsight, setHoveredInsight] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [hasContentBelow, setHasContentBelow] = useState(false)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [userRecordingPreference, setUserRecordingPreference] = useState<{
    chat: boolean
    canvas: boolean
  }>({
    chat: true, // Collapsed by default for chat
    canvas: false, // Opened by default for insights
  })

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

  // Get all unique tags from keywords
  const allTags = Array.from(
    new Set([
      ...mockKeywords.map((keyword) => keyword.tag),
      ...mockKeywords.filter((keyword) => keyword.secondaryTag).map((keyword) => keyword.secondaryTag as string),
    ]),
  )
  const [selectedTags, setSelectedTags] = useState<string[]>([...allTags]) // All selected by default
  const [adjustedKeywords, setAdjustedKeywords] = useState<PositionedKeyword[]>(mockKeywords)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Scroll to cards below the fold
  const scrollToCardsBelowFold = () => {
    if (canvasContainerRef.current) {
      // Find the first card below the fold
      const belowFoldCards = adjustedKeywords
        .filter((keyword) => keyword.isBelowFold && selectedTags.includes(keyword.tag))
        .sort((a, b) => {
          // Sort by Y position to find the topmost card below the fold
          const aY = a.absoluteY || 0
          const bY = b.absoluteY || 0
          return aY - bY
        })

      if (belowFoldCards.length > 0 && belowFoldCards[0].absoluteY) {
        // Get the first card below the fold
        const firstCard = belowFoldCards[0]

        // Calculate scroll position - aim to position the card about 1/3 from the top of the viewport
        const viewportHeight = window.innerHeight
        const scrollTarget = (firstCard.absoluteY || 0) - viewportHeight / 3

        // Scroll to the target position
        window.scrollTo({
          top: scrollTarget,
          behavior: "smooth",
        })
      }
    }
  }

  // Replace the useEffect for positioning with this column-based layout approach
  useEffect(() => {
    // Only run this when the canvas is visible
    if (activeTab !== "canvas" || !canvasRef.current) return

    // Determine if we're on a mobile device
    const isMobileView = window.innerWidth < 640

    // Calculate how many columns we can fit
    const canvasWidth = canvasRef.current.clientWidth
    const cardWidth = isMobileView ? 280 : 320 // Card width in pixels
    const gap = isMobileView ? 16 : 24 // Gap between cards in pixels
    const padding = isMobileView ? 16 : 24 // Padding around the grid
    const columnPadding = isMobileView ? 8 : 12 // Padding between columns

    // Calculate available width for cards
    const availableWidth = canvasWidth - padding * 2

    // Calculate number of columns (minimum 1)
    const numColumns = Math.max(1, Math.floor(availableWidth / (cardWidth + columnPadding * 2)))

    // Calculate actual column width including padding
    const columnWidth = availableWidth / numColumns

    // Filter keywords based on selected tags
    const visibleKeywords = mockKeywords.filter((keyword) => {
      const primaryTagSelected = selectedTags.includes(keyword.tag)

      // If this keyword has a Question secondary tag
      if (keyword.secondaryTag === "Question") {
        // It should only show if BOTH the primary tag AND Question tag are selected
        return primaryTagSelected && selectedTags.includes("Question")
      }

      // For keywords without a secondary tag, just check the primary tag
      return primaryTagSelected
    })

    // Distribute keywords into columns (column-first distribution)
    const columns: PositionedKeyword[][] = Array.from({ length: numColumns }, () => [])

    // Distribute keywords evenly across columns
    visibleKeywords.forEach((keyword, index) => {
      const columnIndex = index % numColumns
      columns[columnIndex].push({
        ...keyword,
        gridPosition: {
          row: columns[columnIndex].length + 1,
          col: columnIndex + 1,
        },
      })
    })

    // Flatten the columns back into a single array
    const keywordsWithGridPositions = columns.flat()

    // Check which cards are below the fold
    const viewportHeight = window.innerHeight - 150 // Account for header and padding

    // We'll need to estimate the height of each row
    const estimatedRowHeight = 100 // Base height of a card
    const belowFoldCards = keywordsWithGridPositions.filter((keyword) => {
      // Estimate the Y position based on grid row
      const estimatedY = (keyword.gridPosition?.row || 1) * estimatedRowHeight
      const isBelowFold = estimatedY > viewportHeight
      keyword.isBelowFold = isBelowFold
      return isBelowFold
    })

    // Update if there's content below the fold
    setHasContentBelow(belowFoldCards.length > 0)

    // Calculate required height for the canvas
    // Find the column with the most cards
    const maxCardsInColumn = Math.max(...columns.map((col) => col.length))
    const requiredHeight = Math.max(viewportHeight, maxCardsInColumn * estimatedRowHeight + padding * 2 + 120) // Add extra for top padding

    // Update canvas height if needed
    if (canvasRef.current && requiredHeight > viewportHeight) {
      canvasRef.current.style.minHeight = `${requiredHeight}px`
    }

    setAdjustedKeywords(keywordsWithGridPositions)

    // Store the column structure for rendering
    setColumnStructure({
      columns,
      columnWidth,
      numColumns,
    })
  }, [activeTab, selectedTags, canvasRef.current?.clientWidth])

  // Add this state to store the column structure
  const [columnStructure, setColumnStructure] = useState<{
    columns: PositionedKeyword[][]
    columnWidth: number
    numColumns: number
  }>({
    columns: [],
    columnWidth: 0,
    numColumns: 0,
  })

  // Add a resize listener to update positions when window size changes
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        // Force re-calculation of positions
        setAdjustedKeywords((prev) => [...prev])
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Scroll to bottom of chat when new messages are added
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatMessages])

  // Focus input when tab changes to chat
  useEffect(() => {
    if (activeTab === "chat" && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }

    // Apply user's recording control preference based on active tab
    setRecordingMinimized(activeTab === "chat" ? userRecordingPreference.chat : userRecordingPreference.canvas)
  }, [activeTab, userRecordingPreference])

  // Update the useEffect to change sentiment more frequently
  useEffect(() => {
    const interval = setInterval(() => {
      // More dynamic sentiment changes
      const newSentiment = Math.min(Math.max(sentiment + (Math.random() - 0.5) * 0.15, 0), 1)
      setSentiment(newSentiment)

      // Randomly trigger notifications
      if (Math.random() > 0.95 && !hasNotification) {
        setHasNotification(true)
        const randomInsight = mockInsights[Math.floor(Math.random() * mockInsights.length)].id
        setImportantInsights((prev) => [...prev, randomInsight])
      }
    }, 3000) // Faster updates for more dynamic changes

    return () => clearInterval(interval)
  }, [sentiment, setSentiment, hasNotification])

  // Handle click outside notification modal
  useEffect(() => {
    if (!notificationModal) return

    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationModal(false)
        setHoveredInsight(null) // Reset hovered insight when modal is closed
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [notificationModal])

  const handleKeywordClick = (id: string) => {
    setExpandedInsight(expandedInsight === id ? null : id)
  }

  const handleVoiceInteraction = (text: string) => {
    // In a real implementation, this would trigger text-to-speech
    console.log("Voice reading:", text)
    // Simulate voice reading
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }

  const handleNotificationClick = () => {
    setNotificationModal(true)
  }

  const handleShowInsight = (id: string) => {
    setExpandedInsight(id)
    setNotificationModal(false)
    setHasNotification(false)

    // Move current insights to historic when they're viewed
    if (importantInsights.includes(id)) {
      setImportantInsights((prev) => prev.filter((insightId) => insightId !== id))

      // Add to historic insights if not already there
      if (!historicInsights.some((insight) => insight.id === id)) {
        setHistoricInsights((prev) => [...prev, { id, timestamp: new Date() }])
      }
    }

    setHoveredInsight(null) // Reset hovered insight when an insight is selected
  }

  const handleChatSubmit = (message: string) => {
    if (!message.trim()) return

    // Get the current insight if one is expanded
    const currentInsight = expandedInsight ? mockInsights.find((i) => i.id === expandedInsight) : undefined

    // Add user message to chat with insight if available
    setChatMessages((prev) => [
      ...prev,
      {
        sender: "You",
        text: message,
        insightTitle: currentInsight?.title,
        insightContent: currentInsight?.content,
      },
    ])

    // Clear input
    setInputValue("")

    // Add AI response
    setTimeout(() => {
      let aiResponse = "I've noted your message. How can I help further?"

      if (currentInsight) {
        // Generate a more contextual response based on the insight
        const responses = [
          `That's an interesting point about ${currentInsight.title.toLowerCase()}. Have you considered how this might impact the team's workflow?`,
          `I see you're focusing on ${currentInsight.title.toLowerCase()}. This aligns with our quarterly objectives.`,
          `Your thoughts on ${currentInsight.title.toLowerCase()} are valuable. I've added this to our action items for follow-up.`,
        ]
        aiResponse = responses[Math.floor(Math.random() * responses.length)]
      }

      setChatMessages((prev) => [...prev, { sender: "AI", text: aiResponse }])
    }, 1000)

    // Switch to chat tab
    setActiveTab("chat")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleChatSubmit(inputValue)
    }
  }

  // Handle recording controls state change
  const handleRecordingMinimizedChange = (value: boolean) => {
    setRecordingMinimized(value)

    // Save user preference based on active tab
    if (activeTab === "chat") {
      setUserRecordingPreference((prev) => ({ ...prev, chat: value }))
    } else {
      setUserRecordingPreference((prev) => ({ ...prev, canvas: value }))
    }
  }

  // Add this useEffect to automatically scroll when needed
  useEffect(() => {
    // If there are cards below the fold, automatically scroll after a short delay
    if (hasContentBelow && activeTab === "canvas") {
      const timer = setTimeout(() => {
        scrollToCardsBelowFold()
      }, 300) // Short delay to allow rendering
      return () => clearTimeout(timer)
    }
  }, [selectedTags, hasContentBelow, activeTab])

  return (
    <main className="relative w-full h-screen overflow-hidden">
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 w-[60%] sm:w-full sm:max-w-md px-1 sm:px-4">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {activeTab === "canvas" && (
        <>
          <div className="absolute right-3 sm:right-6 flex items-center z-30" style={{ top: "26px" }}>
            {/* Only show text if not mobile AND notification is active */}
            {!isMobile && (
              <span
                className={`text-white/70 text-[10px] sm:text-xs mr-1 sm:mr-2 cursor-pointer ${
                  hasNotification ? "hover:text-white/90" : ""
                }`}
                onClick={hasNotification ? handleNotificationClick : undefined}
              >
                AI Reflection
              </span>
            )}
            <NotificationIndicator active={hasNotification} onClick={handleNotificationClick} />
          </div>
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-20 w-full">
            <TagFilter tags={allTags} selectedTags={selectedTags} onTagsChange={setSelectedTags} />
          </div>
        </>
      )}

      {notificationModal && (
        <div
          ref={notificationRef}
          className="notification-modal absolute top-24 right-2 sm:right-6 p-4 sm:p-6 z-40 w-72 max-w-[90vw] shadow-lg animate-slideIn"
        >
          <h3 className="text-white font-medium text-xl mb-2">AI Reflection</h3>
          <div className="h-px bg-white/20 mb-3" />

          {/* Current insights */}
          {importantInsights.length > 0 && (
            <ul className="space-y-2">
              {importantInsights.map((id) => {
                const insight = mockInsights.find((i) => i.id === id)
                const keyword = mockKeywords.find((k) => k.id === id)
                return (
                  <li key={id}>
                    <button
                      className="text-white hover:bg-white/10 p-2 rounded-xl w-full text-left transition-colors text-base"
                      onClick={() => handleShowInsight(id)}
                      onMouseEnter={() => setHoveredInsight(id)}
                      onMouseLeave={() => setHoveredInsight(null)}
                    >
                      <div className="flex items-center justify-between">
                        <span>{insight?.title}</span>
                        {keyword && (
                          <div className="tag px-2 py-0.5 text-xs font-medium text-white uppercase tracking-wider">
                            {keyword.tag}
                          </div>
                        )}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {/* No current insights message */}
          {importantInsights.length === 0 && (
            <p className="text-white/70 text-sm mb-4">No new reflections at this moment.</p>
          )}

          {/* Historic insights section */}
          {historicInsights.length > 0 && (
            <>
              <div className="h-px bg-white/20 my-4" />
              <h4 className="text-white/70 text-sm font-medium mb-2">Previous Reflections</h4>
              <ul className="space-y-2">
                {historicInsights.map((historic) => {
                  const insight = mockInsights.find((i) => i.id === historic.id)
                  const keyword = mockKeywords.find((k) => k.id === historic.id)
                  return (
                    <li key={historic.id}>
                      <button
                        className="text-white/80 hover:bg-white/10 p-2 rounded-xl w-full text-left transition-colors text-sm"
                        onClick={() => handleShowInsight(historic.id)}
                        onMouseEnter={() => setHoveredInsight(historic.id)}
                        onMouseLeave={() => setHoveredInsight(null)}
                      >
                        <div className="flex items-center justify-between">
                          <span>{insight?.title}</span>
                          {keyword && (
                            <div className="tag px-2 py-0.5 text-xs font-medium text-white uppercase tracking-wider">
                              {keyword.tag}
                            </div>
                          )}
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Canvas View */}
      {activeTab === "canvas" && (
        <div className="absolute inset-0" ref={canvasContainerRef}>
          <Canvas sentiment={sentiment}>
            <div className="pt-16 min-h-screen relative" ref={canvasRef}>
              <div className="keyword-grid">
                {columnStructure.columns.map((column, columnIndex) => (
                  <div
                    key={`column-${columnIndex}`}
                    className="keyword-column"
                    style={{
                      width: `${100 / columnStructure.numColumns}%`,
                    }}
                  >
                    {column
                      .filter((keyword) => {
                        // First check if the primary tag is selected
                        const primaryTagSelected = selectedTags.includes(keyword.tag)

                        // If this keyword has a Question secondary tag
                        if (keyword.secondaryTag === "Question") {
                          // It should only show if BOTH the primary tag AND Question tag are selected
                          return primaryTagSelected && selectedTags.includes("Question")
                        }

                        // For keywords without a secondary tag, just check the primary tag
                        return primaryTagSelected
                      })
                      .map((keyword) => (
                        <KeywordBubble
                          key={keyword.id}
                          id={keyword.id}
                          text={keyword.text}
                          position={keyword.position}
                          tag={keyword.tag}
                          secondaryTag={keyword.secondaryTag}
                          onClick={() => handleKeywordClick(keyword.id)}
                          isActive={expandedInsight === keyword.id}
                          insight={
                            expandedInsight === keyword.id ? mockInsights.find((i) => i.id === keyword.id) : undefined
                          }
                          onClose={expandedInsight === keyword.id ? () => setExpandedInsight(null) : undefined}
                          onVoiceInteraction={expandedInsight === keyword.id ? handleVoiceInteraction : undefined}
                          onChatClick={
                            expandedInsight === keyword.id ? (message) => handleChatSubmit(message) : undefined
                          }
                          isHighlighted={hoveredInsight === keyword.id}
                          gridPosition={keyword.gridPosition}
                        />
                      ))}
                  </div>
                ))}
              </div>
            </div>
          </Canvas>
        </div>
      )}

      {/* Chat View */}
      {activeTab === "chat" && (
        <div className="absolute inset-0 overflow-y-auto">
          <Canvas sentiment={sentiment}>
            <div className="pt-24 pb-32 px-4">
              {/* Empty state message - absolutely positioned in the center */}
              {chatMessages.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-white/80 text-center text-xl">
                    <p>No messages yet. Start a conversation using the input below.</p>
                  </div>
                </div>
              )}

              {/* Chat messages - original positioning */}
              <div className="max-w-2xl mx-auto space-y-10 px-2 sm:px-4">
                {chatMessages.map((msg, index) => (
                  <div key={index} className="relative group">
                    <div
                      className={cn(
                        "backdrop-blur-md",
                        msg.sender === "You"
                          ? "chat-bubble-user ml-auto text-white max-w-[85%]"
                          : "chat-bubble-ai mr-auto text-white w-full mb-0" /* AI bubble has transparent bg and no bottom margin for cleaner look */,
                      )}
                    >
                      <div className={msg.sender === "You" ? "px-6 py-4" : "py-4"}>
                        <p className="text-sm opacity-70 mb-2">{msg.sender}</p>
                        {msg.insightTitle && (
                          <>
                            <p className="font-medium text-xl">{msg.insightTitle}</p>
                            <p className="text-lg opacity-90 mt-1">{msg.insightContent}</p>
                            <div className="h-px bg-white/20 my-3" />
                          </>
                        )}
                        <p className="text-xl">{msg.text}</p>
                      </div>
                    </div>

                    {/* Message action buttons - positioned closer to AI messages due to transparent background */}
                    <div
                      className={`absolute ${msg.sender === "You" ? "-bottom-8 right-0" : "-bottom-2 left-0"} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
                    >
                      <div className="flex">
                        {msg.sender === "AI" && (
                          <>
                            {/* No padding for AI message icons to match the transparent bubble design */}
                            <button
                              className="text-white/60 hover:text-white transition-colors"
                              onClick={() => {
                                // Copy text to clipboard
                                navigator.clipboard.writeText(msg.text)
                                // In a real implementation, you would toggle a state to show checkmark
                                const button = document.getElementById(`copy-${index}`)
                                if (button) {
                                  const icon = button.querySelector("svg")
                                  if (icon) {
                                    icon.innerHTML = '<path d="M20 6 9 17l-5-5"/>'
                                    setTimeout(() => {
                                      icon.innerHTML =
                                        '<rect x="8" y="8" width="12" height="12" rx="2" ry="2"></rect><path d="M4 16V4a2 2 0 0 1 2-2h10"></path>'
                                    }, 2000)
                                  }
                                }
                              }}
                              id={`copy-${index}`}
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
                                className="lucide"
                              >
                                <rect x="8" y="8" width="12" height="12" rx="2" ry="2"></rect>
                                <path d="M4 16V4a2 2 0 0 1 2-2h10"></path>
                              </svg>
                            </button>
                            <button
                              className="text-white/60 hover:text-white ml-3 transition-colors"
                              onClick={() => handleVoiceInteraction(msg.text)}
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
                                className="lucide lucide-volume-2"
                              >
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                              </svg>
                            </button>
                          </>
                        )}

                        {msg.sender === "You" && (
                          <>
                            <button
                              className="text-white/60 hover:text-white p-1 mx-1 transition-colors"
                              onClick={() => {
                                // Copy text to clipboard
                                navigator.clipboard.writeText(msg.text)
                                // In a real implementation, you would toggle a state to show checkmark
                                const button = document.getElementById(`copy-user-${index}`)
                                if (button) {
                                  const icon = button.querySelector("svg")
                                  if (icon) {
                                    icon.innerHTML = '<path d="M20 6 9 17l-5-5"/>'
                                    setTimeout(() => {
                                      icon.innerHTML =
                                        '<rect x="8" y="8" width="12" height="12" rx="2" ry="2"></rect><path d="M4 16V4a2 2 0 0 1 2-2h10"></path>'
                                    }, 2000)
                                  }
                                }
                              }}
                              id={`copy-user-${index}`}
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
                                className="lucide"
                              >
                                <rect x="8" y="8" width="12" height="12" rx="2" ry="2"></rect>
                                <path d="M4 16V4a2 2 0 0 1 2-2h10"></path>
                              </svg>
                            </button>
                            <button
                              className="text-white/60 hover:text-white p-1 mx-1 transition-colors"
                              onClick={() => {
                                // In a real implementation, this would open an edit interface
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
                                className="lucide lucide-pen"
                              >
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </div>
          </Canvas>

          {/* Chat Input Field */}
          <div className="fixed bottom-16 left-0 right-0 px-2 sm:px-4 z-30">
            <div className="max-w-2xl mx-auto">
              <div className="chat-input-container rounded-full flex items-center p-1 shadow-lg animate-slideUp">
                <input
                  ref={inputRef}
                  type="text"
                  className="flex-1 bg-transparent border-none outline-none text-white px-4 py-3 text-lg"
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button
                  className={`p-3 rounded-full ${
                    inputValue.trim() ? "bg-white/20 text-white hover:bg-white/30" : "text-white/40"
                  }`}
                  onClick={() => handleChatSubmit(inputValue)}
                  disabled={!inputValue.trim()}
                  aria-label="Send message"
                >
                  <ArrowUp className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-50">
        <RecordingControls isMinimized={recordingMinimized} setIsMinimized={handleRecordingMinimizedChange} />
      </div>
    </main>
  )
}
