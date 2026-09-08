import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pin, Share2, Plus } from 'lucide-react';
import { fetchFirestoreConversation, fetchFirestoreScrutsForConversation } from '@/lib/firestoreService';
import { useAuth } from '@/contexts/AuthContext';
import { cn, formatCount } from '@/lib/utils';
import { useStream } from '@/stores/streamContext';
import { usePreferences } from '@/stores/preferencesStore';
import ScrutCard from '@/components/features/ScrutCard';
import ScrutDetailSheet from '@/components/features/ScrutDetailSheet';
import ComposeModal from '@/components/features/ComposeModal';
import ShareModal from '@/components/features/ShareModal';
import AtmosphereControls from '@/components/layout/AtmosphereControls';
import type { ConversationStarter, Scrut } from '@/types';

const SWIPE_THRESHOLD = 52;
type Phase = 'idle' | 'exiting' | 'entering';

function mapUser(profile: Record<string, unknown>) {
  return {
    id: (profile.id as string) ?? '',
    display_name: (profile.display_name as string) ?? 'Anonymous',
    avatar_url: (profile.avatar_url as string) ?? '',
    country: (profile.country as string) ?? '',
    city: profile.city as string | undefined,
    bio: profile.bio as string | undefined,
    website: profile.website as string | undefined,
    twitter: profile.twitter as string | undefined,
    instagram: profile.instagram as string | undefined,
  };
}

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [composeOpen, setComposeOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [detailScrut, setDetailScrut] = useState<Scrut | null>(null);
  const [conversation, setConversation] = useState<ConversationStarter | null>(null);
  const [scruts, setScruts] = useState<Scrut[]>([]);
  const [loading, setLoading] = useState(true);
  const { pinned, togglePin } = useStream();
  const { autoPlayVoice } = usePreferences();

  const advancing = useRef(false);
  const touchStartY = useRef(0);
  const mouseStartY = useRef(0);
  const isDragging = useRef(false);
  const hasMoved = useRef(false);

  // Track the currently active scrut's id to force re-mount on advance (for autoplay)
  const currentScrutId = scruts[index]?.id;

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const [conv, scrutList] = await Promise.all([
      fetchFirestoreConversation(id),
      fetchFirestoreScrutsForConversation(id, user?.id),
    ]);

    if (conv) {
      setConversation(conv);
    }
    setScruts(scrutList);
    setLoading(false);
  }, [id, user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  // 30-second polling — refresh conversation counts + scruts without full reload
  useEffect(() => {
    if (!id) return;
    const timer = setInterval(async () => {
      const conv = await fetchFirestoreConversation(id);
      if (conv) {
        setConversation(conv);
      }
      const updatedScruts = await fetchFirestoreScrutsForConversation(id, user?.id);
      if (updatedScruts.length > 0) {
        setScruts(updatedScruts);
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [id, user?.id]);

  const isPinned = pinned.includes(conversation?.id ?? '');
  const scrut = scruts[index];

  const advance = useCallback(() => {
    if (advancing.current || scruts.length <= 1) return;
    advancing.current = true;
    setPhase('exiting');
    setTimeout(() => {
      setIndex(prev => (prev + 1) % scruts.length);
      setPhase('entering');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPhase('idle');
          advancing.current = false;
        });
      });
    }, 380);
  }, [scruts.length]);

  const onTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; hasMoved.current = false; };
  const onTouchMove = (e: React.TouchEvent) => { if (Math.abs(e.touches[0].clientY - touchStartY.current) > 8) hasMoved.current = true; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (!hasMoved.current || dy >= -SWIPE_THRESHOLD) return;
    advance();
  };
  const onMouseDown = (e: React.MouseEvent) => { mouseStartY.current = e.clientY; isDragging.current = true; hasMoved.current = false; };
  const onMouseMove = (e: React.MouseEvent) => { if (!isDragging.current) return; if (Math.abs(e.clientY - mouseStartY.current) > 8) hasMoved.current = true; };
  const onMouseUp = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const dy = e.clientY - mouseStartY.current;
    if (!hasMoved.current || dy >= -SWIPE_THRESHOLD) return;
    advance();
  };

  if (loading || !conversation) {
    return (
      <div className="flex items-center justify-center h-screen text-white/40">
        {loading ? (
          <img src="/favicon.png" alt="" className="w-8 h-8 opacity-30 animate-pulse" />
        ) : (
          <button onClick={() => navigate(-1)} className="text-white/60 hover:text-white flex items-center gap-2">
            <ArrowLeft size={16} /> Back
          </button>
        )}
      </div>
    );
  }

  const contentAnim = cn(
    phase === 'exiting' && 'scrut-exit-up',
    phase === 'entering' && 'scrut-enter-below',
    phase === 'idle' && 'opacity-100 translate-y-0',
  );

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden pb-16">
      {/* Compact detail toolbar; the conversation prompt is already represented by the Scrut card below. */}
      <div className="shrink-0 z-30 relative flex items-center justify-between px-4 pt-safe pt-3 pb-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-white/40 hover:text-white/80 transition-colors text-sm"
          onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}
        >
          <ArrowLeft size={15} /><span className="text-xs">Back</span>
        </button>
        <div className="flex items-center gap-2" onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
          <AtmosphereControls />
          <button
            id="conversation-share-button"
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border border-white/10 text-white/40 hover:text-white hover:bg-white/8 transition-all"
            title="Share social card"
          >
            <Share2 size={11} />
            <span>Share</span>
          </button>
          <button
            onClick={() => togglePin(conversation.id)}
            className={cn(
              'flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border transition-all',
              isPinned ? 'text-amber-300 border-amber-400/40 bg-amber-400/10' : 'text-white/25 border-white/10 hover:text-white/50'
            )}
          >
            <Pin size={10} fill={isPinned ? 'currentColor' : 'none'} />
            {isPinned ? 'Pinned' : 'Pin'}
          </button>
        </div>
      </div>

      {/* Scrut zone */}
      <div
        className="flex-1 relative overflow-hidden"
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
        style={{ userSelect: 'none', cursor: 'default' }}
      >
        {scruts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/30 pb-8">
            <p className="text-3xl mb-3">🎙</p>
            <p className="font-medium mb-1 text-white/50">No ruts yet</p>
            <p className="text-sm">Be the first to answer</p>
          </div>
        ) : (
          <div
            key={currentScrutId}
            className={cn(
              'absolute inset-0 flex flex-col items-center overflow-y-auto no-scrollbar px-4 pt-1 pb-24',
              contentAnim
            )}
          >
            <div className="w-full max-w-sm my-auto">
              {scrut && (
                <ScrutCard
                  scrut={scrut}
                  showPosition={conversation.type === 'statement'}
                  onAvatarClick={(s) => setDetailScrut(s)}
                  autoPlayVoice={autoPlayVoice}
                  contextText={conversation.body}
                />
              )}
              {scruts.length > 1 && (
                <div className="mt-5 flex items-center justify-center gap-1 text-white/20 text-[11px] pointer-events-none select-none">
                  <span>↑</span><span className="tracking-wide">swipe for next</span>
                </div>
              )}
            </div>
          </div>
        )}

        {scruts.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 pointer-events-none z-10">
            {scruts.map((_, i) => (
              <span key={i} className={cn('rounded-full transition-all duration-300', i === index ? 'w-4 h-1 bg-white/50' : 'w-1 h-1 bg-white/15')} />
            ))}
          </div>
        )}
      </div>

      {/* Answer action — compact floating pill above the bottom navigation */}
      <button
        type="button"
        onClick={() => setComposeOpen(true)}
        onMouseDown={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        className="fixed bottom-[4.8rem] right-4 z-40 flex h-10 items-center gap-1.5 rounded-full border border-white/20 bg-white/95 px-3.5 text-xs font-semibold text-black shadow-[0_8px_22px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:bottom-6 sm:right-6"
      >
        <Plus size={13} className="stroke-[2.5]" />
        <span>Drop a Rut</span>
      </button>

      {composeOpen && (
        <ComposeModal
          onClose={() => setComposeOpen(false)}
          defaultMode={conversation.type === 'statement' ? 'statement' : 'question'}
          contextConversation={conversation}
          onPosted={() => { setTimeout(() => loadData(), 400); }}
        />
      )}

      {detailScrut && (
        <ScrutDetailSheet scrut={detailScrut} onClose={() => setDetailScrut(null)} />
      )}

      {shareOpen && conversation && (
        <ShareModal
          conversation={conversation}
          scrut={scrut}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
