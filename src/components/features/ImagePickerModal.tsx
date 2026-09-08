import { useState } from 'react';
import { X, Upload, Link2, Check, Sparkles } from 'lucide-react';
import { PHOTO_PRESETS } from '@/constants/taggedData';

interface Props {
  onSelect: (url: string) => void;
  onUploadFile: () => void;
  onClose: () => void;
}

export default function ImagePickerModal({ onSelect, onUploadFile, onClose }: Props) {
  const [customLink, setCustomLink] = useState('');
  const [showCustomLink, setShowCustomLink] = useState(false);

  const handleCustomLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLink.trim()) return;
    onSelect(customLink.trim());
    onClose();
  };

  return (
    <div
      id="image-picker-modal"
      className="fixed inset-0 z-[550] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
      data-no-swipe
    >
      <div
        className="relative w-full sm:max-w-md max-h-[85dvh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-white/15 bg-[#101018] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-xs tracking-wider border border-emerald-500/30 uppercase">
              Photo
            </span>
            <h3 className="text-white font-semibold text-base">Attach Image</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close image picker"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 pb-6 space-y-4 overflow-y-auto overscroll-contain">
          {/* Main upload button */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onUploadFile();
            }}
            className="w-full py-4 px-4 rounded-2xl border-2 border-dashed border-white/20 hover:border-emerald-400/60 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-2 text-center transition-all group active:scale-[0.99]"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Upload from Device / Camera</p>
              <p className="text-xs text-white/45 mt-0.5">Supports JPG, PNG, WebP up to 4 MB</p>
            </div>
          </button>

          {/* Web link option */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowCustomLink(!showCustomLink)}
              className="flex items-center gap-1.5 text-xs text-emerald-300/80 hover:text-emerald-200 transition-colors"
            >
              <Link2 size={13} />
              <span>{showCustomLink ? 'Hide image URL input' : 'Paste web image URL'}</span>
            </button>

            {showCustomLink && (
              <form onSubmit={handleCustomLinkSubmit} className="flex gap-2 pt-2 animate-in fade-in">
                <input
                  type="url"
                  value={customLink}
                  onChange={(e) => setCustomLink(e.target.value)}
                  placeholder="https://.../photo.jpg"
                  className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-400"
                />
                <button
                  type="submit"
                  disabled={!customLink.trim()}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 disabled:opacity-40 text-white font-medium text-xs flex items-center gap-1"
                >
                  <Check size={13} />
                  <span>Use</span>
                </button>
              </form>
            )}
          </div>

          {/* Aesthetic Presets */}
          <div className="pt-2">
            <div className="flex items-center gap-1.5 text-xs text-white/40 uppercase tracking-widest font-semibold mb-2.5">
              <Sparkles size={12} className="text-amber-400" />
              <span>Aesthetic Photo Presets</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {PHOTO_PRESETS.map((photo) => (
                <button
                  key={photo.name}
                  type="button"
                  onClick={() => {
                    onSelect(photo.url);
                    onClose();
                  }}
                  className="group relative rounded-xl overflow-hidden border border-white/10 bg-black/40 aspect-[4/3] focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2">
                    <p className="text-[11px] font-medium text-white leading-tight line-clamp-1">
                      {photo.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
