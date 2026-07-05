import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Eye, EyeOff, Trash2, Plus, Pencil, Copy } from 'lucide-react'; // Import Copy icon

const LayerComponent = ({
    layers,
    activeLayerId,
    setActiveLayer,
    addLayer,
    deleteLayer,
    duplicateLayer, // Receive duplicateLayer function
    toggleLayerVisibility,
    updateLayerOrder,
    renameLayer,
    updateLayerOpacity // Receive updateLayerOpacity function
}) => {
    const [editingLayerId, setEditingLayerId] = useState(null);
    const [editingLayerName, setEditingLayerName] = useState('');
    const inputRef = useRef(null);

    const [draggedLayerIndex, setDraggedLayerIndex] = useState(null);
    const [draggedLayerClientY, setDraggedLayerClientY] = useState(0);
    const [draggedLayerOffset, setDraggedLayerOffset] = useState(0);
    const layerRefs = useRef([]);
    const scrollableContainerRef = useRef(null);

    useEffect(() => {
        if (editingLayerId && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingLayerId]);

    useEffect(() => {
        layerRefs.current = layerRefs.current.slice(0, layers.length);
    }, [layers]);

    const handleAddLayer = () => {
        addLayer();
    };

      const activeLayer = layers.find(layer => layer.id === activeLayerId);

    // NEW: Handle Duplicate Active Layer
    const handleDuplicateActiveLayer = () => {
        if (activeLayerId) {
            duplicateLayer(activeLayerId);
        } else {
            console.warn("No active layer to duplicate.");
            // Optionally, show a user-facing message here (e.g., a temporary tooltip)
        }
    };

    const handleDeleteLayer = (layerId) => {
        if (window.confirm('Are you sure you want to delete this layer?')) {
            deleteLayer(layerId);
        }
    };

    const handleToggleVisibility = (layerId) => {
        toggleLayerVisibility(layerId);
    };

    const handleSetActive = (layerId) => {
        if (editingLayerId !== layerId) {
            setActiveLayer(layerId);
        }
    };

    const handleRenameClick = (layer) => {
        setEditingLayerId(layer.id);
        setEditingLayerName(layer.name);
    };

    const handleNameChange = (e) => {
        setEditingLayerName(e.target.value);
    };

    const handleNameBlur = (layerId) => {
        if (editingLayerName.trim() !== '') {
            renameLayer(layerId, editingLayerName.trim());
        }
        setEditingLayerId(null);
    };

    const handleKeyDown = (e, layerId) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleNameBlur(layerId);
        } else if (e.key === 'Escape') {
            setEditingLayerId(null);
        }
    };

    const handleMouseDragStart = (e, index) => {
        if (editingLayerId !== null) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('layerIndex', index);
        e.currentTarget.classList.add('dragging');
    };

    const handleMouseDragEnd = (e) => {
        e.currentTarget.classList.remove('dragging');
    };

    const handleMouseDragOver = (e) => {
        e.preventDefault();
        const targetElement = e.currentTarget;
        if (targetElement.classList.contains('layer-item')) {
            targetElement.classList.add('drag-over');
        }
    };

    const handleMouseDragLeave = (e) => {
        e.currentTarget.classList.remove('drag-over');
    };

    const handleMouseDrop = (e, dropIndex) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        const dragIndex = parseInt(e.dataTransfer.getData('layerIndex'), 10);
        if (dragIndex !== dropIndex) {
            updateLayerOrder(dragIndex, dropIndex);
        }
    };

    const handleTouchDragStart = useCallback((e, index) => {
        e.preventDefault(); 
        e.stopPropagation();
        
        const touch = e.touches[0];
        const layerElement = layerRefs.current[index];
        if (layerElement) {
            const rect = layerElement.getBoundingClientRect();
            setDraggedLayerIndex(index);
            setDraggedLayerClientY(touch.clientY);
            setDraggedLayerOffset(touch.clientY - rect.top);
            layerElement.classList.add('dragging-touch');
            if (scrollableContainerRef.current) {
                scrollableContainerRef.current.style.overflowY = 'hidden';
            }
        }
    }, []);

    const handleTouchDragMove = useCallback((e) => {
        if (draggedLayerIndex === null) return;
        e.preventDefault();
        e.stopPropagation();

        const touch = e.touches[0];
        setDraggedLayerClientY(touch.clientY);

        let newDropIndex = draggedLayerIndex;
        const currentDraggedY = touch.clientY - draggedLayerOffset;

        for (let i = 0; i < layers.length; i++) {
            if (i === draggedLayerIndex) continue;

            const targetLayerElement = layerRefs.current[i];
            if (targetLayerElement) {
                const rect = targetLayerElement.getBoundingClientRect();
                const midPoint = rect.top + rect.height / 2;

                if (draggedLayerIndex < i) {
                    if (currentDraggedY + (layerRefs.current[draggedLayerIndex]?.offsetHeight || 0) > midPoint) {
                        newDropIndex = i;
                    }
                } else {
                    if (currentDraggedY < midPoint) {
                        newDropIndex = i;
                    }
                }
            }
        }
    }, [draggedLayerIndex, draggedLayerOffset, layers]);

    const handleTouchEnd = useCallback(() => {
        if (draggedLayerIndex === null) return;

        const draggedElement = layerRefs.current[draggedLayerIndex];
        if (draggedElement) {
            draggedElement.classList.remove('dragging-touch');
            draggedElement.style.transform = '';
            draggedElement.style.zIndex = '';
        }

        if (scrollableContainerRef.current) {
            scrollableContainerRef.current.style.overflowY = 'auto';
        }

        let finalDropIndex = draggedLayerIndex;
        const currentDraggedY = draggedLayerClientY - draggedLayerOffset;

        for (let i = 0; i < layers.length; i++) {
            if (i === draggedLayerIndex) continue;

            const targetLayerElement = layerRefs.current[i];
            if (targetLayerElement) {
                const rect = targetLayerElement.getBoundingClientRect();
                const midPoint = rect.top + rect.height / 2;

                if (draggedLayerIndex < i) {
                    if (currentDraggedY + (layerRefs.current[draggedLayerIndex]?.offsetHeight || 0) > midPoint) {
                        finalDropIndex = i;
                    }
                } else {
                    if (currentDraggedY < midPoint) {
                        finalDropIndex = i;
                    }
                }
            }
        }

        if (draggedLayerIndex !== finalDropIndex) {
            updateLayerOrder(draggedLayerIndex, finalDropIndex);
        }
        setDraggedLayerIndex(null);
        setDraggedLayerClientY(0);
        setDraggedLayerOffset(0);
    }, [draggedLayerIndex, draggedLayerClientY, draggedLayerOffset, layers, updateLayerOrder]);


    return (
        <div className="absolute left-36 bottom-28 -translate-x-1/2 mb-2 w-72 bg-gray-800 h-fit text-white rounded-lg shadow-xl p-3 z-20 transform transition-all duration-300 ease-in-out">
            <h3 className="text-lg font-semibold mb-3 text-center text-indigo-300 h-fit">Layers</h3>
            {/* Custom Scrollbar Styles for WebKit browsers */}
            <style>{`
                #layer-scrollable-container::-webkit-scrollbar {
                    width: 8px;
                }

                #layer-scrollable-container::-webkit-scrollbar-track {
                    background: #374151;
                    border-radius: 10px;
                }

                #layer-scrollable-container::-webkit-scrollbar-thumb {
                    background: #4B5563;
                    border-radius: 10px;
                }

                /* Handle on hover */
                #layer-scrollable-container::-webkit-scrollbar-thumb:hover {
                    background: #6B7280;
                }
                /* Styles for drag feedback */
                .layer-item.dragging {
                    opacity: 0.5;
                }
                .layer-item.dragging-touch {
                    opacity: 0.7;
                    transition: none; /* Disable transition during active touch drag for smoother movement */
                    box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.3);
                }
                .layer-item.drag-over {
                    border-top: 2px solid #6366f1; /* Visual indicator for drop target */
                }
            `}</style>
            <div id="layer-scrollable-container" ref={scrollableContainerRef} className="space-y-2 max-h-60 overflow-y-auto pr-1 h-fit">
                {layers.map((layer, index) => {
                    const isDraggingThisLayer = draggedLayerIndex === index;
                    const draggedStyle = isDraggingThisLayer ? {
                        transform: `translateY(${draggedLayerClientY - (layerRefs.current[index]?.getBoundingClientRect().top || 0) - draggedLayerOffset}px)`,
                        position: 'relative',
                        zIndex: 100
                    } : {};

                    return (
                        <div
                            key={layer.id}
                            ref={el => layerRefs.current[index] = el}
                            className={`layer-item flex items-center h-16 justify-between p-2 rounded-md cursor-pointer transition-colors duration-200
                                ${layer.id === activeLayerId ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}
                                ${layer.locked ? 'opacity-60 cursor-not-allowed' : ''}
                                ${isDraggingThisLayer ? 'dragging-touch' : ''}
                            `}
                            draggable={true}
                            onDragStart={(e) => handleMouseDragStart(e, index)}
                            onDragEnd={handleMouseDragEnd}
                            onDragOver={handleMouseDragOver}
                            onDragLeave={handleMouseDragLeave}
                            onDrop={(e) => handleMouseDrop(e, index)}
                            onClick={() => !layer.locked && !isDraggingThisLayer && handleSetActive(layer.id)}
                            style={isDraggingThisLayer ? draggedStyle : {}}
                        >
                            <div
                                className="w-8 h-full flex items-center justify-center cursor-grab active:cursor-grabbing mr-2"
                                onTouchStart={(e) => handleTouchDragStart(e, index)}
                                onTouchMove={handleTouchDragMove}
                                onTouchEnd={handleTouchEnd}
                                onTouchCancel={handleTouchEnd}
                                onMouseDown={(e) => e.preventDefault()}
                            >
                                <div className="flex flex-col mt-4 space-y-2">
                                    <span className="w-4 h-0.5 bg-gray-400 rounded-full"></span>
                                    <span className="w-4 h-0.5 bg-gray-400 rounded-full"></span>
                                    <span className="w-4 h-0.5 bg-gray-400 rounded-full"></span>
                                </div>
                            </div>

                            {editingLayerId === layer.id ? (
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={editingLayerName}
                                    onChange={handleNameChange}
                                    onBlur={() => handleNameBlur(layer.id)}
                                    onKeyDown={(e) => handleKeyDown(e, layer.id)}
                                    className="flex-1 bg-gray-600 text-white rounded w-24 px-2 py-1 mr-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <span className="flex-1 mt-4 truncate font-medium" onDoubleClick={() => handleRenameClick(layer)}>
                                    {layer.name} {layer.locked && ' (Locked)'}
                                </span>
                            )}
                            <div className="flex items-center space-x-2">
                                {editingLayerId !== layer.id && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRenameClick(layer); }}
                                        className="p-1 rounded-full hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                        title="Rename Layer"
                                    >
                                        <Pencil className="h-5 w-5 text-blue-300" />
                                    </button>
                                )}
                                {/* Removed Duplicate Button from here */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleToggleVisibility(layer.id); }}
                                    className="p-1 rounded-full hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                    title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                                >
                                    {layer.visible ? (
                                        <Eye className="h-5 w-5 text-green-400" />
                                    ) : (
                                        <EyeOff className="h-5 w-5 text-red-400" />
                                    )}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteLayer(layer.id); }}
                                    className="p-1 rounded-full hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-300"
                                    title="Delete Layer"
                                    disabled={layers.length === 1}
                                >
                                    <Trash2 className="h-5 w-5 text-red-300" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

                       {/* ADD THE OPACITY SLIDER HERE */}
            {activeLayer && (
                <div className="mt-2 pt-2 border-t border-gray-700">
                    <label htmlFor="layerOpacity" className="block text-sm font-medium text-gray-300 ">
                        Active Layer Opacity: {Math.round(activeLayer.opacity * 100)}%
                    </label>
                    <input
                        id="layerOpacity"
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={activeLayer.opacity}
                        onChange={(e) => updateLayerOpacity(activeLayerId, parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm"
                    />
                </div>
            )}


            <div className="mt-4 flex justify-center h-fit space-x-2"> {/* Added space-x-2 for button spacing */}
    
                <button
                    onClick={handleAddLayer}
                    className="px-4 py-2 h-fit bg-indigo-500 text-white rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors duration-200"
                >
                    <Plus className="inline-block mr-1 h-5 w-5" /> Add New Layer
                </button>
                {/* NEW: Duplicate Active Layer Button */}
                <button
                    onClick={handleDuplicateActiveLayer}
                    className="px-3 py-2 h-fit bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors duration-200"
                    title="Duplicate Active Layer"
                    disabled={!activeLayerId} // Disable if no layer is active
                >
                    <Copy className=" m-1 h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

export default LayerComponent;
