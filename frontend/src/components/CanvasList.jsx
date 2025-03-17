import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const CanvasList = ({ onSelectCanvas }) => {
  const [canvases, setCanvases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchCanvases = async () => {
      try {
        setLoading(true);
        const token = getToken();
        const response = await fetch('/api/canvases', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch canvases');
        }
        
        const data = await response.json();
        setCanvases(data.canvases || []);
        setError('');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCanvases();
  }, [getToken]);

  const handleCanvasClick = (canvas) => {
    if (onSelectCanvas) {
      onSelectCanvas(canvas);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading canvases...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Error: {error}
      </div>
    );
  }

  if (canvases.length === 0) {
    return (
      <div className="bg-gray-100 p-6 rounded-lg text-center">
        <p className="text-gray-700">No canvases available.</p>
        <p className="text-gray-500 text-sm mt-2">Create a new canvas to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {canvases.map((canvas) => (
        <div
          key={canvas.id}
          className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => handleCanvasClick(canvas)}
        >
          <h3 className="text-lg font-bold mb-2">{canvas.name}</h3>
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>{canvas.width}×{canvas.height}</span>
            <span>{canvas.is_public ? 'Public' : 'Private'}</span>
          </div>
          {canvas.description && (
            <p className="text-gray-700 text-sm mb-3 line-clamp-2">{canvas.description}</p>
          )}
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Created by: {canvas.creator?.username || 'Unknown'}</span>
            <span>
              {new Date(canvas.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CanvasList;