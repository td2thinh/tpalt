import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { ref, onValue, update, serverTimestamp } from 'firebase/database'
import { db, rtdb } from '../firebase/config'
import { Stage, Layer, Rect } from 'react-konva'

// Array of common colors for pixel art
const COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#008000', '#800000', '#008080', '#808000', '#FFC0CB',
  '#A52A2A', '#808080', '#C0C0C0', '#ADD8E6', '#98FB98'
]

const Canvas = ({ user }) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [canvas, setCanvas] = useState(null)
  const [pixels, setPixels] = useState({})
  const [selectedColor, setSelectedColor] = useState('#000000')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cooldown, setCooldown] = useState(0)
  const [lastPlaced, setLastPlaced] = useState(0)

  // State for zoom and pan
  const [scale, setScale] = useState(4) // Default zoom level
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const stageRef = useRef(null)
  const containerRef = useRef(null)
  const [isPinching, setIsPinching] = useState(false)
  const [lastDistance, setLastDistance] = useState(0)
  const [isDrawMode, setIsDrawMode] = useState(true)
  const [cursorPos, setCursorPos] = useState({ x: -1, y: -1 })
  const initializedRef = useRef(false)

  useEffect(() => {
    const fetchCanvas = async () => {
      try {
        // Get canvas metadata from Firestore
        const canvasDoc = await getDoc(doc(db, 'canvases', id))

        if (!canvasDoc.exists()) {
          setError('Canvas not found')
          return
        }

        const canvasData = { id: canvasDoc.id, ...canvasDoc.data() }
        setCanvas(canvasData)

        // Check if this is a private canvas and if user has access
        if (!canvasData.public && (!user || user.uid !== canvasData.createdBy)) {
          setError('You do not have permission to view this canvas')
          return
        }

        // Get pixel data from Realtime Database
        const pixelsRef = ref(rtdb, `canvases/${id}/pixels`)

        onValue(pixelsRef, (snapshot) => {
          const pixelData = snapshot.val() || {}
          setPixels(pixelData)
          setLoading(false)
        })

      } catch (err) {
        console.error('Error fetching canvas:', err)
        setError('Failed to load canvas')
        setLoading(false)
      }
    }

    fetchCanvas()
  }, [id, user])

  // Initialize stage position when canvas loads - only on first load
  useEffect(() => {
    if (!canvas || !containerRef.current) return

    // Only center the canvas if we haven't centered it before
    // This prevents the view from jumping when zoom changes
    if (!initializedRef.current) {
      const containerWidth = containerRef.current.offsetWidth
      const containerHeight = containerRef.current.offsetHeight
      const [canvasWidth, canvasHeight] = canvas.size

      // Calculate the center position
      setPosition({
        x: (containerWidth / 2) - (canvasWidth * scale / 2),
        y: (containerHeight / 2) - (canvasHeight * scale / 2)
      })

      // Mark as initialized so we don't re-center on scale changes
      initializedRef.current = true
    }
  }, [canvas, containerRef.current])

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return

    const timer = setTimeout(() => {
      setCooldown((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearTimeout(timer)
  }, [cooldown])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (stageRef.current && containerRef.current) {
        stageRef.current.width(containerRef.current.offsetWidth)
        stageRef.current.height(containerRef.current.offsetHeight)

        // Don't recenter on resize as it would disrupt user navigation
        // Instead, maintain relative position by not changing position
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [canvas])

  const handleZoomIn = () => {
    const scaleBy = 1.5
    const stage = stageRef.current

    if (!stage) return

    // Use center of the viewport as the focal point
    const center = {
      x: stage.width() / 2,
      y: stage.height() / 2
    }

    const mousePointTo = {
      x: (center.x - position.x) / scale,
      y: (center.y - position.y) / scale
    }

    const newScale = Math.min(scale * scaleBy, 40)

    // Calculate new position to zoom toward center of viewport
    const newPos = {
      x: center.x - mousePointTo.x * newScale,
      y: center.y - mousePointTo.y * newScale
    }

    setScale(newScale)
    setPosition(newPos)
  }

  const handleZoomOut = () => {
    const scaleBy = 1.5
    const stage = stageRef.current

    if (!stage) return

    // Use center of the viewport as the focal point
    const center = {
      x: stage.width() / 2,
      y: stage.height() / 2
    }

    const mousePointTo = {
      x: (center.x - position.x) / scale,
      y: (center.y - position.y) / scale
    }

    const newScale = Math.max(scale / scaleBy, 1)

    // Calculate new position to zoom toward center of viewport
    const newPos = {
      x: center.x - mousePointTo.x * newScale,
      y: center.y - mousePointTo.y * newScale
    }

    setScale(newScale)
    setPosition(newPos)
  }

  const handleResetZoom = () => {
    setScale(4)
    if (canvas && containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth
      const containerHeight = containerRef.current.offsetHeight
      const [canvasWidth, canvasHeight] = canvas.size

      setPosition({
        x: (containerWidth / 2) - (canvasWidth * 4 / 2),
        y: (containerHeight / 2) - (canvasHeight * 4 / 2)
      })
    }
  }

  const handleWheel = (e) => {
    e.evt.preventDefault()

    const scaleBy = 1.1
    const stage = stageRef.current
    const pointer = stage.getPointerPosition()

    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - stage.x()) / stage.scaleX(),
      y: (pointer.y - stage.y()) / stage.scaleY()
    }

    // Zoom direction
    const direction = e.evt.deltaY < 0 ? 1 : -1

    const newScale = direction > 0
      ? Math.min(scale * scaleBy, 40)
      : Math.max(scale / scaleBy, 1)

    setScale(newScale)

    // Calculate new position
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale
    }

    setPosition(newPos)
  }

  const handleDragEnd = (e) => {
    setPosition({
      x: e.target.x(),
      y: e.target.y()
    })
  }

  const toggleDrawMode = () => {
    setIsDrawMode(prev => !prev)
  }

  // Track cursor position for pixel coordinates display
  const handleMouseMove = (e) => {
    if (!canvas || !stageRef.current) return

    const stage = stageRef.current
    const point = stage.getPointerPosition()

    if (!point) return

    // Convert from screen coordinates to canvas coordinates
    const x = Math.floor((point.x - stage.x()) / scale)
    const y = Math.floor((point.y - stage.y()) / scale)

    // Check bounds
    if (x >= 0 && x < canvas.size[0] && y >= 0 && y < canvas.size[1]) {
      setCursorPos({ x, y })
    } else {
      setCursorPos({ x: -1, y: -1 })
    }
  }

  // Touch events for pinch zoom
  const handleTouchMove = (e) => {
    const evt = e.evt

    // Detect pinch gesture
    if (evt.touches.length === 2) {
      evt.preventDefault()
      setIsPinching(true)

      const touch1 = evt.touches[0]
      const touch2 = evt.touches[1]

      const distance = Math.sqrt(
        Math.pow(touch1.clientX - touch2.clientX, 2) +
        Math.pow(touch1.clientY - touch2.clientY, 2)
      )

      if (lastDistance === 0) {
        setLastDistance(distance)
        return
      }

      const stage = stageRef.current

      // Calculate center point of the two touches
      const center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      }

      const stagePoint = {
        x: center.x - stage.container().offsetLeft,
        y: center.y - stage.container().offsetTop
      }

      const mousePointTo = {
        x: (stagePoint.x - stage.x()) / stage.scaleX(),
        y: (stagePoint.y - stage.y()) / stage.scaleY()
      }

      // Determine scale direction
      const scaleBy = 1.01
      const newScale = distance > lastDistance
        ? Math.min(scale * scaleBy, 40)
        : Math.max(scale / scaleBy, 1)

      setScale(newScale)

      // Calculate new position
      const newPos = {
        x: stagePoint.x - mousePointTo.x * newScale,
        y: stagePoint.y - mousePointTo.y * newScale
      }

      setPosition(newPos)
      setLastDistance(distance)
    }
  }

  const handleTouchEnd = () => {
    setIsPinching(false)
    setLastDistance(0)
  }

  const handleCanvasClick = (e) => {
    if (!canvas || !user || cooldown > 0 || !isDrawMode) return

    const stage = stageRef.current
    const point = stage.getPointerPosition()

    if (!point) return

    // Convert from screen coordinates to canvas coordinates
    const x = Math.floor((point.x - stage.x()) / scale)
    const y = Math.floor((point.y - stage.y()) / scale)

    // Check bounds
    if (x < 0 || x >= canvas.size[0] || y < 0 || y >= canvas.size[1]) return

    // Update pixel in Firebase
    const position = `${x},${y}`

    update(ref(rtdb, `canvases/${id}`), {
      [`pixels/${position}`]: selectedColor,
      updatedAt: serverTimestamp()
    })

    // Set cooldown (5 seconds)
    setCooldown(5)
    setLastPlaced(Date.now())
  }

  if (loading) {
    return <div className="reddit-loading h-screen">Loading canvas...</div>
  }

  if (error) {
    return (
      <div className="reddit-loading h-screen flex flex-col">
        <p className="reddit-error mb-3">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="reddit-btn"
        >
          Back to Home
        </button>
      </div>
    )
  }

  return (
    <div className="canvas-page dark-mode">
      <div
        ref={containerRef}
        className={`canvas-area ${isDrawMode ? 'draw-cursor' : 'move-cursor'}`}
        style={{ touchAction: 'none' }}
      >
        {/* Centered Canvas Info */}
        <div className="reddit-canvas-info absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-reddit-bg bg-opacity-80 p-2 rounded shadow-md">
          <div className="flex items-center justify-between mb-1">
            <h1 className="reddit-title text-xl">{canvas.name}</h1>

            {/* Info icon */}
            <div className="info-icon bg-reddit-blue text-white rounded-full w-6 h-6 flex items-center justify-center cursor-help relative group ml-2">
              <span className="text-sm font-bold">i</span>
              <div className="reddit-tooltip hidden group-hover:block absolute right-0 mt-2 top-full bg-reddit-bg bg-opacity-90 p-2 rounded shadow-lg w-64 z-20">
                <p>Click to place a pixel</p>
                <p>Use the mode button to toggle between draw/move</p>
                <p>Pinch or scroll to zoom</p>
              </div>
            </div>
          </div>

          <div className="reddit-canvas-data text-center">
            <p>
              {canvas.size[0]} × {canvas.size[1]} pixels
            </p>

            {user ? (
              cooldown > 0 ? (
                <p className="reddit-cooldown">
                  Cooldown: {cooldown}s before you can place another pixel
                </p>
              ) : (
                <p className="reddit-ready">
                  You can place a pixel now!
                </p>
              )
            ) : (
              <p className="text-reddit-muted">
                <Link to="/login" className="text-reddit-blue hover:underline">Login</Link> to place pixels
              </p>
            )}
          </div>
        </div>
        <Stage
          ref={stageRef}
          width={containerRef.current?.offsetWidth || window.innerWidth}
          height={containerRef.current?.offsetHeight || window.innerHeight - 90}
          onWheel={handleWheel}
          onTap={handleCanvasClick}
          onClick={handleCanvasClick}
          draggable={!isDrawMode || !user}
          onDragEnd={handleDragEnd}
          x={position.x}
          y={position.y}
          scale={{ x: scale, y: scale }}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseMove={handleMouseMove}
        >
          <Layer>
            {/* Canvas background */}
            <Rect
              x={0}
              y={0}
              width={canvas.size[0]}
              height={canvas.size[1]}
              fill="#FFFFFF"
              stroke="#343536"
              strokeWidth={0.5 / scale}
            />

            {/* Grid lines for better visibility at higher zoom levels */}
            {scale > 8 && Array.from({ length: canvas.size[0] + 1 }).map((_, i) => (
              <Rect
                key={`vl-${i}`}
                x={i}
                y={0}
                width={0.02}
                height={canvas.size[1]}
                fill="#2a2a2b"
              />
            ))}

            {scale > 8 && Array.from({ length: canvas.size[1] + 1 }).map((_, i) => (
              <Rect
                key={`hl-${i}`}
                x={0}
                y={i}
                width={canvas.size[0]}
                height={0.02}
                fill="#2a2a2b"
              />
            ))}

            {/* Draw pixels */}
            {Object.entries(pixels).map(([position, color]) => {
              const [x, y] = position.split(',').map(Number)
              return (
                <Rect
                  key={position}
                  x={x}
                  y={y}
                  width={1}
                  height={1}
                  fill={color}
                />
              )
            })}
          </Layer>
        </Stage>
      </div>

      {/* Pixel coordinates display */}
      {cursorPos.x >= 0 && (
        <div className="pixel-info">
          <p>X: {cursorPos.x}, Y: {cursorPos.y}</p>
          <p>Zoom: {Math.round(scale * 100) / 100}x</p>
          <p>{isDrawMode ? "Draw Mode" : "Move Mode"}</p>
        </div>
      )}

      {/* Floating controls */}
      <div className="controls-container">
        {user && (
          <div className="mb-3">
            <h3 className="font-bold mb-2 text-center text-reddit-text">Select a color:</h3>
            <div className="color-picker">
              {COLORS.map((color) => (
                <div
                  key={color}
                  className={`color-option ${color === selectedColor ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="zoom-controls">
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              −
            </button>
            <button
              onClick={handleResetZoom}
              title="Reset Zoom"
              aria-label="Reset Zoom"
            >
              ⟲
            </button>
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              aria-label="Zoom In"
            >
              +
            </button>
          </div>

          {user && (
            <button
              onClick={toggleDrawMode}
              className={`mode-button ${isDrawMode
                ? 'bg-reddit-orange hover:bg-reddit-orangeHover text-white'
                : 'bg-reddit-blue hover:bg-reddit-blueHover text-white'
                }`}
              title={isDrawMode ? "Switch to Move Mode" : "Switch to Draw Mode"}
            >
              {isDrawMode ? "Draw Mode" : "Move Mode"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Canvas