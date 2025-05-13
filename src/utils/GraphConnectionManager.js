import nodeConnector from '../operations/NodeConnector';
import nodeSelector from '../operations/NodeSelector';

/**
 * Class responsible for managing connections between nodes
 */
class GraphConnectionManager {
  /**
   * Handle clicks in connect mode
   */
  handleConnectClick(x, y, nodes, edges, connectStartNode, setConnectStartNode, 
                    pendingConnection, setPendingConnection, setError, setEdges, setNodes) {
    const node = nodeSelector.findNodeAtPosition(x, y, nodes);

    if (node) {
      if (!pendingConnection) {
        // First node click - start connection
        setConnectStartNode(node);
        setPendingConnection(true);
        return { status: 'started', node };
      } else if (connectStartNode && node.id !== connectStartNode.id) {
        // Second node click - complete connection if it's a different node
        const result = nodeConnector.connectNodes(
          connectStartNode,
          node,
          nodes,
          edges,
          setNodes,
          setEdges,
          setError,
          null, // selectedNode
          null, // setSelectedNode
          null  // setSelectedElement
        );
        
        // Reset connection state
        setConnectStartNode(null);
        setPendingConnection(false);
        return { status: 'completed', result };
      } else if (connectStartNode && node.id === connectStartNode.id) {
        // Clicked the same node twice, cancel the connection
        setConnectStartNode(null);
        setPendingConnection(false);
        return { status: 'cancelled', reason: 'same_node' };
      }
    } else {
      // Clicked on empty space, cancel the connection
      setConnectStartNode(null);
      setPendingConnection(false);
      return { status: 'cancelled', reason: 'empty_space' };
    }
  }

  /**
   * Handle clicks in bidirectional connect mode
   */
  handleConnectBidirectionalClick(x, y, nodes, edges, connectStartNode, setConnectStartNode, 
                                 pendingConnection, setPendingConnection, setError, setEdges, setNodes) {
    const node = nodeSelector.findNodeAtPosition(x, y, nodes);

    if (node) {
      if (!pendingConnection) {
        // First node click - start connection
        setConnectStartNode(node);
        setPendingConnection(true);
        return { status: 'started', node };
      } else if (connectStartNode && node.id !== connectStartNode.id) {
        // Second node click - complete bidirectional connection if it's a different node
        const result = nodeConnector.connectNodesBidirectional(
          connectStartNode,
          node,
          nodes,
          edges,
          setNodes,
          setEdges,
          setError,
          null, // selectedNode
          null, // setSelectedNode
          null  // setSelectedElement
        );
        
        // Reset connection state
        setConnectStartNode(null);
        setPendingConnection(false);
        return { status: 'completed', result };
      } else if (connectStartNode && node.id === connectStartNode.id) {
        // Clicked the same node twice, cancel the connection
        setConnectStartNode(null);
        setPendingConnection(false);
        return { status: 'cancelled', reason: 'same_node' };
      }
    } else {
      // Clicked on empty space, cancel the connection
      setConnectStartNode(null);
      setPendingConnection(false);
      return { status: 'cancelled', reason: 'empty_space' };
    }
  }

  /**
   * Draw the pending connection line
   */
  drawPendingConnection(ctx, connectStartNode, mouseX, mouseY, panOffset, zoomLevel) {
    if (!connectStartNode) return;
    
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

// Create and export a singleton instance
const graphConnectionManager = new GraphConnectionManager();
export default graphConnectionManager;
