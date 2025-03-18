import { memo } from 'react';
import PropTypes from 'prop-types';

const Pixel = ({ x, y, color, size, onPixelClick }) => {
  const handleClick = () => {
    onPixelClick(x, y);
  };

  return (
    <div
      className="pixel"
      style={{
        backgroundColor: color || '#FFFFFF',
        width: `${size}px`,
        height: `${size}px`,
      }}
      onClick={handleClick}
      data-x={x}
      data-y={y}
    />
  );
};

Pixel.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  color: PropTypes.string,
  size: PropTypes.number,
  onPixelClick: PropTypes.func.isRequired,
};

Pixel.defaultProps = {
  color: '#FFFFFF',
  size: 10,
};

// Use memo to prevent unnecessary re-renders
export default memo(Pixel);