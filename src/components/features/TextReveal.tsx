import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { usePreferences } from '@/stores/preferencesStore';
import { cn } from '@/lib/utils';

interface Props {
  text: string;
  onComplete?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

// Average delay between characters. The normal setting is deliberately calm,
// so text reads like a person typing rather than a loading animation.
const SPEED_MAP: Record<string, number> = {
  slow: 85,
  normal: 48,
  fast: 24,
  instant: 0,
};

// Singleton audio manager so the same sound doesn't overlap itself
let typingAudio: HTMLAudioElement | null = null;
let typingSoundUrl: string | null = null;
let typingSoundEnabled = true;

export function setTypingSoundUrl(url: string | null) {
  typingSoundUrl = url;
}
export function setTypingSoundEnabled(enabled: boolean) {
  typingSoundEnabled = enabled;
}

function playTypingTick() {
  if (!typingSoundEnabled || !typingSoundUrl) return;
  if (!typingAudio || typingAudio.src !== new URL(typingSoundUrl, window.location.href).href) {
    typingAudio?.pause();
    typingAudio = new Audio(typingSoundUrl);
    typingAudio.preload = 'auto';
    typingAudio.volume = 0.25;
  }
  // Only replay if not already playing (avoids overlap)
  if (typingAudio.paused || typingAudio.ended) {
    typingAudio.currentTime = 0;
    typingAudio.play().catch(() => {});
  }
}

function stopTypingSound() {
  if (typingAudio && !typingAudio.paused) {
    typingAudio.pause();
    typingAudio.currentTime = 0;
  }
}

export default function TextReveal({ text, onComplete, className, style }: Props) {
  const { reducedMotion, typingSpeed } = usePreferences();
  const characters = useMemo(() => Array.from(text), [text]);
  const [visibleCount, setVisibleCount] = useState(reducedMotion ? characters.length : 0);
  const [complete, setComplete] = useState(reducedMotion);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const interval = SPEED_MAP[typingSpeed ?? 'normal'] ?? SPEED_MAP.normal;

  const revealAll = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    stopTypingSound();
    setVisibleCount(characters.length);
    setComplete(true);
    onComplete?.();
  }, [characters.length, onComplete]);

  useEffect(() => {
    if (reducedMotion || interval === 0) {
      stopTypingSound();
      setVisibleCount(characters.length);
      setComplete(true);
      onComplete?.();
      return;
    }

    setVisibleCount(0);
    setComplete(false);

    let cancelled = false;
    const typeNextCharacter = (currentCount: number) => {
      if (cancelled) return;
      const nextCount = currentCount + 1;
      setVisibleCount(nextCount);
      if (characters[currentCount] !== ' ') playTypingTick();

      if (nextCount >= characters.length) {
        stopTypingSound();
        setComplete(true);
        onComplete?.();
        return;
      }

      const previousCharacter = characters[currentCount];
      const punctuationPause = /[,.!?;:]/.test(previousCharacter) ? interval * 3 : 0;
      timeoutRef.current = setTimeout(
        () => typeNextCharacter(nextCount),
        interval + punctuationPause,
      );
    };

    const startTimer = setTimeout(() => typeNextCharacter(0), 200);

    return () => {
      cancelled = true;
      clearTimeout(startTimer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      stopTypingSound();
    };
  }, [text, reducedMotion, interval, characters]);

  const visibleText = characters.slice(0, visibleCount).join('');
  const hiddenText = characters.slice(visibleCount).join('');

  return (
    <p
      className={cn('leading-relaxed cursor-pointer select-none', className)}
      style={style}
      onClick={complete ? undefined : revealAll}
      title={complete ? undefined : 'Tap to show full text'}
    >
      <span>{visibleText}</span>
      {!complete && visibleCount > 0 && (
        <span className="inline-block w-0.5 h-[1em] bg-white/70 ml-0.5 align-middle cursor-blink" />
      )}
      {!complete && (
        <span className="invisible select-none">{hiddenText}</span>
      )}
    </p>
  );
}
