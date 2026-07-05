// src/Components/ColorPickerComponent.jsx
import React, { useRef, useEffect, useContext, useCallback, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import ToolStateContext from '../context/ToolStateContext'; // Import ToolStateContext
// Removed: import { Pipette } from 'lucide-react'; // Eyedropper icon no longer needed

// --- Color Conversion Utilities (Internal to Component for now) ---
// Converts HEX to RGB array [r, g, b]
const hexToRgb = (hex) => {
  if (!hex || hex.length < 7) return [0, 0, 0];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
};

// Converts RGB to HEX string
const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map(x => {
    const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

// Converts RGB to HSL array [h, s, l] (h: 0-360, s/l: 0-1)
const rgbToHsl = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default: // Should not happen
        h = 0;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100]; // Convert h to 0-360, s/l to 0-100
};

// Converts HSL to RGB array [r, g, b] (h: 0-360, s/l: 0-100)
const hslToRgb = (h, s, l) => {
  h /= 360; // Convert h to 0-1
  s /= 100; // Convert s to 0-1
  l /= 100; // Convert l to 0-1

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};
// --- END Color Conversion Utilities ---


// Modified props: Removed canvasRef and contextRef
const ColorPickerComponent = ({ color, onChange, onClose }) => {
  const pickerRef = useRef(null);
  const { recentColors, addRecentColor } = useContext(ToolStateContext);

  // Removed: isEyedropperActive state as it's no longer used
  // const [isEyedropperActive, setIsEyedropperActive] = useState(false);

  // Internal states for the input fields
  const [hexInput, setHexInput] = useState(color.toUpperCase());
  const [rgbInput, setRgbInput] = useState(() => {
    const [r, g, b] = hexToRgb(color);
    return { r, g, b };
  });
  const [hslInput, setHslInput] = useState(() => {
    const [r, g, b] = hexToRgb(color);
    const [h, s, l] = rgbToHsl(r, g, b);
    return { h: Math.round(h), s: Math.round(s), l: Math.round(l) };
  });


  // Synchronize internal input states when the external 'color' prop changes
  useEffect(() => {
    if (color) {
      setHexInput(color.toUpperCase());
      const [r, g, b] = hexToRgb(color);
      setRgbInput({ r, g, b });
      const [h, s, l] = rgbToHsl(r, g, b);
      setHslInput({ h: Math.round(h), s: Math.round(s), l: Math.round(l) });
    }
  }, [color]);

  // Handler for when a color is selected (from picker or recent swatch)
  const handleColorChange = useCallback((newColor) => {
    // Only call onChange if the color is valid (e.g., not an empty string from input clearing)
    if (newColor && newColor.startsWith('#') && newColor.length >= 4) {
        onChange(newColor); // Call the original onChange handler passed from parent
        addRecentColor(newColor); // Add the new color to the recent colors list
    }
  }, [onChange, addRecentColor]);


  // Removed: Eyedropper logic (activateEyedropper, sampleColor, applyColorAndDeactivate, deactivateEyedropper)


  // Handlers for individual input fields
  const handleHexInputChange = useCallback((e) => {
    const newHex = e.target.value;
    setHexInput(newHex);
    // Basic validation for hex color (e.g., #RRGGBB or #RGB)
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(newHex)) {
      const [r, g, b] = hexToRgb(newHex);
      setRgbInput({ r, g, b });
      const [h, s, l] = rgbToHsl(r, g, b);
      setHslInput({ h: Math.round(h), s: Math.round(s), l: Math.round(l) });
      handleColorChange(newHex);
    }
  }, [handleColorChange]);

  const handleRgbInputChange = useCallback((axis, e) => {
    let value = parseInt(e.target.value, 10);
    // Clamp RGB values to 0-255
    value = isNaN(value) ? 0 : Math.max(0, Math.min(255, value));

    setRgbInput(prev => {
      const newRgb = { ...prev, [axis]: value };
      const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
      const [h, s, l] = rgbToHsl(newRgb.r, newRgb.g, newRgb.b);

      setHexInput(newHex.toUpperCase());
      setHslInput({ h: Math.round(h), s: Math.round(s), l: Math.round(l) });
      handleColorChange(newHex);
      return newRgb;
    });
  }, [handleColorChange]);

  const handleHslInputChange = useCallback((axis, e) => {
    let value = parseFloat(e.target.value);
    value = isNaN(value) ? 0 : value; // Allow temporary invalid input, convert to 0 if NaN

    setHslInput(prev => {
      const newHsl = { ...prev, [axis]: value };

      // Clamp HSL values to their valid ranges
      const clampedH = Math.max(0, Math.min(360, newHsl.h));
      const clampedS = Math.max(0, Math.min(100, newHsl.s));
      const clampedL = Math.max(0, Math.min(100, newHsl.l));

      const [r, g, b] = hslToRgb(clampedH, clampedS, clampedL);
      const newHex = rgbToHex(r, g, b);

      setHexInput(newHex.toUpperCase());
      setRgbInput({ r, g, b });
      handleColorChange(newHex);
      return newHsl;
    });
  }, [handleColorChange]);

  // Modified: handlePickerClose no longer needs eyedropper logic, simplified to just call onClose
  const handlePickerClose = useCallback(() => {
    onClose(); // Call the original onClose from parent
  }, [onClose]);


  return (
    <div
      ref={pickerRef}
      className="absolute z-50 mt-2 p-2 bg-gray-900 w-fit h-fit rounded shadow-lg"
    >
      <HexColorPicker color={color} onChange={handleColorChange} className="w-full h-full" />


      {/* HEX/RGB/HSL Input Fields */}
      <div className="mt-4 text-white text-sm grid grid-cols-1 gap-2">
        {/* HEX Input */}
        <div className="flex items-center space-x-2">
          <label htmlFor="hexInput" className="w-8 text-right font-semibold">HEX:</label>
          <input
            type="text"
            id="hexInput"
            value={hexInput}
            onChange={handleHexInputChange}
            className="flex-1 w-4 p-1 bg-gray-700 border border-gray-600 rounded text-center font-mono text-sm"
            maxLength="7" // e.g., #RRGGBB
          />
        </div>

        {/* RGB Inputs */}
        <div className="flex items-center space-x-2">
          <label className="w-8 text-right font-semibold">RGB:</label>
          <input
            type="number"
            value={rgbInput.r}
            onChange={(e) => handleRgbInputChange('r', e)}
            className="w-12 p-1 bg-gray-700 border border-gray-600 rounded text-center text-sm"
            min="0"
            max="255"
          />
          <input
            type="number"
            value={rgbInput.g}
            onChange={(e) => handleRgbInputChange('g', e)}
            className="w-12 p-1 bg-gray-700 border border-gray-600 rounded text-center text-sm"
            min="0"
            max="255"
          />
          <input
            type="number"
            value={rgbInput.b}
            onChange={(e) => handleRgbInputChange('b', e)}
            className="w-12 p-1 bg-gray-700 border border-gray-600 rounded text-center text-sm"
            min="0"
            max="255"
          />
        </div>

        {/* HSL Inputs */}
        <div className="flex items-center space-x-2">
          <label className="w-8 text-right font-semibold">HSL:</label>
          <input
            type="number"
            value={hslInput.h}
            onChange={(e) => handleHslInputChange('h', e)}
            className="w-12 p-1 bg-gray-700 border border-gray-600 rounded text-center text-sm"
            min="0"
            max="360"
          />
          <input
            type="number"
            value={hslInput.s}
            onChange={(e) => handleHslInputChange('s', e)}
            className="w-12 p-1 bg-gray-700 border border-gray-600 rounded text-center text-sm"
            min="0"
            max="100"
          />
          <input
            type="number"
            value={hslInput.l}
            onChange={(e) => handleHslInputChange('l', e)}
            className="w-12 p-1 bg-gray-700 border border-gray-600 rounded text-center text-sm"
            min="0"
            max="100"
          />
        </div>
      </div>


      {recentColors.length > 0 && (
        <div className="mt-4 pt-2 border-t border-gray-700">
          <h4 className="text-gray-300 text-sm mb-2 text-center">Recent Colors</h4>
          <div className="grid grid-cols-5 gap-2"> {/* Adjust grid-cols for desired layout */}
            {recentColors.map((rc, index) => (
              <div
                key={index} // Using index as key is generally okay for static lists or when order is stable
                className="w-6 h-6 rounded-full border border-gray-600 cursor-pointer transition-transform transform hover:scale-110"
                style={{ backgroundColor: rc }}
                onClick={() => handleColorChange(rc)} // Select recent color
                title={rc.toUpperCase()}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPickerComponent;
