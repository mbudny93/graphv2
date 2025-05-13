import { screenToWorldCoordinates } from './GraphMathUtils';
import nodeSelector from '../operations/NodeSelector';
import { OPERATION_MODES } from './GraphConstants';

/**
 * Class responsible for handling mouse interactions with the graph canvas
 */
class GraphInteractionHandler {
  /**
   * Handle mouse down for node dragging and panning
   */
  handleMouseDown(e, canvasRef, mode, nodes, panOffset, zoomLevel, 
                 setDraggingNode, setDragStart, setIsPanning, setLastPanPosition, handleDeleteClick) {
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
      return { action: 'drag_node', node: clickedNode };
    } else if (mode === OPERATION_MODES.SELECT && !clickedNode) {
      // Start panning if clicking on empty space in select mode
      setIsPanning(true);
      setLastPanPosition({ x: e.clientX, y: e.clientY });
      return { action: 'start_pan' };
    } else if (mode === OPERATION_MODES.DELETE) {
      handleDeleteClick(x, y);
      return { action: 'delete', x, y };
    }
    
    return { action: 'none' };
  }

  /**
   * Handle mouse move for node dragging and panning
   */
  handleMouseMove(e, canvasRef, draggingNode, dragStart, isPanning, lastPanPosition,
                 panOffset, zoomLevel, nodes, setNodes, selectedNode, setSelectedNode, 
                 setSelectedElement, setPanOffset, setLastPanPosition) {
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

      const updatedNodes = nodes.map((node) =>
        node.id === draggingNode.id
          ? { ...node, x: x - dragStart.x, y: y - dragStart.y }
          : node
      );
      
      setNodes(updatedNodes);

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
      
      return { action: 'drag_node', node: draggingNode, x: x - dragStart.x, y: y - dragStart.y };
    } else if (isPanning) {
      const dx = e.clientX - lastPanPosition.x;
      const dy = e.clientY - lastPanPosition.y;
      
      const newPanOffset = { x: panOffset.x + dx, y: panOffset.y + dy };
      setPanOffset(newPanOffset);
      setLastPanPosition({ x: e.clientX, y: e.clientY });
      
      return { action: 'pan', dx, dy, newOffset: newPanOffset };
    }
    
    return { action: 'none' };
  }

  /**
   * Handle mouse wheel for zooming
   */
  handleWheel(e, canvasRef, panOffset, zoomLevel, setPanOffset, setZoomLevel) {
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
    
    return { action: 'zoom', level: newZoomLevel, offset: { x: newPanX, y: newPanY } };
  }

  /**
   * Get mouse coordinates in world space
   */
  getWorldCoordinates(e, canvasRef, panOffset, zoomLevel) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    return screenToWorldCoordinates(
      e.clientX - rect.left,
      e.clientY - rect.top,
      panOffset.x,
      panOffset.y,
      zoomLevel
    );
  }

  /**
   * Resize canvas to match container
   */
  resizeCanvas(canvasRef, nodes, edges, selectedNode, selectedEdge, panOffset, zoomLevel) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    return { width: canvas.width, height: canvas.height };
  }
}

// Create and export a singleton instance
const graphInteractionHandler = new GraphInteractionHandler();
export default graphInteractionHandler;
