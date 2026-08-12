import { create } from 'zustand';

interface PlayerState {
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  isPiP: boolean;
  isTheater: boolean;
  playbackSpeed: number;
  currentTime: number;
  duration: number;
  
  // Actions
  setIsPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  setIsMuted: (isMuted: boolean) => void;
  setIsFullscreen: (isFullscreen: boolean) => void;
  setIsPiP: (isPiP: boolean) => void;
  setIsTheater: (isTheater: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  
  // Voice Command Trigger (so components can subscribe)
  lastCommand: { tool: string; params: any; timestamp: number } | null;
  triggerCommand: (tool: string, params?: any) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  isPlaying: false,
  volume: 1,
  isMuted: false,
  isFullscreen: false,
  isPiP: false,
  isTheater: false,
  playbackSpeed: 1,
  currentTime: 0,
  duration: 0,
  lastCommand: null,

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume }),
  setIsMuted: (isMuted) => set({ isMuted }),
  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
  setIsPiP: (isPiP) => set({ isPiP }),
  setIsTheater: (isTheater) => set({ isTheater }),
  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  
  triggerCommand: (tool, params = {}) => set({
    lastCommand: { tool, params, timestamp: Date.now() }
  }),
}));
