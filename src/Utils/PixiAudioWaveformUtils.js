// src/Utils/PixiAudioWaveformUtils.js
import { Graphics } from 'pixi.js';

/**
 * Creates a waveform visualization using Pixi.js Graphics.
 * 
 * @param {Array} peaks - The waveform peak data from AudioProcessingUtils.
 * @param {number} width - The width of the waveform visualization.
 * @param {number} height - The height of the waveform visualization.
 * @param {string} color - The color of the waveform.
 * @param {number} opacity - The opacity of the waveform.
 * @returns {Graphics} A Pixi.js Graphics object containing the waveform.
 */
export const createPixiWaveform = (peaks, width, height, color = '#3498db', opacity = 1) => {
    const waveformGraphics = new Graphics();
    
    if (!peaks || peaks.length === 0) {
        return waveformGraphics;
    }
    
    const colorHex = parseInt(color.replace('#', '0x'), 16);
    
    // Calculate the width of each segment
    const segmentWidth = width / peaks.length;
    
    // Begin filling the waveform
    waveformGraphics.beginFill(colorHex, opacity);
    
    // Draw the waveform
    for (let i = 0; i < peaks.length; i++) {
        const peak = peaks[i];
        const x = i * segmentWidth;
        
        // Calculate the height of this segment
        const segmentHeight = (peak.max - peak.min) * height;
        
        // Draw a rectangle for this segment
        waveformGraphics.drawRect(
            x,
            height / 2 - segmentHeight / 2,
            segmentWidth,
            segmentHeight
        );
    }
    
    waveformGraphics.endFill();
    
    return waveformGraphics;
};

/**
 * Updates an existing Pixi.js waveform graphics object.
 * 
 * @param {Graphics} waveformGraphics - The existing waveform graphics object to update.
 * @param {Array} peaks - The new waveform peak data.
 * @param {number} width - The new width of the waveform visualization.
 * @param {number} height - The new height of the waveform visualization.
 * @param {string} color - The new color of the waveform.
 * @param {number} opacity - The new opacity of the waveform.
 */
export const updatePixiWaveform = (waveformGraphics, peaks, width, height, color = '#3498db', opacity = 1) => {
    // Clear the existing graphics
    waveformGraphics.clear();
    
    if (!peaks || peaks.length === 0) {
        return;
    }
    
    const colorHex = parseInt(color.replace('#', '0x'), 16);
    
    // Calculate the width of each segment
    const segmentWidth = width / peaks.length;
    
    // Begin filling the waveform
    waveformGraphics.beginFill(colorHex, opacity);
    
    // Draw the updated waveform
    for (let i = 0; i < peaks.length; i++) {
        const peak = peaks[i];
        const x = i * segmentWidth;
        
        // Calculate the height of this segment
        const segmentHeight = (peak.max - peak.min) * height;
        
        // Draw a rectangle for this segment
        waveformGraphics.drawRect(
            x,
            height / 2 - segmentHeight / 2,
            segmentWidth,
            segmentHeight
        );
    }
    
    waveformGraphics.endFill();
};