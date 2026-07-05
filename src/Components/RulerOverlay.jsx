// src/Components/RulerOverlay.jsx
import React from 'react';
// FIX: Corrected import path from 'CanvasHelper' to 'canvasHelpers'
import { getCatmullRomSplinePoints } from '../Utils/CanvasHelper'; // Import for rendering spine ruler SVG

/**
 * RulerOverlay Component: Renders the visual representation of various ruler guides on the canvas.
 * This component is primarily for display; interaction logic is handled by useRulerInteractions hook.
 *
 * @param {object} props - Component props.
 * @param {object} props.rulerGuideProperties - Properties for the straight ruler.
 * @param {object} props.ellipseRulerProperties - Properties for the ellipse ruler.
 * @param {object} props.spineRulerProperties - Properties for the spine ruler.
 * @param {object} props.mirrorRulerProperties - Properties for the mirror ruler.
 * @param {boolean} props.isRulerActiveOnCanvas - Indicates if any ruler is currently visible/active.
 * @param {string} props.activeRulerSubTool - The currently active ruler sub-tool ('straight', 'ellipse', 'spine', 'mirror').
 * @param {string} props.activeTool - The currently active main tool (e.g., 'brush', 'ruler').
 * @param {boolean} props.isDrawing - Indicates if a drawing operation is currently in progress.
 * @param {boolean} props.isDraggingRuler - Indicates if a ruler is currently being dragged.
 * @param {number | null} props.draggedSpinePointIndex - Index of the spine control point being dragged.
 */
const RulerOverlay = ({
  rulerGuideProperties,
  ellipseRulerProperties,
  spineRulerProperties,
  mirrorRulerProperties,
  isRulerActiveOnCanvas,
  activeRulerSubTool,
  activeTool,
  isDrawing,
  isDraggingRuler,
  draggedSpinePointIndex,
}) => {
  // Only render if a ruler is active on the canvas
  if (!isRulerActiveOnCanvas) return null;

  // The outer div should generally have pointerEvents: 'none' so that mouse events
  // can pass through to the canvas underneath. Individual interactive ruler elements
  // (when the ruler tool is active) will have pointerEvents: 'auto'.
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Crucial: Always allow events to pass to canvas unless specifically for a ruler handle
        zIndex: 100, // Ensure rulers appear above the canvas content
      }}
    >
      {/* Straight Ruler */}
      {activeRulerSubTool === 'straight' && (
        <div
          key="straight-ruler-guide"
          style={{
            position: 'absolute',
            left: `${rulerGuideProperties.x}px`,
            top: `${rulerGuideProperties.y}px`,
            width: `${rulerGuideProperties.length}px`,
            height: `20px`, // Define a visible and draggable height
            backgroundColor: 'rgba(255, 255, 0, 0.5)',
            border: '1px solid yellow',
            transform: `rotate(${rulerGuideProperties.rotation}deg)`,
            transformOrigin: '0px 0px', // Rotate around the top-left corner
            cursor: (activeTool === 'ruler' && !isDrawing) ? (isDraggingRuler ? 'grabbing' : 'grab') : 'default',
            pointerEvents: (activeTool === 'ruler' && !isDrawing) ? 'auto' : 'none', // Interactive only when ruler tool is active and not drawing
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 5px'
          }}
        >
          {/* Text labels for ruler, ensure they don't block events */}
          <span style={{ color: 'black', fontSize: '8px', pointerEvents: 'none' }}>0</span>
          <span style={{ color: 'black', fontSize: '8px', pointerEvents: 'none' }}>{rulerGuideProperties.length}px</span>
        </div>
      )}

      {/* Ellipse Ruler */}
      {activeRulerSubTool === 'ellipse' && (
        <div
          key="ellipse-ruler-guide"
          style={{
            position: 'absolute',
            // Position the container based on ellipse center, but make it large enough for handles
            left: `${ellipseRulerProperties.centerX - ((ellipseRulerProperties.radiusX * 2) + 100) / 2}px`,
            top: `${ellipseRulerProperties.centerY - ((ellipseRulerProperties.radiusY * 2) + 100) / 2}px`,
            width: `${(ellipseRulerProperties.radiusX * 2) + 100}px`,
            height: `${(ellipseRulerProperties.radiusY * 2) + 100}px`,
            transform: `rotate(${ellipseRulerProperties.rotation}deg)`,
            transformOrigin: 'center center',
            cursor: (activeTool === 'ruler' && !isDrawing) ? (isDraggingRuler ? 'grabbing' : 'grab') : 'default',
            boxSizing: 'border-box',
            pointerEvents: 'none', // This container itself passes events through
          }}
        >
          <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
            {/* Ellipse body - interactive for moving */}
            <ellipse
              cx={((ellipseRulerProperties.radiusX * 2) + 100) / 2}
              cy={((ellipseRulerProperties.radiusY * 2) + 100) / 2}
              rx={ellipseRulerProperties.radiusX}
              ry={ellipseRulerProperties.radiusY}
              stroke="yellow"
              strokeWidth="2"
              fill="rgba(255, 255, 0, 0.2)"
              // Make interactive only when ruler tool is active and not drawing
              style={{ pointerEvents: (activeTool === 'ruler' && !isDrawing) ? 'auto' : 'none' }}
            />
            {/* Handles for resizing/rotating - interactive only when ruler tool is active */}
            {activeTool === 'ruler' && !isDrawing && (
              <>
                <circle cx={((ellipseRulerProperties.radiusX * 2) + 100) / 2 + ellipseRulerProperties.radiusX} cy={((ellipseRulerProperties.radiusY * 2) + 100) / 2} r="10" fill="lime" cursor="ew-resize" style={{ pointerEvents: 'auto' }} />
                <circle cx={((ellipseRulerProperties.radiusX * 2) + 100) / 2 - ellipseRulerProperties.radiusX} cy={((ellipseRulerProperties.radiusY * 2) + 100) / 2} r="10" fill="lime" cursor="ew-resize" style={{ pointerEvents: 'auto' }} />
                <circle cx={((ellipseRulerProperties.radiusX * 2) + 100) / 2} cy={((ellipseRulerProperties.radiusY * 2) + 100) / 2 + ellipseRulerProperties.radiusY} r="10" fill="lime" cursor="ns-resize" style={{ pointerEvents: 'auto' }} />
                <circle cx={((ellipseRulerProperties.radiusX * 2) + 100) / 2} cy={((ellipseRulerProperties.radiusY * 2) + 100) / 2 - ellipseRulerProperties.radiusY} r="10" fill="lime" cursor="ns-resize" style={{ pointerEvents: 'auto' }} />
                <circle
                  cx={((ellipseRulerProperties.radiusX * 2) + 100) / 2 + (Math.max(ellipseRulerProperties.radiusX, ellipseRulerProperties.radiusY) + 50) * Math.cos(0 * Math.PI / 180)}
                  cy={((ellipseRulerProperties.radiusX * 2) + 100) / 2 + (Math.max(ellipseRulerProperties.radiusX, ellipseRulerProperties.radiusY) + 50) * Math.sin(0 * Math.PI / 180)}
                  r="12"
                  fill="orange"
                  cursor="grabbing"
                  style={{ pointerEvents: 'auto' }}
                />
              </>
            )}
          </svg>
        </div>
      )}

      {/* Spine Ruler */}
      {activeRulerSubTool === 'spine' && (
        <div key="spine-ruler-actual-guide" style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none', // Always pass through to canvas
          }}>
            <svg width="100%" height="100%" style={{ overflow: 'visible', pointerEvents: 'none' }}>
                {spineRulerProperties.points.length >= 2 && ( // Need at least 2 points to draw a spline
                  <path
                    d={
                        getCatmullRomSplinePoints(spineRulerProperties.points, spineRulerProperties.tension, 20)
                            .map((p, index) => `${index === 0 ? 'M' : 'L'} ${p.offsetX},${p.offsetY}`)
                            .join(' ')
                    }
                    stroke={spineRulerProperties.color}
                    strokeWidth={spineRulerProperties.lineSize}
                    fill="none"
                    opacity={spineRulerProperties.opacity}
                    style={{ pointerEvents: 'none' }} // Path itself is not interactive
                  />
                )}
                {/* Visual cue for single point if only one exists, as spline needs >=2 points */}
                {spineRulerProperties.points.length === 1 && (
                    <circle
                        cx={spineRulerProperties.points[0].x}
                        cy={spineRulerProperties.points[0].y}
                        r={spineRulerProperties.lineSize * 2} // Small circle for visibility
                        fill={spineRulerProperties.color}
                        opacity={spineRulerProperties.opacity}
                        style={{ pointerEvents: 'none' }}
                    />
                )}
            </svg>

            {/* Control points for dragging */}
            {spineRulerProperties.points.map((point, index) => (
                <div
                    key={`spine-point-${index}`}
                    style={{
                        position: 'absolute',
                        left: `${point.x - 7}px`, // Offset by half of size for centering
                        top: `${point.y - 7}px`,
                        width: '14px',
                        height: '14px',
                        backgroundColor: (activeTool === 'ruler' && draggedSpinePointIndex === index) ? 'red' : 'blue',
                        borderRadius: '50%',
                        border: '2px solid white',
                        cursor: (activeTool === 'ruler' && !isDrawing) ? (isDraggingRuler ? 'grabbing' : 'grab') : 'default',
                        zIndex: 101, // Above the spline path
                        pointerEvents: (activeTool === 'ruler' && !isDrawing) ? 'auto' : 'none', // Interactive only when ruler tool is active
                    }}
                />
            ))}
        </div>
      )}

      {/* Mirror Ruler */}
      {activeRulerSubTool === 'mirror' && (
        <div
          key="mirror-ruler-guide"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none', // Always pass through to canvas
            zIndex: 100,
          }}
        >
          <svg width="100%" height="100%" style={{ overflow: 'visible', pointerEvents: 'none' }}>
            <line
              x1={mirrorRulerProperties.x}
              y1={mirrorRulerProperties.y}
              x2={mirrorRulerProperties.x + mirrorRulerProperties.length * Math.cos(mirrorRulerProperties.rotation * (Math.PI / 180))}
              y2={mirrorRulerProperties.y + mirrorRulerProperties.length * Math.sin(mirrorRulerProperties.rotation * (Math.PI / 180))}
              stroke={mirrorRulerProperties.color}
              strokeWidth={mirrorRulerProperties.lineSize}
              opacity={mirrorRulerProperties.opacity}
              strokeDasharray="5 5" // Dashed line for mirror
              style={{ pointerEvents: 'none' }} // Line itself is not interactive
            />
            {/* Arrowhead to indicate direction/reflection plane */}
            <path
              d={`M ${mirrorRulerProperties.x + 10 * Math.cos(mirrorRulerProperties.rotation * (Math.PI / 180) + Math.PI / 2)},${mirrorRulerProperties.y + 10 * Math.sin(mirrorRulerProperties.rotation * (Math.PI / 180) + Math.PI / 2)} L ${mirrorRulerProperties.x + 10 * Math.cos(mirrorRulerProperties.rotation * (Math.PI / 180) + Math.PI / 2) + 15 * Math.cos(mirrorRulerProperties.rotation * (Math.PI / 180) + Math.PI / 2 - Math.PI / 4)},${mirrorRulerProperties.y + 10 * Math.sin(mirrorRulerProperties.rotation * (Math.PI / 180) + Math.PI / 2) + 15 * Math.sin(mirrorRulerProperties.rotation * (Math.PI / 180) + Math.PI / 2 - Math.PI / 4)} L ${mirrorRulerProperties.x + 10 * Math.cos(mirrorRulerProperties.rotation * (Math.PI / 180) + Math.PI / 2) + 15 * Math.cos(mirrorRulerProperties.rotation * (Math.PI / 180) + Math.PI / 2 + Math.PI / 4)},${mirrorRulerProperties.y + 10 * Math.sin(mirrorRulerProperties.rotation * (Math.PI / 180) + Math.PI / 2) + 15 * Math.sin(mirrorRulerProperties.rotation * (Math.PI / 180) + Math.PI / 2 + Math.PI / 4)} Z`}
              fill={mirrorRulerProperties.color}
              opacity={mirrorRulerProperties.opacity}
              style={{ pointerEvents: 'none' }}
            />
          </svg>
          {/* Invisible draggable area around the mirror line */}
          <div
            style={{
              position: 'absolute',
              left: `${mirrorRulerProperties.x - 15}px`, // Extend hit area
              top: `${mirrorRulerProperties.y - 15}px`, // Extend hit area
              width: `${mirrorRulerProperties.length + 30}px`,
              height: '30px',
              backgroundColor: 'rgba(255, 255, 255, 0.0)', // Fully transparent
              transform: `rotate(${mirrorRulerProperties.rotation}deg)`,
              transformOrigin: '15px 15px', // Adjust origin to match visual line
              cursor: (activeTool === 'ruler' && !isDrawing) ? (isDraggingRuler ? 'grabbing' : 'grab') : 'default',
              zIndex: 101, // Above the SVG line
              pointerEvents: (activeTool === 'ruler' && !isDrawing) ? 'auto' : 'none', // Interactive only when ruler tool is active
            }}
          />
        </div>
      )}
    </div>
  );
};

export default RulerOverlay;
