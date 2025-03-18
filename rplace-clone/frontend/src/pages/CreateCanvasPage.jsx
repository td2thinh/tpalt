import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateCanvas from '../components/CreateCanvas';
import { useAuth } from '../context/AuthContext';

const CreateCanvasPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  if (!isAuthenticated()) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="create-canvas-page">
      <div className="page-header">
        <h1>Create New Canvas</h1>
        <p>
          Create a new canvas for the community to collaborate on.
          Set the size, name, and description for your canvas.
        </p>
      </div>
      
      <div className="create-canvas-container">
        <CreateCanvas />
      </div>
    </div>
  );
};

export default CreateCanvasPage;