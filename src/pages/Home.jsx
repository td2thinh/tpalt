import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { ref, onValue } from 'firebase/database'
import { db, rtdb } from '../firebase/config'
import CanvasPreview from '../components/CanvasPreview'
import WelcomeExplainer from '../components/WelcomeExplainer'
import { ThemeContext } from '../App'

const Home = ({ user }) => {
  const { theme } = useContext(ThemeContext)
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
    return <div className="reddit-loading h-screen">Loading canvases...</div>
  }

  return (
    <div className={`container mx-auto p-4 ${theme === 'dark' ? 'dark-mode' : 'light-mode'} min-h-screen`}>
      {!user ? (
        /* Show only welcome explainer for non-logged in users */
        <div className="flex flex-col items-center">
          <WelcomeExplainer />
          <div className="mt-4 text-center">
            <p className={theme === 'dark' ? 'text-reddit-text' : 'text-reddit-darkgray'}>
              <Link to="/login" className="reddit-btn inline-block">
                Sign in to get started
              </Link>
            </p>
          </div>
        </div>
      ) : (
        /* Show available canvases for logged in users */
        <>
          <h1 className="text-2xl font-bold mb-6 reddit-title">Available Canvases</h1>

          <Link
            to="/create"
            className="reddit-btn mb-6 inline-block"
          >
            Create New Canvas
          </Link>

          {canvases.length === 0 ? (
            <div className={`text-center mt-8 ${theme === 'dark' ? 'text-reddit-text' : 'text-reddit-darkgray'}`}>
              <p>No canvases available yet.</p>
              <p className="mt-2">
                Click on "Create New Canvas" to be the first one!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {canvases.map((canvas) => (
                <Link to={`/canvas/${canvas.id}`} key={canvas.id}>
                  <div className="canvas-card">
                    <h2 className="text-lg font-bold mb-2 reddit-title">{canvas.name}</h2>
                    <p className="text-sm text-reddit-muted mb-2">
                      {canvas.size[0]} × {canvas.size[1]}
                    </p>
                    <CanvasPreview canvasId={canvas.id} size={canvas.size} />
                    <div className="mt-2 flex justify-between items-center">
                      {/* <span className={`px-2 py-1 rounded text-xs ${canvas.public ? 'bg-reddit-blue/20 text-reddit-blue' : 'bg-reddit-orange/20 text-reddit-orange'
                        }`}>
                        {canvas.public ? 'Public' : 'Private'}
                      </span> */}
                      <span className="text-xs text-reddit-muted">
                        Created {canvas.createdAt?.toDate ? new Date(canvas.createdAt.toDate()).toLocaleDateString() : 'Recently'}
                        {canvas.creatorName && ` by ${canvas.creatorName}`}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Home