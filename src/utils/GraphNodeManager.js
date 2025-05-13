import { NODE_TYPES } from './GraphConstants';
import nodeCreator from '../operations/NodeCreator';

/**
 * Class responsible for managing nodes in the graph canvas
 */
class GraphNodeManager {
  /**
   * Check if a node name already exists
   * @param {Array} nodes - Current nodes in the graph
   * @param {string} name - Name to check for uniqueness
   * @returns {boolean} - True if name is unique
   */
  isNodeNameUnique(nodes, name) {
    return !nodes.some(node => {
      // Check against bankId for bank nodes
      if (node.type === NODE_TYPES.BANK && node.properties.bankId === name) {
        return true;
      }
      // Check against name property for other node types
      if (node.properties.name === name) {
        return true;
      }
      return false;
    });
  }

  /**
   * Add a new Bank node at the specified position
   */
  addBankNode(x, y, nodes, nextBankId, setNodes, setNextBankId, setError) {
    // Generate a unique bank ID
    let bankId;
    let counter = nextBankId;
    
    do {
      bankId = `BANK${counter}`;
      counter++;
    } while (!this.isNodeNameUnique(nodes, bankId));
    
    const newNode = nodeCreator.createBankNode(x, y, counter - 1);
    setNextBankId(counter);
    setNodes([...nodes, newNode]);
    return newNode;
  }

  /**
   * Add a new Credit Line node at the specified position
   */
  addCreditLineNode(x, y, nodes, nextCreditLineId, setNodes, setNextCreditLineId, setError) {
    // Generate a unique credit line ID
    let clId;
    let counter = nextCreditLineId;
    
    do {
      clId = `CL${counter}`;
      counter++;
    } while (!this.isNodeNameUnique(nodes, clId));
    
    const newNode = nodeCreator.createCreditLineNode(x, y, counter - 1);
    setNextCreditLineId(counter);
    setNodes([...nodes, newNode]);
    return newNode;
  }

  /**
   * Add a new Projection node at the specified position
   */
  addProjectionNode(x, y, nodes, nextProjectionId, setNodes, setNextProjectionId, setError) {
    // Generate a unique projection ID
    let projName;
    let counter = nextProjectionId;
    
    do {
      projName = `PRJ_ENT${counter}`;
      counter++;
    } while (!this.isNodeNameUnique(nodes, projName));
    
    const newNode = nodeCreator.createProjectionNode(x, y, counter - 1);
    setNextProjectionId(counter);
    setNodes([...nodes, newNode]);
    return newNode;
  }

  /**
   * Add a new Street node at the specified position
   */
  addStreetNode(x, y, nodes, nextStreetId, setNodes, setNextStreetId, setError) {
    // Check if a street node already exists
    const streetNodeExists = nodes.some(node => node.type === NODE_TYPES.STREET);
    
    if (streetNodeExists) {
      setError('Error: Only one Street node is allowed');
      setTimeout(() => setError(null), 3000);
      return null;
    }
    
    // Generate a unique street ID
    let streetId;
    let counter = nextStreetId;
    
    do {
      streetId = `STREET${counter}`;
      counter++;
    } while (!this.isNodeNameUnique(nodes, streetId));
    
    const newNode = nodeCreator.createStreetNode(x, y, counter - 1);
    setNextStreetId(counter);
    setNodes([...nodes, newNode]);
    return newNode;
  }

  /**
   * Validate and update node properties
   */
  updateNodeProperties(nodes, nodeId, updatedProperties, setError) {
    // Get the node being updated
    const nodeToUpdate = nodes.find(node => node.id === nodeId);
    if (!nodeToUpdate) return false;
    
    // For bank nodes, check bankId
    if (nodeToUpdate.type === NODE_TYPES.BANK && updatedProperties.bankId) {
      // Check if the new bankId is unique (excluding the current node)
      const isDuplicate = nodes.some(node => 
        node.id !== nodeId && 
        node.type === NODE_TYPES.BANK && 
        node.properties.bankId === updatedProperties.bankId
      );
      
      if (isDuplicate) {
        setError(`Error: Bank ID '${updatedProperties.bankId}' already exists`);
        setTimeout(() => setError(null), 3000);
        return false;
      }
    }
    
    // For other node types, check name property
    if (updatedProperties.name) {
      // Check if the new name is unique (excluding the current node)
      const isDuplicate = nodes.some(node => 
        node.id !== nodeId && 
        node.properties.name === updatedProperties.name
      );
      
      if (isDuplicate) {
        setError(`Error: Node name '${updatedProperties.name}' already exists`);
        setTimeout(() => setError(null), 3000);
        return false;
      }
    }
    
    return true;
  }
}

// Create and export a singleton instance
const graphNodeManager = new GraphNodeManager();
export default graphNodeManager;
