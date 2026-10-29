import { createContext, useContext } from 'react';

export const THEME_STORAGE_KEY = 'theme';

export const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} });

export const useTheme = () => useContext(ThemeContext);
