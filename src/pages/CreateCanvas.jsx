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
    <div className="container mx-auto p-4 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Create New Canvas</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Canvas Name
          </label>
          <input 
            id="name"
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="My Awesome Canvas"
            required
          />
        </div>
        
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="width">
              Width (pixels)
            </label>
            <input 
              id="width"
              type="number" 
              value={width}
              onChange={(e) => setWidth(parseInt(e.target.value))}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              min="10"
              max="1000"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="height">
              Height (pixels)
            </label>
            <input 
              id="height"
              type="number" 
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value))}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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
              className="mr-2"
            />
            <span className="text-gray-700 text-sm">Make this canvas public</span>
          </label>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Canvas'}
          </button>
        </div>
      </form>
      
      <div className="mt-4 text-sm text-gray-600">
        <h3 className="font-bold">Tips:</h3>
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