import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useCanvas } from '../context/CanvasContext';
import apiService from '../services/apiService';

const CanvasList = ({ onCanvasSelect }) => {
  const { canvases, loadCanvases, loading, error } = useCanvas();
  const [snapshots, setSnapshots] = useState({});
  
  useEffect(() => {
    loadCanvases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    // Load snapshots for each canvas
    const fetchSnapshots = async () => {
      const snapshotData = {};
      
      for (const canvas of canvases) {
        // Skip canvases without a valid UUID
        if (!canvas.uuid || canvas.uuid === 'undefined') {
          continue;
        }
        
        try {
          const snapshot = await apiService.getCanvasSnapshot(canvas.uuid);
          if (snapshot) {
            snapshotData[canvas.uuid] = apiService.getSnapshotUrl(snapshot.snapshotID);
          }
        } catch {
          // Silently handle the error - it's expected for new canvases
          console.log(`No snapshot available for canvas ${canvas.uuid}`);
        }
      }
      
      setSnapshots(snapshotData);
    };
    
    if (canvases.length > 0) {
      fetchSnapshots();
    }
  }, [canvases]);
  
  const handleCanvasClick = (canvas) => {
    if (onCanvasSelect) {
      onCanvasSelect(canvas);
    }
  };
  
  if (loading) {
    return <div className="loading">Loading canvases...</div>;
  }
  
  if (error) {
    return <div className="error">Error: {error}</div>;
  }
  
  if (!canvases || canvases.length === 0) {
    return <div className="no-canvases">No canvases available</div>;
  }
  
  return (
    <div className="canvases-list">
      <h2>Available Canvases</h2>
      
      <div className="canvas-grid">
        {canvases.map((canvas) => (
          <div key={canvas.uuid} className="canvas-card">
            <Link 
              to={`/canvas/${canvas.uuid}`}
              onClick={() => handleCanvasClick(canvas)}
              className="canvas-link"
            >
              <div className="canvas-preview">
                {snapshots[canvas.uuid] ? (
                  <img 
                    src={snapshots[canvas.uuid]} 
                    alt={`Preview of ${canvas.name}`}
                    className="canvas-snapshot"
                  />
                ) : (
                  <div className="canvas-placeholder">
                    No preview available
                  </div>
                )}
              </div>
              
              <div className="canvas-info">
                <h3>{canvas.name}</h3>
                <p className="canvas-description">{canvas.description}</p>
                <div className="canvas-meta">
                  <span className="canvas-size">{canvas.size}x{canvas.size}</span>
                  <span className="canvas-users">
                    <i className="user-icon"></i> {canvas.activeUsers} active
                  </span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

CanvasList.propTypes = {
  onCanvasSelect: PropTypes.func,
};

export default CanvasList;