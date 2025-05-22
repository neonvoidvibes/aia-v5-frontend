"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ArrowUp, X } from "lucide-react"

interface ChatInputProps {
  onSubmit: (message: string) => void
  onCancel: () => void
}

export default function ChatInput({ onSubmit, onCancel }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Focus the input when component mounts
    if (inputRef.current) {
      inputRef.current.focus()
    }

    // Handle escape key to cancel
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onCancel])

  const handleSubmit = () => {
    if (message.trim()) {
      onSubmit(message)
      setMessage("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit()
    }
  }

  return (
    <div className="fixed bottom-16 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-md px-2 sm:px-4">
      <div className="chat-input-container rounded-full flex items-center p-1 shadow-lg animate-slideUp">
        <button className="p-2 text-white/70 hover:text-white rounded-full" onClick={onCancel} aria-label="Cancel">
          <X className="h-5 w-5" />
        </button>
        <input
          ref={inputRef}
          type="text"
          className="flex-1 bg-transparent border-none outline-none text-white px-3 py-2"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button
          className={`p-2 rounded-full ${
            message.trim() ? "bg-white/20 text-white hover:bg-white/30" : "text-white/40"
          }`}
          onClick={handleSubmit}
          disabled={!message.trim()}
          aria-label="Send message"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
