import { useState, useMemo } from 'react';
import { X, Search, Sparkles, Link2, Upload, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  REACTION_GIFS,
  REACTION_GIF_CATEGORIES,
  type ReactionGif,
} from '@/constants/reactionGifs';

interface Props {
  onSelect: (url: string) => void;
  onClose: () => void;
  onUploadCustom?: () => void;
}

export default function GifPickerModal({ onSelect, onClose, onUploadCustom }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [customLink, setCustomLink] = useState('');
  const [showCustomLinkInput, setShowCustomLinkInput] = useState(false);

  const filteredGifs = useMemo(() => {
    let list = REACTION_GIFS;

    if (activeCategory !== 'All') {
      list = list.filter((g) => g.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return list;
  }, [activeCategory, search]);

  const handleCustomLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLink.trim()) return;
    onSelect(customLink.trim());
    onClose();
  };

  return (
    <div
      id="gif-picker-modal"
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
            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold text-xs tracking-wider border border-purple-500/30 uppercase">
              GIF
            </span>
            <h3 className="text-white font-semibold text-base">Attach a Fun GIF</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close GIF picker"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search input */}
        <div className="p-4 pb-2 space-y-2">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reactions (e.g. mind blown, laugh, nod, coffee)..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-sm text-white placeholder-white/35 focus:outline-none focus:border-white/30 transition-all"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-0.5"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
            {REACTION_GIF_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'px-3 py-1 rounded-full whitespace-nowrap font-medium transition-all',
                  activeCategory === cat
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'bg-white/5 border border-white/8 text-white/50 hover:bg-white/10 hover:text-white/80'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Quick link bar & custom upload button */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setShowCustomLinkInput(!showCustomLinkInput)}
              className="flex items-center gap-1.5 text-xs text-purple-300/80 hover:text-purple-200 transition-colors"
            >
              <Link2 size={13} />
              <span>{showCustomLinkInput ? 'Hide link input' : 'Paste web GIF link'}</span>
            </button>
            {onUploadCustom && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onUploadCustom();
                }}
                className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
              >
                <Upload size={13} />
                <span>Upload file instead</span>
              </button>
            )}
          </div>

          {showCustomLinkInput && (
            <form onSubmit={handleCustomLinkSubmit} className="flex gap-2 pt-1 animate-in fade-in">
              <input
                type="url"
                value={customLink}
                onChange={(e) => setCustomLink(e.target.value)}
                placeholder="https://...giphy.com/media/..."
                className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-400"
              />
              <button
                type="submit"
                disabled={!customLink.trim()}
                className="px-3 py-1.5 rounded-xl bg-purple-600 disabled:opacity-40 text-white font-medium text-xs flex items-center gap-1"
              >
                <Check size={13} />
                <span>Use</span>
              </button>
            </form>
          )}
        </div>

        {/* GIFs Grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-1 overscroll-contain">
          {filteredGifs.length === 0 ? (
            <div className="py-12 text-center text-white/40">
              <Sparkles size={24} className="mx-auto mb-2 text-white/20" />
              <p className="text-sm">No GIFs matched your search</p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setActiveCategory('All');
                }}
                className="mt-2 text-xs text-purple-400 hover:underline"
              >
                Show all reaction GIFs
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {filteredGifs.map((gif: ReactionGif) => (
                <button
                  key={gif.id}
                  type="button"
                  onClick={() => {
                    onSelect(gif.url);
                    onClose();
                  }}
                  className="group relative rounded-xl overflow-hidden border border-white/10 bg-black/40 aspect-[4/3] focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <img
                    src={gif.url}
                    alt={gif.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Overlay title */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <p className="text-[11px] font-medium text-white leading-tight line-clamp-1">
                      {gif.title}
                    </p>
                  </div>
                  {/* Badge */}
                  <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[9px] font-bold text-white/80 uppercase">
                    GIF
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
