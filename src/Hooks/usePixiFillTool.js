// src/Hooks/usePixiFillTool.js
import { useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
// CORRECTED LINE: Import 'hexToRgbaArray' and rename it to 'hexToRgba' for local use.
import { hexToRgbaArray as hexToRgba, colorsMatch } from '../Utils/CanvasHelper.js';
import { Texture, Sprite } from 'pixi.js';

/**
 * Performs a flood fill operation on the given ImageData.
 * This is a CPU-intensive operation.
 * @param {ImageData} initialImageData - The initial ImageData object to fill.
 * @param {number} startX - The x-coordinate (device pixel) to start the fill.
 * @param {number} startY - The y-coordinate (device pixel) to start the fill.
 * @param {object} newColorProps - Object containing color and opacity.
 * @param {number} tolerance - Color tolerance for matching.
 * @returns {ImageData} A new ImageData object with the filled area, or null if no fill was performed.
 */
const performFloodFill = (initialImageData, startX, startY, newColorProps, tolerance) => {
    const imageData = new ImageData(
        new Uint8ClampedArray(initialImageData.data),
        initialImageData.width,
        initialImageData.height
    );
    const { width, height } = imageData;
    const pixels = imageData.data;

    const startNode = [startX, startY];
    const targetColor = [
        pixels[(startY * width + startX) * 4],
        pixels[(startY * width + startX) * 4 + 1],
        pixels[(startY * width + startX) * 4 + 2],
        pixels[(startY * width + startX) * 4 + 3],
    ];

    const fillColor = hexToRgba(newColorProps.color, newColorProps.opacity);

    if (colorsMatch(targetColor, fillColor, tolerance)) {
        return null; // Don't fill if the start color is already the target color
    }

    const queue = [startNode];
    const visited = new Uint8Array(width * height);
    visited[startY * width + startX] = 1;

    while (queue.length > 0) {
        const [x, y] = queue.shift();

        const i = (y * width + x) * 4;
        pixels[i] = fillColor[0];
        pixels[i + 1] = fillColor[1];
        pixels[i + 2] = fillColor[2];
        pixels[i + 3] = fillColor[3];

        const neighbors = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];

        for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited[ny * width + nx]) {
                const neighborIndex = (ny * width + nx) * 4;
                const neighborColor = [
                    pixels[neighborIndex],
                    pixels[neighborIndex + 1],
                    pixels[neighborIndex + 2],
                    pixels[neighborIndex + 3],
                ];
                if (colorsMatch(targetColor, neighborColor, tolerance)) {
                    visited[ny * width + nx] = 1;
                    queue.push([nx, ny]);
                }
            }
        }
    }
    return imageData;
};


const usePixiFillTool = (pixiAppRef, viewportState, commitStrokes, fillProperties) => {
    const previewSpriteRef = useRef(null);

    const getCanvasSnapshot = useCallback(async () => {
        if (!pixiAppRef.current) return null;
        // Use the PixiJS extract API - much faster than re-rendering to a 2D canvas.
        return await pixiAppRef.current.renderer.extract.pixels({
             target: pixiAppRef.current.stage.mainContainer, // Make sure to grab from the container that is zoomed/panned
        });
    }, [pixiAppRef]);

    const handleFillPreview = useCallback(async (coords) => {
        if (!pixiAppRef.current || !coords) return;

        // Clear previous preview
        if (previewSpriteRef.current) {
            pixiAppRef.current.stage.tempContainer.removeChild(previewSpriteRef.current);
            previewSpriteRef.current.destroy(true);
            previewSpriteRef.current = null;
        }

        const snapshot = await getCanvasSnapshot();
        if (!snapshot) return;

        const dpr = pixiAppRef.current.renderer.resolution;
        // The coords are in world space, we need to find the screen space equivalent to sample the snapshot
        const screenX = (coords.offsetX * viewportState.zoomLevel + viewportState.offset.x) * dpr;
        const screenY = (coords.offsetY * viewportState.zoomLevel + viewportState.offset.y) * dpr;


        const filledImageData = performFloodFill(
            snapshot,
            Math.round(screenX),
            Math.round(screenY),
            { ...fillProperties, opacity: 0.5 }, // Use 50% opacity for preview
            fillProperties.tolerance
        );

        if (!filledImageData) return; // No fill needed

        const texture = await Texture.fromBuffer(filledImageData.data, filledImageData.width, filledImageData.height);
        const sprite = new Sprite(texture);

        // Position the preview sprite. It's a snapshot of the screen, so it shouldn't be affected by the main container's zoom/pan.
        // It lives in the top-level stage.
        sprite.position.set(0, 0);
        // The extracted image is already at device resolution, so we need to scale it down to match the CSS size of the canvas.
        sprite.scale.set(1 / dpr);

        previewSpriteRef.current = sprite;
        pixiAppRef.current.stage.tempContainer.addChild(sprite); // Add to a temp container

    }, [pixiAppRef, getCanvasSnapshot, fillProperties, viewportState]);

    const clearFillPreview = useCallback(() => {
        if (pixiAppRef.current && previewSpriteRef.current) {
            pixiAppRef.current.stage.tempContainer.removeChild(previewSpriteRef.current);
            previewSpriteRef.current.destroy(true);
            previewSpriteRef.current = null;
        }
    }, [pixiAppRef]);

    const handleFill = useCallback(async (coords) => {
        clearFillPreview(); // Clear any existing preview first
        const snapshot = await getCanvasSnapshot();
        if (!snapshot) return false;

        const dpr = pixiAppRef.current.renderer.resolution;
        const screenX = (coords.offsetX * viewportState.zoomLevel + viewportState.offset.x) * dpr;
        const screenY = (coords.offsetY * viewportState.zoomLevel + viewportState.offset.y) * dpr;

        const filledImageData = performFloodFill(
            snapshot,
            Math.round(screenX),
            Math.round(screenY),
            fillProperties,
            fillProperties.tolerance
        );

        if (!filledImageData) return false; // No fill was performed

        const texture = await Texture.fromBuffer(filledImageData.data, filledImageData.width, filledImageData.height);
        const sprite = new Sprite(texture);
        sprite.position.set(0, 0);
        sprite.scale.set(1 / dpr);

        const newFillStroke = {
            toolType: 'fill',
            id: uuidv4(),
            sprite: sprite,
            texture: texture, // Store texture for potential future use
            // The position is baked into the texture, so transform is at origin
            transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
            ...fillProperties
        };

        await commitStrokes((prevStrokes) => [...prevStrokes, newFillStroke]);
        return true;
    }, [pixiAppRef, clearFillPreview, getCanvasSnapshot, commitStrokes, fillProperties, viewportState]);

    return {
        handleFill,
        handleFillPreview,
        clearFillPreview,
    };
};

export default usePixiFillTool;