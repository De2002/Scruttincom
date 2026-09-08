/**
 * TopBar icons:
 * - S logo (Stream badge on Me page)
 * - AtmosphereControls inline
 * - Music toggle with ripple ring (shows when enabled)
 * - Pin icon — opens PinsSheet
 * - Sign-out icon
 *
 * This component is used on the Me page header.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Pin, Shield } from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';
import { fetchFirestoreConversation } from '@/lib/firestoreService';
import { useAuth } from '@/contexts/AuthContext';
import { useStream } from '@/stores/streamContext';
import AtmosphereControls from '@/components/layout/AtmosphereControls';

interface PinnedConversation {
  id: string;
  body: string;
  topic: string;
  type: string;
  scrut_count: number;
  created_at: string;
}

export default function MeTopBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { pinned } = useStream();
  const [pinsOpen, setPinsOpen] = useState(false);
  const [pinnedConvs, setPinnedConvs] = useState<PinnedConversation[]>([]);

  useEffect(() => {
    if (!pinsOpen || !pinned.length) { setPinnedConvs([]); return; }
    Promise.all(pinned.map(id => fetchFirestoreConversation(id))).then((results) => {
      const valid = results
        .filter((c): c is NonNullable<typeof c> => c !== null)
        .map(c => ({
          id: c.id,
          body: c.body,
          topic: c.topic,
          type: c.type,
          scrut_count: c.scrut_count,
          created_at: c.created_at,
        }));
      setPinnedConvs(valid);
    });
  }, [pinsOpen, pinned]);

  const handleSignOut = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        {user?.is_admin && (
          <button onClick={() => navigate('/admin')} className="p-2 text-amber-400/60 hover:text-amber-300 transition-colors rounded-lg" title="Admin">
            <Shield size={16} />
          </button>
        )}

        {/* Atmosphere & Music controls */}
        <AtmosphereControls />

        {/* Pins */}
        <button
          onClick={() => setPinsOpen(true)}
          className={cn(
            'relative p-2 rounded-lg transition-all',
            pinned.length > 0 ? 'text-amber-300/70 hover:text-amber-200' : 'text-white/25 hover:text-white/50'
          )}
          title="Pinned conversations"
        >
          <Pin size={16} />
          {pinned.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-400 text-black text-[8px] font-bold flex items-center justify-center leading-none">
              {pinned.length}
            </span>
          )}
        </button>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="p-2 text-white/20 hover:text-rose-400/70 transition-colors rounded-lg"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>

      {/* Pins sheet */}
      {pinsOpen && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center" data-no-swipe>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPinsOpen(false)} />
          <div className="relative w-full max-w-md rounded-t-3xl overflow-hidden max-h-[80dvh]"
            style={{ background: 'rgba(14,14,22,0.98)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/7">
              <div className="flex items-center gap-2">
                <Pin size={14} className="text-amber-300/70" />
                <h3 className="text-white font-semibold text-sm">Pinned Conversations</h3>
              </div>
              <button onClick={() => setPinsOpen(false)} className="text-white/30 hover:text-white/70 p-1 transition-colors text-sm">✕</button>
            </div>
            <div className="overflow-y-auto max-h-[60dvh] p-4 space-y-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {pinnedConvs.length === 0 ? (
                <div className="text-center py-8 text-white/25">
                  <Pin size={24} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No pinned conversations yet</p>
                  <p className="text-xs mt-1">Pin questions from the stream to follow them</p>
                </div>
              ) : pinnedConvs.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setPinsOpen(false); navigate(`/conversation/${c.id}`); }}
                  className="w-full text-left p-4 rounded-2xl bg-white/4 border border-white/7 hover:bg-white/8 transition-all"
                >
                  <p className="text-white/35 text-[10px] uppercase tracking-widest font-medium mb-1.5">{c.topic} · {c.type}</p>
                  <p className="text-white/75 font-serif text-[13px] leading-snug line-clamp-2">
                    {c.type === 'statement' ? `"${c.body}"` : c.body}
                  </p>
                  <p className="text-white/20 text-[10px] mt-2">{c.scrut_count} scruts · {timeAgo(c.created_at)}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
