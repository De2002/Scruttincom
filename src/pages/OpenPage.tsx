import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchFirestoreOpenScruts } from '@/lib/firestoreService';
import { usePreferences } from '@/stores/preferencesStore';
import TextReveal from '@/components/features/TextReveal';
import VoiceScrutCard from '@/components/features/VoiceScrutCard';
import UserAvatar from '@/components/features/UserAvatar';
import AtmosphereControls from '@/components/layout/AtmosphereControls';
import ComposeModal from '@/components/features/ComposeModal';
import ScrutDetailSheet from '@/components/features/ScrutDetailSheet';
import ResonatesButton from '@/components/features/ResonatesButton';
import ReportModal from '@/components/features/ReportModal';
import { cn, timeAgo } from '@/lib/utils';
import { Flag, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { Scrut } from '@/types';

const TUTORIAL_KEY = 'scruttin_open_swipe_seen';
const SWIPE_THRESHOLD = 52;

type Phase = 'idle' | 'exiting' | 'entering';

const COUNTRY_ISO: Record<string, string> = {
  Nigeria:'ng', Brazil:'br', UK:'gb', 'United Kingdom':'gb', Ghana:'gh', Japan:'jp',
  Italy:'it', India:'in', Mexico:'mx', Morocco:'ma', Germany:'de', USA:'us',
  'United States':'us', China:'cn', France:'fr', Spain:'es', Canada:'ca',
  Australia:'au', Argentina:'ar', 'South Africa':'za', Kenya:'ke', Egypt:'eg',
  Turkey:'tr', Indonesia:'id', Pakistan:'pk', Bangladesh:'bd', Philippines:'ph',
  Vietnam:'vn', Iran:'ir', Thailand:'th', Ethiopia:'et', Tanzania:'tz',
  Colombia:'co', Chile:'cl', Peru:'pe', Venezuela:'ve', Ecuador:'ec', Bolivia:'bo',
  Sweden:'se', Norway:'no', Denmark:'dk', Finland:'fi', Netherlands:'nl',
  Belgium:'be', Switzerland:'ch', Austria:'at', Poland:'pl', Portugal:'pt',
  Greece:'gr', Ukraine:'ua', Russia:'ru', 'South Korea':'kr', 'Saudi Arabia':'sa',
  UAE:'ae', 'United Arab Emirates':'ae', Uganda:'ug', Rwanda:'rw', Senegal:'sn',
};

function getMapUrl(country: string | undefined) {
  if (!country) return null;
  const iso = COUNTRY_ISO[country];
  return iso ? `https://raw.githubusercontent.com/djaiss/mapsicon/master/all/${iso}/256.png` : null;
}

function mapUser(p: Record<string, unknown>) {
  return {
    id: (p.id as string) ?? '',
    display_name: (p.display_name as string) ?? 'Anonymous',
    avatar_url: (p.avatar_url as string) ?? '',
    country: (p.country as string) ?? '',
    city: p.city as string | undefined,
    bio: p.bio as string | undefined,
    website: p.website as string | undefined,
    twitter: p.twitter as string | undefined,
    instagram: p.instagram as string | undefined,
  };
}

export default function OpenPage() {
  const { user } = useAuth();
  const [scruts, setScruts] = useState<Scrut[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [composeOpen, setComposeOpen] = useState(false);
  const [detailScrut, setDetailScrut] = useState<Scrut | null>(null);
  const [reportScrut, setReportScrut] = useState<Scrut | null>(null);
  const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem(TUTORIAL_KEY));
  const [tutorialVisible, setTutorialVisible] = useState(true);

  const { autoPlayVoice } = usePreferences();

  const touchStartY = useRef(0);
  const isTouchTracking = useRef(false);
  const mouseStartY = useRef(0);
  const isDragging = useRef(false);
  const advancing = useRef(false);

  const loadScruts = async () => {
    setLoading(true);
    const data = await fetchFirestoreOpenScruts(user?.id);
    setScruts(data);
    setLoading(false);
  };

  useEffect(() => { loadScruts(); }, [user]);

  useEffect(() => {
    if (!showTutorial) return;
    const timer = setTimeout(() => setTutorialVisible(false), 4000);
    return () => clearTimeout(timer);
  }, [showTutorial]);

  const advance = useCallback(() => {
    if (advancing.current) return;
    advancing.current = true;
    if (showTutorial) {
      setShowTutorial(false);
      setTutorialVisible(false);
      localStorage.setItem(TUTORIAL_KEY, '1');
    }
    setPhase('exiting');
    setTimeout(() => {
      setIndex(prev => (prev + 1) % Math.max(1, scruts.length));
      setPhase('entering');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        setPhase('idle');
        advancing.current = false;
      }));
    }, 380);
  }, [showTutorial, scruts.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    const target = e.target instanceof Element ? e.target : null;
    if (
      target?.closest('[data-atmosphere-controls], [data-no-swipe], button, a, input, textarea, select') ||
      touch.clientY <= 90
    ) {
      isTouchTracking.current = false;
      return;
    }
    isTouchTracking.current = true;
    touchStartY.current = touch.clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!isTouchTracking.current) return;
    isTouchTracking.current = false;
    const target = e.target instanceof Element ? e.target : null;
    if (target?.closest('[data-atmosphere-controls], [data-no-swipe], button, a, input, textarea, select')) {
      return;
    }
    if (!e.changedTouches || e.changedTouches.length === 0) return;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (dy < -SWIPE_THRESHOLD) advance();
  };

  const onMouseDown = (e: React.MouseEvent) => {
    const target = e.target instanceof Element ? e.target : null;
    if (
      target?.closest('[data-atmosphere-controls], [data-no-swipe], button, a, input, textarea, select') ||
      e.clientY <= 90
    ) {
      isDragging.current = false;
      return;
    }
    mouseStartY.current = e.clientY;
    isDragging.current = true;
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const target = e.target instanceof Element ? e.target : null;
    if (target?.closest('[data-atmosphere-controls], [data-no-swipe], button, a, input, textarea, select')) {
      return;
    }
    const dy = e.clientY - mouseStartY.current;
    if (dy < -SWIPE_THRESHOLD) advance();
  };

  const contentAnim = cn(
    phase === 'exiting' && 'scrut-exit-up',
    phase === 'entering' && 'scrut-enter-below',
    phase === 'idle' && 'opacity-100 translate-y-0',
  );

  const scrut = scruts[index];

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      style={{ userSelect: 'none', cursor: 'default' }}
    >
      {/* Top controls */}
      <div
        className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5 pt-safe pt-4 select-none"
        data-no-swipe
        data-atmosphere-controls
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-white/20 text-[11px] font-medium tracking-widest uppercase">Open</span>
        <AtmosphereControls />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center gap-3 text-white/30">
          <Loader2 size={20} className="animate-spin opacity-30" />
          <span className="text-xs">Loading…</span>
        </div>
      ) : scruts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 text-white/30 px-8 text-center">
          <p className="text-3xl">🎙</p>
          <p className="font-medium text-white/40 text-sm">No ruts here yet</p>
          <p className="text-xs">Be the first — tap Drop a Rut below</p>
        </div>
      ) : scrut ? (
        <div key={`${scrut.id}-${index}`} className={cn('w-full max-w-sm px-7 z-10', contentAnim)}>
          {/* Text scrut layout */}
          {scrut.type !== 'voice' && (
            <div className="mb-5 flex items-center gap-3">
              {/* Tappable avatar (profile sheet) */}
              <button
                type="button"
                data-no-swipe
                aria-label={`View ${scrut.user.display_name} profile`}
                className="pointer-events-auto cursor-pointer rounded-full transition-opacity hover:opacity-80 active:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 shrink-0"
                onClick={e => { e.stopPropagation(); setDetailScrut(scrut); }}
                onTouchEnd={e => { e.stopPropagation(); setDetailScrut(scrut); }}
              >
                <UserAvatar user={scrut.user} size="lg" shape="circle" />
              </button>

              <div className="flex-1 min-w-0 pb-0.5">
                <p className="text-white font-semibold text-[15px] leading-tight truncate">{scrut.user.display_name}</p>
                {(scrut.user.city || scrut.user.country) && (
                  <p className="mt-0.5 text-xs text-white/35 truncate">
                    {scrut.user.city ? `${scrut.user.city}, ${scrut.user.country}` : scrut.user.country}
                  </p>
                )}
              </div>

              {/* Country map — inline opposite avatar */}
              {getMapUrl(scrut.user.country) && (
                <img
                  src={getMapUrl(scrut.user.country)!}
                  alt={scrut.user.country}
                  aria-hidden
                  className="w-10 h-10 object-contain opacity-55 shrink-0 pointer-events-none select-none"
                />
              )}
            </div>
          )}

          {/* Text content */}
          {(scrut.type === 'text' || scrut.type === 'voice_text') && scrut.text && (
            <TextReveal
              text={scrut.text}
              className="text-white/88 text-[19px] font-serif leading-[1.72] tracking-[0.01em]"
            />
          )}

          {/* Voice */}
          {scrut.type === 'voice' && (
            <div className="py-4">
              <VoiceScrutCard
                duration={scrut.audio_duration ?? 30}
                user={scrut.user}
                scrutId={scrut.id}
                audioUrl={scrut.audio_url}
                autoPlay={autoPlayVoice}
              />
            </div>
          )}

          {/* Bottom row: resonate + time + report */}
          <div className="mt-6 flex items-center justify-between" data-no-swipe>
            <ResonatesButton
              scrutId={scrut.id}
              initialCount={scrut.resonate_count ?? 0}
              initialResonated={scrut.resonated_by_me ?? false}
              size="lg"
            />
            <div className="flex items-center gap-3">
              <span className="text-white/35 text-[12px]">{timeAgo(scrut.created_at)}</span>
              {user && (
                <button
                  data-no-swipe
                  onClick={e => { e.stopPropagation(); setReportScrut(scrut); }}
                  onTouchEnd={e => { e.stopPropagation(); setReportScrut(scrut); }}
                  className="pointer-events-auto p-2 text-white/30 hover:text-rose-400/80 transition-colors rounded-lg"
                  aria-label="Report"
                >
                  <Flag size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Tutorial hint */}
      {showTutorial && scruts.length > 0 && (
        <div className={cn('absolute bottom-28 left-0 right-0 flex flex-col items-center gap-1.5 z-20 pointer-events-none transition-opacity duration-700', tutorialVisible ? 'opacity-60' : 'opacity-0')}>
          <span className="text-white text-base" style={{ animation: 'tutorialBob 1.8s ease-in-out infinite' }}>↑</span>
          <p className="text-white/55 text-[11px] tracking-widest uppercase font-medium">Swipe for next Rut</p>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setComposeOpen(true)}
        onMouseDown={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        data-no-swipe
        className="absolute bottom-24 right-5 z-30 glass border border-white/10 rounded-full px-4 h-10 text-white/50 hover:text-white/80 font-semibold text-sm transition-all duration-200 hover:border-white/20"
      >
        Drop a Rut
      </button>

      {/* Progress dots */}
      {scruts.length > 1 && (
        <div className="absolute bottom-[5.5rem] left-0 right-0 flex justify-center gap-1.5 z-20 pointer-events-none">
          {scruts.slice(0, Math.min(scruts.length, 12)).map((_, i) => (
            <span key={i} className={cn('rounded-full transition-all duration-300', i === index % 12 ? 'w-4 h-1 bg-white/50' : 'w-1 h-1 bg-white/15')} />
          ))}
        </div>
      )}

      {/* Modals — data-no-swipe prevents underlying swipe from firing */}
      {composeOpen && (
        <div data-no-swipe data-sheet-overlay>
          <ComposeModal onClose={() => setComposeOpen(false)} defaultMode="open" onPosted={() => setTimeout(loadScruts, 500)} />
        </div>
      )}
      {detailScrut && (
        <div data-no-swipe data-sheet-overlay>
          <ScrutDetailSheet scrut={detailScrut} onClose={() => setDetailScrut(null)} />
        </div>
      )}
      {reportScrut && (
        <div data-no-swipe data-sheet-overlay>
          <ReportModal scrutId={reportScrut.id} onClose={() => setReportScrut(null)} />
        </div>
      )}
    </div>
  );
}
