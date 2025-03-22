import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase/config'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Canvas from './pages/Canvas'
import CreateCanvas from './pages/CreateCanvas'
import Login from './pages/Login'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar user={user} />
      <main className="container mx-auto px-4 py-8">
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
  )
}

export default App