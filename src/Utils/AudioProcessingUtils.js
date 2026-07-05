/**
 * A shared AudioContext instance to avoid creating multiple contexts.
 */
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

/**
 * Decodes an audio file into an AudioBuffer.
 * @param {File} audioFile - The audio file to process.
 * @returns {Promise<AudioBuffer>} A promise that resolves with the decoded AudioBuffer.
 */
const decodeAudioFile = (audioFile) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            audioContext.decodeAudioData(e.target.result, resolve, reject);
        };
        reader.onerror = (err) => {
            reject(new Error("FileReader error: " + err.message));
        };
        reader.readAsArrayBuffer(audioFile);
    });
};

/**
 * Processes an AudioBuffer to generate peak data for waveform visualization.
 * @param {AudioBuffer} audioBuffer - The decoded audio data.
 * @param {number} targetWidth - The target width in pixels for the waveform visualization. This determines the number of data points.
 * @returns {Array<{min: number, max: number}>} An array of objects, each containing the min and max amplitude for a segment of the audio.
 */
const generateWaveformPeaks = (audioBuffer, targetWidth) => {
    // Use the first channel of the audio data.
    const rawData = audioBuffer.getChannelData(0);
    const totalSamples = rawData.length;
    const pointsPerPixel = Math.floor(totalSamples / targetWidth);
    const peaks = [];

    for (let i = 0; i < targetWidth; i++) {
        const startIndex = i * pointsPerPixel;
        const endIndex = startIndex + pointsPerPixel;
        let minPeak = 0;
        let maxPeak = 0;

        for (let j = startIndex; j < endIndex; j++) {
            const sample = rawData[j];
            if (sample > maxPeak) {
                maxPeak = sample;
            }
            if (sample < minPeak) {
                minPeak = sample;
            }
        }
        peaks.push({ min: minPeak, max: maxPeak });
    }
    return peaks;
};


/**
 * Main utility function to generate waveform data from an audio file.
 * @param {File} audioFile - The user-selected audio file.
 * @param {number} targetWidth - The target width in pixels for the waveform.
 * @returns {Promise<Array<{min: number, max: number}>>} A promise that resolves with the waveform peak data.
 */
export const generateWaveform = async (audioFile, targetWidth) => {
    try {
        const audioBuffer = await decodeAudioFile(audioFile);
        const peaks = generateWaveformPeaks(audioBuffer, Math.floor(targetWidth));
        return peaks;
    } catch (error) {
        console.error("Error generating waveform:", error);
        // Return an empty array or re-throw the error as needed.
        return [];
    }
};

/**
 * Additional function for Pixi.js integration
 * Processes audio and creates a Pixi.js Graphics object for the waveform
 * 
 * @param {File} audioFile - The audio file to process.
 * @param {number} targetWidth - The target width for the waveform visualization.
 * @param {number} targetHeight - The target height for the waveform visualization.
 * @param {string} color - The color of the waveform.
 * @param {number} opacity - The opacity of the waveform.
 * @returns {Promise<{peaks: Array, graphics: Graphics}>} A promise that resolves with the waveform data and Pixi.js Graphics object.
 */
export const generatePixiWaveform = async (audioFile, targetWidth, targetHeight, color = '#3498db', opacity = 1) => {
    try {
        const peaks = await generateWaveform(audioFile, targetWidth);
        const graphics = createPixiWaveform(peaks, targetWidth, targetHeight, color, opacity);
        return { peaks, graphics };
    } catch (error) {
        console.error("Error generating Pixi.js waveform:", error);
        return { peaks: [], graphics: new Graphics() };
    }
};