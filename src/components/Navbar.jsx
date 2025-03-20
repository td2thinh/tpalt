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
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">r/Place Clone</Link>
        
        <div className="flex gap-4 items-center">
          <Link to="/" className="hover:text-gray-300">Home</Link>
          
          {user ? (
            <>
              <Link to="/create" className="hover:text-gray-300">Create Canvas</Link>
              <div className="flex items-center gap-2">
                <img 
                  src={user.photoURL} 
                  alt={user.displayName} 
                  className="w-8 h-8 rounded-full"
                />
                <span className="hidden md:inline">{user.displayName}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
              >
                Logout
              </button>
            </>
          ) : (
            <Link 
              to="/login"
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
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