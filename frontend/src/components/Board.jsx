import { useState, useEffect, useRef } from 'react';
import { ref, onValue, set, get, remove } from 'firebase/database';
import realtime from '../config/firebase';
import { useAuth } from '../context/AuthContext';

const Board = ({ canvasId, width, height, isEditable = true }) => {
  const [pixels, setPixels] = useState({});
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);
  const { getToken, currentUser } = useAuth();

  const pixelSize = 10; // Size of each pixel in pixels
  
  // Available colors
  const colors = [
    '#000000', // Black
    '#FFFFFF', // White
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500', // Orange
    '#800080', // Purple
    '#A52A2A', // Brown
    '#808080', // Gray
  ];

  // Fetch initial canvas data from backend
  useEffect(() => {
    const fetchCanvasData = async () => {
      try {
        setIsLoading(true);
        const token = getToken();
        const response = await fetch(`/api/canvas/${canvasId}/pixels`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch canvas data');
        }
        
        const data = await response.json();
        
        // Convert array of pixels to object for easier access
        const pixelMap = {};
        data.pixels.forEach(pixel => {
          const key = `${pixel.x},${pixel.y}`;
          pixelMap[key] = {
            color: pixel.color,
            userId: pixel.user_id,
            username: '', // We don't have this from the backend API
            timestamp: new Date(pixel.updated_at).getTime()
          };
        });
        
        // Initialize Firebase with this data if it doesn't exist yet
        const pixelsRef = ref(realtime, `canvases/${canvasId}/pixels`);
        const snapshot = await get(pixelsRef);
        
        if (!snapshot.exists()) {
          await set(pixelsRef, pixelMap);
        }
        
        setError('');
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (canvasId) {
      fetchCanvasData();
    }
  }, [canvasId, getToken]);

  // Set up Firebase real-time listener
  useEffect(() => {
    if (!canvasId) return;
    
    const pixelsRef = ref(realtime, `canvases/${canvasId}/pixels`);
    
    const unsubscribe = onValue(pixelsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Update our local state with the Firebase data
        setPixels(data);
        setIsLoading(false);
      }
    });
    
    // Clean up listener
    return () => unsubscribe();
  }, [canvasId]);

  // Draw the canvas
  useEffect(() => {
    if (!canvasRef.current || !width || !height) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width * pixelSize, height * pixelSize);
    
    // Draw grid
    ctx.strokeStyle = '#EEEEEE';
    ctx.lineWidth = 1;
    
    // Draw vertical lines
    for (let x = 0; x <= width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * pixelSize, 0);
      ctx.lineTo(x * pixelSize, height * pixelSize);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * pixelSize);
      ctx.lineTo(width * pixelSize, y * pixelSize);
      ctx.stroke();
    }
    
    // Draw pixels
    Object.entries(pixels).forEach(([key, pixelData]) => {
      const [x, y] = key.split(',').map(Number);
      
      // Handle both old format (string) and new format (object)
      const color = typeof pixelData === 'string' ? pixelData : pixelData.color;
      
      ctx.fillStyle = color;
      ctx.fillRect(
        x * pixelSize + 1,
        y * pixelSize + 1,
        pixelSize - 1,
        pixelSize - 1
      );
    });
  }, [pixels, width, height, pixelSize]);

  // Handle pixel click
  const handleCanvasClick = async (e) => {
    if (!isEditable || !canvasRef.current || !currentUser) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / pixelSize);
    const y = Math.floor((e.clientY - rect.top) / pixelSize);
    
    // Validate coordinates
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    
    try {
      // First update in Firebase for immediate real-time feedback
      const pixelKey = `${x},${y}`;
      const pixelRef = ref(realtime, `canvases/${canvasId}/pixels/${pixelKey}`);
      
      // Include user information and timestamp with the pixel data
      const pixelData = {
        color: selectedColor,
        userId: currentUser.id,
        username: currentUser.username,
        timestamp: Date.now()
      };
      
      // Update in Firebase
      await set(pixelRef, pixelData);
      
      // Then update in backend for persistence
      const token = getToken();
      const response = await fetch(`/api/canvas/${canvasId}/pixel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          x,
          y,
          color: selectedColor
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update pixel in backend');
      }
    } catch (err) {
      setError(err.message);
      // If there was an error, try to revert the Firebase update
      try {
        if (canvasId) {
          const pixelRef = ref(realtime, `canvases/${canvasId}/pixels/${x},${y}`);
          const snapshot = await get(pixelRef);
          if (snapshot.exists() && snapshot.val().userId === currentUser.id) {
            await remove(pixelRef);
          }
        }
      } catch (revertErr) {
        console.error('Failed to revert Firebase update:', revertErr);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading canvas...</p>
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

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 flex space-x-2">
        {colors.map((color) => (
          <button
            key={color}
            className={`w-8 h-8 rounded-full ${selectedColor === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => setSelectedColor(color)}
            aria-label={`Select ${color} color`}
          />
        ))}
      </div>
      
      <div className="border border-gray-300 rounded shadow-lg">
        <canvas
          ref={canvasRef}
          width={width * pixelSize}
          height={height * pixelSize}
          onClick={handleCanvasClick}
          className="cursor-pointer"
        />
      </div>
      
      {!isEditable && (
        <p className="mt-2 text-sm text-gray-500">View only mode</p>
      )}
    </div>
  );
};

export default Board;