import nodeSelector from './NodeSelector';
import { NODE_TYPES } from '../utils/GraphConstants';

describe('NodeSelector', () => {
  let mockNodes;
  let mockEdges;
  let mockSetSelectedNode;
  let mockSetSelectedEdge;
  let mockSetSelectedElement;
  
  beforeEach(() => {
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
    mockSetSelectedNode = jest.fn();
    mockSetSelectedEdge = jest.fn();
    mockSetSelectedElement = jest.fn();
  });
  
  describe('findNodeAtPosition', () => {
    test('returns node when position is within node radius', () => {
      // Position is exactly at node center
      const node = nodeSelector.findNodeAtPosition(100, 100, mockNodes);
      expect(node).toBe(mockNodes[0]);
      
      // Position is within node radius (default radius is 20)
      const nodeAtEdge = nodeSelector.findNodeAtPosition(115, 115, mockNodes);
      expect(nodeAtEdge).toBe(mockNodes[0]);
    });
    
    test('returns null when position is outside all nodes', () => {
      const node = nodeSelector.findNodeAtPosition(200, 200, mockNodes);
      expect(node).toBeNull();
    });
    
    test('returns the closest node when multiple nodes overlap', () => {
      // Create overlapping nodes
      const overlappingNodes = [
        { id: 'node-1', x: 100, y: 100 },
        { id: 'node-2', x: 105, y: 105 }
      ];
      
      // Position is closer to node-2
      const node = nodeSelector.findNodeAtPosition(107, 107, overlappingNodes);
      expect(node).toBe(overlappingNodes[1]);
    });
  });
  
  describe('findEdgeAtPosition', () => {
    test('returns edge when position is near the edge line', () => {
      // Mock the distanceToLineSegment function to return a small distance
      jest.spyOn(require('../utils/GraphMathUtils'), 'distanceToLineSegment').mockReturnValue(5);
      
      // Position is on the line between bank-1 (100,100) and cl-1 (300,300)
      const edge = nodeSelector.findEdgeAtPosition(200, 200, mockEdges, mockNodes);
      expect(edge).toBe(mockEdges[0]);
    });
    
    test('returns null when position is not near any edge', () => {
      // Mock the distanceToLineSegment function to return a large distance
      jest.spyOn(require('../utils/GraphMathUtils'), 'distanceToLineSegment').mockReturnValue(20);
      
      const edge = nodeSelector.findEdgeAtPosition(50, 200, mockEdges, mockNodes);
      expect(edge).toBeUndefined(); // The actual implementation returns undefined when no edge is found
    });
  });
  
  describe('selectNodeAtPosition', () => {
    test('selects a node when clicking on it', () => {
      nodeSelector.selectNodeAtPosition(
        100, 100, mockNodes, mockEdges, 
        mockSetSelectedNode, mockSetSelectedEdge, mockSetSelectedElement
      );
      
      expect(mockSetSelectedNode).toHaveBeenCalledWith(mockNodes[0]);
      expect(mockSetSelectedEdge).toHaveBeenCalledWith(null);
      expect(mockSetSelectedElement).toHaveBeenCalledWith({
        type: 'node',
        data: mockNodes[0]
      });
    });
    
    test('selects an edge when clicking on it', () => {
      // Spy on the methods instead of trying to mock them directly
      jest.spyOn(nodeSelector, 'findNodeAtPosition').mockReturnValue(null);
      jest.spyOn(nodeSelector, 'findEdgeAtPosition').mockReturnValue(mockEdges[0]);
      
      // Position is on an edge
      nodeSelector.selectNodeAtPosition(
        200, 200, mockNodes, mockEdges, mockSetSelectedNode, mockSetSelectedEdge, mockSetSelectedElement
      );
      
      expect(mockSetSelectedNode).toHaveBeenCalledWith(null);
      expect(mockSetSelectedEdge).toHaveBeenCalledWith(mockEdges[0]);
      expect(mockSetSelectedElement).toHaveBeenCalledWith({
        type: 'edge',
        data: mockEdges[0]
      });
    });
    
    test('clears selection when clicking on empty space', () => {
      nodeSelector.selectNodeAtPosition(
        400, 400, mockNodes, mockEdges, 
        mockSetSelectedNode, mockSetSelectedEdge, mockSetSelectedElement
      );
      
      expect(mockSetSelectedNode).toHaveBeenCalledWith(null);
      expect(mockSetSelectedEdge).toHaveBeenCalledWith(null);
      expect(mockSetSelectedElement).toHaveBeenCalledWith(null);
    });
  });
});
