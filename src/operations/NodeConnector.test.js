import { NODE_TYPES, EDGE_PROPERTIES, ERROR_DISPLAY_DURATION } from '../utils/GraphConstants';
import nodeConnector from './NodeConnector';
import graphStateService from '../services/GraphStateService';

// Mock the graphStateService
jest.mock('../services/GraphStateService', () => ({
  edgeExists: jest.fn(),
  bidirectionalConnectionExists: jest.fn(),
  findNodeById: jest.fn(),
  findEdgeById: jest.fn()
}));

describe('NodeConnector', () => {
  let mockNodes;
  let mockEdges;
  let mockSetNodes;
  let mockSetEdges;
  let mockSetError;
  let mockSetSelectedNode;
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
          bankId: 'BANK1',
          entity: 'ENT1'
        }
      },
      {
        id: 'bank-2',
        type: NODE_TYPES.BANK,
        x: 200,
        y: 100,
        properties: {
          bankId: 'BANK2',
          entity: 'ENT2'
        }
      },
      {
        id: 'cl-1',
        type: NODE_TYPES.CREDIT_LINE,
        x: 150,
        y: 200,
        properties: {
          name: 'CL1'
        }
      },
      {
        id: 'cl-2',
        type: NODE_TYPES.CREDIT_LINE,
        x: 250,
        y: 200,
        properties: {
          name: 'CL2'
        }
      },
      {
        id: 'proj-1',
        type: NODE_TYPES.PROJECTION,
        x: 100,
        y: 300,
        properties: {
          name: 'PRJ_ENT1'
        }
      }
    ];
    
    // Create mock edges
    mockEdges = [];
    
    // Create mock functions
    mockSetNodes = jest.fn();
    mockSetEdges = jest.fn();
    mockSetError = jest.fn();
    mockSetSelectedNode = jest.fn();
    mockSetSelectedElement = jest.fn();
    
    // Mock graphStateService.edgeExists to return false by default
    graphStateService.edgeExists.mockReturnValue(false);
    graphStateService.bidirectionalConnectionExists.mockReturnValue(false);
  });
  
  describe('createEdge', () => {
    test('creates an edge between two nodes with appropriate properties', () => {
      const sourceNode = mockNodes[0]; // bank-1
      const targetNode = mockNodes[2]; // cl-1
      
      const edge = nodeConnector.createEdge(sourceNode, targetNode);
      
      expect(edge).toEqual({
        id: 'bank-1-cl-1',
        source: 'bank-1',
        target: 'cl-1',
        properties: {
          flowId: 'BANK1_CL1',
          cost: EDGE_PROPERTIES.BANK_TO_CREDIT_LINE_COST,
          flowType: EDGE_PROPERTIES.DEFAULT_FLOW_TYPE
        }
      });
    });
  });
  
  describe('connectNodes', () => {
    test('prevents connection if edge already exists', () => {
      graphStateService.edgeExists.mockReturnValue(true);
      
      const result = nodeConnector.connectNodes(
        mockNodes[0], // bank-1
        mockNodes[2], // cl-1
        mockNodes,
        mockEdges,
        mockSetNodes,
        mockSetEdges,
        mockSetError,
        null,
        mockSetSelectedNode,
        mockSetSelectedElement
      );
      
      expect(result).toBe(false);
      expect(mockSetEdges).not.toHaveBeenCalled();
    });
    
    test('prevents connection between non-bank nodes', () => {
      const result = nodeConnector.connectNodes(
        mockNodes[2], // cl-1
        mockNodes[4], // proj-1
        mockNodes,
        mockEdges,
        mockSetNodes,
        mockSetEdges,
        mockSetError,
        null,
        mockSetSelectedNode,
        mockSetSelectedElement
      );
      
      expect(result).toBe(false);
      expect(mockSetError).toHaveBeenCalledWith('Error: Cannot connect non-Bank nodes to each other');
    });
    
    test('prevents bank from connecting to multiple credit lines', () => {
      // First connect bank-1 to cl-1
      mockEdges = [{
        id: 'bank-1-cl-1',
        source: 'bank-1',
        target: 'cl-1'
      }];
      
      // Mock the edge existence check for specific nodes
      graphStateService.edgeExists.mockImplementation((edges, sourceId, targetId) => {
        if (sourceId === 'bank-1' && targetId === 'cl-1') return true;
        return false;
      });
      
      // Try to connect bank-1 to cl-2
      const result = nodeConnector.connectNodes(
        mockNodes[0], // bank-1
        mockNodes[3], // cl-2
        mockNodes,
        mockEdges,
        mockSetNodes,
        mockSetEdges,
        mockSetError,
        null,
        mockSetSelectedNode,
        mockSetSelectedElement
      );
      
      expect(result).toBe(false);
      expect(mockSetError).toHaveBeenCalledWith(expect.stringContaining('already connected to a credit line'));
    });
    
    test('successfully connects bank to credit line and updates bank properties', () => {
      const result = nodeConnector.connectNodes(
        mockNodes[0], // bank-1
        mockNodes[2], // cl-1
        mockNodes,
        mockEdges,
        mockSetNodes,
        mockSetEdges,
        mockSetError,
        null,
        mockSetSelectedNode,
        mockSetSelectedElement
      );
      
      expect(result).toBe(true);
      expect(mockSetEdges).toHaveBeenCalled();
      expect(mockSetNodes).toHaveBeenCalled();
      
      // Check that the bank node was updated with the credit line property
      const updatedNodes = mockSetNodes.mock.calls[0][0];
      const updatedBank = updatedNodes.find(node => node.id === 'bank-1');
      expect(updatedBank.properties.creditLine).toBe('CL1');
    });
  });
  
  describe('connectNodesBidirectional', () => {
    test('prevents bidirectional connection if neither node is a bank', () => {
      const result = nodeConnector.connectNodesBidirectional(
        mockNodes[2], // cl-1
        mockNodes[4], // proj-1
        mockNodes,
        mockEdges,
        mockSetNodes,
        mockSetEdges,
        mockSetError,
        null,
        mockSetSelectedNode,
        mockSetSelectedElement
      );
      
      expect(result).toBe(false);
      expect(mockSetError).toHaveBeenCalledWith(expect.stringContaining('At least one node must be a Bank node'));
    });
    
    test('prevents bank from connecting bidirectionally to multiple credit lines', () => {
      // First connect bank-1 to cl-1
      mockEdges = [{
        id: 'bank-1-cl-1',
        source: 'bank-1',
        target: 'cl-1'
      }];
      
      // Try to connect bank-1 to cl-2 bidirectionally
      const result = nodeConnector.connectNodesBidirectional(
        mockNodes[0], // bank-1
        mockNodes[3], // cl-2
        mockNodes,
        mockEdges,
        mockSetNodes,
        mockSetEdges,
        mockSetError,
        null,
        mockSetSelectedNode,
        mockSetSelectedElement
      );
      
      expect(result).toBe(false);
      expect(mockSetError).toHaveBeenCalledWith(expect.stringContaining('already connected to a credit line'));
    });
    
    test('successfully creates bidirectional connection between bank and credit line', () => {
      const result = nodeConnector.connectNodesBidirectional(
        mockNodes[0], // bank-1
        mockNodes[2], // cl-1
        mockNodes,
        mockEdges,
        mockSetNodes,
        mockSetEdges,
        mockSetError,
        null,
        mockSetSelectedNode,
        mockSetSelectedElement
      );
      
      expect(result).toBe(true);
      expect(mockSetEdges).toHaveBeenCalled();
      
      // Should have created two edges (forward and backward)
      const updatedEdges = mockSetEdges.mock.calls[0][0];
      expect(updatedEdges.length).toBe(2);
      
      // Check that the bank node was updated with the credit line property
      const updatedNodes = mockSetNodes.mock.calls[0][0];
      const updatedBank = updatedNodes.find(node => node.id === 'bank-1');
      expect(updatedBank.properties.creditLine).toBe('CL1');
    });
  });
});
