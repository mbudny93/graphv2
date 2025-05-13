/**
 * Service for managing the graph state
 */
import { NODE_TYPES } from '../utils/GraphConstants';

class GraphStateService {
  /**
   * Format the graph state for export or display
   * @param {Array} nodes - Array of node objects
   * @param {Array} edges - Array of edge objects
   * @returns {Object} - Formatted graph state
   */
  formatGraphState(nodes, edges) {
    const bankNodes = nodes.filter(node => node.type === NODE_TYPES.BANK);
    const creditLineNodes = nodes.filter(node => node.type === NODE_TYPES.CREDIT_LINE);
    const projectionNodes = nodes.filter(node => node.type === NODE_TYPES.PROJECTION);
    const streetNodes = nodes.filter(node => node.type === NODE_TYPES.STREET);
    
    return {
      bankNodes: bankNodes.map(node => ({
        id: node.id,
        x: node.x,
        y: node.y,
        properties: { ...node.properties }
      })),
      creditLineNodes: creditLineNodes.map(node => ({
        id: node.id,
        x: node.x,
        y: node.y,
        properties: { ...node.properties }
      })),
      projectionNodes: projectionNodes.map(node => ({
        id: node.id,
        x: node.x,
        y: node.y,
        properties: { ...node.properties }
      })),
      streetNodes: streetNodes.map(node => ({
        id: node.id,
        x: node.x,
        y: node.y,
        properties: { ...node.properties }
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        properties: { ...edge.properties }
      }))
    };
  }

  /**
   * Check if an edge already exists between two nodes
   * @param {Array} edges - Array of edge objects
   * @param {string} sourceId - Source node ID
   * @param {string} targetId - Target node ID
   * @returns {boolean} - True if the edge exists
   */
  edgeExists(edges, sourceId, targetId) {
    return edges.some(edge => edge.source === sourceId && edge.target === targetId);
  }

  /**
   * Check if a bidirectional connection exists between two nodes
   * @param {Array} edges - Array of edge objects
   * @param {string} nodeId1 - First node ID
   * @param {string} nodeId2 - Second node ID
   * @returns {boolean} - True if a bidirectional connection exists
   */
  bidirectionalConnectionExists(edges, nodeId1, nodeId2) {
    const forwardEdge = this.edgeExists(edges, nodeId1, nodeId2);
    const reverseEdge = this.edgeExists(edges, nodeId2, nodeId1);
    return forwardEdge && reverseEdge;
  }

  /**
   * Find a node by its ID
   * @param {Array} nodes - Array of node objects
   * @param {string} nodeId - Node ID to find
   * @returns {Object|null} - The node object or null if not found
   */
  findNodeById(nodes, nodeId) {
    return nodes.find(node => node.id === nodeId) || null;
  }

  /**
   * Find an edge by its ID
   * @param {Array} edges - Array of edge objects
   * @param {string} edgeId - Edge ID to find
   * @returns {Object|null} - The edge object or null if not found
   */
  findEdgeById(edges, edgeId) {
    return edges.find(edge => edge.id === edgeId) || null;
  }

  /**
   * Update a node's properties
   * @param {Array} nodes - Array of node objects
   * @param {string} nodeId - ID of the node to update
   * @param {Object} updatedProperties - New properties to apply
   * @returns {Array} - Updated array of nodes
   */
  updateNodeProperties(nodes, nodeId, updatedProperties) {
    return nodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          properties: {
            ...node.properties,
            ...updatedProperties
          }
        };
      }
      return node;
    });
  }

  /**
   * Update an edge's properties
   * @param {Array} edges - Array of edge objects
   * @param {string} edgeId - ID of the edge to update
   * @param {Object} updatedProperties - New properties to apply
   * @returns {Array} - Updated array of edges
   */
  updateEdgeProperties(edges, edgeId, updatedProperties) {
    return edges.map(edge => {
      if (edge.id === edgeId) {
        return {
          ...edge,
          properties: {
            ...edge.properties,
            ...updatedProperties
          }
        };
      }
      return edge;
    });
  }
}

// Create and export a singleton instance
const graphStateService = new GraphStateService();
export default graphStateService;
