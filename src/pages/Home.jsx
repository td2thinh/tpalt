import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { ref, onValue } from 'firebase/database'
import { db, rtdb } from '../firebase/config'
import CanvasPreview from '../components/CanvasPreview'

const Home = ({ user }) => {
  const [canvases, setCanvases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCanvases = async () => {
      try {
        // Query for public canvases
        const publicCanvasesQuery = query(
          collection(db, 'canvases'),
          where('public', '==', true)
        )
        
        const querySnapshot = await getDocs(publicCanvasesQuery)
        const canvasList = []
        
        querySnapshot.forEach((doc) => {
          canvasList.push({
            id: doc.id,
            ...doc.data(),
          })
        })
        
        // If user is logged in, also get their private canvases
        if (user) {
          const userCanvasesQuery = query(
            collection(db, 'canvases'),
            where('createdBy', '==', user.uid),
            where('public', '==', false)
          )
          
          const userSnapshot = await getDocs(userCanvasesQuery)
          
          userSnapshot.forEach((doc) => {
            canvasList.push({
              id: doc.id,
              ...doc.data(),
            })
          })
        }
        
        setCanvases(canvasList)
      } catch (error) {
        console.error('Error fetching canvases:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCanvases()
  }, [user])

  if (loading) {
    return <div className="text-center mt-8">Loading canvases...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Available Canvases</h1>
      
      {user && (
        <Link
          to="/create"
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mb-6 inline-block"
        >
          Create New Canvas
        </Link>
      )}
      
      {canvases.length === 0 ? (
        <div className="text-center mt-8">
          <p>No canvases available.</p>
          {!user && (
            <p className="mt-2">
              <Link to="/login" className="text-blue-500 hover:underline">
                Login
              </Link> to create your own canvas!
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {canvases.map((canvas) => (
            <Link to={`/canvas/${canvas.id}`} key={canvas.id}>
              <div className="canvas-card">
                <h2 className="text-lg font-bold mb-2">{canvas.name}</h2>
                <p className="text-sm text-gray-600 mb-2">
                  {canvas.size[0]} × {canvas.size[1]}
                </p>
                <CanvasPreview canvasId={canvas.id} size={canvas.size} />
                <div className="mt-2 flex justify-between items-center">
                  <span className={`px-2 py-1 rounded text-xs ${
                    canvas.public ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                  }`}>
                    {canvas.public ? 'Public' : 'Private'}
                  </span>
                  <span className="text-xs text-gray-500">
                    Created {new Date(canvas.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default Home