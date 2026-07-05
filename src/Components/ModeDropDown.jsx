// src/Components/ModeDropdown.jsx
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, PencilLine, Edit, Film } from 'lucide-react'; // Icons for modes

const ModeDropdown = ({ currentMode, setMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  console.log("ModeDropdown: currentMode prop =", currentMode, "setMode prop type =", typeof setMode); // ADDED LOG

  const modes = [
    { name: 'Draw', icon: PencilLine },
    { name: 'Edit', icon: Edit },
  ];

  const toggleDropdown = () => {
    setIsOpen(prev => !prev);
  };

  const handleModeSelect = (modeName) => {
    console.log("ModeDropdown: handleModeSelect called with", modeName); // ADDED LOG
    setMode(modeName.toLowerCase()); // Set mode to lowercase string 'draw', 'edit', 'movie'
    setIsOpen(false); // Close dropdown after selection
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const ActiveModeIcon = modes.find(m => m.name.toLowerCase() === currentMode)?.icon || PencilLine; // Default icon if mode not found

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center space-x-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white"
      >
        <ActiveModeIcon size={18} /> {/* Display icon of active mode */}
        <span>{currentMode.charAt(0).toUpperCase() + currentMode.slice(1)}</span> {/* Display active mode name */}
        <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 h-fit mt-2 w-fit bg-gray-800 border border-gray-600 rounded shadow-lg z-10">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isActive = mode.name.toLowerCase() === currentMode;
            return (
              <button
                key={mode.name}
                onClick={() => handleModeSelect(mode.name)}
                className={`flex items-center w-full px-4 py-2 rounded bg-gray-800 text-left hover:bg-gray-600 ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-200'
                }`}
              >
                <Icon size={18} className="mr-2" />
                {mode.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ModeDropdown;
