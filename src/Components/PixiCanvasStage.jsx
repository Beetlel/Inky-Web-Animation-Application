import React, { useRef, useEffect, useCallback, useContext, useState, useMemo } from 'react';
import * as PIXI from 'pixi.js';
import ToolStateContext from '../context/ToolStateContext.jsx';
import usePixiTextTool from '../Hooks/usePixiTextTool.js';
import usePixiRulerInteractions from '../Hooks/usePixiRulerInteractions.js';
import usePixiDrawingLogic from '../Hooks/usePixiDrawingLogic.js';
import usePixiTransformTool from '../Hooks/usePixiTransformTool.js';
import usePixiFillTool from '../Hooks/usePixiFillTool.js';
import RulerOverlay from './RulerOverlay.jsx';
import TextInputOverlay from './TextInputOverlay.jsx';
import DrawingActionsContext from '../context/DrawingActionContext.jsx';
import { createPixiGrid, updatePixiGrid } from '../Utils/PixiGridUtils.js';
import { checkRectIntersection, getTransformedBoundingBox } from '../Utils/DrawingUtils.js';
import { createBrushStrokeGraphics, createShapeStrokeGraphics, createTextStroke, createFillStrokeSprite } from '../Utils/PixiDrawingUtils.js'; // <-- IMPORT THE RENDER FUNCTIONS

// NEW: Define fixed artboard dimensions
const ARTBOARD_WIDTH = 1920;
const ARTBOARD_HEIGHT = 1080;

const PixiCanvasStage = ({
  layers,
  activeLayerId,
  updateActiveLayerStrokes,
  setSelectedStrokeBoundingBox,
  allFrames,
  activeFrameIndex,
  onionSkinEnabled,
  onionSkinPrevCount,
  onionSkinNextCount,
  onionSkinOpacity,
  showGrid,
  viewportResetTrigger,
  className
}) => {
  console.log('PixiCanvasStage component rendering/evaluating...');

  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [selectedStrokeIds, setSelectedStrokeIds] = useState([]);
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);

  // Refs for Pixi.js
  const pixiContainerRef = useRef(null);
  const pixiAppRef = useRef(null);
  const marqueeStartPointRef = useRef(null);
  const marqueeEndPointRef = useRef(null);
  const gridGraphicsRef = useRef(null);
  const marqueeGraphicsRef = useRef(null);
  const textInputRef = useRef(); // Moved to top level to fix hook order

  // Context - DrawingActionsContext is used here
  const {
    zoomLevel,
    setZoomLevel,
    offset,
    setOffset,
    resetViewport,
  } = useContext(DrawingActionsContext);

  // Context - activeEditTool is destructured here
  const {
    activeTool,
    brushProperties,
    shapeProperties,
    textProperties,
    rulerGuideProperties,
    handleRulerGuidePropertyChange,
    ellipseRulerProperties,
    handleEllipseRulerPropertyChange,
    spineRulerProperties,
    handleSpineRulerPropertyChange,
    addSpineRulerPoint,
    removeLastSpineRulerPoint,
    clearSpineRulerPoints,
    mirrorRulerProperties,
    handleMirrorRulerPropertyChange,
    fillProperties,
    isRulerActiveOnCanvas,
    activeRulerSubTool,
    lastActiveDrawingTool,
    activeEditTool,
    transformProperties,
    handleTransformPropertyChange,
    currentMode,
  } = useContext(ToolStateContext);

  console.log('[PixiCanvasStage Render] currentMode from context:', currentMode);

  // Refs for currentMode and activeEditTool
  const currentModeRef = useRef(currentMode);
  const activeEditToolRef = useRef(activeEditTool);

  // Zoom and Pan State
  const [isPanning, setIsPanning] = useState(false);
  const lastPanPointRef = useRef({ x: 0, y: 0 });

  // Touch state for pinch-to-zoom
  const [isPinching, setIsPinching] = useState(false);
  const initialPinchDistanceRef = useRef(0);
  const initialPinchMidpointRef = useRef({ x: 0, y: 0 });
  const initialZoomRef = useRef(1);
  const initialOffsetRef = useRef({ x: 0, y: 0 });

  // Animation frame for redraw optimization
  const redrawRequestRef = useRef(null);

  useEffect(() => {
    currentModeRef.current = currentMode;
    activeEditToolRef.current = activeEditTool;
    console.log(`[PixiCanvasStage] Mode/Tool Refs updated: currentModeRef.current=${currentModeRef.current}, activeEditToolRef.current=${activeEditToolRef.current}`);
  }, [currentMode, activeEditTool]);

  // NEW: Function to center the view on the artboard
  const centerArtboard = useCallback(() => {
    if (!pixiAppRef.current || !containerSize.width) return;

    const { width, height } = containerSize;
    const scaleX = width / ARTBOARD_WIDTH;
    const scaleY = height / ARTBOARD_HEIGHT;
    const newZoom = Math.min(scaleX, scaleY, 2);

    const newOffsetX = (width / 2) - (ARTBOARD_WIDTH / 2) * newZoom;
    const newOffsetY = (height / 2) - (ARTBOARD_HEIGHT / 2) * newZoom;

    setZoomLevel(newZoom);
    setOffset({ x: newOffsetX, y: newOffsetY });
  }, [containerSize, setZoomLevel, setOffset]);

  // --- START OF FIX: Final Robust PixiJS Initialization ---
  useEffect(() => {
    const container = pixiContainerRef.current;
    if (!container) return;

    // Create the PixiJS Application
    const app = new PIXI.Application();

    // Initialize the application with dimensions and other settings
    app.init({
        width: container.clientWidth,
        height: container.clientHeight,
        background: 0x4A4A4A, // <--- THIS IS THE COLOR CHANGE
        antialias: true,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
    }).then(() => {
        // Clear out any old canvas elements from previous renders
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        // Add the new canvas to the DOM
        container.appendChild(app.canvas);
        pixiAppRef.current = app;

        // Set up the scene graph
        const mainContainer = new PIXI.Container();
        app.stage.addChild(mainContainer);
        app.stage.mainContainer = mainContainer;
        
        const artboardBg = new PIXI.Graphics()
            .rect(0, 0, ARTBOARD_WIDTH, ARTBOARD_HEIGHT)
            .fill(0xFFFFFF);
        mainContainer.addChild(artboardBg);
        artboardBg.zIndex = 0;

        const layersContainer = new PIXI.Container();
        layersContainer.zIndex = 1;
        mainContainer.addChild(layersContainer);
        app.stage.layersContainer = layersContainer;

        const tempContainer = new PIXI.Container();
        tempContainer.zIndex = 2;
        mainContainer.addChild(tempContainer);
        app.stage.tempContainer = tempContainer;

        const rulersContainer = new PIXI.Container();
        rulersContainer.zIndex = 3;
        mainContainer.addChild(rulersContainer);
        app.stage.rulersContainer = rulersContainer;
            
        const gridContainer = new PIXI.Container();
        gridContainer.zIndex = 4;
        mainContainer.addChild(gridContainer);
        app.stage.gridContainer = gridContainer;
        
        gridGraphicsRef.current = createPixiGrid(ARTBOARD_WIDTH, ARTBOARD_HEIGHT);
        gridContainer.addChild(gridGraphicsRef.current);

        marqueeGraphicsRef.current = new PIXI.Graphics();
        marqueeGraphicsRef.current.zIndex = 5;
        app.stage.addChild(marqueeGraphicsRef.current);

        setIsCanvasReady(true);
        console.log('Pixi.js application initialized successfully.');

    }).catch(err => console.error("PixiJS Initialization Error:", err));

    // This is the cleanup function that React will run when the component unmounts
    return () => {
        if (pixiAppRef.current) {
            pixiAppRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
            pixiAppRef.current = null;
        }
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount
  // --- END OF FIX ---

  // This effect handles the initial centering and the reset trigger
  useEffect(() => {
    if (isCanvasReady && viewportResetTrigger) {
      centerArtboard();
    }
  }, [isCanvasReady, viewportResetTrigger, centerArtboard]);

  // Update viewport (zoom/pan)
  useEffect(() => {
    if (!pixiAppRef.current || !isCanvasReady) return;

    const { mainContainer } = pixiAppRef.current.stage;
    mainContainer.scale.set(zoomLevel);
    mainContainer.position.set(offset.x, offset.y);
  }, [zoomLevel, offset, isCanvasReady]);

  // `layers` prop is already the active frame's layers, so activeLayer and activeStrokes are derived from it
  const activeLayer = useMemo(() => {
    const foundLayer = layers.find(layer => layer.id === activeLayerId);
    if (!foundLayer) {
      console.warn('[PixiCanvasStage] activeLayerId not found in current frame layers, defaulting to first layer if available.');
      return layers[0] || null;
    }
    return foundLayer;
  }, [layers, activeLayerId]);

  const activeStrokes = activeLayer?.strokes || [];

  // activeStrokesRef and selectedStrokeIdsRef initialization and updates
  const activeStrokesRef = useRef(activeStrokes);
  const selectedStrokeIdsRef = useRef([]);

  useEffect(() => {
    activeStrokesRef.current = activeStrokes;
    selectedStrokeIdsRef.current = selectedStrokeIds;
    console.log('[PixiCanvasStage] Refs updated. activeStrokesRef.current.length:', activeStrokesRef.current.length, 'selectedStrokeIdsRef.current:', selectedStrokeIdsRef.current);
  }, [activeStrokes, selectedStrokeIds]);

  // Convert strokes to Pixi.js objects
  const convertStrokeToPixiObject = useMemo(() => {
    if (!isCanvasReady) return async () => null;

    return async (stroke) => {
        let pixiObject = null;
        switch(stroke.toolType) {
            case 'brush':
                pixiObject = createBrushStrokeGraphics(stroke, pixiAppRef.current);
                break;
            case 'shape':
                pixiObject = createShapeStrokeGraphics(stroke);
                break;
            case 'text':
                pixiObject = createTextStroke(stroke);
                break;
            case 'fill':
                pixiObject = await createFillStrokeSprite(stroke);
                break;
            default:
                return null;
        }

        if (pixiObject && stroke.transform) {
            pixiObject.position.set(stroke.transform.x || 0, stroke.transform.y || 0);
            pixiObject.scale.set(stroke.transform.scaleX || 1, stroke.transform.scaleY || 1);
            pixiObject.rotation = (stroke.transform.rotation || 0) * (Math.PI / 180);
        }
        
        return pixiObject;
    }
  }, [isCanvasReady]);

  // Render strokes to Pixi.js
  const renderStrokes = useCallback(async () => {
    if (!pixiAppRef.current || !isCanvasReady || !pixiAppRef.current.stage) return;

    const { layersContainer } = pixiAppRef.current.stage;

    if (!layersContainer || typeof layersContainer.removeChildren !== 'function') {
        console.warn('layersContainer not ready for renderStrokes');
        return;
    }

    layersContainer.removeChildren();

    for (const layer of layers) {
        if (!layer.visible) continue;

        const layerContainer = new PIXI.Container();
        layerContainer.alpha = layer.opacity !== undefined ? layer.opacity : 1;
        layersContainer.addChild(layerContainer);

        for (const stroke of layer.strokes) {
            const pixiObject = await convertStrokeToPixiObject(stroke);
            if (pixiObject) {
                layerContainer.addChild(pixiObject);
            }
        }
    }
  }, [layers, isCanvasReady, convertStrokeToPixiObject]);


  // Render onion skins
  const renderOnionSkins = useCallback(async () => {
    if (!pixiAppRef.current || !isCanvasReady || !pixiAppRef.current.stage || !onionSkinEnabled) return;

    const { layersContainer } = pixiAppRef.current.stage;
    const onionSkinContainer = new PIXI.Container();
    onionSkinContainer.alpha = onionSkinOpacity;
    layersContainer.addChild(onionSkinContainer);

    if (!layersContainer || typeof layersContainer.addChild !== 'function') return;

    const renderFrame = async (frameIndex, container) => {
        const frame = allFrames[frameIndex];
        if (frame) {
            for (const layer of frame.layers) {
                if (layer.visible) {
                    const layerContainer = new PIXI.Container();
                    layerContainer.alpha = layer.opacity !== undefined ? layer.opacity : 1;
                    container.addChild(layerContainer);
                    for (const stroke of layer.strokes) {
                        const pixiObject = await convertStrokeToPixiObject(stroke);
                        if (pixiObject) {
                            layerContainer.addChild(pixiObject);
                        }
                    }
                }
            }
        }
    };

    if (activeFrameIndex > 0 && onionSkinPrevCount > 0) {
        for (let i = 1; i <= onionSkinPrevCount; i++) {
            const prevFrameIndex = activeFrameIndex - i;
            if (prevFrameIndex >= 0) {
                await renderFrame(prevFrameIndex, onionSkinContainer);
            }
        }
    }

    if (onionSkinNextCount > 0 && allFrames.length > activeFrameIndex + 1) {
        for (let i = 1; i <= onionSkinNextCount; i++) {
            const nextFrameIndex = activeFrameIndex + i;
            if (nextFrameIndex < allFrames.length) {
                await renderFrame(nextFrameIndex, onionSkinContainer);
            }
        }
    }
}, [isCanvasReady, onionSkinEnabled, onionSkinPrevCount, onionSkinNextCount, onionSkinOpacity, allFrames, activeFrameIndex, convertStrokeToPixiObject]);

  // Render grid
  const renderGrid = useCallback(() => {
    if (!pixiAppRef.current || !isCanvasReady || !gridGraphicsRef.current) return;
    gridGraphicsRef.current.visible = showGrid;
  }, [showGrid, isCanvasReady]);

  // Add this function after the initialization
  const debugArtboardVisibility = useCallback(() => {
  if (!pixiAppRef.current || !pixiAppRef.current.stage) return;
  
  const { mainContainer } = pixiAppRef.current.stage;
  if (!mainContainer) return;
  
  console.log('Main container children:', mainContainer.children.length);
  console.log('Main container position:', mainContainer.position);
  console.log('Main container scale:', mainContainer.scale);
  console.log('Main container visible:', mainContainer.visible);
  
  // Check if artboard background exists
  const artboardBg = mainContainer.children[0]; // Should be the first child
  if (artboardBg) {
    console.log('Artboard background found:', artboardBg);
    console.log('Artboard bounds:', artboardBg.getBounds());
    console.log('Artboard visible:', artboardBg.visible);
    console.log('Artboard alpha:', artboardBg.alpha);
  }
}, []);

// Call the debug function after initialization
useEffect(() => {
  if (isCanvasReady) {
    debugArtboardVisibility();
    // Also try to center the artboard
    centerArtboard();
  }
}, [isCanvasReady, debugArtboardVisibility, centerArtboard]);

  // Update rendering when dependencies change
  useEffect(() => {
    if (isCanvasReady) {
      renderStrokes();
      renderOnionSkins();
      renderGrid();
    }
  }, [isCanvasReady, renderStrokes, renderOnionSkins, renderGrid]);

  // Update the getCoordinates function to handle Pixi.js coordinate system:
  const getCoordinates = useCallback((event) => {
    if (!pixiAppRef.current) return null;

    const rect = pixiAppRef.current.canvas.getBoundingClientRect();
    // Get mouse position relative to the canvas element
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    const x = (clientX - rect.left) * (pixiAppRef.current.renderer.width / rect.width);
    const y = (clientY - rect.top) * (pixiAppRef.current.renderer.height / rect.height);
    
    // Convert screen coordinates to world coordinates (within mainContainer)
    const worldPoint = pixiAppRef.current.stage.mainContainer.toLocal({x, y});

    return {
      offsetX: worldPoint.x,
      offsetY: worldPoint.y
    };
  }, []);

  // Simplified setActiveStrokes to be a direct function
  const setActiveStrokes = (newStrokes, shouldClearRedo) => {
    console.log(`[PixiCanvasStage] setActiveStrokes called for layer ${activeLayerId}. New stroke count: ${newStrokes.length}. shouldClearRedo: ${shouldClearRedo}`);
    updateActiveLayerStrokes(newStrokes, shouldClearRedo);
  };

  // Commit strokes to state and redraw
  const commitStrokes = useCallback(async (updateFunction, shouldClearRedo = true) => {
    console.log(`[PixiCanvasStage] commitStrokes called. Updating active layer strokes... shouldClearRedo: ${shouldClearRedo}`);
    setActiveStrokes(updateFunction, shouldClearRedo);
    renderStrokes();
  }, [setActiveStrokes, renderStrokes]);

  // Use Pixi.js specific hooks
  const {
    isTypingText,
    textInputPosition,
    currentTextInput,
    setCurrentTextInput,
    setTextInputPosition,
    setIsTypingText,
    commitText,
    handleTextInputKeyDown,
  } = usePixiTextTool(
    pixiAppRef,
    textProperties,
    setActiveStrokes,
    renderStrokes,
    renderStrokes
  );

  const {
    isDraggingRuler,
    draggedSpinePointIndex,
    handleRulerMouseDown,
    handleRulerMouseMove,
    handleRulerMouseUp,
  } = usePixiRulerInteractions(
    rulerGuideProperties,
    handleRulerGuidePropertyChange,
    ellipseRulerProperties,
    handleEllipseRulerPropertyChange,
    spineRulerProperties,
    handleSpineRulerPropertyChange,
    addSpineRulerPoint,
    removeLastSpineRulerPoint,
    clearSpineRulerPoints,
    mirrorRulerProperties,
    handleMirrorRulerPropertyChange,
    isRulerActiveOnCanvas,
    activeRulerSubTool
  );

  const {
    handleFill,
    handleFillPreview,
    clearFillPreview,
  } = usePixiFillTool(
    pixiAppRef,
    { offset, zoomLevel },
    commitStrokes,
    fillProperties
  );

  const {
    isDrawing,
    currentStrokePoints,
    currentShapeStartPoint,
    currentShapeEndPoint,
    handleDrawingMouseDown,
    handleDrawingMouseMove,
    handleDrawingMouseUp,
  } = usePixiDrawingLogic(
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
  );

  const {
    isTransforming,
    hoveredObject,
    handleTransformMouseDown: handleTransformToolMouseDown,
    handleTransformMouseMove: handleTransformToolMouseMove,
    handleTransformMouseUp: handleTransformToolMouseUp,
    handleMouseMoveForHover,
    setRedrawFunction: setTransformToolRedrawFunction
  } = usePixiTransformTool(
    pixiAppRef,
    activeStrokes,
    selectedStrokeIds,
    setActiveStrokes,
    zoomLevel
  );

  // Set up the redraw function for the transform tool
  useEffect(() => {
    setTransformToolRedrawFunction(() => renderStrokes);
  }, [setTransformToolRedrawFunction, renderStrokes]);

  const handlePanStart = useCallback((event) => {
    const rect = pixiAppRef.current.canvas.getBoundingClientRect();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;

    setIsPanning(true);
    lastPanPointRef.current = { x: clientX, y: clientY };
    
    event.preventDefault();
    return true;
  }, []);

  const handlePanMove = useCallback((event) => {
    if (!isPanning) return;
  
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;

    const dx = clientX - lastPanPointRef.current.x;
    const dy = clientY - lastPanPointRef.current.y;
  
    setOffset(prevOffset => ({
      x: prevOffset.x + dx,
      y: prevOffset.y + dy
    }));
  
    lastPanPointRef.current = { x: clientX, y: clientY };
  }, [isPanning, setOffset]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  // NEW: Pinch-to-zoom calculation
  const calculatePinchZoom = useCallback((touches) => {
    const touch1 = touches[0];
    const touch2 = touches[1];

    // Calculate distance between touches
    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );

    // Calculate midpoint
    const midpoint = {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };

    return { distance, midpoint };
  }, []);

  const handleStrokeSelection = useCallback(async (coords, event) => {
    if (!pixiAppRef.current || !activeLayer || activeLayer.locked) {
        return false;
    }

    let clickedStroke = null;

    for (let i = activeStrokesRef.current.length - 1; i >= 0; i--) {
        const stroke = activeStrokesRef.current[i];
        const pixiObject = await convertStrokeToPixiObject(stroke);

        if (pixiObject) {
            const bounds = pixiObject.getBounds();
            if (coords.offsetX >= bounds.x && coords.offsetX <= bounds.x + bounds.width &&
                coords.offsetY >= bounds.y && coords.offsetY <= bounds.y + bounds.height) {
                clickedStroke = stroke;
                break;
            }
        }
    }

    const isMultiSelect = event.shiftKey || event.ctrlKey || event.metaKey;
    if (clickedStroke) {
        const clickedId = clickedStroke.id;
        setSelectedStrokeIds(prevSelectedIds => {
            const isAlreadySelected = prevSelectedIds.includes(clickedId);
            let newSelection;
            if (isMultiSelect) {
                newSelection = isAlreadySelected ?
                    prevSelectedIds.filter(id => id !== clickedId) :
                    [...prevSelectedIds, clickedId];
            } else {
                newSelection = (isAlreadySelected && prevSelectedIds.length === 1) ?
                    prevSelectedIds :
                    [clickedId];
            }
            return newSelection;
        });
        return true;
    } else {
        if (!isMultiSelect && selectedStrokeIdsRef.current.length > 0) {
            setSelectedStrokeIds([]);
            return true;
        }
        return false;
    }
}, [activeLayer, setSelectedStrokeIds, convertStrokeToPixiObject]);

  // Event handlers for mouse and touch events
  const handleMouseDown = useCallback((event) => {
    if (event.button === 1) { // Middle mouse button for panning
      handlePanStart(event);
      return;
    }

    const coords = getCoordinates(event);
    if (!coords) return;

    // Handle ruler interactions first
    if (isRulerActiveOnCanvas && handleRulerMouseDown(event, coords)) {
      return;
    }

    // Handle other tools based on current mode
    if (currentModeRef.current === 'draw') {
      if (activeTool === 'fill') {
        handleFill(coords);
      } else if (activeTool === 'text') {
        if (isTypingText && currentTextInput.trim()) {
          commitText();
        } else {
          setTextInputPosition({ x: coords.offsetX, y: coords.offsetY });
          setIsTypingText(true);
        }
      } else {
        handleDrawingMouseDown(event);
      }
    } else if (currentModeRef.current === 'edit') {
      if (activeEditToolRef.current === 'transform') {
        if (!handleTransformToolMouseDown(event, coords)) {
          if (!handleStrokeSelection(coords, event)) {
            setIsMarqueeSelecting(true);
            marqueeStartPointRef.current = coords;
            marqueeEndPointRef.current = coords;
          }
        }
      }
    }
  }, [
    getCoordinates, isRulerActiveOnCanvas, handleRulerMouseDown,
    activeTool, handleFill, isTypingText, currentTextInput,
    commitText, setTextInputPosition, setIsTypingText,
    handleDrawingMouseDown, handleTransformToolMouseDown, handleStrokeSelection, handlePanStart
  ]);

  const handleMouseMove = useCallback((event) => {
    if (isPanning) {
      handlePanMove(event);
      return;
    }
    
    const coords = getCoordinates(event);
    if (!coords) return;

    // Handle ruler interactions
    if (isDraggingRuler) {
      handleRulerMouseMove(event, coords);
      return;
    }

    // Handle transform tool hover
    if (currentModeRef.current === 'edit' && activeEditToolRef.current === 'transform') {
      handleMouseMoveForHover(coords);
    }

    // Handle other tools based on current mode
    if (currentModeRef.current === 'draw') {
      if (activeTool === 'fill') {
        handleFillPreview(coords);
      }
      if (isDrawing) {
        handleDrawingMouseMove(event);
      }
    } else if (currentModeRef.current === 'edit') {
      if (isTransforming) {
        handleTransformToolMouseMove(event, coords);
      } else if (isMarqueeSelecting) {
        marqueeEndPointRef.current = coords;
        const graphics = marqueeGraphicsRef.current;
        const start = marqueeStartPointRef.current;
        graphics.clear();
        graphics.rect(start.offsetX, start.offsetY, coords.offsetX - start.offsetX, coords.offsetY - start.offsetY)
               .stroke({ width: 1 / zoomLevel, color: 0x0077FF })
               .fill({ color: 0x0077FF, alpha: 0.2 });
      }
    }
  }, [
    getCoordinates, isDraggingRuler, handleRulerMouseMove,
    handleMouseMoveForHover, isDrawing, handleDrawingMouseMove, zoomLevel,
    isTransforming, handleTransformToolMouseMove, isMarqueeSelecting, isPanning, handlePanMove, activeTool, handleFillPreview
  ]);

  const handleMouseUp = useCallback(async () => {
    if (isPanning) {
        handlePanEnd();
    }

    if (isDraggingRuler) {
        handleRulerMouseUp();
    }

    if (isMarqueeSelecting) {
        setIsMarqueeSelecting(false);
        const start = marqueeStartPointRef.current;
        const end = marqueeEndPointRef.current;
        const selectionRect = {
            minX: Math.min(start.offsetX, end.offsetX),
            minY: Math.min(start.offsetY, end.offsetY),
            maxX: Math.max(start.offsetX, end.offsetX),
            maxY: Math.max(start.offsetY, end.offsetY),
        };

        const selectedIds = [];
        for (const stroke of activeStrokes) {
            const pixiObject = await convertStrokeToPixiObject(stroke);
            if (!pixiObject) continue;

            const bounds = pixiObject.getBounds();
            const strokeRect = {
                minX: bounds.x,
                minY: bounds.y,
                maxX: bounds.x + bounds.width,
                maxY: bounds.y + bounds.height
            };

            if (checkRectIntersection(selectionRect, strokeRect)) {
                selectedIds.push(stroke.id);
            }
        }

        setSelectedStrokeIds(selectedIds);
        marqueeGraphicsRef.current.clear();
    }

    if (currentModeRef.current === 'draw' && isDrawing) {
        handleDrawingMouseUp();
    } else if (currentModeRef.current === 'edit' && isTransforming) {
        handleTransformToolMouseUp();
    }
}, [
    isDraggingRuler, handleRulerMouseUp,
    isDrawing, handleDrawingMouseUp,
    isTransforming, handleTransformToolMouseUp, isMarqueeSelecting, activeStrokes, convertStrokeToPixiObject, isPanning, handlePanEnd
]);

  const handleTouchStart = useCallback((event) => {
    if (event.touches.length >= 2) {
      event.preventDefault();
      setIsPinching(true);

      const { distance, midpoint } = calculatePinchZoom(event.touches);

      initialPinchDistanceRef.current = distance;
      initialPinchMidpointRef.current = midpoint;
      initialZoomRef.current = zoomLevel;
      initialOffsetRef.current = { ...offset };
    } else if (event.touches.length === 1) {
       if (event.touches[0].touchType === 'stylus' || activeTool !== 'pan') {
         handleMouseDown(event);
       } else {
         handlePanStart(event);
       }
    }
  }, [calculatePinchZoom, zoomLevel, offset, handleMouseDown, handlePanStart, activeTool]);

  const handleTouchMove = useCallback((event) => {
    if (isPinching && event.touches.length >= 2) {
      event.preventDefault();

      const { distance, midpoint } = calculatePinchZoom(event.touches);
      const zoomFactor = distance / initialPinchDistanceRef.current;
      const newZoom = Math.max(0.1, Math.min(initialZoomRef.current * zoomFactor, 10));

      const initialMidpointOnScreen = initialPinchMidpointRef.current;
      const newMidpointOnScreen = midpoint;

      // Convert initial midpoint to world coordinates
      const worldPointX = (initialMidpointOnScreen.x - initialOffsetRef.current.x) / initialZoomRef.current;
      const worldPointY = (initialMidpointOnScreen.y - initialOffsetRef.current.y) / initialZoomRef.current;

      // Calculate the new offset
      const newOffsetX = newMidpointOnScreen.x - worldPointX * newZoom;
      const newOffsetY = newMidpointOnScreen.y - worldPointY * newZoom;

      setZoomLevel(newZoom);
      setOffset({ x: newOffsetX, y: newOffsetY });

    } else if (event.touches.length === 1) {
      // Continue drawing/panning with one touch
      handleMouseMove(event);
    }
  }, [isPinching, calculatePinchZoom, handleMouseMove, setZoomLevel, setOffset]);

  const handleTouchEnd = useCallback((event) => {
    if (isPinching && event.touches.length < 2) {
      setIsPinching(false);
    }
    if (event.touches.length === 0) {
      // End drawing/panning when no touches remain
      handleMouseUp();
    }
  }, [isPinching, handleMouseUp]);

  const handleMouseLeave = useCallback(() => {
    handleMouseUp();
    clearFillPreview();
  }, [handleMouseUp, clearFillPreview]);

  return (
    <div className="flex-1 relative overflow-hidden">
      <div
        className='w-full h-full'
        ref={pixiContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <TextInputOverlay
          textInputRef={textInputRef}
          isTypingText={isTypingText}
          textInputPosition={textInputPosition}
          currentTextInput={currentTextInput}
          setCurrentTextInput={setCurrentTextInput}
          textProperties={textProperties}
          commitText={commitText}
          handleTextInputKeyDown={handleTextInputKeyDown}
        />
        {isCanvasReady && (
          <RulerOverlay
            rulerGuideProperties={rulerGuideProperties}
            ellipseRulerProperties={ellipseRulerProperties}
            spineRulerProperties={spineRulerProperties}
            mirrorRulerProperties={mirrorRulerProperties}
            isRulerActiveOnCanvas={isRulerActiveOnCanvas}
            activeRulerSubTool={activeRulerSubTool}
            activeTool={activeTool}
            isDrawing={isDrawing}
            isDraggingRuler={isDraggingRuler}
            draggedSpinePointIndex={draggedSpinePointIndex}
          />
        )}
      </div>
    </div>
  );
};

export default PixiCanvasStage;