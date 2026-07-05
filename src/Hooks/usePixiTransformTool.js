// src/Hooks/usePixiTransformTool.js
import { useState, useCallback, useRef } from 'react';

const calculateCorrectHandlePositions = (bbox, rotation) => {
    if (!bbox) return {};

    const { centerX, centerY, minX, minY, maxX, maxY } = bbox;
    const HANDLE_SIZE_CSS = 12;
    const handleRadius = HANDLE_SIZE_CSS / 2;

    const rotate = (p, angle) => {
        const rad = angle * (Math.PI / 180);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const translatedX = p.x - centerX;
        const translatedY = p.y - centerY;
        return {
            x: centerX + (translatedX * cos - translatedY * sin),
            y: centerY + (translatedX * sin + translatedY * cos),
        };
    };

    const unrotatedHandles = {
        rotate:  { x: centerX,            y: minY - handleRadius },
        move:    { x: centerX,            y: centerY },
        scaleTL: { x: minX,  y: minY },
        scaleTR: { x: maxX,  y: minY },
        scaleBL: { x: minX,  y: maxY },
        scaleBR: { x: maxX,  y: maxY },
    };

    const rotatedHandles = {};
    for (const key in unrotatedHandles) {
        rotatedHandles[key] = rotate(unrotatedHandles[key], rotation);
    }
    return rotatedHandles;
};

const usePixiTransformTool = (
    pixiAppRef,
    strokes,
    selectedStrokeIds,
    setStrokes,
    zoomLevel
) => {
    const [isTransforming, setIsTransforming] = useState(false);
    const [transformActionType, setTransformActionType] = useState(null);
    const [hoveredObject, setHoveredObject] = useState(null);

    const startMousePos = useRef(null);
    const initialBbox = useRef(null);
    const initialStrokeTransforms = useRef({});

    const redrawFunctionRef = useRef(null);

    const setRedrawFunction = useCallback((fn) => {
        redrawFunctionRef.current = fn;
    }, []);

    const getDistance = (p1, p2) => {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    };

    const getHandleHit = useCallback((clickCoords, handlePositions, currentZoomLevel) => {
        const HANDLE_SIZE_SCREEN = 16;
        const handleSizeWorld = HANDLE_SIZE_SCREEN / currentZoomLevel;

        for (const type in handlePositions) {
            const handlePos = handlePositions[type];
            const distance = getDistance(clickCoords, { x: handlePos.x, y: handlePos.y });
            if (distance <= handleSizeWorld / 2) {
                console.log("Handle hit:", type);
                return type;
            }
        }
        return null;
    }, []);

    // Helper function to calculate bounding box for Pixi.js objects
    const getBoundingBoxForPixiObject = (pixiObject) => {
        if (!pixiObject) return null;
        
        // For Graphics objects
        if (pixiObject.geometry) {
            const bounds = pixiObject.getBounds();
            return {
                minX: bounds.x,
                minY: bounds.y,
                maxX: bounds.x + bounds.width,
                maxY: bounds.y + bounds.height,
                centerX: bounds.x + bounds.width / 2,
                centerY: bounds.y + bounds.height / 2,
                width: bounds.width,
                height: bounds.height
            };
        }
        
        // For Text objects
        if (pixiObject.text) {
            const bounds = pixiObject.getBounds();
            return {
                minX: bounds.x,
                minY: bounds.y,
                maxX: bounds.x + bounds.width,
                maxY: bounds.y + bounds.height,
                centerX: bounds.x + bounds.width / 2,
                centerY: bounds.y + bounds.height / 2,
                width: bounds.width,
                height: bounds.height
            };
        }
        
        // For Sprites (fill strokes)
        if (pixiObject.texture) {
            const bounds = pixiObject.getBounds();
            return {
                minX: bounds.x,
                minY: bounds.y,
                maxX: bounds.x + bounds.width,
                maxY: bounds.y + bounds.height,
                centerX: bounds.x + bounds.width / 2,
                centerY: bounds.y + bounds.height / 2,
                width: bounds.width,
                height: bounds.height
            };
        }
        
        return null;
    };

    const getCombinedBoundingBoxForStrokes = (selectedStrokes, allStrokes) => {
        if (selectedStrokes.length === 0) return null;
        
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        
        selectedStrokes.forEach(stroke => {
            let bbox;
            
            if (stroke.toolType === 'fill' && stroke.sprite) {
                bbox = getBoundingBoxForPixiObject(stroke.sprite);
            } else if (stroke.toolType === 'text' && stroke.pixiText) {
                bbox = getBoundingBoxForPixiObject(stroke.pixiText);
            } else if (stroke.graphics) {
                bbox = getBoundingBoxForPixiObject(stroke.graphics);
            }
            
            if (bbox) {
                minX = Math.min(minX, bbox.minX);
                minY = Math.min(minY, bbox.minY);
                maxX = Math.max(maxX, bbox.maxX);
                maxY = Math.max(maxY, bbox.maxY);
            }
        });
        
        if (minX === Infinity) return null;
        
        return {
            minX,
            minY,
            maxX,
            maxY,
            centerX: (minX + maxX) / 2,
            centerY: (minY + maxY) / 2,
            width: maxX - minX,
            height: maxY - minY
        };
    };

    const handleTransformMouseDown = useCallback((event, clickCoords) => {
        if (selectedStrokeIds.length === 0) return false;

        if (!pixiAppRef.current) return false;
        
        const selectedStrokes = strokes.filter(s => selectedStrokeIds.includes(s.id));
        if (selectedStrokes.length === 0) return false;

        const currentBbox = getCombinedBoundingBoxForStrokes(selectedStrokes, strokes);
        if (!currentBbox) return false;

        const currentRotation = selectedStrokes[0]?.transform?.rotation || 0;
        const handlePositions = calculateCorrectHandlePositions(currentBbox, currentRotation);
        
        const hitHandleType = getHandleHit(clickCoords, handlePositions, zoomLevel);
        
        if (hitHandleType) {
            setIsTransforming(true);
            setTransformActionType(hitHandleType);
            startMousePos.current = clickCoords;
            initialBbox.current = currentBbox;
            
            initialStrokeTransforms.current = selectedStrokes.reduce((acc, stroke) => {
                const initialTransform = stroke.transform || { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
                
                // Get the untransformed bounding box
                let untransformedBbox;
                if (stroke.toolType === 'fill' && stroke.sprite) {
                    // For fill strokes, we need to calculate the original position
                    const originalScaleX = stroke.originalCanvasWidth / stroke.sprite.texture.orig.width;
                    const originalScaleY = stroke.originalCanvasHeight / stroke.sprite.texture.orig.height;
                    untransformedBbox = {
                        centerX: stroke.sprite.texture.orig.width * originalScaleX / 2,
                        centerY: stroke.sprite.texture.orig.height * originalScaleY / 2
                    };
                } else if (stroke.toolType === 'text' && stroke.pixiText) {
                    // For text, use the text's original position
                    untransformedBbox = {
                        centerX: stroke.pixiText.width / 2,
                        centerY: stroke.pixiText.height / 2
                    };
                } else if (stroke.graphics) {
                    // For graphics, use the bounds
                    const bounds = stroke.graphics.getBounds();
                    untransformedBbox = {
                        centerX: bounds.width / 2,
                        centerY: bounds.height / 2
                    };
                }

                if (untransformedBbox) {
                    acc[stroke.id] = {
                        ...initialTransform,
                        untransformedCenterX: untransformedBbox.centerX,
                        untransformedCenterY: untransformedBbox.centerY,
                        initialAbsCenterX: untransformedBbox.centerX + initialTransform.x,
                        initialAbsCenterY: untransformedBbox.centerY + initialTransform.y,
                    };
                }
                return acc;
            }, {});
            return true;
        }

        return false;
    }, [selectedStrokeIds, strokes, pixiAppRef, getHandleHit, zoomLevel]);

    const handleTransformMouseMove = useCallback((event, currentMousePos) => {
        if (!isTransforming || !startMousePos.current || !initialBbox.current) return;

        const dx_total = currentMousePos.offsetX - startMousePos.current.offsetX;
        const dy_total = currentMousePos.offsetY - startMousePos.current.y;

        const groupInitialCenter = { x: initialBbox.current.centerX, y: initialBbox.current.centerY };

        setStrokes(prevStrokes => {
            return prevStrokes.map(stroke => {
                if (!selectedStrokeIds.includes(stroke.id)) return stroke;
                
                const initial = initialStrokeTransforms.current[stroke.id];
                if (!initial) return stroke;

                let newTransform = { ...initial };

                switch (transformActionType) {
                    case 'move':
                        newTransform.x = initial.x + dx_total;
                        newTransform.y = initial.y + dy_total;
                        break;
                    
                    case 'rotate': {
                        const startAngleRad = Math.atan2(startMousePos.current.y - groupInitialCenter.y, startMousePos.current.x - groupInitialCenter.x);
                        const currentAngleRad = Math.atan2(currentMousePos.y - groupInitialCenter.y, currentMousePos.x - groupInitialCenter.x);
                        const deltaAngleRad = currentAngleRad - startAngleRad;
                        const deltaAngleDeg = deltaAngleRad * 180 / Math.PI;

                        newTransform.rotation = initial.rotation + deltaAngleDeg;

                        // Recalculate position to rotate around group center
                        const relativeX = initial.initialAbsCenterX - groupInitialCenter.x;
                        const relativeY = initial.initialAbsCenterY - groupInitialCenter.y;
                        
                        const rotatedX = relativeX * Math.cos(deltaAngleRad) - relativeY * Math.sin(deltaAngleRad);
                        const rotatedY = relativeX * Math.sin(deltaAngleRad) + relativeY * Math.cos(deltaAngleRad);

                        newTransform.x = (groupInitialCenter.x + rotatedX) - initial.untransformedCenterX;
                        newTransform.y = (groupInitialCenter.y + rotatedY) - initial.untransformedCenterY;
                        break;
                    }
                    
                    case 'scaleTL': case 'scaleTR': case 'scaleBL': case 'scaleBR': {
                        const initialMouseDist = getDistance(startMousePos.current, groupInitialCenter);
                        const currentMouseDist = getDistance(currentMousePos, groupInitialCenter);
                        let scaleFactor = (initialMouseDist > 0) ? currentMouseDist / initialMouseDist : 1;
                        scaleFactor = Math.max(0.01, scaleFactor);

                        newTransform.scaleX = initial.scaleX * scaleFactor;
                        newTransform.scaleY = initial.scaleY * scaleFactor;

                        // Recalculate position to scale from group center
                        const relativeX = initial.initialAbsCenterX - groupInitialCenter.x;
                        const relativeY = initial.initialAbsCenterY - groupInitialCenter.y;
                        
                        const scaledX = relativeX * scaleFactor;
                        const scaledY = relativeY * scaleFactor;
                        
                        newTransform.x = (groupInitialCenter.x + scaledX) - initial.untransformedCenterX;
                        newTransform.y = (groupInitialCenter.y + scaledY) - initial.untransformedCenterY;
                        break;
                    }

                    default: break;
                }
                
                // Update the Pixi.js object's transformation
                if (stroke.toolType === 'fill' && stroke.sprite) {
                    stroke.sprite.position.set(newTransform.x, newTransform.y);
                    stroke.sprite.scale.set(newTransform.scaleX, newTransform.scaleY);
                    stroke.sprite.rotation = newTransform.rotation * (Math.PI / 180);
                } else if (stroke.toolType === 'text' && stroke.pixiText) {
                    stroke.pixiText.position.set(newTransform.x, newTransform.y);
                    stroke.pixiText.scale.set(newTransform.scaleX, newTransform.scaleY);
                    stroke.pixiText.rotation = newTransform.rotation * (Math.PI / 180);
                } else if (stroke.graphics) {
                    stroke.graphics.position.set(newTransform.x, newTransform.y);
                    stroke.graphics.scale.set(newTransform.scaleX, newTransform.scaleY);
                    stroke.graphics.rotation = newTransform.rotation * (Math.PI / 180);
                }
                
                return { ...stroke, transform: newTransform };
            });
        });

        if (redrawFunctionRef.current) redrawFunctionRef.current();

    }, [isTransforming, selectedStrokeIds, setStrokes, transformActionType]);

    const handleMouseMoveForHover = useCallback((coords) => {
        if (isTransforming || selectedStrokeIds.length === 0) {
            if (hoveredObject !== null) setHoveredObject(null);
            return;
        }

        if (!pixiAppRef.current) return;

        const selectedStrokes = strokes.filter(s => selectedStrokeIds.includes(s.id));
        const currentBbox = getCombinedBoundingBoxForStrokes(selectedStrokes, strokes);
        if (!currentBbox) {
            if (hoveredObject !== null) setHoveredObject(null);
            return;
        }

        const currentRotation = selectedStrokes[0]?.transform?.rotation || 0;
        const handlePositions = calculateCorrectHandlePositions(currentBbox, currentRotation);
        const hitHandleType = getHandleHit(coords, handlePositions, zoomLevel);

        if (hitHandleType) {
            if (hoveredObject?.type !== 'handle' || hoveredObject?.handleType !== hitHandleType) {
                setHoveredObject({ type: 'handle', handleType: hitHandleType });
            }
        } else {
            if (hoveredObject !== null) {
                setHoveredObject(null);
            }
        }
    }, [isTransforming, selectedStrokeIds, strokes, pixiAppRef, zoomLevel, getHandleHit, hoveredObject]);

    const handleTransformMouseUp = useCallback(() => {
        setIsTransforming(false);
        setTransformActionType(null);
        startMousePos.current = null;
        initialBbox.current = null;
        initialStrokeTransforms.current = {};

        if (redrawFunctionRef.current) {
            redrawFunctionRef.current();
        }
    }, []);

    return {
        isTransforming,
        transformActionType,
        hoveredObject,
        handleTransformMouseDown,
        handleTransformMouseMove,
        handleTransformMouseUp,
        handleMouseMoveForHover,
        setRedrawFunction
    };
};

export default usePixiTransformTool;