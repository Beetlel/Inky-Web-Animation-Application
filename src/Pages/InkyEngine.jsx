import React, { useState, useCallback, useContext, useMemo, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Topbar from '../Components/Topbar';
import LeftSidebar from '../Components/LeftSidebar';
import PixiCanvasStage from '../Components/PixiCanvasStage';
import RightSidebar from '../Components/RightSideBar';
import TimeLinebar from '../Components/TimeLinebar';
import LayerComponent from '../Components/LayerComponent';
import DrawingActionsContext from '../context/DrawingActionContext';
import ToolStateProvider from '../context/ToolStateProvider';
import usePixiCanvasViewport from '../Hooks/usePixiCanvasViewPort';

const InkyEngine = () => {
    const [showUI, setShowUI] = useState(false);
    const [showLayerPanel, setShowLayerPanel] = useState(false);
    const [showAudioComponent, setShowAudioComponent] = useState(false);
    // State for Grid Layer visibility
    const [showGrid, setShowGrid] = useState(false);
    const [allAudioTracks, setAllAudioTracks] = useState([]);
    const [masterVolume, setMasterVolume] = useState(0.7);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeFrameIndex, setActiveFrameIndex] = useState(0);
    // State to store the copied frame data
    const [copiedFrame, setCopiedFrame] = useState(null);

    // Use the custom hook for viewport management
    const {
       scale: zoomLevel,
        setScale: setZoomLevel, // <-- FIX: Get the setter for zoom level
        offset,
        setOffset, // <-- FIX: Get the setter for offset
        isPanning,
        zoom,
        startPanning,
        pan,
        stopPanning,
        resetViewport
    } = usePixiCanvasViewport();


 // Initial layers structure for a new frame
    const initialLayers = useMemo(() => ([
        {
            id: 'layer-1',
            name: 'Background',
            visible: true,
            locked: false,
            opacity: 1.0,
            strokes: [],
            redoStack: []
        },
        {
            id: 'layer-2',
            name: 'Sketch',
            visible: true,
            locked: false,
            opacity: 1.0,
            strokes: [],
            redoStack: []
        }
    ]), []);


 // State for managing frames
    const [frames, setFrames] = useState([
        {
            id: uuidv4(),
            name: 'Frame 1',
            layers: initialLayers,
            onionSkins: [],
            modified: false
        }
    ]);

    console.log('[InkyEngine Render] Current showGrid state (from component state):', showGrid);

    // Create refs to handle latest state in callbacks
    const allAudioTracksRef = useRef(allAudioTracks);
    const isPlayingRef = useRef(isPlaying);
    const framesRef = useRef(frames);
    const activeFrameIndexRef = useRef(activeFrameIndex);

    // Onion Skinning States
    const [onionSkinEnabled, setOnionSkinEnabled] = useState(true);
    const [onionSkinPrevCount, setOnionSkinPrevCount] = useState(1);
    const [onionSkinNextCount, setOnionSkinNextCount] = useState(0);
    const [onionSkinOpacity, setOnionSkinOpacity] = useState(0.3);




    const animationFrameRef = useRef(null);
    const framesPerSecond = 12; // Define frames per second here for consistency



    // Keep refs updated with latest state
    useEffect(() => {
        allAudioTracksRef.current = allAudioTracks;
        isPlayingRef.current = isPlaying;
        framesRef.current = frames;
        activeFrameIndexRef.current = activeFrameIndex;
    }, [allAudioTracks, isPlaying, frames, activeFrameIndex]);

    // Derive the layers for the currently active frame
    const currentFrameLayers = useMemo(() => {
        return frames[activeFrameIndex]?.layers || [];
    }, [frames, activeFrameIndex]);

    // The activeLayerId will now refer to a layer within the currentFrameLayers
    const [activeLayerId, setActiveLayerId] = useState(initialLayers[1].id); // Default to Sketch layer ID

    // State for the bounding box of the currently selected stroke(s)
    const [selectedStrokeBoundingBox, setSelectedStrokeBoundingBox] = useState(null);

    // --- START OF FIX: Use functional update for guaranteed re-render ---
    const handleShowUI = useCallback(() => {
        setShowUI(prevShowUI => !prevShowUI);
    }, []);
    // --- END OF FIX ---

    // Function to toggle LayerComponent visibility
    const toggleLayerPanel = useCallback(() => {
        setShowLayerPanel(prev => !prev);
    }, []);

    // Function to toggle Audio Component visibility
    const toggleAudioComponent = useCallback(() => {
        setShowAudioComponent(prev => !prev);
    }, []);

    // Function to toggle Grid visibility (with diagnostic log)
    const toggleGrid = useCallback(() => {
        setShowGrid(prev => {
            const newState = !prev;
            console.log(`[InkyEngine] toggleGrid called. New showGrid state: ${newState}`);
            return newState;
        });
    }, []);

    const handleMasterVolumeChange = useCallback((newVolume) => {
        setMasterVolume(newVolume);
        allAudioTracksRef.current.forEach(track => {
            if (track.clips) {
                track.clips.forEach(clip => {
                    if (clip.audioElement) {
                        try {
                            // Apply master volume, but also respect individual track mute state
                            clip.audioElement.volume = track.muted ? 0 : newVolume;
                        } catch (e) {
                            console.error("Error setting volume:", e);
                        }
                    }
                });
            }
        });
    }, []);

  // REFINED: Audio synchronization and animation loop
    useEffect(() => {
       if (!isPlaying) {
            // This block runs whenever isPlaying becomes false.
            setOnionSkinEnabled(true);
            // Stop any playing audio.
            allAudioTracksRef.current.forEach(track => {
                track.clips?.forEach(clip => {
                    if (clip.audioElement && !clip.audioElement.paused) {
                        clip.audioElement.pause();
                    }
                });
            });
            // If the reason for stopping was reaching the end, reset to frame 0.
            if (activeFrameIndexRef.current >= framesRef.current.length - 1) {
                setActiveFrameIndex(0);
            }
            return; // Stop here.
        }
    //Playback logic
        let animationFrameId = null;
        let lastFrameUpdateTime = 0;
        const frameIntervalMs = 1000 / framesPerSecond;

        const animate = (timestamp) => {
            if (!isPlayingRef.current) {
                return;
            }

            const currentTotalAnimationFrames = framesRef.current.length;

            const elapsedSinceLastFrameUpdate = timestamp - lastFrameUpdateTime;
            if (elapsedSinceLastFrameUpdate >= frameIntervalMs) {
                const nextFrameIndex = activeFrameIndexRef.current + 1;
                lastFrameUpdateTime = timestamp;

                if (nextFrameIndex >= currentTotalAnimationFrames) {
                    setIsPlaying(false);
                    setActiveFrameIndex(0);
                    return;
                }

                setActiveFrameIndex(nextFrameIndex);
                const currentPlaybackTime = nextFrameIndex / framesPerSecond;

                allAudioTracksRef.current.forEach(track => {
                    if (track.clips && !track.muted) {
                        track.clips.forEach(clip => {
                            if (clip.audioElement) {
                                const clipStartTime = clip.startTime;
                                const clipEndTime = clip.startTime + clip.duration;

                                if (currentPlaybackTime >= clipStartTime && currentPlaybackTime < clipEndTime) {
                                    if (clip.audioElement.paused) {
                                        clip.audioElement.currentTime = currentPlaybackTime - clipStartTime;
                                        clip.audioElement.play().catch(e => console.error("Audio play error:", e));
                                    }
                                } else {
                                    if (!clip.audioElement.paused) {
                                        clip.audioElement.pause();
                                    }
                                }
                            }
                        });
                    }
                });
            }

            animationFrameId = requestAnimationFrame(animate);
        };
        // Reset to first frame and audio when starting playback
        setActiveFrameIndex(0);
        allAudioTracksRef.current.forEach(track => {
            track.clips?.forEach(clip => {
                if (clip.audioElement) {
                    clip.audioElement.pause();
                    clip.audioElement.currentTime = 0;
                }
            });
        });

        lastFrameUpdateTime = performance.now();
        animationFrameId = requestAnimationFrame(animate);

          return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [isPlaying, framesPerSecond, setOnionSkinEnabled]);


    const addLayer = useCallback(() => {
        setFrames(prevFrames => {
            return prevFrames.map(frame => {
                const updatedLayers = [...frame.layers];
                const newLayerId = uuidv4();
                const newLayer = {
                    id: newLayerId,
                    name: `Layer ${updatedLayers.length + 1}`,
                    visible: true,
                    locked: false,
                    opacity: 1.0,
                    strokes: [],
                    redoStack: []
                };

                const activeLayerIdx = updatedLayers.findIndex(layer => layer.id === activeLayerId);

                if (activeLayerIdx !== -1) {
                    updatedLayers.splice(activeLayerIdx + 1, 0, newLayer);
                } else {
                    updatedLayers.push(newLayer);
                }

                const updatedOnionSkins = frame.onionSkins ? [...frame.onionSkins] : [];
                if (activeLayerIdx !== -1) {
                    updatedOnionSkins.splice(activeLayerIdx + 1, 0, { ...newLayer, strokes: [] });
                } else {
                    updatedOnionSkins.push({ ...newLayer, strokes: [] });
                }

                return {
                    ...frame,
                    layers: updatedLayers,
                    onionSkins: updatedOnionSkins,
                    modified: true
                };
            });
        });
    }, [activeLayerId]);

    const duplicateLayer = useCallback((layerIdToDuplicate) => {
        let newDuplicatedLayerId = null;

        setFrames(prevFrames => {
            return prevFrames.map((frame, frameIndex) => {
                const layerToCopy = frame.layers.find(layer => layer.id === layerIdToDuplicate);
                if (!layerToCopy) {
                    return frame;
                }

                const duplicatedLayer = {
                    ...layerToCopy,
                    id: uuidv4(),
                    name: `${layerToCopy.name.split('\n')[0]} Copy`,
                    strokes: layerToCopy.strokes.map(stroke => {
                        const newStroke = { ...stroke };
                        if (newStroke.points) newStroke.points = [...newStroke.points];
                        if (newStroke.transform) newStroke.transform = { ...newStroke.transform };
                        if (newStroke.imageData && newStroke.imageData instanceof ImageData) newStroke.imageData = newStroke.imageData;
                        delete newStroke.cachedBbox;
                        delete newStroke.cachedBboxKey;
                        return newStroke;
                    }),
                    redoStack: []
                };

                if (frameIndex === activeFrameIndex) {
                    newDuplicatedLayerId = duplicatedLayer.id;
                }

                const originalLayerIndex = frame.layers.findIndex(layer => layer.id === layerIdToDuplicate);
                const updatedLayers = [...frame.layers];
                if (originalLayerIndex !== -1) {
                    updatedLayers.splice(originalLayerIndex + 1, 0, duplicatedLayer);
                } else {
                    updatedLayers.push(duplicatedLayer);
                }

                const updatedOnionSkins = frame.onionSkins ? [...frame.onionSkins] : [];
                if (originalLayerIndex !== -1) {
                    updatedOnionSkins.splice(originalLayerIndex + 1, 0, { ...duplicatedLayer, strokes: [] });
                } else {
                    updatedOnionSkins.push({ ...duplicatedLayer, strokes: [] });
                }

                return {
                    ...frame,
                    layers: updatedLayers,
                    onionSkins: updatedOnionSkins,
                    modified: true
                };
            });
        });
        if (newDuplicatedLayerId) {
            setActiveLayerId(newDuplicatedLayerId);
        }
    }, [activeFrameIndex]);

    const deleteLayer = useCallback((layerIdToDelete) => {
        setFrames(prevFrames => {
            const canDelete = prevFrames.every(frame => frame.layers.length > 1);
            if (!canDelete) {
                console.warn("Cannot delete the last layer in any frame.");
                return prevFrames;
            }

            let newActiveLayerIdCandidate = activeLayerId;

            const updatedFrames = prevFrames.map(frame => {
                const updatedLayers = frame.layers.filter(layer => layer.id !== layerIdToDelete);
                const updatedOnionSkins = frame.onionSkins ? frame.onionSkins.filter(layer => layer.id !== layerIdToDelete) : [];

                if (frame.id === frames[activeFrameIndex].id && activeLayerId === layerIdToDelete) {
                    const indexToDelete = frame.layers.findIndex(layer => layer.id === layerIdToDelete);
                    if (indexToDelete > 0) {
                        newActiveLayerIdCandidate = frame.layers[indexToDelete - 1].id;
                    } else if (updatedLayers.length > 0) {
                        newActiveLayerIdCandidate = updatedLayers[0].id;
                    } else {
                        newActiveLayerIdCandidate = null;
                    }
                }

                return {
                    ...frame,
                    layers: updatedLayers,
                    onionSkins: updatedOnionSkins,
                    modified: true
                };
            });

            const currentActiveFrameUpdatedLayers = updatedFrames[activeFrameIndex]?.layers;
            if (currentActiveFrameUpdatedLayers && !currentActiveFrameUpdatedLayers.some(layer => layer.id === newActiveLayerIdCandidate)) {
                const foundActiveLayer = currentActiveFrameUpdatedLayers.find(layer => layer.id === activeLayerId);
                const foregroundLayer = currentActiveFrameUpdatedLayers.find(layer => layer.id === initialLayers[1].id);

                if (foundActiveLayer) {
                    newActiveLayerIdCandidate = foundActiveLayer.id;
                } else if (foregroundLayer) {
                    newActiveLayerIdCandidate = foregroundLayer.id;
                } else {
                    // Fallback if no matching layer found
                    newActiveLayerIdCandidate = currentActiveFrameUpdatedLayers[0]?.id || null;
                }
            }
            setActiveLayerId(newActiveLayerIdCandidate);

            return updatedFrames;
        });
    }, [activeFrameIndex, activeLayerId, frames, initialLayers]);

    const toggleLayerVisibility = useCallback((layerIdToToggle) => {
        setFrames(prevFrames => {
            return prevFrames.map(frame => {
                const updatedLayers = frame.layers.map(layer =>
                    layer.id === layerIdToToggle ? { ...layer, visible: !layer.visible } : layer
                );
                const updatedOnionSkins = frame.onionSkins.map(layer =>
                    layer.id === layerIdToToggle ? { ...layer, visible: !layer.visible } : layer
                );
                return {
                    ...frame,
                    layers: updatedLayers,
                    onionSkins: updatedOnionSkins,
                    modified: true
                };
            });
        });
    }, []);

    const setActiveLayer = useCallback((layerIdToActivate) => {
        setActiveLayerId(layerIdToActivate);
    }, []);

    const updateLayerOrder = useCallback((dragIndex, dropIndex) => {
        setFrames(prevFrames => {
            const newFrames = [...prevFrames];
            const currentFrame = { ...newFrames[activeFrameIndex] };
            const newLayers = [...currentFrame.layers];
            const [draggedLayer] = newLayers.splice(dragIndex, 1);
            newLayers.splice(dropIndex, 0, draggedLayer);
            currentFrame.layers = newLayers;
            currentFrame.modified = true;
            newFrames[activeFrameIndex] = currentFrame;
            return newFrames;
        });
    }, [activeFrameIndex]);

    const renameLayer = useCallback((layerIdToRename, newName) => {
        setFrames(prevFrames => {
            const newFrames = [...prevFrames];
            return newFrames.map(frame => {
                const updatedLayers = frame.layers.map(layer =>
                    layer.id === layerIdToRename ? { ...layer, name: newName } : layer
                );
                const updatedOnionSkins = frame.onionSkins.map(layer =>
                    layer.id === layerIdToRename ? { ...layer, name: newName } : layer
                );
                return {
                    ...frame,
                    layers: updatedLayers,
                    onionSkins: updatedOnionSkins,
                    modified: true
                };
            });
        });
    }, []);

    const updateLayerOpacity = useCallback((layerId, newOpacity) => {
        setFrames(prevFrames => {
            return prevFrames.map(frame => {
                const updatedLayers = frame.layers.map(layer =>
                    layer.id === layerId ? { ...layer, opacity: newOpacity } : layer
                );
                return {
                    ...frame,
                    layers: updatedLayers,
                    modified: true
                };
            });
        });
    }, []);


    const ensureFramesMatchAudioDuration = useCallback((durationInSeconds) => {
        const requiredFrames = Math.ceil(durationInSeconds * framesPerSecond);
        const currentTotalFrames = frames.length;
        if (requiredFrames > currentTotalFrames) {
            const framesToAdd = requiredFrames - currentTotalFrames;
            setFrames(prevFrames => {
                const newFrames = [...prevFrames];
                for (let i = 0; i < framesToAdd; i++) {
                    const newFrame = {
                        id: uuidv4(),
                        name: `Frame ${newFrames.length + 1}`,
                        layers: initialLayers.map(layer => ({
                            ...layer,
                            id: uuidv4(),
                            strokes: [],
                            redoStack: []
                        })),
                        onionSkins: [],
                        modified: false
                    };
                    newFrames.push(newFrame);
                }
                return newFrames;
            });
        }
    }, [frames.length, initialLayers, framesPerSecond]);

    const addFrameAtPosition = useCallback((insertIndex) => {
        setFrames(prevFrames => {
            const currentFrame = prevFrames[activeFrameIndex];

            const newOnionSkinsForNewFrame = currentFrame.layers.map(layer => ({
                ...layer,
                strokes: layer.strokes.map(stroke => {
                    const newStroke = { ...stroke };
                    if (newStroke.points) {
                        newStroke.points = [...newStroke.points];
                    }
                    if (newStroke.transform) {
                        newStroke.transform = { ...newStroke.transform };
                    }
                    if (newStroke.imageData && newStroke.imageData instanceof ImageData) {
                        newStroke.imageData = newStroke.imageData;
                    }
                    return newStroke;
                }),
                redoStack: []
            }));

            const newLayersForFrame = currentFrame.layers.map(layer => {
                const initialLayerMatch = initialLayers.find(il => il.name === layer.name);
                return {
                    id: initialLayerMatch ? initialLayerMatch.id : uuidv4(),
                    name: layer.name,
                    visible: layer.visible,
                    locked: layer.locked,
                    opacity: layer.opacity,
                    strokes: [],
                    redoStack: []
                };
            });

            const newFrame = {
                id: uuidv4(),
                name: `Frame ${prevFrames.length + 1}`,
                layers: newLayersForFrame,
                onionSkins: newOnionSkinsForNewFrame,
                modified: false
            };

            const updatedFrames = [...prevFrames];
            const finalInsertIndex = Math.min(Math.max(0, insertIndex), updatedFrames.length);
            updatedFrames.splice(finalInsertIndex, 0, newFrame);

            setActiveFrameIndex(finalInsertIndex);
            if (newLayersForFrame.length > 0) {
                const foundActiveLayerInNewFrame = newLayersForFrame.find(layer => layer.id === activeLayerId);
                const foregroundLayerInNewFrame = newLayersForFrame.find(layer => layer.id === initialLayers[1].id);

                if (foundActiveLayerInNewFrame) {
                    setActiveLayerId(foundActiveLayerInNewFrame.id);
                } else if (foregroundLayerInNewFrame) {
                    setActiveLayerId(foregroundLayerInNewFrame.id);
                } else {
                    setActiveLayerId(newLayersForFrame[0].id);
                }
            } else {
                setActiveLayerId(null);
            }
            return updatedFrames;
        });
    }, [activeFrameIndex, activeLayerId, initialLayers]);

    const addFrame = useCallback(() => {
        addFrameAtPosition(frames.length);
    }, [addFrameAtPosition, frames.length]);
 // Fixed deleteFrame function
    const deleteFrame = useCallback((indexToDelete) => {
        setFrames(prevFrames => {
            if (prevFrames.length === 1) {
                console.warn("Cannot delete the last frame.");
                return prevFrames;
            }
            const updatedFrames = prevFrames.filter((_, index) => index !== indexToDelete);

            let newActiveIdxToSet = activeFrameIndexRef.current;

            if (activeFrameIndexRef.current === indexToDelete) {
                newActiveIdxToSet = Math.max(0, indexToDelete - 1);
            } else if (activeFrameIndexRef.current > indexToDelete) {
                newActiveIdxToSet = activeFrameIndexRef.current - 1;
            }

            // Use refs to access current state
            const currentActiveFrameUpdatedLayers = updatedFrames[newActiveIdxToSet]?.layers;
            let newActiveLayerIdCandidate = activeLayerId;

            if (currentActiveFrameUpdatedLayers &&
                !currentActiveFrameUpdatedLayers.some(layer => layer.id === newActiveLayerIdCandidate)) {
                const foundActiveLayer = currentActiveFrameUpdatedLayers.find(layer => layer.id === activeLayerId);
                const foregroundLayer = currentActiveFrameUpdatedLayers.find(layer => layer.id === initialLayers[1].id);

                if (foundActiveLayer) {
                    newActiveLayerIdCandidate = foundActiveLayer.id;
                } else if (foregroundLayer) {
                    newActiveLayerIdCandidate = foregroundLayer.id;
                } else {
                    newActiveLayerIdCandidate = currentActiveFrameUpdatedLayers[0]?.id || null;
                }
            }

            // Set states outside of setFrames
            Promise.resolve().then(() => {
                setActiveFrameIndex(newActiveIdxToSet);
                setActiveLayerId(newActiveLayerIdCandidate);
            });

            return updatedFrames;
        });
    }, [initialLayers, activeLayerId]);


    const copyFrame = useCallback((indexToCopy) => {
        const frameToCopy = frames[indexToCopy];
        if (!frameToCopy) {
            console.warn("Frame to copy not found.");
            setCopiedFrame(null);
            return;
        }

        const copiedData = {
            ...frameToCopy,
            layers: frameToCopy.layers.map(layer => ({
                ...layer,
                strokes: layer.strokes.map(stroke => {
                    const newStroke = { ...stroke };
                    if (newStroke.points) newStroke.points = [...newStroke.points];
                    if (newStroke.transform) newStroke.transform = { ...newStroke.transform };
                    if (newStroke.imageData && newStroke.imageData instanceof ImageData) newStroke.imageData = newStroke.imageData;
                    delete newStroke.cachedBbox;
                    delete newStroke.cachedBboxKey;
                    return newStroke;
                }),
                redoStack: []
            }))
        };
        setCopiedFrame(copiedData);
        console.log(`Frame ${indexToCopy + 1} copied.`);
    }, [frames]);

    const pasteFrame = useCallback((insertIndex) => {
        if (!copiedFrame) {
            console.warn("No frame data copied to paste.");
            return;
        }

        setFrames(prevFrames => {
            const newFrames = [...prevFrames];

            const newPastedFrame = {
                ...copiedFrame,
                id: uuidv4(),
                name: `${copiedFrame.name.split('\n')[0]}\n(pasted)`,
                layers: copiedFrame.layers.map(layer => {
                    const initialLayerMatch = initialLayers.find(il => il.name === layer.name);
                    return {
                        ...layer,
                        id: initialLayerMatch ? initialLayerMatch.id : uuidv4(),
                        strokes: layer.strokes.map(stroke => {
                            const newStroke = { ...stroke };
                            if (newStroke.points) newStroke.points = [...newStroke.points];
                            if (newStroke.transform) newStroke.transform = { ...newStroke.transform };
                            if (newStroke.imageData && newStroke.imageData instanceof ImageData) newStroke.imageData = newStroke.imageData;
                            delete newStroke.cachedBbox;
                            delete newStroke.cachedBboxKey;
                            return newStroke;
                        }),
                        redoStack: []
                    };
                }),
                onionSkins: [],
                modified: true
            };

            const finalInsertIndex = Math.min(Math.max(0, insertIndex), newFrames.length);

            newFrames.splice(finalInsertIndex, 0, newPastedFrame);
            setActiveFrameIndex(finalInsertIndex);
            if (newPastedFrame.layers.length > 0) {
                const foundActiveLayerInNewFrame = newPastedFrame.layers.find(layer => layer.id === activeLayerId);
                const foregroundLayerInNewFrame = newPastedFrame.layers.find(layer => layer.id === initialLayers[1].id);

                if (foundActiveLayerInNewFrame) {
                    setActiveLayerId(foundActiveLayerInNewFrame.id);
                } else if (foregroundLayerInNewFrame) {
                    setActiveLayerId(foregroundLayerInNewFrame.id);
                } else {
                    setActiveLayerId(newPastedFrame.layers[0].id);
                }
            } else {
                setActiveLayerId(null);
            }
            return newFrames;
        });
    }, [copiedFrame, activeLayerId, initialLayers]);

    const goToFrame = useCallback((index) => {
        if (isPlaying) {
            setIsPlaying(false);
        }
        if (index >= 0 && index < frames.length) {
            setFrames(prev => {
                const newFrames = [...prev];
                const targetFrame = newFrames[index];
                if (index > 0) {
                    const prevFrame = newFrames[index - 1];
                    const newOnionSkins = targetFrame.layers.map(currentLayer => {
                        const correspondingPrevLayer = prevFrame.layers.find(l => l.id === currentLayer.id);
                        return {
                            ...currentLayer,
                            strokes: correspondingPrevLayer ? correspondingPrevLayer.strokes.map(stroke => {
                                const newStroke = { ...stroke };
                                if (newStroke.points) newStroke.points = [...newStroke.points];
                                if (newStroke.transform) newStroke.transform = { ...newStroke.transform };
                                if (newStroke.imageData && newStroke.imageData instanceof ImageData) newStroke.imageData = newStroke.imageData;
                                return newStroke;
                            }) : [],
                            redoStack: []
                        };
                    });
                    newFrames[index] = { ...targetFrame, onionSkins: newOnionSkins };
                } else {
                    newFrames[index] = { ...targetFrame, onionSkins: [] };
                }
                return newFrames;
            });
            setActiveFrameIndex(index);
            const navigatedFrameLayers = frames[index]?.layers;
            if (navigatedFrameLayers && navigatedFrameLayers.length > 0) {
                const foundActiveLayer = navigatedFrameLayers.find(layer => layer.id === activeLayerId);
                const foregroundLayer = navigatedFrameLayers.find(layer => layer.id === initialLayers[1].id);

                if (foundActiveLayer) {
                    setActiveLayerId(foundActiveLayer.id);
                } else if (foregroundLayer) {
                    setActiveLayerId(foregroundLayer.id);
                } else {
                    setActiveLayerId(navigatedFrameLayers[0].id);
                }
            } else {
                setActiveLayerId(null);
            }
        }
    }, [isPlaying, frames.length, activeLayerId, frames, initialLayers]);

    const nextFrame = useCallback(() => {
        goToFrame((activeFrameIndex + 1) % frames.length);
    }, [activeFrameIndex, frames.length, goToFrame]);

    const prevFrame = useCallback(() => {
        goToFrame((activeFrameIndex - 1 + frames.length) % frames.length);
    }, [activeFrameIndex, frames.length, goToFrame]);

    const togglePlay = useCallback(() => {
        console.log("Toggling play. Current state:", isPlaying);
        setIsPlaying(prevIsPlaying => {
            const newIsPlaying = !prevIsPlaying;
            console.log("Setting play state to:", newIsPlaying);
            setOnionSkinEnabled(!newIsPlaying);
            return newIsPlaying;
        });
    }, []);

   const undo = useCallback(() => {
    setFrames(prevFrames => {
        // Create a DEEP copy of frames to ensure proper reference updates
        const newFrames = prevFrames.map(frame => ({ ...frame }));
        const currentFrame = { ...newFrames[activeFrameIndex] };

        // Create a new layers array
        const updatedLayers = [...currentFrame.layers];
        const activeLayerIdx = updatedLayers.findIndex(layer => layer.id === activeLayerId);

        if (activeLayerIdx === -1 || updatedLayers[activeLayerIdx].strokes.length === 0) {
            return prevFrames;
        }

        // Create a new layer object
        const layer = { ...updatedLayers[activeLayerIdx] };
        const lastStroke = layer.strokes[layer.strokes.length - 1];

        layer.strokes = layer.strokes.slice(0, -1);
        layer.redoStack = [...layer.redoStack, lastStroke];

        updatedLayers[activeLayerIdx] = layer;

        // Return new state with updated references
        newFrames[activeFrameIndex] = {
            ...currentFrame,
            layers: updatedLayers,
            modified: true
        };

        return newFrames;
    });
}, [activeFrameIndex, activeLayerId]);

   const redo = useCallback(() => {
    setFrames(prevFrames => {
        // Create a DEEP copy of frames
        const newFrames = prevFrames.map(frame => ({ ...frame }));
        const currentFrame = { ...newFrames[activeFrameIndex] };

        // Create new layers array
        const updatedLayers = [...currentFrame.layers];
        const activeLayerIdx = updatedLayers.findIndex(layer => layer.id === activeLayerId);

        if (activeLayerIdx === -1 || updatedLayers[activeLayerIdx].redoStack.length === 0) {
            return prevFrames;
        }

        // Create new layer object
        const layer = { ...updatedLayers[activeLayerIdx] };
        const lastUndoneStroke = layer.redoStack[layer.redoStack.length - 1];

        layer.strokes = [...layer.strokes, lastUndoneStroke];
        layer.redoStack = layer.redoStack.slice(0, -1);

        updatedLayers[activeLayerIdx] = layer;

        // Return new state with updated references
        newFrames[activeFrameIndex] = {
            ...currentFrame,
            layers: updatedLayers,
            modified: true
        };

        return newFrames;
    });
}, [activeFrameIndex, activeLayerId]);

   const canUndo = useMemo(() => {
    const frame = frames[activeFrameIndex];
    if (!frame) return false;

    const layer = frame.layers.find(l => l.id === activeLayerId);
    const result = layer ? layer.strokes.length > 0 : false;

    return result;
}, [frames, activeFrameIndex, activeLayerId]); // Add frames to dependencies

  const canRedo = useMemo(() => {
    const frame = frames[activeFrameIndex];
    if (!frame) return false;

    const layer = frame.layers.find(l => l.id === activeLayerId);
    const result = layer ? layer.redoStack.length > 0 : false;

    return result;
}, [frames, activeFrameIndex, activeLayerId]); // Add frames to dependencies

   const updateActiveLayerStrokes = useCallback((strokeUpdateFunction, shouldClearRedo = true) => {
    setFrames(prevFrames => {
        return prevFrames.map((frame, index) => {
            if (index !== activeFrameIndex) return frame;

            return {
                ...frame,
                layers: frame.layers.map(layer => {
                    if (layer.id !== activeLayerId) return layer;

                    const updatedStrokes = strokeUpdateFunction(layer.strokes);

                    return {
                        ...layer,
                        strokes: updatedStrokes,
                        redoStack: shouldClearRedo ? [] : layer.redoStack
                    };
                })
            };
        });
    });
}, [activeFrameIndex, activeLayerId]);

 const activeLayerIdRef = useRef(activeLayerId);
    useEffect(() => {
        activeLayerIdRef.current = activeLayerId;
    }, [activeLayerId]);

    const drawingActionsContextValue = {
        undo,
        redo,
        canUndo,
        canRedo,
        // Expose layer management functions
        addLayer,
        deleteLayer,
        duplicateLayer,
        toggleLayerVisibility,
        setActiveLayer,
        updateLayerOrder,
        renameLayer,
        layers: currentFrameLayers,
        activeLayerId: activeLayerId,
        // Expose frame management functions
        addFrame,
        addFrameAtPosition,
        deleteFrame,
        goToFrame,
        nextFrame,
        prevFrame,
        togglePlay,
        isPlaying,
        activeFrameIndex,
        totalFrames: frames.length,
        frames: frames,
        copyFrame,
        pasteFrame,
        copiedFrame,
        // Expose onion skinning settings and toggles
        onionSkinEnabled,
        setOnionSkinEnabled,
        onionSkinPrevCount,
        setOnionSkinPrevCount,
        onionSkinNextCount,
        setOnionSkinNextCount,
        onionSkinOpacity,
        setOnionSkinOpacity,
        // Expose audio component state and toggle
        showAudioComponent,
        toggleAudioComponent,
        // Expose grid state and toggle
        showGrid,
        toggleGrid,


        // NEW: Zoom functions
        zoomLevel,
        setZoomLevel,
        offset,
        setOffset,
        pan,
        startPanning,
        stopPanning,
        isPanning,
        resetViewport // UPDATED: Provide the new resetViewport function
    };

    return (
        <ToolStateProvider>
            <div className='flex flex-col z-0 h-screen bg-gray-700'>
                <DrawingActionsContext.Provider value={drawingActionsContextValue}>
                    <Topbar onToggle={handleShowUI} showUI={showUI} />

                    <div className='flex flex-1 z-100 overflow-hidden h-fit '>
                        <LeftSidebar showUI={showUI}/>

                        <PixiCanvasStage
                            layers={currentFrameLayers}
                            activeLayerId={activeLayerId}
                            updateActiveLayerStrokes={updateActiveLayerStrokes}
                            setSelectedStrokeBoundingBox={setSelectedStrokeBoundingBox}
                            allFrames={frames}
                            activeFrameIndex={activeFrameIndex}
                            onionSkinEnabled={onionSkinEnabled}
                            onionSkinPrevCount={onionSkinPrevCount}
                            onionSkinNextCount={onionSkinNextCount}
                            onionSkinOpacity={onionSkinOpacity}
                            showGrid={showGrid}
                            resetViewportTrigger={resetViewport} 
                        />

                        <RightSidebar
                            showUI={showUI}
                            selectedStrokeBoundingBox={selectedStrokeBoundingBox}
                        />
                    </div>
                </DrawingActionsContext.Provider>

                {showLayerPanel && (
                    <LayerComponent
                        layers={currentFrameLayers}
                        activeLayerId={activeLayerId}
                        setActiveLayer={setActiveLayer}
                        addLayer={addLayer}
                        deleteLayer={deleteLayer}
                        duplicateLayer={duplicateLayer}
                        toggleLayerVisibility={toggleLayerVisibility}
                        updateLayerOrder={updateLayerOrder}
                        renameLayer={renameLayer}
                        updateLayerOpacity={updateLayerOpacity}
                    />
                )}
                <TimeLinebar
                    showUI={showUI}
                    onToggleLayerPanel={toggleLayerPanel}
                    onAddFrame={addFrame}
                    onAddFrameAtPosition={addFrameAtPosition}
                    onNextFrame={nextFrame}
                    onPrevFrame={prevFrame}
                    onTogglePlay={togglePlay}
                    isPlaying={isPlaying}
                    activeFrameIndex={activeFrameIndex}
                    totalFrames={frames.length}
                    frames={frames}
                    goToFrame={goToFrame}
                    deleteFrame={deleteFrame}
                    copyFrame={copyFrame}
                    pasteFrame={pasteFrame}
                    copiedFrame={copiedFrame}
                    onionSkinEnabled={onionSkinEnabled}
                    setOnionSkinEnabled={setOnionSkinEnabled}
                    onionSkinPrevCount={onionSkinPrevCount}
                    setOnionSkinPrevCount={setOnionSkinPrevCount}
                    onionSkinNextCount={onionSkinNextCount}
                    setOnionSkinNextCount={setOnionSkinNextCount}
                    onionSkinOpacity={onionSkinOpacity}
                    setOnionSkinOpacity={setOnionSkinOpacity}
                    showAudioComponent={showAudioComponent}
                    onToggleAudioComponent={toggleAudioComponent}
                    allAudioTracks={allAudioTracks}
                    setAllAudioTracks={setAllAudioTracks}
                    ensureFramesMatchAudioDuration={ensureFramesMatchAudioDuration}
                    masterVolume={masterVolume}
                    onMasterVolumeChange={handleMasterVolumeChange}
                />
            </div>
        </ToolStateProvider>
    );
};

export default InkyEngine;
