import nodeCreator from './NodeCreator';
import { NODE_TYPES } from '../utils/GraphConstants';

describe('NodeCreator', () => {
  describe('createBankNode', () => {
    test('creates a bank node with correct properties', () => {
      const x = 100;
      const y = 200;
      const id = 1;
      
      const node = nodeCreator.createBankNode(x, y, id);
      
      // Only check the essential properties, as the implementation may have additional properties
      expect(node.id).toBe('bank-1');
      expect(node.type).toBe(NODE_TYPES.BANK);
      expect(node.x).toBe(100);
      expect(node.y).toBe(200);
      expect(node.properties.bankId).toBe('BANK1');
    });
    
    test('handles different id values', () => {
      const node = nodeCreator.createBankNode(100, 200, 42);
      
      expect(node.id).toBe('bank-42');
      expect(node.properties.bankId).toBe('BANK42');
    });
  });
  
  describe('createCreditLineNode', () => {
    test('creates a credit line node with correct properties', () => {
      const x = 100;
      const y = 200;
      const id = 1;
      
      const node = nodeCreator.createCreditLineNode(x, y, id);
      
      // Only check the essential properties, as the implementation may have additional properties
      expect(node.id).toBe('cl-1');
      expect(node.type).toBe(NODE_TYPES.CREDIT_LINE);
      expect(node.x).toBe(100);
      expect(node.y).toBe(200);
      expect(node.properties.name).toBe('CL1');
    });
    
    test('handles different id values', () => {
      const node = nodeCreator.createCreditLineNode(100, 200, 42);
      
      expect(node.id).toBe('cl-42');
      expect(node.properties.name).toBe('CL42');
    });
  });
  
  describe('createProjectionNode', () => {
    test('creates a projection node with correct properties', () => {
      const x = 100;
      const y = 200;
      const id = 1;
      
      const node = nodeCreator.createProjectionNode(x, y, id);
      
      // Only check the essential properties, as the implementation may have additional properties
      expect(node.id).toBe('proj-1');
      expect(node.type).toBe(NODE_TYPES.PROJECTION);
      expect(node.x).toBe(100);
      expect(node.y).toBe(200);
      expect(node.properties.name).toBe('PRJ_ENT1');
    });
    
    test('handles different id values', () => {
      const node = nodeCreator.createProjectionNode(100, 200, 42);
      
      expect(node.id).toBe('proj-42');
      expect(node.properties.name).toBe('PRJ_ENT42');
    });
  });
  
  describe('createStreetNode', () => {
    test('creates a street node with correct properties', () => {
      const x = 100;
      const y = 200;
      const id = 1;
      
      const node = nodeCreator.createStreetNode(x, y, id);
      
      // Only check the essential properties, as the implementation may have additional properties
      expect(node.id).toBe('street-1');
      expect(node.type).toBe(NODE_TYPES.STREET);
      expect(node.x).toBe(100);
      expect(node.y).toBe(200);
      expect(node.properties.name).toBe('STREET1');
    });
    
    test('handles different id values', () => {
      const node = nodeCreator.createStreetNode(100, 200, 42);
      
      expect(node.id).toBe('street-42');
      expect(node.properties.name).toBe('STREET42');
    });
  });
});
