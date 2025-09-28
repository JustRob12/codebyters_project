import { useRef, useCallback } from 'react';

export const useAudio = (audioSrc: string) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = useCallback(() => {
    try {
      // Create audio element if it doesn't exist
      if (!audioRef.current) {
        audioRef.current = new Audio(audioSrc);
        audioRef.current.preload = 'auto';
        audioRef.current.volume = 0.7; // Set volume to 70%
      }

      // Reset audio to beginning and play
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        console.warn('Audio playback failed:', error);
      });
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  }, [audioSrc]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  return { playAudio, stopAudio };
};
