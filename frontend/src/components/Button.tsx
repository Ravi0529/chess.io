import React from 'react';

const Button: React.FC<{ onClick: () => void, children: React.ReactNode }> = ({ onClick, children }) => {
    return (
        <button
            className="px-12 md:px-20 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-md transition duration-300 text-lg"
            onClick={onClick}
        >
            {children}
        </button>
    );
}

export default Button;
