// src/Hooks/usePixiTextTool.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { Text, TextStyle } from 'pixi.js';

const usePixiTextTool = (
    pixiAppRef,
    textProperties,
    setActiveStrokes,
    redrawAllStrokes,
    drawAllStrokesToBackground
) => {
    const [isTypingText, setIsTypingText] = useState(false);
    const [textInputPosition, setTextInputPosition] = useState({ x: 0, y: 0 });
    const [currentTextInput, setCurrentTextInput] = useState('');
    const textInputRef = useRef(null);

    const commitText = useCallback(() => {
        if (!currentTextInput.trim() || !isTypingText) {
            setIsTypingText(false);
            setCurrentTextInput('');
            redrawAllStrokes(true);
            return;
        }

        if (!pixiAppRef.current) return;

        // Create a Pixi.js Text object
        const style = new TextStyle({
            fontFamily: textProperties.fontFamily,
            fontSize: textProperties.size,
            fill: textProperties.color,
            align: textProperties.textAlign,
            dropShadow: textProperties.shadowBlur > 0,
            dropShadowColor: textProperties.shadowColor,
            dropShadowBlur: textProperties.shadowBlur,
            dropShadowDistance: {
                x: textProperties.shadowOffsetX,
                y: textProperties.shadowOffsetY
            },
            dropShadowAlpha: textProperties.opacity
        });

        const pixiText = new Text(currentTextInput, style);
        pixiText.position.set(textInputPosition.x, textInputPosition.y);
        pixiText.alpha = textProperties.opacity;

        // Create a text stroke object
        const newTextElement = {
            toolType: 'text',
            id: crypto.randomUUID(),
            text: currentTextInput,
            x: textInputPosition.x,
            y: textInputPosition.y,
            pixiText: pixiText,
            color: textProperties.color,
            size: textProperties.size,
            opacity: textProperties.opacity,
            fontFamily: textProperties.fontFamily,
            textAlign: textProperties.textAlign,
            shadowBlur: textProperties.shadowBlur,
            shadowColor: textProperties.shadowColor,
            shadowOffsetX: textProperties.shadowOffsetX,
            shadowOffsetY: textProperties.shadowOffsetY,
        };

        // Add the new text element to the active layer's strokes
        setActiveStrokes(prevStrokes => [...prevStrokes, newTextElement]);

        // Update canvas
        drawAllStrokesToBackground();
        redrawAllStrokes(true);

        // Reset text tool state
        setIsTypingText(false);
        setCurrentTextInput('');
    }, [
        currentTextInput,
        isTypingText,
        textInputPosition,
        textProperties,
        pixiAppRef,
        setActiveStrokes,
        redrawAllStrokes,
        drawAllStrokesToBackground
    ]);

    const handleTextInputKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            commitText();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setIsTypingText(false);
            setCurrentTextInput('');
            redrawAllStrokes(true);
        }
    }, [commitText, redrawAllStrokes]);

    useEffect(() => {
        if (isTypingText && textInputRef.current) {
            textInputRef.current.focus();
            const length = currentTextInput.length;
            textInputRef.current.setSelectionRange(length, length);
        }
    }, [isTypingText, currentTextInput]);

    return {
        isTypingText,
        textInputPosition,
        currentTextInput,
        setCurrentTextInput,
        setTextInputPosition,
        setIsTypingText,
        commitText,
        handleTextInputKeyDown,
        textInputRef,
    };
};

export default usePixiTextTool;