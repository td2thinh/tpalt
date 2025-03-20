import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { ref, onValue, update, serverTimestamp } from 'firebase/database'
import { db, rtdb } from '../firebase/config'

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
  const canvasRef = useRef(null)
  const [cooldown, setCooldown] = useState(0)
  const [lastPlaced, setLastPlaced] = useState(0)

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

  // Update canvas when pixels change
  useEffect(() => {
    if (!canvas || !canvasRef.current) return
    
    const ctx = canvasRef.current.getContext('2d')
    const [width, height] = canvas.size
    const pixelSize = Math.min(
      (canvasRef.current.width / width),
      (canvasRef.current.height / height)
    )
    
    // Clear canvas
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    
    // Draw pixels
    Object.entries(pixels).forEach(([position, color]) => {
      const [x, y] = position.split(',').map(Number)
      
      ctx.fillStyle = color
      ctx.fillRect(
        x * pixelSize, 
        y * pixelSize, 
        pixelSize, 
        pixelSize
      )
    })
  }, [canvas, pixels])

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return
    
    const timer = setTimeout(() => {
      setCooldown((prev) => Math.max(0, prev - 1))
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleCanvasClick = (e) => {
    if (!canvas || !user || cooldown > 0) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const [width, height] = canvas.size
    
    const pixelSize = Math.min(
      (canvasRef.current.width / width),
      (canvasRef.current.height / height)
    )
    
    const x = Math.floor((e.clientX - rect.left) / pixelSize)
    const y = Math.floor((e.clientY - rect.top) / pixelSize)
    
    // Check bounds
    if (x < 0 || x >= width || y < 0 || y >= height) return
    
    // Update pixel in Firebase
    const position = `${x},${y}`
    const pixelRef = ref(rtdb, `canvases/${id}/pixels/${position}`)
    
    update(ref(rtdb, `canvases/${id}`), {
      [`pixels/${position}`]: selectedColor,
      updatedAt: serverTimestamp()
    })
    
    // Set cooldown (5 seconds)
    setCooldown(5)
    setLastPlaced(Date.now())
  }
  
  if (loading) {
    return <div className="text-center mt-8">Loading canvas...</div>
  }
  
  if (error) {
    return (
      <div className="text-center mt-8">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          Back to Home
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{canvas.name}</h1>
      
      <div className="flex flex-col items-center mb-4">
        <p className="text-sm text-gray-600 mb-2">
          {canvas.size[0]} × {canvas.size[1]} pixels
        </p>
        
        {user ? (
          cooldown > 0 ? (
            <p className="mb-2 text-yellow-600">
              Cooldown: {cooldown}s before you can place another pixel
            </p>
          ) : (
            <p className="mb-2 text-green-600">
              You can place a pixel now!
            </p>
          )
        ) : (
          <p className="mb-2 text-gray-500">
            <a href="/login" className="text-blue-500 hover:underline">Login</a> to place pixels
          </p>
        )}
      </div>
      
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          width={Math.min(800, canvas.size[0])}
          height={Math.min(800, canvas.size[1])}
          onClick={handleCanvasClick}
          className="border border-gray-300 cursor-pointer"
        />
      </div>
      
      {user && (
        <div className="mt-4">
          <h3 className="font-bold mb-2">Select a color:</h3>
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
      
      <div className="mt-4 text-sm text-gray-500">
        <p>Click on the canvas to place a pixel of the selected color.</p>
        <p>You can place one pixel every 5 seconds.</p>
      </div>
    </div>
  )
}

export default Canvas