import { Eye, EyeOff, Redo, Undo, Grid, ZoomIn, ZoomOut, Settings } from 'lucide-react';
import React, { useContext, useRef, useState, useEffect } from 'react';
import DrawingActionsContext from '../context/DrawingActionContext';
import ToolStateContext from '../context/ToolStateContext';
import ModeDropdown from './ModeDropDown';

const Topbar = ({ showUI, onToggle }) => {
   const { undo, redo, canUndo, canRedo, resetViewport, showGrid, toggleGrid, zoomLevel, setZoomLevel } = useContext(DrawingActionsContext);
   const { currentMode, setMode } = useContext(ToolStateContext);
   const [settingsDropDown, setSettingsDropDown] = useState(false);
   const settingsRef = useRef(null);

   const handleSettingsToggle = () => {
       setSettingsDropDown(prev => !prev);
   };

   const handleZoomChange = (e) => {
        const newZoom = parseFloat(e.target.value);
        setZoomLevel(newZoom);
    };

     useEffect(() => {
      const handleClickOutside = (event) => {
         if (settingsRef.current && !settingsRef.current.contains(event.target)) {
            setSettingsDropDown(false);
         }
      };
      
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
         document.removeEventListener("mousedown", handleClickOutside);
      };
   }, [settingsRef]);

   return (
     <div className='bg-gray-900 text-white h-[7%] flex items-center justify-between px-1 md:px-2 md:h-12'>
       {/* Undo/Redo Group */}
       <div className='flex items-center space-x-2 md:space-x-4'>
         <button
           onClick={undo}
           disabled={!canUndo}
           className={`p-2 rounded ${!canUndo ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
         >
           <Undo size={16} md:size={20}/>
         </button>
         <button
           onClick={redo}
           disabled={!canRedo}
           className={`p-2 rounded ${!canRedo ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
         >
           <Redo size={16} md:size={20}/>
         </button>
       </div>

       {/* Center Controls Group */}
       <div className='flex items-center space-x-2 md:space-x-4'>
         <ModeDropdown currentMode={currentMode} setMode={setMode} />
         <button
             onClick={toggleGrid}
             className={`p-2 rounded-full ${showGrid ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-500'}`}
             title="Toggle Grid"
         >
            <Grid className="h-4 w-4 md:h-5 md:w-5 text-white" />
         </button>
         
         {/* Zoom Controls: Slider hidden on mobile */}
         <div className="hidden md:flex items-center space-x-1 bg-gray-800 px-2 py-1 rounded">
             <button 
                 onClick={() => setZoomLevel(prev => Math.max(0.1, prev - 0.1))}
                 className="text-white hover:text-gray-300"
                 title="Zoom Out"
             >
                 <ZoomOut size={14} md:size={18} />
             </button>
             <input
                 type="range"
                 min="0.1"
                 max="3"
                 step="0.1"
                 value={zoomLevel}
                 onChange={handleZoomChange}
                 className="w-16 md:w-24 accent-blue-500"
                 title="Zoom Level"
             />
             <button 
                 onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.1))}
                 className="text-white hover:text-gray-300"
                 title="Zoom In"
             >
                 <ZoomIn size={14} md:size={18} />
             </button>
             <span className="hidden md:inline lg:inline text-sm w-12 text-center">
                 {Math.round(zoomLevel * 100)}%
             </span>
         </div>
             
         <button
             onClick={resetViewport}
             className="p-2 bg-blue-500 hover:bg-blue-600 rounded"
             title="Reset Zoom"
         >
             <ZoomIn size={16} md:size={20} />
         </button>
       </div>

      {/* Right Controls Group */}
      <div className='flex items-center space-x-2 md:space-x-4'>
        <button className='p-2' onClick={onToggle} >
            {showUI ? <Eye size={16} md:size={20}/> : <EyeOff size={16} md:size={20}/> }
        </button>
        <div className="relative" ref={settingsRef}>
            <button className='p-2 rounded-full bg-slate-600 hover:bg-slate-500' title='Settings' onClick={handleSettingsToggle}>
               <Settings size={16} md:size={20}/>
            </button>
             {settingsDropDown && (
                <div className="absolute top-12 right-0 mt-2 w-48 bg-gray-800 text-white rounded-lg shadow-xl z-10">
                   <ul className="py-1">
                        <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">Import Image</li>
                        <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">Import Video</li>
                        <hr className="border-gray-600 my-1" />
                        <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">Save as Photo</li>
                        <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">Make Movie</li>
                        <hr className="border-gray-600 my-1" />
                        <li className="px-4 py-2 text-blue-400 hover:bg-gray-700 cursor-pointer">Upgrade to Premium</li>
                        <hr className="border-gray-600 my-1" />
                        <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer">Exit</li>
                   </ul>
                </div>
             )}
        </div>
      </div>
     </div>
   )
}

export default Topbar;