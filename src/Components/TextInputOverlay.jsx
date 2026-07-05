// src/Components/TextInputOverlay.jsx
import React, { useEffect } from 'react';

/**
 * TextInputOverlay Component: Renders the textarea overlay for text input.
 * It's responsible for the visual display and direct interaction with the text input field.
 *
 * @param {object} props - Component props.
 * @param {React.RefObject<HTMLTextAreaElement>} props.textInputRef - Ref to attach to the textarea DOM element.
 * @param {boolean} props.isTypingText - Controls visibility of the textarea.
 * @param {{x: number, y: number}} props.textInputPosition - Position (left, top) of the textarea.
 * @param {string} props.currentTextInput - The current value of the textarea.
 * @param {Function} props.setCurrentTextInput - Callback to update the text value.
 * @param {object} props.textProperties - Object containing text styling properties (color, size, font, etc.).
 * @param {Function} props.commitText - Callback to commit the text to the canvas as a stroke.
 * @param {Function} props.handleTextInputKeyDown - Keydown handler for the textarea.
 */
const TextInputOverlay = ({
  textInputRef,
  isTypingText,
  textInputPosition,
  currentTextInput,
  setCurrentTextInput,
  textProperties,
  commitText,
  handleTextInputKeyDown,
  isVisible // add this new prop
}) => {

  // Effect to focus the text input when it becomes active
  useEffect(() => {
    if (isTypingText && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [isTypingText, textInputRef]);

  if (!isTypingText) {
    return null; // Don't render if not in typing mode
  }

  return (
    <textarea
      ref={textInputRef}
      value={currentTextInput}
      onChange={(e) => setCurrentTextInput(e.target.value)}
      onBlur={commitText} // Commit text when textarea loses focus
      onKeyDown={handleTextInputKeyDown} // Handle Enter/Escape keys
      style={{
        position: 'absolute',
        left: textInputPosition.x,
        top: textInputPosition.y,
        color: textProperties.color,
        fontSize: `${textProperties.size}px`,
        fontFamily: textProperties.fontFamily,
        lineHeight: `${textProperties.size * 1.2}px`, // Adjust line height for better appearance
        textAlign: textProperties.textAlign,
        backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent background
        border: '1px solid #ccc',
        padding: '2px',
        resize: 'none', // Prevent manual resizing by user
        overflow: 'hidden', // Hide scrollbars
        minWidth: '50px', // Ensure a minimum size
        minHeight: '20px',
        zIndex: 10, // Ensure it appears above canvas
      }}
       className={`text-input-overlay ${isVisible ? 'visible' : 'hidden'}`} // Add a class for potential external styling
    />
  );
};

export default TextInputOverlay;
