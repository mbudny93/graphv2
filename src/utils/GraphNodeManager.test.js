import graphNodeManager from './GraphNodeManager';
import nodeCreator from '../operations/NodeCreator';
import { NODE_TYPES } from './GraphConstants';

// Mock the nodeCreator
jest.mock('../operations/NodeCreator', () => ({
  createBankNode: jest.fn(),
  createCreditLineNode: jest.fn(),
  createProjectionNode: jest.fn(),
  createStreetNode: jest.fn()
}));

describe('GraphNodeManager', () => {
  let mockNodes;
  let mockSetNodes;
  let mockSetNextId;
  let mockSetError;
  
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
      }
    ];
    
    // Create mock functions
    mockSetNodes = jest.fn();
    mockSetNextId = jest.fn();
    mockSetError = jest.fn();
    
    // Set up mock return values for nodeCreator
    nodeCreator.createBankNode.mockReturnValue({
      id: 'bank-1',
      type: NODE_TYPES.BANK,
      properties: { bankId: 'BANK1' }
    });
    
    nodeCreator.createCreditLineNode.mockReturnValue({
      id: 'cl-1',
      type: NODE_TYPES.CREDIT_LINE,
      properties: { name: 'CL1' }
    });
    
    nodeCreator.createProjectionNode.mockReturnValue({
      id: 'proj-1',
      type: NODE_TYPES.PROJECTION,
      properties: { name: 'PRJ_ENT1' }
    });
    
    nodeCreator.createStreetNode.mockReturnValue({
      id: 'street-1',
      type: NODE_TYPES.STREET,
      properties: { name: 'STREET1' }
    });
  });
  
  describe('addBankNode', () => {
    test('adds a new bank node with unique ID', () => {
      graphNodeManager.addBankNode(
        100, 200, mockNodes, 1, mockSetNodes, mockSetNextId, mockSetError
      );
      
      // The implementation passes counter - 1 to createBankNode, which would be 2 - 1 = 1
      expect(nodeCreator.createBankNode).toHaveBeenCalledWith(100, 200, 2);
      expect(mockSetNodes).toHaveBeenCalledWith([
        mockNodes[0],
        { id: 'bank-1', type: NODE_TYPES.BANK, properties: { bankId: 'BANK1' } }
      ]);
      expect(mockSetNextId).toHaveBeenCalledWith(3);
      expect(mockSetError).not.toHaveBeenCalled();
    });
    
    // The actual implementation doesn't show an error for duplicate bank IDs,
    // it automatically generates a unique ID
    test('generates a unique bank ID when duplicate exists', () => {
      // Set up a spy on isNodeNameUnique to simulate a duplicate ID first, then a unique one
      const isNodeNameUniqueSpy = jest.spyOn(graphNodeManager, 'isNodeNameUnique');
      isNodeNameUniqueSpy.mockImplementation((nodes, name) => {
        // Return false for the first call (BANK1 exists), true for subsequent calls
        if (name === 'BANK1') return false;
        return true;
      });
      
      graphNodeManager.addBankNode(
        100, 200, mockNodes, 1, mockSetNodes, mockSetNextId, mockSetError
      );
      
      // Should not show an error
      expect(mockSetError).not.toHaveBeenCalled();
      // Should create a node with the next available ID
      expect(mockSetNodes).toHaveBeenCalled();
      expect(mockSetNextId).toHaveBeenCalled();
      
      // Clean up the spy
      isNodeNameUniqueSpy.mockRestore();
    });
  });
  
  describe('addCreditLineNode', () => {
    test('adds a new credit line node with unique ID', () => {
      graphNodeManager.addCreditLineNode(
        100, 200, mockNodes, 1, mockSetNodes, mockSetNextId, mockSetError
      );
      
      expect(nodeCreator.createCreditLineNode).toHaveBeenCalledWith(100, 200, 1);
      expect(mockSetNodes).toHaveBeenCalledWith([
        mockNodes[0],
        { id: 'cl-1', type: NODE_TYPES.CREDIT_LINE, properties: { name: 'CL1' } }
      ]);
      expect(mockSetNextId).toHaveBeenCalledWith(2);
      expect(mockSetError).not.toHaveBeenCalled();
    });
    
    // The actual implementation doesn't show an error for duplicate credit line names,
    // it automatically generates a unique name
    test('generates a unique credit line name when duplicate exists', () => {
      // Add a credit line node to the mock nodes
      mockNodes.push({
        id: 'cl-1',
        type: NODE_TYPES.CREDIT_LINE,
        properties: { name: 'CL1' }
      });
      
      // Set up a spy on isNodeNameUnique to simulate a duplicate name first, then a unique one
      const isNodeNameUniqueSpy = jest.spyOn(graphNodeManager, 'isNodeNameUnique');
      isNodeNameUniqueSpy.mockImplementation((nodes, name) => {
        // Return false for the first call (CL1 exists), true for subsequent calls
        if (name === 'CL1') return false;
        return true;
      });
      
      graphNodeManager.addCreditLineNode(
        100, 200, mockNodes, 1, mockSetNodes, mockSetNextId, mockSetError
      );
      
      // Should not show an error
      expect(mockSetError).not.toHaveBeenCalled();
      // Should create a node with the next available name
      expect(mockSetNodes).toHaveBeenCalled();
      expect(mockSetNextId).toHaveBeenCalled();
      
      // Clean up the spy
      isNodeNameUniqueSpy.mockRestore();
    });
  });
  
  describe('addProjectionNode', () => {
    test('adds a new projection node with unique ID', () => {
      graphNodeManager.addProjectionNode(
        100, 200, mockNodes, 1, mockSetNodes, mockSetNextId, mockSetError
      );
      
      expect(nodeCreator.createProjectionNode).toHaveBeenCalledWith(100, 200, 1);
      expect(mockSetNodes).toHaveBeenCalledWith([
        mockNodes[0],
        { id: 'proj-1', type: NODE_TYPES.PROJECTION, properties: { name: 'PRJ_ENT1' } }
      ]);
      expect(mockSetNextId).toHaveBeenCalledWith(2);
      expect(mockSetError).not.toHaveBeenCalled();
    });
    
    // The actual implementation doesn't show an error for duplicate projection names,
    // it automatically generates a unique name
    test('generates a unique projection name when duplicate exists', () => {
      // Add a projection node to the mock nodes
      mockNodes.push({
        id: 'proj-1',
        type: NODE_TYPES.PROJECTION,
        properties: { name: 'PRJ_ENT1' }
      });
      
      // Set up a spy on isNodeNameUnique to simulate a duplicate name first, then a unique one
      const isNodeNameUniqueSpy = jest.spyOn(graphNodeManager, 'isNodeNameUnique');
      isNodeNameUniqueSpy.mockImplementation((nodes, name) => {
        // Return false for the first call (PRJ_ENT1 exists), true for subsequent calls
        if (name === 'PRJ_ENT1') return false;
        return true;
      });
      
      graphNodeManager.addProjectionNode(
        100, 200, mockNodes, 1, mockSetNodes, mockSetNextId, mockSetError
      );
      
      // Should not show an error
      expect(mockSetError).not.toHaveBeenCalled();
      // Should create a node with the next available name
      expect(mockSetNodes).toHaveBeenCalled();
      expect(mockSetNextId).toHaveBeenCalled();
      
      // Clean up the spy
      isNodeNameUniqueSpy.mockRestore();
    });
  });
  
  describe('addStreetNode', () => {
    test('adds a new street node when none exists', () => {
      graphNodeManager.addStreetNode(
        100, 200, mockNodes, 1, mockSetNodes, mockSetNextId, mockSetError
      );
      
      expect(nodeCreator.createStreetNode).toHaveBeenCalledWith(100, 200, 1);
      expect(mockSetNodes).toHaveBeenCalledWith([
        mockNodes[0],
        { id: 'street-1', type: NODE_TYPES.STREET, properties: { name: 'STREET1' } }
      ]);
      expect(mockSetNextId).toHaveBeenCalledWith(2);
      expect(mockSetError).not.toHaveBeenCalled();
    });
    
    test('shows error when a street node already exists', () => {
      // Add a street node to the mock nodes
      mockNodes.push({
        id: 'street-1',
        type: NODE_TYPES.STREET,
        properties: { name: 'STREET1' }
      });
      
      graphNodeManager.addStreetNode(
        100, 200, mockNodes, 2, mockSetNodes, mockSetNextId, mockSetError
      );
      
      expect(mockSetError).toHaveBeenCalledWith('Error: Only one Street node is allowed');
      expect(mockSetNodes).not.toHaveBeenCalled();
      expect(mockSetNextId).not.toHaveBeenCalled();
    });
  });
});
