/**
 * Constants used throughout the graph application
 */

// Node radius
export const NODE_RADIUS = 30;

// Node types
export const NODE_TYPES = {
  BANK: 'bank',
  CREDIT_LINE: 'creditLine',
  PROJECTION: 'projection',
  STREET: 'street'
};

// Edge properties
export const EDGE_PROPERTIES = {
  DEFAULT_COST: 4,
  BANK_TO_CREDIT_LINE_COST: 1,
  BANK_TO_PROJECTION_COST: 1,
  BANK_TO_STREET_COST: 1000,
  DEFAULT_FLOW_TYPE: 'INTRABANK'
};

// Operation modes
export const OPERATION_MODES = {
  SELECT: 'select',
  CONNECT: 'connect',
  CONNECT_BIDIRECTIONAL: 'connectBidirectional',
  DELETE: 'delete',
  ADD_BANK: 'addBank',
  ADD_CREDIT_LINE: 'addCreditLine',
  ADD_PROJECTION: 'addProjection',
  ADD_STREET: 'addStreet'
};

// Drawing constants
export const DRAWING = {
  ARROW_LENGTH: 8,
  EDGE_OFFSET_DISTANCE: 5,
  SELECTED_EDGE_COLOR: '#1976d2',
  NORMAL_EDGE_COLOR: '#999',
  SELECTED_EDGE_WIDTH: 3,
  NORMAL_EDGE_WIDTH: 2,
  ARROW_FILL_COLOR: '#666',
  ARROW_STROKE_COLOR: '#333',
  ARROW_STROKE_WIDTH: 0.5,
  COST_LABEL_FONT_SIZE: 14,
  COST_LABEL_MIN_FONT_SIZE: 8,
  COST_LABEL_BACKGROUND_COLOR: 'rgba(255, 255, 255, 0.8)',
  COST_LABEL_PADDING: 3,
  COST_LABEL_TEXT_COLOR: '#333'
};

// Error message display duration in milliseconds
export const ERROR_DISPLAY_DURATION = 3000;
