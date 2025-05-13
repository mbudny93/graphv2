import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import './GraphCanvas.css';

// Import constants
import { NODE_RADIUS, OPERATION_MODES, NODE_TYPES } from '../../utils/GraphConstants';

// Import utilities
import { screenToWorldCoordinates } from '../../utils/GraphMathUtils';
import graphRenderer from '../../utils/GraphRenderer';

// Import services
import graphStateService from '../../services/GraphStateService';
import graphAPIService from '../../services/GraphAPIService';

// Import operations
import nodeCreator from '../../operations/NodeCreator';
import nodeSelector from '../../operations/NodeSelector';
import nodeConnector from '../../operations/NodeConnector';
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

  // Handle canvas click based on the current mode
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Convert screen coordinates to world coordinates
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
        nodeSelector.selectNodeAtPosition(
          x, y, nodes, edges, setSelectedNode, setSelectedEdge, setSelectedElement
        );
        break;
      case OPERATION_MODES.CONNECT:
        handleConnectClick(x, y);
        break;
      case OPERATION_MODES.CONNECT_BIDIRECTIONAL:
        handleConnectBidirectionalClick(x, y);
        break;
      case OPERATION_MODES.DELETE:
        handleDeleteClick(x, y);
        break;
      default:
        break;
    }
  };

  // Handle clicks in connect mode
  const handleConnectClick = (x, y) => {
    const node = nodeSelector.findNodeAtPosition(x, y, nodes);

    if (node) {
      if (!pendingConnection) {
        // First node click - start connection
        setConnectStartNode(node);
        setPendingConnection(true);
      } else if (connectStartNode && node.id !== connectStartNode.id) {
        // Second node click - complete connection if it's a different node
        nodeConnector.connectNodes(
          connectStartNode,
          node,
          nodes,
          edges,
          setNodes,
          setEdges,
          setError,
          selectedNode,
          setSelectedNode,
          setSelectedElement
        );
        
        // Reset connection state
        setConnectStartNode(null);
        setPendingConnection(false);
      } else if (connectStartNode && node.id === connectStartNode.id) {
        // Clicked the same node twice, cancel the connection
        setConnectStartNode(null);
        setPendingConnection(false);
      }
    } else {
      // Clicked on empty space, cancel the connection
      setConnectStartNode(null);
      setPendingConnection(false);
    }
  };

  // Handle clicks in bidirectional connect mode
  const handleConnectBidirectionalClick = (x, y) => {
    const node = nodeSelector.findNodeAtPosition(x, y, nodes);

    if (node) {
      if (!pendingConnection) {
        // First node click - start connection
        setConnectStartNode(node);
        setPendingConnection(true);
      } else if (connectStartNode && node.id !== connectStartNode.id) {
        // Second node click - complete bidirectional connection if it's a different node
        nodeConnector.connectNodesBidirectional(
          connectStartNode,
          node,
          nodes,
          edges,
          setNodes,
          setEdges,
          setError,
          selectedNode,
          setSelectedNode,
          setSelectedElement
        );
        
        // Reset connection state
        setConnectStartNode(null);
        setPendingConnection(false);
      } else if (connectStartNode && node.id === connectStartNode.id) {
        // Clicked the same node twice, cancel the connection
        setConnectStartNode(null);
        setPendingConnection(false);
      }
    } else {
      // Clicked on empty space, cancel the connection
      setConnectStartNode(null);
      setPendingConnection(false);
    }
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

  // Check if a node name already exists
  const isNodeNameUnique = (name) => {
    return !nodes.some(node => {
      // Check against bankId for bank nodes
      if (node.type === NODE_TYPES.BANK && node.properties.bankId === name) {
        return true;
      }
      // Check against name property for other node types
      if (node.properties.name === name) {
        return true;
      }
      return false;
    });
  };

  // Add a new Bank node at the specified position
  const addBankNode = (x, y) => {
    // Generate a unique bank ID
    let bankId;
    let counter = nextBankId;
    
    do {
      bankId = `BANK${counter}`;
      counter++;
    } while (!isNodeNameUnique(bankId));
    
    const newNode = nodeCreator.createBankNode(x, y, counter - 1);
    setNextBankId(counter);
    setNodes([...nodes, newNode]);
  };

  // Add a new Credit Line node at the specified position
  const addCreditLineNode = (x, y) => {
    // Generate a unique credit line ID
    let clId;
    let counter = nextCreditLineId;
    
    do {
      clId = `CL${counter}`;
      counter++;
    } while (!isNodeNameUnique(clId));
    
    const newNode = nodeCreator.createCreditLineNode(x, y, counter - 1);
    setNextCreditLineId(counter);
    setNodes([...nodes, newNode]);
  };

  // Add a new Projection node at the specified position
  const addProjectionNode = (x, y) => {
    // Generate a unique projection ID
    let projName;
    let counter = nextProjectionId;
    
    do {
      projName = `PRJ_ENT${counter}`;
      counter++;
    } while (!isNodeNameUnique(projName));
    
    const newNode = nodeCreator.createProjectionNode(x, y, counter - 1);
    setNextProjectionId(counter);
    setNodes([...nodes, newNode]);
  };

  // Add a new Street node at the specified position
  const addStreetNode = (x, y) => {
    // Check if a street node already exists
    const streetNodeExists = nodes.some(node => node.type === NODE_TYPES.STREET);
    
    if (streetNodeExists) {
      setError('Error: Only one Street node is allowed');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    // Generate a unique street ID
    let streetId;
    let counter = nextStreetId;
    
    do {
      streetId = `STREET${counter}`;
      counter++;
    } while (!isNodeNameUnique(streetId));
    
    const newNode = nodeCreator.createStreetNode(x, y, counter - 1);
    setNextStreetId(counter);
    setNodes([...nodes, newNode]);
  };

  // Handle mouse down for node dragging and panning
  const handleMouseDown = (e) => {
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

    const clickedNode = nodeSelector.findNodeAtPosition(x, y, nodes);

    if (mode === OPERATION_MODES.SELECT && clickedNode) {
      setDraggingNode(clickedNode);
      setDragStart({ x: x - clickedNode.x, y: y - clickedNode.y });
    } else if (mode === OPERATION_MODES.SELECT && !clickedNode) {
      // Start panning if clicking on empty space in select mode
      setIsPanning(true);
      setLastPanPosition({ x: e.clientX, y: e.clientY });
    } else if (mode === OPERATION_MODES.DELETE) {
      handleDeleteClick(x, y);
    }
  };

  // Handle mouse move for node dragging and panning
  const handleMouseMove = (e) => {
    if (draggingNode) {
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

      setNodes(
        nodes.map((node) =>
          node.id === draggingNode.id
            ? { ...node, x: x - dragStart.x, y: y - dragStart.y }
            : node
        )
      );

      // If this node is selected, update the selected node as well
      if (selectedNode && selectedNode.id === draggingNode.id) {
        const updatedNode = { 
          ...selectedNode, 
          x: x - dragStart.x, 
          y: y - dragStart.y 
        };
        setSelectedNode(updatedNode);
        setSelectedElement({ type: 'node', data: updatedNode });
      }
    } else if (isPanning) {
      const dx = e.clientX - lastPanPosition.x;
      const dy = e.clientY - lastPanPosition.y;
      setPanOffset({ x: panOffset.x + dx, y: panOffset.y + dy });
      setLastPanPosition({ x: e.clientX, y: e.clientY });
    }
  };

  // Handle mouse up for node dragging and panning
  const handleMouseUp = () => {
    setDraggingNode(null);
    setIsPanning(false);
  };

  // Handle mouse wheel for zooming
  const handleWheel = (e) => {
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Get mouse position relative to canvas
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate world position before zoom
    const worldX = (mouseX - panOffset.x) / zoomLevel;
    const worldY = (mouseY - panOffset.y) / zoomLevel;
    
    // Determine zoom direction and calculate new zoom level
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoomLevel = Math.max(0.1, Math.min(5, zoomLevel * zoomFactor));
    
    // Calculate new pan offset to keep the point under mouse fixed
    const newPanX = mouseX - worldX * newZoomLevel;
    const newPanY = mouseY - worldY * newZoomLevel;
    
    setZoomLevel(newZoomLevel);
    setPanOffset({ x: newPanX, y: newPanY });
  };

  // Render the graph
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    graphRenderer.drawGraph(
      ctx, 
      width, 
      height, 
      nodes, 
      edges, 
      selectedNode, 
      selectedEdge, 
      panOffset, 
      zoomLevel
    );
  }, [nodes, edges, selectedNode, selectedEdge, panOffset, zoomLevel]);

  // Track mouse position for pending connections
  const trackMouse = (e) => {
    if (pendingConnection) {
      // Force a redraw when tracking mouse for pending connections
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      graphRenderer.drawGraph(
        ctx, 
        width, 
        height, 
        nodes, 
        edges, 
        selectedNode, 
        selectedEdge, 
        panOffset, 
        zoomLevel
      );
      
      // Draw the pending connection line
      if (connectStartNode) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - panOffset.x) / zoomLevel;
        const mouseY = (e.clientY - rect.top - panOffset.y) / zoomLevel;
        
        ctx.save();
        ctx.translate(panOffset.x, panOffset.y);
        ctx.scale(zoomLevel, zoomLevel);
        
        ctx.beginPath();
        ctx.moveTo(connectStartNode.x, connectStartNode.y);
        ctx.lineTo(mouseX, mouseY);
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', trackMouse);
    
    return () => {
      window.removeEventListener('mousemove', trackMouse);
    };
  }, [pendingConnection, connectStartNode]);

  // Resize canvas to match container
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // Redraw after resize
    const ctx = canvas.getContext('2d');
    graphRenderer.drawGraph(
      ctx, 
      canvas.width, 
      canvas.height, 
      nodes, 
      edges, 
      selectedNode, 
      selectedEdge, 
      panOffset, 
      zoomLevel
    );
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
      {error && <div className="error-message">{error}</div>}
      <canvas
        ref={canvasRef}
        className="graph-canvas"
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
});

export default GraphCanvas;
