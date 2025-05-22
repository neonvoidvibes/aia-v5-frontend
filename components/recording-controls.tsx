"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, Square } from "lucide-react"
import { cn } from "@/lib/utils"

interface RecordingControlsProps {
  isMinimized?: boolean
  setIsMinimized?: (value: boolean) => void
}

export default function RecordingControls({
  isMinimized: propIsMinimized,
  setIsMinimized: propSetIsMinimized,
}: RecordingControlsProps = {}) {
  const [isRecording, setIsRecording] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [waveformValues, setWaveformValues] = useState<number[]>(Array(20).fill(0))
  const [localIsMinimized, setLocalIsMinimized] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const controlsRef = useRef<HTMLDivElement>(null)

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

  // Use props if provided, otherwise use local state
  const isMinimized = propIsMinimized !== undefined ? propIsMinimized : localIsMinimized
  const setIsMinimized = propSetIsMinimized || setLocalIsMinimized

  // Simulate audio waveform animation
  useEffect(() => {
    if (!isRecording) {
      setWaveformValues(Array(20).fill(0))
      return
    }

    const interval = setInterval(() => {
      setWaveformValues((prev) => prev.map(() => (isRecording ? Math.random() * 0.8 + 0.2 : 0)))
    }, 100)

    return () => clearInterval(interval)
  }, [isRecording])

  useEffect(() => {
    if (isMinimized) return // Don't add listener when already minimized

    const handleClickOutside = (event: MouseEvent) => {
      if (controlsRef.current && !controlsRef.current.contains(event.target as Node)) {
        setIsMinimized(true)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isMinimized, setIsMinimized])

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    setHasStarted(true)
  }

  const stopRecording = () => {
    setIsRecording(false)
    setHasStarted(false)
  }

  const toggleMinimized = () => {
    setIsMinimized(!isMinimized)
  }

  const startRecording = () => {
    setIsRecording(true)
    setHasStarted(true)
  }

  // Icon size based on mobile state
  const iconSize = isMobile ? 16 : 20
  const textSize = isMobile ? "text-xs" : "text-sm"
  const waveformWidth = isMobile ? "w-16" : "w-24"
  const buttonPadding = isMobile ? "p-1" : "p-2"

  if (isMinimized) {
    return (
      <div
        className="px-1 sm:px-4 py-1 text-white cursor-pointer flex flex-col items-center justify-center"
        onClick={toggleMinimized}
        style={{
          width: "auto",
          opacity: 1,
        }}
      >
        {hasStarted && (
          <div
            className={cn(
              "rounded-full mr-2",
              isRecording ? "recording-status-active recording-status-indicator" : "recording-status-paused",
              isMobile ? "mobile-recording-status" : "desktop-recording-status",
            )}
          />
        )}

        {/* Show mini waveform when recording */}
        {hasStarted && isRecording && (
          <div className="flex items-center h-5 space-x-0.5 mx-2" style={{ width: isMobile ? "30px" : "40px" }}>
            {[1, 2, 3, 4, 5].map((_, index) => (
              <div
                key={index}
                className="waveform-bar recording-status-indicator"
                style={{
                  width: isMobile ? "1px" : "2px",
                  height: `${Math.random() * (isMobile ? 6 : 10) + 3}px`,
                  opacity: 0.7 + Math.random() * 0.3,
                  animationDelay: `${index * 0.1}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Show "Paused" text when paused */}
        {hasStarted && !isRecording && (
          <span className={`text-white/80 ${isMobile ? "text-[10px]" : "text-xs"} mr-2`}>Paused</span>
        )}

        {/* Slightly smaller but still visible chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-chevron-up"
          style={{ minWidth: `${iconSize}px`, minHeight: `${iconSize}px` }}
        >
          <path d="m18 15-6-6-6 6" />
        </svg>

        {/* Add "Start Recording" text below the chevron */}
        <span className="text-white/70 text-xs mt-1">{hasStarted ? "Resume Recording" : "Start Recording"}</span>
      </div>
    )
  }

  return (
    <div
      ref={controlsRef}
      className={cn(
        "recording-controls-container rounded-full px-2 sm:px-4 py-2 flex items-center recording-controls",
        isMobile ? "mobile-recording-controls" : "h-[44px]", // Add fixed height for desktop
        "relative z-50", // Ensure the controls themselves have high z-index
      )}
    >
      {hasStarted && (
        <div
          className={cn(
            "rounded-full mr-2",
            isRecording ? "recording-status-active recording-status-indicator" : "recording-status-paused",
            isMobile ? "mobile-recording-status" : "desktop-recording-status",
          )}
        />
      )}

      {!hasStarted ? (
        <div className="flex items-center h-8">
          <span
            className={`text-white ${textSize} mr-2 cursor-pointer hover:text-white/80 transition-colors`}
            onClick={startRecording}
          >
            Start Recording
          </span>
          <button className="text-white hover:text-white/80 transition-colors" onClick={startRecording}>
            <Play className={`h-${isMobile ? "4" : "5"} w-${isMobile ? "4" : "5"}`} />
          </button>
        </div>
      ) : (
        <>
          {isRecording ? (
            <>
              <div
                className={`flex items-center h-8 space-x-0.5 transition-all duration-300 ${waveformWidth}`}
                style={{ minHeight: "32px" }}
              >
                {waveformValues.map((value, index) => (
                  <div
                    key={index}
                    className={cn("waveform-bar", isMobile ? "mobile-waveform-bar" : "desktop-waveform-bar")}
                    style={
                      {
                        height: `${value * (isMobile ? 16 : 24)}px`,
                        opacity: isRecording ? 0.7 + value * 0.3 : 0.3,
                        "--index": index,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>
              <div className="flex items-center ml-2 sm:ml-4">
                <button className="text-white hover:text-white/80 transition-colors" onClick={toggleRecording}>
                  <Pause className={`h-${isMobile ? "4" : "5"} w-${isMobile ? "4" : "5"}`} />
                </button>
                <button
                  className="text-white hover:text-white/80 transition-colors ml-2 sm:ml-3"
                  onClick={stopRecording}
                >
                  <Square className={`h-${isMobile ? "4" : "5"} w-${isMobile ? "4" : "5"}`} />
                </button>
              </div>
            </>
          ) : (
            <>
              <span
                className={`text-white/80 ${textSize} ${waveformWidth} text-center flex items-center justify-center h-8`}
              >
                Paused
              </span>
              <div className="flex items-center ml-2 sm:ml-4">
                <button className="text-white hover:text-white/80 transition-colors" onClick={toggleRecording}>
                  <Play className={`h-${isMobile ? "4" : "5"} w-${isMobile ? "4" : "5"}`} />
                </button>
                <button
                  className="text-white hover:text-white/80 transition-colors ml-2 sm:ml-3"
                  onClick={stopRecording}
                >
                  <Square className={`h-${isMobile ? "4" : "5"} w-${isMobile ? "4" : "5"}`} />
                </button>
              </div>
            </>
          )}
        </>
      )}

      <button className="text-white hover:text-white/80 transition-colors ml-3 sm:ml-5" onClick={toggleMinimized}>
        {/* Matching size and style for consistency */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-chevron-down"
          style={{ minWidth: `${iconSize}px`, minHeight: `${iconSize}px` }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    </div>
  )
}
