import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'
import { ThemeContext } from '../App'

const Navbar = ({ user }) => {
  const { theme, toggleTheme } = useContext(ThemeContext)

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
          <div className={`font-semibold hidden sm:block ${theme === 'dark' ? 'text-reddit-text' : 'text-reddit-darkgray'}`}>Clone</div>
        </Link>

        <div className="flex gap-3 items-center">
          {/* <Link to="/" className={`hover:${theme === 'dark' ? 'text-white' : 'text-reddit-blue'}`}>Home</Link> */}

          {/* Theme toggle button */}
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              </svg>
            )}
          </button>

          {user ? (
            <>
              <Link to="/create" className="bg-reddit-orange hover:bg-reddit-orangeHover text-white px-3 py-1 rounded"
              >Create Canvas</Link>
              <div className="flex items-center gap-2">
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full border border-reddit-border"
                />
                <span className={`hidden md:inline ${theme === 'dark' ? 'text-reddit-text' : 'text-reddit-darkgray'}`}>
                  {user.displayName}
                </span>
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