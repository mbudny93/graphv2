/**
 * Class responsible for deleting nodes and edges
 */
import { NODE_TYPES } from '../utils/GraphConstants';
import nodeSelector from './NodeSelector';

class NodeDeleter {
  /**
   * Delete a node at the specified position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Array} nodes - Array of node objects
   * @param {Array} edges - Array of edge objects
   * @param {Object} selectedNode - Currently selected node
   * @param {Function} setNodes - Function to update nodes
   * @param {Function} setEdges - Function to update edges
   * @param {Function} setSelectedNode - Function to set selected node
   * @param {Function} setSelectedElement - Function to set selected element
   * @returns {boolean} - True if a node was deleted
   */
  deleteNodeAtPosition(
    x, 
    y, 
    nodes, 
    edges, 
    selectedNode, 
    setNodes, 
    setEdges, 
    setSelectedNode, 
    setSelectedElement
  ) {
    const node = nodeSelector.findNodeAtPosition(x, y, nodes);
    
    if (node) {
      // Find all edges connected to this node before removing them
      const connectedEdges = edges.filter((edge) => edge.source === node.id || edge.target === node.id);
      
      // Create a copy of the current nodes array to work with
      let updatedNodes = [...nodes];
      
      // Check if the node being deleted is a Credit Line, Projection, or Street node
      if (node.type === NODE_TYPES.CREDIT_LINE || node.type === NODE_TYPES.PROJECTION || node.type === NODE_TYPES.STREET) {
        // For each connected edge, update the connected Bank nodes
        connectedEdges.forEach((edge) => {
          // Find the connected node (either source or target)
          const connectedNodeId = edge.source === node.id ? edge.target : edge.source;
          const connectedNodeIndex = updatedNodes.findIndex((n) => n.id === connectedNodeId);
          const connectedNode = connectedNodeIndex >= 0 ? updatedNodes[connectedNodeIndex] : null;
          
          // If the connected node is a Bank node, update its properties
          if (connectedNode && connectedNode.type === NODE_TYPES.BANK) {
            if (node.type === NODE_TYPES.CREDIT_LINE) {
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
            } else if (node.type === NODE_TYPES.PROJECTION) {
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
                return otherNode && otherNode.type === NODE_TYPES.PROJECTION;
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
            } else if (node.type === NODE_TYPES.STREET) {
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
                return otherNode && otherNode.type === NODE_TYPES.STREET;
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
      }
      
      // Remove the node from our working copy
      updatedNodes = updatedNodes.filter(n => n.id !== node.id);
      setNodes(updatedNodes);
      
      // Remove all edges connected to this node
      const updatedEdges = edges.filter((edge) => edge.source !== node.id && edge.target !== node.id);
      setEdges(updatedEdges);
      
      // Update selection if the deleted node was selected
      if (selectedNode && selectedNode.id === node.id) {
        setSelectedNode(null);
        setSelectedElement(null);
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Delete an edge at the specified position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Array} nodes - Array of node objects
   * @param {Array} edges - Array of edge objects
   * @param {Object} selectedEdge - Currently selected edge
   * @param {Function} setEdges - Function to update edges
   * @param {Function} setSelectedEdge - Function to set selected edge
   * @param {Function} setSelectedElement - Function to set selected element
   * @returns {boolean} - True if an edge was deleted
   */
  deleteEdgeAtPosition(
    x, 
    y, 
    nodes, 
    edges, 
    selectedEdge, 
    setEdges, 
    setSelectedEdge, 
    setSelectedElement
  ) {
    const edge = nodeSelector.findEdgeAtPosition(x, y, edges, nodes);
    
    if (edge) {
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
  }
}

// Create and export a singleton instance
const nodeDeleter = new NodeDeleter();
export default nodeDeleter;
