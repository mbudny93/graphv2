import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import './GraphCanvas.css';

// Import components
import GraphErrorDisplay from './GraphErrorDisplay';

// Import constants
import { OPERATION_MODES, NODE_TYPES } from '../../utils/GraphConstants';

// Import utilities
import { screenToWorldCoordinates } from '../../utils/GraphMathUtils';
import graphRenderer from '../../utils/GraphRenderer';
import graphNodeManager from '../../utils/GraphNodeManager';
import graphConnectionManager from '../../utils/GraphConnectionManager';
import graphInteractionHandler from '../../utils/GraphInteractionHandler';

// Import services
import graphStateService from '../../services/GraphStateService';

// Import operations
import nodeSelector from '../../operations/NodeSelector';
import nodeDeleter from '../../operations/NodeDeleter';

const GraphCanvas = forwardRef(({ mode, setSelectedElement }, ref) => {
  // State for nodes and edges
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  
  // Selection state
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  
  // Error handling
  const [error, setError] = useState(null);
  
  // Dragging state
  const [draggingNode, setDraggingNode] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Connection state
  const [connectStartNode, setConnectStartNode] = useState(null);
  const [pendingConnection, setPendingConnection] = useState(false);
  
  // ID counters for new nodes
  const [nextBankId, setNextBankId] = useState(1);
  const [nextCreditLineId, setNextCreditLineId] = useState(1);
  const [nextProjectionId, setNextProjectionId] = useState(1);
  const [nextStreetId, setNextStreetId] = useState(1);
  
  // View state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);

  // Effect to clear selection when mode changes from 'select' to something else
  useEffect(() => {
    if (mode !== OPERATION_MODES.SELECT) {
      // Clear visual selection
      setSelectedNode(null);
      setSelectedEdge(null);
    }
  }, [mode]);

  // Handle clicks in select mode
  const handleSelectClick = (x, y) => {
    nodeSelector.selectNodeAtPosition(
      x, y, nodes, edges, setSelectedNode, setSelectedEdge, setSelectedElement
    );
  };

  // Handle canvas click based on the current mode
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const worldCoords = screenToWorldCoordinates(
      e.clientX - rect.left,
      e.clientY - rect.top,
      panOffset.x,
      panOffset.y,
      zoomLevel
    );
    
    const x = worldCoords.x;
    const y = worldCoords.y;

    switch (mode) {
      case OPERATION_MODES.ADD_BANK:
        addBankNode(x, y);
        break;
      case OPERATION_MODES.ADD_CREDIT_LINE:
        addCreditLineNode(x, y);
        break;
      case OPERATION_MODES.ADD_PROJECTION:
        addProjectionNode(x, y);
        break;
      case OPERATION_MODES.ADD_STREET:
        addStreetNode(x, y);
        break;
      case OPERATION_MODES.SELECT:
        handleSelectClick(x, y);
        break;
      case OPERATION_MODES.CONNECT:
        handleConnectClick(x, y);
        break;
      case OPERATION_MODES.CONNECT_BIDIRECTIONAL:
        handleConnectBidirectionalClick(x, y);
        break;
      case OPERATION_MODES.DELETE:
        // Delete is handled in mouseDown to avoid conflicts with dragging
        break;
      default:
        break;
    }
  };

  // Handle clicks in connect mode
  const handleConnectClick = (x, y) => {
    graphConnectionManager.handleConnectClick(
      x, y, nodes, edges, connectStartNode, setConnectStartNode,
      pendingConnection, setPendingConnection, setError, setEdges, setNodes
    );
  };

  // Handle clicks in bidirectional connect mode
  const handleConnectBidirectionalClick = (x, y) => {
    graphConnectionManager.handleConnectBidirectionalClick(
      x, y, nodes, edges, connectStartNode, setConnectStartNode,
      pendingConnection, setPendingConnection, setError, setEdges, setNodes
    );
  };

  // Handle clicks in delete mode
  const handleDeleteClick = (x, y) => {
    // First try to delete a node
    const nodeDeleted = nodeDeleter.deleteNodeAtPosition(
      x, y, nodes, edges, selectedNode, setNodes, setEdges, setSelectedNode, setSelectedElement
    );
    
    // If no node was deleted, try to delete an edge
    if (!nodeDeleted) {
      nodeDeleter.deleteEdgeAtPosition(
        x, y, nodes, edges, selectedEdge, setEdges, setSelectedEdge, setSelectedElement
      );
    }
  };

  // Add a new Bank node at the specified position
  const addBankNode = (x, y) => {
    graphNodeManager.addBankNode(x, y, nodes, nextBankId, setNodes, setNextBankId, setError);
  };

  // Add a new Credit Line node at the specified position
  const addCreditLineNode = (x, y) => {
    graphNodeManager.addCreditLineNode(x, y, nodes, nextCreditLineId, setNodes, setNextCreditLineId, setError);
  };

  // Add a new Projection node at the specified position
  const addProjectionNode = (x, y) => {
    graphNodeManager.addProjectionNode(x, y, nodes, nextProjectionId, setNodes, setNextProjectionId, setError);
  };

  // Add a new Street node at the specified position
  const addStreetNode = (x, y) => {
    graphNodeManager.addStreetNode(x, y, nodes, nextStreetId, setNodes, setNextStreetId, setError);
  };

  // Handle mouse down for node dragging and panning
  const handleMouseDown = (e) => {
    graphInteractionHandler.handleMouseDown(
      e, canvasRef, mode, nodes, panOffset, zoomLevel,
      setDraggingNode, setDragStart, setIsPanning, setLastPanPosition, handleDeleteClick
    );
  };

  // Handle mouse move for node dragging and panning
  const handleMouseMove = (e) => {
    graphInteractionHandler.handleMouseMove(
      e, canvasRef, draggingNode, dragStart, isPanning, lastPanPosition,
      panOffset, zoomLevel, nodes, setNodes, selectedNode, setSelectedNode,
      setSelectedElement, setPanOffset, setLastPanPosition
    );
  };

  // Handle mouse up for node dragging and panning
  const handleMouseUp = () => {
    setDraggingNode(null);
    setIsPanning(false);
  };

  // Handle mouse wheel for zooming
  const handleWheel = (e) => {
    graphInteractionHandler.handleWheel(
      e, canvasRef, panOffset, zoomLevel, setPanOffset, setZoomLevel
    );
  };

  // Render the graph
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    graphRenderer.drawGraph(
      ctx, width, height, nodes, edges, selectedNode, selectedEdge, panOffset, zoomLevel
    );
  }, [nodes, edges, selectedNode, selectedEdge, panOffset, zoomLevel]);

  // Track mouse position for pending connections
  const trackMouse = (e) => {
    if (!pendingConnection || !connectStartNode) return;
    
    // Force a redraw when tracking mouse for pending connections
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Redraw the graph
    graphRenderer.drawGraph(
      ctx, canvas.width, canvas.height, nodes, edges, selectedNode, selectedEdge, panOffset, zoomLevel
    );
    
    // Get mouse position in world coordinates
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - panOffset.x) / zoomLevel;
    const mouseY = (e.clientY - rect.top - panOffset.y) / zoomLevel;
    
    // Draw the pending connection line
    graphConnectionManager.drawPendingConnection(ctx, connectStartNode, mouseX, mouseY, panOffset, zoomLevel);
  };

  useEffect(() => {
    window.addEventListener('mousemove', trackMouse);
    return () => window.removeEventListener('mousemove', trackMouse);
  }, [pendingConnection, connectStartNode]);

  // Resize canvas to match container
  const resizeCanvas = () => {
    const result = graphInteractionHandler.resizeCanvas(canvasRef, nodes, edges, selectedNode, selectedEdge, panOffset, zoomLevel);
    if (result) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      graphRenderer.drawGraph(
        ctx, canvas.width, canvas.height, nodes, edges, selectedNode, selectedEdge, panOffset, zoomLevel
      );
    }
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    canvasRef.current.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('wheel', handleWheel);
      }
    };
  }, [nodes, edges, selectedNode, selectedEdge, panOffset, zoomLevel]);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    // Get the current state of the graph in a structured format
    getGraphState: () => {
      return graphStateService.formatGraphState(nodes, edges);
    },
    
    // Update node properties
    updateNodeProperties: (nodeId, updatedProperties, additionalInfo) => {
      // Get the node being updated
      const nodeToUpdate = nodes.find(node => node.id === nodeId);
      if (!nodeToUpdate) return;
      
      // Check if we're updating a name property and validate uniqueness
      let nameProperty = null;
      
      // For bank nodes, check bankId
      if (nodeToUpdate.type === NODE_TYPES.BANK && updatedProperties.bankId) {
        // Check if the new bankId is unique (excluding the current node)
        const isDuplicate = nodes.some(node => 
          node.id !== nodeId && 
          node.type === NODE_TYPES.BANK && 
          node.properties.bankId === updatedProperties.bankId
        );
        
        if (isDuplicate) {
          setError(`Error: Bank ID '${updatedProperties.bankId}' already exists`);
          setTimeout(() => setError(null), 3000);
          return;
        }
      }
      
      // For other node types, check name property
      if (updatedProperties.name) {
        // Check if the new name is unique (excluding the current node)
        const isDuplicate = nodes.some(node => 
          node.id !== nodeId && 
          node.properties.name === updatedProperties.name
        );
        
        if (isDuplicate) {
          setError(`Error: Node name '${updatedProperties.name}' already exists`);
          setTimeout(() => setError(null), 3000);
          return;
        }
      }
      
      // If we're here, the name is unique or wasn't changed
      const updatedNodes = graphStateService.updateNodeProperties(nodes, nodeId, updatedProperties);
      setNodes(updatedNodes);
      
      // Update selected node if it was modified
      if (selectedNode && selectedNode.id === nodeId) {
        const updatedNode = updatedNodes.find(node => node.id === nodeId);
        setSelectedNode(updatedNode);
        setSelectedElement({ type: 'node', data: updatedNode });
      }
    },
    
    // Update edge properties
    updateEdgeProperties: (edgeId, updatedProperties) => {
      const updatedEdges = graphStateService.updateEdgeProperties(edges, edgeId, updatedProperties);
      setEdges(updatedEdges);
      
      // Update selected edge if it was modified
      if (selectedEdge && selectedEdge.id === edgeId) {
        const updatedEdge = updatedEdges.find(edge => edge.id === edgeId);
        setSelectedEdge(updatedEdge);
        setSelectedElement({ type: 'edge', data: updatedEdge });
      }
    }
  }));

  return (
    <div className="graph-canvas-container">
      <canvas
        ref={canvasRef}
        className="graph-canvas"
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      {error && <GraphErrorDisplay message={error} />}
    </div>
  );
});

export default GraphCanvas;
