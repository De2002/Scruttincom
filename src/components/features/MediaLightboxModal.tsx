import { useEffect } from 'react';
import { X, Download, ExternalLink } from 'lucide-react';

interface Props {
  url: string;
  alt?: string;
  onClose: () => void;
}

export default function MediaLightboxModal({ url, alt = 'Attached media', onClose }: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isGif = url.toLowerCase().includes('.gif') || url.toLowerCase().includes('giphy');

  return (
    <div
      id="scrut-media-lightbox"
      className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
      data-no-swipe
    >
      {/* Top Bar Controls */}
      <div
        className="absolute top-4 right-4 z-10 flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all backdrop-blur-md"
          title="Open original media in new tab"
        >
          <ExternalLink size={16} />
        </a>
        <a
          href={url}
          download="scruttin-attachment"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all backdrop-blur-md"
          title="Download media"
        >
          <Download size={16} />
        </a>
        <button
          type="button"
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all backdrop-blur-md"
          title="Close preview (Esc)"
          aria-label="Close fullscreen view"
        >
          <X size={18} />
        </button>
      </div>

      {/* Main image container */}
      <div
        className="relative max-w-4xl max-h-[88dvh] flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-black/50">
          <img
            src={url}
            alt={alt}
            className="w-full h-auto max-h-[84dvh] max-w-[92vw] object-contain select-none"
            draggable={false}
          />
          {isGif && (
            <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md border border-white/20 text-white font-bold text-xs tracking-wider uppercase">
              GIF
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
