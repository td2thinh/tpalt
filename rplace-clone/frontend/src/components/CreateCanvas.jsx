import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCanvas } from '../context/CanvasContext';

const CreateCanvas = () => {
  const { createCanvas, error } = useCanvas();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [size, setSize] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!name.trim()) {
      setFormError('Canvas name is required');
      return;
    }
    
    if (size < 10 || size > 1000) {
      setFormError('Canvas size must be between 10 and 1000');
      return;
    }
    
    setFormError('');
    setIsSubmitting(true);
    
    try {
      const canvas = await createCanvas(name, description, size);
      
      // Validate that the canvas has a valid UUID before navigating
      if (!canvas || !canvas.uuid || canvas.uuid === 'undefined') {
        setFormError('Invalid canvas data returned from server');
        setIsSubmitting(false);
        return;
      }
      
      // Navigate to the new canvas
      navigate(`/canvas/${canvas.uuid}`);
    } catch (err) {
      setFormError(err.message || 'Failed to create canvas');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="create-canvas">
      <h2>Create New Canvas</h2>
      
      {(formError || error) && (
        <div className="error-message">
          {formError || error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="canvas-name">Canvas Name</label>
          <input
            id="canvas-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter canvas name"
            required
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="canvas-description">Description (optional)</label>
          <textarea
            id="canvas-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter canvas description"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="canvas-size">Canvas Size (pixels)</label>
          <div className="size-input-group">
            <input
              id="canvas-size"
              type="range"
              min="10"
              max="1000"
              step="10"
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value, 10))}
              disabled={isSubmitting}
            />
            <span className="size-value">{size}x{size}</span>
          </div>
          <p className="size-note">
            Note: Larger canvases may be slower to load and render.
          </p>
        </div>
        
        <div className="canvas-preview-container">
          <h3>Preview</h3>
          <div 
            className="canvas-size-preview"
            style={{
              width: '100%',
              height: '200px',
              position: 'relative',
              border: '1px solid #ccc',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: `${Math.min(100, size / 5)}px`,
                height: `${Math.min(100, size / 5)}px`,
                backgroundColor: '#f0f0f0',
                border: '1px solid #999',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '10px',
                  whiteSpace: 'nowrap',
                }}
              >
                {size}x{size}
              </div>
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate('/')}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="create-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Canvas'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCanvas;