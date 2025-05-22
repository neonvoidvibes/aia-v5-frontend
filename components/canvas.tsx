"use client"

import { type ReactNode, useEffect, useRef, useState, forwardRef } from "react"

interface CanvasProps {
  children: ReactNode
  sentiment: number // 0 to 1, where 0 is cool/analytical and 1 is warm/positive
}

const Canvas = forwardRef<HTMLDivElement, CanvasProps>(({ children, sentiment }, ref) => {
  const localCanvasRef = useRef<HTMLDivElement>(null)
  const canvasRef = ref || localCanvasRef
  const [phase, setPhase] = useState(0)

  // Very slow, smooth animation for gradient movement
  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      setPhase((prevPhase) => (prevPhase + 0.001) % 360) // Very slow phase change
    })

    return () => cancelAnimationFrame(animationFrame)
  }, [phase])

  useEffect(() => {
    if (!canvasRef.current) return

    // Define base colors for the four corners
    const blueColor = "50, 100, 220" // Blue (analytical)
    const purpleColor = "130, 80, 220" // Purple (neutral)
    const redColor = "220, 50, 100" // Red (positive)

    // Calculate the current position in the color cycle for each corner
    // Each corner cycles through colors at different rates for a more organic feel
    const topLeftPhase = (phase + 0) % 1
    const topRightPhase = (phase + 0.25) % 1
    const bottomLeftPhase = (phase + 0.5) % 1
    const bottomRightPhase = (phase + 0.75) % 1

    // Smooth interpolation between colors for each corner
    const getColorForPhase = (phase: number) => {
      if (phase < 0.33) {
        // Blue to Purple transition
        const t = phase / 0.33
        return `rgba(
          ${Math.round(50 + t * (130 - 50))}, 
          ${Math.round(100 + t * (80 - 100))}, 
          ${Math.round(220 + t * (220 - 220))}, 
          0.8)`
      } else if (phase < 0.67) {
        // Purple to Red transition
        const t = (phase - 0.33) / 0.34
        return `rgba(
          ${Math.round(130 + t * (220 - 130))}, 
          ${Math.round(80 + t * (50 - 80))}, 
          ${Math.round(220 + t * (100 - 220))}, 
          0.8)`
      } else {
        // Red to Blue transition
        const t = (phase - 0.67) / 0.33
        return `rgba(
          ${Math.round(220 + t * (50 - 220))}, 
          ${Math.round(50 + t * (100 - 50))}, 
          ${Math.round(100 + t * (220 - 100))}, 
          0.8)`
      }
    }

    // Get colors for each corner
    const topLeftColor = getColorForPhase(topLeftPhase)
    const topRightColor = getColorForPhase(topRightPhase)
    const bottomLeftColor = getColorForPhase(bottomLeftPhase)
    const bottomRightColor = getColorForPhase(bottomRightPhase)

    // Create a complex gradient using all four corners
    const gradient = `
      linear-gradient(
        135deg, 
        ${topLeftColor} 0%, 
        ${topRightColor} 33%, 
        ${bottomLeftColor} 67%, 
        ${bottomRightColor} 100%
      )
    `

    // Apply very smooth transition
    canvasRef.current.style.transition = "background 4s ease-in-out"
    canvasRef.current.style.background = gradient
  }, [phase, sentiment, canvasRef])

  return (
    <div ref={canvasRef} className="w-full h-full relative overflow-auto canvas-gradient">
      {children}
    </div>
  )
})

Canvas.displayName = "Canvas"

export default Canvas
