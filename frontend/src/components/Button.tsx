import React from 'react';

const Button: React.FC<{ onClick: () => void, children: React.ReactNode, disabled: false }> = ({ onClick, children, disabled }) => {
    return (
        <button
            className="px-12 md:px-20 py-3 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg shadow-md transition duration-300 text-lg"
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
}

export default Button;
