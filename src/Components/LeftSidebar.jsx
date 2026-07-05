// src/Components/LeftSidebar.jsx
import React, { useContext } from 'react';
import ToolStateContext from '../context/ToolStateContext';
import { Brush, Square, Type, Ruler, PaintBucket, Move } from 'lucide-react';
import Tooltip from './ToolTips';

const LeftSidebar = ({ showUI }) => {
  const {
    currentMode,
    activeTool,
    setActiveTool,
    activeEditTool,
    setActiveEditTool,
  } = useContext(ToolStateContext);

  if (!showUI) return null;

  const drawTools = [
    { id: 'brush', name: 'Brush', icon: Brush },
    { id: 'shape', name: 'Shape', icon: Square },
    { id: 'text', name: 'Text', icon: Type },
    { id: 'ruler', name: 'Ruler', icon: Ruler },
    { id: 'fill', name: 'Fill', icon: PaintBucket },
  ];

  const editTools = [
    { id: 'transform', name: 'Transform', icon: Move },
  ];

  const displayedTools = currentMode === 'draw' ? drawTools :
                         currentMode === 'edit' ? editTools :
                         [];

  return (
    // --- START OF CHANGES ---
    <div className='left-sidebar-landscape w-16 bg-gray-700 h-fit rounded-xl flex flex-col items-center py-2 space-y-2 shadow-lg'>
    {/* --- END OF CHANGES --- */}
      {displayedTools.map((tool) => {
        const Icon = tool.icon;
        const isActive = currentMode === 'draw' ? (activeTool === tool.id) :
                         currentMode === 'edit' ? (activeEditTool === tool.id) :
                         false;

        return (
          <Tooltip key={tool.id} text={tool.name}>
            <button
              onClick={() => {
                if (currentMode === 'draw') {
                  setActiveTool(tool.id);
                } else if (currentMode === 'edit') {
                  setActiveEditTool(tool.id);
                }
              }}
              className={`mb-2
                w-12 h-12 rounded-lg flex items-center justify-center
                ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}
                transition-colors duration-200
              `}
            >
              <Icon size={24} />
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
};

export default LeftSidebar;