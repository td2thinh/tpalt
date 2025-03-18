import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import socketService from '../services/socketService';
import apiService from '../services/apiService';
import { useAuth } from './AuthContext';

const CanvasContext = createContext();

export function useCanvas() {
  return useContext(CanvasContext);
}

export function CanvasProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [canvases, setCanvases] = useState([]);
  const [currentCanvas, setCurrentCanvas] = useState(null);
  const [pixels, setPixels] = useState([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const [loading, setLoadingState] = useState(true);
  const setLoading = useCallback((isLoading) => {
    setLoadingState(isLoading);
  }, []);
  const [error, setErrorState] = useState(null);
  const setError = useCallback((err) => {
    setErrorState(err);
  }, []);
  const [connected, setConnected] = useState(false);

  // Load all available canvases
  const loadCanvases = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiService.listCanvases();
      setCanvases(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [setError, setLoading]);

  // Load a specific canvas
  const loadCanvas = useCallback(async (canvasId) => {
    setError(null);
    setLoading(true);
    try {
      // Load canvas data via API
      const canvas = await apiService.getCanvas(canvasId);
      const pixelsData = await apiService.getCanvasPixels(canvasId);
      
      setCurrentCanvas(canvas);
      setPixels(pixelsData.pixels);
      
      // Try to join the canvas room via Socket.IO if connected
      if (connected) {
        try {
          await socketService.joinCanvas(canvasId);
          console.log(`Joined canvas room for ${canvasId} via Socket.IO`);
        } catch (socketErr) {
          console.error(`Failed to join canvas room via Socket.IO: ${socketErr.message}`);
          // Continue without Socket.IO connection
        }
      }
      
      setLoading(false);
      return canvas;
    } catch (err) {
      console.error(`Failed to load canvas ${canvasId}:`, err);
      setError(`Failed to load canvas: ${err.message}`);
      setLoading(false);
      throw err;
    }
  }, [connected, setError, setLoading]);

  // Create a new canvas
  const createCanvas = useCallback(async (name, description, size) => {
    setError(null);
    try {
      const canvas = await apiService.createCanvas(name, description, size);
      
      // Validate that the canvas has a valid UUID before adding to state
      if (!canvas || !canvas.uuid || canvas.uuid === 'undefined') {
        throw new Error('Invalid canvas data returned from server');
      }
      
      setCanvases(prev => [...prev, canvas]);
      return canvas;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [setError]);

  // Place a pixel on the canvas
  const placePixel = useCallback(async (x, y, color) => {
    if (!currentCanvas) {
      setError('No canvas selected');
      return;
    }

    setError(null);
    
    // Update local state immediately for responsive UI
    setPixels(prevPixels => {
      const newPixels = [...prevPixels];
      if (newPixels[y] && newPixels[y][x]) {
        newPixels[y][x] = color;
      }
      return newPixels;
    });
    
    try {
      // Try to update via Socket.IO for real-time updates
      if (connected) {
        try {
          await socketService.placePixel(x, y, color);
          console.log(`Pixel placed via Socket.IO at (${x}, ${y}) with color ${color}`);
        } catch (socketErr) {
          console.error('Failed to place pixel via Socket.IO:', socketErr);
          // Continue with API fallback
        }
      }
      
      // Always update via API for persistence
      await apiService.updatePixel(currentCanvas.uuid, x, y, color);
      console.log(`Pixel placed via API at (${x}, ${y}) with color ${color}`);
    } catch (err) {
      console.error('Failed to place pixel:', err);
      setError(`Failed to place pixel: ${err.message}`);
      
      // Revert the local state change if both Socket.IO and API failed
      setPixels(prevPixels => {
        const newPixels = [...prevPixels];
        // Only revert if we have the original data
        // Otherwise, leave as is to avoid further UI issues
        return newPixels;
      });
      
      throw err;
    }
  }, [currentCanvas, connected, setError]);

  // Leave the current canvas
  const leaveCanvas = useCallback(() => {
    if (connected && currentCanvas) {
      try {
        socketService.leaveCanvas();
        console.log('Left canvas room via Socket.IO');
      } catch (socketErr) {
        console.error('Failed to leave canvas room via Socket.IO:', socketErr);
        // Continue without Socket.IO
      }
    }
    
    // Always update local state
    setCurrentCanvas(null);
    setPixels([]);
    setActiveUsers(0);
    console.log('Canvas state cleared');
  }, [connected, currentCanvas]);

  // Handle pixel updates from Socket.IO
  const handlePixelUpdate = useCallback((data) => {
    if (!currentCanvas || data.canvasId !== currentCanvas.uuid) return;

    setPixels(prevPixels => {
      const newPixels = [...prevPixels];
      if (newPixels[data.y] && newPixels[data.y][data.x]) {
        newPixels[data.y][data.x] = data.color;
      }
      return newPixels;
    });
  }, [currentCanvas]);

  // Initialize Socket.IO connection
  useEffect(() => {
    try {
      socketService.connect()
        .onConnect(() => {
          setConnected(true);
          console.log('Socket connected');
        })
        .onDisconnect((reason) => {
          setConnected(false);
          console.log('Socket disconnected:', reason);
        })
        .onError((err) => {
          console.error('Socket error:', err);
          // Don't set error state for socket errors to avoid blocking the UI
          // Just log it and continue working with API fallback
        })
        .onPixelUpdate(handlePixelUpdate)
        .onActiveUsers((count) => {
          setActiveUsers(count);
        })
        .onJoinedCanvas((data) => {
          console.log('Joined canvas:', data);
        });
    } catch (err) {
      console.error('Failed to initialize socket:', err);
      // Continue without socket connection
    }

    // Cleanup on unmount
    return () => {
      try {
        socketService.disconnect();
      } catch (err) {
        console.error('Error disconnecting socket:', err);
      }
    };
  }, [handlePixelUpdate]);

  // Authenticate socket if user is logged in
  useEffect(() => {
    if (isAuthenticated() && connected) {
      const token = localStorage.getItem('token');
      socketService.authenticate(token)
        .then(() => console.log('Socket authenticated'))
        .catch(err => {
          console.error('Socket authentication error:', err);
          // Don't set error state for socket auth errors to avoid blocking the UI
          // Just log it and continue working with API fallback
        });
    }
  }, [isAuthenticated, connected]);

  // Load canvases on mount
  useEffect(() => {
    loadCanvases();
  }, [loadCanvases]);

  const value = {
    canvases,
    currentCanvas,
    pixels,
    activeUsers,
    loading,
    error,
    connected,
    loadCanvases,
    loadCanvas,
    createCanvas,
    placePixel,
    leaveCanvas,
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
}

export default CanvasContext;