import { useState, useEffect, useRef } from 'react';
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  QrCode,
  BarChart2,
  Sparkles,
  ExternalLink,
  Smartphone,
  Square,
  Layout,
  MessageCircle,
  Linkedin,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ConversationStarter, Scrut } from '@/types';
import {
  generateConversationCard,
  buildTwitterShareUrl,
  buildWhatsAppShareUrl,
  buildLinkedInShareUrl,
  buildTelegramShareUrl,
  type CardFormat,
  type CardTheme,
} from '@/lib/shareCardGenerator';

interface ShareModalProps {
  conversation: ConversationStarter;
  scrut?: Scrut | null;
  onClose: () => void;
}

const FORMATS: { id: CardFormat; label: string; icon: typeof Layout; description: string }[] = [
  { id: 'twitter', label: 'Landscape (1.91:1)', icon: Layout, description: 'Twitter / X, OpenGraph & LinkedIn' },
  { id: 'square', label: 'Square (1:1)', icon: Square, description: 'Instagram, Threads & Discord' },
  { id: 'story', label: 'Story (9:16)', icon: Smartphone, description: 'Stories & Mobile statuses' },
];

const THEMES: { id: CardTheme; label: string; color: string; border: string }[] = [
  { id: 'obsidian', label: 'Obsidian', color: 'from-purple-950 via-slate-900 to-black', border: 'border-purple-500/40' },
  { id: 'neon', label: 'Neon Cyber', color: 'from-sky-950 via-indigo-950 to-black', border: 'border-sky-400/40' },
  { id: 'sunset', label: 'Sunset Glow', color: 'from-amber-950 via-rose-950 to-black', border: 'border-amber-400/40' },
  { id: 'monochrome', label: 'Minimal', color: 'from-zinc-900 via-zinc-950 to-black', border: 'border-zinc-500/40' },
];

export default function ShareModal({ conversation, scrut, onClose }: ShareModalProps) {
  const [format, setFormat] = useState<CardFormat>('twitter');
  const [theme, setTheme] = useState<CardTheme>('obsidian');
  const [showQr, setShowQr] = useState(true);
  const [showStats, setShowStats] = useState(true);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.scruttin.com';
  const shareUrl = `${origin}/questions/${conversation.id}`;

  // Generate card on config change
  useEffect(() => {
    let active = true;
    setIsGenerating(true);

    generateConversationCard(conversation, {
      format,
      theme,
      showQr,
      showStats,
      scrut,
    })
      .then((res) => {
        if (!active) return;
        setPreviewUrl(res.dataUrl);
        setBlob(res.blob);
        setIsGenerating(false);
      })
      .catch((err) => {
        console.error('Error generating card image:', err);
        if (active) setIsGenerating(false);
      });

    return () => {
      active = false;
    };
  }, [conversation, format, theme, showQr, showStats, scrut]);

  // Actions
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      toast.success('Conversation link copied to clipboard');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleCopyImage = async () => {
    if (!blob) {
      toast.error('Image is still rendering...');
      return;
    }
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ]);
        setCopiedImage(true);
        toast.success('Card image copied to clipboard! Paste directly on X or chat');
        setTimeout(() => setCopiedImage(false), 2500);
      } else {
        toast.info('Clipboard image copy not supported in this browser. Please download the image.');
      }
    } catch (e) {
      console.warn('Copy image clipboard error:', e);
      toast.info('Direct image copying is restricted in iframe. Use "Download Image" to save.');
    }
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    setIsDownloading(true);
    try {
      const a = document.createElement('a');
      a.href = previewUrl;
      const cleanSlug = conversation.body
        .slice(0, 30)
        .replace(/[^a-zA-Z0-9]/g, '-')
        .toLowerCase();
      a.download = `scruttin-${cleanSlug || 'conversation'}-${format}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Share card downloaded successfully');
    } catch (e) {
      console.error('Download error:', e);
      toast.error('Failed to download image');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleTwitterShare = () => {
    const url = buildTwitterShareUrl(conversation);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleWhatsAppShare = () => {
    const url = buildWhatsAppShareUrl(conversation);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleLinkedInShare = () => {
    const url = buildLinkedInShareUrl(conversation);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTelegramShare = () => {
    const url = buildTelegramShareUrl(conversation);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        const shareData: ShareData = {
          title: `Scruttin: "${conversation.body.slice(0, 60)}"`,
          text: `"${conversation.body}" — What do you think? Voice & text thoughts on Scruttin.`,
          url: shareUrl,
        };
        if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], 'scruttin-card.png', { type: 'image/png' })] })) {
          shareData.files = [new File([blob], 'scruttin-card.png', { type: 'image/png' })];
        }
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error)?.name !== 'AbortError') {
          console.error('Native share failed:', err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div
      id="share-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="share-modal-content"
        className="relative w-full max-w-2xl glass border border-white/15 rounded-2xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/80 border border-white/15">
              <Share2 size={14} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Share Conversation</h2>
              <p className="text-[11px] text-white/40">Generate a branded card for social platforms</p>
            </div>
          </div>
          <button
            id="share-modal-close"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Live Card Preview Box */}
          <div className="relative flex flex-col items-center justify-center bg-black/50 border border-white/10 rounded-xl p-3 sm:p-4 min-h-[200px] overflow-hidden group">
            {isGenerating && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-2 text-white/60">
                <Sparkles size={20} className="animate-spin text-purple-400" />
                <span className="text-xs font-medium">Rendering high-res card…</span>
              </div>
            )}

            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Shareable conversation preview"
                className={cn(
                  'rounded-lg shadow-2xl object-contain transition-all duration-300 max-h-[300px] w-auto max-w-full border border-white/10',
                  format === 'story' ? 'max-h-[340px]' : 'max-h-[260px]'
                )}
              />
            ) : (
              <div className="h-48 flex items-center justify-center text-white/30 text-xs">
                Generating card...
              </div>
            )}

            <div className="mt-2 flex items-center gap-2 text-[11px] text-white/40">
              <span>HD 2x Canvas Export</span>
              <span>•</span>
              <span className="capitalize">{format} format</span>
              <span>•</span>
              <span className="capitalize">{theme} palette</span>
            </div>
          </div>

          {/* Controls: Format & Theme */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Format Picker */}
            <div>
              <label className="text-[11px] font-semibold tracking-wider text-white/50 uppercase mb-2 block">
                Card Ratio
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
                {FORMATS.map((f) => {
                  const Icon = f.icon;
                  const active = format === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFormat(f.id)}
                      className={cn(
                        'flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-all gap-1',
                        active
                          ? 'bg-white text-black shadow-md'
                          : 'text-white/50 hover:text-white hover:bg-white/5'
                      )}
                    >
                      <Icon size={14} />
                      <span className="text-[10px] leading-tight">{f.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Theme Picker */}
            <div>
              <label className="text-[11px] font-semibold tracking-wider text-white/50 uppercase mb-2 block">
                Visual Aesthetic
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {THEMES.map((th) => {
                  const active = theme === th.id;
                  return (
                    <button
                      key={th.id}
                      onClick={() => setTheme(th.id)}
                      className={cn(
                        'relative flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all text-center gap-1.5',
                        active
                          ? 'border-white bg-white/15 text-white ring-1 ring-white/50'
                          : 'border-white/10 bg-white/5 text-white/40 hover:text-white/80 hover:bg-white/10'
                      )}
                    >
                      <div className={cn('w-4 h-4 rounded-full bg-gradient-to-br', th.color, th.border, 'border')} />
                      <span className="text-[10px] font-medium leading-none">{th.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Toggle Options */}
          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-white/5">
            <button
              onClick={() => setShowQr(!showQr)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all',
                showQr
                  ? 'bg-white/10 border-white/25 text-white'
                  : 'bg-white/3 border-white/10 text-white/40 hover:text-white/70'
              )}
            >
              <QrCode size={13} />
              <span>QR Code</span>
            </button>

            <button
              onClick={() => setShowStats(!showStats)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all',
                showStats
                  ? 'bg-white/10 border-white/25 text-white'
                  : 'bg-white/3 border-white/10 text-white/40 hover:text-white/70'
              )}
            >
              <BarChart2 size={13} />
              <span>Response Stats</span>
            </button>
          </div>

          {/* Direct Social Share Buttons */}
          <div>
            <label className="text-[11px] font-semibold tracking-wider text-white/50 uppercase mb-2 block">
              Direct Social Share
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Twitter / X */}
              <button
                id="share-button-twitter"
                onClick={handleTwitterShare}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-black hover:bg-zinc-900 border border-white/20 text-white text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>Post on X</span>
              </button>

              {/* WhatsApp */}
              <button
                id="share-button-whatsapp"
                onClick={handleWhatsAppShare}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95"
              >
                <MessageCircle size={14} />
                <span>WhatsApp</span>
              </button>

              {/* LinkedIn */}
              <button
                id="share-button-linkedin"
                onClick={handleLinkedInShare}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-sky-950/70 hover:bg-sky-900/80 border border-sky-500/30 text-sky-300 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95"
              >
                <Linkedin size={14} />
                <span>LinkedIn</span>
              </button>

              {/* Telegram */}
              <button
                id="share-button-telegram"
                onClick={handleTelegramShare}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-950/70 hover:bg-blue-900/80 border border-blue-500/30 text-blue-300 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95"
              >
                <Send size={14} />
                <span>Telegram</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions: Download, Copy Image, Copy Link */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-2.5 px-5 py-3.5 border-t border-white/10 bg-black/40">
          <button
            id="share-button-copy-link"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-medium transition-all active:scale-95"
          >
            {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button
              id="share-button-copy-image"
              onClick={handleCopyImage}
              disabled={isGenerating || !blob}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-medium transition-all active:scale-95 disabled:opacity-40"
            >
              {copiedImage ? <Check size={14} className="text-emerald-400" /> : <Sparkles size={14} />}
              <span>{copiedImage ? 'Image Copied!' : 'Copy Image'}</span>
            </button>

            <button
              id="share-button-download"
              onClick={handleDownload}
              disabled={isGenerating || !previewUrl}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 shadow-lg"
            >
              <Download size={14} />
              <span>Download PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
