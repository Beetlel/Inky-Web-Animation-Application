import React, { useEffect } from 'react';
import { Plus, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';

const FrameComponent = ({
    frames,
    activeFrameIndex,
    goToFrame,
    addFrame,
    onNextFrame,
    onPrevFrame,
    onTogglePlay,
    isPlaying,
    frameRefs
}) => {
    // Clear frameRefs on component unmount or when frames array changes significantly
    useEffect(() => {
        frameRefs.current = frameRefs.current.slice(0, frames.length);
    }, [frames, frameRefs]);

    return (
        <div className="flex flex-col items-center bg-gray-900 rounded-lg shadow-lg">
            {/* Custom Scrollbar Styles for WebKit browsers */}
            <style>{`
                #frame-scrollable-container::-webkit-scrollbar {
                    height: 8px;
                }

                #frame-scrollable-container::-webkit-scrollbar-track {
                    background: #374151;
                    border-radius: 10px;
                }

                #frame-scrollable-container::-webkit-scrollbar-thumb {
                    background: #4B5563;
                    border-radius: 10px;
                }

                /* Handle on hover */
                #frame-scrollable-container::-webkit-scrollbar-thumb:hover {
                    background: #6B7280;
                }
            `}</style>

            {/* Frame Controls */}
          <div className="flex flex-row items-center space-x-2 md:space-x-4 w-full justify-center">
                {/* Playback Buttons Group (LEFT) */}
                <div className="flex flex-col items-center space-y-1 md:space-y-2">
                    <button
                        onClick={onTogglePlay}
                        className="p-1.5 m-1 md:p-2 md:m-2 rounded-full bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors duration-200"
                        title={isPlaying ? "Pause Animation" : "Play Animation"}
                    >
                        {isPlaying ? <Pause className="h-3 w-3 md:h-4 md:w-5 text-white" /> : <Play className="h-3 w-3 md:h-4 md:w-5 text-white" />}
                    </button>
                    <div className="flex space-x-1">
                        <button
                            onClick={onPrevFrame}
                            className="p-1.5 md:p-2 rounded-full bg-gray-600 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors duration-200"
                            title="Previous Frame"
                        >
                            <ChevronLeft className="h-4 w-4 md:h-5 md:w-5 text-white" />
                        </button>
                        <button
                            onClick={onNextFrame}
                            className="p-1.5 md:p-2 rounded-full bg-gray-600 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors duration-200"
                            title="Next Frame"
                        >
                            <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Individual Frames List (CENTER, scrollable with responsive max-width) */}
                <div
                    id="frame-scrollable-container"
                    className="flex overflow-x-auto space-x-2 w-fit max-w-[100px] md:max-w-[300px] lg:max-w-[550px] xl:max-w-[800px] py-1"
                >
                    {frames.map((frame, index) => (
                        <div
                            key={frame.id}
                            ref={el => frameRefs.current[index] = el}
                            className={`flex flex-col items-center pr-1 pl-1 rounded-md cursor-pointer transition-colors duration-200 flex-shrink-0
                                ${index === activeFrameIndex ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                            onClick={() => goToFrame(index)}
                            title={`Go to ${frame.name}`}
                        >
                            {/* UPDATED: Added whitespace-pre-wrap to allow newline */}
                            <div className="text-xs text-gray-300 mb-1 text-center whitespace-pre-wrap">{frame.name}</div>
                            <div className="w-12 h-12 bg-gray-600 rounded flex items-center justify-center text-gray-400 text-sm">
                                {index + 1}
                            </div>
                            {frame.modified && (
                                <div className="absolute bottom-1 right-1 w-2 h-2 bg-yellow-400 rounded-full" title="Frame Modified"></div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Add Frame Button (RIGHT) */}
                <div className="flex flex-col items-center space-y-2">
                    <button
                        onClick={addFrame}
                        className="p-2 m-2 rounded-full bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors duration-200"
                        title="Add New Frame"
                    >
                        <Plus className="h-4 w-5 text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FrameComponent;
