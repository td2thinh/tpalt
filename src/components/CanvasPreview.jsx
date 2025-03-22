import { useEffect, useRef, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { rtdb } from '../firebase/config'

const CanvasPreview = ({ canvasId, size }) => {
  const canvasRef = useRef(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    const pixelSize = canvas.width / size[0]

    // Clear canvas
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add border
    ctx.strokeStyle = '#343536'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, canvas.width, canvas.height)

    // Listen for pixel data
    const pixelsRef = ref(rtdb, `canvases/${canvasId}/pixels`)
    
    const unsubscribe = onValue(pixelsRef, (snapshot) => {
      const pixelData = snapshot.val() || {}
      
      Object.entries(pixelData).forEach(([position, color]) => {
        const [x, y] = position.split(',').map(Number)
        
        // Draw the pixel
        ctx.fillStyle = color
        ctx.fillRect(
          x * pixelSize, 
          y * pixelSize, 
          pixelSize, 
          pixelSize
        )
      })
      
      setLoaded(true)
    })

    return () => unsubscribe()
  }, [canvasId, size])

  return (
    <div className="relative w-[100px] h-[100px]">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-reddit-highlight text-reddit-muted text-xs">
          Loading...
        </div>
      )}
      <canvas 
        ref={canvasRef} 
        width={100}
        height={100}
        className="canvas-preview"
      />
    </div>
  )
}

export default CanvasPreview