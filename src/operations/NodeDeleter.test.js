import nodeDeleter from './NodeDeleter';
import nodeSelector from './NodeSelector';
import { NODE_TYPES } from '../utils/GraphConstants';

// Mock the nodeSelector
jest.mock('./NodeSelector', () => ({
  findNodeAtPosition: jest.fn(),
  findEdgeAtPosition: jest.fn()
}));

describe('NodeDeleter', () => {
  let mockNodes;
  let mockEdges;
  let mockSetNodes;
  let mockSetEdges;
  let mockSetSelectedNode;
  let mockSetSelectedEdge;
  let mockSetSelectedElement;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock nodes
    mockNodes = [
      {
        id: 'bank-1',
        type: NODE_TYPES.BANK,
        x: 100,
        y: 100,
        properties: {
          bankId: 'BANK1'
        }
      },
      {
        id: 'cl-1',
        type: NODE_TYPES.CREDIT_LINE,
        x: 300,
        y: 300,
        properties: {
          name: 'CL1'
        }
      }
    ];
    
    // Create mock edges
    mockEdges = [
      {
        id: 'bank-1-cl-1',
        source: 'bank-1',
        target: 'cl-1',
        properties: {
          flowId: 'BANK1_CL1'
        }
      }
    ];
    
    // Create mock functions
    mockSetNodes = jest.fn();
    mockSetEdges = jest.fn();
    mockSetSelectedNode = jest.fn();
    mockSetSelectedEdge = jest.fn();
    mockSetSelectedElement = jest.fn();
  });
  
  describe('deleteNodeAtPosition', () => {
    test('deletes a node when it is found at the position', () => {
      // Mock nodeSelector to return a node
      nodeSelector.findNodeAtPosition.mockReturnValue(mockNodes[0]);
      
      const result = nodeDeleter.deleteNodeAtPosition(
        100, 100, mockNodes, mockEdges,
        null, // selectedNode
        mockSetNodes,
        mockSetEdges,
        mockSetSelectedNode,
        mockSetSelectedElement
      );
      
      expect(result).toBe(true);
      
      // Should remove the node
      expect(mockSetNodes).toHaveBeenCalledWith([mockNodes[1]]);
      
      // Should remove any edges connected to the node
      expect(mockSetEdges).toHaveBeenCalledWith([]);
      
      // In the actual implementation, these are only called if the selected node is being deleted
      // We're not testing that case here, so we don't expect these to be called
      expect(mockSetSelectedNode).not.toHaveBeenCalled();
      expect(mockSetSelectedElement).not.toHaveBeenCalled();
    });
    
    test('returns false when no node is found at the position', () => {
      // Mock nodeSelector to return null (no node found)
      nodeSelector.findNodeAtPosition.mockReturnValue(null);
      
      const result = nodeDeleter.deleteNodeAtPosition(
        200, 200, mockNodes, mockEdges,
        null, // selectedNode
        mockSetNodes,
        mockSetEdges,
        mockSetSelectedNode,
        mockSetSelectedElement
      );
      
      expect(result).toBe(false);
      
      // Should not modify nodes or edges
      expect(mockSetNodes).not.toHaveBeenCalled();
      expect(mockSetEdges).not.toHaveBeenCalled();
    });
    
    test('clears selection when the selected node is deleted', () => {
      // Mock nodeSelector to return a node
      nodeSelector.findNodeAtPosition.mockReturnValue(mockNodes[0]);
      
      const result = nodeDeleter.deleteNodeAtPosition(
        100, 100, mockNodes, mockEdges,
        mockNodes[0], // selectedNode is the one being deleted
        mockSetNodes,
        mockSetEdges,
        mockSetSelectedNode,
        mockSetSelectedElement
      );
      
      expect(result).toBe(true);
      expect(mockSetSelectedNode).toHaveBeenCalledWith(null);
      expect(mockSetSelectedElement).toHaveBeenCalledWith(null);
    });
  });
  
  describe('deleteEdgeAtPosition', () => {
    test('deletes an edge when it is found at the position', () => {
      // Mock nodeSelector to return an edge
      nodeSelector.findEdgeAtPosition.mockReturnValue(mockEdges[0]);
      
      const result = nodeDeleter.deleteEdgeAtPosition(
        200, 200, mockNodes, mockEdges,
        null, // selectedEdge
        mockSetEdges,
        mockSetSelectedEdge,
        mockSetSelectedElement
      );
      
      expect(result).toBe(true);
      
      // Should remove the edge
      expect(mockSetEdges).toHaveBeenCalledWith([]);
      
      // In the actual implementation, these are only called if the selected edge is being deleted
      // We're not testing that case here, so we don't expect these to be called
      expect(mockSetSelectedEdge).not.toHaveBeenCalled();
      expect(mockSetSelectedElement).not.toHaveBeenCalled();
    });
    
    test('returns false when no edge is found at the position', () => {
      // Mock nodeSelector to return null (no edge found)
      nodeSelector.findEdgeAtPosition.mockReturnValue(null);
      
      const result = nodeDeleter.deleteEdgeAtPosition(
        50, 50, mockNodes, mockEdges,
        null, // selectedEdge
        mockSetEdges,
        mockSetSelectedEdge,
        mockSetSelectedElement
      );
      
      expect(result).toBe(false);
      
      // Should not modify edges
      expect(mockSetEdges).not.toHaveBeenCalled();
    });
    
    test('clears selection when the selected edge is deleted', () => {
      // Mock nodeSelector to return an edge
      nodeSelector.findEdgeAtPosition.mockReturnValue(mockEdges[0]);
      
      const result = nodeDeleter.deleteEdgeAtPosition(
        200, 200, mockNodes, mockEdges,
        mockEdges[0], // selectedEdge is the one being deleted
        mockSetEdges,
        mockSetSelectedEdge,
        mockSetSelectedElement
      );
      
      expect(result).toBe(true);
      expect(mockSetSelectedEdge).toHaveBeenCalledWith(null);
      expect(mockSetSelectedElement).toHaveBeenCalledWith(null);
    });
  });
});
