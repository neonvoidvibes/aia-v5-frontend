"use client"

import { useState, useEffect } from "react"

interface TagFilterProps {
  tags: string[]
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  onExpandedChange?: (expanded: boolean) => void // Add callback for expansion state
}

export default function TagFilter({ tags, selectedTags, onTagsChange, onExpandedChange }: TagFilterProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
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

  // Notify parent of expansion state changes
  useEffect(() => {
    if (onExpandedChange) {
      onExpandedChange(!isCollapsed)
    }
  }, [isCollapsed, onExpandedChange])

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      // Remove tag if already selected
      onTagsChange(selectedTags.filter((t) => t !== tag))
    } else {
      // Add tag if not selected
      onTagsChange([...selectedTags, tag])
    }
  }

  const selectAll = () => {
    onTagsChange([...tags])
  }

  const clearAll = () => {
    onTagsChange([])
  }

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed)
  }

  // Function to sort tags in the desired order
  const sortTags = (tagsToSort: string[]) => {
    // Define the order we want - ensure Question is after Portal
    const order = ["Mirror", "Lens", "Portal", "Question"]

    // Sort based on the order array
    return [...tagsToSort].sort((a, b) => {
      const indexA = order.indexOf(a)
      const indexB = order.indexOf(b)

      // If both tags are in our order array, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB
      }

      // If only one tag is in our order array, prioritize it
      if (indexA !== -1) return -1
      if (indexB !== -1) return 1

      // For tags not in our order array, sort alphabetically
      return a.localeCompare(b)
    })
  }

  return (
    <div className="w-full max-w-lg mx-auto px-2 sm:px-4">
      {isCollapsed ? (
        <div className="flex flex-col items-center justify-center cursor-pointer py-2" onClick={toggleCollapsed}>
          <span className="text-white/70 text-xs mb-1">Open Filter</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-chevron-down"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      ) : (
        <div className="py-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/70 text-sm">Filter by:</p>
            <div className="flex space-x-2">
              <button className="text-white/70 text-xs hover:text-white transition-colors" onClick={selectAll}>
                Select All
              </button>
              <span className="text-white/50">|</span>
              <button className="text-white/70 text-xs hover:text-white transition-colors" onClick={clearAll}>
                Clear
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {/* Primary tags (excluding Question) */}
            {sortTags(tags.filter((tag) => tag !== "Question")).map((tag) => (
              <button
                key={tag}
                className={`px-2 py-0.5 border text-xs font-medium uppercase tracking-wider transition-colors ${
                  selectedTags.includes(tag)
                    ? "border-white text-white"
                    : "border-white/40 text-white/40 hover:border-white/60 hover:text-white/60"
                }`}
                style={{ borderRadius: "4px" }}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}

            {/* Separator and Question tag */}
            {tags.includes("Question") && (
              <>
                <span className="text-white/50 self-center">|</span>
                <button
                  key="Question"
                  className={`px-2 py-0.5 border text-xs font-medium uppercase tracking-wider transition-colors ${
                    selectedTags.includes("Question")
                      ? "border-white text-white"
                      : "border-white/40 text-white/40 hover:border-white/60 hover:text-white/60"
                  }`}
                  style={{ borderRadius: "4px" }}
                  onClick={() => toggleTag("Question")}
                >
                  Question
                </button>
              </>
            )}
          </div>
          <div className="flex justify-center mt-2">
            <button className="text-white/70 hover:text-white flex items-center" onClick={toggleCollapsed}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-chevron-up"
              >
                <path d="m18 15-6-6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
