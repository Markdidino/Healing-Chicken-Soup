import React, { useState } from 'react';
import OilCanvas from './components/OilCanvas';
import Controls from './components/Controls';
import { Language } from './types';

const App: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [language, setLanguage] = useState<Language>(Language.ZH);
  const [gameId, setGameId] = useState(0);

  const handleStart = () => {
    // Increment gameId to force a re-render (reset) of the canvas
    setGameId(prev => prev + 1);
    setIsPlaying(true);
  };
  
  const handleHome = () => {
      setIsPlaying(false);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{backgroundColor: '#F8D568'}}>
      {/* Passing key={gameId} forces the component to remount when gameId changes */}
      <OilCanvas key={gameId} isPlaying={isPlaying} language={language} />
      
      <Controls 
        isPlaying={isPlaying} 
        onStart={handleStart} 
        onHome={handleHome}
        language={language}
        setLanguage={setLanguage}
      />
    </div>
  );
};

export default App;