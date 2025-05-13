import React, { useState, useRef, useEffect } from 'react';
import './LeftPane.css';
import StateModal from './StateModal';

const LeftPane = ({ mode, setMode, getGraphState }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [graphState, setGraphState] = useState(null);
  const leftPaneRef = useRef(null);
  const isResizingRef = useRef(false);
  
  const handleStateClick = () => {
    // Get the current state from the GraphCanvas component
    const currentState = getGraphState();
    setGraphState(currentState);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Set up resize handlers
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingRef.current) return;
      
      // Set min and max width constraints
      const newWidth = Math.max(150, Math.min(400, e.clientX));
      if (leftPaneRef.current) {
        leftPaneRef.current.style.width = `${newWidth}px`;
      }
    };
    
    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    
    // Add global event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Clean up event listeners on unmount
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);
  
  const handleResizeStart = (e) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none'; // Prevent text selection during resize
  };
  
  // Operation modes
  const operationModes = [
    { id: 'select', label: 'Select', icon: '👆' },
    { id: 'connect', label: 'Connect', icon: '↔️' },
    { id: 'connectBidirectional', label: 'Connect Bidirectional', icon: '⟷' },
    { id: 'delete', label: 'Delete', icon: '🗑️' }
  ];
  
  // Node creation modes
  const nodeModes = [
    { id: 'addBank', label: 'Bank Node', icon: '🏦' },
    { id: 'addCreditLine', label: 'Credit Line', icon: '💳' },
    { id: 'addProjection', label: 'Projection', icon: '📊' },
    { id: 'addStreet', label: 'Street', icon: '🛣️' }
  ];

  return (
    <>
      <div className="left-pane" ref={leftPaneRef}>
        <div className="pane-content">
          <div className="pane-section">
            <div className="section-title">Operations</div>
            <div className="buttons-container">
              {operationModes.map((item) => (
                <button
                  key={item.id}
                  className={`pane-button ${mode === item.id ? 'active' : ''}`}
                  onClick={() => setMode(item.id)}
                  title={item.label}
                >
                  <span className="icon">{item.icon}</span>
                  <span className="label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="pane-section">
            <div className="section-title">Add Nodes</div>
            <div className="buttons-container">
              {nodeModes.map((item) => (
                <button
                  key={item.id}
                  className={`pane-button ${mode === item.id ? 'active' : ''}`}
                  onClick={() => setMode(item.id)}
                  title={item.label}
                >
                  <span className="icon">{item.icon}</span>
                  <span className="label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="pane-section">
            <div className="section-title">Tools</div>
            <div className="buttons-container">
              <button
                className="pane-button"
                onClick={handleStateClick}
                title="View State"
              >
                <span className="icon">📋</span>
                <span className="label">State</span>
              </button>
            </div>
          </div>
        </div>
        
        <div 
          className="resize-handle"
          onMouseDown={handleResizeStart}
        ></div>
      </div>
      
      <StateModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        graphState={graphState} 
      />
    </>
  );
};

export default LeftPane;
