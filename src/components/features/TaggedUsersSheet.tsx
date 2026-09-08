import { useState, useMemo } from 'react';
import {
  X,
  Search,
  UserMinus,
  UserPlus,
  Sparkles,
  MapPin,
  ExternalLink,
  Users,
  Compass,
} from 'lucide-react';
import { useTagged } from '@/stores/taggedContext';
import type { User } from '@/types';
import UserAvatar from '@/components/features/UserAvatar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getMapUrl } from '@/lib/countryMap';

interface TaggedUsersSheetProps {
  open: boolean;
  onClose: () => void;
  onOpenProfile: (user: User) => void;
}

export default function TaggedUsersSheet({
  open,
  onClose,
  onOpenProfile,
}: TaggedUsersSheetProps) {
  const {
    taggedIds,
    untagUser,
    tagUser,
    isTagged,
    allKnownUsers,
    posts,
  } = useTagged();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'tagged' | 'discover'>('tagged');

  // Derive all currently tagged user objects
  const taggedUsers = useMemo(() => {
    const map = new Map<string, User>();
    allKnownUsers.forEach((u) => {
      if (taggedIds.includes(u.id)) {
        map.set(u.id, u);
      }
    });
    posts.forEach((p) => {
      if (taggedIds.includes(p.user.id) && !map.has(p.user.id)) {
        map.set(p.user.id, p.user);
      }
    });
    return Array.from(map.values());
  }, [allKnownUsers, posts, taggedIds]);

  // Derive suggested creators not yet tagged
  const suggestedUsers = useMemo(() => {
    return allKnownUsers.filter((u) => !taggedIds.includes(u.id));
  }, [allKnownUsers, taggedIds]);

  // Filtered tagged users by search
  const filteredTaggedUsers = useMemo(() => {
    if (!searchQuery.trim()) return taggedUsers;
    const q = searchQuery.toLowerCase();
    return taggedUsers.filter(
      (u) =>
        u.display_name.toLowerCase().includes(q) ||
        u.country?.toLowerCase().includes(q) ||
        u.city?.toLowerCase().includes(q) ||
        u.bio?.toLowerCase().includes(q) ||
        u.twitter?.toLowerCase().includes(q)
    );
  }, [taggedUsers, searchQuery]);

  // Filtered suggested users by search
  const filteredSuggestedUsers = useMemo(() => {
    if (!searchQuery.trim()) return suggestedUsers;
    const q = searchQuery.toLowerCase();
    return suggestedUsers.filter(
      (u) =>
        u.display_name.toLowerCase().includes(q) ||
        u.country?.toLowerCase().includes(q) ||
        u.city?.toLowerCase().includes(q) ||
        u.bio?.toLowerCase().includes(q)
    );
  }, [suggestedUsers, searchQuery]);

  if (!open) return null;

  const handleUntag = (user: User) => {
    untagUser(user.id);
    toast.info(`Untagged ${user.display_name}. Their world will no longer appear in your feed.`);
  };

  const handleTag = (user: User) => {
    tagUser(user);
    toast.success(`Tagged along with ${user.display_name}!`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-[32px] sm:rounded-3xl border border-white/10 bg-[#101018] shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Sheet Header */}
        <div className="p-5 pb-3 border-b border-white/8 bg-[#12121e]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-inner">
                <Users size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Tagged Along
                  </h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                    {taggedUsers.length}
                  </span>
                </div>
                <p className="text-[11px] text-white/40">
                  Whose personal worlds and updates appear in your feed
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Sub Tabs: Tagged Circle vs Discover More */}
          <div className="flex items-center gap-1.5 bg-white/[0.04] p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setActiveSubTab('tagged')}
              className={cn(
                'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5',
                activeSubTab === 'tagged'
                  ? 'bg-white/12 text-white shadow-sm border border-white/10'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              )}
            >
              <Users size={13} />
              <span>Tagged ({taggedUsers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('discover')}
              className={cn(
                'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5',
                activeSubTab === 'discover'
                  ? 'bg-white/12 text-white shadow-sm border border-white/10'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              )}
            >
              <Compass size={13} />
              <span>Discover Creators ({suggestedUsers.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative mt-3">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeSubTab === 'tagged' ? 'Search your tagged circle...' : 'Search global creators to tag...'}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/[0.05] border border-white/8 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.08] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Sheet Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar max-h-[58vh]">
          {activeSubTab === 'tagged' ? (
            /* TAGGED USERS LIST */
            filteredTaggedUsers.length > 0 ? (
              <div className="space-y-2.5">
                {filteredTaggedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.035] border border-white/8 hover:border-white/15 transition-all group"
                  >
                    <div
                      className="flex items-start gap-3 min-w-0 cursor-pointer flex-1 mr-3"
                      onClick={() => {
                        onClose();
                        onOpenProfile(user);
                      }}
                    >
                      <UserAvatar user={user} size="md" shape="circle" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors truncate">
                            {user.display_name}
                          </span>
                          {user.country && (
                            <span className="text-[10px] text-white/50 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                              {getMapUrl(user.country) ? (
                                <img
                                  src={getMapUrl(user.country)!}
                                  alt={user.country}
                                  className="w-3 h-3 object-contain invert opacity-85"
                                />
                              ) : (
                                <MapPin size={9} className="text-emerald-400/80" />
                              )}
                              <span>{user.city ? `${user.city}, ` : ''}{user.country}</span>
                            </span>
                          )}
                        </div>
                        {user.bio && (
                          <p className="text-xs text-white/50 line-clamp-1 mt-0.5 font-normal leading-relaxed">
                            {user.bio}
                          </p>
                        )}
                        <span className="text-[10px] text-emerald-400/70 hover:underline inline-flex items-center gap-0.5 mt-1 font-mono">
                          View profile &amp; reflections <ExternalLink size={9} />
                        </span>
                      </div>
                    </div>

                    {/* UNTAG BUTTON */}
                    <button
                      type="button"
                      onClick={() => handleUntag(user)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50 text-xs font-semibold transition-all active:scale-95"
                      title={`Untag ${user.display_name}`}
                    >
                      <UserMinus size={13} />
                      <span>Untag</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center flex flex-col items-center justify-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/30 mb-3 border border-white/8">
                  <Users size={22} />
                </div>
                <h4 className="text-sm font-semibold text-white">
                  {searchQuery ? 'No matching tagged creators' : 'You haven’t tagged along with anyone yet'}
                </h4>
                <p className="text-xs text-white/40 max-w-xs mt-1 leading-relaxed">
                  {searchQuery
                    ? 'Try searching a different name or location.'
                    : 'Tag along with creators to walk through their worlds and see what they share on Tagged.'}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('discover')}
                  className="mt-4 px-4 py-2 rounded-xl bg-emerald-400 text-black text-xs font-bold hover:bg-emerald-300 transition-all"
                >
                  Discover Creators to Tag Along
                </button>
              </div>
            )
          ) : (
            /* DISCOVER MORE CREATORS LIST */
            filteredSuggestedUsers.length > 0 ? (
              <div className="space-y-2.5">
                {filteredSuggestedUsers.map((user) => {
                  const currentlyTagged = isTagged(user.id);
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/8 hover:border-white/15 transition-all group"
                    >
                      <div
                        className="flex items-start gap-3 min-w-0 cursor-pointer flex-1 mr-3"
                        onClick={() => {
                          onClose();
                          onOpenProfile(user);
                        }}
                      >
                        <UserAvatar user={user} size="md" shape="circle" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors truncate">
                              {user.display_name}
                            </span>
                            {user.country && (
                              <span className="text-[10px] text-white/50 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                                {getMapUrl(user.country) ? (
                                  <img
                                    src={getMapUrl(user.country)!}
                                    alt={user.country}
                                    className="w-3 h-3 object-contain invert opacity-85"
                                  />
                                ) : (
                                  <MapPin size={9} className="text-emerald-400/80" />
                                )}
                                <span>{user.city ? `${user.city}, ` : ''}{user.country}</span>
                              </span>
                            )}
                          </div>
                          {user.bio && (
                            <p className="text-xs text-white/50 line-clamp-1 mt-0.5 leading-relaxed">
                              {user.bio}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* TAG ALONG BUTTON */}
                      {currentlyTagged ? (
                        <button
                          type="button"
                          onClick={() => handleUntag(user)}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs font-semibold transition-all"
                        >
                          <UserMinus size={13} />
                          <span>Untag</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleTag(user)}
                          className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-400 text-black hover:bg-emerald-300 text-xs font-bold transition-all shadow-sm active:scale-95"
                        >
                          <UserPlus size={13} />
                          <span>Tag Along</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-white/40">
                No creators found.
              </div>
            )
          )}
        </div>

        {/* Sheet Footer */}
        <div className="p-4 border-t border-white/8 bg-[#12121e] flex items-center justify-between text-xs text-white/40">
          <span className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-emerald-400" />
            Untagging immediately filters their posts out of your feed
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
