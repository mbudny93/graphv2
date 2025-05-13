import { distanceToLineSegment, isPointInCircle } from './GraphMathUtils';

describe('GraphMathUtils', () => {
  describe('distanceToLineSegment', () => {
    test('returns 0 for a point on the line segment', () => {
      // Point (150, 150) is on the line segment from (100, 100) to (200, 200)
      const distance = distanceToLineSegment(150, 150, 100, 100, 200, 200);
      expect(distance).toBeCloseTo(0);
    });

    test('returns correct distance for a point perpendicular to the line segment', () => {
      // Point (0, 100) is perpendicular to the line segment from (0, 0) to (100, 0)
      // The distance should be 100
      const distance = distanceToLineSegment(0, 100, 0, 0, 100, 0);
      expect(distance).toBeCloseTo(100);
    });

    test('returns distance to start point when projection is before start', () => {
      // Point (50, 50) projects before the start of line segment from (100, 100) to (200, 200)
      // Distance should be sqrt((100-50)^2 + (100-50)^2) = sqrt(5000) ≈ 70.71
      const distance = distanceToLineSegment(50, 50, 100, 100, 200, 200);
      expect(distance).toBeCloseTo(70.71, 1);
    });

    test('returns distance to end point when projection is after end', () => {
      // Point (250, 250) projects after the end of line segment from (100, 100) to (200, 200)
      // Distance should be sqrt((250-200)^2 + (250-200)^2) = sqrt(5000) ≈ 70.71
      const distance = distanceToLineSegment(250, 250, 100, 100, 200, 200);
      expect(distance).toBeCloseTo(70.71, 1);
    });

    test('handles horizontal line segments', () => {
      // Point (150, 50) is 50 units above the horizontal line segment from (100, 0) to (200, 0)
      const distance = distanceToLineSegment(150, 50, 100, 0, 200, 0);
      expect(distance).toBeCloseTo(50);
    });

    test('handles vertical line segments', () => {
      // Point (50, 150) is 50 units to the left of the vertical line segment from (0, 100) to (0, 200)
      const distance = distanceToLineSegment(50, 150, 0, 100, 0, 200);
      expect(distance).toBeCloseTo(50);
    });

    test('handles zero-length line segments (points)', () => {
      // When start and end are the same point, it should return the distance to that point
      const distance = distanceToLineSegment(100, 100, 200, 200, 200, 200);
      expect(distance).toBeCloseTo(141.42, 1); // sqrt(20000) ≈ 141.42
    });
  });

  describe('isPointInCircle', () => {
    test('returns true for a point at the center of the circle', () => {
      const result = isPointInCircle(100, 100, 100, 100, 10);
      expect(result).toBe(true);
    });

    test('returns true for a point inside the circle', () => {
      const result = isPointInCircle(105, 105, 100, 100, 10);
      expect(result).toBe(true);
    });

    test('returns true for a point exactly on the circle boundary', () => {
      // Point (110, 100) is exactly 10 units from center (100, 100)
      const result = isPointInCircle(110, 100, 100, 100, 10);
      expect(result).toBe(true);
    });

    test('returns false for a point outside the circle', () => {
      const result = isPointInCircle(120, 120, 100, 100, 10);
      expect(result).toBe(false);
    });

    test('returns false for a point just outside the circle boundary', () => {
      // Point (111, 100) is 11 units from center (100, 100)
      const result = isPointInCircle(111, 100, 100, 100, 10);
      expect(result).toBe(false);
    });

    test('handles zero radius', () => {
      // With zero radius, only the center point should be in the circle
      const resultCenter = isPointInCircle(100, 100, 100, 100, 0);
      const resultOutside = isPointInCircle(100, 101, 100, 100, 0);
      
      expect(resultCenter).toBe(true);
      expect(resultOutside).toBe(false);
    });

    test('handles negative radius by treating it as positive', () => {
      // Negative radius should be treated as its absolute value
      const result = isPointInCircle(105, 105, 100, 100, -10);
      expect(result).toBe(true);
    });
  });
});
