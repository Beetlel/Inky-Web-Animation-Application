// src/Context/ToolStateContext.js
import React from "react";

// --- Brush Presets ---
export const BRUSH_PRESETS = {
  pen: { size: 5, opacity: 1, color: "#000000" },
  marker: { size: 10, opacity: 0.7, color: "#FFD700" }, // Gold color
  pencil: { size: 2, opacity: 0.9, color: "#36454F" }, // Charcoal Grey
  airbrush: { size: 20, opacity: 0.2, color: "#00BFFF" }, // Deep Sky Blue
  highlighter: { size: 15, opacity: 0.3, color: "#FFFF00" }, // Yellow
  calligraphy: { size: 8, opacity: 1, color: "#8B4513" }, // Saddle Brown
  eraser: { size: 10, opacity: 1, color: "#FFFFFF" }, // Eraser uses white color
};

// --- Shape Presets ---
export const SHAPE_PRESETS = {
  line: { size: 2, opacity: 1, color: "#000000", fillColor: "transparent" },
  rectangle: {
    size: 2,
    opacity: 1,
    color: "#000000",
    fillColor: "transparent",
  },
  triangle: { size: 2, opacity: 1, color: "#000000", fillColor: "transparent" },
  circle: { size: 2, opacity: 1, color: "#000000", fillColor: "transparent" },
};

// --- Text Presets ---
export const TEXT_PRESETS = {
  default: {
    size: 24,
    fontFamily: "Arial",
    color: "#000000",
    textAlign: "left",
    opacity: 1,
  },
};

// --- Ruler Defaults ---
export const DEFAULT_RULER_GUIDE_PROPERTIES = {
  x: 500, // Center X
  y: 350, // Center Y
  rotation: 0, // Degrees
  length: 500, // Length of the straight ruler line
  snapTolerance: 20, // Pixels
  color: "#0000FF", // Blue
  opacity: 0.8,
};

export const DEFAULT_ELLIPSE_RULER_PROPERTIES = {
  centerX: 500,
  centerY: 350,
  radiusX: 150,
  radiusY: 100,
  rotation: 0,
  opacity: 0.8,
  snapTolerance: 200,
  color: "#FF0000", // Red
};

export const DEFAULT_SPINE_RULER_PROPERTIES = {
  points: [], // Array of {x, y} points
  tension: 0.5, // Catmull-Rom tension (0 to 1)
  lineSize: 2,
  opacity: 0.8,
  snapTolerance: 20,
  color: "#00FF00", // Green
};

export const DEFAULT_MIRROR_RULER_PROPERTIES = {
  x: 500,
  y: 20,
  rotation: 90,
  length: 425,
  axis: "x", // 'x' or 'y'
  lineSize: 2,
  opacity: 0.8,
  snapTolerance: 10,
  color: "#FF00FF", // Magenta
};

export const DEFAULT_FILL_PROPERTIES = {
  color: "#FF0000", // Default fill color
  opacity: 1,
  tolerance: 32, // Color tolerance for bucket fill (0-255)
  gapClosingTolerance: 0, // Gap closing for bucket fill (pixels)
};

// --- NEW: Transform Tool Defaults for Edit Mode ---
export const DEFAULT_TRANSFORM_PROPERTIES = {
  positionX: 0, // X offset from original position
  positionY: 0, // Y offset from original position
  scale: 1, // Scale factor (1 = original size)
  rotation: 0, // Rotation in degrees
  width: 0, // Current width of selected element
  height: 0, // Current height of selected element
};

// Initial Context State (used by ToolStateProvider to initialize its states)
const ToolStateContext = React.createContext({
  // Mode State (Now managed by Provider)
  currentMode: "draw",
  setMode: () => {}, // Placeholder, will be provided by Provider
  // Active Tool State

  activeTool: "brush", // Default drawing tool
  setActiveTool: () => {}, // Placeholder
  // Last Active Drawing Tool (for remembering brush/shape when switching to ruler)

  lastActiveDrawingTool: "brush", // Brush Tool Properties

  brushProperties: BRUSH_PRESETS.pencil,
  handleBrushPropertyChange: () => {},
  updateBrushProperties: () => {}, // Shape Tool Properties

  shapeProperties: SHAPE_PRESETS.line,
  handleShapePropertyChange: () => {},
  updateShapeProperties: () => {}, // Text Tool Properties

  textProperties: TEXT_PRESETS.default,
  handleTextPropertyChange: () => {}, // Fill Tool Properties

  fillProperties: DEFAULT_FILL_PROPERTIES,
  handleFillPropertyChange: () => {}, // Ruler Tool Properties

  rulerGuideProperties: DEFAULT_RULER_GUIDE_PROPERTIES,
  handleRulerGuidePropertyChange: () => {},
  ellipseRulerProperties: DEFAULT_ELLIPSE_RULER_PROPERTIES,
  handleEllipseRulerPropertyChange: () => {},
  spineRulerProperties: DEFAULT_SPINE_RULER_PROPERTIES,
  handleSpineRulerPropertyChange: () => {},
  addSpineRulerPoint: () => {},
  removeLastSpineRulerPoint: () => {},
  clearSpineRulerPoints: () => {},
  mirrorRulerProperties: DEFAULT_MIRROR_RULER_PROPERTIES,
  handleMirrorRulerPropertyChange: () => {},
  isRulerActiveOnCanvas: false,
  toggleRulerVisibility: () => {},
  activeRulerSubTool: "straight",
  setActiveRulerSubTool: () => {}, // Recent Colors

  recentColors: [],
  addRecentColor: () => {}, // --- NEW: Edit Mode Tools and Properties ---
  activeEditTool: "transform", // Default edit tool
  setActiveEditTool: () => {}, // Placeholder
  transformProperties: DEFAULT_TRANSFORM_PROPERTIES,
  handleTransformPropertyChange: () => {},
});
export default ToolStateContext;
