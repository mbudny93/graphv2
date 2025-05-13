/**
 * Class responsible for node and edge selection operations
 */
import { isPointInCircle, distanceToLineSegment } from '../utils/GraphMathUtils';
import { NODE_RADIUS } from '../utils/GraphConstants';

class NodeSelector {
  /**
   * Find a node at the specified position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Array} nodes - Array of node objects
   * @returns {Object|null} - The node at the position or null if not found
   */
  findNodeAtPosition(x, y, nodes) {
    // Check from last to first (top to bottom in z-order)
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (isPointInCircle(x, y, node.x, node.y, NODE_RADIUS)) {
        return node;
      }
    }
    return null;
  }

  /**
   * Find an edge at the specified position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Array} edges - Array of edge objects
   * @param {Array} nodes - Array of node objects
   * @returns {Object|null} - The edge at the position or null if not found
   */
  findEdgeAtPosition(x, y, edges, nodes) {
    return edges.find(edge => {
      const sourceNode = nodes.find(node => node.id === edge.source);
      const targetNode = nodes.find(node => node.id === edge.target);
      
      if (!sourceNode || !targetNode) return false;
      
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
      
      const distance = distanceToLineSegment(x, y, startX, startY, endX, endY);
      return distance < 12; // Slightly increased threshold for easier selection
    });
  }

  /**
   * Select a node at the specified position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Array} nodes - Array of node objects
   * @param {Array} edges - Array of edge objects
   * @param {Function} setSelectedNode - Function to set the selected node
   * @param {Function} setSelectedEdge - Function to set the selected edge
   * @param {Function} setSelectedElement - Function to set the selected element
   * @returns {boolean} - True if a node was selected
   */
  selectNodeAtPosition(x, y, nodes, edges, setSelectedNode, setSelectedEdge, setSelectedElement) {
    const node = this.findNodeAtPosition(x, y, nodes);
    
    if (node) {
      setSelectedNode(node);
      setSelectedEdge(null);
      setSelectedElement({ type: 'node', data: node });
      return true;
    } else {
      const edge = this.findEdgeAtPosition(x, y, edges, nodes);
      
      if (edge) {
        setSelectedNode(null);
        setSelectedEdge(edge);
        setSelectedElement({ type: 'edge', data: edge });
        return true;
      } else {
        setSelectedNode(null);
        setSelectedEdge(null);
        setSelectedElement(null);
        return false;
      }
    }
  }
}

// Create and export a singleton instance
const nodeSelector = new NodeSelector();
export default nodeSelector;
