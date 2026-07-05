import React, { useRef, useEffect } from 'react';

/**
 * Renders an audio waveform on a canvas.
 * @param {object} props - The component props.
 * @param {Array<{min: number, max: number}>} props.peaks - The array of peak data for the waveform.
 * @param {string} [props.waveColor='rgba(209, 213, 219, 0.7)'] - The color of the waveform lines.
 * @param {string} [props.maskColor='rgba(75, 85, 99, 0.5)'] - The color of the progress mask.
 */
const AudioWaveform = ({ peaks, waveColor = 'rgba(209, 213, 219, 0.7)', maskColor = 'rgba(75, 85, 99, 0.5)' }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!peaks || peaks.length === 0 || !canvasRef.current) {
            return;
        }

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const parent = canvas.parentElement;

        if (!parent) return;
        
        const width = parent.clientWidth;
        const height = parent.clientHeight;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        context.scale(dpr, dpr);

        context.clearRect(0, 0, width, height);
        context.lineWidth = 1;
        context.strokeStyle = waveColor;
        context.beginPath();

        const halfHeight = height / 2;
        
        peaks.forEach((peak, index) => {
            const x = index;
            const yMin = (peak.min * halfHeight) + halfHeight;
            const yMax = (peak.max * halfHeight) + halfHeight;
            
            context.moveTo(x, yMin);
            context.lineTo(x, yMax);
        });
        
        context.stroke();

    }, [peaks, waveColor, maskColor]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
    );
};

export default AudioWaveform;
