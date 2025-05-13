/**
 * Utility functions for mathematical operations in the graph
 */

/**
 * Calculate the distance between a point and a line segment
 * @param {number} x - X coordinate of the point
 * @param {number} y - Y coordinate of the point
 * @param {number} startX - X coordinate of the line segment start
 * @param {number} startY - Y coordinate of the line segment start
 * @param {number} endX - X coordinate of the line segment end
 * @param {number} endY - Y coordinate of the line segment end
 * @returns {number} - The distance from the point to the line segment
 */
export const distanceToLineSegment = (x, y, startX, startY, endX, endY) => {
  const A = x - startX;
  const B = y - startY;
  const C = endX - startX;
  const D = endY - startY;

  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;

  if (len_sq !== 0) param = dot / len_sq;

  let xx, yy;

  if (param < 0) {
    xx = startX;
    yy = startY;
  } else if (param > 1) {
    xx = endX;
    yy = endY;
  } else {
    xx = startX + param * C;
    yy = startY + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Check if a point is within a circle
 * @param {number} x - X coordinate of the point
 * @param {number} y - Y coordinate of the point
 * @param {number} centerX - X coordinate of the circle center
 * @param {number} centerY - Y coordinate of the circle center
 * @param {number} radius - Radius of the circle
 * @returns {boolean} - True if the point is within the circle
 */
export const isPointInCircle = (x, y, centerX, centerY, radius) => {
  const dx = x - centerX;
  const dy = y - centerY;
  return dx * dx + dy * dy <= radius * radius;
};

/**
 * Calculate the angle between two points
 * @param {number} x1 - X coordinate of the first point
 * @param {number} y1 - Y coordinate of the first point
 * @param {number} x2 - X coordinate of the second point
 * @param {number} y2 - Y coordinate of the second point
 * @returns {number} - The angle in radians
 */
export const calculateAngle = (x1, y1, x2, y2) => {
  return Math.atan2(y2 - y1, x2 - x1);
};

/**
 * Calculate the midpoint between two points
 * @param {number} x1 - X coordinate of the first point
 * @param {number} y1 - Y coordinate of the first point
 * @param {number} x2 - X coordinate of the second point
 * @param {number} y2 - Y coordinate of the second point
 * @returns {Object} - The midpoint coordinates {x, y}
 */
export const calculateMidpoint = (x1, y1, x2, y2) => {
  return {
    x: (x1 + x2) / 2,
    y: (y1 + y2) / 2
  };
};

/**
 * Convert screen coordinates to world coordinates
 * @param {number} screenX - Screen X coordinate
 * @param {number} screenY - Screen Y coordinate
 * @param {number} panOffsetX - X pan offset
 * @param {number} panOffsetY - Y pan offset
 * @param {number} zoomLevel - Current zoom level
 * @returns {Object} - World coordinates {x, y}
 */
export const screenToWorldCoordinates = (screenX, screenY, panOffsetX, panOffsetY, zoomLevel) => {
  return {
    x: (screenX - panOffsetX) / zoomLevel,
    y: (screenY - panOffsetY) / zoomLevel
  };
};
