// src/Components/Tooltip.jsx
import React, { useState } from 'react';

const Tooltip = ({ children, text }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative flex items-center justify-center w-fit h-fit">
      {/* The element that triggers the tooltip */}
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>

      {/* The tooltip itself, conditionally rendered */}
      {isVisible && (
        <div
          className=" h-fit w-fit
            absolute left-full ml-2 px-3 py-1 bg-gray-900 text-white text-sm
            whitespace-nowrap rounded-md shadow-lg z-20
            transform -translate-y-1/2 top-1/2
            transition-opacity duration-200 opacity-100
          "
        >
          {text}
        </div>
      )}
    </div>
  );
};

export default Tooltip;