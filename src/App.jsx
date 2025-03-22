import { useState, useEffect, createContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase/config'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Canvas from './pages/Canvas'
import CreateCanvas from './pages/CreateCanvas'
import Login from './pages/Login'
import './App.css'

// Create a theme context to share theme state
export const ThemeContext = createContext(null)

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState(() => {
    // Check if user has a saved preference
    const savedTheme = localStorage.getItem('theme')
    return savedTheme || 'dark'
  })

  // Effect to handle auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Effect to save theme preference
  useEffect(() => {
    localStorage.setItem('theme', theme)
    // Add or remove dark-mode class from root element
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-theme')
    } else {
      document.documentElement.classList.remove('dark-theme')
    }
  }, [theme])

  // Toggle theme function
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark')
  }

  if (loading) {
    return <div className="reddit-loading h-screen">Loading...</div>
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={`h-screen max-h-screen overflow-hidden ${theme === 'dark' ? 'dark-mode' : 'light-mode'}`}>
        <Navbar user={user} />
        <main className="h-[calc(100vh-56px)]">
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/canvas/:id" element={<Canvas user={user} />} />
            <Route 
              path="/create" 
              element={user ? <CreateCanvas user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/login" 
              element={!user ? <Login /> : <Navigate to="/" />} 
            />
          </Routes>
        </main>
      </div>
    </ThemeContext.Provider>
  )
}

export default App