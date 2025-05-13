import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import LeftPane from './components/LeftPane';
import GraphCanvas from './components/graph/GraphCanvas';
import PropertiesPane from './components/PropertiesPane';

function App() {
  const [mode, setMode] = useState('select');
  const [selectedElement, setSelectedElement] = useState(null);
  const graphCanvasRef = useRef(null);
  
  // Custom mode setter that clears selection when leaving select mode
  const handleModeChange = (newMode) => {
    // If we're switching from select mode to another mode, clear the selection
    if (mode === 'select' && newMode !== 'select') {
      setSelectedElement(null);
    }
    setMode(newMode);
  };
  
  // Add keyboard event listener for ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleModeChange('select');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleUpdateProperties = (type, id, updatedProperties, additionalInfo) => {
    if (!graphCanvasRef.current) return;
    
    if (type === 'node') {
      graphCanvasRef.current.updateNodeProperties(id, updatedProperties, additionalInfo);
    } else if (type === 'edge') {
      graphCanvasRef.current.updateEdgeProperties(id, updatedProperties);
    }
  };

  // Function to get the current graph state from the GraphCanvas component
  const getGraphState = () => {
    if (!graphCanvasRef.current) return { bankNodes: [], creditLineNodes: [], projectionNodes: [], streetNodes: [], edges: [] };
    return graphCanvasRef.current.getGraphState();
  };

  return (
    <div className="App">
      <div className="main-content">
        <LeftPane mode={mode} setMode={handleModeChange} getGraphState={getGraphState} />
        <div className="canvas-container">
          <GraphCanvas 
            ref={graphCanvasRef}
            mode={mode} 
            setSelectedElement={setSelectedElement} 
          />
        </div>
        <div className="properties-container">
          <PropertiesPane 
            selectedElement={selectedElement} 
            onUpdateProperties={handleUpdateProperties} 
          />
        </div>
      </div>
    </div>
  );
}

export default App;
