// src/Context/ToolStateProvider.jsx

import React, { useState, useCallback } from 'react';

// Import context and all presets/defaults from ToolStateContext.jsx
import ToolStateContext, {
    BRUSH_PRESETS,
    SHAPE_PRESETS,
    TEXT_PRESETS,
    DEFAULT_RULER_GUIDE_PROPERTIES,
    DEFAULT_ELLIPSE_RULER_PROPERTIES,
    DEFAULT_SPINE_RULER_PROPERTIES,
    DEFAULT_MIRROR_RULER_PROPERTIES,
    DEFAULT_FILL_PROPERTIES,
    DEFAULT_TRANSFORM_PROPERTIES, // NEW: Import default transform properties
} from '../context/ToolStateContext'; // <--- CHANGED: Added .jsx extension here
const ToolStateProvider = ({ children }) => {

    // --- NEW: Global Mode State ---
    const [currentMode, setCurrentMode] = useState('draw'); // 'draw', 'edit', 'movie'
    // --- END NEW ---

    const [activeTool, setActiveTool] = useState('brush'); // Default tool for 'draw' mode
    const [lastActiveDrawingTool, setLastActiveDrawingTool] = useState('brush'); // Keep track of the last active drawing tool

    // NEW LOG: Log the currentMode state whenever ToolStateProvider re-renders
    console.log("ToolStateProvider Render: currentMode =", currentMode);

    // Initialize properties using the imported presets and defaults
    const [brushProperties, setBrushProperties] = useState({
        ...BRUSH_PRESETS.pen,
        type: 'pen'
    });
    const [shapeProperties, setShapeProperties] = useState({
        ...SHAPE_PRESETS.line,
        type: 'line'
    });
    const [textProperties, setTextProperties] = useState(TEXT_PRESETS.default);
    const [fillProperties, setFillProperties] = useState(DEFAULT_FILL_PROPERTIES);
    const [rulerGuideProperties, setRulerGuideProperties] = useState(DEFAULT_RULER_GUIDE_PROPERTIES);
    const [ellipseRulerProperties, setEllipseRulerProperties] = useState(DEFAULT_ELLIPSE_RULER_PROPERTIES);
    const [spineRulerProperties, setSpineRulerProperties] = useState(DEFAULT_SPINE_RULER_PROPERTIES);
    const [mirrorRulerProperties, setMirrorRulerProperties] = useState(DEFAULT_MIRROR_RULER_PROPERTIES);
    const [isRulerActiveOnCanvas, setIsRulerActiveOnCanvas] = useState(false);
    const [activeRulerSubTool, setActiveRulerSubTool] = useState('straight');

    const [recentColors, setRecentColors] = useState(['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF']);
    const MAX_RECENT_COLORS = 10;

    // --- NEW: Edit Mode Tool States ---
    const [activeEditTool, setActiveEditToolState] = useState('null'); // Default edit tool
    const [transformProperties, setTransformProperties] = useState(DEFAULT_TRANSFORM_PROPERTIES);
    // --- END NEW ---

    // Handlers for individual property changes (e.g., color, size, opacity)
    const handleBrushPropertyChange = useCallback((key, value) => {
        setBrushProperties(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleShapePropertyChange = useCallback((key, value) => {
        setShapeProperties(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleTextPropertyChange = useCallback((key, value) => {
        setTextProperties(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleFillPropertyChange = useCallback((key, value) => {
        setFillProperties(prev => ({ ...prev, [key]: value }));
    }, []);
    const handleRulerGuidePropertyChange = useCallback((key, value) => {
        setRulerGuideProperties(prev => ({ ...prev, [key]: value }));
    }, []);
    const handleEllipseRulerPropertyChange = useCallback((key, value) => {
        setEllipseRulerProperties(prev => ({ ...prev, [key]: value }));
    }, []);
    const handleSpineRulerPropertyChange = useCallback((key, value) => {

        // Special handling for points array to ensure immutability
        if (key === 'points') {
            setSpineRulerProperties(prev => ({ ...prev, points: value }));
        } else {
            setSpineRulerProperties(prev => ({ ...prev, [key]: value }));
        }
    }, []);

    const handleMirrorRulerPropertyChange = useCallback((key, value) => {
        setMirrorRulerProperties(prev => ({ ...prev, [key]: value }));
    }, []);

    // --- NEW: Handler for Transform Properties ---
    const handleTransformPropertyChange = useCallback((key, value) => {
        setTransformProperties(prev => ({ ...prev, [key]: value }));
    }, []);
    // --- END NEW ---

    // Handlers for changing tool types, applying presets
    const updateBrushProperties = useCallback((brushType) => {
        setBrushProperties({
            ...BRUSH_PRESETS[brushType],
            type: brushType
        });
    }, []);

    const updateShapeProperties = useCallback((shapeType) => {
        setShapeProperties({
            ...SHAPE_PRESETS[shapeType],
            type: shapeType
        });
    }, []);

    // Handlers for Spine Ruler control points
    const addSpineRulerPoint = useCallback((point) => {
        setSpineRulerProperties(prev => ({
            ...prev,
            points: [...prev.points, point]
        }));
    }, []);

    const removeLastSpineRulerPoint = useCallback(() => {
        setSpineRulerProperties(prev => ({
            ...prev,
            points: prev.points.slice(0, -1)
        }));
    }, []);

    const clearSpineRulerPoints = useCallback(() => {
        setSpineRulerProperties(prev => ({
            ...prev,
            points: []
        }));
    }, []);

    // Toggle ruler visibility
    const toggleRulerVisibility = useCallback(() => {
        setIsRulerActiveOnCanvas(prev => !prev);
    }, []);

    // Handle active drawing tool change logic (old setActiveTool)
    const handleActiveToolChange = useCallback((toolName) => {
        if (toolName !== 'ruler') {
            setLastActiveDrawingTool(toolName);
        }
        setActiveTool(toolName);
        if (toolName !== 'ruler') { // If user switches away from the 'ruler' tool category, hide the ruler on canvas
            setIsRulerActiveOnCanvas(false);
        }
    }, []);

    // Add recent color logic
    const addRecentColor = useCallback((color) => {
        setRecentColors(prevColors => {

            // Filter out the color if it already exists to avoid duplicates
            const filteredColors = prevColors.filter(c => c.toLowerCase() !== color.toLowerCase());

            // Add the new color to the beginning of the array
            const newColors = [color, ...filteredColors];
            // Keep only the last MAX_RECENT_COLORS colors
            return newColors.slice(0, MAX_RECENT_COLORS);
        });
    }, []);

    // --- NEW: Unified Mode and Tool Setter ---
    const setModeAndDefaultTool = useCallback((modeName) => {
      console.log('setModeAndDefaultTool called. Changing mode to:', modeName);
        setCurrentMode(modeName);

        // Reset active tool based on the new mode
        if (modeName === 'draw') {
            setActiveTool(lastActiveDrawingTool); // Go back to the last use drawing tool
            setActiveEditToolState(null); // No active edit tool in draw mode
        } else if (modeName === 'edit') {
            setActiveEditToolState('transform'); // Default to transform tool in edit mode
            setActiveTool(null); // No active drawing tool in edit mode
        } else {
            setActiveTool(null);
            setActiveEditToolState(null);
        }
        // Also ensure ruler is hidden if we switch out of draw/ruler mode
        setIsRulerActiveOnCanvas(false);
    }, [lastActiveDrawingTool]);

    // Update activeEditTool state
    const handleActiveEditToolChange = useCallback((toolName) => {
        setActiveEditToolState(toolName);
    }, []);
    // --- END NEW ---

    // The value provided to consumers of this context
    const toolStateContextValue = {

        // Mode State
        currentMode,
        setMode: setModeAndDefaultTool, // Use the unified setter

        // Active Drawing Tool State
        activeTool,
        setActiveTool: handleActiveToolChange,
        lastActiveDrawingTool,

        // Brush Tool Properties
        brushProperties,
        handleBrushPropertyChange,
        updateBrushProperties,

        // Shape Tool Properties
        shapeProperties,
        handleShapePropertyChange,
        updateShapeProperties,

        // Text Tool Properties
        textProperties,
        handleTextPropertyChange,

        // Fill Tool Properties
        fillProperties,
        handleFillPropertyChange,

        // Ruler Tool Properties
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
        toggleRulerVisibility,
        activeRulerSubTool,
        setActiveRulerSubTool,

        // Recent Colors
        recentColors,
        addRecentColor,

        // --- NEW: Expose Edit Mode Tools and Properties ---
        activeEditTool,
        setActiveEditTool: handleActiveEditToolChange,
        transformProperties,
        handleTransformPropertyChange,
        // --- END NEW ---
    };
    return (
        <ToolStateContext.Provider value={toolStateContextValue}>
            {children}
        </ToolStateContext.Provider>
    );
};
export default ToolStateProvider;