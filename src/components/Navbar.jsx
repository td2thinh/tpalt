import { Link } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'

const Navbar = ({ user }) => {
  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <nav className="reddit-navbar">
      <div className="container mx-auto flex justify-between items-center px-2">
        <Link to="/" className="flex items-center gap-2">
          <div className="text-reddit-orange font-bold text-2xl">r/Place</div>
          <div className="text-reddit-text font-semibold hidden sm:block">Clone</div>
        </Link>
        
        <div className="flex gap-3 items-center">
          <Link to="/" className="hover:text-white">Home</Link>
          
          {user ? (
            <>
              <Link to="/create" className="reddit-btn-secondary hidden sm:block">Create Canvas</Link>
              <div className="flex items-center gap-2">
                <img 
                  src={user.photoURL} 
                  alt={user.displayName} 
                  className="w-8 h-8 rounded-full border border-reddit-border"
                />
                <span className="hidden md:inline text-reddit-text">{user.displayName}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="bg-reddit-orange hover:bg-reddit-orangeHover text-white px-3 py-1 rounded"
              >
                Logout
              </button>
            </>
          ) : (
            <Link 
              to="/login"
              className="bg-reddit-orange hover:bg-reddit-orangeHover text-white px-3 py-1 rounded"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar