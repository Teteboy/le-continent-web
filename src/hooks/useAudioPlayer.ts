import { useState, useRef, useCallback, useEffect } from 'react';

export function useAudioPlayer() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  const playSound = useCallback((id: string, url: string | null) => {
    if (!url) return;

    // Toggle if same item
    if (playingId === id && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingId(null);
      return;
    }

    // Stop previous
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingId(id);

    audio.play().catch(() => setPlayingId(null));

    audio.onended = () => {
      audioRef.current = null;
      setPlayingId(null);
    };

    audio.onerror = () => {
      audioRef.current = null;
      setPlayingId(null);
    };
  }, [playingId]);

  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingId(null);
  }, []);

  return { playingId, playSound, stopSound };
}
