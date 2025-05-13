import React from 'react';
import '../graph/GraphCanvas.css';

/**
 * Simple component to display error messages in the graph canvas
 */
const GraphErrorDisplay = ({ message }) => {
  if (!message) return null;
  
  return (
    <div className="error-message">{message}</div>
  );
};

export default GraphErrorDisplay;
