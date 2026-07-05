// src/Utils/DrawingUtils.js (Updated and Cleaned)
import { hexToRgbaArray, colorsMatch } from './CanvasHelper';

/**
 * Calculates the bounding box for a given stroke.
 * This bounding box represents the minimum and maximum X and Y coordinates
 * covered by the stroke, in CSS pixels.
 *
 * This function is optimized to avoid `getImageData` for brush, shape, and text strokes
 * by using geometric calculations. Fill strokes still use `getImageData`.
 * It also includes caching to prevent redundant calculations.
 *
 * @param {object} stroke - The stroke object (brush, shape, text, fill). Stroke coordinates/sizes are in CSS pixels.
 * @param {number} referenceCanvasCSSWidth - The CSS width of the canvas used as a reference for scaling the stroke data.
 * @param {number} referenceCanvasCSSHeight - The CSS height of the canvas used as a reference for scaling the stroke data.
 * @param {CanvasRenderingContext2D} ctx - The canvas context (needed for text metrics and for fill stroke's original device pixel dimensions).
 * @returns {{minX: number, minY: number, maxX: number, maxY: number, width: number, height: number, centerX: number, centerY: number}|null} The bounding box in CSS pixels, or null if invalid stroke.
 */
export const getBoundingBoxForStroke = (stroke, referenceCanvasCSSWidth, referenceCanvasCSSHeight, ctx) => {
    if (!stroke) return null;

    // Check cache
    const cacheKey = `${stroke.id}-${stroke.originalCanvasWidth}-${stroke.originalCanvasHeight}-${referenceCanvasCSSWidth}-${referenceCanvasCSSHeight}-${JSON.stringify(stroke.points || stroke.startPoint || stroke.x)}-${JSON.stringify(stroke.endPoint || stroke.y)}-${stroke.size}-${stroke.text || ''}-${stroke.color}-${stroke.opacity}-${stroke.fillColor}-${stroke.shadowBlur}-${stroke.shadowOffsetX}-${stroke.shadowOffsetY}`;
    if (stroke.cachedBbox && stroke.cachedBboxKey === cacheKey) {
        return stroke.cachedBbox;
    }

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    // Calculate scaling factors based on original CSS dimensions vs. current reference CSS dimensions
    // These ensure that points stored in CSS pixels are scaled correctly if the canvas
    // where they are being drawn now has a different CSS size.
    const scaleX = referenceCanvasCSSWidth / stroke.originalCanvasWidth;
    const scaleY = referenceCanvasCSSHeight / stroke.originalCanvasHeight;

    // Padding for stroke width and shadow blur (in CSS pixels)
    const padding = (stroke.size || 1) / 2 + (stroke.shadowBlur || 0);

    switch (stroke.toolType) {
        case 'brush':
            if (!stroke.points || stroke.points.length === 0) return null;

            // Points are already in CSS pixels from useDrawingLogic.
            // Apply scale factors based on canvas resize
            minX = Math.min(...stroke.points.map(p => p.offsetX * scaleX));
            maxX = Math.max(...stroke.points.map(p => p.offsetX * scaleX));
            minY = Math.min(...stroke.points.map(p => p.offsetY * scaleY));
            maxY = Math.max(...stroke.points.map(p => p.offsetY * scaleY));

            minX -= padding;
            maxX += padding;
            minY -= padding;
            maxY += padding;
            break;

        case 'shape':
            if (!stroke.startPoint || stroke.startPoint.offsetX === undefined || !stroke.endPoint || stroke.endPoint.offsetX === undefined) return null;

            // Scale points first (as they are stored in original CSS pixels)
            const scaledStartX = stroke.startPoint.offsetX * scaleX;
            const scaledStartY = stroke.startPoint.offsetY * scaleY;
            const scaledEndX = stroke.endPoint.offsetX * scaleX;
            const scaledEndY = stroke.endPoint.offsetY * scaleY;

            switch (stroke.shapeType) {
                case 'line':
                case 'rectangle':
                    minX = Math.min(scaledStartX, scaledEndX) - padding;
                    maxX = Math.max(scaledStartX, scaledEndX) + padding;
                    minY = Math.min(scaledStartY, scaledEndY) - padding;
                    maxY = Math.max(scaledStartY, scaledEndY) + padding;
                    break;
                case 'circle':
                    const tempRadius = Math.sqrt(Math.pow(scaledEndX - scaledStartX, 2) + Math.pow(scaledEndY - scaledStartY, 2));
                    minX = scaledStartX - tempRadius - padding;
                    maxX = scaledStartX + tempRadius + padding;
                    minY = scaledStartY - tempRadius - padding;
                    maxY = scaledStartY + tempRadius + padding;
                    break;
                case 'triangle':
                    const triX1 = scaledStartX;
                    const triY1 = scaledEndY; // Base left
                    const triX2 = scaledEndX;
                    const triY2 = scaledEndY; // Base right
                    const triX3 = (scaledStartX + scaledEndX) / 2;
                    const triY3 = scaledStartY; // Apex

                    minX = Math.min(triX1, triX2, triX3) - padding;
                    maxX = Math.max(triX1, triX2, triX3) + padding;
                    minY = Math.min(triY1, triY2, triY3) - padding;
                    maxY = Math.max(triY1, triY2, triY3) + padding;
                    break;
                default:
                    return null;
            }
            break;

        case 'text':
            if (!stroke.text || stroke.x === undefined || stroke.y === undefined) return null;

            // Temporarily set font on a dummy context to measure text
            const dummyCtx = document.createElement('canvas').getContext('2d');
            if (!dummyCtx) {
                console.error('[getBoundingBoxForStroke] Failed to get dummy context for text measurement.');
                return null;
            }
            // Apply font properties to dummy context (font size needs to be scaled to current CSS first)
            const scaledFontSize = (stroke.size || 16) * scaleX;
            dummyCtx.font = `${scaledFontSize}px ${stroke.fontFamily || 'Arial'}`;
            const textMetrics = dummyCtx.measureText(stroke.text);

            let textWidth = textMetrics.width;
            let textHeight = scaledFontSize;

            let textMinX = stroke.x * scaleX;
            let textMinY = stroke.y * scaleY;

            // Adjust based on textAlign
            if (stroke.textAlign === 'center') {
                textMinX -= textWidth / 2;
            } else if (stroke.textAlign === 'right' || stroke.textAlign === 'end') {
                textMinX -= textWidth;
            }

            // Adjust based on textBaseline (approximations)
            if (stroke.textBaseline === 'top' || stroke.textBaseline === 'hanging') {
                // textMinY is already top
            } else if (stroke.textBaseline === 'middle') {
                textMinY -= textHeight / 2;
            } else if (stroke.textBaseline === 'alphabetic' || stroke.textBaseline === 'ideographic') {
                textMinY -= textHeight * 0.8;
            } else if (stroke.textBaseline === 'bottom') {
                textMinY -= textHeight;
            }

            minX = textMinX - padding;
            maxX = textMinX + textWidth + padding;
            minY = textMinY - padding;
            maxY = textMinY + textHeight + padding;
            break;

        case 'fill':
            if (!stroke.imageData) {
                console.warn('[getBoundingBoxForStroke] Fill stroke missing imageData for pixel scan.', stroke);
                return null;
            }

            const fillImageData = stroke.imageData;
            const data = fillImageData.data;
            const fillImageWidth = fillImageData.width; // This is in device pixels
            const fillImageHeight = fillImageData.height; // This is in device pixels
            const fillStrokeColorRgba = hexToRgbaArray(stroke.color, stroke.opacity);
            const tolerance = stroke.tolerance || 0;

            // Calculate the actual device pixel ratio that was active when this imageData was captured
            const dprAtCapture = fillImageWidth / stroke.originalCanvasWidth;

            let foundPixel = false;
            let tempMinX = Infinity, tempMinY = Infinity;
            let tempMaxX = -Infinity, tempMaxY = -Infinity;

            // This loop scans the imageData (which is in device pixels)
            for (let y = 0; y < fillImageHeight; y++) {
                for (let x = 0; x < fillImageWidth; x++) {
                    const i = (y * fillImageWidth + x) * 4;
                    const pixelColor = [data[i], data[i + 1], data[i + 2], data[i + 3]];
                    if (colorsMatch(pixelColor, fillStrokeColorRgba, tolerance)) {
                        tempMinX = Math.min(tempMinX, x);
                        tempMinY = Math.min(tempMinY, y);
                        tempMaxX = Math.max(tempMaxX, x);
                        tempMaxY = Math.max(tempMaxY, y);
                        foundPixel = true;
                    }
                }
            }

            if (!foundPixel) {
                console.warn('[getBoundingBoxForStroke] Fill stroke has imageData but NO MATCHING PIXELS found for bbox (transparent or color mismatch). This is why bbox is not drawn.', stroke);
                return null;
            }

            // Convert min/max X/Y from device pixels (from imageData scan) to CSS pixels
            // using the DPR at the time of capture.
            minX = (tempMinX / dprAtCapture) * scaleX;
            minY = (tempMinY / dprAtCapture) * scaleY;
            maxX = (tempMaxX / dprAtCapture) * scaleX;
            maxY = (tempMaxY / dprAtCapture) * scaleY;
            break;

        default:
            console.warn(`[getBoundingBoxForStroke] Unknown toolType for bbox calculation: ${stroke.toolType}`, stroke);
            return null;
    }

    if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
        console.warn(`[getBoundingBoxForStroke] Calculated bounding box is invalid (Infinity values for ID: ${stroke.id}).`);
        return null;
    }

    const bbox = {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX,
        height: maxY - minY,
        centerX: minX + (maxX - minX) / 2,
        centerY: minY + (maxY - minY) / 2
    };

    // Cache the result
    stroke.cachedBbox = bbox;
    stroke.cachedBboxKey = cacheKey;

    return bbox;
};


/**
 * Calculates a single bounding box that encompasses all provided strokes.
 * @param {Array<object>} strokes - An array of stroke objects.
 * @param {Array<object>} allStrokes - The complete array of all strokes on the canvas (needed for context props).
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context (for text metrics and canvas dimensions).
 * @param {number} currentCanvasCSSWidth - The current CSS width of the main canvas.
 * @param {number} currentCanvasCSSHeight - The current CSS height of the main canvas.
 * @returns {{minX: number, minY: number, maxX: number, maxY: number, width: number, height: number, centerX: number, centerY: number}|null} The combined bounding box (in CSS pixels), or null if no valid strokes.
 */
export const getCombinedBoundingBoxForStrokes = (strokes, allStrokes, ctx, currentCanvasCSSWidth, currentCanvasCSSHeight) => {
    if (!strokes || strokes.length === 0) {
        return null;
    }
    let overallMinX = Infinity;
    let overallMinY = Infinity;
    let overallMaxX = -Infinity;
    let overallMaxY = -Infinity;

    strokes.forEach(stroke => {
        const fullStroke = allStrokes.find(s => s.id === stroke.id) || stroke;
        // Use getTransformedBoundingBox here for combined bbox to account for transforms
        // Pass currentCanvasCSSWidth/Height here so bounding box calculation scales to current canvas display size
        const bbox = getTransformedBoundingBox(fullStroke, currentCanvasCSSWidth, currentCanvasCSSHeight, ctx);
        if (bbox) {
            overallMinX = Math.min(overallMinX, bbox.minX);
            overallMinY = Math.min(overallMinY, bbox.minY);
            overallMaxX = Math.max(overallMaxX, bbox.maxX);
            overallMaxY = Math.max(overallMaxY, bbox.maxY);
        }
    });
    if (overallMinX === Infinity) {
        return null;
    }

    const combinedBbox = {
        minX: overallMinX,
        minY: overallMinY,
        maxX: overallMaxX,
        maxY: overallMaxY,
        width: overallMaxX - overallMinX,
        height: overallMaxY - overallMinY,
        centerX: overallMinX + (overallMaxX - overallMinX) / 2,
        centerY: overallMinY + (overallMaxY - overallMinY) / 2
    };

    return combinedBbox;
};

/**
 * Calculates the transformed bounding box for a single stroke, accounting for its
 * position, scale, and rotation. This function now leverages the optimized `getBoundingBoxForStroke`
 * and then geometrically transforms its corners.
 *
 * @param {object} stroke - The stroke object (brush, shape, text, fill).
 * @param {number} currentCanvasCSSWidth - Current CSS width of the main canvas.
 * @param {number} currentCanvasCSSHeight - Current CSS height of the main canvas.
 * @param {CanvasRenderingContext2D} ctx - The main canvas context (used for its pixel dimensions for getBoundingBoxForStroke).
 * @returns {{minX: number, minY: number, maxX: number, maxY: number, width: number, height: number, centerX: number, centerY: number}|null}
 * The transformed bounding box in CSS pixels, or null if invalid.
 */
export const getTransformedBoundingBox = (stroke, currentCanvasCSSWidth, currentCanvasCSSHeight, ctx, zoomLevel = 1, offset = { x: 0, y: 0 }) => {
    // Get the untransformed bounding box using the optimized function,
    // scaling it to the *current* canvas CSS dimensions.
    const untransformedBboxCSSPixels = getBoundingBoxForStroke(stroke, currentCanvasCSSWidth, currentCanvasCSSHeight, ctx);

    if (!untransformedBboxCSSPixels) {
        return null;
    }

    const {
        minX: ux, minY: uy, maxX: umx, maxY: umy,
        centerX: ucx, centerY: ucy
    } = untransformedBboxCSSPixels;

    // Define the 4 corners of the untransformed bounding box (in CSS pixels)
    const corners = [
        { x: ux, y: uy },
        { x: umx, y: uy },
        { x: umx, y: umy },
        { x: ux, y: umy }
    ];

    let transformedMinX = Infinity;
    let transformedMinY = Infinity;
    let transformedMaxX = -Infinity;
    let transformedMaxY = -Infinity;

    // Apply the stroke's transform properties
    const transform = stroke.transform || {};
    const { x = 0, y = 0, rotation = 0, scale = 1, scaleX = scale, scaleY = scale } = transform;

    corners.forEach(corner => {
        // Apply scaling relative to the original center of the untransformed bbox
        const scaledX = ucx + (corner.x - ucx) * scaleX;
        const scaledY = ucy + (corner.y - ucy) * scaleY;

        // Apply rotation relative to the original center of the untransformed bbox
        const translatedX = scaledX - ucx;
        const translatedY = scaledY - ucy;

        const rotationRadians = rotation * Math.PI / 180;
        const cos = Math.cos(rotationRadians);
        const sin = Math.sin(rotationRadians);

        const rotatedX = translatedX * cos - translatedY * sin;
        const rotatedY = translatedX * sin + translatedY * cos;

        // Apply global translation (x, y) if present in the stroke's transform
        // The transform.x/y indicate the offset of the *center* of the stroke
        // from its original position.
        const finalX = ucx + rotatedX + x;
        const finalY = ucy + rotatedY + y;

        // Apply viewport transformation (zoom and offset)
        const viewportX = finalX;
        const viewportY = finalY;

        transformedMinX = Math.min(transformedMinX, viewportX);
        transformedMinY = Math.min(transformedMinY, viewportY);
        transformedMaxX = Math.max(transformedMaxX, viewportX);
        transformedMaxY = Math.max(transformedMaxY, viewportY);
    });

    const transformedBbox = {
        minX: transformedMinX,
        minY: transformedMinY,
        maxX: transformedMaxX,
        maxY: transformedMaxY,
        width: transformedMaxX - transformedMinX,
        height: transformedMaxY - transformedMinY,
        centerX: transformedMinX + (transformedMaxX - transformedMinX) / 2,
        centerY: transformedMinY + (transformedMaxY - transformedMinY) / 2
    };

    return transformedBbox;
};

/**
 * Checks if two rectangles intersect.
 * @param {Object} rect1 - First rectangle { minX, minY, maxX, maxY } (or left, top, right, bottom)
 * @param {Object} rect2 - Second rectangle { minX, minY, maxX, maxY } (or left, top, right, bottom)
 * @returns {boolean} True if rectangles intersect, false otherwise
 */
export function checkRectIntersection(rect1, rect2) {
    // Standardize rect properties to use minX/maxX for robustness if different sources use different names
    const r1MinX = rect1.minX !== undefined ? rect1.minX : rect1.left;
    const r1MinY = rect1.minY !== undefined ? rect1.minY : rect1.top;
    const r1MaxX = rect1.maxX !== undefined ? rect1.maxX : rect1.right;
    const r1MaxY = rect1.maxY !== undefined ? rect1.maxY : rect1.bottom;

    const r2MinX = rect2.minX !== undefined ? rect2.minX : rect2.left;
    const r2MinY = rect2.minY !== undefined ? rect2.minY : rect2.top;
    const r2MaxX = rect2.maxX !== undefined ? rect2.maxX : rect2.right;
    const r2MaxY = rect2.maxY !== undefined ? rect2.maxY : rect2.bottom;

    return !(
        r1MaxX < r2MinX ||
        r1MinX > r2MaxX ||
        r1MaxY < r2MinY ||
        r1MinY > r2MaxY
    );
}

/**
 * Creates a rectangle object from two points
 * @param {number} x1 - First point X coordinate
 * @param {number} y1 - First point Y coordinate
 * @param {number} x2 - Second point X coordinate
 * @param {number} y2 - Second point Y coordinate
 * @returns {{minX: number, minY: number, maxX: number, maxY: number}}
 */
export function getRectFromPoints(x1, y1, x2, y2) {
    return {
        minX: Math.min(x1, x2),
        minY: Math.min(y1, y2),
        maxX: Math.max(x1, x2),
        maxY: Math.max(y1, y2)
    };
}

/**
 * Checks if a point is inside a rectangle.
 * @param {number} x - X coordinate of the point.
 * @param {number} y - Y coordinate of the point.
 * @param {object} rect - Rectangle object { minX, minY, maxX, maxY }.
 * @returns {boolean} True if the point is in the rectangle, false otherwise.
 */
export function isPointInRect(x, y, rect) {
    return x >= rect.minX && x <= rect.maxX && y >= rect.minY && y <= rect.maxY;
}