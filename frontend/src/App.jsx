import { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import Home from './components/Home';
import { AuthProvider, useAuth } from './context/AuthContext';

// Main App content that uses the auth context
const AppContent = () => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading (e.g., checking token validity)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (userData) => {
    // This function is passed to the Login component
    // The actual login logic is handled in the Login component
    console.log('User logged in:', userData);
    // Navigate to the home page
  
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-2xl font-bold text-gray-700">Loading...</div>
      </div>
    );
  }

  return currentUser ? <Home /> : <Login onLogin={handleLogin} />;
};

// Wrapper component that provides the auth context
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
