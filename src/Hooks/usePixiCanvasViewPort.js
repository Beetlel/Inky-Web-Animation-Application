// src/Hooks/usePixiCanvasViewPort.js
import React, { useState, useCallback, useEffect, useRef } from 'react'; // <--- ADDED useRef and React

// This function determines the best default scale and offset based on screen size.
const getDeviceDefaults = () => {
    const { innerWidth: width, innerHeight: height } = window;

    // Phone Landscape (e.g., 844x390)
    if (height < 500 && width > height) {
        return { scale: 0.3, offset: { x: 130, y: 7 } };
    }
    // Phone Portrait (e.g., 390x844)
    if (width < 768) {
        return { scale: 0.2, offset: { x: 1, y: 275 } };
    }
    // Tablet Portrait (e.g., 768x1024)
    if (width < 1024 && height > width) {
        return { scale: 0.35, offset: { x: 50, y: 275 } };
    }
    // Tablet Landscape (e.g., 1024x768)
    if (width < 1280 && width > height) {
        return { scale: 0.5, offset: { x: 30, y: 80 } };
    }
    // Default (Laptop/Desktop)
    return { scale: 0.5, offset: { x: 150, y: 10 } };
};

export default function useViewport() {
    const [scale, setScale] = useState(getDeviceDefaults().scale);
    const [offset, setOffset] = useState(getDeviceDefaults().offset);
    
    const [isPanning, setIsPanning] = useState(false);
    const lastPointRef = useRef({ x: 0, y: 0 }); // <--- Changed from React.useRef to useRef

    useEffect(() => {
        const handleResize = () => {
            const defaults = getDeviceDefaults();
            setScale(defaults.scale);
            setOffset(defaults.offset);
        };

        window.addEventListener('resize', handleResize);
        
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const zoom = useCallback((delta, point) => {
        setScale(prevScale => {
            const newScale = Math.max(0.1, Math.min(prevScale + delta, 10));
            return newScale;
        });
    }, []);

    const startPanning = useCallback((point) => {
        setIsPanning(true);
        lastPointRef.current = point;
    }, []);

    const pan = useCallback((point) => {
        if (!isPanning) return;
        
        setOffset(prevOffset => ({
            x: prevOffset.x + (point.x - lastPointRef.current.x),
            y: prevOffset.y + (point.y - lastPointRef.current.y)
        }));
        
        lastPointRef.current = point;
    }, [isPanning]);

    const stopPanning = useCallback(() => {
        setIsPanning(false);
    }, []);

    const resetViewport = useCallback(() => {
        const defaults = getDeviceDefaults();
        setScale(defaults.scale);
        setOffset(defaults.offset);
    }, []);

    return {
        scale,
        setScale,
        offset,
        setOffset,
        isPanning,
        zoom,
        startPanning,
        pan,
        stopPanning,
        resetViewport
    };
}