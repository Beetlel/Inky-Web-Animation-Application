// src/context/LayerContext.js
import { createContext, useContext } from 'react';

export const LayerContext = createContext({
  layers: [],
  activeLayerId: '',
  setActiveLayerId: () => {},
  addLayer: () => {},
  removeLayer: () => {},
  moveLayer: () => {},
  updateLayerProperty: () => {},
});

export const useLayerContext = () => useContext(LayerContext);