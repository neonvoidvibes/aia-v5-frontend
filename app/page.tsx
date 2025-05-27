"use client"

import React from "react"

import { useEffect, useState, useRef, useCallback } from "react"
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

// Helper function to get tag border color classes for modal
const getModalTagBorderClasses = (tag: string) => {
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

export default function Page() {
  const { sentiment, setSentiment } = useMeetingContext()
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null)
  const [hasNotification, setHasNotification] = useState(false)
  const [filterExpanded, setFilterExpanded] = useState(false) // Add filter expansion state

  // Updated reflection state management
  const [currentInsight, setCurrentInsight] = useState<string | null>(null) // Only one at a time
  const [recentInsights, setRecentInsights] = useState<HistoricInsight[]>([]) // Max 3
  const [checkedInsights, setCheckedInsights] = useState<HistoricInsight[]>([]) // Previously "historic"
  const [archivedInsights, setArchivedInsights] = useState<HistoricInsight[]>([]) // Overflow from recent

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
  const [userRecordingPreference, setUserRecordingPreference] = useState<{
    chat: boolean
    canvas: boolean
  }>({
    chat: true, // Collapsed by default for chat
    canvas: false, // Opened by default for insights
  })

  // New state for temporarily showing hidden cards
  const [temporarilyVisibleCards, setTemporarilyVisibleCards] = useState<Set<string>>(new Set())

  // Add this state near the other useState declarations around line 60:
  const [modalOpen, setModalOpen] = useState(false)

  // Enhanced scroll position preservation state
  const [uiState, setUiState] = useState({
    savedScrollPosition: 0,
    savedExpandedCard: null as string | null,
    isPreservingState: false,
  })

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Get all unique tags from keywords - memoize this to prevent recalculation
  const allTags = React.useMemo(() => {
    return Array.from(
      new Set([
        ...mockKeywords.map((keyword) => keyword.tag),
        ...mockKeywords.filter((keyword) => keyword.secondaryTag).map((keyword) => keyword.secondaryTag as string),
      ]),
    )
  }, [])

  const [selectedTags, setSelectedTags] = useState<string[]>(() => allTags.filter((tag) => tag !== "Question"))

  const canvasRef = useRef<HTMLDivElement>(null)

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

  // Helper function to check if a card should be visible - memoize this
  const isCardVisible = useCallback(
    (keyword: PositionedKeyword) => {
      // If card is temporarily visible due to AI reflection, show it
      if (temporarilyVisibleCards.has(keyword.id)) {
        return true
      }

      // Normal filtering logic
      const primaryTagSelected = selectedTags.includes(keyword.tag)
      const questionTagSelected = selectedTags.includes("Question")

      // If Question is selected, only show Question cards whose primary tag is also selected
      if (questionTagSelected) {
        return keyword.secondaryTag === "Question" && primaryTagSelected
      }

      // If Question is not selected, show non-Question cards based on primary tag
      return primaryTagSelected && keyword.secondaryTag !== "Question"
    },
    [selectedTags, temporarilyVisibleCards],
  )

  // Memoize the canvas width to prevent unnecessary recalculations
  const [canvasWidth, setCanvasWidth] = useState(0)

  // Update canvas width when canvas ref changes
  useEffect(() => {
    if (canvasRef.current) {
      setCanvasWidth(canvasRef.current.clientWidth)
    }
  }, [activeTab])

  // Replace the useEffect for positioning with this column-based layout approach
  useEffect(() => {
    // Only run this when the canvas is visible and we have a width
    if (activeTab !== "canvas" || canvasWidth === 0) return

    // Determine if we're on a mobile device
    const isMobileView = window.innerWidth < 640

    // Calculate how many columns we can fit
    const cardWidth = isMobileView ? 280 : 320
    const gap = isMobileView ? 16 : 24
    const padding = isMobileView ? 16 : 24
    const columnPadding = isMobileView ? 8 : 12

    // Calculate available width for cards
    const availableWidth = canvasWidth - padding * 2

    // Calculate number of columns (minimum 1)
    const numColumns = Math.max(1, Math.floor(availableWidth / (cardWidth + columnPadding * 2)))

    // Calculate actual column width including padding
    const columnWidth = availableWidth / numColumns

    // Filter keywords based on visibility (including temporarily visible cards)
    const visibleKeywords = mockKeywords.filter(isCardVisible)

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

    // Store the column structure for rendering
    setColumnStructure({
      columns,
      columnWidth,
      numColumns,
    })
  }, [activeTab, canvasWidth, isCardVisible])

  // Add a resize listener to update canvas width
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        setCanvasWidth(canvasRef.current.clientWidth)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Save complete UI state when opening modals/filters
  const saveUIState = useCallback(() => {
    if (scrollContainerRef.current) {
      setUiState({
        savedScrollPosition: scrollContainerRef.current.scrollTop,
        savedExpandedCard: expandedInsight,
        isPreservingState: true,
      })
    }
  }, [expandedInsight])

  // Restore complete UI state when closing modals/filters
  const restoreUIState = useCallback(() => {
    if (uiState.isPreservingState && scrollContainerRef.current) {
      // Restore expanded card first
      if (uiState.savedExpandedCard && !expandedInsight) {
        setExpandedInsight(uiState.savedExpandedCard)
      }

      // Restore scroll position with a delay to ensure layout is complete
      setTimeout(() => {
        if (scrollContainerRef.current && uiState.savedScrollPosition > 0) {
          scrollContainerRef.current.scrollTop = uiState.savedScrollPosition
        }
        setUiState((prev) => ({ ...prev, isPreservingState: false }))
      }, 100)
    }
  }, [uiState.isPreservingState, uiState.savedExpandedCard, uiState.savedScrollPosition, expandedInsight])

  // Monitor UI element states and preserve/restore accordingly
  useEffect(() => {
    const isUIElementOpen = notificationModal || filterExpanded || !recordingMinimized

    if (isUIElementOpen && !uiState.isPreservingState) {
      saveUIState()
    } else if (!isUIElementOpen && uiState.isPreservingState) {
      restoreUIState()
    }
  }, [notificationModal, filterExpanded, recordingMinimized, uiState.isPreservingState, saveUIState, restoreUIState])

  // Check if mobile
  useEffect(() => {
    const checkScreenWidth = () => {
      setIsMobile(window.innerWidth < 640)
    }

    checkScreenWidth()
    window.addEventListener("resize", checkScreenWidth)
    return () => window.removeEventListener("resize", checkScreenWidth)
  }, [])

  // Initialize scroll container ref
  useEffect(() => {
    const scrollContainer = document.querySelector(".app-content")
    if (scrollContainer) {
      scrollContainerRef.current = scrollContainer as HTMLDivElement
    }
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

    setRecordingMinimized(activeTab === "chat" ? userRecordingPreference.chat : userRecordingPreference.canvas)
  }, [activeTab, userRecordingPreference])

  // Updated useEffect to handle new reflection system - keep generating insights
  useEffect(() => {
    const interval = setInterval(() => {
      // More dynamic sentiment changes
      const newSentiment = Math.min(Math.max(sentiment + (Math.random() - 0.5) * 0.15, 0), 1)
      setSentiment(newSentiment)

      // Continue generating insights even if current one wasn't clicked
      if (Math.random() > 0.95) {
        const randomInsight = mockInsights[Math.floor(Math.random() * mockInsights.length)].id

        // Move current insight to recent if there is one
        if (currentInsight) {
          setRecentInsights((prev) => {
            const newRecent = [{ id: currentInsight, timestamp: new Date() }, ...prev]

            // If more than 3 in recent, move oldest to archived
            if (newRecent.length > 3) {
              const toArchive = newRecent.pop()!
              setArchivedInsights((prevArchived) => [toArchive, ...prevArchived])
              return newRecent.slice(0, 3)
            }

            return newRecent
          })
        }

        // Set new current insight and activate notification
        setCurrentInsight(randomInsight)
        setHasNotification(true)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [sentiment, setSentiment, currentInsight])

  const handleNotificationClick = useCallback(() => {
    saveUIState()
    setNotificationModal(true)
    setModalOpen(true)
    if (window.innerWidth < 640) {
      document.body.classList.add("modal-open")
    }
  }, [saveUIState])

  useEffect(() => {
    if (!notificationModal) return

    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationModal(false)
        setModalOpen(false)
        setHoveredInsight(null)
        if (window.innerWidth < 640) {
          document.body.classList.remove("modal-open")
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [notificationModal])

  // Handle click outside expanded cards to close them
  useEffect(() => {
    if (!expandedInsight) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      if (!target.closest(".keyword-bubble")) {
        setExpandedInsight(null)
        setTemporarilyVisibleCards(new Set())
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [expandedInsight])

  const handleKeywordClick = useCallback(
    (id: string) => {
      setExpandedInsight(expandedInsight === id ? null : id)
    },
    [expandedInsight],
  )

  const handleVoiceInteraction = useCallback((text: string) => {
    console.log("Voice reading:", text)
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }, [])

  const handleInsightHover = useCallback(
    (id: string) => {
      setHoveredInsight(id)

      const keyword = mockKeywords.find((k) => k.id === id)
      if (keyword && !isCardVisible(keyword)) {
        setTemporarilyVisibleCards((prev) => new Set([...prev, id]))
      }
    },
    [isCardVisible],
  )

  const handleInsightHoverLeave = useCallback(
    (id: string) => {
      setHoveredInsight(null)

      const keyword = mockKeywords.find((k) => k.id === id)
      if (keyword && temporarilyVisibleCards.has(id)) {
        if (expandedInsight !== id) {
          setTemporarilyVisibleCards((prev) => {
            const newSet = new Set(prev)
            newSet.delete(id)
            return newSet
          })
        }
      }
    },
    [temporarilyVisibleCards, expandedInsight],
  )

  const handleShowInsight = useCallback(
    (id: string, section: "current" | "recent" | "checked" | "archived") => {
      setExpandedInsight(id)
      setNotificationModal(false)
      setModalOpen(false)

      const keyword = mockKeywords.find((k) => k.id === id)
      if (keyword && !isCardVisible(keyword)) {
        setTemporarilyVisibleCards((prev) => new Set([...prev, id]))
      }

      if (section === "current") {
        setHasNotification(false)
        setCurrentInsight(null)
        setCheckedInsights((prev) => [{ id, timestamp: new Date() }, ...prev])
      } else if (section === "recent") {
        setRecentInsights((prev) => prev.filter((insight) => insight.id !== id))
        setCheckedInsights((prev) => [{ id, timestamp: new Date() }, ...prev])
      } else if (section === "archived") {
        setArchivedInsights((prev) => prev.filter((insight) => insight.id !== id))
        setCheckedInsights((prev) => [{ id, timestamp: new Date() }, ...prev])
      }

      setHoveredInsight(null)

      if (window.innerWidth < 640) {
        document.body.classList.remove("modal-open")
      }

      setTimeout(() => {
        if (scrollContainerRef.current && uiState.savedScrollPosition > 0) {
          scrollContainerRef.current.scrollTop = uiState.savedScrollPosition
        }

        setTimeout(() => {
          const cardElement = document.querySelector(`[data-card-id="${id}"]`)
          if (cardElement && scrollContainerRef.current) {
            const rect = cardElement.getBoundingClientRect()
            const containerRect = scrollContainerRef.current.getBoundingClientRect()
            const targetPosition = scrollContainerRef.current.scrollTop + rect.top - containerRect.top - 100

            scrollContainerRef.current.scrollTo({
              top: Math.max(0, targetPosition),
              behavior: "smooth",
            })
          }
        }, 100)
      }, 50)
    },
    [isCardVisible, uiState.savedScrollPosition],
  )

  const handleChatSubmit = useCallback(
    (message: string) => {
      if (!message.trim()) return

      const currentInsightData =
        expandedInsight && activeTab === "canvas" ? mockInsights.find((i) => i.id === expandedInsight) : undefined

      setChatMessages((prev) => [
        ...prev,
        {
          sender: "You",
          text: message,
          insightTitle: currentInsightData?.title,
          insightContent: currentInsightData?.content,
        },
      ])

      setInputValue("")

      setTimeout(() => {
        let aiResponse = "I'm here to help surface collective insights. What would you like to explore together?"

        if (currentInsightData) {
          const responses = [
            `Your reflection on ${currentInsightData.title.toLowerCase()} highlights an important aspect of our collective understanding. How might we build on this insight as a group?`,
            `This connects to patterns I'm seeing in our dialogue around ${currentInsightData.title.toLowerCase()}. What other perspectives might enrich this shared understanding?`,
            `Your input on ${currentInsightData.title.toLowerCase()} adds valuable context to our collective sense-making. I've noted this for our group's knowledge base.`,
          ]
          aiResponse = responses[Math.floor(Math.random() * responses.length)]
        }

        setChatMessages((prev) => [...prev, { sender: "AI", text: aiResponse }])
      }, 1000)

      setActiveTab("chat")
    },
    [expandedInsight, activeTab],
  )

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleChatSubmit(inputValue)
      }
    },
    [handleChatSubmit, inputValue],
  )

  const handleRecordingMinimizedChange = useCallback(
    (value: boolean) => {
      if (!value) {
        saveUIState()
      }

      setRecordingMinimized(value)

      if (activeTab === "chat") {
        setUserRecordingPreference((prev) => ({ ...prev, chat: value }))
      } else {
        setUserRecordingPreference((prev) => ({ ...prev, canvas: value }))
      }
    },
    [activeTab, saveUIState],
  )

  const onExpandedChange = useCallback(
    (expanded: boolean) => {
      if (expanded) {
        saveUIState()
      }
      setFilterExpanded(expanded)
    },
    [saveUIState],
  )

  return (
    <>
      {/* Canvas background - full viewport */}
      <Canvas sentiment={sentiment} />

      <div className="app-layout">
        {/* Fixed Header */}
        <div className="app-header app-header-collapsed">
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-[60%] sm:w-full sm:max-w-md px-1 sm:px-4">
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          {activeTab === "canvas" && (
            <div className="absolute right-3 sm:right-6 flex items-center" style={{ top: "26px" }}>
              {/* Only show text if not mobile AND notification is active */}
              {!isMobile && (
                <span
                  className="text-white/70 text-[10px] sm:text-xs mr-1 sm:mr-2 cursor-pointer hover:text-white/90"
                  onClick={handleNotificationClick}
                >
                  AI Reflection
                </span>
              )}
              <NotificationIndicator active={hasNotification} onClick={handleNotificationClick} />
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="app-content app-content-collapsed">
          {notificationModal && (
            <div
              ref={notificationRef}
              className={cn(
                "notification-modal fixed top-24 right-2 sm:right-6 p-4 sm:p-6 z-40 w-80 max-w-[90vw] shadow-lg animate-slideIn modal-scroll",
                isMobile && "mobile-modal",
              )}
            >
              <h3 className="text-white font-medium text-xl mb-2">AI Reflection</h3>
              <div className="h-px bg-white/20 mb-3" />

              {/* Current insight - only one */}
              {currentInsight && (
                <>
                  <ul className="space-y-2 mb-4">
                    {(() => {
                      const insight = mockInsights.find((i) => i.id === currentInsight)
                      const keyword = mockKeywords.find((k) => k.id === currentInsight)
                      return (
                        <li key={currentInsight}>
                          <button
                            className="text-white hover:bg-white/10 p-2 rounded-xl w-full text-left transition-colors text-base"
                            onClick={() => handleShowInsight(currentInsight, "current")}
                            onMouseEnter={() => handleInsightHover(currentInsight)}
                            onMouseLeave={() => handleInsightHoverLeave(currentInsight)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="flex-1 break-words">{insight?.title}</span>
                              {keyword && (
                                <div
                                  className={cn(
                                    "px-2 py-0.5 text-xs font-medium uppercase tracking-wider flex-shrink-0 border rounded",
                                    getModalTagBorderClasses(keyword.tag),
                                  )}
                                >
                                  {keyword.tag}
                                </div>
                              )}
                            </div>
                          </button>
                        </li>
                      )
                    })()}
                  </ul>
                </>
              )}

              {/* No current insights message */}
              {!currentInsight && <p className="text-white/70 text-sm mb-4">No new reflections at this moment.</p>}

              {/* Recent Reflections section */}
              {recentInsights.length > 0 && (
                <>
                  <div className="h-px bg-white/20 my-4" />
                  <h4 className="text-white/70 text-sm font-medium mb-2">Recent Reflections</h4>
                  <ul className="space-y-2 mb-4">
                    {recentInsights.map((recent) => {
                      const insight = mockInsights.find((i) => i.id === recent.id)
                      const keyword = mockKeywords.find((k) => k.id === recent.id)
                      return (
                        <li key={recent.id}>
                          <button
                            className="text-white/80 hover:bg-white/10 p-2 rounded-xl w-full text-left transition-colors text-sm"
                            onClick={() => handleShowInsight(recent.id, "recent")}
                            onMouseEnter={() => handleInsightHover(recent.id)}
                            onMouseLeave={() => handleInsightHoverLeave(recent.id)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="flex-1 break-words">{insight?.title}</span>
                              {keyword && (
                                <div
                                  className={cn(
                                    "px-2 py-0.5 text-xs font-medium uppercase tracking-wider flex-shrink-0 border rounded",
                                    getModalTagBorderClasses(keyword.tag),
                                  )}
                                >
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

              {/* Checked Reflections section */}
              {checkedInsights.length > 0 && (
                <>
                  <div className="h-px bg-white/20 my-4" />
                  <h4 className="text-white/70 text-sm font-medium mb-2">Checked Reflections</h4>
                  <ul className="space-y-2 mb-4">
                    {checkedInsights.map((checked) => {
                      const insight = mockInsights.find((i) => i.id === checked.id)
                      const keyword = mockKeywords.find((k) => k.id === checked.id)
                      return (
                        <li key={checked.id}>
                          <button
                            className="text-white/80 hover:bg-white/10 p-2 rounded-xl w-full text-left transition-colors text-sm"
                            onClick={() => handleShowInsight(checked.id, "checked")}
                            onMouseEnter={() => handleInsightHover(checked.id)}
                            onMouseLeave={() => handleInsightHoverLeave(checked.id)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="flex-1 break-words">{insight?.title}</span>
                              {keyword && (
                                <div
                                  className={cn(
                                    "px-2 py-0.5 text-xs font-medium uppercase tracking-wider flex-shrink-0 border rounded",
                                    getModalTagBorderClasses(keyword.tag),
                                  )}
                                >
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

              {/* Archived Reflections section */}
              {archivedInsights.length > 0 && (
                <>
                  <div className="h-px bg-white/20 my-4" />
                  <h4 className="text-white/70 text-sm font-medium mb-2">Archived Reflections</h4>
                  <ul className="space-y-2">
                    {archivedInsights.map((archived) => {
                      const insight = mockInsights.find((i) => i.id === archived.id)
                      const keyword = mockKeywords.find((k) => k.id === archived.id)
                      return (
                        <li key={archived.id}>
                          <button
                            className="text-white/60 hover:bg-white/10 p-2 rounded-xl w-full text-left transition-colors text-sm"
                            onClick={() => handleShowInsight(archived.id, "archived")}
                            onMouseEnter={() => handleInsightHover(archived.id)}
                            onMouseLeave={() => handleInsightHoverLeave(archived.id)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="flex-1 break-words">{insight?.title}</span>
                              {keyword && (
                                <div
                                  className={cn(
                                    "px-2 py-0.5 text-xs font-medium uppercase tracking-wider flex-shrink-0 border rounded",
                                    getModalTagBorderClasses(keyword.tag),
                                  )}
                                >
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

          {activeTab === "canvas" && (
            <>
              {/* Filter section - now part of scrollable content */}
              <div className="filter-section">
                <TagFilter
                  tags={allTags}
                  selectedTags={selectedTags}
                  onTagsChange={setSelectedTags}
                  onExpandedChange={onExpandedChange}
                />
              </div>

              <div className="keyword-grid" ref={canvasRef}>
                {columnStructure.columns.map((column, columnIndex) => (
                  <div
                    key={`column-${columnIndex}`}
                    className="keyword-column"
                    style={{
                      width: `${100 / columnStructure.numColumns}%`,
                    }}
                  >
                    {column.filter(isCardVisible).map((keyword) => (
                      <div key={keyword.id} data-card-id={keyword.id}>
                        <KeywordBubble
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
                          onClose={
                            expandedInsight === keyword.id
                              ? () => {
                                  setExpandedInsight(null)
                                  setTemporarilyVisibleCards(new Set())
                                }
                              : undefined
                          }
                          onVoiceInteraction={expandedInsight === keyword.id ? handleVoiceInteraction : undefined}
                          onChatClick={
                            expandedInsight === keyword.id ? (message) => handleChatSubmit(message) : undefined
                          }
                          isHighlighted={hoveredInsight === keyword.id}
                          gridPosition={keyword.gridPosition}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === "chat" && (
            <div className="chat-content">
              {chatMessages.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-white/80 text-center text-xl">
                    <p>No messages yet. Start a conversation using the input below.</p>
                  </div>
                </div>
              )}

              <div className="max-w-2xl mx-auto space-y-10 px-2 sm:px-4">
                {chatMessages.map((msg, index) => (
                  <div key={index} className="relative group">
                    <div
                      className={cn(
                        "backdrop-blur-md",
                        msg.sender === "You"
                          ? "chat-bubble-user ml-auto text-white max-w-[85%]"
                          : "chat-bubble-ai mr-auto text-white w-full mb-0",
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

                    <div
                      className={`absolute ${msg.sender === "You" ? "-bottom-8 right-0" : "-bottom-2 left-0"} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
                    >
                      <div className="flex">
                        {msg.sender === "AI" && (
                          <>
                            <button
                              className="text-white/60 hover:text-white transition-colors"
                              onClick={() => {
                                navigator.clipboard.writeText(msg.text)
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
                                navigator.clipboard.writeText(msg.text)
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
          )}
        </div>

        <div className="app-footer">
          {activeTab === "chat" && (
            <div className="absolute bottom-16 left-0 right-0 px-2 sm:px-4">
              <div className="max-w-2xl mx-auto">
                <div className="chat-input-container rounded-full flex items-center p-1 shadow-lg animate-slideUp">
                  <input
                    ref={inputRef}
                    type="text"
                    className="flex-1 bg-transparent border-none outline-none text-white pl-6 pr-4 py-2 text-lg"
                    placeholder="Type your message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <div className="ml-2">
                    <button
                      className={`p-2 rounded-full ${
                        inputValue.trim() ? "bg-white/20 text-white hover:bg-white/30" : "bg-white/20 text-white/40"
                      }`}
                      onClick={() => inputValue.trim() && handleChatSubmit(inputValue)}
                      disabled={!inputValue.trim()}
                      aria-label={inputValue.trim() ? "Send message" : "Voice chat (coming soon)"}
                    >
                      {inputValue.trim() ? (
                        <ArrowUp className="h-6 w-6 text-white" strokeWidth={3} />
                      ) : (
                        <ClassicWaveform className="h-6 w-6 text-white" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
            <RecordingControls isMinimized={recordingMinimized} setIsMinimized={handleRecordingMinimizedChange} />
          </div>
        </div>
      </div>
    </>
  )
}
