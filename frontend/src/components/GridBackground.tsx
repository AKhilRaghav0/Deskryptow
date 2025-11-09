import { useEffect, useRef } from 'react'

export default function GridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      drawGrid(ctx, canvas.width, canvas.height)
    }

    const drawGrid = (context: CanvasRenderingContext2D, width: number, height: number) => {
      context.clearRect(0, 0, width, height)
      
      const gridSize = 40
      const lineColor = '#1D1616' // Using exact palette dark color
      const lineWidth = 0.5

      context.strokeStyle = lineColor
      context.lineWidth = lineWidth
      context.globalAlpha = 0.1 // Very subtle

      // Vertical lines
      for (let x = 0; x <= width; x += gridSize) {
        context.beginPath()
        context.moveTo(x, 0)
        context.lineTo(x, height)
        context.stroke()
      }

      // Horizontal lines
      for (let y = 0; y <= height; y += gridSize) {
        context.beginPath()
        context.moveTo(0, y)
        context.lineTo(width, y)
        context.stroke()
      }
    }

    resize()
    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
