// src/Hooks/usePixiSetup.js
import { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';

const usePixiSetup = (
  containerRef,
  appRef,
  setIsCanvasReady,
  width,
  height
) => {
  useEffect(() => {
    const initPixi = async () => {
      if (!containerRef.current || appRef.current) return;

      try {
        // Create Pixi Application
        const app = new Application();
        await app.init({
          width,
          height,
          background: 0xf0f0f0, // Light gray background
          antialias: true,
          autoDensity: true,
          resolution: window.devicePixelRatio || 1,
        });

        // Add the canvas to the DOM
        containerRef.current.appendChild(app.canvas);
        appRef.current = app;

        // Set up main container structure
        const mainContainer = new Container();
        app.stage.addChild(mainContainer);
        
        // Grid layer
        const gridLayer = new Container();
        mainContainer.addChild(gridLayer);
        app.stage.gridLayer = gridLayer;
        
        // Drawing layers container
        const drawingLayers = new Container();
        mainContainer.addChild(drawingLayers);
        app.stage.drawingLayers = drawingLayers;
        
        // Temporary drawing layer (for current stroke)
        const tempLayer = new Graphics();
        mainContainer.addChild(tempLayer);
        app.stage.tempLayer = tempLayer;
        
        // Overlay layer (rulers, guides, etc.)
        const overlayLayer = new Container();
        mainContainer.addChild(overlayLayer);
        app.stage.overlayLayer = overlayLayer;

        // Set up main container for transformations
        app.stage.mainContainer = mainContainer;

        setIsCanvasReady(true);
        console.log('Pixi.js application initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Pixi.js:', error);
      }
    };

    initPixi();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, [containerRef, appRef, setIsCanvasReady, width, height]);
};

// Add to usePixiSetup hook or PixiCanvasStage component
useEffect(() => {
  if (!containerRef.current || !pixiAppRef.current) return;

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      if (pixiAppRef.current) {
        pixiAppRef.current.renderer.resize(width, height);
        
        // Update any layers or elements that need to match the new size
        if (pixiAppRef.current.stage.gridLayer) {
          // Redraw grid if needed
        }
      }
    }
  });

  resizeObserver.observe(containerRef.current);

  return () => {
    resizeObserver.disconnect();
  };
}, [containerRef, pixiAppRef]);

export default usePixiSetup;