import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import Pixel from './Pixel';
import ColorPalette from './ColorPalette';
import { useCanvas } from '../context/CanvasContext';

const Canvas = () => {
  const {
    currentCanvas,
    pixels,
    activeUsers,
    loading,
    error,
    placePixel,
  } = useCanvas();
  
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [pixelSize, setPixelSize] = useState(10);
  const canvasRef = useRef(null);
  
  // This component no longer needs to load the canvas data
  // as it's already loaded by the parent CanvasPage component
  useEffect(() => {
    // No need to load canvas here, it's already loaded by CanvasPage
    
    // Cleanup when unmounting
    return () => {
      // Any cleanup needed
    };
  }, []);
  
  // Adjust pixel size based on canvas size
  useEffect(() => {
    if (currentCanvas && currentCanvas.size) {
      // Adjust pixel size based on canvas size
      // For larger canvases, use smaller pixels
      if (currentCanvas.size > 500) {
        setPixelSize(2);
      } else if (currentCanvas.size > 200) {
        setPixelSize(5);
      } else {
        setPixelSize(10);
      }
    }
  }, [currentCanvas]);
  
  const handlePixelClick = (x, y) => {
    placePixel(x, y, selectedColor);
  };
  
  const handleColorSelect = (color) => {
    setSelectedColor(color);
  };
  
  if (loading) {
    return <div className="loading">Loading canvas...</div>;
  }
  
  if (error) {
    return <div className="error">Error: {error}</div>;
  }
  
  if (!currentCanvas || !pixels || pixels.length === 0) {
    return <div className="no-canvas">No canvas data available</div>;
  }
  
  return (
    <div className="canvas-container">
      <div className="canvas-info">
        <h2>{currentCanvas.name}</h2>
        <p>{currentCanvas.description}</p>
        <p>Active Users: {activeUsers}</p>
      </div>
      
      <ColorPalette onColorSelect={handleColorSelect} selectedColor={selectedColor} />
      
      <div className="canvas-wrapper" ref={canvasRef}>
        <TransformWrapper
          initialScale={1}
          minScale={0.1}
          maxScale={10}
          limitToBounds={false}
          wheel={{ step: 0.1 }}
        >
          <TransformComponent>
            <div 
              className="canvas-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${currentCanvas.size}, ${pixelSize}px)`,
                gridTemplateRows: `repeat(${currentCanvas.size}, ${pixelSize}px)`,
                gap: '0px',
              }}
            >
              {pixels.map((row, y) => 
                row.map((color, x) => (
                  <Pixel
                    key={`${x}-${y}`}
                    x={x}
                    y={y}
                    color={color}
                    size={pixelSize}
                    onPixelClick={handlePixelClick}
                  />
                ))
              )}
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>
    </div>
  );
};

// No props needed anymore
Canvas.propTypes = {};

export default Canvas;