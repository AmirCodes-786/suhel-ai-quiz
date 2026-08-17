import React, { createContext, useContext, useState } from 'react';
import { sounds } from '../utils/soundEffects';

const SoundContext = createContext();

export function SoundProvider({ children }) {
  const [muted, setMuted] = useState(false);

  const play = (soundName, ...args) => {
    if (muted) return;
    if (sounds[soundName]) {
      sounds[soundName](...args);
    }
  };

  const toggleMute = () => {
    setMuted(prev => !prev);
  };

  return (
    <SoundContext.Provider value={{ muted, toggleMute, play }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  return useContext(SoundContext);
}
