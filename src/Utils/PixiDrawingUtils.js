// src/Utils/PixiDrawingUtils.js
import * as PIXI from 'pixi.js';
import {SimpleRope} from '@pixi/mesh-extras'
import { hexToRgbaArray, colorsMatch } from './CanvasHelper';

/**
 * Applies common drawing properties to a Pixi.js Graphics object.
 * @param {PIXI.Graphics} graphics - The Pixi.js Graphics object.
 * @param {object} properties - Object containing drawing properties.
 * @param {number} [overrideAlpha] - Optional alpha override.
 */
 export const applyPixiProperties = (graphics, properties, overrideAlpha) => {
  const alpha = overrideAlpha !== undefined ? overrideAlpha : (properties.opacity !== undefined ? properties.opacity : 1);
  const color = parseInt(properties.color.replace('#', '0x'), 16);
  
  if (properties.toolType === 'brush') {
    graphics.stroke({
      width: properties.size || 1,
      color: color,
      alpha: alpha,
      cap: 'round',
      join: 'round'
    });
  } else if (properties.toolType === 'shape') {
    graphics.stroke({
      width: properties.size || 1,
      color: color,
      alpha: alpha,
      cap: properties.lineCap || 'round',
      join: properties.lineJoin || 'round'
    });
    
    if (properties.fillColor && properties.fillColor !== 'transparent') {
      const fillColor = parseInt(properties.fillColor.replace('#', '0x'), 16);
      graphics.fill({ color: fillColor, alpha: alpha });
    }
  }
  
  // Note: Shadows are more complex in Pixi.js and would require filters
  // For now, we'll skip shadow implementation
};

// Add this helper function in PixiDrawingUtils.js
const generateBrushTexture = (graphics, app, size, color, opacity) => {
    try {
        return app.renderer.generateTexture(graphics);
    } catch (error) {
        console.warn('Failed to generate brush texture, using fallback:', error);
        // Fallback: create a simple graphics stroke
        const fallbackGraphics = new PIXI.Graphics();
        const colorHex = parseInt(color.replace('#', '0x'), 16);
        fallbackGraphics.stroke({
            width: size,
            color: colorHex,
            alpha: opacity,
            cap: 'round',
            join: 'round'
        });
        return fallbackGraphics;
    }
};

const drawMarkerStroke = (stroke, app) => {
    const { points, color, opacity, size } = stroke;
    if (!points || points.length < 2) return null;

    const colorHex = parseInt(color.replace('#', '0x'), 16);
    
    // Create a brush texture
    const brushTip = new PIXI.Graphics();
    brushTip.circle(0, 0, size / 2).fill({ color: colorHex, alpha: opacity });
    const brushTexture = generateBrushTexture(brushTip, app, size, color, opacity);

    // Convert points to PIXI points
    const ropePoints = points.map(point => new PIXI.Point(point.offsetX, point.offsetY));
    
    // --- FIX 2: USE THE EXPLICITLY IMPORTED SimpleRope ---
    const rope = new SimpleRope(brushTexture, ropePoints); 
    
    return rope;
};


/**
 * Creates a Pixi.js DisplayObject (SimpleRope or Graphics) from a brush stroke.
 * @param {object} stroke - The brush stroke object.
 * @param {PIXI.Application} app - The PIXI Application instance for texture generation.
 * @returns {PIXI.DisplayObject} The Pixi.js DisplayObject.
 */
export const createBrushStrokeGraphics = (stroke, app) => {
  
  // --- MODIFIED LOGIC: Use texture/rope (drawMarkerStroke) for 'pen' and 'marker' ---
  if (stroke.brushType === 'pen' || stroke.brushType === 'marker') {
    // 1. Try to create the SimpleRope
    const rope = drawMarkerStroke(stroke, app);
    if (rope) {
        return rope;
    }
    
    // 2. If rope failed (due to < 2 points), handle the single dot case
    if (stroke.points && stroke.points.length === 1) {
        const graphics = new PIXI.Graphics();
        const colorHex = parseInt(stroke.color.replace('#', '0x'), 16);
        // Draw the dot at the point's location
        graphics.drawCircle(stroke.points[0].offsetX, stroke.points[0].offsetY, stroke.size / 2).fill({color: colorHex, alpha: stroke.opacity});
        return graphics;
    }
    
    // Fallback if no points
    return new PIXI.Graphics();
  }
  // --- END MODIFIED LOGIC ---
  
  const graphics = new PIXI.Graphics();
  
  if (!stroke.points || stroke.points.length === 0) {
    return graphics;
  }
  
   // Default brush rendering for non-texture brushes
  applyPixiProperties(graphics, stroke);
  graphics.moveTo(stroke.points[0].offsetX, stroke.points[0].offsetY);
  for (let i = 1; i < stroke.points.length; i++) {
    graphics.lineTo(stroke.points[i].offsetX, stroke.points[i].offsetY);
  }
  graphics.stroke();

  return graphics;
};


/**
 * Helper function to draw a path on a Graphics object.
 */
const drawPath = (graphics, points, isSplineSmoothed, smoothingFactor) => {
  if (points.length === 0) return;
  
  if (points.length === 1) {
    graphics.circle(points[0].offsetX, points[0].offsetY, 1);
    return;
  }
  
  graphics.moveTo(points[0].offsetX, points[0].offsetY);
  
  if (isSplineSmoothed) {
    // For Catmull-Rom (pre-smoothed points), just draw lines
    for (let i = 1; i < points.length; i++) {
      graphics.lineTo(points[i].offsetX, points[i].offsetY);
    }
  } else {
    // For quadratic curve smoothing
    for (let i = 1; i < points.length; i++) {
      const p1 = points[i - 1];
      const p2 = points[i];
      if (p2) {
        const midPoint = {
          offsetX: p1.offsetX + (p2.offsetX - p1.offsetX) * smoothingFactor,
          offsetY: p1.offsetY + (p2.offsetY - p1.offsetY) * smoothingFactor,
        };
        graphics.quadraticCurveTo(p1.offsetX, p1.offsetY, midPoint.offsetX, midPoint.offsetY);
      } else {
        graphics.lineTo(p1.offsetX, p1.offsetY);
      }
    }
  }
  
  graphics.stroke();
};

/**
 * Creates a Pixi.js Graphics object from a shape stroke.
 * @param {object} stroke - The shape stroke object.
 * @returns {PIXI.Graphics} The Pixi.js Graphics object.
 */
export const createShapeStrokeGraphics = (stroke) => {
  const graphics = new PIXI.Graphics();
  applyPixiProperties(graphics, stroke);
  
  const startX = stroke.startPoint.offsetX;
  const startY = stroke.startPoint.offsetY;
  const endX = stroke.endPoint.offsetX;
  const endY = stroke.endPoint.offsetY;
  
  switch (stroke.shapeType) {
    case 'line':
      graphics.moveTo(startX, startY);
      graphics.lineTo(endX, endY);
      break;
    case 'rectangle':
      const rectWidth = endX - startX;
      const rectHeight = endY - startY;
      graphics.rect(startX, startY, rectWidth, rectHeight);
      break;
    case 'circle':
      const centerX = startX;
      const centerY = startY;
      const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
      graphics.circle(centerX, centerY, radius);
      break;
    case 'triangle':
      const triX1 = startX;
      const triY1 = endY;
      const triX2 = endX;
      const triY2 = endY;
      const triX3 = (startX + endX) / 2;
      const triY3 = startY;
      graphics.moveTo(triX1, triY1);
      graphics.lineTo(triX2, triY2);
      graphics.lineTo(triX3, triY3);
      graphics.closePath();
      break;
    default:
      break;
  }
  
  if (stroke.fillColor && stroke.fillColor !== 'transparent') {
    graphics.fill();
  } else {
    graphics.stroke();
  }
  
  return graphics;
};

/**
 * Creates a Pixi.js Text object from a text stroke.
 * @param {object} stroke - The text stroke object.
 * @returns {PIXI.Text} The Pixi.js Text object.
 */
export const createTextStroke = (stroke) => {
  const style = {
    fontFamily: stroke.fontFamily || 'Arial',
    fontSize: stroke.size || 16,
    fill: parseInt(stroke.color.replace('#', '0x'), 16),
    align: stroke.textAlign || 'left',
    alpha: stroke.opacity !== undefined ? stroke.opacity : 1
  };
  
  const text = new PIXI.Text({
    text: stroke.text,
    style: style
  });
  
  text.position.set(stroke.x, stroke.y);
  
  // Set text anchor based on textAlign and textBaseline
  if (stroke.textAlign === 'center') {
    text.anchor.x = 0.5;
  } else if (stroke.textAlign === 'right' || stroke.textAlign === 'end') {
    text.anchor.x = 1;
  }
  
  if (stroke.textBaseline === 'middle') {
    text.anchor.y = 0.5;
  } else if (stroke.textBaseline === 'bottom') {
    text.anchor.y = 1;
  }
  
  return text;
};

/**
 * Creates a Pixi.js Sprite from a fill stroke.
 * @param {object} stroke - The fill stroke object.
 * @returns {Promise<PIXI.Sprite>} A promise that resolves to a Pixi.js Sprite.
 */
export const createFillStrokeSprite = async (stroke) => {
  if (!stroke.imageData) {
    console.warn('createFillStrokeSprite: Fill stroke missing imageData.');
    return null;
  }
  
  try {
    const imageBitmap = await createImageBitmap(stroke.imageData);
    const texture = PIXI.Texture.from(imageBitmap);
    const sprite = new PIXI.Sprite(texture);
    
    sprite.alpha = stroke.opacity !== undefined ? stroke.opacity : 1;
    sprite.blendMode = stroke.compositeOperation || 'normal';
    
    return sprite;
  } catch (error) {
    console.error('Error in createFillStrokeSprite:', error);
    return null;
  }
};

/**
 * Creates a selection box Graphics object.
 * @param {object} bbox - The bounding box {minX, minY, maxX, maxY}.
 * @param {number} rotation - The rotation in degrees.
 * @param {number} zoomLevel - The current zoom level.
 * @returns {PIXI.Graphics} The Pixi.js Graphics object for the selection box.
 */
export const createSelectionBoxGraphics = (bbox, rotation = 0, zoomLevel = 1) => {
  if (!bbox) return new PIXI.Graphics();
  
  const graphics = new PIXI.Graphics();
  const { minX, minY, maxX, maxY, centerX, centerY } = bbox;
  const width = maxX - minX;
  const height = maxY - minY;
  
  // Draw the selection box
  graphics.stroke({
    width: 2 / zoomLevel,
    color: 0x00BFFF,
    alpha: 0.8
  });
  
  graphics.rect(minX, minY, width, height);
  graphics.stroke();
  
  // Draw handles
  const HANDLE_SIZE = 12 / zoomLevel;
  const handleRadius = HANDLE_SIZE / 2;
  
  // Rotation handle (top center)
  graphics.fill({ color: 0xFFA500 });
  graphics.circle(centerX, minY - handleRadius, handleRadius);
  
  // Scale handles (corners)
  graphics.fill({ color: 0x00FF00 });
  graphics.rect(minX - handleRadius, minY - handleRadius, HANDLE_SIZE, HANDLE_SIZE);
  graphics.rect(maxX - handleRadius, minY - handleRadius, HANDLE_SIZE, HANDLE_SIZE);
  graphics.rect(minX - handleRadius, maxY - handleRadius, HANDLE_SIZE, HANDLE_SIZE);
  graphics.rect(maxX - handleRadius, maxY - handleRadius, HANDLE_SIZE, HANDLE_SIZE);
  
  // Move handle (center)
  graphics.fill({ color: 0x00BFFF });
  graphics.rect(centerX - handleRadius, centerY - handleRadius, HANDLE_SIZE, HANDLE_SIZE);  
  return graphics;
};

/**
 * Creates a marquee selection box Graphics object.
 * @param {object} startPoint - The starting point {offsetX, offsetY}.
 * @param {object} endPoint - The ending point {offsetX, offsetY}.
 * @param {number} zoomLevel - The current zoom level.
 * @param {object} options - Drawing options.
 * @returns {PIXI.Graphics} The Pixi.js Graphics object for the marquee.
 */
export const createMarqueeSelectionGraphics = (startPoint, endPoint, zoomLevel = 1, options = {}) => {
  const {
    color = 0x0066FF,
    lineWidth = 1
  } = options;
  
  const graphics = new PIXI.Graphics();
  const x1 = startPoint.offsetX;
  const y1 = startPoint.offsetY;
  const x2 = endPoint.offsetX;
  const y2 = endPoint.offsetY;
  const width = x2 - x1;
  const height = y2 - y1;
  
  graphics.stroke({
    width: lineWidth / zoomLevel,
    color: color,
    alpha: 0.8
  });
  
  graphics.rect(x1, y1, width, height);
  graphics.stroke();
  
  return graphics;
};

// The following utility functions can remain as they are since they don't use Canvas API
export {
  getBoundingBoxForStroke,
  getCombinedBoundingBoxForStrokes,
  getTransformedBoundingBox,
  checkRectIntersection,
  getRectFromPoints,
  isPointInRect
} from './DrawingUtils';