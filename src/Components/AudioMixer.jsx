import React, { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Volume2, VolumeX, Lock, Unlock, XCircle, Loader } from 'lucide-react';
import { generateWaveform } from '../Utils/AudioProcessingUtils'; // Import the waveform generation utility
import AudioWaveform from './AudioWaveform'; // Import the new component

const AudioMixer = ({ 
    allAudioTracks, 
    setAllAudioTracks, 
    ensureFramesMatchAudioDuration, 
    masterVolume, 
    onMasterVolumeChange,
    activeFrameIndex, 
    isPlaying,
    totalFrames 
}) => {
    // --- Timeline settings (moved to top for proper initialization) ---
    const framesPerSecond = 12; // 12 frames per second (from InkyEngine)
    const pixelsPerSecond = 240; // Increased to make frames wider (240px / 12fps = 20px per frame)
    const pixelsPerFrame = pixelsPerSecond / framesPerSecond; // Width of one frame clip
    // --- End Timeline settings ---

    const fileInputRef = useRef(null);
    const currentEditRef = useRef({ trackIndex: null, activeFrameIndex: null }); 
    const [isProcessingFile, setIsProcessingFile] = useState(false);

    // Ref for the main scrollable timeline content area
    const timelineScrollableRef = useRef(null);
    // State to store the calculated height of the playback line
    const [playbackLineHeight, setPlaybackLineHeight] = useState(0);

    // Ensure there are always 7 audio tracks. This is crucial for rendering all slots.
    const audioTracks = useMemo(() => {
        const defaultTracks = Array.from({ length: 7 }, (_, i) => ({
            id: `track-${i}`,
            clips: [],
            muted: false,
            locked: false,
        }));
        return [...allAudioTracks, ...defaultTracks.slice(allAudioTracks.length)].slice(0, 7);
    }, [allAudioTracks]);
    
    const calculateMaxDuration = useCallback((tracks) => {
        let max = 0;
        tracks.forEach(track => {
            track.clips.forEach(clip => {
                const clipEnd = clip.startTime + clip.duration;
                max = Math.max(max, clipEnd);
            });
        });
        return max;
    }, []);

    useEffect(() => {
        audioTracks.forEach(track => {
            track.clips.forEach(clip => {
                if (clip.audioElement) {
                    clip.audioElement.volume = track.muted ? 0 : masterVolume;
                }
            });
        });
    }, [masterVolume, audioTracks]);

    useEffect(() => {
        const newMaxDuration = calculateMaxDuration(audioTracks);
        ensureFramesMatchAudioDuration(newMaxDuration);
    }, [audioTracks, ensureFramesMatchAudioDuration, calculateMaxDuration]);

    const handleAddAudioClick = useCallback((trackIndex) => {
        currentEditRef.current = { trackIndex, activeFrameIndex }; 
        fileInputRef.current.click();
    }, [activeFrameIndex]);

    // UPDATED handleFileChange to generate waveforms
    const handleFileChange = useCallback((event) => {
        const file = event.target.files[0];
        const { trackIndex, activeFrameIndex: startFrameIndex } = currentEditRef.current; 
        event.target.value = ''; 

        if (!file || trackIndex === null || startFrameIndex === null || isProcessingFile) {
            return;
        }

        setIsProcessingFile(true);
        const newAudioElement = new Audio(URL.createObjectURL(file));
        newAudioElement.volume = masterVolume;

        const loadingClipId = `loading-${Date.now()}`;
        
        // Add a temporary loading clip to the UI immediately
        setAllAudioTracks(prev => {
            const updatedTracks = [...prev];
            while (updatedTracks.length <= trackIndex) {
                updatedTracks.push({ id: `track-${updatedTracks.length}`, clips: [], muted: false, locked: false });
            }
            const targetTrack = { ...updatedTracks[trackIndex] };
            
            const loadingClip = {
                id: loadingClipId,
                name: file.name,
                startTime: startFrameIndex / framesPerSecond, 
                duration: 0, // Duration is unknown yet
                isLoading: true,
                isGeneratingWaveform: true,
                waveformPeaks: [],
            };
            
            targetTrack.clips = [...targetTrack.clips, loadingClip];
            updatedTracks[trackIndex] = targetTrack;
            return updatedTracks;
        });

        newAudioElement.onloadedmetadata = async () => {
            const duration = newAudioElement.duration;
            const startTime = startFrameIndex / framesPerSecond;
            const waveformWidth = duration * pixelsPerSecond;

            // Generate the waveform data
            const waveformPeaks = await generateWaveform(file, waveformWidth);

            setAllAudioTracks(prev => {
                const updatedTracks = [...prev];
                const targetTrack = { ...updatedTracks[trackIndex] };
                
                // Find and replace the loading clip with the final clip data
                const clipIndex = targetTrack.clips.findIndex(c => c.id === loadingClipId);
                if (clipIndex !== -1) {
                    const finalClip = {
                        id: `${file.name}-${Date.now()}`,
                        name: file.name,
                        file,
                        audioElement: newAudioElement,
                        duration,
                        startTime,
                        isLoading: false,
                        isGeneratingWaveform: false,
                        waveformPeaks,
                    };
                    const updatedClips = [...targetTrack.clips];
                    updatedClips[clipIndex] = finalClip;
                    targetTrack.clips = updatedClips;
                    updatedTracks[trackIndex] = targetTrack;
                }
                
                setIsProcessingFile(false);
                return updatedTracks;
            });
        };

        newAudioElement.onerror = (e) => {
            console.error("Audio load error:", e);
            // Remove the loading clip on error
            setAllAudioTracks(prev => {
                const updatedTracks = [...prev];
                const targetTrack = { ...updatedTracks[trackIndex] };
                targetTrack.clips = targetTrack.clips.filter(clip => clip.id !== loadingClipId);
                updatedTracks[trackIndex] = targetTrack;
                setIsProcessingFile(false);
                return updatedTracks;
            });
        };
    }, [masterVolume, setAllAudioTracks, isProcessingFile, framesPerSecond, pixelsPerSecond]);


    const handleToggleMute = useCallback((trackIndex) => {
        setAllAudioTracks(prev => prev.map((track, idx) => {
            if (idx === trackIndex) {
                const muted = !track.muted;
                track.clips.forEach(clip => {
                    if (clip.audioElement) {
                        clip.audioElement.muted = muted;
                    }
                });
                return { ...track, muted };
            }
            return track;
        }));
    }, [setAllAudioTracks]);

    const handleToggleLock = useCallback((trackIndex) => {
        setAllAudioTracks(prev => prev.map((track, idx) => 
            idx === trackIndex ? { ...track, locked: !track.locked } : track
        ));
    }, [setAllAudioTracks]);

    const handleDeleteAudio = useCallback((trackIndex, clipIndex) => {
        setAllAudioTracks(prev => {
            const updatedTracks = [...prev];
            if (!updatedTracks[trackIndex]) return prev;
            
            const targetTrack = { ...updatedTracks[trackIndex] };
            const clips = [...targetTrack.clips];
            const clipToDelete = clips[clipIndex];
            
            if (clipToDelete.audioElement) {
                clipToDelete.audioElement.pause();
                URL.revokeObjectURL(clipToDelete.audioElement.src);
            }
            
            clips.splice(clipIndex, 1);
            targetTrack.clips = clips; 
            updatedTracks[trackIndex] = targetTrack;
            return updatedTracks;
        });
    }, [setAllAudioTracks]);

    const maxAudioDuration = useMemo(() => calculateMaxDuration(audioTracks), [audioTracks, calculateMaxDuration]);
    
    const totalFramesForRuler = useMemo(() => {
        const framesFromAudio = Math.ceil(maxAudioDuration * framesPerSecond);
        return Math.max(totalFrames, framesFromAudio, 1); 
    }, [maxAudioDuration, framesPerSecond, totalFrames]); 

    const rulerContentWidth = totalFramesForRuler * pixelsPerFrame;
    const playbackIndicatorLeft = useMemo(() => {
        const controlsOffset = 64 + 8; 
        return controlsOffset + (activeFrameIndex * pixelsPerFrame);
    }, [activeFrameIndex, pixelsPerFrame]);

    useEffect(() => {
        const updateLineHeight = () => {
            if (timelineScrollableRef.current) {
                setPlaybackLineHeight(timelineScrollableRef.current.scrollHeight);
            }
        };
        updateLineHeight();
        const resizeObserver = new ResizeObserver(updateLineHeight);
        if (timelineScrollableRef.current) {
            resizeObserver.observe(timelineScrollableRef.current);
        }
        return () => {
            resizeObserver.disconnect();
        };
    }, [audioTracks, totalFrames]); 

    return (
        <div className="w-full md:w-[600px] p-4 bg-gray-800 rounded-lg shadow-xl text-white text-sm flex flex-col space-y-4 max-h-[400px] overflow-hidden relative">
            <h3 className="text-lg font-semibold text-indigo-300 mb-2">Audio Mixer</h3>

            <input
                type="file"
                accept="audio/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />

            <div
                id="timeline-content-scrollable"
                ref={timelineScrollableRef} 
                className="flex-1 flex flex-col overflow-x-auto overflow-y-auto rounded-md relative"
            >
                {/* Frame-based Ruler */}
                <div
                    id="frame-ruler-display"
                    className="relative h-8 ml-[72px] bg-gray-900 flex-shrink-0 mb-2 flex items-center"
                    style={{ width: `${rulerContentWidth}px` }}
                >
                    {Array.from({ length: totalFramesForRuler }).map((_, frameIndex) => (
                        <div
                            key={`frame-ruler-${frameIndex}`}
                            className="flex-shrink-0 h-full flex items-center justify-center border-r border-gray-700"
                            style={{ width: `${pixelsPerFrame}px` }}
                        >
                            <span className="text-xs text-gray-400">{frameIndex + 1}</span>
                        </div>
                    ))}
                </div>

                {/* Audio Tracks Container */}
                <div className="flex flex-col space-y-3 flex-grow w-fit min-w-full">
                    {audioTracks.map((track, trackIndex) => (
                        <div key={track.id} className="flex flex-row items-center space-x-2 bg-gray-700 p-2 rounded-md flex-shrink-0">
                            {/* Track Controls */}
                            <div className="flex flex-col space-y-1 w-16 flex-shrink-0">
                                <button onClick={() => handleAddAudioClick(trackIndex)} className="p-1 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs flex items-center justify-center shadow-sm" title="Add Audio File" disabled={track.locked || isProcessingFile}>
                                    <Plus className="h-4 w-4" />
                                </button>
                                <button onClick={() => handleToggleMute(trackIndex)} className={`p-1 rounded-md ${track.muted ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white text-xs flex items-center justify-center shadow-sm`} title={track.muted ? "Unmute Track" : "Mute Track"} disabled={track.locked}>
                                    {track.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                                </button>
                                <button onClick={() => handleToggleLock(trackIndex)} className={`p-1 rounded-md ${track.locked ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-500 hover:bg-gray-600'} text-white text-xs flex items-center justify-center shadow-sm`} title={track.locked ? "Unlock Track" : "Lock Track"}>
                                    {track.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                                </button>
                            </div>

                            {/* Audio Clips Timeline Area */}
                            <div className="flex flex-row items-center flex-grow bg-gray-600 p-1 rounded-md overflow-hidden relative" style={{ height: '48px', minWidth: `${Math.max(200, rulerContentWidth)}px` }}>
                                {track.clips.length > 0 ? (
                                    track.clips.map((clip, clipIndex) => (
                                        <div
                                            key={clip.id}
                                            className="bg-indigo-500 hover:bg-indigo-600 p-1 rounded-md h-full flex items-center text-xs text-white shadow-md transition-all duration-100 absolute"
                                            style={{
                                                width: `${clip.isLoading ? 100 : (clip.duration * pixelsPerSecond)}px`,
                                                left: `${clip.startTime * pixelsPerSecond}px`,
                                                opacity: clip.isLoading ? 0.7 : 1,
                                            }}
                                        >
                                            <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                                                {clip.waveformPeaks && clip.waveformPeaks.length > 0 && (
                                                    <AudioWaveform peaks={clip.waveformPeaks} />
                                                )}
                                            </div>

                                            <span className="truncate pr-4 z-10 relative">{clip.name}</span>

                                            {(clip.isLoading || clip.isGeneratingWaveform) && (
                                                <div className="absolute inset-0 flex items-center justify-center z-20">
                                                    <Loader className="animate-spin h-5 w-5 text-white" />
                                                </div>
                                            )}

                                            {!clip.isLoading && !track.locked && (
                                                <button
                                                    onClick={() => handleDeleteAudio(trackIndex, clipIndex)}
                                                    className="absolute -right-1 p-0.5 rounded-full bg-red-500 hover:bg-red-600 text-white flex-shrink-0 shadow-sm z-20"
                                                    title="Remove Audio Clip"
                                                >
                                                    <XCircle className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-gray-400 text-xs w-full text-center">Empty Track</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Playback Indicator */}
                <div
                    className="absolute top-0 bg-red-500 w-0.5 z-50 pointer-events-none transition-transform duration-75 ease-linear"
                    style={{ left: `${playbackIndicatorLeft}px`, height: `${playbackLineHeight}px` }}
                ></div>
            </div>

            {/* Master Volume Control */}
            <div className="flex items-center justify-between border-t border-gray-700 pt-4 mt-4">
                <label className="text-gray-300">Master Volume:</label>
                <input type="range" min="0" max="1" step="0.01" value={masterVolume} onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))} className="w-48 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500" />
                <span className="ml-2 w-10 text-right text-gray-300">
                    {(masterVolume * 100).toFixed(0)}%
                </span>
            </div>

            {/* Custom Scrollbar Styles */}
            <style>{`
                #timeline-content-scrollable::-webkit-scrollbar { width: 8px; height: 8px; }
                #timeline-content-scrollable::-webkit-scrollbar-track { background: #374151; border-radius: 10px; }
                #timeline-content-scrollable::-webkit-scrollbar-thumb { background: #4B5563; border-radius: 10px; }
                #timeline-content-scrollable::-webkit-scrollbar-thumb:hover { background: #6B7280; }
            `}</style>
        </div>
    );
};
export default AudioMixer;
