// src/Utils/canvasHelpers.js
/**
 * Calculates the Euclidean distance between two points.
 * Points can be in {offsetX, offsetY} or {x, y} format.
 * @param {object} p1 - First point.
 * @param {object} p2 - Second point.
 * @returns {number} The distance between the two points.
 */
export const calculateDistance = (p1, p2) => {
  const getPointX = (p) => p.offsetX !== undefined ? p.offsetX : p.x;
  const getPointY = (p) => p.offsetY !== undefined ? p.offsetY : p.y;
  const dx = getPointX(p2) - getPointX(p1);
  const dy = getPointY(p2) - getPointY(p1);
  return Math.sqrt(dx * dx + dy * dy);
};
/**
 * Helper to get coordinate value (x or y) from a point object,
 * handling both {x, y} and {offsetX, offsetY} formats.
 * @param {object} p - The point object.
 * @returns {number} The x-coordinate.
 */
export const getPointX = (p) => p.offsetX !== undefined ? p.offsetX : p.x;
/**
 * Helper to get coordinate value (x or y) from a point object,
 * handling both {x, y} and {offsetX, offsetY} formats.
 * @param {object} p - The point object.
 * @returns {number} The y-coordinate.
 */
export const getPointY = (p) => p.offsetY !== undefined ? p.offsetY : p.y;
/**
 * --- HELPER FUNCTION: Catmull-Rom Spline interpolation ---
 * Generates points along a Catmull-Rom spline curve.
 * @param {Array<object>} points - Array of control points.
 * @param {number} tension - Tension value (0.0 for Catmull-Rom, 1.0 for straight lines).
 * @param {number} numOfSegments - Number of segments to generate between each control point pair.
 * @returns {Array<object>} An array of interpolated points.
 */
export const getCatmullRomSplinePoints = (points, tension, numOfSegments) => {
  if (points.length < 2) return [...points]; // Return a copy if not enough points
  const resultPoints = [];
  const numPoints = points.length;
  // Add virtual start and end points for open curves to prevent flattening at ends
  const p = [];
  p.push(points[0]); // Virtual start point (duplicates first real point)
  for (let i = 0; i < numPoints; i++) {
    p.push(points[i]);
  }
  p.push(points[numPoints - 1]); // Virtual end point (duplicates last real point)
  // Catmull-Rom algorithm
  for (let i = 1; i < p.length - 2; i++) {
    for (let t = 0; t <= numOfSegments; t++) {
      const T = t / numOfSegments; // Parameter from 0 to 1
      const t2 = T * T;
      const t3 = T * t2;
      // Catmull-Rom basis functions
      const h1 = 2 * t3 - 3 * t2 + 1;
      const h2 = -2 * t3 + 3 * t2;
      const h3 = t3 - 2 * t2 + T;
      const h4 = t3 - t2;
      // Use helper functions for consistent coordinate access
      const v1x = (getPointX(p[i + 1]) - getPointX(p[i - 1])) * tension;
      const v1y = (getPointY(p[i + 1]) - getPointY(p[i - 1])) * tension;
      const v2x = (getPointX(p[i + 2]) - getPointX(p[i])) * tension;
      const v2y = (getPointY(p[i + 2]) - getPointY(p[i])) * tension;
      const x = h1 * getPointX(p[i]) + h2 * getPointX(p[i + 1]) + h3 * v1x + h4 * v2x;
      const y = h1 * getPointY(p[i]) + h2 * getPointY(p[i + 1]) + h3 * v1y + h4 * v2y;
      // Always return points in offsetX/offsetY format for consistency
      resultPoints.push({ offsetX: x, offsetY: y });
    }
  }
  return resultPoints;
};
/**
 * Transforms a point across a mirror line.
 * @param {object} point - The point to transform ({offsetX, offsetY}).
 * @param {object} mirrorProps - Mirror ruler properties ({x, y, rotation}).
 * @returns {object} The transformed (mirrored) point.
 */
export const transformPointForMirror = (point, mirrorProps) => {
  const { x, y, rotation } = mirrorProps;
  const rotationRadians = rotation * (Math.PI / 180);
  // 1. Translate point so mirror line origin (x,y) is at (0,0)
  const translatedX = point.offsetX - x;
  const translatedY = point.offsetY - y;
  // 2. Rotate point by -rotationRadians so mirror line is horizontal (along X-axis)
  const cosTheta = Math.cos(-rotationRadians);
  const sinTheta = Math.sin(-rotationRadians);
  const rotatedX = translatedX * cosTheta - translatedY * sinTheta;
  const rotatedY = translatedX * sinTheta + translatedY * cosTheta;
  // 3. Reflect across the X-axis (mirroring)
  const reflectedY = -rotatedY;
  // 4. Rotate back by +rotationRadians
  const finalRotatedX = rotatedX * Math.cos(rotationRadians) - reflectedY * Math.sin(rotationRadians);
  const finalRotatedY = rotatedX * Math.sin(rotationRadians) + reflectedY * Math.cos(rotationRadians);
  // 5. Translate back by mirror line origin (x,y)
  const mirroredX = finalRotatedX + x;
  const mirroredY = finalRotatedY + y;
  return { offsetX: mirroredX, offsetY: mirroredY };
};
/**
 * Snaps a point to a straight line segment defined by ruler properties.
 * @param {object} point - The point to snap ({offsetX, offsetY}).

 * @param {object} rulerGuideProperties - Straight ruler properties ({x, y, rotation, length, snapTolerance}).

 * @returns {object} The snapped point or the original point if outside tolerance.

 */

export const snapPointToStraightLine = (point, rulerGuideProperties) => {

  const { x: rX, y: rY, rotation, length, snapTolerance } = rulerGuideProperties;

  const rotationRadians = rotation * (Math.PI / 180);



  const rulerStart = { x: rX, y: rY };

  const rulerEnd = {

    x: rX + length * Math.cos(rotationRadians),

    y: rY + length * Math.sin(rotationRadians),

  };



  const A = rulerStart.x;

  const B = rulerStart.y;

  const C = rulerEnd.x;

  const D = rulerEnd.y;

  const Px = point.offsetX;

  const Py = point.offsetY;



  const lenSq = (C - A) * (C - A) + (D - B) * (D - B);

  if (lenSq === 0) {

    const distance = calculateDistance({ offsetX: Px, offsetY: Py }, { offsetX: A, offsetY: B });

    if (distance <= snapTolerance) {

      return { offsetX: A, offsetY: B };

    }

    return point;

  }



  let t = ((Px - A) * (C - A) + (Py - B) * (D - B)) / lenSq;

  t = Math.max(0, Math.min(1, t)); // Clamp t to [0, 1] for line segment



  const closestX = A + t * (C - A);

  const closestY = B + t * (D - B);



  const distanceToLine = calculateDistance({ offsetX: Px, offsetY: Py }, { offsetX: closestX, offsetY: closestY });



  if (distanceToLine <= snapTolerance) {

    return { offsetX: closestX, offsetY: closestY };

  }

  return point;

};



/**

 * Snaps a point to the circumference of an ellipse.

 * @param {object} point - The point to snap ({offsetX, offsetY}).

 * @param {object} ellipseRulerProperties - Ellipse ruler properties ({centerX, centerY, radiusX, radiusY, rotation, snapTolerance}).

 * @returns {object} The snapped point or the original point if outside tolerance.

 */

export const snapPointToEllipse = (point, ellipseRulerProperties) => {

  const { centerX, centerY, radiusX, radiusY, rotation, snapTolerance } = ellipseRulerProperties;



  const rotationRadians = rotation * (Math.PI / 180);



  // Translate and rotate point inverse to ellipse

  const cosTheta = Math.cos(-rotationRadians);

  const sinTheta = Math.sin(-rotationRadians);

  const dx = point.offsetX - centerX;

  const dy = point.offsetY - centerY;



  const rotatedX = dx * cosTheta - dy * sinTheta;

  const rotatedY = dx * sinTheta + dy * cosTheta;



  // Find angle on ellipse for closest point

  let angle = Math.atan2(rotatedY / radiusY, rotatedX / radiusX);



  // Calculate closest point on ellipse

  const ellipseX = centerX + radiusX * Math.cos(angle) * Math.cos(rotationRadians) - radiusY * Math.sin(angle) * Math.sin(rotationRadians);

  const ellipseY = centerY + radiusX * Math.cos(angle) * Math.sin(rotationRadians) + radiusY * Math.sin(angle) * Math.cos(rotationRadians);



  const distanceToEllipse = calculateDistance(point, { offsetX: ellipseX, offsetY: ellipseY });



  if (distanceToEllipse <= snapTolerance) {

    return { offsetX: ellipseX, offsetY: ellipseY };

  }

  return point;

};



/**

 * Checks if a point is inside an ellipse.

 * @param {object} point - The point to check ({offsetX, offsetY}).

 * @param {object} ellipseProps - Ellipse properties ({centerX, centerY, radiusX, radiusY, rotation}).

 * @returns {boolean} True if the point is inside the ellipse, false otherwise.

 */

export const isPointInsideEllipse = (point, ellipseProps) => {

  const { centerX, centerY, radiusX, radiusY, rotation } = ellipseProps;

  const rotationRadians = rotation * (Math.PI / 180);



  // Translate and rotate point inverse to ellipse

  const cosTheta = Math.cos(-rotationRadians);

  const sinTheta = Math.sin(-rotationRadians);

  const dx = point.offsetX - centerX;

  const dy = point.offsetY - centerY;



  const rotatedX = dx * cosTheta - dy * sinTheta;

  const rotatedY = dx * sinTheta + dy * cosTheta;



  // Check if point is inside ellipse equation

  return ((rotatedX * rotatedX) / (radiusX * radiusX) + (rotatedY * rotatedY) / (radiusY * radiusY)) <= 1;

};



/**

 * Checks if a point is near the stroke of an ellipse within a given tolerance.

 * @param {object} point - The point to check ({offsetX, offsetY}).

 * @param {object} ellipseProps - Ellipse properties ({centerX, centerY, radiusX, radiusY, rotation}).

 * @param {number} tolerance - The maximum distance for the point to be considered "near".

 * @returns {boolean} True if the point is near the ellipse stroke, false otherwise.

 */

export const isPointNearEllipseStroke = (point, ellipseProps, tolerance = 10) => {

  const { centerX, centerY, radiusX, radiusY, rotation } = ellipseProps;

  const rotationRadians = rotation * (Math.PI / 180);



  // Translate and rotate point inverse to ellipse

  const cosTheta = Math.cos(-rotationRadians);

  const sinTheta = Math.sin(-rotationRadians);

  const dx = point.offsetX - centerX;

  const dy = point.offsetY - centerY;



  const rotatedX = dx * cosTheta - dy * sinTheta;

  const rotatedY = dx * sinTheta + dy * cosTheta;



  // Find angle on ellipse for closest point

  let angle = Math.atan2(rotatedY / radiusY, rotatedX / radiusX);



  // Calculate closest point on ellipse

  const ellipseX = centerX + radiusX * Math.cos(angle) * Math.cos(rotationRadians) - radiusY * Math.sin(angle) * Math.sin(rotationRadians);

  const ellipseY = centerY + radiusX * Math.cos(angle) * Math.sin(rotationRadians) + radiusY * Math.sin(angle) * Math.cos(rotationRadians);



  const distanceToEllipse = calculateDistance(point, { offsetX: ellipseX, offsetY: ellipseY });



  return distanceToEllipse <= tolerance;

};



/**

 * Snaps a point to a spine/curve defined by control points.

 * @param {object} point - The point to snap ({offsetX, offsetY}).

 * @param {object} spineRulerProperties - Spine ruler properties ({points, tension, snapTolerance}).

 * @returns {object} The snapped point or the original point if outside tolerance.

 */

export const snapPointToSpine = (point, spineRulerProperties) => {

  const { points, tension, snapTolerance } = spineRulerProperties;

  if (points.length < 2) return point; // Need at least 2 points to define a curve



  // Generate a high resolution set of points along the spline

  const splinePathPoints = getCatmullRomSplinePoints(points, tension, 20); // 20 segments per control point span for high precision snap



  let closestPoint = point;

  let minDistance = Infinity;



  for (let i = 0; i < splinePathPoints.length; i++) {

    const sp = splinePathPoints[i];

    const dist = calculateDistance(point, sp);

    if (dist < minDistance) {

      minDistance = dist;

      closestPoint = sp;

    }

  }



  if (minDistance <= snapTolerance) {

    return closestPoint;

  }

  return point;

};



/**

 * Snaps a point to the mirror ruler line (for interaction, not for mirroring strokes).

 * @param {object} point - The point to snap ({offsetX, offsetY}).

 * @param {object} mirrorRulerProperties - Mirror ruler properties ({x, y, rotation, snapTolerance}).

 * @returns {object} The snapped point or the original point if outside tolerance.

 */

export const snapPointToMirror = (point, mirrorRulerProperties) => {

  const { x, y, rotation, snapTolerance } = mirrorRulerProperties;

  const rotationRadians = rotation * (Math.PI / 180);



  // Define a long line segment to represent the mirror line for snapping purposes

  const mirrorLinePoint1 = { x: x, y: y };

  const mirrorLinePoint2 = {

    x: x + 1000 * Math.cos(rotationRadians), // Use an arbitrary long length

    y: y + 1000 * Math.sin(rotationRadians),

  };



  const A = mirrorLinePoint1.x;

  const B = mirrorLinePoint1.y;

  const C = mirrorLinePoint2.x;

  const D = mirrorLinePoint2.y;

  const Px = point.offsetX;

  const Py = point.offsetY;



  const lenSq = (C - A) * (C - A) + (D - B) * (D - B);

  if (lenSq === 0) { // Mirror line is effectively a point if length is zero

    const distance = calculateDistance({ offsetX: Px, offsetY: Py }, { offsetX: A, offsetY: B });

    if (distance <= snapTolerance) {

      return { offsetX: A, offsetY: B };

    }

    return point;

  }



  // Calculate projection of point onto the infinite line

  const t = ((Px - A) * (C - A) + (Py - B) * (D - B)) / lenSq;



  const closestX = A + t * (C - A);

  const closestY = B + t * (D - B);



  const distanceToLine = calculateDistance({ offsetX: Px, offsetY: Py }, { offsetX: closestX, offsetY: closestY });



  if (distanceToLine <= snapTolerance) {

    return { offsetX: closestX, offsetY: closestY };

  }

  return point;

};



/**

 * Helper to convert hex color string to RGBA array [r, g, b, a] (0-255)

 * @param {string} hex - Hex color string (e.g., "#RRGGBB" or "#RGB").

 * @param {number} alpha - Alpha value (0-1), defaults to 1.

 * @returns {Array<number>} RGBA array [r, g, b, a].

 */

export const hexToRgbaArray = (hex, alpha = 1) => {

  let c;

  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {

    c = hex.substring(1).split('');

    if (c.length === 3) {

      c = [c[0], c[0], c[1], c[1], c[2], c[2]];

    }

    c = '0x' + c.join('');

    return [(c >> 16) & 255, (c >> 8) & 255, c & 255, Math.round(alpha * 255)];

  }

  return [0, 0, 0, 0]; // Default to transparent black for invalid input

};



/**

 * Helper to compare two RGBA colors within a tolerance.

 * @param {Array<number>} color1 - First RGBA color array.

 * @param {Array<number>} color2 - Second RGBA color array.

 * @param {number} tolerance - Max difference allowed for each channel (0-255).

 * @returns {boolean} True if colors match within tolerance, false otherwise.

 */

export const colorsMatch = (color1, color2, tolerance = 0) => {

    // Ensure colors are valid arrays

    if (!color1 || !color2 || color1.length !== 4 || color2.length !== 4) {

        console.warn('colorsMatch: Invalid color array received.', color1, color2);

        return false;

    }

    return (

        Math.abs(color1[0] - color2[0]) <= tolerance &&

        Math.abs(color1[1] - color2[1]) <= tolerance &&

        Math.abs(color1[2] - color2[2]) <= tolerance &&

        Math.abs(color1[3] - color2[3]) <= tolerance

    );

};