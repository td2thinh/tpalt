import { useState } from 'react';
import PropTypes from 'prop-types';

// Predefined color palette
const DEFAULT_COLORS = [
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
  '#008000', // Dark Green
  '#A52A2A', // Brown
  '#808080', // Gray
  '#FFC0CB', // Pink
  '#FFD700', // Gold
  '#C0C0C0', // Silver
];

const ColorPalette = ({ onColorSelect, selectedColor }) => {
  const [customColor, setCustomColor] = useState('#000000');
  
  const handleColorClick = (color) => {
    onColorSelect(color);
  };
  
  const handleCustomColorChange = (e) => {
    setCustomColor(e.target.value);
  };
  
  const handleCustomColorSelect = () => {
    onColorSelect(customColor);
  };
  
  return (
    <div className="color-palette">
      <div className="predefined-colors">
        {DEFAULT_COLORS.map((color) => (
          <div
            key={color}
            className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => handleColorClick(color)}
            title={color}
          />
        ))}
      </div>
      
      <div className="custom-color-picker">
        <input
          type="color"
          value={customColor}
          onChange={handleCustomColorChange}
          className="color-input"
        />
        <button
          className="color-select-btn"
          onClick={handleCustomColorSelect}
        >
          Use Custom Color
        </button>
      </div>
      
      <div className="selected-color-display">
        <div
          className="current-color"
          style={{ backgroundColor: selectedColor }}
        />
        <span className="color-value">{selectedColor}</span>
      </div>
    </div>
  );
};

ColorPalette.propTypes = {
  onColorSelect: PropTypes.func.isRequired,
  selectedColor: PropTypes.string.isRequired,
};

export default ColorPalette;