import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Layers, Play, Pause, ChevronLeft, ChevronRight, Plus, Eye, EyeOff, Settings, Trash2, Copy, ChevronsRight, ChevronsLeft, ClipboardPaste, Volume2 } from 'lucide-react';
import FrameComponent from './FrameComponent';
import AudioMixer from './AudioMixer'; // IMPORT AudioMixer here (replaces AudioComponent)

const TimeLinebar = ({
    showUI,
    onToggleLayerPanel,
    onAddFrame,
    onAddFrameAtPosition,
    onNextFrame,
    onPrevFrame,
    onTogglePlay,
    isPlaying,
    activeFrameIndex,
    totalFrames, // NEW: Receive totalFrames here
    frames,
    goToFrame: originalGoToFrame,
    deleteFrame,
    copyFrame,
    pasteFrame,
    copiedFrame,
    onionSkinEnabled,
    setOnionSkinEnabled,
    onionSkinPrevCount,
    setOnionSkinPrevCount,
    onionSkinNextCount,
    setOnionSkinNextCount,
    onionSkinOpacity,
    setOnionSkinOpacity,
    // Audio component props received from InkyEngine
    showAudioComponent,
    onToggleAudioComponent,
    allAudioTracks, // Received from InkyEngine
    setAllAudioTracks, // Received from InkyEngine
    ensureFramesMatchAudioDuration, // Received from InkyEngine
    masterVolume, // Received from InkyEngine
    onMasterVolumeChange // Received from InkyEngine
}) => {
    const [showOnionSkinSettings, setShowOnionSkinSettings] = useState(false);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, frameIndex: null });
    const contextMenuRef = useRef(null);
    const frameRefs = useRef([]);

    // Close context menu if clicked outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
                setContextMenu({ visible: false, x: 0, y: 0, frameIndex: null });
            }
        };
        if (contextMenu.visible) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [contextMenu.visible]);

    // Handle single click to activate frame, and second click for context menu
    const handleFrameClick = useCallback((index) => {
        if (isPlaying) return; // Ignore clicks while playing
        setContextMenu({ visible: false, x: 0, y: 0, frameIndex: null });

        if (activeFrameIndex === index) {
            setContextMenu({
                visible: true,
                x: 0, // Position will be determined by CSS transform
                y: 0, // Position will be determined by CSS transform
                frameIndex: index
            });
        } else {
            originalGoToFrame(index);
        }
    }, [activeFrameIndex, originalGoToFrame, isPlaying]);

    const handleContextMenuAction = (action) => {
        const frameIdx = contextMenu.frameIndex;
        if (frameIdx === null) return;

        switch (action) {
            case 'delete':
                deleteFrame(frameIdx);
                break;
            case 'copy':
                copyFrame(frameIdx);
                break;
            case 'paste':
                pasteFrame(frameIdx);
                break;
            case 'pasteForward':
                copyFrame(frameIdx);
                pasteFrame(frameIdx + 1);
                break;
            case 'pasteBackward':
                copyFrame(frameIdx);
                pasteFrame(frameIdx);
                break;
            case 'addFrameForward':
                onAddFrameAtPosition(frameIdx + 1);
                break;
            case 'addFrameBackward':
                onAddFrameAtPosition(frameIdx);
                break;
            default:
                break;
        }
        setContextMenu({ visible: false, x: 0, y: 0, frameIndex: null });
    };

    if (!showUI) return null;

    return (
        <div className="relative w-full h-24 bg-gray-900 text-white flex items-center justify-center px-4 z-50">
            {/* --- START OF CHANGES --- */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col space-y-1 md:left-4">
                {/* Layer Panel Toggle Button */}
                <button
                    onClick={onToggleLayerPanel}
                    className="p-2 md:p-3 w-fit rounded-full bg-gray-600 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors duration-200"
                    title="Toggle Layers Panel"
                >
                    <Layers className="h-4 w-4 md:h-5 md:w-6 text-white" />
                </button>

                {/* Horizontal group for Onion Skin and Audio buttons */}
                <div className="flex flex-row space-x-1 md:space-x-2">
                    {/* Onion Skin Settings Toggle Button */}
                    <button
                        onClick={() => setShowOnionSkinSettings(prev => !prev)}
                        className={`p-2 md:p-3 rounded-full ${onionSkinEnabled ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-600 hover:bg-gray-500'} focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors duration-200`}
                        title="Toggle Onion Skin Settings"
                    >
                        {onionSkinEnabled ? <Eye className="h-4 w-4 md:h-5 md:w-6 text-white" /> : <EyeOff className="h-4 w-4 md:h-5 md:w-6 text-gray-400" />}
                    </button>

                    {/* Audio Component Toggle Button */}
                    <button
                        onClick={onToggleAudioComponent}
                        className={`p-2 md:p-3 rounded-full ${showAudioComponent ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-500'} focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors duration-200`}
                        title="Toggle Audio Settings"
                    >
                        <Volume2 className="h-4 w-4 md:h-5 md:w-6 text-white" />
                    </button>
                </div>
            </div>
            {/* --- END OF CHANGES --- */}

            <FrameComponent
                frames={frames}
                activeFrameIndex={activeFrameIndex}
                goToFrame={handleFrameClick}
                addFrame={onAddFrame}
                onNextFrame={onNextFrame}
                onPrevFrame={onPrevFrame}
                onTogglePlay={onTogglePlay}
                isPlaying={isPlaying}
                frameRefs={frameRefs}
            />

            {/* Right Controls: Adjust spacing for mobile */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-auto md:right-4 md:w-[72px] h-full flex items-center justify-center">
                 {/* This empty div is adjusted for mobile, or you can place the add frame button here for mobile */}
            </div>

            {/* Onion Skin Settings Pop-up */}
            {showOnionSkinSettings && (
                <div className="absolute bottom-full left-1/2 h-fit mb-2 p-4 bg-gray-800 rounded-lg shadow-xl text-sm z-50 flex flex-col space-y-2 transform -translate-x-1/2">
                    <div className="flex items-center justify-between">
                        <label className="mr-2">Enable Onion Skin:</label>
                        <input
                            type="checkbox"
                            checked={onionSkinEnabled}
                            onChange={(e) => setOnionSkinEnabled(e.target.checked)}
                            className="form-checkbox h-4 w-4 text-indigo-500 rounded border-gray-600 bg-gray-700"
                        />
                    </div>
                    {onionSkinEnabled && (
                        <>
                            <div className="flex items-center justify-between">
                                <label className="mr-2">Opacity:</label>
                                <input
                                    type="range"
                                    min="0.05"
                                    max="0.5"
                                    step="0.01"
                                    value={onionSkinOpacity}
                                    onChange={(e) => setOnionSkinOpacity(parseFloat(e.target.value))}
                                    className="w-24 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:shadow-md"
                                />
                                <span className="ml-2 w-8 text-right">{(onionSkinOpacity * 100).toFixed(0)}%</span>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Context Menu Pop-up */}
            {contextMenu.visible && (
                <div
                    ref={contextMenuRef}
                    className="absolute bottom-full left-1/2 h-fit mb-2 p-4 bg-gray-700 rounded-lg shadow-xl py-1 z-50 min-w-[150px] transform -translate-x-1/2"
                >
                    <ul className="text-sm flex flex-col">
                        <li className="px-4 py-2 hover:bg-gray-600 cursor-pointer flex items-center" onClick={() => handleContextMenuAction('delete')}>
                            <Trash2 className="w-4 h-4 mr-2 text-red-300" /> Delete Frame
                        </li>
                        <li className="px-4 py-2 hover:bg-gray-600 cursor-pointer flex items-center" onClick={() => handleContextMenuAction('copy')}>
                            <Copy className="w-4 h-4 mr-2 text-blue-300" /> Copy Frame
                        </li>
                        {copiedFrame && (
                            <>
                                <li className="px-4 py-2 hover:bg-gray-600 cursor-pointer flex items-center" onClick={() => handleContextMenuAction('paste')}>
                                    <ClipboardPaste className="w-4 h-4 mr-2 text-yellow-300" /> Paste
                                </li>
                                <hr className="border-gray-600 my-1" />
                                <li className="px-4 py-2 hover:bg-gray-600 cursor-pointer flex items-center" onClick={() => handleContextMenuAction('pasteForward')}>
                                    <ChevronsRight className="w-4 h-4 mr-2 text-green-300" /> Duplicate Forward
                                </li>
                                <li className="px-4 py-2 hover:bg-gray-600 cursor-pointer flex items-center" onClick={() => handleContextMenuAction('pasteBackward')}>
                                    <ChevronsLeft className="w-4 h-4 mr-2 text-green-300" /> Duplicate Backward
                                </li>
                            </>
                        )}
                        <hr className="border-gray-600 my-1" />
                        <li className="px-4 py-2 hover:bg-gray-600 cursor-pointer flex items-center" onClick={() => handleContextMenuAction('addFrameForward')}>
                            <Plus className="w-4 h-4 mr-2 text-purple-300" /> Add Frame Forward
                        </li>
                        <li className="px-4 py-2 hover:bg-gray-600 cursor-pointer flex items-center" onClick={() => handleContextMenuAction('addFrameBackward')}>
                            <Plus className="w-4 h-4 mr-2 text-purple-300" /> Add Frame Backward
                        </li>
                    </ul>
                </div>
            )}

            {/* NEW: Audio Mixer Pop-up - Rendered conditionally here */}
            {showAudioComponent && (
                <div className="absolute bottom-full left-1/2 h-fit mb-2 p-4 z-50 transform -translate-x-1/2">
                    <AudioMixer 
                        allAudioTracks={allAudioTracks}
                        setAllAudioTracks={setAllAudioTracks}
                        ensureFramesMatchAudioDuration={ensureFramesMatchAudioDuration}
                        masterVolume={masterVolume}
                        onMasterVolumeChange={onMasterVolumeChange}
                        activeFrameIndex={activeFrameIndex}
                        isPlaying={isPlaying}
                        totalFrames={totalFrames} 
                    />
                </div>
            )}
        </div>
    );
};

export default TimeLinebar;