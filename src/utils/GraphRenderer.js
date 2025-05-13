/**
 * Class responsible for rendering the graph
 */
import { NODE_RADIUS, NODE_TYPES, DRAWING } from './GraphConstants';

class GraphRenderer {
  /**
   * Draw the entire graph
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {Array} nodes - Array of node objects
   * @param {Array} edges - Array of edge objects
   * @param {Object} selectedNode - Currently selected node
   * @param {Object} selectedEdge - Currently selected edge
   * @param {Object} panOffset - Current pan offset {x, y}
   * @param {number} zoomLevel - Current zoom level
   */
  drawGraph(ctx, width, height, nodes, edges, selectedNode, selectedEdge, panOffset, zoomLevel) {
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    // Apply pan and zoom
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);

    // Draw edges
    this.drawEdges(ctx, nodes, edges, selectedEdge, zoomLevel);

    // Draw nodes
    this.drawNodes(ctx, nodes, selectedNode, zoomLevel);

    // Restore the canvas state
    ctx.restore();
  }

  /**
   * Draw all edges
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array} nodes - Array of node objects
   * @param {Array} edges - Array of edge objects
   * @param {Object} selectedEdge - Currently selected edge
   * @param {number} zoomLevel - Current zoom level
   */
  drawEdges(ctx, nodes, edges, selectedEdge, zoomLevel) {
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
          const offsetDistance = DRAWING.EDGE_OFFSET_DISTANCE;
          const perpX = Math.sin(angle) * offsetDistance;
          const perpY = -Math.cos(angle) * offsetDistance;
          
          startX += perpX;
          startY += perpY;
          endX += perpX;
          endY += perpY;
        }
        
        // Draw the edge line
        this.drawEdgeLine(ctx, startX, startY, endX, endY, edge, selectedEdge);
        
        // Draw the arrowhead
        this.drawArrowhead(ctx, startX, startY, endX, endY, edge, selectedEdge);
        
        // Draw the cost label
        this.drawCostLabel(ctx, startX, startY, endX, endY, edge, reverseEdge, selectedEdge, zoomLevel);
      }
    });
  }

  /**
   * Draw an edge line
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} startX - Start X coordinate
   * @param {number} startY - Start Y coordinate
   * @param {number} endX - End X coordinate
   * @param {number} endY - End Y coordinate
   * @param {Object} edge - Edge object
   * @param {Object} selectedEdge - Currently selected edge
   */
  drawEdgeLine(ctx, startX, startY, endX, endY, edge, selectedEdge) {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = selectedEdge && edge.id === selectedEdge.id 
      ? DRAWING.SELECTED_EDGE_COLOR 
      : DRAWING.NORMAL_EDGE_COLOR;
    ctx.lineWidth = selectedEdge && edge.id === selectedEdge.id 
      ? DRAWING.SELECTED_EDGE_WIDTH 
      : DRAWING.NORMAL_EDGE_WIDTH;
    ctx.stroke();
  }

  /**
   * Draw an arrowhead
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} startX - Start X coordinate
   * @param {number} startY - Start Y coordinate
   * @param {number} endX - End X coordinate
   * @param {number} endY - End Y coordinate
   * @param {Object} edge - Edge object
   * @param {Object} selectedEdge - Currently selected edge
   */
  drawArrowhead(ctx, startX, startY, endX, endY, edge, selectedEdge) {
    // Calculate the angle for the arrowhead
    const arrowAngle = Math.atan2(endY - startY, endX - startX);
    const arrowLength = DRAWING.ARROW_LENGTH;
    
    // Calculate position for the arrowhead - position it at the node's perimeter
    const arrowTipX = endX - Math.cos(arrowAngle) * NODE_RADIUS; // Exactly at node perimeter
    const arrowTipY = endY - Math.sin(arrowAngle) * NODE_RADIUS;

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
    ctx.fillStyle = selectedEdge && edge.id === selectedEdge.id 
      ? DRAWING.SELECTED_EDGE_COLOR 
      : DRAWING.ARROW_FILL_COLOR;
    ctx.fill();
    
    // Add a subtle stroke around the arrowhead
    ctx.strokeStyle = DRAWING.ARROW_STROKE_COLOR;
    ctx.lineWidth = DRAWING.ARROW_STROKE_WIDTH;
    ctx.stroke();
  }

  /**
   * Draw a cost label for an edge
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} startX - Start X coordinate
   * @param {number} startY - Start Y coordinate
   * @param {number} endX - End X coordinate
   * @param {number} endY - End Y coordinate
   * @param {Object} edge - Edge object
   * @param {Object} reverseEdge - Reverse edge object (if exists)
   * @param {Object} selectedEdge - Currently selected edge
   * @param {number} zoomLevel - Current zoom level
   */
  drawCostLabel(ctx, startX, startY, endX, endY, edge, reverseEdge, selectedEdge, zoomLevel) {
    // Calculate midpoint for the cost label
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    // Only display the cost as an integer and only for one direction in bidirectional connections
    if (edge.properties && edge.properties.cost !== undefined) {
      // For bidirectional connections, only show cost on one edge
      // If there's a reverse edge, only show cost if this edge's source ID is less than target ID
      // This ensures we only show the cost once for each bidirectional connection
      const shouldShowCost = !reverseEdge || (reverseEdge && edge.source < edge.target);
      
      if (shouldShowCost) {
        const cost = Math.round(edge.properties.cost);
        const costText = `${cost}`;

        // Adjust font size based on zoom, but keep it readable
        const baseFontSize = DRAWING.COST_LABEL_FONT_SIZE;
        const dynamicFontSize = Math.max(
          DRAWING.COST_LABEL_MIN_FONT_SIZE, 
          baseFontSize / zoomLevel
        );

        ctx.font = `bold ${dynamicFontSize}px Arial`;

        const textMetrics = ctx.measureText(costText);
        const textWidth = textMetrics.width;
        const textHeight = dynamicFontSize; // Approximate height based on font size

        // Draw label background
        ctx.fillStyle = DRAWING.COST_LABEL_BACKGROUND_COLOR;
        // Adjust padding for background based on font size
        const padding = DRAWING.COST_LABEL_PADDING / zoomLevel;
        ctx.fillRect(
          midX - textWidth / 2 - padding, 
          midY - textHeight / 2 - padding, 
          textWidth + 2 * padding, 
          textHeight + 2 * padding
        );

        // Draw cost label
        ctx.fillStyle = selectedEdge && edge.id === selectedEdge.id 
          ? DRAWING.SELECTED_EDGE_COLOR 
          : DRAWING.COST_LABEL_TEXT_COLOR;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(costText, midX, midY);
      }
    }
  }

  /**
   * Draw all nodes
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array} nodes - Array of node objects
   * @param {Object} selectedNode - Currently selected node
   * @param {number} zoomLevel - Current zoom level
   */
  drawNodes(ctx, nodes, selectedNode, zoomLevel) {
    nodes.forEach((node) => {
      this.drawNode(ctx, node, selectedNode, zoomLevel);
    });
  }

  /**
   * Draw a single node
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} node - Node object
   * @param {Object} selectedNode - Currently selected node
   * @param {number} zoomLevel - Current zoom level
   */
  drawNode(ctx, node, selectedNode, zoomLevel) {
    ctx.beginPath();
    ctx.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI);

    let nodeColor, nodeLabel;

    // Determine node color and label based on node type
    switch (node.type) {
      case NODE_TYPES.BANK:
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

      case NODE_TYPES.CREDIT_LINE:
        nodeColor = '#9c27b0'; // Purple for credit line
        nodeLabel = node.properties.name;
        break;

      case NODE_TYPES.PROJECTION:
        nodeColor = '#ff9800'; // Orange for projection
        nodeLabel = node.properties.name;
        break;

      case NODE_TYPES.STREET:
        nodeColor = '#795548'; // Brown for street
        nodeLabel = 'STREET';
        break;

      default:
        nodeColor = '#e0e0e0'; // Light gray default
        nodeLabel = '';
    }

    // Draw selection effect if the node is selected
    if (selectedNode && node.id === selectedNode.id) {
      this.drawNodeSelectionEffect(ctx, node, nodeColor, zoomLevel);
    }
    
    // Draw the node
    ctx.fillStyle = nodeColor;
    ctx.shadowBlur = selectedNode && node.id === selectedNode.id ? 15 / zoomLevel : 0;
    ctx.shadowColor = selectedNode && node.id === selectedNode.id ? nodeColor : 'transparent';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1 / zoomLevel;
    ctx.stroke();

    // Draw node label
    this.drawNodeLabel(ctx, node, nodeLabel, zoomLevel);
  }

  /**
   * Draw selection effect for a node
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} node - Node object
   * @param {string} nodeColor - Node color
   * @param {number} zoomLevel - Current zoom level
   */
  drawNodeSelectionEffect(ctx, node, nodeColor, zoomLevel) {
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

  /**
   * Draw a label for a node
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} node - Node object
   * @param {string} nodeLabel - Node label text
   * @param {number} zoomLevel - Current zoom level
   */
  drawNodeLabel(ctx, node, nodeLabel, zoomLevel) {
    // Draw node label
    const fontSize = 12 / zoomLevel;
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nodeLabel, node.x, node.y);

    // Draw additional information for bank nodes
    if (node.type === NODE_TYPES.BANK) {
      const smallFontSize = 10 / zoomLevel;
      ctx.font = `${smallFontSize}px Arial`;
      
      // Draw projected value below the node
      const projectedText = `P: ${node.properties.projected}`;
      ctx.fillText(projectedText, node.x, node.y + NODE_RADIUS + 12 / zoomLevel);
      
      // Draw actual value below the projected value
      const actualText = `A: ${node.properties.actual}`;
      ctx.fillText(actualText, node.x, node.y + NODE_RADIUS + 24 / zoomLevel);
    }
  }
}

// Create and export a singleton instance
const graphRenderer = new GraphRenderer();
export default graphRenderer;
