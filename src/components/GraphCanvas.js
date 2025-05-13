import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import './GraphCanvas.css';

const GraphCanvas = forwardRef(({ mode, setSelectedElement }, ref) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [error, setError] = useState(null);
  const [draggingNode, setDraggingNode] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [connectStartNode, setConnectStartNode] = useState(null);
  const [pendingConnection, setPendingConnection] = useState(false);
  const [nextBankId, setNextBankId] = useState(1);
  const [nextCreditLineId, setNextCreditLineId] = useState(1);
  const [nextProjectionId, setNextProjectionId] = useState(1);
  const [nextStreetId, setNextStreetId] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1); // Initial zoom level
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 }); // For panning
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);

  // Node radius
  const NODE_RADIUS = 30;

  // Handle canvas click based on the current mode
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    // Adjust mouse coordinates for zoom and pan
    const x = (e.clientX - rect.left - panOffset.x) / zoomLevel;
    const y = (e.clientY - rect.top - panOffset.y) / zoomLevel;

    switch (mode) {
      case 'addBank':
        addBankNode(x, y);
        break;
      case 'addCreditLine':
        addCreditLineNode(x, y);
        break;
      case 'addProjection':
        addProjectionNode(x, y);
        break;
      case 'addStreet':
        addStreetNode(x, y);
        break;
      case 'select':
        selectNodeAtPosition(x, y);
        break;
      case 'connect':
        handleConnectClick(x, y);
        break;
      case 'connectBidirectional':
        handleConnectBidirectionalClick(x, y);
        break;
      case 'delete':
        console.log('Delete mode in handleCanvasClick - skipping to avoid duplication');
        break;
      default:
        break;
    }
  };

  // Handle clicks in bidirectional connect mode
  const handleConnectBidirectionalClick = (x, y) => {
    const node = findNodeAtPosition(x, y);

    if (node) {
      if (!pendingConnection) {
        // First node click - start connection
        setConnectStartNode(node);
        setPendingConnection(true);
      } else if (connectStartNode && node.id !== connectStartNode.id) {
        // Second node click - complete bidirectional connection if it's a different node
        
        // Check if either node is a Bank node
        const isSourceBank = connectStartNode.type === 'bank';
        const isTargetBank = node.type === 'bank';

        // If neither node is a Bank node, prevent the connection
        if (!isSourceBank && !isTargetBank) {
          setError('Error: Cannot connect non-Bank nodes to each other');
          setTimeout(() => setError(null), 3000);
          setPendingConnection(false);
          setConnectStartNode(null);
          return;
        }

        // Check if trying to connect a Bank node with a Projection node
        const isProjectionConnection =
          (connectStartNode.type === 'bank' && node.type === 'projection') ||
          (connectStartNode.type === 'projection' && node.type === 'bank');

        if (isProjectionConnection) {
          // Determine which node is which
          const bankNode = connectStartNode.type === 'bank' ? connectStartNode : node;
          const projectionNode = connectStartNode.type === 'projection' ? connectStartNode : node;

          // Extract the entity from the Projection node name (4 characters after PRJ_)
          const projectionNameParts = projectionNode.properties.name.split('_');
          const projectionEntity = projectionNameParts.length > 1 ? projectionNameParts[1] : '';

          // Compare with the Bank node's entity property
          if (projectionEntity !== bankNode.properties.entity) {
            setError(`Error: Projection entity (${projectionEntity}) must match Bank entity (${bankNode.properties.entity})`);
            setTimeout(() => setError(null), 3000);
            setPendingConnection(false);
            setConnectStartNode(null);
            return;
          }
        }

        // Create connections in both directions
        const sourceToTargetExists = edges.some(
          edge => edge.source === connectStartNode.id && edge.target === node.id
        );

        const targetToSourceExists = edges.some(
          edge => edge.source === node.id && edge.target === connectStartNode.id
        );

        const newEdges = [];

        // Create first direction edge (source -> target) if it doesn't exist
        if (!sourceToTargetExists) {
          // Create the first direction edge
          const firstEdge = createEdge(connectStartNode, node);
          newEdges.push(firstEdge);
        }

        // Create second direction edge (target -> source) if it doesn't exist
        if (!targetToSourceExists) {
          // Create the second direction edge
          const secondEdge = createEdge(node, connectStartNode);
          newEdges.push(secondEdge);
        }

        // Apply node property updates for both connections
        let updatedNodes = [...nodes];

        // Check for special node connections and update node properties
        const isBankToCreditLine =
          (connectStartNode.type === 'bank' && node.type === 'creditLine') ||
          (node.type === 'bank' && connectStartNode.type === 'creditLine');

        const isBankToProjection =
          (connectStartNode.type === 'bank' && node.type === 'projection') ||
          (node.type === 'projection' && connectStartNode.type === 'bank');

        const isBankToStreet =
          (connectStartNode.type === 'bank' && node.type === 'street') ||
          (node.type === 'street' && connectStartNode.type === 'bank');

        if (isBankToCreditLine) {
          // Determine which node is which
          const bankNode = connectStartNode.type === 'bank' ? connectStartNode : node;
          const creditLineNode = connectStartNode.type === 'creditLine' ? connectStartNode : node;

          // Update the Bank node's creditLine property
          updatedNodes = updatedNodes.map((n) => {
            if (n.id === bankNode.id) {
              return {
                ...n,
                properties: {
                  ...n.properties,
                  creditLine: creditLineNode.properties.name,
                },
              };
            }
            return n;
          });
        } else if (isBankToProjection) {
          // Determine which node is which
          const bankNode = connectStartNode.type === 'bank' ? connectStartNode : node;

          // Update the Bank node's projectionAware property
          updatedNodes = updatedNodes.map((n) => {
            if (n.id === bankNode.id) {
              return {
                ...n,
                properties: {
                  ...n.properties,
                  projectionAware: true,
                },
              };
            }
            return n;
          });
        } else if (isBankToStreet) {
          // Determine which node is which
          const bankNode = connectStartNode.type === 'bank' ? connectStartNode : node;

          // Update the Bank node's streetCover property
          updatedNodes = updatedNodes.map((n) => {
            if (n.id === bankNode.id) {
              return {
                ...n,
                properties: {
                  ...n.properties,
                  streetCover: true,
                },
              };
            }
            return n;
          });
        }

        // Update nodes state
        setNodes(updatedNodes);

        // Update selected node if it was modified
        if (selectedNode) {
          const nodeTypes = [connectStartNode.type, node.type];
          if (nodeTypes.includes('bank') && (nodeTypes.includes('creditLine') || nodeTypes.includes('projection') || nodeTypes.includes('street'))) {
            const bankNodeId = connectStartNode.type === 'bank' ? connectStartNode.id : node.id;
            if (selectedNode.id === bankNodeId) {
              const updatedNode = updatedNodes.find((n) => n.id === bankNodeId);
              setSelectedNode(updatedNode);
              setSelectedElement({ type: 'node', data: updatedNode });
            }
          }
        }

        // Add the new edges to the existing edges
        if (newEdges.length > 0) {
          setEdges([...edges, ...newEdges]);
        }

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

  // Helper function to create an edge with appropriate properties
  const createEdge = (sourceNode, targetNode) => {
    // Generate a unique ID for the edge
    const edgeId = `${sourceNode.id}-${targetNode.id}`;

    // Create a default flowId based on the node types
    let flowId = 'FLOW_' + Date.now().toString();

    // Check for special node connections
    const isBankToCreditLine =
      (sourceNode.type === 'bank' && targetNode.type === 'creditLine') ||
      (sourceNode.type === 'creditLine' && targetNode.type === 'bank');

    const isBankToProjection =
      (sourceNode.type === 'bank' && targetNode.type === 'projection') ||
      (sourceNode.type === 'projection' && targetNode.type === 'bank');

    const isBankToStreet =
      (sourceNode.type === 'bank' && targetNode.type === 'street') ||
      (sourceNode.type === 'street' && targetNode.type === 'bank');

    // Set appropriate flowId based on connection type
    if (sourceNode.type === 'bank' && targetNode.type === 'creditLine') {
      flowId = `${sourceNode.properties.bankId}_${targetNode.properties.name}`;
    } else if (targetNode.type === 'bank' && sourceNode.type === 'creditLine') {
      flowId = `${targetNode.properties.bankId}_${sourceNode.properties.name}`;
    } else if (sourceNode.type === 'bank' && targetNode.type === 'projection') {
      flowId = `${sourceNode.properties.bankId}_${targetNode.properties.name}`;
    } else if (targetNode.type === 'bank' && sourceNode.type === 'projection') {
      flowId = `${targetNode.properties.bankId}_${sourceNode.properties.name}`;
    } else if (sourceNode.type === 'bank' && targetNode.type === 'street') {
      flowId = `${sourceNode.properties.bankId}_STREET`;
    } else if (targetNode.type === 'bank' && sourceNode.type === 'street') {
      flowId = `${targetNode.properties.bankId}_STREET`;
    } else {
      // For other connections, use bankIds if available
      const sourceId = sourceNode.properties.bankId || (sourceNode.properties.name || 'NODE');
      const targetId = targetNode.properties.bankId || (targetNode.properties.name || 'NODE');
      flowId = `${sourceId}_${targetId}`;
    }

    // Determine the appropriate cost based on connection type
    let cost = 4; // Default cost

    // Bank to Credit Line or Projection Node: cost = 1
    if (isBankToCreditLine || isBankToProjection) {
      cost = 1;
    }
    // Bank to Street Node: cost = 1000
    else if (isBankToStreet) {
      cost = 1000;
    }

    // Create and return the edge object
    return {
      id: edgeId,
      source: sourceNode.id,
      target: targetNode.id,
      properties: {
        flowId: flowId,
        cost: cost,
        flowType: 'INTRABANK',
      },
    };
  };

  // Handle clicks in connect mode
  const handleConnectClick = (x, y) => {
    const node = findNodeAtPosition(x, y);

    if (node) {
      if (!pendingConnection) {
        // First node click - start connection
        setConnectStartNode(node);
        setPendingConnection(true);
      } else if (connectStartNode && node.id !== connectStartNode.id) {
        // Second node click - complete connection if it's a different node
        // Check if this specific direction edge already exists
        // We now allow both directions (A→B and B→A) as separate edges
        const edgeExists = edges.some(
          edge =>
            (edge.source === connectStartNode.id && edge.target === node.id)
            // Note: We're only checking this specific direction (connectStartNode → node)
            // This allows creating the reverse connection (node → connectStartNode) separately
        );

        if (!edgeExists) {
          const sourceNode = connectStartNode;
          const targetNode = node;

          // Check if trying to connect non-Bank nodes to each other
          const isSourceBank = sourceNode.type === 'bank';
          const isTargetBank = targetNode.type === 'bank';

          // If neither node is a Bank node, prevent the connection
          if (!isSourceBank && !isTargetBank) {
            setError('Error: Cannot connect non-Bank nodes to each other');
            setTimeout(() => setError(null), 3000);
            setPendingConnection(false);
            setConnectStartNode(null);
            return;
          }

          // Check if trying to connect a Bank node with a Projection node
          const isProjectionConnection =
            (sourceNode.type === 'bank' && targetNode.type === 'projection') ||
            (sourceNode.type === 'projection' && targetNode.type === 'bank');

          if (isProjectionConnection) {
            // Determine which node is which
            const bankNode = sourceNode.type === 'bank' ? sourceNode : targetNode;
            const projectionNode = sourceNode.type === 'projection' ? sourceNode : targetNode;

            // Extract the entity from the Projection node name (4 characters after PRJ_)
            const projectionNameParts = projectionNode.properties.name.split('_');
            const projectionEntity = projectionNameParts.length > 1 ? projectionNameParts[1] : '';

            // Compare with the Bank node's entity property
            if (projectionEntity !== bankNode.properties.entity) {
              setError(`Error: Projection entity (${projectionEntity}) must match Bank entity (${bankNode.properties.entity})`);
              setTimeout(() => setError(null), 3000);
              setPendingConnection(false);
              setConnectStartNode(null);
              return;
            }
          }

          // Generate a unique ID for the edge
          const edgeId = Date.now().toString();

          // Create a default flowId based on the node types
          let flowId = 'FLOW_' + edgeId;

          // Check for special node connections
          const isBankToCreditLine =
            (sourceNode.type === 'bank' && targetNode.type === 'creditLine') ||
            (sourceNode.type === 'creditLine' && targetNode.type === 'bank');

          const isBankToProjection =
            (sourceNode.type === 'bank' && targetNode.type === 'projection') ||
            (sourceNode.type === 'projection' && targetNode.type === 'bank');

          const isBankToStreet =
            (sourceNode.type === 'bank' && targetNode.type === 'street') ||
            (sourceNode.type === 'street' && targetNode.type === 'bank');

          // If connecting a Bank node with a Credit Line node, update the Bank node's creditLine property
          if (isBankToCreditLine) {
            // Determine which node is which
            const bankNode = sourceNode.type === 'bank' ? sourceNode : targetNode;
            const creditLineNode = sourceNode.type === 'creditLine' ? sourceNode : targetNode;

            // Update the Bank node's creditLine property with the Credit Line node's name
            const updatedNodes = nodes.map((n) => {
              if (n.id === bankNode.id) {
                return {
                  ...n,
                  properties: {
                    ...n.properties,
                    creditLine: creditLineNode.properties.name,
                  },
                };
              }
              return n;
            });

            setNodes(updatedNodes);

            // If the selected node is the Bank node being updated, update the selection
            if (selectedNode && selectedNode.id === bankNode.id) {
              const updatedNode = updatedNodes.find((n) => n.id === bankNode.id);
              setSelectedNode(updatedNode);
              setSelectedElement({ type: 'node', data: updatedNode });
            }

            // Create flowId using the node identifiers
            if (sourceNode.type === 'bank' && targetNode.type === 'creditLine') {
              flowId = `${sourceNode.properties.bankId}_${targetNode.properties.name}`;
            } else {
              flowId = `${targetNode.properties.bankId}_${sourceNode.properties.name}`;
            }
          }
          // If connecting a Bank node with a Projection node, set the Bank node's projectionAware to true
          else if (isBankToProjection) {
            // Determine which node is which
            const bankNode = sourceNode.type === 'bank' ? sourceNode : targetNode;
            const projectionNode = sourceNode.type === 'projection' ? sourceNode : targetNode;

            // Update the Bank node's projectionAware property to true
            const updatedNodes = nodes.map((n) => {
              if (n.id === bankNode.id) {
                return {
                  ...n,
                  properties: {
                    ...n.properties,
                    projectionAware: true,
                  },
                };
              }
              return n;
            });

            setNodes(updatedNodes);

            // If the selected node is the Bank node being updated, update the selection
            if (selectedNode && selectedNode.id === bankNode.id) {
              const updatedNode = updatedNodes.find((n) => n.id === bankNode.id);
              setSelectedNode(updatedNode);
              setSelectedElement({ type: 'node', data: updatedNode });
            }

            // Create flowId using the node identifiers
            if (sourceNode.type === 'bank' && targetNode.type === 'projection') {
              flowId = `${sourceNode.properties.bankId}_${targetNode.properties.name}`;
            } else {
              flowId = `${targetNode.properties.bankId}_${sourceNode.properties.name}`;
            }
          }
          // If connecting a Bank node with a Street node, set the Bank node's streetCover to true
          else if (isBankToStreet) {
            // Determine which node is which
            const bankNode = sourceNode.type === 'bank' ? sourceNode : targetNode;
            const streetNode = sourceNode.type === 'street' ? sourceNode : targetNode;

            // Update the Bank node's streetCover property to true
            const updatedNodes = nodes.map((n) => {
              if (n.id === bankNode.id) {
                return {
                  ...n,
                  properties: {
                    ...n.properties,
                    streetCover: true,
                  },
                };
              }
              return n;
            });

            setNodes(updatedNodes);

            // If the selected node is the Bank node being updated, update the selection
            if (selectedNode && selectedNode.id === bankNode.id) {
              const updatedNode = updatedNodes.find((n) => n.id === bankNode.id);
              setSelectedNode(updatedNode);
              setSelectedElement({ type: 'node', data: updatedNode });
            }

            // Create flowId using the node identifiers
            if (sourceNode.type === 'bank' && targetNode.type === 'street') {
              flowId = `${sourceNode.properties.bankId}_STREET`;
            } else {
              flowId = `${targetNode.properties.bankId}_STREET`;
            }
          } else {
            // For other connections, use bankIds if available
            const sourceId = sourceNode.properties.bankId || (sourceNode.properties.name || 'NODE');
            const targetId = targetNode.properties.bankId || (targetNode.properties.name || 'NODE');
            flowId = `${sourceId}_${targetId}`;
          }

          // Determine the appropriate cost based on connection type
          let cost = 4; // Default cost

          // Bank to Credit Line or Projection Node: cost = 1
          if (isBankToCreditLine || isBankToProjection) {
            cost = 1;
          }
          // Bank to Street Node: cost = 1000
          else if (isBankToStreet) {
            cost = 1000;
          }

          const newEdge = createEdge(connectStartNode, node);
          setEdges([...edges, newEdge]);
        }

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

  // Add a new Bank node at the specified position
  const addBankNode = (x, y) => {
    // Generate a sequential bankId
    const bankId = `BANK${nextBankId}`;

    // Increment the bankId counter for next node
    setNextBankId(nextBankId + 1);

    const newNode = {
      id: Date.now().toString(),
      x,
      y,
      type: 'bank',
      properties: {
        bankId: bankId,
        entity: 'GSCO',
        routingCode: 'HATRUS33',
        currency: 'USD',
        projected: 500,
        actual: 200,
        min: 100,
        max: 900,
        creditLine: null,
        beneficialLocation: false,
        projectionAware: false,
        streetCover: false,
      },
    };
    setNodes([...nodes, newNode]);
  };

  // Add a new Credit Line node at the specified position
  const addCreditLineNode = (x, y) => {
    // Generate a sequential credit line ID
    const clId = `CL${nextCreditLineId}`;
    setNextCreditLineId(nextCreditLineId + 1);

    const newNode = {
      id: Date.now().toString(),
      x,
      y,
      type: 'creditLine',
      properties: {
        name: clId,
        amount: 1000,
      },
    };
    setNodes([...nodes, newNode]);
  };

  // Add a new Projection node at the specified position
  const addProjectionNode = (x, y) => {
    // Generate a sequential projection ID
    const projName = `PRJ_ENT${nextProjectionId}`;
    setNextProjectionId(nextProjectionId + 1);

    const newNode = {
      id: Date.now().toString(),
      x,
      y,
      type: 'projection',
      properties: {
        name: projName,
        amount: 1000,
      },
    };
    setNodes([...nodes, newNode]);
  };

  // Add a new Street node at the specified position
  const addStreetNode = (x, y) => {
    const streetNodeExists = nodes.some((node) => node.type === 'street');

    if (streetNodeExists) {
      setError('Error: Only one Street node is allowed');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const newNode = {
      id: Date.now().toString(),
      x,
      y,
      type: 'street',
      properties: {},
    };
    setNodes([...nodes, newNode]);
  };

  // Find a node at the specified position
  const findNodeAtPosition = (x, y) => {
    return nodes.find((node) => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= NODE_RADIUS;
    });
  };

  // Select a node at the specified position
  const selectNodeAtPosition = (x, y) => {
    const node = findNodeAtPosition(x, y);
    if (node) {
      setSelectedNode(node);
      setSelectedEdge(null);
      setSelectedElement({ type: 'node', data: node });
    } else {
      // Check if an edge was clicked
      const edge = findEdgeAtPosition(x, y);
      if (edge) {
        setSelectedNode(null);
        setSelectedEdge(edge);
        setSelectedElement({ type: 'edge', data: edge });
      } else {
        setSelectedNode(null);
        setSelectedEdge(null);
        setSelectedElement(null);
      }
    }
  };

  // Find an edge at the specified position
  const findEdgeAtPosition = (x, y) => {
    // Edge detection that works with offset edges
    return edges.find((edge) => {
      const sourceNode = nodes.find((node) => node.id === edge.source);
      const targetNode = nodes.find((node) => node.id === edge.target);

      if (!sourceNode || !targetNode) return false;

      // Check if there's a reverse edge (for bi-directional connections)
      const reverseEdge = edges.some((e) => 
        e.source === edge.target && e.target === edge.source
      );

      // Calculate the angle between nodes
      const angle = Math.atan2(targetNode.y - sourceNode.y, targetNode.x - sourceNode.x);

      // Calculate start and end points with offset if needed
      let startX = sourceNode.x;
      let startY = sourceNode.y;
      let endX = targetNode.x;
      let endY = targetNode.y;

      if (reverseEdge) {
        // Use the same offset logic as in the drawing code
        const offsetDistance = 5; // Match the offset in the drawing code
        const perpX = Math.sin(angle) * offsetDistance;
        const perpY = -Math.cos(angle) * offsetDistance;
        
        startX += perpX;
        startY += perpY;
        endX += perpX;
        endY += perpY;
      }

      // Calculate distance from point to line using the correct start and end points
      const A = x - startX;
      const B = y - startY;
      const C = endX - startX;
      const D = endY - startY;

      const dot = A * C + B * D;
      const len_sq = C * C + D * D;
      let param = -1;

      if (len_sq !== 0) param = dot / len_sq;

      let xx, yy;

      if (param < 0) {
        xx = startX;
        yy = startY;
      } else if (param > 1) {
        xx = endX;
        yy = endY;
      } else {
        xx = startX + param * C;
        yy = startY + param * D;
      }

      const dx = x - xx;
      const dy = y - yy;
      const distance = Math.sqrt(dx * dx + dy * dy);

      return distance < 12; // Slightly increased threshold for easier selection
    });
  };

  // Delete a node at the specified position
  const deleteNodeAtPosition = (x, y) => {
    console.log('deleteNodeAtPosition called with coordinates:', x, y);
    
    const node = findNodeAtPosition(x, y);
    console.log('Node found in deleteNodeAtPosition:', node ? `ID: ${node.id}, Type: ${node.type}` : 'No node found');
    if (node) {
      console.log('Starting node deletion process for node ID:', node.id);
      // Find all edges connected to this node before removing them
      const connectedEdges = edges.filter((edge) => edge.source === node.id || edge.target === node.id);
      console.log('Found connected edges:', connectedEdges.length);

      // Create a copy of the current nodes array to work with
      let updatedNodes = [...nodes];
      console.log('Original nodes count:', nodes.length);

      // Check if the node being deleted is a Credit Line, Projection, or Street node
      if (node.type === 'creditLine' || node.type === 'projection' || node.type === 'street') {
        console.log('Node is a special type:', node.type, '- updating connected bank nodes');
        // For each connected edge, update the connected Bank nodes
        connectedEdges.forEach((edge) => {
          // Find the connected node (either source or target)
          const connectedNodeId = edge.source === node.id ? edge.target : edge.source;
          const connectedNodeIndex = updatedNodes.findIndex((n) => n.id === connectedNodeId);
          const connectedNode = connectedNodeIndex >= 0 ? updatedNodes[connectedNodeIndex] : null;

          // If the connected node is a Bank node, update its properties
          if (connectedNode && connectedNode.type === 'bank') {
            if (node.type === 'creditLine') {
              // Reset creditLine property if the deleted node is a Credit Line
              const updatedNode = {
                ...connectedNode,
                properties: {
                  ...connectedNode.properties,
                  creditLine: null,
                },
              };

              // Update the node in our working copy
              updatedNodes[connectedNodeIndex] = updatedNode;

              // If this node is selected, update the selection
              if (selectedNode && selectedNode.id === connectedNode.id) {
                setSelectedNode(updatedNode);
                setSelectedElement({ type: 'node', data: updatedNode });
              }
            } else if (node.type === 'projection') {
              // Check if there are any other Projection nodes connected to this Bank node
              // We need to exclude the current edge that will be deleted
              const remainingEdges = edges.filter((e) => e !== edge);

              const hasOtherProjectionConnections = remainingEdges.some((e) => {
                // Check if this is a connection between the Bank node and another Projection node
                if (e.source !== connectedNode.id && e.target !== connectedNode.id) {
                  return false; // Not connected to our Bank node
                }

                const otherNodeId = e.source === connectedNode.id ? e.target : e.source;
                const otherNode = nodes.find((n) => n.id === otherNodeId && n.id !== node.id); // Exclude the node being deleted
                return otherNode && otherNode.type === 'projection';
              });

              // If no other Projection connections, set projectionAware to false
              if (!hasOtherProjectionConnections) {
                const updatedNode = {
                  ...connectedNode,
                  properties: {
                    ...connectedNode.properties,
                    projectionAware: false,
                  },
                };

                // Update the node in our working copy
                updatedNodes[connectedNodeIndex] = updatedNode;

                // If this node is selected, update the selection
                if (selectedNode && selectedNode.id === connectedNode.id) {
                  setSelectedNode(updatedNode);
                  setSelectedElement({ type: 'node', data: updatedNode });
                }
              }
            } else if (node.type === 'street') {
              // Check if there are any other Street nodes connected to this Bank node
              // We need to exclude the current edge that will be deleted
              const remainingEdges = edges.filter((e) => e !== edge);

              const hasOtherStreetConnections = remainingEdges.some((e) => {
                // Check if this is a connection between the Bank node and another Street node
                if (e.source !== connectedNode.id && e.target !== connectedNode.id) {
                  return false; // Not connected to our Bank node
                }

                const otherNodeId = e.source === connectedNode.id ? e.target : e.source;
                const otherNode = nodes.find((n) => n.id === otherNodeId && n.id !== node.id); // Exclude the node being deleted
                return otherNode && otherNode.type === 'street';
              });

              // If no other Street connections, set streetCover to false
              if (!hasOtherStreetConnections) {
                const updatedNode = {
                  ...connectedNode,
                  properties: {
                    ...connectedNode.properties,
                    streetCover: false,
                  },
                };

                // Update the node in our working copy
                updatedNodes[connectedNodeIndex] = updatedNode;

                // If this node is selected, update the selection
                if (selectedNode && selectedNode.id === connectedNode.id) {
                  setSelectedNode(updatedNode);
                  setSelectedElement({ type: 'node', data: updatedNode });
                }
              }
            }
          }
        });

        console.log('Finished updating connected bank nodes');
      } else {
        console.log('Node is a regular type:', node.type, '- proceeding with deletion');
      }

      // Remove the node from our working copy
      console.log('About to filter out node ID:', node.id, 'from nodes array');
      updatedNodes = updatedNodes.filter(n => n.id !== node.id);
      console.log('Setting nodes to:', updatedNodes.length, 'nodes (removed node ID:', node.id, ')');
      setNodes(updatedNodes);

      // Remove all edges connected to this node
      const updatedEdges = edges.filter((edge) => edge.source !== node.id && edge.target !== node.id);
      console.log('Setting edges to:', updatedEdges.length, 'edges (removed edges for node ID:', node.id, ')');
      setEdges(updatedEdges);

      // Update selection if the deleted node was selected
      if (selectedNode && selectedNode.id === node.id) {
        setSelectedNode(null);
        setSelectedElement(null);
      }
    }
  };

  // Delete an edge at the specified position
  const deleteEdgeAtPosition = (x, y) => {
    const edge = findEdgeAtPosition(x, y);
    if (edge) {
      console.log('Deleting edge:', edge.id);
      
      // Remove the edge
      const updatedEdges = edges.filter(e => e.id !== edge.id);
      setEdges(updatedEdges);
      
      // Update selection if the deleted edge was selected
      if (selectedEdge && selectedEdge.id === edge.id) {
        setSelectedEdge(null);
        setSelectedElement(null);
      }
      
      return true;
    }
    return false;
  };

  // Handle mouse down for node dragging and panning
  const handleMouseDown = (e) => {
    console.log('Mouse down on canvas');
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoomLevel;
    const y = (e.clientY - rect.top - panOffset.y) / zoomLevel;

    const clickedNode = findNodeAtPosition(x, y);

    if (mode === 'select' && clickedNode) {
      setDraggingNode(clickedNode);
      setDragStart({ x: x - clickedNode.x, y: y - clickedNode.y });
    } else if (mode === 'select' && !clickedNode) {
      // Start panning if clicking on empty space in select mode
      setIsPanning(true);
      setLastPanPosition({ x: e.clientX, y: e.clientY });
    } else if (mode === 'delete') {
      if (clickedNode) {
        // First try to delete a node
        console.log('Delete mode active, attempting to delete node:', clickedNode.id);
        deleteNodeAtPosition(x, y);
        console.log('After deleteNodeAtPosition call');
      } else {
        // If no node was clicked, try to delete an edge
        const edgeDeleted = deleteEdgeAtPosition(x, y);
        if (edgeDeleted) {
          console.log('Edge deleted successfully');
        } else {
          console.log('No node or edge found at position');
        }
      }
    }
  };

  // Handle mouse move for node dragging and panning
  const handleMouseMove = (e) => {
    if (draggingNode) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - panOffset.x) / zoomLevel;
      const y = (e.clientY - rect.top - panOffset.y) / zoomLevel;

      setNodes(
        nodes.map((node) =>
          node.id === draggingNode.id
            ? { ...node, x: x - dragStart.x, y: y - dragStart.y }
            : node
        )
      );

      // If this node is selected, update the selected node as well
      if (selectedNode && selectedNode.id === draggingNode.id) {
        setSelectedNode({ ...selectedNode, x: x - dragStart.x, y: y - dragStart.y });
        setSelectedElement({ type: 'node', data: { ...selectedNode, x: x - dragStart.x, y: y - dragStart.y } });
      }
    } else if (isPanning) {
      const dx = e.clientX - lastPanPosition.x;
      const dy = e.clientY - lastPanPosition.y;
      setPanOffset({ x: panOffset.x + dx, y: panOffset.y + dy });
      setLastPanPosition({ x: e.clientX, y: e.clientY });
    }

    // For pending connection line rendering
    if (mode === 'connect' && connectStartNode && pendingConnection) {
      window.mouseX = e.clientX;
      window.mouseY = e.clientY;
      // Force redraw (though useEffect on pendingConnection changing should handle it)
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        // This is a bit of a hack, ideally state change triggers redraw
        drawGraph(ctx, canvas.width, canvas.height);
      }
    }
  };

  // Handle mouse up for node dragging and panning
  const handleMouseUp = (e) => {
    setDraggingNode(null);
    setIsPanning(false);
  };

  // Handle mouse wheel for zooming
  const handleWheel = (e) => {
    e.preventDefault();
    const scaleAmount = 1.1;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Mouse position relative to canvas top-left
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate new zoom level
    let newZoomLevel;
    if (e.deltaY < 0) {
      newZoomLevel = zoomLevel * scaleAmount; // Zoom in
    } else {
      newZoomLevel = zoomLevel / scaleAmount; // Zoom out
    }
    newZoomLevel = Math.max(0.1, Math.min(newZoomLevel, 5)); // Clamp zoom level

    // Calculate the new panOffset to zoom towards the mouse cursor
    // Position of the mouse in world coordinates before zoom
    const worldXBeforeZoom = (mouseX - panOffset.x) / zoomLevel;
    const worldYBeforeZoom = (mouseY - panOffset.y) / zoomLevel;

    // New pan offset
    const newPanX = mouseX - worldXBeforeZoom * newZoomLevel;
    const newPanY = mouseY - worldYBeforeZoom * newZoomLevel;

    setZoomLevel(newZoomLevel);
    setPanOffset({ x: newPanX, y: newPanY });
  };

  // Centralized drawing function
  const drawGraph = (ctx, width, height) => {
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    // Apply pan and zoom
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);

    // Draw edges (same logic as before, ensure coordinates are world coordinates)
    edges.forEach((edge) => {
      const sourceNode = nodes.find((node) => node.id === edge.source);
      const targetNode = nodes.find((node) => node.id === edge.target);

      if (sourceNode && targetNode) {
        // Check if there's a reverse edge (bi-directional connection)
        const reverseEdge = edges.find(e => 
          e.source === edge.target && e.target === edge.source
        );
        
        // Calculate the angle between nodes
        const angle = Math.atan2(targetNode.y - sourceNode.y, targetNode.x - sourceNode.x);
        
        // Apply offset for bi-directional edges
        let startX = sourceNode.x;
        let startY = sourceNode.y;
        let endX = targetNode.x;
        let endY = targetNode.y;
        
        if (reverseEdge) {
          // Offset perpendicular to the line between nodes
          const offsetDistance = 5; // Adjust as needed
          const perpX = Math.sin(angle) * offsetDistance;
          const perpY = -Math.cos(angle) * offsetDistance;
          
          startX += perpX;
          startY += perpY;
          endX += perpX;
          endY += perpY;
        }
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = selectedEdge && edge.id === selectedEdge.id ? '#1976d2' : '#999'; // Highlight selected edge
        ctx.lineWidth = selectedEdge && edge.id === selectedEdge.id ? 3 : 2;
        ctx.stroke();

        // Draw arrowhead before reaching the target node to prevent overlap
        const arrowAngle = Math.atan2(endY - startY, endX - startX);
        const arrowLength = 8; // Reduced arrow length for a more elegant look
        const nodeRadius = NODE_RADIUS; // Use the node radius constant
        
        // Calculate position for the arrowhead - position it at the node's perimeter
        const arrowTipX = endX - Math.cos(arrowAngle) * nodeRadius; // Exactly at node perimeter
        const arrowTipY = endY - Math.sin(arrowAngle) * nodeRadius;

        // Draw the arrowhead
        ctx.beginPath();
        ctx.moveTo(arrowTipX, arrowTipY); // Tip of the arrow before the target node
        ctx.lineTo(
          arrowTipX - arrowLength * Math.cos(arrowAngle - Math.PI / 7), // Narrower angle
          arrowTipY - arrowLength * Math.sin(arrowAngle - Math.PI / 7)
        );
        ctx.lineTo(
          arrowTipX - arrowLength * Math.cos(arrowAngle + Math.PI / 7),
          arrowTipY - arrowLength * Math.sin(arrowAngle + Math.PI / 7)
        );
        ctx.closePath();
        ctx.fillStyle = selectedEdge && edge.id === selectedEdge.id ? '#1976d2' : '#666';
        ctx.fill();
        
        // Add a subtle stroke around the arrowhead
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 0.5; // Thinner stroke for a cleaner look
        ctx.stroke();

        // Calculate midpoint for the cost label
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;

        // Only display the cost as an integer
        if (edge.properties && edge.properties.cost !== undefined) {
          const cost = Math.round(edge.properties.cost);
          const costText = `${cost}`;

          // Adjust font size based on zoom, but keep it readable
          const baseFontSize = 14;
          const dynamicFontSize = Math.max(8, baseFontSize / zoomLevel); // Ensure min font size

          ctx.font = `bold ${dynamicFontSize}px Arial`;

          const textMetrics = ctx.measureText(costText);
          const textWidth = textMetrics.width;
          const textHeight = dynamicFontSize; // Approximate height based on font size

          // Draw label background
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          // Adjust padding for background based on font size
          const padding = 3 / zoomLevel;
          ctx.fillRect(midX - textWidth / 2 - padding, midY - textHeight / 2 - padding, textWidth + 2 * padding, textHeight + 2 * padding);

          // Draw cost label
          ctx.fillStyle = selectedEdge && edge.id === selectedEdge.id ? '#1976d2' : '#333';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(costText, midX, midY);
        }
      }
    });

    // Draw nodes (node.x, node.y are world coordinates)
    nodes.forEach((node) => {
      ctx.beginPath();
      // Node radius should appear constant on screen, or scale with zoom if desired.
      // For now, let's make it appear constant.
      const visualNodeRadius = NODE_RADIUS; //  If you want it to scale: NODE_RADIUS * zoomLevel (but then arc uses world coords)
      // Correct way if NODE_RADIUS is world size: just use NODE_RADIUS
      ctx.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI);

      let nodeColor, nodeLabel;

      switch (node.type) {
        case 'bank':
          const projected = parseFloat(node.properties.projected) || 0;
          const actual = parseFloat(node.properties.actual) || 0;
          const min = parseFloat(node.properties.min) || 0;
          const max = parseFloat(node.properties.max) || 0;

          if (projected < min || actual < 0) {
            nodeColor = '#ff5252'; // Red
          } else if (projected > max && actual >= 0) {
            nodeColor = '#ffcccb'; // Pale Red (LightCoral)
          } else if (projected >= min && projected <= max && actual >= 0) {
            nodeColor = '#4caf50'; // Green
          } else {
            nodeColor = '#e0e0e0'; // Light gray
          }
          nodeLabel = node.properties.bankId;
          break;

        case 'creditLine':
          nodeColor = '#9c27b0'; // Purple for credit line
          nodeLabel = node.properties.name;
          break;

        case 'projection':
          nodeColor = '#ff9800'; // Orange for projection
          nodeLabel = node.properties.name;
          break;

        case 'street':
          nodeColor = '#795548'; // Brown for street
          nodeLabel = 'STREET';
          break;

        default:
          nodeColor = '#e0e0e0'; // Light gray default
          nodeLabel = '';
      }

      if (selectedNode && node.id === selectedNode.id) {
        // Simple but effective selection effect
        ctx.save();
        
        // Strong glow effect
        ctx.shadowColor = nodeColor;
        ctx.shadowBlur = 15 / zoomLevel;
        
        // Simple double ring effect
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_RADIUS * 1.3, 0, 2 * Math.PI);
        ctx.strokeStyle = '#ffffff'; // White outer ring
        ctx.lineWidth = 3 / zoomLevel;
        ctx.globalAlpha = 0.8;
        ctx.stroke();
        
        // Inner ring with node color
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_RADIUS * 1.15, 0, 2 * Math.PI);
        ctx.strokeStyle = nodeColor;
        ctx.lineWidth = 2 / zoomLevel;
        ctx.globalAlpha = 1;
        ctx.stroke();
        
        ctx.restore();
      }
      
      // Always set the fill style for the node (whether selected or not)
      ctx.fillStyle = nodeColor;
      ctx.shadowBlur = selectedNode && node.id === selectedNode.id ? 15 / zoomLevel : 0;
      ctx.shadowColor = selectedNode && node.id === selectedNode.id ? nodeColor : 'transparent';
      ctx.fill();
      ctx.strokeStyle = '#333';
      // Make lineWidth appear constant on screen
      ctx.lineWidth = 2 / zoomLevel;
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow

      // Draw node label (adjust font size)
      const baseNodeFontSize = 12;
      const dynamicNodeFontSize = Math.max(6, baseNodeFontSize / zoomLevel);
      ctx.fillStyle = '#000';
      ctx.font = `${dynamicNodeFontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(nodeLabel, node.x, node.y);
    });

    // Draw connection line when in connect mode
    if (mode === 'connect' && connectStartNode && pendingConnection) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      // Mouse coordinates need to be transformed to world space for the line end
      const mouseXWorld = (window.mouseX - rect.left - panOffset.x) / zoomLevel;
      const mouseYWorld = (window.mouseY - rect.top - panOffset.y) / zoomLevel;

      ctx.beginPath();
      ctx.moveTo(connectStartNode.x, connectStartNode.y);
      ctx.lineTo(mouseXWorld, mouseYWorld);
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 1 / zoomLevel;
      ctx.setLineDash([5 / zoomLevel, 3 / zoomLevel]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(connectStartNode.x, connectStartNode.y, (NODE_RADIUS + 5), 0, 2 * Math.PI);
      ctx.strokeStyle = '#4caf50';
      ctx.lineWidth = 2 / zoomLevel;
      ctx.stroke();
    }
    ctx.restore(); // Restore context to pre-transform state
  };

  // Render the graph
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    drawGraph(ctx, canvas.width, canvas.height); // Call the centralized drawing function

  }, [nodes, edges, selectedNode, selectedEdge, connectStartNode, pendingConnection, mode, zoomLevel, panOffset]); // Add zoomLevel and panOffset to dependencies

  // Track mouse position for drawing connection line
  useEffect(() => {
    const trackMouse = (e) => {
      window.mouseX = e.clientX;
      window.mouseY = e.clientY;
    };

    window.addEventListener('mousemove', trackMouse);

    return () => {
      window.removeEventListener('mousemove', trackMouse);
    };
  }, []);

  // Set canvas size and add wheel event listener
  useEffect(() => {
    const canvas = canvasRef.current;
    const resizeCanvas = () => {
      if (canvas) {
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        // Redraw on resize
        const ctx = canvas.getContext('2d');
        drawGraph(ctx, canvas.width, canvas.height);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('wheel', handleWheel, { passive: false }); // Add wheel listener

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('wheel', handleWheel); // Clean up wheel listener
    };
  }, [drawGraph]); // drawGraph is now a dependency if its definition changes

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    // Get the current state of the graph in a structured format
    getGraphState: () => {
      // Clean up and extract only the properties from nodes
      const extractNodeProperties = (node) => ({
        ...node.properties,
        id: node.id,
        type: node.type,
      });

      // Clean up and extract only the properties from edges
      const extractEdgeProperties = (edge) => ({
        ...edge.properties,
        id: edge.id,
        source: edge.source,
        target: edge.target,
      });

      // Categorize nodes by type and extract only their properties
      const bankNodes = nodes
        .filter((node) => node.type === 'bank')
        .map(extractNodeProperties);

      const creditLineNodes = nodes
        .filter((node) => node.type === 'creditLine')
        .map(extractNodeProperties);

      const projectionNodes = nodes
        .filter((node) => node.type === 'projection')
        .map(extractNodeProperties);

      const streetNodes = nodes
        .filter((node) => node.type === 'street')
        .map(extractNodeProperties);

      // Extract only the properties from edges
      const cleanEdges = edges.map(extractEdgeProperties);

      return {
        bankNodes,
        creditLineNodes,
        projectionNodes,
        streetNodes,
        edges: cleanEdges,
      };
    },
    updateNodeProperties: (nodeId, updatedProperties, additionalInfo) => {
      // Get the node being updated
      const nodeToUpdate = nodes.find((node) => node.id === nodeId);

      // Check if this is a Projection node and name is being updated
      if (nodeToUpdate && nodeToUpdate.type === 'projection' && updatedProperties.name !== undefined) {
        // Validate that the name follows the format PRJ_XXXX where X is alphanumeric
        const projectionNameRegex = /^PRJ_[A-Za-z0-9]{4}$/;
        if (!projectionNameRegex.test(updatedProperties.name)) {
          setError('Error: Projection node name must follow format PRJ_XXXX where X is alphanumeric');
          setTimeout(() => setError(null), 3000);
          return;
        }

        // Check if the projection name already exists in another node
        const nameExists = nodes.some((node) =>
          node.id !== nodeId &&
          node.type === 'projection' &&
          node.properties.name === updatedProperties.name
        );

        if (nameExists) {
          setError('Error: A Projection node with this name already exists');
          setTimeout(() => setError(null), 3000);
          return;
        }
      }

      // Check if this is a Credit Line node and name is being updated
      if (nodeToUpdate && nodeToUpdate.type === 'creditLine' && updatedProperties.name !== undefined) {
        // Check if the credit line name already exists in another node
        const nameExists = nodes.some((node) =>
          node.id !== nodeId &&
          node.type === 'creditLine' &&
          node.properties.name === updatedProperties.name
        );

        if (nameExists) {
          setError('Error: A Credit Line node with this name already exists');
          setTimeout(() => setError(null), 3000);
          return;
        }
      }

      let updatedNodes = nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, properties: updatedProperties };
        }
        return node;
      });

      // Special handling for Credit Line name changes
      if (additionalInfo && additionalInfo.type === 'creditLineNameChange') {
        const oldName = additionalInfo.oldName;
        const newName = additionalInfo.newName;

        // Find all Bank nodes connected to this Credit Line node
        const creditLineNode = nodes.find((node) => node.id === nodeId);
        if (creditLineNode) {
          // Find all edges connected to this Credit Line node
          const connectedEdges = edges.filter((edge) =>
            edge.source === nodeId || edge.target === nodeId
          );

          // For each connected edge, check if it connects to a Bank node
          connectedEdges.forEach((edge) => {
            // Find the connected node (either source or target)
            const connectedNodeId = edge.source === nodeId ? edge.target : edge.source;
            const connectedNodeIndex = updatedNodes.findIndex((n) => n.id === connectedNodeId);
            const connectedNode = connectedNodeIndex >= 0 ? updatedNodes[connectedNodeIndex] : null;

            // If the connected node is a Bank node with creditLine matching the old name, update it
            if (connectedNode && connectedNode.type === 'bank' && connectedNode.properties.creditLine === oldName) {
              // Update the Bank node's creditLine property
              updatedNodes = updatedNodes.map((node) => {
                if (node.id === connectedNode.id) {
                  return {
                    ...node,
                    properties: {
                      ...node.properties,
                      creditLine: newName,
                    },
                  };
                }
                return node;
              });

              // Also update the flowId of the edge
              const updatedEdge = {
                ...edge,
                properties: {
                  ...edge.properties,
                  flowId: edge.properties.flowId.replace(oldName, newName),
                },
              };

              setEdges(edges.map((e) => e.id === edge.id ? updatedEdge : e));
            }
          });
        }
      }

      // Check if a Bank node's entity is being changed
      if (nodeToUpdate && nodeToUpdate.type === 'bank' && updatedProperties.entity !== undefined && updatedProperties.entity !== nodeToUpdate.properties.entity) {
        // Find all edges connected to this Bank node
        const connectedEdges = edges.filter((edge) =>
          edge.source === nodeId || edge.target === nodeId
        );

        // Find edges that connect to Projection nodes
        const edgesToRemove = [];

        connectedEdges.forEach((edge) => {
          const connectedNodeId = edge.source === nodeId ? edge.target : edge.source;
          const connectedNode = nodes.find((node) => node.id === connectedNodeId);

          // If the connected node is a Projection node, check entity matching
          if (connectedNode && connectedNode.type === 'projection') {
            // Extract the entity from the Projection node name
            const projectionNameParts = connectedNode.properties.name.split('_');
            const projectionEntity = projectionNameParts.length > 1 ? projectionNameParts[1] : '';

            // If entities don't match, mark the edge for removal
            if (projectionEntity !== updatedProperties.entity) {
              edgesToRemove.push(edge.id);

              // Also update the Bank node's projectionAware property if needed
              // Check if there are any other Projection nodes connected to this Bank node
              const hasOtherProjectionConnections = edges.some((e) => {
                // Skip the current edge that will be deleted
                if (e === edge) return false;

                // Check if this is a connection between the Bank node and another Projection node
                const otherNodeId = e.source === nodeId ? e.target : e.source;
                const otherNode = nodes.find((n) => n.id === otherNodeId);
                return otherNode && otherNode.type === 'projection';
              });

              // If no other Projection connections, set projectionAware to false
              if (!hasOtherProjectionConnections) {
                updatedProperties = {
                  ...updatedProperties,
                  projectionAware: false,
                };
              }
            }
          }
        });

        // Remove the edges that no longer satisfy entity matching
        if (edgesToRemove.length > 0) {
          setEdges(edges.filter((edge) => !edgesToRemove.includes(edge.id)));
          setError(`Removed ${edgesToRemove.length} connection(s) due to entity mismatch`);
          setTimeout(() => setError(null), 3000);
        }
      }

      // Check if a Projection node's name is being changed
      if (nodeToUpdate && nodeToUpdate.type === 'projection' && updatedProperties.name !== undefined && updatedProperties.name !== nodeToUpdate.properties.name) {
        // Extract the old and new entities
        const oldNameParts = nodeToUpdate.properties.name.split('_');
        const oldEntity = oldNameParts.length > 1 ? oldNameParts[1] : '';

        const newNameParts = updatedProperties.name.split('_');
        const newEntity = newNameParts.length > 1 ? newNameParts[1] : '';

        // If the entity part has changed
        if (oldEntity !== newEntity) {
          // Find all edges connected to this Projection node
          const connectedEdges = edges.filter((edge) =>
            edge.source === nodeId || edge.target === nodeId
          );

          // Find edges that connect to Bank nodes with non-matching entities
          const edgesToRemove = [];

          connectedEdges.forEach((edge) => {
            const connectedNodeId = edge.source === nodeId ? edge.target : edge.source;
            const connectedNode = nodes.find((node) => node.id === connectedNodeId);

            // If the connected node is a Bank node, check entity matching
            if (connectedNode && connectedNode.type === 'bank') {
              // If entities don't match, mark the edge for removal
              if (newEntity !== connectedNode.properties.entity) {
                edgesToRemove.push(edge.id);

                // Update the Bank node's projectionAware property if needed
                // Check if there are any other Projection nodes connected to this Bank node
                const bankNodeId = connectedNode.id;
                const hasOtherProjectionConnections = edges.some((e) => {
                  // Skip the current edge that will be deleted
                  if (e === edge) return false;

                  // Check if this is a connection between the Bank node and another Projection node
                  const isConnectedToBank = e.source === bankNodeId || e.target === bankNodeId;
                  if (!isConnectedToBank) return false;

                  const otherNodeId = e.source === bankNodeId ? e.target : e.source;
                  const otherNode = nodes.find((n) => n.id === otherNodeId);
                  return otherNode && otherNode.type === 'projection';
                });

                // If no other Projection connections, set projectionAware to false
                if (!hasOtherProjectionConnections) {
                  updatedNodes = updatedNodes.map((node) => {
                    if (node.id === bankNodeId) {
                      return {
                        ...node,
                        properties: {
                          ...node.properties,
                          projectionAware: false,
                        },
                      };
                    }
                    return node;
                  });
                }
              }
            }
          });

          // Remove the edges that no longer satisfy entity matching
          if (edgesToRemove.length > 0) {
            setEdges(edges.filter((edge) => !edgesToRemove.includes(edge.id)));
            setError(`Removed ${edgesToRemove.length} connection(s) due to entity mismatch`);
            setTimeout(() => setError(null), 3000);
          }
        }
      }

      setNodes(updatedNodes);

      // Update selected node if it was modified
      if (selectedNode && selectedNode.id === nodeId) {
        const updatedNode = updatedNodes.find((node) => node.id === nodeId);
        setSelectedNode(updatedNode);
        setSelectedElement({ type: 'node', data: updatedNode });
      }
    },
    updateEdgeProperties: (edgeId, updatedProperties) => {
      setEdges(edges.map((edge) => {
        if (edge.id === edgeId) {
          return { ...edge, properties: updatedProperties };
        }
        return edge;
      }));

      // Update selected edge if it was modified
      if (selectedEdge && selectedEdge.id === edgeId) {
        const updatedEdge = edges.find((edge) => edge.id === edgeId);
        setSelectedEdge(updatedEdge);
        setSelectedElement({ type: 'edge', data: updatedEdge });
      }
    },
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
      />
    </div>
  );
});

export default GraphCanvas;
