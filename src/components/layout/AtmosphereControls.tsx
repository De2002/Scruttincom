/**
 * AtmosphereControls — top-bar icon set:
 * - Atmosphere picker (opens portal bottom sheet/modal on document.body)
 * - Music toggle with playing rings and touch propagation guards
 *
 * Used in stream/dive/open/me pages header.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Settings2, X, Music2, Check, Sparkles, Palette } from 'lucide-react';
import { usePreferences } from '@/stores/preferencesStore';
import { AMBIENT_CONFIGS, COLOR_BACKGROUNDS } from '@/constants/ambients';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface CustomAtmosphere {
  id: string;
  label: string;
  emoji: string;
}

export default function AtmosphereControls() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'living' | 'colors'>('living');
  const { ambient, reducedMotion, setAmbient, setReducedMotion, musicEnabled, setMusicEnabled } = usePreferences();
  const [customAtmospheres, setCustomAtmospheres] = useState<CustomAtmosphere[]>([]);

  useEffect(() => {
    getDocs(query(collection(db, 'atmosphere_clips'), where('is_active', '==', true)))
      .then((snap) => {
        setCustomAtmospheres(snap.docs.map(d => ({
          id: d.id,
          label: (d.data().label as string) || '',
          emoji: (d.data().emoji as string) || '✨',
        })));
      })
      .catch((err) => {
        console.warn('Atmosphere clips fetch error:', err);
      });
  }, []);

  // Lock body scroll when atmosphere sheet is open on mobile/desktop
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  const livingAtmospheres = useMemo(() => [
    ...AMBIENT_CONFIGS,
    ...customAtmospheres.map((a) => ({
      id: a.id,
      label: a.label,
      emoji: a.emoji || '✨',
      videoUrl: '',
      overlayOpacity: 0.65,
      overlayColor: '10,10,10',
      accentColor: '#fff',
    })),
  ], [customAtmospheres]);

  const activeIsColor = ambient.startsWith('color-');

  // Automatically switch to correct tab when opening if currently active ambient is color
  useEffect(() => {
    if (open) {
      setTab(activeIsColor ? 'colors' : 'living');
    }
  }, [open, activeIsColor]);

  const handleStopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="flex items-center gap-1 shrink-0 select-none"
      data-atmosphere-controls
      data-no-swipe
      onTouchStart={handleStopPropagation}
      onTouchMove={handleStopPropagation}
      onTouchEnd={handleStopPropagation}
      onMouseDown={handleStopPropagation}
      onMouseMove={handleStopPropagation}
      onMouseUp={handleStopPropagation}
      onClick={handleStopPropagation}
    >
      {/* Music toggle button with touch isolation */}
      <button
        type="button"
        id="atmosphere-music-toggle-btn"
        onClick={(e) => {
          e.stopPropagation();
          setMusicEnabled(!musicEnabled);
        }}
        onTouchStart={handleStopPropagation}
        onTouchEnd={handleStopPropagation}
        onMouseDown={handleStopPropagation}
        onMouseUp={handleStopPropagation}
        className={cn(
          'relative flex items-center justify-center w-8 h-8 rounded-full transition-all touch-manipulation',
          musicEnabled
            ? 'text-white/85 bg-white/10 shadow-[0_0_12px_rgba(255,255,255,0.15)]'
            : 'text-white/30 hover:text-white/60 hover:bg-white/5'
        )}
        title={musicEnabled ? 'Music playing — tap to mute' : 'Music muted — tap to enable'}
        aria-label={musicEnabled ? 'Mute ambient music' : 'Enable ambient music'}
      >
        <Music2 size={15} />
        {musicEnabled && (
          <>
            <span
              className="absolute inset-0 rounded-full border border-white/25 animate-ping pointer-events-none"
              style={{ animationDuration: '2s' }}
            />
            <span
              className="absolute inset-[-3px] rounded-full border border-white/15 animate-ping pointer-events-none"
              style={{ animationDuration: '2.8s' }}
            />
          </>
        )}
      </button>

      {/* Atmosphere settings button */}
      <button
        type="button"
        id="atmosphere-open-settings-btn"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        onTouchStart={handleStopPropagation}
        onTouchEnd={handleStopPropagation}
        onMouseDown={handleStopPropagation}
        onMouseUp={handleStopPropagation}
        className="flex items-center gap-1.5 glass px-2.5 py-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all text-xs touch-manipulation active:scale-95"
        aria-label="Open atmosphere settings"
      >
        <Settings2 size={13} />
        <span className="hidden sm:inline font-medium">Atmosphere</span>
      </button>

      {/* Portal modal rendered directly onto document.body to prevent containing-block clipping */}
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[500] flex items-end justify-center sm:items-center p-0 sm:p-4 select-none"
            data-no-swipe
            data-atmosphere-controls
            onTouchStart={handleStopPropagation}
            onTouchMove={handleStopPropagation}
            onTouchEnd={handleStopPropagation}
            onMouseDown={handleStopPropagation}
            onMouseMove={handleStopPropagation}
            onMouseUp={handleStopPropagation}
            onClick={handleStopPropagation}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
              onClick={() => setOpen(false)}
            />

            {/* Bottom Sheet on Mobile / Centered Card on Desktop */}
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="atmosphere-title"
              className="relative z-10 w-full sm:max-w-md bg-[#0e0f17] border-t sm:border border-white/15 rounded-t-[28px] sm:rounded-3xl p-5 sm:p-6 max-h-[85dvh] sm:max-h-[82vh] flex flex-col shadow-[0_-15px_50px_rgba(0,0,0,0.8)] pb-[calc(1.75rem+env(safe-area-inset-bottom,20px))] animate-in slide-in-from-bottom-6 duration-200"
            >
              {/* Mobile pull indicator */}
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-3 shrink-0 sm:hidden" />

              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center text-white/80 border border-white/15">
                    <Settings2 size={15} />
                  </div>
                  <div>
                    <h3 id="atmosphere-title" className="text-white font-semibold text-base leading-tight">
                      Atmosphere
                    </h3>
                    <p className="text-white/40 text-[11px]">Customize your reading canvas</p>
                  </div>
                </div>
                <button
                  type="button"
                  id="atmosphere-close-btn"
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/45 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Category selector */}
              <div className="flex gap-1.5 p-1 bg-white/[0.04] border border-white/8 rounded-xl my-3 shrink-0">
                <button
                  type="button"
                  id="atmosphere-tab-living"
                  onClick={() => setTab('living')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all',
                    tab === 'living'
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-white/40 hover:text-white/70'
                  )}
                >
                  <Sparkles size={13} />
                  <span>Living Ambients</span>
                  <span className="text-[10px] opacity-60">({livingAtmospheres.length})</span>
                </button>
                <button
                  type="button"
                  id="atmosphere-tab-colors"
                  onClick={() => setTab('colors')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all',
                    tab === 'colors'
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-white/40 hover:text-white/70'
                  )}
                >
                  <Palette size={13} />
                  <span>Color Tones</span>
                  <span className="text-[10px] opacity-60">({COLOR_BACKGROUNDS.length})</span>
                </button>
              </div>

              {/* Scrollable Ambients Grid */}
              <div className="flex-1 overflow-y-auto overscroll-contain pr-0.5 space-y-3 min-h-0">
                {tab === 'living' ? (
                  <div className="grid grid-cols-3 gap-2">
                    {livingAtmospheres.map((cfg) => {
                      const isSelected = ambient === cfg.id;
                      return (
                        <button
                          key={cfg.id}
                          type="button"
                          id={`ambient-${cfg.id}`}
                          onClick={() => {
                            setAmbient(cfg.id as never);
                          }}
                          className={cn(
                            'relative flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl border transition-all duration-200 text-center active:scale-95 touch-manipulation',
                            isSelected
                              ? 'border-white/40 bg-white/15 text-white shadow-[0_0_15px_rgba(255,255,255,0.08)]'
                              : 'border-white/8 bg-white/[0.04] text-white/55 hover:bg-white/[0.08] hover:text-white/85'
                          )}
                        >
                          <span className="text-2xl leading-none">{cfg.emoji}</span>
                          <span className="text-[11px] font-medium tracking-tight truncate max-w-full">
                            {cfg.label}
                          </span>
                          {isSelected && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white text-black flex items-center justify-center shadow-sm">
                              <Check size={10} strokeWidth={3} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {COLOR_BACKGROUNDS.map((cfg) => {
                      const isSelected = ambient === cfg.id;
                      return (
                        <button
                          key={cfg.id}
                          type="button"
                          id={`ambient-${cfg.id}`}
                          onClick={() => {
                            setAmbient(cfg.id as never);
                          }}
                          className={cn(
                            'relative flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all duration-200 active:scale-95 touch-manipulation',
                            isSelected
                              ? 'border-white/40 bg-white/15 text-white shadow-[0_0_15px_rgba(255,255,255,0.08)]'
                              : 'border-white/8 bg-white/[0.04] text-white/55 hover:bg-white/[0.08] hover:text-white/85'
                          )}
                        >
                          <span
                            className="h-10 w-full rounded-xl border border-white/15 shadow-inner"
                            style={{ backgroundColor: `rgb(${cfg.overlayColor})` }}
                            aria-hidden="true"
                          />
                          <span className="text-[11px] font-medium tracking-tight truncate max-w-full">
                            {cfg.label}
                          </span>
                          {isSelected && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white text-black flex items-center justify-center shadow-sm">
                              <Check size={10} strokeWidth={3} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Toggles footer */}
              <div className="pt-3 mt-3 border-t border-white/10 space-y-2.5 shrink-0">
                {/* Background music toggle inside sheet */}
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <Music2 size={16} className={musicEnabled ? 'text-white' : 'text-white/40'} />
                    <div>
                      <p className="text-white/90 text-xs font-semibold">Background Music</p>
                      <p className="text-white/40 text-[10px]">Lo-fi ambient audio accompaniment</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    id="sheet-music-toggle-btn"
                    onClick={() => setMusicEnabled(!musicEnabled)}
                    className={cn(
                      'relative w-11 h-6 rounded-full transition-all duration-200 touch-manipulation',
                      musicEnabled ? 'bg-white/80' : 'bg-white/15'
                    )}
                    aria-label="Toggle background music"
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 w-5 h-5 rounded-full shadow-sm transition-all duration-200',
                        musicEnabled ? 'left-[22px] bg-black' : 'left-0.5 bg-white'
                      )}
                    />
                  </button>
                </div>

                {/* Reduce motion toggle */}
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-white/90 text-xs font-semibold">Reduce Motion</p>
                    <p className="text-white/40 text-[10px]">Disables typewriter reveals and transitions</p>
                  </div>
                  <button
                    type="button"
                    id="sheet-reduce-motion-btn"
                    onClick={() => setReducedMotion(!reducedMotion)}
                    className={cn(
                      'relative w-11 h-6 rounded-full transition-all duration-200 touch-manipulation',
                      reducedMotion ? 'bg-white/80' : 'bg-white/15'
                    )}
                    aria-label="Toggle reduce motion"
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 w-5 h-5 rounded-full shadow-sm transition-all duration-200',
                        reducedMotion ? 'left-[22px] bg-black' : 'left-0.5 bg-white'
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
