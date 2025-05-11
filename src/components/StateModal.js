import React, { useState, useRef } from 'react';
import './StateModal.css';

const StateModal = ({ isOpen, onClose, graphState }) => {
  const [expandedSections, setExpandedSections] = useState({
    bankNodes: true,
    creditLineNodes: true,
    projectionNodes: true,
    streetNodes: true,
    edges: true
  });
  const [copySuccess, setCopySuccess] = useState('');
  const textAreaRef = useRef(null);

  if (!isOpen) return null;

  // Format the state data as pretty JSON
  const formattedState = JSON.stringify(graphState, null, 2);
  
  // Handle copying to clipboard
  const copyToClipboard = () => {
    textAreaRef.current.select();
    document.execCommand('copy');
    setCopySuccess('Copied!');
    setTimeout(() => setCopySuccess(''), 2000);
  };
  
  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };
  
  // Render a collapsible section
  const renderSection = (section, title) => {
    const isExpanded = expandedSections[section];
    const sectionData = graphState[section] || [];
    const itemCount = sectionData.length;
    
    return (
      <div className="json-section" key={section}>
        <div 
          className="section-header" 
          onClick={() => toggleSection(section)}
        >
          <span className="toggle-icon">{isExpanded ? '▼' : '►'}</span>
          <span className="section-title">{title} ({itemCount})</span>
        </div>
        {isExpanded && (
          <pre className="section-content">
            {JSON.stringify(sectionData, null, 2)}
          </pre>
        )}
      </div>
    );
  };

  return (
    <div className="state-modal-overlay">
      <div className="state-modal">
        <div className="state-modal-header">
          <h2>Canvas State</h2>
          <div className="header-actions">
            <button 
              className={`copy-button ${copySuccess ? 'success' : ''}`} 
              onClick={copyToClipboard}
              title="Copy to clipboard"
            >
              <span className="copy-icon">{copySuccess ? '✓' : '📋'}</span>
              <span className="copy-text">{copySuccess || 'Copy JSON'}</span>
            </button>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
        </div>
        <div className="state-modal-content">
          <div className="json-viewer">
            {renderSection('bankNodes', 'Bank Nodes')}
            {renderSection('creditLineNodes', 'Credit Line Nodes')}
            {renderSection('projectionNodes', 'Projection Nodes')}
            {renderSection('streetNodes', 'Street Nodes')}
            {renderSection('edges', 'Edges')}
          </div>
          <textarea 
            ref={textAreaRef} 
            value={formattedState} 
            readOnly 
            style={{ position: 'absolute', left: '-9999px' }} 
          />
        </div>
      </div>
    </div>
  );
};

export default StateModal;
