import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Canvas from '../components/Canvas';
import { useCanvas } from '../context/CanvasContext';
import { useAuth } from '../context/AuthContext';

const CanvasPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { 
    currentCanvas, 
    loading, 
    error, 
    loadCanvas, 
    leaveCanvas,
    activeUsers
  } = useCanvas();
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  
  useEffect(() => {
    const fetchCanvas = async () => {
      setIsLoading(true);
      setLoadError(null);
      
      // Check if ID is valid
      if (!id || id === 'undefined') {
        setLoadError('Invalid canvas ID');
        setIsLoading(false);
        return;
      }
      
      try {
        await loadCanvas(id);
        setIsLoading(false);
      } catch (err) {
        setLoadError(err.message || 'Failed to load canvas');
        setIsLoading(false);
      }
    };
    
    fetchCanvas();
    
    // Cleanup when unmounting
    return () => {
      leaveCanvas();
    };
  }, [id, loadCanvas, leaveCanvas]);
  
  if (isLoading || loading) {
    return (
      <div className="canvas-page loading">
        <div className="loading-spinner"></div>
        <p>Loading canvas...</p>
      </div>
    );
  }
  
  if (loadError || error) {
    return (
      <div className="canvas-page error">
        <h2>Error</h2>
        <p>{loadError || error}</p>
        <button 
          className="back-btn"
          onClick={() => navigate('/')}
        >
          Back to Home
        </button>
      </div>
    );
  }
  
  if (!currentCanvas) {
    return (
      <div className="canvas-page not-found">
        <h2>Canvas Not Found</h2>
        <p>The canvas you're looking for doesn't exist or has been removed.</p>
        <button 
          className="back-btn"
          onClick={() => navigate('/')}
        >
          Back to Home
        </button>
      </div>
    );
  }
  
  return (
    <div className="canvas-page">
      <div className="canvas-header">
        <div className="canvas-info">
          <h1>{currentCanvas.name}</h1>
          {currentCanvas.description && (
            <p className="canvas-description">{currentCanvas.description}</p>
          )}
          <div className="canvas-meta">
            <span className="canvas-size">
              {currentCanvas.size}x{currentCanvas.size} pixels
            </span>
            <span className="active-users">
              <i className="user-icon"></i> {activeUsers} active users
            </span>
          </div>
        </div>
        
        <div className="canvas-actions">
          <button 
            className="back-btn"
            onClick={() => navigate('/')}
          >
            Back to Home
          </button>
        </div>
      </div>
      
      {!isAuthenticated() && (
        <div className="auth-notice">
          <p>
            You are viewing this canvas as a guest. 
            <a href="/login" className="login-link">Login</a> or 
            <a href="/register" className="register-link">Register</a> 
            to place pixels.
          </p>
        </div>
      )}
      
      <div className="canvas-container">
        <Canvas />
      </div>
    </div>
  );
};

export default CanvasPage;