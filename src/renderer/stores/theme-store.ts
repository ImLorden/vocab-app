import { create } from 'zustand';

interface ThemeStore {
  theme: 'light' | 'dark' | 'auto';
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  initializeTheme: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: 'auto',
  effectiveTheme: 'light',

  setTheme: (theme) => {
    set({ theme });
    const effectiveTheme = theme === 'auto' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    set({ effectiveTheme });
    
    // Apply theme to document
    const html = document.documentElement;
    html.classList.remove('light', 'dark');
    html.classList.add(effectiveTheme);
    
    // Save to storage
    localStorage.setItem('theme', theme);
  },

  initializeTheme: () => {
    // Load saved theme from storage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' | null;
    const theme = savedTheme || 'auto';
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = () => {
      const { theme: currentTheme } = get();
      if (currentTheme === 'auto') {
        const effectiveTheme = mediaQuery.matches ? 'dark' : 'light';
        set({ effectiveTheme });
        
        // Apply to document
        const html = document.documentElement;
        html.classList.remove('light', 'dark');
        html.classList.add(effectiveTheme);
      }
    };

    set({ theme });
    mediaQuery.addEventListener('change', updateTheme);
    
    // Initial theme application
    const effectiveTheme = theme === 'auto' 
      ? (mediaQuery.matches ? 'dark' : 'light')
      : theme;
    set({ effectiveTheme });
    
    const html = document.documentElement;
    html.classList.remove('light', 'dark');
    html.classList.add(effectiveTheme);
  },
}));