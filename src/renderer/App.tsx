import React, { useState, useEffect } from 'react';
import MainWindow from './components/MainWindow';
import Settings from './components/Settings';
import DeveloperMode from './components/DeveloperMode';
import QuickInput from './components/QuickInput';
import OCRResult from './components/OCRResult';
import { useThemeStore } from './stores/theme-store';

const App: React.FC = () => {
  const { initializeTheme } = useThemeStore();
  const [currentPath, setCurrentPath] = useState(() => {
    const path = window.location.hash.replace('#/', '').replace('#', '') || '';
    console.log('Initial path:', path, 'Hash:', window.location.hash);
    return path;
  });

  useEffect(() => {
    // Initialize theme on app start
    initializeTheme();
    
    const handleHashChange = () => {
      const path = window.location.hash.replace('#/', '').replace('#', '') || '';
      console.log('[ROUTER] Hash changed to:', path, 'Full hash:', window.location.hash);
      setCurrentPath(path);
    };

    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [initializeTheme]);
  
  // Route to appropriate component
  switch (currentPath) {
    case 'quick-input':
      return <QuickInput />;
    case 'settings':
      return <Settings />;
    case 'developer':
      return <DeveloperMode />;
    case 'ocr-result':
      return <OCRResult />;
    default:
      return <MainWindow />;
  }
};

export default App;