import React, { useState } from 'react';
import './Toolbar.css';
import StateModal from './StateModal';

const Toolbar = ({ mode, setMode, getGraphState }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [graphState, setGraphState] = useState(null);
  
  const handleStateClick = () => {
    // Get the current state from the GraphCanvas component
    const currentState = getGraphState();
    setGraphState(currentState);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
  };
  // Operation modes
  const operationModes = [
    { id: 'select', label: 'Select', icon: '👆' },
    { id: 'connect', label: 'Connect', icon: '↔️' },
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
    <div className="toolbar">
      <div className="toolbar-section">
        <div className="section-title">Operations</div>
        <div className="buttons-container">
          {operationModes.map((item) => (
            <button
              key={item.id}
              className={`toolbar-button ${mode === item.id ? 'active' : ''}`}
              onClick={() => setMode(item.id)}
              title={item.label}
            >
              <span className="icon">{item.icon}</span>
              <span className="label">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="toolbar-section">
        <div className="section-title">Add Nodes</div>
        <div className="buttons-container">
          {nodeModes.map((item) => (
            <button
              key={item.id}
              className={`toolbar-button ${mode === item.id ? 'active' : ''}`}
              onClick={() => setMode(item.id)}
              title={item.label}
            >
              <span className="icon">{item.icon}</span>
              <span className="label">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="toolbar-section">
        <div className="section-title">Tools</div>
        <div className="buttons-container">
          <button
            className="toolbar-button"
            onClick={handleStateClick}
            title="View State"
          >
            <span className="icon">📋</span>
            <span className="label">State</span>
          </button>
        </div>
      </div>
      
      <StateModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        graphState={graphState} 
      />
    </div>
  );
};

export default Toolbar;
