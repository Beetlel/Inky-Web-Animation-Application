import React from 'react';

const DrawingActionsContext = React.createContext({
  // Undo/Redo actions
  undo: () => {},
  redo: () => {},
  canUndo: false,
  canRedo: false,
  
  // Viewport actions
  zoomLevel: 1,
  setZoomLevel: () => {},
  offset: { x: 0, y: 0 },
  setOffset: () => {},
  resetViewport: () => {},

  // Layer operations
  addLayer: () => {},
  deleteLayer: () => {},
  setLayerVisibility: (id, visible) => {},
  setActiveLayer: (id) => {},
  
  // Layer information
  layers: [],
  activeLayerId: '',
});

export default DrawingActionsContext;