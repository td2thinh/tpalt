import { Link } from 'react-router-dom';
import CanvasList from '../components/CanvasList';
import { useAuth } from '../context/AuthContext';
import { useCanvas } from '../context/CanvasContext';

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const { canvases, loading, error } = useCanvas();
  
  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Welcome to r/place Clone</h1>
          <p>
            A collaborative pixel canvas where you can place pixels and create art together with others in real-time.
          </p>
          
          {isAuthenticated() ? (
            <Link to="/create" className="cta-button">
              Create New Canvas
            </Link>
          ) : (
            <div className="auth-cta">
              <Link to="/login" className="cta-button login">
                Login
              </Link>
              <Link to="/register" className="cta-button register">
                Register
              </Link>
              <p className="auth-note">
                Login or register to create your own canvas
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="canvases-section">
        <div className="section-header">
          <h2>Explore Canvases</h2>
          <p>
            Join existing canvases and start placing pixels right away.
            {!isAuthenticated() && ' You can browse and view canvases without an account.'}
          </p>
        </div>
        
        <CanvasList />
        
        {canvases && canvases.length === 0 && !loading && !error && (
          <div className="no-canvases-message">
            <p>No canvases available yet. Be the first to create one!</p>
            {isAuthenticated() ? (
              <Link to="/create" className="cta-button">
                Create Canvas
              </Link>
            ) : (
              <Link to="/login" className="cta-button">
                Login to Create
              </Link>
            )}
          </div>
        )}
      </div>
      
      <div className="how-it-works-section">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Choose a Canvas</h3>
            <p>Browse available canvases or create your own.</p>
          </div>
          
          <div className="step">
            <div className="step-number">2</div>
            <h3>Select a Color</h3>
            <p>Pick from the color palette or use a custom color.</p>
          </div>
          
          <div className="step">
            <div className="step-number">3</div>
            <h3>Place Pixels</h3>
            <p>Click on the canvas to place pixels and create art.</p>
          </div>
          
          <div className="step">
            <div className="step-number">4</div>
            <h3>Collaborate</h3>
            <p>Work with others in real-time to create amazing artwork.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;