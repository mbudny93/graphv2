import React, { useState, useEffect } from 'react';
import './PropertiesPane.css';

// Helper function to determine property type
const getPropertyType = (key, value) => {
  // Node properties
  if (key === 'bankId' || key === 'entity' || key === 'routingCode' || 
      key === 'currency' || key === 'creditLine' || key === 'flowId' || key === 'flowType' || key === 'name') {
    return 'string';
  } else if (key === 'projected' || key === 'actual' || key === 'min' || key === 'max' || key === 'cost' || key === 'amount') {
    return 'number';
  } else if (key === 'beneficialLocation' || key === 'projectionAware' || key === 'streetCover') {
    return 'boolean';
  }
  
  // Fallback type detection
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  return 'string';
};

const PropertiesPane = ({ selectedElement, onUpdateProperties }) => {
  const [properties, setProperties] = useState({});

  useEffect(() => {
    if (selectedElement && selectedElement.data) {
      setProperties(selectedElement.data.properties || {});
    } else {
      setProperties({});
    }
  }, [selectedElement]);

  // Handle property change
  const handlePropertyChange = (key, value) => {
    const updatedProperties = { ...properties, [key]: value };
    setProperties(updatedProperties);
    
    if (selectedElement && onUpdateProperties) {
      // Special handling for Credit Line node name changes
      if (selectedElement.data.type === 'creditLine' && key === 'name') {
        onUpdateProperties(selectedElement.type, selectedElement.data.id, updatedProperties, {
          type: 'creditLineNameChange',
          oldName: selectedElement.data.properties.name,
          newName: value
        });
      } else {
        onUpdateProperties(selectedElement.type, selectedElement.data.id, updatedProperties);
      }
    }
  };

  const renderProperties = () => {
    return Object.entries(properties).map(([key, value]) => {
      const propertyType = getPropertyType(key, value);
      
      // Check if this is a read-only property for Bank nodes
      const isReadOnly = 
        selectedElement && 
        selectedElement.data && 
        selectedElement.data.type === 'bank' && 
        (key === 'creditLine' || key === 'projectionAware' || key === 'streetCover');
      
      if (propertyType === 'boolean') {
        return (
          <div className="property-item" key={key}>
            <label>{key}:</label>
            {isReadOnly ? (
              <span className="read-only-value">{value.toString()}</span>
            ) : (
              <select
                value={value.toString()}
                onChange={(e) => handlePropertyChange(key, e.target.value === 'true')}
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            )}
          </div>
        );
      } else if (propertyType === 'number') {
        return (
          <div className="property-item" key={key}>
            <label>{key}:</label>
            <input
              type="number"
              value={value !== null ? value : ''}
              onChange={(e) => {
                const numValue = e.target.value === '' ? null : parseFloat(e.target.value);
                handlePropertyChange(key, numValue);
              }}
              disabled={isReadOnly}
              className={isReadOnly ? 'read-only' : ''}
            />
          </div>
        );
      } else {
        return (
          <div className="property-item" key={key}>
            <label>{key}:</label>
            <input
              type="text"
              value={value !== null ? value : ''}
              onChange={(e) => handlePropertyChange(key, e.target.value === '' ? null : e.target.value)}
              disabled={isReadOnly}
              className={isReadOnly ? 'read-only' : ''}
            />
          </div>
        );
      }
    });
  };

  // Removed renderAddProperty function

  if (!selectedElement) {
    return (
      <div className="properties-pane">
        <h3>Properties</h3>
        <p className="no-selection">No element selected</p>
      </div>
    );
  }

  // Get node type to display in the header
  const getNodeTypeLabel = () => {
    if (!selectedElement || !selectedElement.data) return 'Node';
    
    switch (selectedElement.data.type) {
      case 'bank': return 'Bank Node';
      case 'creditLine': return 'Credit Line';
      case 'projection': return 'Projection';
      case 'street': return 'Street';
      default: return 'Node';
    }
  };
  
  return (
    <div className="properties-pane">
      <h3>Properties: {selectedElement.type === 'node' ? getNodeTypeLabel() : 'Edge'}</h3>
      {selectedElement.type === 'node' && selectedElement.data.type === 'bank' && (
        <div className="property-info">
          {/* bankId uniqueness requirement removed */}
        </div>
      )}
      <div className="properties-list">
        {renderProperties()}
      </div>
    </div>
  );
};

export default PropertiesPane;
