import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AmbientEnvironment, UserPreferences } from '@/types';

interface PreferencesStore extends UserPreferences {
  selectedTrackId: string | null;
  fontFamily: string;
  textSize: string;
  typingSpeed: string;
  voiceVolume: number;
  autoPlayVoice: boolean;
  typingSoundEnabled: boolean;
  setAmbient: (env: AmbientEnvironment | string) => void;
  setReducedMotion: (v: boolean) => void;
  setMusicEnabled: (v: boolean) => void;
  setMusicVolume: (v: number) => void;
  setSelectedTrack: (id: string | null) => void;
  setFontFamily: (v: string) => void;
  setTextSize: (v: string) => void;
  setTypingSpeed: (v: string) => void;
  setVoiceVolume: (v: number) => void;
  setAutoPlayVoice: (v: boolean) => void;
  setTypingSoundEnabled: (v: boolean) => void;
}

export const usePreferences = create<PreferencesStore>()(
  persist(
    (set) => ({
      ambient: 'night',
      reducedMotion: false,
      musicEnabled: false,
      musicVolume: 40,
      voiceVolume: 80,
      selectedTrackId: null,
      fontFamily: 'serif',
      textSize: 'medium',
      typingSpeed: 'normal',
      autoPlayVoice: true,
      typingSoundEnabled: true,
      setAmbient: (ambient) => set({ ambient: ambient as AmbientEnvironment }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setMusicEnabled: (musicEnabled) => set({ musicEnabled }),
      setMusicVolume: (musicVolume) => set({ musicVolume }),
      setSelectedTrack: (selectedTrackId) => set({ selectedTrackId }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setTextSize: (textSize) => set({ textSize }),
      setTypingSpeed: (typingSpeed) => set({ typingSpeed }),
      setVoiceVolume: (voiceVolume) => set({ voiceVolume }),
      setAutoPlayVoice: (autoPlayVoice) => set({ autoPlayVoice }),
      setTypingSoundEnabled: (typingSoundEnabled) => set({ typingSoundEnabled }),
    }),
    { name: 'scruttin-preferences' }
  )
);
