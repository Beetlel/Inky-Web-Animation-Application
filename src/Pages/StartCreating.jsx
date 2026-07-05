import React, { useState } from 'react';
import { ChevronDown, Youtube, Film, Maximize , Instagram, Circle, CircleX,} from 'lucide-react';

const StartCreating = ({ onClose }) => {
    const [projectName, setProjectName] = useState('');
    const [canvasSize, setCanvasSize] = useState('youtube-720p'); // Default to YouTube (720p)
    const [customWidth, setCustomWidth] = useState(1920); // Default custom width
    const [customHeight, setCustomHeight] = useState(1080); // Default custom height
    const [fps, setFps] = useState(12); // Default FPS
    const [showSizeDropdown, setShowSizeDropdown] = useState(false);

    const handleStartCreating = () => {
        console.log({
            projectName,
            canvasSize,
            customWidth: canvasSize === 'custom' ? customWidth : null,
            customHeight: canvasSize === 'custom' ? customHeight : null,
            fps
        });
        // In a real application, you would navigate to the canvas editor
        // and pass these settings as props or context.
        onClose(); // Close the creation modal/page
    };

    
    const handleCancel = () => {
        onClose(); // Simply close the modal without creating anything
    };

    const canvasSizeOptions = [
        { id: 'youtube-720p', name: 'YouTube (720p)', width: 1280, height: 720, icon: <Youtube size={16} /> },
        { id: 'youtube-1080p', name: 'YouTube (1080p)', width: 1920, height: 1080, icon: <Youtube size={16} /> },
        { id: 'instagram-post', name: 'Instagram Post (1:1)', width: 1080, height: 1080, icon: <Instagram size={16} /> }, // Assuming Instagram icon is available from lucide-react (add to imports)
        { id: 'instagram-story', name: 'Instagram Story (9:16)', width: 1080, height: 1920, icon: <Instagram size={16} /> },
        { id: 'hd-tv', name: 'HD TV (16:9)', width: 1280, height: 720, icon: <Film size={16} /> },
        { id: 'full-hd-tv', name: 'Full HD TV (16:9)', width: 1920, height: 1080, icon: <Film size={16} /> },
        { id: 'custom', name: 'Custom', icon: <Maximize size={16} /> },
    ];

    const getSelectedSizeName = () => {
        const selected = canvasSizeOptions.find(opt => opt.id === canvasSize);
        return selected ? selected.name : 'Select Size';
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 md:p-10 bg-gray-900 min-h-screen">
            <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-xl p-6 md:p-8 border border-gray-700">
               
                <h2 className="text-3xl font-extrabold text-blue-400 mb-6 text-center">Start New Project</h2>

                  {/* Close button at top right */}
                <button
                    onClick={handleCancel}
                    className="absolute top-4 text-red-400 hover:text-red-500 transition-colors"
                    title="Cancel"
                >
                    <CircleX size={24} />
                </button>

                {/* Project Name Input */}
                <div className="mb-6">
                    <label htmlFor="projectName" className="block text-gray-300 text-sm font-bold mb-2">
                        Project Name
                    </label>
                    <input
                        type="text"
                        id="projectName"
                        className="shadow appearance-none border border-gray-700 rounded w-full py-3 px-4 bg-gray-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="My Awesome Animation"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                    />
                </div>

                {/* Canvas Size Selector */}
                <div className="mb-6 relative">
                    <label htmlFor="canvasSize" className="block text-gray-300 text-sm font-bold mb-2">
                        Canvas Size
                    </label>
                    <button
                        type="button"
                        onClick={() => setShowSizeDropdown(prev => !prev)}
                        className="flex items-center justify-between w-full py-3 px-4 bg-gray-700 border border-gray-700 rounded-lg text-white text-left hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <span className="flex justify-center items-center">
                            {canvasSizeOptions.find(opt => opt.id === canvasSize)?.icon}
                            <span className="ml-2">{getSelectedSizeName()}</span>
                        </span>
                        <ChevronDown size={20} className="text-gray-400" />
                    </button>
                    {showSizeDropdown && (
                        <div className="absolute z-10 w-full mt-2 bg-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {canvasSizeOptions.map((option) => (
                                <div
                                    key={option.id}
                                    className="flex items-center justify-center px-4 py-2 text-white hover:bg-gray-600 cursor-pointer"
                                    onClick={() => {
                                        setCanvasSize(option.id);
                                        setShowSizeDropdown(false);
                                        if (option.id !== 'custom' && option.width && option.height) {
                                            setCustomWidth(option.width);
                                            setCustomHeight(option.height);
                                        }
                                    }}
                                >
                                    {option.icon}
                                    <span className="flex items-center justify-center ml-2">{option.name}</span>
                                    {option.width && option.height && (
                                        <span className="flex items-center justify-center ml-auto text-gray-400 text-sm">{option.width}x{option.height}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Custom Size Inputs (conditionally rendered) */}
                {canvasSize === 'custom' && (
                    <div className="flex justify-between space-x-4 mb-6">
                        <div className="w-1/2">
                            <label htmlFor="customWidth" className="block text-gray-300 text-sm font-bold mb-2">
                                Width (px)
                            </label>
                            <input
                                type="number"
                                id="customWidth"
                                className="shadow appearance-none border border-gray-700 rounded w-full py-3 px-4 bg-gray-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={customWidth}
                                onChange={(e) => setCustomWidth(Number(e.target.value))}
                                min="1"
                            />
                        </div>
                        <div className="w-1/2">
                            <label htmlFor="customHeight" className="block text-gray-300 text-sm font-bold mb-2">
                                Height (px)
                            </label>
                            <input
                                type="number"
                                id="customHeight"
                                className="shadow appearance-none border border-gray-700 rounded w-full py-3 px-4 bg-gray-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={customHeight}
                                onChange={(e) => setCustomHeight(Number(e.target.value))}
                                min="1"
                            />
                        </div>
                    </div>
                )}

                {/* FPS Input */}
                <div className="mb-8">
                    <label htmlFor="fps" className="block text-gray-300 text-sm font-bold mb-2">
                        Frames Per Second (FPS)
                    </label>
                    <input
                        type="number"
                        id="fps"
                        className="shadow appearance-none border border-gray-700 rounded w-full py-3 px-4 bg-gray-700 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={fps}
                        onChange={(e) => setFps(Number(e.target.value))}
                        min="1"
                        max="60"
                    />
                </div>

                {/* Start Creating Button */}
                <button
                    onClick={handleStartCreating}
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-pink-500 focus:ring-opacity-50"
                >
                    Start Creating
                </button>
            </div>
        </div>
    );
};

export default StartCreating;
