/**
 * MusicPlayer — global background audio player.
 * - Smooth duck (lower) when voice scrut plays, restore when done.
 * - Supports personal:URL tracks from preferences store.
 * - Exposes a global event bus for voice start/end so VoiceScrutCard can trigger ducking.
 */
import { useEffect, useRef, useCallback } from 'react';
import { usePreferences } from '@/stores/preferencesStore';

interface Track {
  id: string;
  title: string;
  artist?: string;
  url: string;
}

interface Props {
  tracks: Track[];
}

// Global event target for voice playback notification
export const voicePlaybackBus = new EventTarget();
export function notifyVoiceStart() { voicePlaybackBus.dispatchEvent(new Event('voice-start')); }
export function notifyVoiceEnd() { voicePlaybackBus.dispatchEvent(new Event('voice-end')); }

export default function MusicPlayer({ tracks }: Props) {
  const { musicEnabled, musicVolume, selectedTrackId } = usePreferences();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);
  const voiceActiveRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);

  // Determine playback URL
  const getUrl = useCallback(() => {
    if (!musicEnabled) return null;
    if (selectedTrackId?.startsWith('personal:')) {
      return selectedTrackId.replace('personal:', '');
    }
    if (!tracks.length) return null;
    const track = tracks.find(t => t.id === selectedTrackId) ?? tracks[0];
    return track?.url ?? null;
  }, [tracks, selectedTrackId, musicEnabled]);

  // Smooth volume ramp
  const rampVolume = useCallback((targetVol: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const startVol = audio.volume;
    const diff = targetVol - startVol;
    const steps = 20;
    let step = 0;

    const tick = () => {
      step++;
      const audio = audioRef.current;
      if (!audio) return;
      audio.volume = Math.max(0, Math.min(1, startVol + diff * (step / steps)));
      if (step < steps) animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  // Manage playback when deps change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const url = getUrl();

    if (!url) {
      audio.pause();
      currentUrlRef.current = null;
      return;
    }

    if (url !== currentUrlRef.current) {
      audio.src = url;
      audio.loop = true;
      currentUrlRef.current = url;
    }

    audio.play().catch(() => {});
    const target = voiceActiveRef.current ? Math.min((musicVolume / 100) * 0.12, 0.12) : musicVolume / 100;
    rampVolume(target);
  }, [musicEnabled, selectedTrackId, tracks, getUrl, musicVolume, rampVolume]);

  // Listen for voice start/end events
  useEffect(() => {
    const onVoiceStart = () => {
      voiceActiveRef.current = true;
      const target = Math.min((musicVolume / 100) * 0.12, 0.12);
      rampVolume(target);
    };
    const onVoiceEnd = () => {
      voiceActiveRef.current = false;
      rampVolume(musicVolume / 100);
    };
    voicePlaybackBus.addEventListener('voice-start', onVoiceStart);
    voicePlaybackBus.addEventListener('voice-end', onVoiceEnd);
    return () => {
      voicePlaybackBus.removeEventListener('voice-start', onVoiceStart);
      voicePlaybackBus.removeEventListener('voice-end', onVoiceEnd);
    };
  }, [musicVolume, rampVolume]);

  // Volume change without src change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || voiceActiveRef.current) return;
    rampVolume(musicVolume / 100);
  }, [musicVolume, rampVolume]);

  return <audio ref={audioRef} style={{ display: 'none' }} />;
}
