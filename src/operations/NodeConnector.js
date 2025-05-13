/**
 * Class responsible for connecting nodes
 */
import { NODE_TYPES, EDGE_PROPERTIES, ERROR_DISPLAY_DURATION } from '../utils/GraphConstants';
import graphStateService from '../services/GraphStateService';

class NodeConnector {
  /**
   * Create an edge between two nodes
   * @param {Object} sourceNode - Source node
   * @param {Object} targetNode - Target node
   * @returns {Object} - The created edge
   */
  createEdge(sourceNode, targetNode) {
    // Generate a unique ID for the edge
    const edgeId = `${sourceNode.id}-${targetNode.id}`;

    // Create a default flowId based on the node types
    let flowId = 'FLOW_' + Date.now().toString();

    // Check for special node connections
    const isBankToCreditLine =
      (sourceNode.type === NODE_TYPES.BANK && targetNode.type === NODE_TYPES.CREDIT_LINE) ||
      (sourceNode.type === NODE_TYPES.CREDIT_LINE && targetNode.type === NODE_TYPES.BANK);

    const isBankToProjection =
      (sourceNode.type === NODE_TYPES.BANK && targetNode.type === NODE_TYPES.PROJECTION) ||
      (sourceNode.type === NODE_TYPES.PROJECTION && targetNode.type === NODE_TYPES.BANK);

    const isBankToStreet =
      (sourceNode.type === NODE_TYPES.BANK && targetNode.type === NODE_TYPES.STREET) ||
      (sourceNode.type === NODE_TYPES.STREET && targetNode.type === NODE_TYPES.BANK);

    // Set appropriate flowId based on connection type
    if (sourceNode.type === NODE_TYPES.BANK && targetNode.type === NODE_TYPES.CREDIT_LINE) {
      flowId = `${sourceNode.properties.bankId}_${targetNode.properties.name}`;
    } else if (targetNode.type === NODE_TYPES.BANK && sourceNode.type === NODE_TYPES.CREDIT_LINE) {
      flowId = `${targetNode.properties.bankId}_${sourceNode.properties.name}`;
    } else if (sourceNode.type === NODE_TYPES.BANK && targetNode.type === NODE_TYPES.PROJECTION) {
      flowId = `${sourceNode.properties.bankId}_${targetNode.properties.name}`;
    } else if (targetNode.type === NODE_TYPES.BANK && sourceNode.type === NODE_TYPES.PROJECTION) {
      flowId = `${targetNode.properties.bankId}_${sourceNode.properties.name}`;
    } else if (sourceNode.type === NODE_TYPES.BANK && targetNode.type === NODE_TYPES.STREET) {
      flowId = `${sourceNode.properties.bankId}_STREET`;
    } else if (targetNode.type === NODE_TYPES.BANK && sourceNode.type === NODE_TYPES.STREET) {
      flowId = `${targetNode.properties.bankId}_STREET`;
    } else {
      // For other connections, use bankIds if available
      const sourceId = sourceNode.properties.bankId || (sourceNode.properties.name || 'NODE');
      const targetId = targetNode.properties.bankId || (targetNode.properties.name || 'NODE');
      flowId = `${sourceId}_${targetId}`;
    }

    // Determine the appropriate cost based on connection type
    let cost = EDGE_PROPERTIES.DEFAULT_COST;

    // Bank to Credit Line or Projection Node: cost = 1
    if (isBankToCreditLine || isBankToProjection) {
      cost = EDGE_PROPERTIES.BANK_TO_CREDIT_LINE_COST;
    }
    // Bank to Street Node: cost = 1000
    else if (isBankToStreet) {
      cost = EDGE_PROPERTIES.BANK_TO_STREET_COST;
    }

    // Create and return the edge object
    return {
      id: edgeId,
      source: sourceNode.id,
      target: targetNode.id,
      properties: {
        flowId: flowId,
        cost: cost,
        flowType: EDGE_PROPERTIES.DEFAULT_FLOW_TYPE,
      },
    };
  }

  /**
   * Handle connecting two nodes
   * @param {Object} startNode - Starting node for the connection
   * @param {Object} endNode - Ending node for the connection
   * @param {Array} nodes - Array of node objects
   * @param {Array} edges - Array of edge objects
   * @param {Function} setNodes - Function to update nodes
   * @param {Function} setEdges - Function to update edges
   * @param {Function} setError - Function to set error message
   * @param {Object} selectedNode - Currently selected node
   * @param {Function} setSelectedNode - Function to set selected node
   * @param {Function} setSelectedElement - Function to set selected element
   * @returns {boolean} - True if the connection was successful
   */
  connectNodes(
    startNode, 
    endNode, 
    nodes, 
    edges, 
    setNodes, 
    setEdges, 
    setError, 
    selectedNode, 
    setSelectedNode, 
    setSelectedElement
  ) {
    // Check if this specific direction edge already exists
    const edgeExists = graphStateService.edgeExists(edges, startNode.id, endNode.id);

    if (edgeExists) {
      return false;
    }

    // Check if either node is a Bank node
    const isSourceBank = startNode.type === NODE_TYPES.BANK;
    const isTargetBank = endNode.type === NODE_TYPES.BANK;

    // If neither node is a Bank node, prevent the connection
    if (!isSourceBank && !isTargetBank) {
      setError('Error: Cannot connect non-Bank nodes to each other');
      setTimeout(() => setError(null), ERROR_DISPLAY_DURATION);
      return false;
    }

    // Check if trying to connect a Bank node with a Projection node
    const isProjectionConnection =
      (startNode.type === NODE_TYPES.BANK && endNode.type === NODE_TYPES.PROJECTION) ||
      (startNode.type === NODE_TYPES.PROJECTION && endNode.type === NODE_TYPES.BANK);

    if (isProjectionConnection) {
      // Determine which node is which
      const bankNode = startNode.type === NODE_TYPES.BANK ? startNode : endNode;
      const projectionNode = startNode.type === NODE_TYPES.PROJECTION ? startNode : endNode;

      // Extract the entity from the Projection node name (4 characters after PRJ_)
      const projectionNameParts = projectionNode.properties.name.split('_');
      const projectionEntity = projectionNameParts.length > 1 ? projectionNameParts[1] : '';

      // Compare with the Bank node's entity property
      if (projectionEntity !== bankNode.properties.entity) {
        setError(`Error: Projection entity (${projectionEntity}) must match Bank entity (${bankNode.properties.entity})`);
        setTimeout(() => setError(null), ERROR_DISPLAY_DURATION);
        return false;
      }
    }

    // Create the new edge
    const newEdge = this.createEdge(startNode, endNode);

    // Apply node property updates based on connection type
    let updatedNodes = [...nodes];

    // Check for special node connections
    const isBankToCreditLine =
      (startNode.type === NODE_TYPES.BANK && endNode.type === NODE_TYPES.CREDIT_LINE) ||
      (endNode.type === NODE_TYPES.BANK && startNode.type === NODE_TYPES.CREDIT_LINE);

    const isBankToProjection =
      (startNode.type === NODE_TYPES.BANK && endNode.type === NODE_TYPES.PROJECTION) ||
      (endNode.type === NODE_TYPES.BANK && startNode.type === NODE_TYPES.PROJECTION);

    const isBankToStreet =
      (startNode.type === NODE_TYPES.BANK && endNode.type === NODE_TYPES.STREET) ||
      (endNode.type === NODE_TYPES.BANK && startNode.type === NODE_TYPES.STREET);

    if (isBankToCreditLine) {
      // Determine which node is which
      const bankNode = startNode.type === NODE_TYPES.BANK ? startNode : endNode;
      const creditLineNode = startNode.type === NODE_TYPES.CREDIT_LINE ? startNode : endNode;

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
      const bankNode = startNode.type === NODE_TYPES.BANK ? startNode : endNode;

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
      const bankNode = startNode.type === NODE_TYPES.BANK ? startNode : endNode;

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
      const nodeTypes = [startNode.type, endNode.type];
      if (nodeTypes.includes(NODE_TYPES.BANK) && 
          (nodeTypes.includes(NODE_TYPES.CREDIT_LINE) || 
           nodeTypes.includes(NODE_TYPES.PROJECTION) || 
           nodeTypes.includes(NODE_TYPES.STREET))) {
        const bankNodeId = startNode.type === NODE_TYPES.BANK ? startNode.id : endNode.id;
        if (selectedNode.id === bankNodeId) {
          const updatedNode = updatedNodes.find((n) => n.id === bankNodeId);
          setSelectedNode(updatedNode);
          setSelectedElement({ type: 'node', data: updatedNode });
        }
      }
    }

    // Add the new edge to the existing edges
    setEdges([...edges, newEdge]);
    
    return true;
  }

  /**
   * Handle connecting two nodes bidirectionally
   * @param {Object} startNode - Starting node for the connection
   * @param {Object} endNode - Ending node for the connection
   * @param {Array} nodes - Array of node objects
   * @param {Array} edges - Array of edge objects
   * @param {Function} setNodes - Function to update nodes
   * @param {Function} setEdges - Function to update edges
   * @param {Function} setError - Function to set error message
   * @param {Object} selectedNode - Currently selected node
   * @param {Function} setSelectedNode - Function to set selected node
   * @param {Function} setSelectedElement - Function to set selected element
   * @returns {boolean} - True if the connection was successful
   */
  connectNodesBidirectional(
    startNode, 
    endNode, 
    nodes, 
    edges, 
    setNodes, 
    setEdges, 
    setError, 
    selectedNode, 
    setSelectedNode, 
    setSelectedElement
  ) {
    // Check if either node is a Bank node
    const isSourceBank = startNode.type === NODE_TYPES.BANK;
    const isTargetBank = endNode.type === NODE_TYPES.BANK;

    // If neither node is a Bank node, prevent the connection
    if (!isSourceBank && !isTargetBank) {
      setError('Error: Cannot connect non-Bank nodes to each other');
      setTimeout(() => setError(null), ERROR_DISPLAY_DURATION);
      return false;
    }

    // Check if trying to connect a Bank node with a Projection node
    const isProjectionConnection =
      (startNode.type === NODE_TYPES.BANK && endNode.type === NODE_TYPES.PROJECTION) ||
      (startNode.type === NODE_TYPES.PROJECTION && endNode.type === NODE_TYPES.BANK);

    if (isProjectionConnection) {
      // Determine which node is which
      const bankNode = startNode.type === NODE_TYPES.BANK ? startNode : endNode;
      const projectionNode = startNode.type === NODE_TYPES.PROJECTION ? startNode : endNode;

      // Extract the entity from the Projection node name (4 characters after PRJ_)
      const projectionNameParts = projectionNode.properties.name.split('_');
      const projectionEntity = projectionNameParts.length > 1 ? projectionNameParts[1] : '';

      // Compare with the Bank node's entity property
      if (projectionEntity !== bankNode.properties.entity) {
        setError(`Error: Projection entity (${projectionEntity}) must match Bank entity (${bankNode.properties.entity})`);
        setTimeout(() => setError(null), ERROR_DISPLAY_DURATION);
        return false;
      }
    }

    // Create connections in both directions
    const sourceToTargetExists = graphStateService.edgeExists(edges, startNode.id, endNode.id);
    const targetToSourceExists = graphStateService.edgeExists(edges, endNode.id, startNode.id);

    const newEdges = [];

    // Create first direction edge (source -> target) if it doesn't exist
    if (!sourceToTargetExists) {
      const firstEdge = this.createEdge(startNode, endNode);
      newEdges.push(firstEdge);
    }

    // Create second direction edge (target -> source) if it doesn't exist
    if (!targetToSourceExists) {
      const secondEdge = this.createEdge(endNode, startNode);
      newEdges.push(secondEdge);
    }

    // Apply node property updates for both connections
    let updatedNodes = [...nodes];

    // Check for special node connections and update node properties
    const isBankToCreditLine =
      (startNode.type === NODE_TYPES.BANK && endNode.type === NODE_TYPES.CREDIT_LINE) ||
      (endNode.type === NODE_TYPES.BANK && startNode.type === NODE_TYPES.CREDIT_LINE);

    const isBankToProjection =
      (startNode.type === NODE_TYPES.BANK && endNode.type === NODE_TYPES.PROJECTION) ||
      (endNode.type === NODE_TYPES.BANK && startNode.type === NODE_TYPES.PROJECTION);

    const isBankToStreet =
      (startNode.type === NODE_TYPES.BANK && endNode.type === NODE_TYPES.STREET) ||
      (endNode.type === NODE_TYPES.BANK && startNode.type === NODE_TYPES.STREET);

    if (isBankToCreditLine) {
      // Determine which node is which
      const bankNode = startNode.type === NODE_TYPES.BANK ? startNode : endNode;
      const creditLineNode = startNode.type === NODE_TYPES.CREDIT_LINE ? startNode : endNode;

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
      const bankNode = startNode.type === NODE_TYPES.BANK ? startNode : endNode;

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
      const bankNode = startNode.type === NODE_TYPES.BANK ? startNode : endNode;

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
      const nodeTypes = [startNode.type, endNode.type];
      if (nodeTypes.includes(NODE_TYPES.BANK) && 
          (nodeTypes.includes(NODE_TYPES.CREDIT_LINE) || 
           nodeTypes.includes(NODE_TYPES.PROJECTION) || 
           nodeTypes.includes(NODE_TYPES.STREET))) {
        const bankNodeId = startNode.type === NODE_TYPES.BANK ? startNode.id : endNode.id;
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
    
    return newEdges.length > 0;
  }
}

// Create and export a singleton instance
const nodeConnector = new NodeConnector();
export default nodeConnector;
