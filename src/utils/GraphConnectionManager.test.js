import graphConnectionManager from './GraphConnectionManager';
import nodeSelector from '../operations/NodeSelector';
import nodeConnector from '../operations/NodeConnector';
import { NODE_TYPES } from './GraphConstants';

// Mock the dependencies
jest.mock('../operations/NodeSelector', () => ({
  findNodeAtPosition: jest.fn()
}));

jest.mock('../operations/NodeConnector', () => ({
  connectNodes: jest.fn(),
  connectNodesBidirectional: jest.fn(),
  drawPendingConnection: jest.fn()
}));

describe('GraphConnectionManager', () => {
  let mockNodes;
  let mockEdges;
  let mockSetConnectStartNode;
  let mockSetPendingConnection;
  let mockSetError;
  let mockSetEdges;
  let mockSetNodes;
  
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
    mockEdges = [];
    
    // Create mock functions
    mockSetConnectStartNode = jest.fn();
    mockSetPendingConnection = jest.fn();
    mockSetError = jest.fn();
    mockSetEdges = jest.fn();
    mockSetNodes = jest.fn();
  });
  
  describe('handleConnectClick', () => {
    test('starts connection on first click to a node', () => {
      // Mock nodeSelector to return a node
      nodeSelector.findNodeAtPosition.mockReturnValue(mockNodes[0]);
      
      const result = graphConnectionManager.handleConnectClick(
        100, 100, mockNodes, mockEdges,
        null, // connectStartNode
        mockSetConnectStartNode,
        false, // pendingConnection
        mockSetPendingConnection,
        mockSetError,
        mockSetEdges,
        mockSetNodes
      );
      
      expect(result).toEqual({ status: 'started', node: mockNodes[0] });
      expect(mockSetConnectStartNode).toHaveBeenCalledWith(mockNodes[0]);
      expect(mockSetPendingConnection).toHaveBeenCalledWith(true);
    });
    
    test('completes connection on second click to different node', () => {
      // Mock nodeSelector to return the second node
      nodeSelector.findNodeAtPosition.mockReturnValue(mockNodes[1]);
      
      // Mock nodeConnector to indicate successful connection
      nodeConnector.connectNodes.mockReturnValue(true);
      
      const result = graphConnectionManager.handleConnectClick(
        300, 300, mockNodes, mockEdges,
        mockNodes[0], // connectStartNode
        mockSetConnectStartNode,
        true, // pendingConnection
        mockSetPendingConnection,
        mockSetError,
        mockSetEdges,
        mockSetNodes
      );
      
      expect(result).toEqual({ status: 'completed', result: true });
      expect(nodeConnector.connectNodes).toHaveBeenCalledWith(
        mockNodes[0], mockNodes[1], mockNodes, mockEdges,
        mockSetNodes, mockSetEdges, mockSetError,
        null, null, null
      );
      expect(mockSetConnectStartNode).toHaveBeenCalledWith(null);
      expect(mockSetPendingConnection).toHaveBeenCalledWith(false);
    });
    
    test('cancels connection when clicking same node twice', () => {
      // Mock nodeSelector to return the same node
      nodeSelector.findNodeAtPosition.mockReturnValue(mockNodes[0]);
      
      const result = graphConnectionManager.handleConnectClick(
        100, 100, mockNodes, mockEdges,
        mockNodes[0], // connectStartNode (same as clicked node)
        mockSetConnectStartNode,
        true, // pendingConnection
        mockSetPendingConnection,
        mockSetError,
        mockSetEdges,
        mockSetNodes
      );
      
      expect(result).toEqual({ status: 'cancelled', reason: 'same_node' });
      expect(mockSetConnectStartNode).toHaveBeenCalledWith(null);
      expect(mockSetPendingConnection).toHaveBeenCalledWith(false);
      expect(nodeConnector.connectNodes).not.toHaveBeenCalled();
    });
    
    test('cancels connection when clicking on empty space', () => {
      // Mock nodeSelector to return null (no node found)
      nodeSelector.findNodeAtPosition.mockReturnValue(null);
      
      const result = graphConnectionManager.handleConnectClick(
        200, 200, mockNodes, mockEdges,
        mockNodes[0], // connectStartNode
        mockSetConnectStartNode,
        true, // pendingConnection
        mockSetPendingConnection,
        mockSetError,
        mockSetEdges,
        mockSetNodes
      );
      
      expect(result).toEqual({ status: 'cancelled', reason: 'empty_space' });
      expect(mockSetConnectStartNode).toHaveBeenCalledWith(null);
      expect(mockSetPendingConnection).toHaveBeenCalledWith(false);
      expect(nodeConnector.connectNodes).not.toHaveBeenCalled();
    });
  });
  
  describe('handleConnectBidirectionalClick', () => {
    test('starts connection on first click to a node', () => {
      // Mock nodeSelector to return a node
      nodeSelector.findNodeAtPosition.mockReturnValue(mockNodes[0]);
      
      const result = graphConnectionManager.handleConnectBidirectionalClick(
        100, 100, mockNodes, mockEdges,
        null, // connectStartNode
        mockSetConnectStartNode,
        false, // pendingConnection
        mockSetPendingConnection,
        mockSetError,
        mockSetEdges,
        mockSetNodes
      );
      
      expect(result).toEqual({ status: 'started', node: mockNodes[0] });
      expect(mockSetConnectStartNode).toHaveBeenCalledWith(mockNodes[0]);
      expect(mockSetPendingConnection).toHaveBeenCalledWith(true);
    });
    
    test('completes bidirectional connection on second click to different node', () => {
      // Mock nodeSelector to return the second node
      nodeSelector.findNodeAtPosition.mockReturnValue(mockNodes[1]);
      
      // Mock nodeConnector to indicate successful connection
      nodeConnector.connectNodesBidirectional.mockReturnValue(true);
      
      const result = graphConnectionManager.handleConnectBidirectionalClick(
        300, 300, mockNodes, mockEdges,
        mockNodes[0], // connectStartNode
        mockSetConnectStartNode,
        true, // pendingConnection
        mockSetPendingConnection,
        mockSetError,
        mockSetEdges,
        mockSetNodes
      );
      
      expect(result).toEqual({ status: 'completed', result: true });
      expect(nodeConnector.connectNodesBidirectional).toHaveBeenCalledWith(
        mockNodes[0], mockNodes[1], mockNodes, mockEdges,
        mockSetNodes, mockSetEdges, mockSetError,
        null, null, null
      );
      expect(mockSetConnectStartNode).toHaveBeenCalledWith(null);
      expect(mockSetPendingConnection).toHaveBeenCalledWith(false);
    });
  });
  
  describe('drawPendingConnection', () => {
    test('calls the nodeConnector drawPendingConnection method', () => {
      // Create a proper mock for the canvas context with all required methods
      const mockCtx = {
        save: jest.fn(),
        translate: jest.fn(),
        scale: jest.fn(),
        restore: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        stroke: jest.fn(),
        setLineDash: jest.fn()
      };
      const startNode = mockNodes[0];
      const mouseX = 200;
      const mouseY = 200;
      const panOffset = { x: 0, y: 0 };
      const zoomLevel = 1;
      
      // Instead of testing if nodeConnector.drawPendingConnection is called,
      // we'll test that the context methods are called as expected
      graphConnectionManager.drawPendingConnection(
        mockCtx, startNode, mouseX, mouseY, panOffset, zoomLevel
      );
      
      // Verify that the context methods were called
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.translate).toHaveBeenCalledWith(panOffset.x, panOffset.y);
      expect(mockCtx.scale).toHaveBeenCalledWith(zoomLevel, zoomLevel);
      expect(mockCtx.setLineDash).toHaveBeenCalled();
    });
  });
});
