// src/Utils/PixiGridUtils.js
import { Graphics } from 'pixi.js';

/**
 * Creates a grid pattern using Pixi.js Graphics.
 *
 * @param {number} width - The width of the grid area.
 * @param {number} height - The height of the grid area.
 * @param {number} [gridSize=18] - The size of grid cells.
 * @param {string} [lineColor='#FFA500'] - The color of the grid lines (must be a hex string).
 * @param {number} [lineWidth=1.5] - The width of the grid lines.
 * @returns {Graphics} A Pixi.js Graphics object containing the grid.
 */
export const createPixiGrid = (width, height, gridSize = 18, lineColor = '#FFA500', lineWidth = 1.5) => {
    const gridGraphics = new Graphics();

    // Convert the hex string to a number for Pixi.js
    const color = parseInt(lineColor.replace('#', '0x'), 16);

    // Set the stroke style using the new v8 syntax
    gridGraphics.stroke({
        width: lineWidth,
        color: color,
        alpha: 0.5
    });

    // Draw vertical lines
    for (let x = 0; x <= width; x += gridSize) {
        gridGraphics.moveTo(x, 0);
        gridGraphics.lineTo(x, height);
    }

    // Draw horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
        gridGraphics.moveTo(0, y);
        gridGraphics.lineTo(width, y);
    }

    return gridGraphics;
};

/**
 * Updates an existing Pixi.js grid graphics object.
 *
 * @param {Graphics} gridGraphics - The existing grid graphics object to update.
 * @param {number} width - The new width of the grid area.
 * @param {number} height - The new height of the grid area.
 * @param {number} [gridSize=18] - The new size of grid cells.
 * @param {string} [lineColor='#FFA500'] - The new color of the grid lines (must be a hex string).
 * @param {number} [lineWidth=1.5] - The new width of the grid lines.
 */
export const updatePixiGrid = (gridGraphics, width, height, gridSize = 18, lineColor = '#FFA500', lineWidth = 1.5) => {
    // Clear the existing graphics
    gridGraphics.clear();

    // Convert the hex string to a number
    const color = parseInt(lineColor.replace('#', '0x'), 16);

    // Set the new stroke style
    gridGraphics.stroke({
        width: lineWidth,
        color: color,
        alpha: 0.5
    });

    // Draw new vertical lines
    for (let x = 0; x <= width; x += gridSize) {
        gridGraphics.moveTo(x, 0);
        gridGraphics.lineTo(x, height);
    }

    // Draw new horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
        gridGraphics.moveTo(0, y);
        gridGraphics.lineTo(width, y);
    }
};