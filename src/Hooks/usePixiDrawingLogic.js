// src/Hooks/usePixiDrawingLogic.js
import { useState, useCallback, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { SimpleRope } from '@pixi/mesh-extras';
import {
    calculateDistance,
    transformPointForMirror,
    snapPointToStraightLine,
    snapPointToEllipse,
    getCatmullRomSplinePoints,
    snapPointToSpine,
    hexToRgbaArray,
    colorsMatch,
} from '../Utils/CanvasHelper';
import { v4 as uuidv4 } from 'uuid';

// REMOVED: calculatePenPressure function

// REMOVED: drawSmoothPenStroke function

// NEW: Unified function for texture-based brush preview (Pen, Marker, etc.)
const drawPreviewTextureStroke = (container, points, color, opacity, brushSize, pixiAppRef) => {
    container.removeChildren(); // Clear previous preview
    if (points.length < 1) return;

    const colorHex = parseInt(color.replace('#', '0x'), 16);
    
    // 1. Create a brush texture (Round tip)
    const brushTip = new PIXI.Graphics();
    brushTip.circle(0, 0, brushSize / 2).fill({ color: colorHex, alpha: opacity });
    
    // Generate texture. Ensure the PIXI.Application exists.
    if (!pixiAppRef.current || !pixiAppRef.current.renderer) return;
    const brushTexture = pixiAppRef.current.renderer.generateTexture(brushTip);
    
    // 2. Handle single point (dot) case
    if (points.length === 1) {
        const dot = new PIXI.Graphics();
        dot.circle(points[0].offsetX, points[0].offsetY, brushSize / 2).fill({ color: colorHex, alpha: opacity });
        container.addChild(dot);
        return;
    }

    // 3. Create rope points for the stroke
    const ropePoints = points.map(point => new PIXI.Point(point.offsetX, point.offsetY));
    
    // 4. Create and add the rope mesh
    // --- FIX 2: USE THE EXPLICITLY IMPORTED SimpleRope ---
    const rope = new SimpleRope(brushTexture, ropePoints); 
    container.addChild(rope);
};


// NOTE: drawPreviewMarkerStroke is no longer needed as the new drawPreviewTextureStroke is used.
// The old drawPreviewPenStroke logic is also replaced by drawPreviewTextureStroke.
// We will simply use `drawPreviewTextureStroke` where the old functions were called.

const usePixiDrawingLogic = (
    pixiAppRef,
    getCoordinates,
    activeTool,
    lastActiveDrawingTool,
    brushProperties,
    shapeProperties,
    fillProperties,
    rulerGuideProperties,
    ellipseRulerProperties,
    spineRulerProperties,
    mirrorRulerProperties,
    isRulerActiveOnCanvas,
    activeRulerSubTool,
    commitStrokes,
    activeStrokes
) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentStrokePoints, setCurrentStrokePoints] = useState([]);
    const [currentShapeStartPoint, setCurrentShapeStartPoint] = useState(null);
    const [currentShapeEndPoint, setCurrentShapeEndPoint] = useState(null);
    const [predictedPoints, setPredictedPoints] = useState([]);
    
    const tempGraphicsRef = useRef(null);
    
    const hexToPixiColor = useCallback((hex) => {
        return parseInt(hex.replace('#', '0x'), 16);
    }, []);

   const handleDrawingMouseDown = useCallback(async (event) => {
    let coordsCSS = getCoordinates(event);
    if (!coordsCSS || !pixiAppRef.current) {
        return false;
    }

    const currentDrawingTool = (activeTool === 'ruler') ? lastActiveDrawingTool : activeTool;

    if (currentDrawingTool === 'brush' || currentDrawingTool === 'shape') {
        setIsDrawing(true);
        
        if (tempGraphicsRef.current) {
            pixiAppRef.current.stage.tempContainer.removeChild(tempGraphicsRef.current);
            tempGraphicsRef.current = null;
        }

        if (currentDrawingTool === 'brush') {
            let initialPoint = { ...coordsCSS, radius: brushProperties.size / 2 };
            let pointsForLiveDrawing = [initialPoint];

            if (isRulerActiveOnCanvas) {
                if (activeRulerSubTool === 'straight') {
                    initialPoint = { ...snapPointToStraightLine(coordsCSS, rulerGuideProperties), radius: brushProperties.size / 2 };
                } else if (activeRulerSubTool === 'ellipse') {
                    initialPoint = { ...snapPointToEllipse(coordsCSS, ellipseRulerProperties), radius: brushProperties.size / 2 };
                } else if (activeRulerSubTool === 'spine') {
                    initialPoint = { ...snapPointToSpine(coordsCSS, spineRulerProperties), radius: brushProperties.size / 2 };
                } else if (activeRulerSubTool === 'mirror') {
                    const mirroredPoint = transformPointForMirror(coordsCSS, mirrorRulerProperties);
                    pointsForLiveDrawing.push({ ...mirroredPoint, radius: brushProperties.size / 2 });
                }
            }
            
            setCurrentStrokePoints(pointsForLiveDrawing);
            
            const tempContainer = new PIXI.Container();
            tempGraphicsRef.current = tempContainer;
            pixiAppRef.current.stage.tempContainer.addChild(tempContainer);
            
            const color = brushProperties.type === 'eraser' ? 0xFFFFFF : hexToPixiColor(brushProperties.color);

            if (brushProperties.type === 'pen' || brushProperties.type === 'marker') {
                    drawPreviewTextureStroke(
                        tempContainer, 
                        pointsForLiveDrawing, 
                        brushProperties.color, 
                        brushProperties.opacity, 
                        brushProperties.size,
                        pixiAppRef // Pass pixiAppRef
                    );
                } else {
                    // Fallback for other brushes or eraser (line-based)
                    const tempGraphics = new PIXI.Graphics();
                    tempContainer.addChild(tempGraphics)
                    tempGraphics.stroke({
                        width: brushProperties.size,
                        color: color,
                        alpha: brushProperties.opacity
                    });
                    tempGraphics.moveTo(pointsForLiveDrawing[0].offsetX, pointsForLiveDrawing[0].offsetY);
                    if(pointsForLiveDrawing.length > 1) tempGraphics.lineTo(pointsForLiveDrawing[1].offsetX, pointsForLiveDrawing[1].offsetY);
                }
            
        } else if (currentDrawingTool === 'shape') {
            setCurrentShapeStartPoint(coordsCSS);
            setCurrentShapeEndPoint(coordsCSS);
            
            const tempGraphics = new PIXI.Graphics();
            tempGraphicsRef.current = tempGraphics;
            pixiAppRef.current.stage.tempContainer.addChild(tempGraphics);
            
            const color = hexToPixiColor(shapeProperties.color);
            tempGraphics.stroke({
                width: shapeProperties.size,
                color: color,
                alpha: shapeProperties.opacity
            });
            
            tempGraphics.circle(coordsCSS.offsetX, coordsCSS.offsetY, 1);
        }
        return true;
    }
    return false;
}, [
    getCoordinates, activeTool, lastActiveDrawingTool, pixiAppRef,
    brushProperties, shapeProperties, isRulerActiveOnCanvas, activeRulerSubTool,
    rulerGuideProperties, ellipseRulerProperties, spineRulerProperties, mirrorRulerProperties,
    hexToPixiColor
]);

    const handleDrawingMouseMove = useCallback((event) => {
        if (!isDrawing || !pixiAppRef.current) return false;

        const coordsCSS = getCoordinates(event);
        if (!coordsCSS) return false;

        const currentDrawingTool = (activeTool === 'ruler') ? lastActiveDrawingTool : activeTool;

        if (currentDrawingTool === 'brush') {
            setCurrentStrokePoints(prev => {
                let nextPoint = { ...coordsCSS, radius: brushProperties.size / 2 }; // Simplified: no pressure
                let pointsToAdd = [nextPoint];

                if (isRulerActiveOnCanvas) {
                    if (activeRulerSubTool === 'straight') {
                        pointsToAdd = [{ ...snapPointToStraightLine(coordsCSS, rulerGuideProperties), radius: nextPoint.radius }];
                    } else if (activeRulerSubTool === 'ellipse') {
                        pointsToAdd = [{ ...snapPointToEllipse(coordsCSS, ellipseRulerProperties), radius: nextPoint.radius }];
                    } else if (activeRulerSubTool === 'spine') {
                        pointsToAdd = [{ ...snapPointToSpine(coordsCSS, spineRulerProperties), radius: nextPoint.radius }];
                    } else if (activeRulerSubTool === 'mirror') {
                        const mirroredPoint = { ...transformPointForMirror(coordsCSS, mirrorRulerProperties), radius: nextPoint.radius };
                        pointsToAdd = [nextPoint, mirroredPoint];
                    }
                }

                const finalPoints = [...prev, ...pointsToAdd];
                
                if (tempGraphicsRef.current) {
                    const tempContainer = tempGraphicsRef.current;
                    const color = brushProperties.type === 'eraser' ? 0xFFFFFF : hexToPixiColor(brushProperties.color);
                    
                    tempContainer.removeChildren();

                    if (brushProperties.type === 'pen' || brushProperties.type === 'marker') {
                         drawPreviewTextureStroke(
                            tempContainer, 
                            finalPoints, 
                            brushProperties.color, 
                            brushProperties.opacity, 
                            brushProperties.size,
                            pixiAppRef // Pass pixiAppRef
                        );
                    } else {
                        const tempGraphics = new PIXI.Graphics();
                        tempContainer.addChild(tempGraphics);
                        tempGraphics.stroke({
                            width: brushProperties.size,
                            color: color,
                            alpha: brushProperties.opacity
                        });
                        if (finalPoints.length > 1) {
                           const smoothedPoints = getCatmullRomSplinePoints(finalPoints, 0.5, 10);
                           tempGraphics.moveTo(smoothedPoints[0].offsetX, smoothedPoints[0].offsetY);
                           for (let i = 1; i < smoothedPoints.length; i++) {
                               tempGraphics.lineTo(smoothedPoints[i].offsetX, smoothedPoints[i].offsetY);
                           }
                        }
                        tempGraphics.stroke();
                    }
                }
                
                return finalPoints;
            });
            return true;
        } else if (currentDrawingTool === 'shape') {
            if (currentShapeStartPoint) {
                setCurrentShapeEndPoint(coordsCSS);
                
                if (tempGraphicsRef.current) {
                    const tempGraphics = tempGraphicsRef.current;
                    const color = hexToPixiColor(shapeProperties.color);
                    
                    tempGraphics.clear();
                    tempGraphics.stroke({
                        width: shapeProperties.size,
                        color: color,
                        alpha: shapeProperties.opacity
                    });

                    if (shapeProperties.fillColor && shapeProperties.fillColor !== 'transparent') {
                        const fillColor = hexToPixiColor(shapeProperties.fillColor);
                        tempGraphics.fill({ color: fillColor, alpha: shapeProperties.opacity });
                    }
                    
                    if (shapeProperties.type === 'rectangle') {
                        const width = coordsCSS.offsetX - currentShapeStartPoint.offsetX;
                        const height = coordsCSS.offsetY - currentShapeStartPoint.offsetY;
                        tempGraphics.rect(currentShapeStartPoint.offsetX, currentShapeStartPoint.offsetY, width, height);
                    } else if (shapeProperties.type === 'circle') {
                        const radius = calculateDistance(currentShapeStartPoint, coordsCSS);
                        tempGraphics.circle(currentShapeStartPoint.offsetX, currentShapeStartPoint.offsetY, radius);
                    } else if (shapeProperties.type === 'line') {
                        tempGraphics.moveTo(currentShapeStartPoint.offsetX, currentShapeStartPoint.offsetY);
                        tempGraphics.lineTo(coordsCSS.offsetX, coordsCSS.offsetY);
                    }

                    if (shapeProperties.fillColor && shapeProperties.fillColor !== 'transparent') {
                        tempGraphics.fill();
                    }
                     tempGraphics.stroke();
                }
            }
            return true;
        }
        return false;
    }, [
        isDrawing, getCoordinates, activeTool, lastActiveDrawingTool, pixiAppRef,
        isRulerActiveOnCanvas, activeRulerSubTool, rulerGuideProperties, ellipseRulerProperties,
        spineRulerProperties, mirrorRulerProperties, currentShapeStartPoint,
        brushProperties, shapeProperties, hexToPixiColor
    ]);

    const handleDrawingMouseUp = useCallback(async () => {
        if (!isDrawing || !pixiAppRef.current) return false;
    
        const currentDrawingTool = (activeTool === 'ruler') ? lastActiveDrawingTool : activeTool;
    
        setPredictedPoints([]);
    
        if (currentDrawingTool === 'brush') {
            let pointsToSave = [...currentStrokePoints];
            
            // REMOVED: Pen pressure specific logic

            let committedRulerGuided = isRulerActiveOnCanvas;
            let committedRulerSubToolType = activeRulerSubTool;
            let committedRulerProps = isRulerActiveOnCanvas ?
                (activeRulerSubTool === 'straight' ? { ...rulerGuideProperties } :
                (activeRulerSubTool === 'ellipse' ? { ...ellipseRulerProperties } :
                (activeRulerSubTool === 'spine' ? { ...spineRulerProperties } :
                { ...mirrorRulerProperties }))) :
                null;
    
            if (pointsToSave.length > 1 && brushProperties.type !== 'pen' && brushProperties.type !== 'marker') {
                pointsToSave = getCatmullRomSplinePoints(pointsToSave, 0.5, 10);
            }
    
            if (isRulerActiveOnCanvas && activeRulerSubTool === 'mirror') {
                committedRulerGuided = true;
                committedRulerSubToolType = 'mirror';
                committedRulerProps = { ...mirrorRulerProperties };
            }
    
            if (pointsToSave.length > 0) {
                const finalStrokeColor = brushProperties.type === 'eraser' ? '#FFFFFF' : brushProperties.color;
    
                const newStroke = {
                    toolType: 'brush',
                    id: uuidv4(),
                    points: pointsToSave, 
                    color: finalStrokeColor,
                    size: brushProperties.size,
                    opacity: brushProperties.opacity, 
                    lineCap: brushProperties.lineCap,
                    lineJoin: brushProperties.lineJoin,
                    compositeOperation: brushProperties.compositeOperation,
                    brushType: brushProperties.type,
                    shadowBlur: brushProperties.shadowBlur,
                    shadowColor: brushProperties.shadowColor,
                    shadowOffsetX: brushProperties.shadowOffsetX,
                    shadowOffsetY: brushProperties.shadowOffsetY,
                    rulerGuided: committedRulerGuided,
                    rulerSubToolType: committedRulerSubToolType,
                    rulerProps: committedRulerProps,
                    isSplineSmoothed: brushProperties.type !== 'pen' && brushProperties.type !== 'marker',
                };
                await commitStrokes((prevStrokes) => [...prevStrokes, newStroke]);
            }
            setCurrentStrokePoints([]);
            
        } else if (currentDrawingTool === 'shape') {
            if (currentShapeStartPoint && currentShapeEndPoint) {
                const newShape = {
                    toolType: 'shape',
                    id: uuidv4(),
                    shapeType: shapeProperties.type,
                    startPoint: currentShapeStartPoint,
                    endPoint: currentShapeEndPoint,
                    color: shapeProperties.color,
                    size: shapeProperties.size,
                    opacity: shapeProperties.opacity, 
                    lineCap: shapeProperties.lineCap,
                    lineJoin: shapeProperties.lineJoin,
                    fillColor: shapeProperties.fillColor,
                    shadowBlur: shapeProperties.shadowBlur,
                    shadowColor: shapeProperties.shadowColor,
                    shadowOffsetX: shapeProperties.shadowOffsetX,
                    shadowOffsetY: shapeProperties.shadowOffsetY,
                };
                await commitStrokes((prevStrokes) => [...prevStrokes, newShape]);
            }
            setCurrentShapeStartPoint(null);
            setCurrentShapeEndPoint(null);
        }
        
        if (tempGraphicsRef.current) {
            pixiAppRef.current.stage.tempContainer.removeChild(tempGraphicsRef.current);
            tempGraphicsRef.current = null;
        }
        
        setIsDrawing(false);
        return true;
    }, [
        isDrawing, activeTool, lastActiveDrawingTool, pixiAppRef,
        currentStrokePoints, brushProperties, isRulerActiveOnCanvas, activeRulerSubTool,
        rulerGuideProperties, ellipseRulerProperties, spineRulerProperties, mirrorRulerProperties,
        commitStrokes, currentShapeStartPoint, currentShapeEndPoint, shapeProperties,
    ]);
    
    return {
        isDrawing,
        currentStrokePoints,
        currentShapeStartPoint,
        currentShapeEndPoint,
        predictedPoints,
        handleDrawingMouseDown,
        handleDrawingMouseMove,
        handleDrawingMouseUp,
    };
};

export default usePixiDrawingLogic;