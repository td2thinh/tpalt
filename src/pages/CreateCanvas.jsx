import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, set } from 'firebase/database'
import { db, rtdb } from '../firebase/config'

const CreateCanvas = ({ user }) => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [width, setWidth] = useState(100)
  const [height, setHeight] = useState(100)
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user) {
      navigate('/login')
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      // Validate inputs
      if (name.trim() === '') {
        throw new Error('Canvas name is required')
      }
      
      if (width < 10 || width > 1000) {
        throw new Error('Width must be between 10 and 1000')
      }
      
      if (height < 10 || height > 1000) {
        throw new Error('Height must be between 10 and 1000')
      }
      
      // Create canvas document in Firestore
      const canvasDoc = await addDoc(collection(db, 'canvases'), {
        name: name.trim(),
        size: [width, height],
        public: isPublic,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      })
      
      // Create initial empty canvas in Realtime Database
      await set(ref(rtdb, `canvases/${canvasDoc.id}`), {
        pixels: {},
        updatedAt: serverTimestamp()
      })
      
      // Redirect to the new canvas
      navigate(`/canvas/${canvasDoc.id}`)
      
    } catch (err) {
      console.error('Error creating canvas:', err)
      setError(err.message || 'Failed to create canvas')
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-lg dark-mode min-h-screen">
      <h1 className="text-2xl font-bold mb-6 reddit-title">Create New Canvas</h1>
      
      {error && (
        <div className="bg-reddit-red/20 border border-reddit-red text-reddit-red px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="reddit-card px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-reddit-text text-sm font-bold mb-2" htmlFor="name">
            Canvas Name
          </label>
          <input 
            id="name"
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="reddit-input w-full"
            placeholder="My Awesome Canvas"
            required
          />
        </div>
        
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-reddit-text text-sm font-bold mb-2" htmlFor="width">
              Width (pixels)
            </label>
            <input 
              id="width"
              type="number" 
              value={width}
              onChange={(e) => setWidth(parseInt(e.target.value))}
              className="reddit-input w-full"
              min="10"
              max="1000"
              required
            />
          </div>
          
          <div>
            <label className="block text-reddit-text text-sm font-bold mb-2" htmlFor="height">
              Height (pixels)
            </label>
            <input 
              id="height"
              type="number" 
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value))}
              className="reddit-input w-full"
              min="10"
              max="1000"
              required
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label className="flex items-center">
            <input 
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="mr-2 accent-reddit-orange"
            />
            <span className="text-reddit-text text-sm">Make this canvas public</span>
          </label>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="reddit-btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="reddit-btn disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Canvas'}
          </button>
        </div>
      </form>
      
      <div className="mt-4 text-sm text-reddit-muted">
        <h3 className="font-bold text-reddit-text">Tips:</h3>
        <ul className="list-disc list-inside mt-2">
          <li>Smaller canvases (e.g., 100×100) are easier to fill with active users</li>
          <li>Public canvases can be edited by any signed-in user</li>
          <li>Private canvases can only be edited by you</li>
        </ul>
      </div>
    </div>
  )
}

export default CreateCanvas