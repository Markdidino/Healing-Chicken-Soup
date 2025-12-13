import React, { useState } from 'react';
import { Home } from 'lucide-react';
import { Language } from '../types';
import { TEXTS } from '../constants';

interface ControlsProps {
  isPlaying: boolean;
  onStart: () => void;
  onHome: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const Controls: React.FC<ControlsProps> = ({ 
  isPlaying, 
  onStart, 
  onHome,
  language, 
  setLanguage 
}) => {
  const [closing, setClosing] = useState(false);

  const handleStart = () => {
    setClosing(true);
    setTimeout(() => {
      onStart();
      setClosing(false); // Reset for next time
    }, 500); 
  };
  
  const handleHomeClick = () => {
      onHome();
  };

  const t = TEXTS[language];

  // Language Display Labels
  const langLabels: Record<Language, string> = {
    [Language.ZH]: "中",
    [Language.EN]: "EN"
  };

  if (isPlaying) {
      // Small controls in corners when playing
      return (
        <div className="absolute top-4 left-4 z-50">
             <button 
                onClick={handleHomeClick}
                className="p-3 bg-white/40 hover:bg-white/70 backdrop-blur-md rounded-full shadow-lg transition-all text-amber-900"
                title="Main Menu"
            >
                <Home size={24} />
            </button>
        </div>
      )
  }

  // Initial Overlay
  return (
    <div className={`absolute inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-500 ${closing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden">
        {/* Shiny effect on modal */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 opacity-80" />
        
        <h1 className="text-4xl font-bold text-amber-900 mb-6 drop-shadow-sm tracking-wide">
          {t.title}
        </h1>
        
        <div className="text-amber-950/80 text-lg leading-relaxed whitespace-pre-line mb-8 font-medium">
          {t.description}
        </div>

        <div className="flex justify-center gap-4 mb-8">
            {(Object.keys(Language) as Array<keyof typeof Language>).map((langKey) => (
                <button
                    key={langKey}
                    onClick={() => setLanguage(Language[langKey])}
                    className={`px-4 py-1 rounded-full text-base font-bold transition-all ${language === Language[langKey] ? 'bg-amber-500 text-white shadow-md' : 'bg-white/50 text-amber-800 hover:bg-amber-100'}`}
                >
                    {langLabels[Language[langKey]]}
                </button>
            ))}
        </div>

        <div className="flex items-center justify-center gap-4">
            <button
                onClick={handleStart}
                className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-xl font-bold rounded-full shadow-lg transform transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
                {t.startButton}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Controls;