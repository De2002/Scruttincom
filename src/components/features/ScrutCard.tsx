import { useState, useEffect, useRef } from 'react';
import type { Scrut } from '@/types';
import { cn, timeAgo } from '@/lib/utils';
import UserAvatar from './UserAvatar';
import TextReveal from './TextReveal';
import VoiceScrutCard from './VoiceScrutCard';
import ResonatesButton from './ResonatesButton';
import ReportModal from './ReportModal';
import MediaLightboxModal from './MediaLightboxModal';
import { Flag, UserRound, Maximize2, ChevronUp, ChevronDown, Image as ImageIcon, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { COUNTRY_ISO, getMapUrl } from '@/lib/countryMap';

interface Props {
  scrut: Scrut;
  showPosition?: boolean;
  onRevealComplete?: () => void;
  className?: string;
  onAvatarClick?: (scrut: Scrut) => void;
  autoPlayVoice?: boolean;
  contextText?: string;
}

const positionLabel: Record<string, string> = {
  agree: 'Agrees', unsure: 'Unsure', disagree: 'Disagrees',
};
const positionColor: Record<string, string> = {
  agree: 'text-emerald-400', unsure: 'text-amber-400', disagree: 'text-rose-400',
};

function wordCount(text: string | null | undefined): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
}

/** Reworked modern social-platform media attachment for text scruts (GIF & Image) */
function ScrutMediaAttachment({
  url,
  onZoom,
  isShort,
}: {
  url: string;
  onZoom: (url: string) => void;
  isShort?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const isGif =
    url.toLowerCase().includes('.gif') ||
    url.toLowerCase().includes('giphy') ||
    url.toLowerCase().includes('tenor');

  if (loadError) {
    return (
      <div
        className="my-2 p-3 rounded-2xl border border-white/10 bg-black/30 flex items-center justify-between text-xs text-white/50 select-none"
        data-no-swipe
      >
        <div className="flex items-center gap-2">
          <ImageIcon size={14} className="text-white/40" />
          <span>Attached media preview unavailable</span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setLoadError(false);
            setIsLoaded(false);
          }}
          className="text-white/75 hover:text-white underline text-xs font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  if (collapsed) {
    return (
      <div className="my-2 flex items-center justify-start select-none" data-no-swipe>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed(false);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 hover:bg-white/15 border border-white/15 text-white/80 transition-all active:scale-95 shadow-sm"
          title="Expand attachment"
        >
          {isGif ? (
            <span className="px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-300 font-bold text-[9px] uppercase tracking-wider">
              GIF
            </span>
          ) : (
            <ImageIcon size={12} className="text-emerald-400" />
          )}
          <span>Show attachment</span>
          <ChevronDown size={13} className="text-white/50" />
        </button>
      </div>
    );
  }

  return (
    <div className="my-2.5 flex justify-center w-full select-none" data-no-swipe>
      <div
        className="relative max-w-full rounded-2xl overflow-hidden border border-white/15 bg-black/50 shadow-xl group/media cursor-pointer transition-all hover:border-white/25 active:scale-[0.99]"
        onClick={(e) => {
          e.stopPropagation();
          onZoom(url);
        }}
      >
        {/* Skeleton / loader */}
        {!isLoaded && (
          <div className="w-48 h-36 bg-white/5 animate-pulse flex items-center justify-center text-white/20">
            <Sparkles size={16} className="animate-spin text-white/30" />
          </div>
        )}

        {/* Media Image / GIF — natural hugging width without black horizontal letterbox wings */}
        <img
          src={url}
          alt="Rut attachment"
          onLoad={() => setIsLoaded(true)}
          onError={() => setLoadError(true)}
          className={cn(
            'h-auto max-h-40 sm:max-h-52 w-auto max-w-full object-contain mx-auto transition-transform duration-300 group-hover/media:scale-[1.01]',
            !isLoaded && 'hidden'
          )}
          draggable={false}
        />

        {/* Top controls: minimize and zoom */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover/media:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(true);
            }}
            className="p-1 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md text-white/70 hover:text-white border border-white/15 transition-all"
            title="Minimize attachment"
            aria-label="Minimize attachment"
          >
            <ChevronUp size={12} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onZoom(url);
            }}
            className="p-1 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md text-white/70 hover:text-white border border-white/15 transition-all flex items-center gap-1"
            title="Fullscreen zoom"
            aria-label="Expand image fullscreen"
          >
            <Maximize2 size={12} />
          </button>
        </div>

        {/* Bottom badge */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 pointer-events-none">
          {isGif ? (
            <span className="px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/20 text-white font-bold text-[9px] tracking-wider uppercase shadow-md">
              GIF
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/15 text-white/80 font-medium text-[9px] shadow-sm flex items-center gap-1">
              <ImageIcon size={10} className="text-emerald-400" />
              Photo
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ScrutCard({ scrut, showPosition, onRevealComplete, className, onAvatarClick, autoPlayVoice = false, contextText }: Props) {
  const { user } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const mapUrl = getMapUrl(scrut.user.country);

  // ── Voice only ──────────────────────────────────────────────────────────
  if (scrut.type === 'voice') {
    return (
      <div className={cn('scrut-enter', className)}>
        <VoiceScrutCard
          duration={scrut.audio_duration ?? 30}
          user={scrut.user}
          scrutId={scrut.id}
          audioUrl={scrut.audio_url}
          autoPlay={autoPlayVoice}
          showUser
          onAvatarClick={() => onAvatarClick?.(scrut)}
          contextText={contextText}
        />
        {/* Bottom row: clearly visible resonate, time, report */}
        <div className="flex items-center justify-between mt-5">
          <ResonatesButton
            scrutId={scrut.id}
            initialCount={scrut.resonate_count ?? 0}
            initialResonated={scrut.resonated_by_me ?? false}
            size="md"
          />
          <div className="flex items-center gap-2.5">
            <span className="text-white/40 text-[13px] font-medium">{timeAgo(scrut.created_at)}</span>
            {user && (
              <button
                onClick={e => { e.stopPropagation(); setReportOpen(true); }}
                className="text-white/30 hover:text-rose-400/80 p-1.5 rounded-lg transition-colors"
                aria-label="Report scrut"
              >
                <Flag size={14} />
              </button>
            )}
          </div>
        </div>
        {reportOpen && <ReportModal scrutId={scrut.id} onClose={() => setReportOpen(false)} />}
      </div>
    );
  }

  // ── Text ────────────────────────────────────────────────────────────────
  const wc = wordCount(scrut.text);
  const isShort = wc < 30;

  return (
    <div className={cn('scrut-enter relative', className)}>
      {/* Background country silhouette watermark */}
      {mapUrl && (
        <img
          src={mapUrl}
          alt=""
          aria-hidden
          className="absolute right-0 top-0 pointer-events-none select-none opacity-[0.05] invert blur-[0.3px]"
          style={{ width: 110, height: 110, objectFit: 'contain', zIndex: 0 }}
        />
      )}

      {/* Author & Context Header — clean unified top row, no float clipping */}
      <div className="relative z-10 flex items-start gap-3 mb-3">
        <button
          type="button"
          aria-label={`View ${scrut.user.display_name ?? 'user'} profile`}
          onClick={(e) => {
            e.stopPropagation();
            onAvatarClick?.(scrut);
          }}
          className="shrink-0 group/avatar cursor-pointer rounded-2xl transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <div className="relative p-0.5 rounded-2xl bg-gradient-to-b from-white/20 to-white/5 border border-white/10 shadow-sm">
            <UserAvatar user={scrut.user} size="lg" shape="square" className="rounded-[14px]" />
          </div>
        </button>

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAvatarClick?.(scrut);
              }}
              className="font-semibold text-white/90 text-sm hover:text-white transition-colors truncate text-left"
            >
              {scrut.user.display_name}
            </button>
            {scrut.user.country && (
              <span className="text-[11px] text-white/40 font-medium tracking-wide">
                · {scrut.user.country}
              </span>
            )}
            {showPosition && scrut.position && (
              <span
                className={cn(
                  'text-[10px] font-semibold px-2 py-0.5 rounded-full border tracking-wide uppercase',
                  positionColor[scrut.position] === 'text-emerald-400' && 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
                  positionColor[scrut.position] === 'text-amber-400' && 'bg-amber-500/10 border-amber-500/30 text-amber-300',
                  positionColor[scrut.position] === 'text-rose-400' && 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                )}
              >
                {positionLabel[scrut.position]}
              </span>
            )}
          </div>

          {contextText && (
            <p className="mt-1 font-serif text-xs sm:text-[13px] italic leading-snug text-white/45 line-clamp-2">
              on “{contextText}”
            </p>
          )}
        </div>
      </div>

      {/* Main Scrut Text */}
      {scrut.text && (
        <div className="relative z-10 my-2.5">
          <TextReveal
            text={scrut.text}
            onComplete={onRevealComplete}
            className="text-white/90 leading-[1.65] font-serif"
            style={{ fontSize: isShort ? 17 : 15 }}
          />
        </div>
      )}

      {/* Modern Attachment (GIF / Image) */}
      {scrut.attachment_url && (
        <div className="relative z-10 my-2">
          <ScrutMediaAttachment
            url={scrut.attachment_url}
            onZoom={(u) => setLightboxUrl(u)}
            isShort={isShort}
          />
        </div>
      )}

      {/* Footer action row */}
      <div className="relative z-10 mt-4 flex items-center justify-between pt-2.5 border-t border-white/[0.07]">
        <ResonatesButton
          scrutId={scrut.id}
          initialCount={scrut.resonate_count ?? 0}
          initialResonated={scrut.resonated_by_me ?? false}
          size="md"
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onAvatarClick?.(scrut)}
            aria-label={`View ${scrut.user.display_name} profile`}
            className="p-1.5 rounded-lg text-white/35 hover:text-white/75 transition-colors flex items-center gap-1 text-xs"
            title="View profile"
          >
            <UserRound size={15} />
          </button>

          <span className="text-white/40 text-xs font-medium">{timeAgo(scrut.created_at)}</span>

          {user && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setReportOpen(true);
              }}
              className="text-white/30 hover:text-rose-400/80 p-1.5 rounded-lg transition-colors"
              aria-label="Report rut"
              title="Report rut"
            >
              <Flag size={14} />
            </button>
          )}
        </div>
      </div>

      {reportOpen && <ReportModal scrutId={scrut.id} onClose={() => setReportOpen(false)} />}
      {lightboxUrl && (
        <MediaLightboxModal
          url={lightboxUrl}
          onClose={() => setLightboxUrl(null)}
        />
      )}
    </div>
  );
}
