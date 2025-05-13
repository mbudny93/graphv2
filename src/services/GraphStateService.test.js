import graphStateService from './GraphStateService';
import { NODE_TYPES } from '../utils/GraphConstants';

describe('GraphStateService', () => {
  let mockNodes;
  let mockEdges;
  
  beforeEach(() => {
    // Create mock nodes
    mockNodes = [
      {
        id: 'bank-1',
        type: NODE_TYPES.BANK,
        x: 100,
        y: 100,
        properties: {
          bankId: 'BANK1',
          creditLine: 'CL1'
        }
      },
      {
        id: 'bank-2',
        type: NODE_TYPES.BANK,
        x: 200,
        y: 100,
        properties: {
          bankId: 'BANK2'
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
        id: 'proj-1',
        type: NODE_TYPES.PROJECTION,
        x: 100,
        y: 300,
        properties: {
          name: 'PRJ_ENT1'
        }
      },
      {
        id: 'street-1',
        type: NODE_TYPES.STREET,
        x: 300,
        y: 300,
        properties: {
          name: 'STREET1'
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
          flowId: 'BANK1_CL1',
          cost: 1
        }
      },
      {
        id: 'bank-2-proj-1',
        source: 'bank-2',
        target: 'proj-1',
        properties: {
          flowId: 'BANK2_PRJ_ENT1',
          cost: 1
        }
      }
    ];
  });
  
  describe('formatGraphState', () => {
    test('formats the graph state correctly', () => {
      const formattedState = graphStateService.formatGraphState(mockNodes, mockEdges);
      
      expect(formattedState).toEqual({
        bankNodes: [
          {
            id: 'bank-1',
            x: 100,
            y: 100,
            properties: {
              bankId: 'BANK1',
              creditLine: 'CL1'
            }
          },
          {
            id: 'bank-2',
            x: 200,
            y: 100,
            properties: {
              bankId: 'BANK2'
            }
          }
        ],
        creditLineNodes: [
          {
            id: 'cl-1',
            x: 150,
            y: 200,
            properties: {
              name: 'CL1'
            }
          }
        ],
        projectionNodes: [
          {
            id: 'proj-1',
            x: 100,
            y: 300,
            properties: {
              name: 'PRJ_ENT1'
            }
          }
        ],
        streetNodes: [
          {
            id: 'street-1',
            x: 300,
            y: 300,
            properties: {
              name: 'STREET1'
            }
          }
        ],
        edges: [
          {
            id: 'bank-1-cl-1',
            source: 'bank-1',
            target: 'cl-1',
            properties: {
              flowId: 'BANK1_CL1',
              cost: 1
            }
          },
          {
            id: 'bank-2-proj-1',
            source: 'bank-2',
            target: 'proj-1',
            properties: {
              flowId: 'BANK2_PRJ_ENT1',
              cost: 1
            }
          }
        ]
      });
    });
  });
  
  describe('edgeExists', () => {
    test('returns true when edge exists', () => {
      const exists = graphStateService.edgeExists(mockEdges, 'bank-1', 'cl-1');
      expect(exists).toBe(true);
    });
    
    test('returns false when edge does not exist', () => {
      const exists = graphStateService.edgeExists(mockEdges, 'bank-1', 'proj-1');
      expect(exists).toBe(false);
    });
    
    test('returns false when source and target are swapped', () => {
      const exists = graphStateService.edgeExists(mockEdges, 'cl-1', 'bank-1');
      expect(exists).toBe(false);
    });
  });
  
  describe('bidirectionalConnectionExists', () => {
    test('returns false when only one direction exists', () => {
      const exists = graphStateService.bidirectionalConnectionExists(mockEdges, 'bank-1', 'cl-1');
      expect(exists).toBe(false);
    });
    
    test('returns true when both directions exist', () => {
      // Add reverse edge
      const edgesWithBidirectional = [
        ...mockEdges,
        {
          id: 'cl-1-bank-1',
          source: 'cl-1',
          target: 'bank-1',
          properties: {
            flowId: 'CL1_BANK1',
            cost: 1
          }
        }
      ];
      
      const exists = graphStateService.bidirectionalConnectionExists(edgesWithBidirectional, 'bank-1', 'cl-1');
      expect(exists).toBe(true);
    });
  });
  
  describe('findNodeById', () => {
    test('returns the node when it exists', () => {
      const node = graphStateService.findNodeById(mockNodes, 'bank-1');
      expect(node).toBe(mockNodes[0]);
    });
    
    test('returns null when node does not exist', () => {
      const node = graphStateService.findNodeById(mockNodes, 'nonexistent-node');
      expect(node).toBeNull();
    });
  });
  
  describe('findEdgeById', () => {
    test('returns the edge when it exists', () => {
      const edge = graphStateService.findEdgeById(mockEdges, 'bank-1-cl-1');
      expect(edge).toBe(mockEdges[0]);
    });
    
    test('returns null when edge does not exist', () => {
      const edge = graphStateService.findEdgeById(mockEdges, 'nonexistent-edge');
      expect(edge).toBeNull();
    });
  });
  
  describe('updateNodeProperties', () => {
    test('updates node properties correctly', () => {
      const updatedNodes = graphStateService.updateNodeProperties(mockNodes, 'bank-1', {
        entity: 'ENT2'
      });
      
      expect(updatedNodes[0].properties.entity).toBe('ENT2');
      expect(updatedNodes[0].properties.bankId).toBe('BANK1'); // Original property preserved
    });
    
    test('updates credit line name and connected bank nodes', () => {
      const updatedNodes = graphStateService.updateNodeProperties(mockNodes, 'cl-1', {
        name: 'CL1_UPDATED'
      });
      
      // The credit line node should be updated
      const updatedCreditLine = updatedNodes.find(node => node.id === 'cl-1');
      expect(updatedCreditLine.properties.name).toBe('CL1_UPDATED');
      
      // The bank node connected to this credit line should also be updated
      const updatedBank = updatedNodes.find(node => node.id === 'bank-1');
      expect(updatedBank.properties.creditLine).toBe('CL1_UPDATED');
    });
    
    test('returns original array when node not found', () => {
      const updatedNodes = graphStateService.updateNodeProperties(mockNodes, 'nonexistent-node', {
        property: 'value'
      });
      
      expect(updatedNodes).toEqual(mockNodes);
    });
  });
  
  describe('updateEdgeProperties', () => {
    test('updates edge properties correctly', () => {
      const updatedEdges = graphStateService.updateEdgeProperties(mockEdges, 'bank-1-cl-1', {
        cost: 5
      });
      
      expect(updatedEdges[0].properties.cost).toBe(5);
      expect(updatedEdges[0].properties.flowId).toBe('BANK1_CL1'); // Original property preserved
    });
    
    test('returns original array when edge not found', () => {
      const updatedEdges = graphStateService.updateEdgeProperties(mockEdges, 'nonexistent-edge', {
        property: 'value'
      });
      
      expect(updatedEdges).toEqual(mockEdges);
    });
  });
});
