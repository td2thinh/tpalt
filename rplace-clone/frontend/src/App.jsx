import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CanvasProvider } from './context/CanvasContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CanvasPage from './pages/CanvasPage';
import CreateCanvasPage from './pages/CreateCanvasPage';
import NotFoundPage from './pages/NotFoundPage';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CanvasProvider>
          <div className="app">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/canvas/:id" element={<CanvasPage />} />
                
                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/create" element={<CreateCanvasPage />} />
                </Route>
                
                {/* 404 route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <footer className="footer">
              <p>&copy; {new Date().getFullYear()} r/place Clone</p>
            </footer>
          </div>
        </CanvasProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
