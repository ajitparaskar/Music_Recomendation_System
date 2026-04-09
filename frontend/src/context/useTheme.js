import { useContext } from 'react';
import { ThemeContext } from './themeContext.js';

export const useTheme = () => useContext(ThemeContext);
