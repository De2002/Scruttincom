import { useEffect, useRef, useState } from 'react';
import { Globe, ExternalLink, X, UserPlus, UserCheck, Sparkles, MessageSquare, Coffee, Layers, ChevronRight } from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';
import type { Scrut, User } from '@/types';
import { useTagged } from '@/stores/taggedContext';
import UserContributionsSheet from '@/components/features/UserContributionsSheet';

interface Props {
  scrut?: Scrut | null;
  user?: User | null;
  onClose: () => void;
}

/** Same ISO map used in ScrutCard */
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
  Iraq:'iq', Syria:'sy', Jordan:'jo', Lebanon:'lb', Israel:'il', UAE:'ae',
  'United Arab Emirates':'ae', Qatar:'qa', Kuwait:'kw', Oman:'om', Yemen:'ye',
};

function getMapUrl(country: string | undefined) {
  if (!country) return null;
  const iso = COUNTRY_ISO[country];
  return iso ? `https://raw.githubusercontent.com/djaiss/mapsicon/master/all/${iso}/256.png` : null;
}

function ensureHttps(url: string) {
  return url.startsWith('http') ? url : `https://${url}`;
}

function getTipLabel(url?: string | null): string {
  if (!url) return 'Buy a coffee';
  const l = url.toLowerCase();
  if (l.includes('buymeacoffee.com') || l.includes('bmc.link')) return 'Buy me a coffee';
  if (l.includes('ko-fi.com')) return 'Ko-fi';
  if (l.includes('paypal.me') || l.includes('paypal.com')) return 'PayPal';
  return 'Buy me a coffee';
}

export default function ScrutDetailSheet({ scrut, user: propUser, onClose }: Props) {
  const user = propUser || scrut?.user;
  const { isTagged, toggleTag } = useTagged();
  const tagged = user ? isTagged(user.id) : false;
  const mapUrl = user?.country ? getMapUrl(user.country) : null;

  // Resolve tip link from user object or localStorage
  const tipLink = user?.tip_link || (typeof window !== 'undefined' && user?.id
    ? (localStorage.getItem(`scruttin_tip_${user.id}`) || localStorage.getItem(`scruttin_tip_link_${user.id}`)) || undefined
    : undefined);

  const [showContributions, setShowContributions] = useState(false);

  // Sheet drag-to-dismiss
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const isDragging = useRef(false);
  const [dragDy, setDragDy] = useState(0);
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Keep the global bottom navigation behind the profile overlay.
  useEffect(() => {
    document.documentElement.classList.add('profile-sheet-active');
    requestAnimationFrame(() => setMounted(true));
    return () => document.documentElement.classList.remove('profile-sheet-active');
  }, []);

  if (!user) return null;

  const triggerClose = () => {
    setClosing(true);
    setTimeout(onClose, 340);
  };

  // Touch drag
  const onTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dy = e.touches[0].clientY - dragStartY.current;
    if (dy > 0) setDragDy(dy);
  };
  const onTouchEnd = () => {
    isDragging.current = false;
    if (dragDy > 80) {
      triggerClose();
    } else {
      setDragDy(0);
    }
  };

  // Mouse drag (desktop)
  const onMouseDown = (e: React.MouseEvent) => {
    dragStartY.current = e.clientY;
    isDragging.current = true;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dy = e.clientY - dragStartY.current;
    if (dy > 0) setDragDy(dy);
  };
  const onMouseUp = () => {
    isDragging.current = false;
    if (dragDy > 80) {
      triggerClose();
    } else {
      setDragDy(0);
    }
  };

  const initials = user.display_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const sheetY = closing ? '100%' : !mounted ? '100%' : `${dragDy}px`;

  return (
    /* Backdrop */
    <div
      className={cn(
        'fixed inset-0 z-[1000] flex items-end',
        'transition-all duration-300',
        mounted && !closing ? 'bg-black/55' : 'bg-black/0'
      )}
      onClick={(e) => { if (e.target === e.currentTarget) triggerClose(); }}
    >
      {/* Sheet */}
      <div
        ref={sheetRef}
        className="pointer-events-auto relative w-full max-w-lg mx-auto max-h-[calc(100dvh-0.5rem)] overflow-y-auto overscroll-contain"
        style={{
          transform: `translateY(${sheetY})`,
          transition: isDragging.current ? 'none' : 'transform 0.38s cubic-bezier(0.16,1,0.3,1)',
          willChange: 'transform',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      >
        {/* Sheet body */}
        <div
          className="relative rounded-t-3xl overflow-hidden shadow-2xl"
          style={{
            background: 'rgba(14, 14, 22, 0.97)',
            backdropFilter: 'blur(24px)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* Country map — large watermark fills the top area */}
          {mapUrl && (
            <img
              src={mapUrl}
              alt=""
              aria-hidden
              className="absolute pointer-events-none select-none"
              style={{
                width: 320,
                height: 320,
                objectFit: 'contain',
                opacity: 0.045,
                filter: 'invert(1)',
                top: -40,
                right: -40,
                zIndex: 0,
              }}
            />
          )}

          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 relative z-10 cursor-grab active:cursor-grabbing">
            <div className="w-9 h-1 rounded-full bg-white/15" />
          </div>

          {/* Close button */}
          <button
            onClick={triggerClose}
            className="absolute top-4 right-4 z-20 p-1.5 rounded-full text-white/30 hover:text-white/70 hover:bg-white/8 transition-all"
          >
            <X size={15} />
          </button>

          {/* Content */}
          <div className="relative z-10 px-6 pt-4 pb-8">
            {/* Avatar + name + Tag Along button */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative shrink-0">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.display_name}
                      className="w-16 h-16 rounded-2xl object-cover ring-1 ring-white/10"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white/70 font-semibold text-xl">
                      {initials}
                    </div>
                  )}
                  {user.id !== 'platform' && (
                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/90 text-[10px] text-white ring-2 ring-[#0e0e16]">
                      <Sparkles size={10} />
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-white font-semibold text-[18px] leading-tight truncate">
                    {user.display_name}
                  </h2>
                  <p className="text-white/40 text-[12px] truncate">
                    @{user.twitter || user.display_name.toLowerCase().replace(/\s+/g, '')}
                  </p>
                  {(user.city || user.country) && (
                    <p className="flex items-center gap-1.5 text-white/45 text-[12px] mt-1">
                      <Globe size={11} strokeWidth={1.5} />
                      {user.city ? `${user.city}, ${user.country}` : user.country}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions: Coffee Tipping & Tag along button */}
              <div className="flex items-center gap-2 shrink-0">
                {tipLink && (
                  <a
                    href={ensureHttps(tipLink)}
                    target="_blank"
                    rel="noopener noreferrer"
                    id="profile-tip-coffee-btn"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 hover:border-amber-400 transition-all shadow-sm active:scale-95 touch-manipulation group"
                    title={`Buy ${user.display_name} a coffee / Tip`}
                  >
                    <Coffee size={13} className="text-amber-400 group-hover:scale-110 transition-transform" />
                    <span>{getTipLabel(tipLink)}</span>
                  </a>
                )}

                {user.id !== 'platform' && (
                  <button
                    type="button"
                    id="profile-tag-along-btn"
                    onClick={() => toggleTag(user)}
                    className={cn(
                      'shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 shadow-sm active:scale-95',
                      tagged
                        ? 'bg-white/10 text-white border border-white/20 hover:bg-rose-500/15 hover:border-rose-500/30 hover:text-rose-300'
                        : 'bg-white text-black hover:bg-white/90 hover:shadow-[0_0_12px_rgba(255,255,255,0.3)]'
                    )}
                  >
                    {tagged ? (
                      <>
                        <UserCheck size={13} className="text-emerald-400" />
                        <span>Tagged</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={13} />
                        <span>Tag Along</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Thin rule */}
            <div className="border-t border-white/7 mb-5" />

            {/* Bio */}
            {user.bio ? (
              <p className="text-white/75 text-[14px] leading-relaxed mb-4 font-sans">
                {user.bio}
              </p>
            ) : (
              <p className="text-white/35 text-xs italic mb-4">
                Observing conversations and sharing perspectives on Scruttin.
              </p>
            )}

            {/* Button linking to Questions, Claims & Responses slide-up sheet */}
            <button
              type="button"
              id="profile-view-contributions-btn"
              onClick={() => setShowContributions(true)}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all group active:scale-[0.99] touch-manipulation text-left mb-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                  <Layers size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">
                    Questions, Claims & Responses
                  </p>
                  <p className="text-[11px] text-white/40 truncate">
                    Questions asked · Claims made · Questions responded to
                  </p>
                </div>
              </div>
              <ChevronRight size={15} className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* Feed connection note */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-white/50 mb-5">
              <MessageSquare size={13} className="text-white/40 shrink-0" />
              <span>
                {tagged
                  ? `You are tagging along with ${user.display_name.split(' ')[0]}. Their updates appear in your Tagged feed.`
                  : `Tag along to follow ${user.display_name.split(' ')[0]}'s thoughts and voice notes in your Tagged feed.`}
              </span>
            </div>

            {/* Rut attachment & timestamp if triggered from specific scrut */}
            {scrut?.attachment_url && (
              <div className="mb-3 relative rounded-2xl overflow-hidden border border-white/15 bg-black/40 shadow-lg">
                <img
                  src={scrut.attachment_url}
                  alt="Rut attachment"
                  className="w-full max-h-48 object-cover sm:object-contain bg-black/50"
                />
                {(scrut.attachment_url.toLowerCase().includes('.gif') || scrut.attachment_url.toLowerCase().includes('giphy')) && (
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-white font-bold text-[9px] tracking-wider uppercase">
                    GIF
                  </span>
                )}
              </div>
            )}

            {scrut && (
              <p className="text-white/25 text-[11px] tracking-wide mb-5 uppercase font-medium">
                Rut from {timeAgo(scrut.created_at)}
              </p>
            )}

            {/* Links & Tip link */}
            {(user.website || user.twitter || user.instagram || tipLink) && (
              <div className="flex flex-wrap gap-2">
                {tipLink && (
                  <a
                    href={ensureHttps(tipLink)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-500/35 bg-amber-500/10
                               text-amber-300 hover:text-amber-200 hover:border-amber-400 hover:bg-amber-500/20
                               text-xs font-medium transition-all"
                  >
                    <Coffee size={12} className="text-amber-400" />
                    <span>{getTipLabel(tipLink)}</span>
                  </a>
                )}
                {user.website && (
                  <a
                    href={ensureHttps(user.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5
                               text-white/50 hover:text-white/80 hover:border-white/20 hover:bg-white/8
                               text-xs font-medium transition-all"
                  >
                    <ExternalLink size={11} />
                    {user.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
                {user.twitter && (
                  <a
                    href={`https://x.com/${user.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5
                               text-white/50 hover:text-white/80 hover:border-white/20 hover:bg-white/8
                               text-xs font-medium transition-all"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.84L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    @{user.twitter}
                  </a>
                )}
                {user.instagram && (
                  <a
                    href={`https://instagram.com/${user.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5
                               text-white/50 hover:text-white/80 hover:border-white/20 hover:bg-white/8
                               text-xs font-medium transition-all"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                      <circle cx="12" cy="12" r="4"/>
                      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
                    </svg>
                    @{user.instagram}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User contributions slide up sheet */}
      {showContributions && (
        <UserContributionsSheet
          user={user}
          onClose={() => setShowContributions(false)}
        />
      )}
    </div>
  );
}
