import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const Logo = ({ className = "w-12 h-12" }) => {
    const { isDarkMode } = useTheme();

    return (
        <img
            src="/logo.png"
            alt="SwapSkillz"
            className={`${className} object-contain transition-transform duration-300 hover:scale-110 ${isDarkMode ? 'brightness-0 invert' : ''}`}
        />
    );
};

export default Logo;
