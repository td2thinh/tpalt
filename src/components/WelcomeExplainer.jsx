import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { ThemeContext } from '../App'

const WelcomeExplainer = () => {
  const { theme } = useContext(ThemeContext)
  
  return (
    <div className={`${theme === 'dark' ? 'bg-reddit-highlight' : 'bg-white'} p-8 rounded-lg shadow-md mb-8 max-w-3xl mx-auto`}>
      <h1 className="text-3xl font-bold mb-4 text-reddit-orange text-center">Welcome to r/Place Clone</h1>
      
      <div className="space-y-6">
        <p className="text-center text-lg">
          A collaborative pixel art platform inspired by Reddit's r/Place experiment.
          Create and join custom canvases to build artwork together with others in real-time.
        </p>
        
        {/* Feature showcase section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className={`${theme === 'dark' ? 'bg-reddit-darkgray' : 'bg-gray-50'} p-5 rounded-lg shadow-sm`}>
            <div className="flex items-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-reddit-orange mr-2">
                <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
              </svg>
              <div className="text-reddit-orange text-lg font-bold">Create</div>
            </div>
            <p className="text-sm">
              Sign in to create your own canvas with customizable dimensions. Make it public or private.
            </p>
          </div>
          
          <div className={`${theme === 'dark' ? 'bg-reddit-darkgray' : 'bg-gray-50'} p-5 rounded-lg shadow-sm`}>
            <div className="flex items-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-reddit-blue mr-2">
                <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM15.75 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2.25 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM6.31 15.117A6.745 6.745 0 0 1 12 12a6.745 6.745 0 0 1 6.709 7.498.75.75 0 0 1-.372.568A12.696 12.696 0 0 1 12 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 0 1-.372-.568 6.787 6.787 0 0 1 1.019-4.38Z" clipRule="evenodd" />
                <path d="M5.082 14.254a8.287 8.287 0 0 0-1.308 5.135 9.687 9.687 0 0 1-1.764-.44l-.115-.04a.563.563 0 0 1-.373-.487l-.01-.121a3.75 3.75 0 0 1 3.57-4.047ZM20.226 19.389a8.287 8.287 0 0 0-1.308-5.135 3.75 3.75 0 0 1 3.57 4.047l-.01.121a.563.563 0 0 1-.373.486l-.115.04c-.567.2-1.156.349-1.764.441Z" />
              </svg>
              <div className="text-reddit-blue text-lg font-bold">Collaborate</div>
            </div>
            <p className="text-sm">
              Place pixels one at a time with a short cooldown. Watch as others contribute in real-time.
            </p>
          </div>
          
          <div className={`${theme === 'dark' ? 'bg-reddit-darkgray' : 'bg-gray-50'} p-5 rounded-lg shadow-sm`}>
            <div className="flex items-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-reddit-orange mr-2">
                <path fillRule="evenodd" d="M15.75 4.5a3 3 0 1 1 .825 2.066l-8.421 4.679a3.002 3.002 0 0 1 0 1.51l8.421 4.679a3 3 0 1 1-.729 1.31l-8.421-4.678a3 3 0 1 1 0-4.132l8.421-4.679a3 3 0 0 1-.096-.755Z" clipRule="evenodd" />
              </svg>
              <div className="text-reddit-orange text-lg font-bold">Share</div>
            </div>
            <p className="text-sm">
              Public canvases are visible to everyone. Invite friends to collaborate on your artwork.
            </p>
          </div>
        </div>
        
        {/* How it works section */}
        <div className={`mt-8 p-5 rounded-lg ${theme === 'dark' ? 'bg-reddit-darkgray/50' : 'bg-gray-50'}`}>
          <h2 className="text-xl font-bold mb-3">How It Works</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Sign in with your Google account</li>
            <li>Browse existing canvases or create your own</li>
            <li>Select a color from the palette</li>
            <li>Click anywhere on the canvas to place a pixel</li>
            <li>Wait for the cooldown to expire before placing another pixel</li>
            <li>Watch as your collaborative artwork evolves in real-time</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default WelcomeExplainer