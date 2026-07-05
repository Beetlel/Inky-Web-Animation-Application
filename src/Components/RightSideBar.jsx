import React, { useContext, useState, useCallback, useEffect } from 'react';

import ToolStateContext from '../context/ToolStateContext';
import {
  Eraser, PencilLine, PenTool, SprayCan, Highlighter, Feather,
  Minus, Square, Triangle, Circle, AlignLeft, AlignCenter, AlignRight,
  Ruler, CircleDashed, Spline, Plus, Trash2, XCircle, FlipHorizontal,
  PaintBucket
} from 'lucide-react';


import ColorPickerComponent from './ColorPickerComponent';


const RightSidebar = ({ showUI, selectedStrokeBoundingBox }) => {
  // Destructure properties and handlers from ToolStateContext as provided by ToolStateProvider
  const {
    currentMode, // NEW: Current mode ('draw', 'edit', 'movie')
    activeTool, // Active tool for 'draw' mode
    activeEditTool, // NEW: Active tool for 'edit' mode

    brushProperties,
    handleBrushPropertyChange,
    updateBrushProperties,
    shapeProperties,
    handleShapePropertyChange,
    updateShapeProperties,
    textProperties,
    handleTextPropertyChange,
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
    handleFillPropertyChange = () => console.warn('handleFillPropertyChange not provided by ToolStateContext'), // FIXED: Added default empty function
    isRulerActiveOnCanvas,
    toggleRulerVisibility,
    activeRulerSubTool,
    setActiveRulerSubTool,

    // NEW: Transform tool properties and handler
    transformProperties,
    handleTransformPropertyChange,
  } = useContext(ToolStateContext);

  // State for controlling the visibility of various color pickers
  const [showBrushColorPicker, setShowBrushColorPicker] = useState(false);
  const [showShapeColorPicker, setShowShapeColorPicker] = useState(false);
  const [showShapeFillColorPicker, setShowShapeFillColorPicker] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  // Separate states for ruler color pickers to avoid conflicts
  const [showStraightEllipseRulerColorPicker, setShowStraightEllipseRulerColorPicker] = useState(false);
  const [showSpineRulerColorPicker, setShowSpineRulerColorPicker] = useState(false);
  const [showMirrorRulerColorPicker, setShowMirrorRulerColorPicker] = useState(false);
  const [showFillColorPicker, setShowFillColorPicker] = useState(false);

  /**
   * Universal handler for updating tool properties.
   * It routes the property change to the appropriate specific handler from context.
   * Special handling for 'type' property (which means changing the brush/shape preset).
   */
  const handlePropertyChange = useCallback((toolType, property, value) => {
    switch (toolType) {
      case 'brush':
        if (property === 'type'){ // If changing brush type, use updateBrushProperties
          // This is used to change the brush preset (like from Pen to Marker)
          // and will update all brush properties accordingly
        if (updateBrushProperties) {
          updateBrushProperties(value);
        } else {
          console.error("updateBrushProperties is not defined in ToolStateContext.");
        }
      }
      
      else {//for other brush properties (size, color, opacity)
        if (handleBrushPropertyChange) {
          handleBrushPropertyChange(property, value);
          console.log('RightSidebar: Brush Opacity Changed to:', value); // Add this line
        }
        else{
          console.error("handleBrushPropertyChange is not defined in ToolStateContext.");
        }
      }
        break;
      case 'shape':
        if (property === 'type') { // If changing shape type, use updateShapeProperties
          if (updateShapeProperties) {
            updateShapeProperties(value);
          } else {
            console.error("updateShapeProperties is not defined in ToolStateContext.");
          }
        } else { // For other shape properties (size, color, opacity, fillColor)
          if (handleShapePropertyChange) {
            handleShapePropertyChange(property, value);
          } else {
            console.error("handleShapePropertyChange is not defined in ToolStateContext.");
          }
        }
        break;
      case 'text':
        if (handleTextPropertyChange) {
          handleTextPropertyChange(property, value);
        } else {
          console.error("handleTextPropertyChange is not defined in ToolStateContext.");
        }
        break;
      case 'fill':
        // This check will now always be true because handleFillPropertyChange defaults to a function
        if (handleFillPropertyChange) {
          handleFillPropertyChange(property, value);
        } else {
          // This else block might now be unreachable if default is always set
          console.error("handleFillPropertyChange is not defined in ToolStateContext (fallback).");
        }
        break;
      // NEW: Case for Transform tool properties
      case 'transform':
        if (handleTransformPropertyChange) {
          handleTransformPropertyChange(property, value);
        } else {
          console.error("handleTransformPropertyChange is not defined in ToolStateContext.");
        }
        break;
      default:
        console.warn(`Attempted to change property for unknown toolType: ${toolType}`);
    }
  }, [
    handleBrushPropertyChange, updateBrushProperties,
    handleShapePropertyChange, updateShapeProperties,
    handleTextPropertyChange, handleFillPropertyChange,
    handleTransformPropertyChange
  ]);

  // Specific color change handlers, memoized with useCallback
  const handleBrushColorChange = useCallback((newColor) => {
    handlePropertyChange('brush', 'color', newColor);
  }, [handlePropertyChange]);

  const handleShapeColorChange = useCallback((newColor) => {
    handlePropertyChange('shape', 'color', newColor);
  }, [handlePropertyChange]);

  const handleShapeFillColorChange = useCallback((newColor) => {
    handlePropertyChange('shape', 'fillColor', newColor);
  }, [handlePropertyChange]);

  const handleTextColorChange = useCallback((newColor) => {
    handlePropertyChange('text', 'color', newColor);
  }, [handlePropertyChange]);

  // Consolidated handler for straight and ellipse ruler color
  const handleStraightEllipseRulerColorChange = useCallback((newColor) => {
    if (activeRulerSubTool === 'straight' && handleRulerGuidePropertyChange) {
      handleRulerGuidePropertyChange('color', newColor);
    } else if (activeRulerSubTool === 'ellipse' && handleEllipseRulerPropertyChange) {
      handleEllipseRulerPropertyChange('color', newColor);
    }
  }, [activeRulerSubTool, handleRulerGuidePropertyChange, handleEllipseRulerPropertyChange]);

  const handleSpineRulerColorChange = useCallback((newColor) => {
    if (handleSpineRulerPropertyChange) {
      handleSpineRulerPropertyChange('color', newColor);
    } else {
      console.error("handleSpineRulerPropertyChange is not defined in ToolStateContext.");
    }
  }, [handleSpineRulerPropertyChange]);

  const handleMirrorRulerColorChange = useCallback((newColor) => {
    if (handleMirrorRulerPropertyChange) {
      handleMirrorRulerPropertyChange('color', newColor);
    } else {
      console.error("handleMirrorRulerPropertyChange is not defined in ToolStateContext.");
    }
  }, [handleMirrorRulerPropertyChange]);

  const handleFillColorChange = useCallback((newColor) => {
    handlePropertyChange('fill', 'color', newColor);
  }, [handlePropertyChange]);


  // Data definitions for brush types, shape types, font families, and ruler sub-tools
  const brushTypes = [
    { id: 'pen', name: 'Pen', icon: PencilLine },
    { id: 'marker', name: 'Marker', icon: PenTool },
    { id: 'pencil', name: 'Pencil', icon: PencilLine },
    { id: 'airbrush', name: 'Airbrush', icon: SprayCan },
    { id: 'highlighter', name: 'Highlighter', icon: Highlighter },
    { id: 'calligraphy', name: 'Calligraphy', icon: Feather },
    { id: 'eraser', name: 'Eraser', icon: Eraser },
  ];

  const shapeTypes = [
    { id: 'line', name: 'Line', icon: Minus },
    { id: 'rectangle', name: 'Rectangle', icon: Square },
    { id: 'triangle', name: 'Triangle', icon: Triangle },
    { id: 'circle', name: 'Circle', icon: Circle },
  ];

  const fontFamilies = [
    'Arial', 'Verdana', 'Helvetica', 'Tahoma', 'Trebuchet MS', 'Times New Roman', 'Georgia',
    'Garamond', 'Courier New', 'Brush Script MT', 'Impact', 'Comic Sans MS'
  ];

  const rulerSubTools = [
    { id: 'straight', name: 'Straight', icon: Ruler },
    { id: 'ellipse', name: 'Ellipse/Circle', icon: CircleDashed },
    { id: 'spine', name: 'Spine/Curve', icon: Spline },
    { id: 'mirror', name: 'Mirror', icon: FlipHorizontal },
  ];

   // Effect to update transformProperties in context when selectedStrokeBoundingBox changes
    useEffect(() => {
        if (selectedStrokeBoundingBox) {
            const newPositionX = Math.round(selectedStrokeBoundingBox.minX);
            const newPositionY = Math.round(selectedStrokeBoundingBox.minY);
            const newWidth = Math.round(selectedStrokeBoundingBox.width);
            const newHeight = Math.round(selectedStrokeBoundingBox.height);

            handleTransformPropertyChange('positionX', newPositionX);
            handleTransformPropertyChange('positionY', newPositionY);
            handleTransformPropertyChange('width', newWidth);
            handleTransformPropertyChange('height', newHeight);
            
            console.log('[RightSidebar] Updated transformProperties from selectedStrokeBoundingBox:', selectedStrokeBoundingBox);
        } else {
            if (transformProperties.width !== 0 || transformProperties.height !== 0) {
                handleTransformPropertyChange('positionX', 0);
                handleTransformPropertyChange('positionY', 0);
                handleTransformPropertyChange('width', 0);
                handleTransformPropertyChange('height', 0);
                handleTransformPropertyChange('scale', 1);
                handleTransformPropertyChange('rotation', 0);
                console.log('[RightSidebar] Reset transformProperties due to no selection.');
            }
        }
    }, [selectedStrokeBoundingBox, handleTransformPropertyChange]);



  if (!showUI) return null;

  console.log("RightSidebar: currentMode =", currentMode, "activeTool =", activeTool, "activeEditTool =", activeEditTool);

  return (
    <div id="right-sidebar-scrollable" className='w-64 bg-gray-700 h-full flex flex-col items-center py-4 space-y-2 overflow-y-auto'>
      <h2 className="text-white text-xl font-bold h-fit mb-4">Properties</h2>

      {/* Conditional rendering for DRAW Mode Properties */}
      {currentMode === 'draw' && (
        <>
          {activeTool === 'brush' && (
            <>
              <div className='h-fit flex justify-center flex-col w-full px-4'>
                {/* Brush Color Picker */}
                <div className='h-fit mb-2 relative'>
                  <label htmlFor="brushColor" className="block text-gray-300 h-fit text-sm mb-1">
                    Color:
                    <button
                      type="button"
                      className="m-2 w-6 h-4 cursor-pointer border border-gray-400 rounded"
                      style={{ backgroundColor: brushProperties.color || '#000000' }}
                      onClick={() => setShowBrushColorPicker(!showBrushColorPicker)}
                      title="Choose brush color"
                    />
                  </label>
                  {showBrushColorPicker && (
                    <div className="absolute z-20 top-full left-0 mt-2 p-2 bg-gray-800 rounded shadow-lg">
                      <ColorPickerComponent
                        color={brushProperties.color || '#000000'}
                        onChange={handleBrushColorChange}
                        onClose={() => setShowBrushColorPicker(false)}
                      />
                      <div className="mt-2 text-white text-sm">
                        {brushProperties.color || '#000000'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Brush Size Slider */}
                <div className='h-fit mb-2'>
                  <label htmlFor="brushSize" className="block text-gray-300 text-sm h-fit mb-1">
                    Size: {brushProperties.size || 1}
                  </label>
                  <input
                    type="range"
                    id="brushSize"
                    min="1"
                    max="100"
                    value={brushProperties.size || 1}
                    onChange={(e) => handlePropertyChange('brush', 'size', parseInt(e.target.value))}
                    className="w-full h-2 mb-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm"
                  />
                </div>

                {/* Opacity Slider */}
                <div className='h-fit mb-2'>
                  <label htmlFor="brushOpacity" className="block text-gray-300 h-fit text-sm mb-1">
                    Opacity: {(brushProperties.opacity !== undefined ? (brushProperties.opacity * 100).toFixed(0) : 100)}%
                  </label>
                  <input
                    type="range"
                    id="brushOpacity"
                    min="0"
                    max="1"
                    step="0.01"
                    value={brushProperties.opacity !== undefined ? brushProperties.opacity : 1}
                    onChange={(e) => handlePropertyChange('brush', 'opacity', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm"
                  />
                </div>
              </div>

              {/* Brush Types (Pen, Marker, Eraser, etc.) */}
              <div className="w-full px-4 space-y-2">
                <h3 className="text-gray-300 text-base font-semibold mb-2 h-fit">Brush Type</h3>
                <div className="grid grid-cols-3 gap-2 h-fit">
                  {brushTypes.map((type) => (
                    <button
                      key={type.id}
                      className={`
                        p-2 rounded-md flex flex-col items-center justify-center text-xs
                        ${brushProperties.type === type.id ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}
                      `}
                      onClick={() => handlePropertyChange('brush', 'type', type.id)} // This now correctly uses updateBrushProperties
                      title={type.name}
                    >
                      <type.icon size={20} />
                      <span>{type.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTool === 'shape' && (
            <>
              <div className='h-fit flex justify-center flex-col w-full px-4'>
                {/* Shape Color Picker */}
                <div className='h-fit mb-2 relative'>
                  <label htmlFor="shapeColor" className="block text-gray-300 h-fit text-sm mb-1">
                    Line Color:
                    <button
                      type="button"
                      className="m-2 w-6 h-4 cursor-pointer border border-gray-400 rounded"
                      style={{ backgroundColor: shapeProperties.color || '#000000' }}
                      onClick={() => setShowShapeColorPicker(!showShapeColorPicker)}
                      title="Choose shape line color"
                    />
                  </label>
                  {showShapeColorPicker && (
                    <div className="absolute z-20 top-full left-0 mt-2 p-2 bg-gray-800 rounded shadow-lg">
                      <ColorPickerComponent
                        color={shapeProperties.color || '#000000'}
                        onChange={handleShapeColorChange}
                        onClose={() => setShowShapeColorPicker(false)}
                      />
                      <div className="mt-2 text-white text-sm">
                        {shapeProperties.color || '#000000'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Fill Color Picker (for shapes) */}
                <div className='h-fit mb-2 relative'>
                  <label htmlFor="fillColor" className="block text-gray-300 h-fit text-sm mb-1">
                    Fill Color:
                    <button
                      type="button"
                      className="m-2 w-6 h-4 cursor-pointer border border-gray-400 rounded"
                      style={{ backgroundColor: shapeProperties.fillColor || '#000000' }}
                      onClick={() => setShowShapeFillColorPicker(!showShapeFillColorPicker)}
                      title="Choose shape fill color"
                    />
                  </label>
                  {showShapeFillColorPicker && (
                    <div className="absolute z-20 top-full left-0 mt-2 p-2 bg-gray-800 rounded shadow-lg">
                      <ColorPickerComponent
                        color={shapeProperties.fillColor || '#000000'}
                        onChange={handleShapeFillColorChange}
                        onClose={() => setShowShapeFillColorPicker(false)}
                      />
                      <div className="mt-2 text-white text-sm">
                        {shapeProperties.fillColor || '#000000'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Shape Line Size Slider */}
                <div className='h-fit mb-2'>
                  <label htmlFor="shapeSize" className="block text-gray-300 text-sm h-fit mb-1">
                    Line Size: {shapeProperties.size || 1}
                  </label>
                  <input
                    type="range"
                    id="shapeSize"
                    min="1"
                    max="20"
                    value={shapeProperties.size || 1}
                    onChange={(e) => handlePropertyChange('shape', 'size', parseInt(e.target.value))}
                    className="w-full h-2 mb-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm"
                  />
                </div>

                {/* Shape Opacity Slider */}
                <div className='h-fit mb-2'>
                  <label htmlFor="shapeOpacity" className="block text-gray-300 h-fit text-sm mb-1">
                    Opacity: {(shapeProperties.opacity !== undefined ? (shapeProperties.opacity * 100).toFixed(0) : 100)}%
                  </label>
                  <input
                    type="range"
                    id="shapeOpacity"
                    min="0"
                    max="1"
                    step="0.01"
                    value={shapeProperties.opacity !== undefined ? shapeProperties.opacity : 1}
                    onChange={(e) => handlePropertyChange('shape', 'opacity', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm"
                  />
                </div>
              </div>

              {/* Shape Types (Line, Rectangle, Circle, Triangle) */}
              <div className="w-full px-4 space-y-2">
                <h3 className="text-gray-300 text-base font-semibold mb-2 h-fit">Shape Type</h3>
                <div className="grid grid-cols-2 gap-2 h-fit">
                  {shapeTypes.map((type) => (
                    <button
                      key={type.id}
                      className={`
                        p-2 rounded-md flex flex-col items-center justify-center text-xs
                        ${shapeProperties.type === type.id ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}
                      `}
                      onClick={() => handlePropertyChange('shape', 'type', type.id)} // This now correctly uses updateShapeProperties
                      title={type.name}
                    >
                      <type.icon size={20} />
                      <span>{type.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTool === 'text' && (
            <>
              <div className='h-fit flex justify-center flex-col w-full px-4'>
                {/* Text Color Picker */}
                <div className='h-fit mb-2 relative'>
                  <label htmlFor="textColor" className="block text-gray-300 h-fit text-sm mb-1">
                    Color:
                    <button
                      type="button"
                      className="m-2 w-6 h-4 cursor-pointer border border-gray-400 rounded"
                      style={{ backgroundColor: textProperties.color || '#000000' }}
                      onClick={() => setShowTextColorPicker(!showTextColorPicker)}
                      title="Choose text color"
                    />
                  </label>
                  {showTextColorPicker && (
                    <div className="absolute z-20 top-full left-0 mt-2 p-2 bg-gray-800 rounded shadow-lg">
                      <ColorPickerComponent
                        color={textProperties.color || '#000000'}
                        onChange={handleTextColorChange}
                        onClose={() => setShowTextColorPicker(false)}
                      />
                      <div className="mt-2 text-white text-sm">
                        {textProperties.color || '#000000'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Font Size Slider */}
                <div className='h-fit mb-2'>
                  <label htmlFor="fontSize" className="block text-gray-300 text-sm h-fit mb-1">
                    Font Size: {textProperties.size || 1}px
                  </label>
                  <input
                    type="range"
                    id="fontSize"
                    min="10"
                    max="72"
                    value={textProperties.size || 1}
                    onChange={(e) => handlePropertyChange('text', 'size', parseInt(e.target.value))}
                    className="w-full h-2 mb-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm"
                  />
                </div>

                {/* Font Family Dropdown */}
                <div className='h-fit mb-8'>
                  <label htmlFor="fontFamily" className="block text-gray-300 h-fit text-sm mb-1">
                    Font Family:
                  </label>
                  <select
                    id="fontFamily"
                    value={textProperties.fontFamily || 'Arial'}
                    onChange={(e) => handlePropertyChange('text', 'fontFamily', e.target.value)}
                    className="w-full p-2 bg-gray-600 text-white rounded-md text-sm cursor-pointer"
                    style={{ fontFamily: textProperties.fontFamily }}
                  >
                    {fontFamilies.map((font) => (
                      <option key={font} value={font} style={{ fontFamily: font }}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Text Alignment Buttons */}
                <div className='h-fit mb-8'>
                  <label className="block text-gray-300 h-fit text-sm mb-1">
                    Alignment:
                  </label>
                  <div className="flex justify-around space-x-2">
                    <button
                      className={`p-2 rounded-md ${textProperties.textAlign === 'left' ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                      onClick={() => handlePropertyChange('text', 'textAlign', 'left')}
                      title="Align Left"
                    >
                      <AlignLeft size={20} />
                    </button>
                    <button
                      className={`p-2 rounded-md ${textProperties.textAlign === 'center' ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                      onClick={() => handlePropertyChange('text', 'textAlign', 'center')}
                      title="Align Center"
                    >
                      <AlignCenter size={20} />
                    </button>
                    <button
                      className={`p-2 rounded-md ${textProperties.textAlign === 'right' ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                      onClick={() => handlePropertyChange('text', 'textAlign', 'right')}
                      title="Align Right"
                    >
                      <AlignRight size={20} />
                    </button>
                  </div>
                </div>
                {/* Opacity Slider */}
                <div className='h-fit mb-2'>
                  <label htmlFor="textOpacity" className="block text-gray-300 h-fit text-sm mb-1">
                    Opacity: {(textProperties.opacity !== undefined ? (textProperties.opacity * 100).toFixed(0) : 100)}%
                  </label>
                  <input
                    type="range"
                    id="textOpacity"
                    min="0"
                    max="1"
                    step="0.01"
                    value={textProperties.opacity !== undefined ? textProperties.opacity : 1}
                    onChange={(e) => handlePropertyChange('text', 'opacity', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm"
                  />
                </div>
              </div>
            </>
          )}

          {activeTool === 'ruler' && (
            <>
              <div className='h-fit flex justify-center flex-col w-full px-4'>
                <h3 className="text-white text-lg font-semibold mb-1">Ruler Guide Properties</h3>

                {/* Ruler Activation Button (applies to currently selected sub-tool) */}
                <div className="pt-4 border-t border-gray-700 ">
                  <h3 className="text-gray-300 text-base font-semibold mb-2 h-fit">Toggle Ruler Guide</h3>
                  <div className="grid grid-cols-1 gap-2 h-fit">
                    <button
                      onClick={toggleRulerVisibility}
                      className={`
                        p-2 rounded-md flex flex-col items-center justify-center text-xs
                        ${isRulerActiveOnCanvas ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}
                      `}
                      title={isRulerActiveOnCanvas ? "Deactivate Ruler" : "Activate Ruler"}
                    >
                      {isRulerActiveOnCanvas ? <Ruler size={20} /> : <CircleDashed size={20} />}
                      <span>{isRulerActiveOnCanvas ? `Hide ${rulerSubTools.find(tool => tool.id === activeRulerSubTool)?.name || 'Ruler'}` : `Show ${rulerSubTools.find(tool => tool.id === activeRulerSubTool)?.name || 'Ruler'}`}</span>
                    </button>
                  </div>
                </div>
                {/* Ruler Sub-Tool Selection */}
                <div className="w-full px-4 space-y-2">
                  <h3 className="text-gray-300 text-base font-semibold mb-2 h-fit">Ruler Type</h3>
                  <div className="grid grid-cols-2 gap-2 h-fit">
                    {rulerSubTools.map((type) => (
                      <button
                        key={type.id}
                        className={`
                          p-2 rounded-md flex flex-col items-center justify-center text-xs
                          ${activeRulerSubTool === type.id ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}
                        `}
                        onClick={() => setActiveRulerSubTool(type.id)}
                        title={type.name}
                      >
                        <type.icon size={20} />
                        <span>{type.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Properties for Straight Ruler */}
                {activeRulerSubTool === 'straight' && (
                  <div className="w-full px-4 space-y-2 mt-4">
                    <h4 className="text-gray-300 text-sm font-semibold h-fit">Straight Ruler Settings</h4>
                    <div className='h-fit mb-2'>
                      <label htmlFor="rulerX" className="block text-gray-300 h-fit text-sm mb-1">
                        X Position: {rulerGuideProperties.x}px
                      </label>
                      <input
                        type="range"
                        id="rulerX"
                        min="0"
                        max="1000" // Adjust max according to your canvas width
                        value={rulerGuideProperties.x}
                        onChange={(e) => handleRulerGuidePropertyChange('x', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg"
                      />
                    </div>

                    <div className='h-fit mb-2'>
                      <label htmlFor="rulerY" className="block text-gray-300 h-fit text-sm mb-1">
                        Y Position: {rulerGuideProperties.y}px
                      </label>
                      <input
                        type="range"
                        id="rulerY"
                        min="0"
                        max="700" // Adjust max according to your canvas height
                        value={rulerGuideProperties.y}
                        onChange={(e) => handleRulerGuidePropertyChange('y', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg"
                      />
                    </div>

                    <div className='h-fit mb-2'>
                      <label htmlFor="rulerRotation" className="block text-gray-300 h-fit text-sm mb-1">
                        Rotation: {rulerGuideProperties.rotation}°
                      </label>
                      <input
                        type="range"
                        id="rulerRotation"
                        min="0"
                        max="360"
                        value={rulerGuideProperties.rotation}
                        onChange={(e) => handleRulerGuidePropertyChange('rotation', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg"
                      />
                    </div>

                    <div className='h-fit mb-2'>
                      <label htmlFor="rulerLength" className="block text-gray-300 h-fit text-sm mb-1">
                        Length: {rulerGuideProperties.length}px
                      </label>
                      <input
                        type="range"
                        id="rulerLength"
                        min="50"
                        max="800" // Max length of the visual ruler
                        value={rulerGuideProperties.length}
                        onChange={(e) => handleRulerGuidePropertyChange('length', parseInt(e.target.value))}
                        className="w-full h-2 mb-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg"
                      />
                    </div>

                    <div className='h-fit mb-2'>
                      <label htmlFor="snapTolerance" className="block text-gray-300 h-fit text-sm mb-1">
                        Snap Tolerance: {rulerGuideProperties.snapTolerance}px
                      </label>
                      <input
                        type="range"
                        id="snapTolerance"
                        min="1"
                        max="40"
                        value={rulerGuideProperties.snapTolerance}
                        onChange={(e) => handleRulerGuidePropertyChange('snapTolerance', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg"
                      />
                    </div>

                    <div className='h-fit mb-2 relative'>
                      <label htmlFor="straightRulerColor" className="block text-gray-300 h-fit text-sm mb-1">
                        Color:
                        <button
                          type="button"
                          className="m-2 w-6 h-4 cursor-pointer border border-gray-400 rounded"
                          style={{ backgroundColor: rulerGuideProperties.color || '#FFFFFF' }}
                          onClick={() => setShowStraightEllipseRulerColorPicker(!showStraightEllipseRulerColorPicker)}
                          title="Choose ruler color"
                        />
                      </label>
                      {showStraightEllipseRulerColorPicker && (
                        <div className="absolute z-20 top-full left-0 mt-2 p-2 bg-gray-800 rounded shadow-lg">
                          <ColorPickerComponent
                            color={rulerGuideProperties.color || '#FFFFFF'}
                            onChange={(newColor) => handleRulerGuidePropertyChange('color', newColor)}
                            onClose={() => setShowStraightEllipseRulerColorPicker(false)}
                          />
                          <div className="mt-2 text-white text-sm">
                            {rulerGuideProperties.color || '#FFFFFF'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeRulerSubTool === 'ellipse' && (
                  <div className="w-full px-4 space-y-2 mt-4">
                    <h4 className="text-gray-300 text-sm font-semibold h-fit">Ellipse Ruler Settings</h4>
                    <div className='h-fit mb-2'>
                      <label htmlFor="ellipseCenterX" className="block text-gray-300 h-fit text-sm mb-1">
                        Center X: {ellipseRulerProperties.centerX}px
                      </label>
                      <input
                        type="range"
                        id="ellipseCenterX"
                        min="0"
                        max="1000"
                        value={ellipseRulerProperties.centerX}
                        onChange={(e) => handleEllipseRulerPropertyChange('centerX', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg"
                      />
                    </div>

                    <div className='h-fit mb-2'>
                      <label htmlFor="ellipseCenterY" className="block text-gray-300 h-fit text-sm mb-1">
                        Center Y: {ellipseRulerProperties.centerY}px
                      </label>
                      <input
                        type="range"
                        id="ellipseCenterY"
                        min="0"
                        max="700"
                        value={ellipseRulerProperties.centerY}
                        onChange={(e) => handleEllipseRulerPropertyChange('centerY', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg"
                      />
                    </div>

                    <div className='h-fit mb-2'>
                      <label htmlFor="ellipseRadiusX" className="block text-gray-300 h-fit text-sm mb-1">
                        Radius X: {ellipseRulerProperties.radiusX}px
                      </label>
                      <input
                        type="range"
                        id="ellipseRadiusX"
                        min="10"
                        max="500"
                        value={ellipseRulerProperties.radiusX}
                        onChange={(e) => handleEllipseRulerPropertyChange('radiusX', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg"
                      />
                    </div>

                    <div className='h-fit mb-2'>
                      <label htmlFor="ellipseRadiusY" className="block text-gray-300 h-fit text-sm mb-1">
                        Radius Y: {ellipseRulerProperties.radiusY}px
                      </label>
                      <input
                        type="range"
                        id="ellipseRadiusY"
                        min="10"
                        max="500"
                        value={ellipseRulerProperties.radiusY}
                        onChange={(e) => handleEllipseRulerPropertyChange('radiusY', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg"
                      />
                    </div>

                    <div className='h-fit mb-2'>
                      <label htmlFor="ellipseRotation" className="block text-gray-300 h-fit text-sm mb-1">
                        Rotation: {ellipseRulerProperties.rotation}°
                      </label>
                      <input
                        type="range"
                        id="ellipseRotation"
                        min="0"
                        max="360"
                        value={ellipseRulerProperties.rotation}
                        onChange={(e) => handleEllipseRulerPropertyChange('rotation', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg"
                      />
                    </div>

                    <div className='h-fit mb-2'>
                      <label htmlFor="ellipseOpacity" className="block text-gray-300 h-fit text-sm mb-1">
                        Opacity: {(ellipseRulerProperties.opacity !== undefined ? (ellipseRulerProperties.opacity * 100).toFixed(0) : 100)}%
                      </label>
                      <input
                        type="range"
                        id="ellipseOpacity"
                        min="0"
                        max="1"
                        step="0.01"
                        value={ellipseRulerProperties.opacity !== undefined ? ellipseRulerProperties.opacity : 1}
                        onChange={(e) => handleEllipseRulerPropertyChange('opacity', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg"
                      />
                    </div>

                    <div className='h-fit mb-2'>
                      <label htmlFor="ellipseSnapTolerance" className="block text-gray-300 h-fit text-sm mb-1">
                        Snap Tolerance: {ellipseRulerProperties.snapTolerance}px
                      </label>
                      <input
                        type="range"
                        id="ellipseSnapTolerance"
                        min="50"
                        max="400"
                        value={ellipseRulerProperties.snapTolerance}
                        onChange={(e) => handleEllipseRulerPropertyChange('snapTolerance', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg"
                      />
                    </div>

                    <div className='h-fit mb-2 relative'>
                      <label htmlFor="ellipseColor" className="block text-gray-300 h-fit text-sm mb-1">
                        Color:
                        <button
                          type="button"
                          className="m-2 w-6 h-4 cursor-pointer border border-gray-400 rounded"
                          style={{ backgroundColor: ellipseRulerProperties.color || '#FFFFFF' }}
                          onClick={() => setShowStraightEllipseRulerColorPicker(!showStraightEllipseRulerColorPicker)} // Reusing this state for both straight/ellipse
                          title="Choose ellipse ruler color"
                        />
                      </label>
                      {showStraightEllipseRulerColorPicker && (
                        <div className="absolute z-20 top-full left-0 mt-2 p-2 bg-gray-800 rounded shadow-lg">
                          <ColorPickerComponent
                            color={ellipseRulerProperties.color || '#FFFFFF'}
                            onChange={(newColor) => handleEllipseRulerPropertyChange('color', newColor)}
                            onClose={() => setShowStraightEllipseRulerColorPicker(false)}
                          />
                          <div className="mt-2 text-white text-sm">
                            {ellipseRulerProperties.color || '#FFFFFF'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeRulerSubTool === 'spine' && (
                  <div className="w-full px-4 space-y-2 mt-4">
                    <h4 className="text-gray-300 text-sm font-semibold h-fit">Spine Ruler Settings</h4>
                    <div className='h-fit mb-2 relative'>
                      <label htmlFor="spineColor" className="block text-gray-300 h-fit text-sm mb-1">
                        Color:
                        <button
                          type="button"
                          className="m-2 w-6 h-4 cursor-pointer border border-gray-400 rounded"
                          style={{ backgroundColor: spineRulerProperties.color || '#FFFFFF' }}
                          onClick={() => setShowSpineRulerColorPicker(!showSpineRulerColorPicker)}
                          title="Choose spine ruler color"
                        />
                      </label>
                      {showSpineRulerColorPicker && (
                        <div className="absolute z-20 top-full left-0 mt-2 p-2 bg-gray-800 rounded shadow-lg">
                          <ColorPickerComponent
                            color={spineRulerProperties.color || '#FFFFFF'}
                            onChange={handleSpineRulerColorChange}
                            onClose={() => setShowSpineRulerColorPicker(false)}
                          />
                          <div className="mt-2 text-white text-sm">
                            {spineRulerProperties.color || '#FFFFFF'}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className='h-fit mb-2'>
                      <label htmlFor="spineOpacity" className="block text-gray-300 text-sm h-fit mb-1">
                        Opacity: {(spineRulerProperties.opacity !== undefined ? (spineRulerProperties.opacity * 100).toFixed(0) : 100)}%
                      </label>
                      <input
                        type="range"
                        id="spineOpacity"
                        min="0"
                        max="1"
                        step="0.01"
                        value={spineRulerProperties.opacity !== undefined ? spineRulerProperties.opacity : 1}
                        onChange={(e) => handleSpineRulerPropertyChange('opacity', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm"
                      />
                    </div>
                    <div className='h-fit mb-2'>
                      <label htmlFor="spineTension" className="block text-gray-300 text-sm h-fit mb-1">
                        Tension: {spineRulerProperties.tension.toFixed(2)}
                      </label>
                      <input
                        type="range"
                        id="spineTension"
                        min="0"
                        max="1"
                        step="0.05"
                        value={spineRulerProperties.tension}
                        onChange={(e) => handleSpineRulerPropertyChange('tension', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm"
                      />
                    </div>
                    <div className="flex justify-around space-x-2 mt-4 h-fit">
                      <button
                        className="p-1 h-fit rounded-md bg-green-600 text-white hover:bg-green-700 flex items-center justify-center text-xs"
                        onClick={() => addSpineRulerPoint({ x: 500, y: 300 })}
                        title="Add Point (Click on Canvas)"
                      >
                        <Plus size={16} /> <span className="ml-1">Add Point</span>
                      </button>
                      <button
                        className="p-1 h-fit rounded-md bg-yellow-600 text-white hover:bg-yellow-700 flex items-center justify-center text-xs"
                        onClick={removeLastSpineRulerPoint}
                        title="Remove Last Point"
                      >
                        <Minus size={16} /> <span className="ml-1">Remove Last</span>
                      </button>
                      <button
                        className="p-1 h-fit rounded-md bg-red-600 text-white hover:bg-red-700 flex items-center justify-center text-xs"
                        onClick={clearSpineRulerPoints}
                        title="Clear All Points"
                      >
                        <Trash2 size={16} /> <span className="ml-1">Clear All</span>
                      </button>
                    </div>
                      {spineRulerProperties.points.length > 0 && (
                      <div className="m-2 text-gray-400 text-xs p-0 h-fit">
                        Current Points: {spineRulerProperties.points.length}
                      </div>
                    )}
                    <div className='h-fit mb-2'>
                      <label htmlFor="spineLineSize" className="block text-gray-300 h-fit text-sm mb-1">
                        Line Size: {spineRulerProperties.lineSize || 1}px
                      </label>
                      <input
                        type="range"
                        id="spineLineSize"
                        min="1"
                        max="10"
                        value={spineRulerProperties.lineSize || 1}
                        onChange={(e) => handleSpineRulerPropertyChange('lineSize', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg"
                      />
                    </div>

                    <div className='h-fit mb-2'>
                      <label htmlFor="spineSnapTolerance" className="block text-gray-300 h-fit text-sm mb-1">
                        Snap Tolerance: {spineRulerProperties.snapTolerance}px
                      </label>
                      <input
                        type="range"
                        id="spineSnapTolerance"
                        min="1"
                        max="60"
                        value={spineRulerProperties.snapTolerance}
                        onChange={(e) => handleSpineRulerPropertyChange('snapTolerance', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg"
                      />
                    </div>
                  </div>
                )}

                {activeRulerSubTool === 'mirror' && (
                  <div className="w-full px-4 space-y-2 mt-4">
                    <h4 className="text-gray-300 text-sm font-semibold h-fit">Mirror Ruler Settings</h4>
                    <div className='h-fit mb-2'>
                      <label htmlFor="mirrorX" className="block text-gray-300 h-fit text-sm mb-1">
                        X Position: {mirrorRulerProperties.x}px
                      </label>
                      <input
                        type="range"
                        id="mirrorX"
                        min="0"
                        max="1000" // Assuming canvas width max
                        value={mirrorRulerProperties.x}
                        onChange={(e) => handleMirrorRulerPropertyChange('x', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg"
                      />
                    </div>

                    <div className='h-fit mb-2'>
                      <label htmlFor="mirrorY" className="block text-gray-300 h-fit text-sm mb-1">
                        Y Position: {mirrorRulerProperties.y}px
                      </label>
                      <input
                        type="range"
                        id="mirrorY"
                        min="0"
                        max="700" // Assuming canvas height max
                        value={mirrorRulerProperties.y}
                        onChange={(e) => handleMirrorRulerPropertyChange('y', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg"
                      />
                    </div>

                    <div className='h-fit mb-2'>
                      <label htmlFor="mirrorRotation" className="block text-gray-300 h-fit text-sm mb-1">
                        Rotation: {mirrorRulerProperties.rotation}°
                      </label>
                      <input
                        type="range"
                        id="mirrorRotation"
                        min="0"
                        max="360"
                        value={mirrorRulerProperties.rotation}
                        onChange={(e) => handleMirrorRulerPropertyChange('rotation', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg"
                      />
                    </div>

                    <div className='h-fit mb-2'>
                      <label htmlFor="mirrorLength" className="block text-gray-300 h-fit text-sm mb-1">
                        Length: {mirrorRulerProperties.length}px
                      </label>
                      <input
                        type="range"
                        id="mirrorLength"
                        min="50"
                        max="800"
                        value={mirrorRulerProperties.length}
                        onChange={(e) => handleMirrorRulerPropertyChange('length', parseInt(e.target.value))}
                        className="w-full h-2 mb-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg"
                      />
                    </div>

                    <div className='h-fit mb-2'>
                      <label htmlFor="mirrorAxis" className="block text-gray-300 h-fit text-sm mb-1">
                        Axis:
                      </label>
                      <select
                        id="mirrorAxis"
                        value={mirrorRulerProperties.axis || 'x'}
                        onChange={(e) => handleMirrorRulerPropertyChange('axis', e.target.value)}
                        className="w-full p-2 bg-gray-600 text-white rounded-md text-sm cursor-pointer"
                      >
                        <option value="x">X-axis</option>
                        <option value="y">Y-axis</option>
                      </select>
                    </div>

                    <div className='h-fit mb-2'>
                      <label htmlFor="mirrorSnapTolerance" className="block text-gray-300 h-fit text-sm mb-1">
                        Snap Tolerance: {mirrorRulerProperties.snapTolerance}px
                      </label>
                      <input
                        type="range"
                        id="mirrorSnapTolerance"
                        min="1"
                        max="50"
                        value={mirrorRulerProperties.snapTolerance}
                        onChange={(e) => handleMirrorRulerPropertyChange('snapTolerance', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg"
                      />
                    </div>

                    <div className='h-fit mb-2 relative'>
                      <label htmlFor="mirrorRulerColor" className="block text-gray-300 h-fit text-sm mb-1">
                        Color:
                        <button
                          type="button"
                          className="m-2 w-6 h-4 cursor-pointer border border-gray-400 rounded"
                          style={{ backgroundColor: mirrorRulerProperties.color || '#000000' }}
                          onClick={() => setShowMirrorRulerColorPicker(!showMirrorRulerColorPicker)}
                          title="Choose mirror ruler color"
                        />
                      </label>
                      {showMirrorRulerColorPicker && (
                        <div className="absolute z-20 top-full left-0 mt-2 p-2 bg-gray-800 rounded shadow-lg">
                          <ColorPickerComponent
                            color={mirrorRulerProperties.color || '#000000'}
                            onChange={handleMirrorRulerColorChange}
                            onClose={() => setShowMirrorRulerColorPicker(false)}
                          />
                          <div className="mt-2 text-white text-sm">
                            {mirrorRulerProperties.color || '#000000'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTool === 'fill' && (
            <>
              <div className='h-fit flex justify-center flex-col w-full px-4'>
                <h3 className="text-white text-lg font-semibold mb-2">Fill Properties</h3>
                {/* Fill Color Picker */}
                <div className='h-fit mb-2 relative'>
                  <label htmlFor="fillColor" className="block text-gray-300 h-fit text-sm mb-1">
                    Color:
                    <button
                      type="button"
                      className="m-2 w-6 h-4 cursor-pointer border border-gray-400 rounded"
                      style={{ backgroundColor: fillProperties.color || '#000000' }}
                      onClick={() => setShowFillColorPicker(!showFillColorPicker)}
                      title="Choose fill color"
                    />
                  </label>
                  {showFillColorPicker && (
                    <div className="absolute z-20 top-full left-0 mt-2 p-2 bg-gray-800 rounded shadow-lg">
                      <ColorPickerComponent
                        color={fillProperties.color || '#000000'}
                        onChange={handleFillColorChange}
                        onClose={() => setShowFillColorPicker(false)}
                      />
                      <div className="mt-2 text-white text-sm">
                        {fillProperties.color || '#000000'}
                      </div>
                    </div>
                  )}
                </div>
                {/* Fill Opacity Slider */}
                <div className='h-fit mb-2'>
                  <label htmlFor="fillOpacity" className="block text-gray-300 h-fit text-sm mb-1">
                    Opacity: {(fillProperties.opacity !== undefined ? (fillProperties.opacity * 100).toFixed(0) : 100)}%
                  </label>
                  <input
                    type="range"
                    id="fillOpacity"
                    min="0"
                    max="1"
                    step="0.01"
                    value={fillProperties.opacity !== undefined ? fillProperties.opacity : 1}
                    onChange={(e) => handlePropertyChange('fill', 'opacity', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm"
                  />
                </div>

                {/* Fill Tolerance Slider */}
                <div className='h-fit mb-2'>
                  <label htmlFor="fillTolerance" className="block text-gray-300 h-fit text-sm mb-1">
                    Color Tolerance: {fillProperties.tolerance}
                  </label>
                  <input
                    type="range"
                    id="fillTolerance"
                    min="0"
                    max="255"
                    step="1"
                    value={fillProperties.tolerance}
                    onChange={(e) => handlePropertyChange('fill', 'tolerance', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm"
                  />
                </div>
              </div>
            </>
          )}

          {/* Message for tools without dedicated property panels yet in DRAW mode */}
          {activeTool !== 'brush' && activeTool !== 'shape' && activeTool !== 'text' && activeTool !== 'ruler' && activeTool !== 'fill' && (
            <p className="text-gray-400 text-center text-sm px-4">
              Select a tool from the left sidebar to see its properties.
            </p>
          )}
        </>
      )}

      {/* NEW: Conditional rendering for EDIT Mode Properties */}
      {currentMode === 'edit' && (
        <>
          {activeEditTool === 'transform' && (
            <div className='h-fit flex justify-center flex-col w-full px-4'>
              <h3 className="text-white text-lg font-semibold mb-2">Transform Properties</h3>

                {/* Position X Slider */}
                <div className='h-fit mb-2'>
                  <label htmlFor="transformPositionX" className="block text-gray-300 h-fit text-sm mb-1">
                    Position X: {transformProperties.positionX.toFixed(0)}
                  </label>
                  <input
                    type="range" // Changed to range input
                    id="transformPositionX"
                    min="0" // Set a suitable min value
                    max="1000" // Set a suitable max value (e.g., canvas width)
                    step="1" // Step by 1 pixel
                    value={transformProperties.positionX}
                    onChange={(e) => handlePropertyChange('transform', 'positionX', parseInt(e.target.value) || 0)}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    disabled={!selectedStrokeBoundingBox}
                  />
                </div>

                {/* Position Y Slider */}
                <div className='h-fit mb-2'>
                  <label htmlFor="transformPositionY" className="block text-gray-300 h-fit text-sm mb-1">
                    Position Y: {transformProperties.positionY.toFixed(0)}
                  </label>
                  <input
                    type="range" // Changed to range input
                    id="transformPositionY"
                    min="0" // Set a suitable min value
                    max="800" // Set a suitable max value (e.g., canvas height)
                    step="1" // Step by 1 pixel
                    value={transformProperties.positionY}
                    onChange={(e) => handlePropertyChange('transform', 'positionY', parseInt(e.target.value) || 0)}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    disabled={!selectedStrokeBoundingBox}
                  />
                </div>

              {/* Scale Slider */}
              <div className='h-fit mb-2'>
                <label htmlFor="transformScale" className="block text-gray-300 h-fit text-sm mb-1">
                  Scale: {(transformProperties.scale * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  id="transformScale"
                  min="0.1"
                  max="5"
                  step="0.01"
                  value={transformProperties.scale}
                  onChange={(e) => handlePropertyChange('transform', 'scale', parseFloat(e.target.value))}
                  className="w-full h-2 mb-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm"
                 disabled={!selectedStrokeBoundingBox}
                />
              </div>

     {/* Rotation Slider */}
              <div className='h-fit mb-2'>
                <label htmlFor="transformRotation" className="block text-gray-300 h-fit text-sm mb-1">
                  Rotation: {transformProperties.rotation}°
                </label>
                <input
                  type="range"
                  id="transformRotation"
                  min="-360"
                  max="360"
                  value={transformProperties.rotation}
                  onChange={(e) => handlePropertyChange('transform', 'rotation', parseInt(e.target.value))}
                  className="w-full h-2 mb-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm"
                />
              </div>


              {/* Display Current Width (Read-only, will be updated by canvas interaction) */}
              <div className='h-fit mb-6'>
                <label htmlFor="transformWidth" className="block text-gray-300 h-fit text-sm mb-1">
                  Width: {selectedStrokeBoundingBox ? selectedStrokeBoundingBox.width.toFixed(0) : transformProperties.width}px
                </label>
                <input
                  type="text"
                  id="transformWidth"
                  value={selectedStrokeBoundingBox ? selectedStrokeBoundingBox.width.toFixed(0) : transformProperties.width}
                  readOnly
                  className="w-full p-1 bg-gray-700 border border-gray-600 rounded text-center text-sm cursor-not-allowed text-white"
                />
              </div>

              {/* Display Current Height (Read-only, will be updated by canvas interaction) */}
              <div className='h-fit mb-2'>
                <label htmlFor="transformHeight" className="block text-gray-300 h-fit text-sm mb-1">
                  Height: {selectedStrokeBoundingBox ? selectedStrokeBoundingBox.height.toFixed(0) : transformProperties.height}px
                </label>
                <input
                  type="text"
                  id="transformHeight"
                  value={selectedStrokeBoundingBox ? selectedStrokeBoundingBox.height.toFixed(0) : transformProperties.height}
                  readOnly
                  className="w-full p-1 bg-gray-700 border border-gray-600 rounded text-center text-sm cursor-not-allowed text-white"
                />
              </div>

            </div>
          )}
          {activeEditTool !== 'transform' && (
            <p className="text-gray-400 text-center text-sm px-4">
              Select an edit tool from the left sidebar to see its properties.
            </p>
          )}
        </>
      )}

      {/* Fallback message if no specific tool properties are selected for current mode */}
      {(currentMode !== 'draw' && currentMode !== 'edit') && (
        <p className="text-gray-400 text-center text-sm px-4">
          No properties panel for {currentMode} mode.
        </p>
      )}

      {/* Custom Scrollbar Styles for WebKit browsers */}
      <style>{`
        #right-sidebar-scrollable::-webkit-scrollbar {
          width: 8px;
        }

        #right-sidebar-scrollable::-webkit-scrollbar-track {
          background: #374151;
          border-radius: 10px;
        }

        #right-sidebar-scrollable::-webkit-scrollbar-thumb {
          background: #4B5563;
          border-radius: 10px;
        }

        /* Handle on hover */
        #right-sidebar-scrollable::-webkit-scrollbar-thumb:hover {
          background: #6B7280;
        }
      `}</style>
    </div>
  );
}

export default RightSidebar;