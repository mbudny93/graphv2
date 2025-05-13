/**
 * Class responsible for creating different types of nodes
 */
import { NODE_TYPES } from '../utils/GraphConstants';

class NodeCreator {
  /**
   * Create a new bank node
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} nextBankId - Next sequential bank ID
   * @returns {Object} - The created bank node
   */
  createBankNode(x, y, nextBankId) {
    const bankId = `BANK${nextBankId}`;
    
    return {
      id: `bank-${nextBankId}`,
      x,
      y,
      type: NODE_TYPES.BANK,
      properties: {
        bankId: bankId,
        entity: 'GSCO',
        routingCode: 'HATRUS33',
        currency: 'USD',
        projected: 500,
        actual: 200,
        min: 100,
        max: 900,
        creditLine: null,
        beneficialLocation: false,
        projectionAware: false,
        streetCover: false,
      },
    };
  }

  /**
   * Create a new credit line node
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} nextCreditLineId - Next sequential credit line ID
   * @returns {Object} - The created credit line node
   */
  createCreditLineNode(x, y, nextCreditLineId) {
    const clId = `CL${nextCreditLineId}`;
    
    return {
      id: `cl-${nextCreditLineId}`,
      x,
      y,
      type: NODE_TYPES.CREDIT_LINE,
      properties: {
        name: clId,
        amount: 1000,
      },
    };
  }

  /**
   * Create a new projection node
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} nextProjectionId - Next sequential projection ID
   * @returns {Object} - The created projection node
   */
  createProjectionNode(x, y, nextProjectionId) {
    const projName = `PRJ_ENT${nextProjectionId}`;
    
    return {
      id: `proj-${nextProjectionId}`,
      x,
      y,
      type: NODE_TYPES.PROJECTION,
      properties: {
        name: projName,
        factor: 1.0,
      },
    };
  }

  /**
   * Create a new street node
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} nextStreetId - Next sequential street ID
   * @returns {Object} - The created street node
   */
  createStreetNode(x, y, nextStreetId) {
    const streetId = `STREET${nextStreetId}`;
    
    return {
      id: `street-${nextStreetId}`,
      x,
      y,
      type: NODE_TYPES.STREET,
      properties: {
        name: streetId,
        capacity: 5000,
      },
    };
  }
}

// Create and export a singleton instance
const nodeCreator = new NodeCreator();
export default nodeCreator;
