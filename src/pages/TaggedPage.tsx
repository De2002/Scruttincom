import { useState, useMemo, useRef } from 'react';
import {
  Search,
  Sparkles,
  Image as ImageIcon,
  Smile,
  Sticker as StickerIcon,
  X,
  MapPin,
  Send,
  RefreshCw,
  Camera,
  ChevronRight,
  Users,
  Upload,
  Bookmark,
  BarChart2,
  CheckCircle2,
  Clock,
  Lock,
} from 'lucide-react';
import { useTagged } from '@/stores/taggedContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  TaggedPostItem,
  TaggedSticker,
  TaggedPoll,
} from '@/constants/taggedData';
import type { User } from '@/types';
import UserAvatar from '@/components/features/UserAvatar';
import TaggedPostCard from '@/components/features/TaggedPostCard';
import TaggedFeedSkeleton from '@/components/features/TaggedPostSkeleton';
import TaggedPostDetailModal from '@/components/features/TaggedPostDetailModal';
import TaggedPollBuilder, { PollDraft } from '@/components/features/TaggedPollBuilder';
import ScrutDetailSheet from '@/components/features/ScrutDetailSheet';
import TaggedUsersSheet from '@/components/features/TaggedUsersSheet';
import TaggedPostingEligibilityCard from '@/components/features/TaggedPostingEligibilityCard';
import TaggedGracePeriodBanner from '@/components/features/TaggedGracePeriodBanner';
import TaggedRulesModal from '@/components/features/TaggedRulesModal';
import ShareModal from '@/components/features/ShareModal';
import ReportModal from '@/components/features/ReportModal';
import AtmosphereControls from '@/components/layout/AtmosphereControls';
import { cn, timeAgo } from '@/lib/utils';
import { toast } from 'sonner';

type FeedTab = 'tagged_along' | 'visuals' | 'polls' | 'bookmarks';

export default function TaggedPage() {
  const { user: currentUser } = useAuth();
  const {
    taggedIds,
    isTagged,
    toggleTag,
    likedIds,
    toggleLike,
    repostedIds,
    toggleRepost,
    bookmarkedIds,
    toggleBookmark,
    posts,
    addPost,
    addReply,
    allKnownUsers,
    stickerPack,
    curatedGifs,
    photoPresets,
    isLoading: isFeedLoading,
    refreshFeed,
    taggersCount,
    taggersThreshold,
    taggerStatus,
    canPostInTagged,
    gracePeriodDaysRemaining,
    gracePeriodHoursRemaining,
  } = useTagged();

  const [activeTab, setActiveTab] = useState<FeedTab>('tagged_along');
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [isTabTransitioning, setIsTabTransitioning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [showTaggedSheet, setShowTaggedSheet] = useState(false);
  const [sharingPost, setSharingPost] = useState<TaggedPostItem | null>(null);
  const [activeThreadPost, setActiveThreadPost] = useState<TaggedPostItem | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [reportingPost, setReportingPost] = useState<TaggedPostItem | null>(null);

  // Composer State
  const [composerText, setComposerText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [selectedSticker, setSelectedSticker] = useState<TaggedSticker | null>(null);
  const [customLocation, setCustomLocation] = useState('');
  const [customMood, setCustomMood] = useState('');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [showPollBuilder, setShowPollBuilder] = useState(false);
  const [pollDraft, setPollDraft] = useState<PollDraft>({
    question: '',
    options: ['', ''],
    durationDays: 1,
  });

  // Modals / Pickers State
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [gifCategory, setGifCategory] = useState<string>('All');

  // File input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Get active post with real-time updates
  const currentActivePost = useMemo(() => {
    if (!activeThreadPost) return null;
    return posts.find((p) => p.id === activeThreadPost.id) || activeThreadPost;
  }, [activeThreadPost, posts]);

  // Reply handler for full view thread modal
  const handleModalReply = (postId: string, text: string, sticker?: TaggedSticker) => {
    const replyUser: User = currentUser
      ? {
          id: currentUser.id,
          display_name: currentUser.display_name || 'You',
          avatar_url: currentUser.avatar_url || '',
          country: currentUser.country || 'Global',
        }
      : {
          id: 'me-anon',
          display_name: 'You',
          avatar_url: '',
          country: 'Global',
        };

    addReply(postId, replyUser, text, sticker);
  };

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

  // Filter posts strictly to Tagged circle
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Must be from tagged people or current user
      const isFromTaggedOrMe = taggedIds.includes(post.user.id) || post.user.id === currentUser?.id;
      if (!isFromTaggedOrMe) {
        return false;
      }

      // Tab filter
      if (activeTab === 'visuals' && !post.image_url && !post.gif_url) {
        return false;
      }
      if (activeTab === 'polls' && !post.poll) {
        return false;
      }
      if (activeTab === 'bookmarks' && !bookmarkedIds.includes(post.id)) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          post.text?.toLowerCase().includes(q) ||
          post.user.display_name.toLowerCase().includes(q) ||
          post.user.country?.toLowerCase().includes(q) ||
          post.location_tag?.toLowerCase().includes(q) ||
          post.mood_tag?.toLowerCase().includes(q) ||
          post.sticker?.label.toLowerCase().includes(q) ||
          post.poll?.question?.toLowerCase().includes(q) ||
          post.poll?.options.some((o) => o.text.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [posts, activeTab, taggedIds, currentUser?.id, bookmarkedIds, searchQuery]);

  const handleTabSelect = (tab: FeedTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setIsTabTransitioning(true);
    setTimeout(() => {
      setIsTabTransitioning(false);
    }, 280);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshFeed();
    setRefreshing(false);
    toast.success('Feed updated');
  };

  // Handle local image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image is too large. Please select a file under 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSelectedImage(result);
      setSelectedGif(null); // Clear gif if image picked
      setShowPhotoPicker(false);
      toast.success('Photo attached!');
    };
    reader.readAsDataURL(file);
  };

  // Publish new post
  const handlePublish = () => {
    const hasText = Boolean(composerText.trim());
    const hasMedia = Boolean(selectedImage || selectedGif || selectedSticker);
    const hasPoll = showPollBuilder;

    if (!hasText && !hasMedia && !hasPoll) {
      toast.error('Please write something, attach media, or add a poll.');
      return;
    }

    let createdPoll: TaggedPoll | undefined = undefined;

    if (showPollBuilder) {
      const validOptions = pollDraft.options.map((o) => o.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        toast.error('Polls require at least 2 non-empty options.');
        return;
      }
      const endsAt = new Date(Date.now() + pollDraft.durationDays * 24 * 60 * 60 * 1000).toISOString();
      createdPoll = {
        id: `poll-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        question: pollDraft.question.trim() || undefined,
        options: validOptions.map((opt, i) => ({
          id: `opt-${Date.now()}-${i}`,
          text: opt,
          votes: 0,
        })),
        total_votes: 0,
        duration_days: pollDraft.durationDays,
        ends_at: endsAt,
      };
    }

    const postUser: User = currentUser
      ? {
          id: currentUser.id,
          display_name: currentUser.display_name || 'You',
          avatar_url: currentUser.avatar_url || '',
          country: currentUser.country || 'Global',
          city: currentUser.city || '',
          bio: currentUser.bio || '',
        }
      : {
          id: 'me-anon',
          display_name: 'You',
          avatar_url: '',
          country: 'Global',
        };

    addPost({
      user: postUser,
      text: composerText.trim(),
      image_url: selectedImage || undefined,
      gif_url: selectedGif || undefined,
      sticker: selectedSticker || undefined,
      poll: createdPoll,
      location_tag: customLocation.trim() || undefined,
      mood_tag: customMood.trim() ? (customMood.startsWith('#') ? customMood : `#${customMood}`) : undefined,
    });

    // Reset composer
    setComposerText('');
    setSelectedImage(null);
    setSelectedGif(null);
    setSelectedSticker(null);
    setCustomLocation('');
    setCustomMood('');
    setShowLocationInput(false);
    setShowPollBuilder(false);
    setPollDraft({
      question: '',
      options: ['', ''],
      durationDays: 1,
    });
  };

  const suggestedUsers = useMemo(() => {
    return allKnownUsers.filter((u) => !taggedIds.includes(u.id)).slice(0, 10);
  }, [allKnownUsers, taggedIds]);

  const filteredGifs = useMemo(() => {
    if (gifCategory === 'All') return curatedGifs;
    return curatedGifs.filter((g) => g.category === gifCategory);
  }, [curatedGifs, gifCategory]);

  return (
    <div className="flex flex-col min-h-screen pb-32 sm:pb-28 text-white selection:bg-white/20 selection:text-white">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-black/40 backdrop-blur-xl px-3 sm:px-4 pt-safe pt-2.5 pb-2">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
          {/* Header Title & Branding */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 shadow-inner shrink-0">
              <span className="font-serif font-bold text-base sm:text-lg text-emerald-400">#</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-nowrap">
                <h1 className="text-[15px] sm:text-[17px] font-bold tracking-tight text-white leading-tight truncate">
                  Tagged
                </h1>
                <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shrink-0 hidden xs:inline-block sm:inline-block">
                  The Other Side
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-white/40 font-medium truncate max-w-[150px] xs:max-w-[220px] sm:max-w-none">
                Walking through other people&apos;s worlds
              </p>
            </div>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* My Taggers Posting Status Button */}
            <button
              type="button"
              id="header-my-taggers-btn"
              onClick={() => setShowRulesModal(true)}
              className={cn(
                'flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border text-xs font-semibold transition-all group active:scale-95 shadow-sm',
                taggerStatus === 'unlocked' && 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20',
                taggerStatus === 'grace_period' && 'bg-amber-500/15 border-amber-500/35 text-amber-300 hover:bg-amber-500/25 animate-pulse',
                (taggerStatus === 'restricted' || taggerStatus === 'locked') && 'bg-rose-500/15 border-rose-500/35 text-rose-300 hover:bg-rose-500/25'
              )}
              title="View Tagger rules & posting eligibility status"
            >
              {taggerStatus === 'unlocked' && <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />}
              {taggerStatus === 'grace_period' && <Clock size={12} className="text-amber-400 shrink-0" />}
              {(taggerStatus === 'restricted' || taggerStatus === 'locked') && <Lock size={12} className="text-rose-400 shrink-0" />}
              <span className="font-mono">{taggersCount}</span>
              <span className="text-[10px] text-white/60 hidden xs:inline">
                {taggerStatus === 'unlocked' ? 'Taggers' : `/${taggersThreshold}`}
              </span>
            </button>

            {/* Tagged People Count & Small Profile Pics Badge */}
            <button
              type="button"
              id="header-tagged-people-btn"
              onClick={() => setShowTaggedSheet(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 hover:border-emerald-500/30 transition-all text-left group active:scale-95 shadow-sm"
              title="View all tagged creators and untag"
            >
              {/* Stacked Small Profile Avatars */}
              <div className="flex items-center -space-x-1.5 overflow-hidden py-0.5">
                {taggedUsers.slice(0, 2).map((u, i) => (
                  <img
                    key={u.id || i}
                    src={u.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop'}
                    alt={u.display_name}
                    className="w-5 h-5 rounded-full object-cover ring-1.5 ring-[#0c0c14] shrink-0"
                  />
                ))}
                {taggedUsers.length === 0 && (
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white/40 ring-1.5 ring-[#0c0c14]">
                    <Users size={10} />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-0.5 sm:gap-1 text-xs">
                <span className="font-bold text-emerald-400 text-xs">{taggedUsers.length}</span>
                <span className="text-white/80 group-hover:text-emerald-300 font-medium text-[11px] hidden sm:inline">
                  Tagged
                </span>
                <ChevronRight size={11} className="text-white/30 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            <button
              type="button"
              id="refresh-tagged-feed"
              onClick={handleRefresh}
              title="Refresh Feed"
              className="p-1.5 sm:p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/8 transition-all active:scale-95"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin text-white' : ''} />
            </button>
            <AtmosphereControls />
          </div>
        </div>

        {/* Feed Tab Navigation — Horizontally scrollable and mobile friendly */}
        <div className="max-w-xl mx-auto mt-2 border-t border-white/5 pt-1">
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar scroll-smooth w-full py-0.5">
            <button
              type="button"
              id="tab-tagged-along"
              onClick={() => handleTabSelect('tagged_along')}
              className={cn(
                'relative px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap',
                activeTab === 'tagged_along'
                  ? 'text-white bg-white/10 shadow-sm'
                  : 'text-white/45 hover:text-white/75 hover:bg-white/5'
              )}
            >
              <span>Tagged Along</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {taggedIds.length}
              </span>
              {activeTab === 'tagged_along' && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-emerald-400 rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabSelect('visuals')}
              className={cn(
                'relative px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap',
                activeTab === 'visuals'
                  ? 'text-white bg-white/10 shadow-sm'
                  : 'text-white/45 hover:text-white/75 hover:bg-white/5'
              )}
            >
              <Camera size={13} />
              <span>Visuals</span>
              {activeTab === 'visuals' && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-emerald-400 rounded-full" />
              )}
            </button>

            <button
              type="button"
              id="tab-polls"
              onClick={() => handleTabSelect('polls')}
              className={cn(
                'relative px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap',
                activeTab === 'polls'
                  ? 'text-white bg-white/10 shadow-sm'
                  : 'text-white/45 hover:text-white/75 hover:bg-white/5'
              )}
            >
              <BarChart2 size={13} />
              <span>Polls</span>
              {activeTab === 'polls' && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-emerald-400 rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabSelect('bookmarks')}
              className={cn(
                'relative px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ml-auto shrink-0 whitespace-nowrap',
                activeTab === 'bookmarks'
                  ? 'text-white bg-white/10 shadow-sm'
                  : 'text-white/35 hover:text-white/75 hover:bg-white/5'
              )}
              title="Saved posts"
            >
              <Bookmark size={13} fill={activeTab === 'bookmarks' ? 'currentColor' : 'none'} />
              {activeTab === 'bookmarks' && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-emerald-400 rounded-full" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-xl mx-auto w-full px-2.5 sm:px-3 pt-2.5 sm:pt-3 flex-1">
        {/* Search Bar */}
        <div className="mb-3">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3.5 text-white/35 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reflections, tags, polls..."
              className="w-full pl-9 sm:pl-10 pr-9 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs sm:text-sm text-white placeholder-white/35 focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.08] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-1 text-white/40 hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Microblog World Composer or Eligibility Restriction Card */}
        {!canPostInTagged ? (
          <TaggedPostingEligibilityCard onOpenRules={() => setShowRulesModal(true)} />
        ) : (
          <>
            {taggerStatus === 'grace_period' && (
              <TaggedGracePeriodBanner onOpenRules={() => setShowRulesModal(true)} />
            )}
            <section className="mb-3.5 sm:mb-4 rounded-2xl bg-black/35 backdrop-blur-md border border-white/10 p-3 sm:p-3.5 shadow-md">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="shrink-0 pt-0.5">
                  <UserAvatar
                    user={
                      currentUser
                        ? {
                            id: currentUser.id,
                            display_name: currentUser.display_name || 'You',
                            avatar_url: currentUser.avatar_url || '',
                            country: currentUser.country || '',
                          }
                        : { id: 'me', display_name: 'You' }
                    }
                    size="md"
                    shape="circle"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <textarea
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    placeholder="Share a glimpse into your world... (photos, GIFs, stickers, thoughts)"
                    rows={2}
                    maxLength={280}
                    className="w-full bg-transparent border-0 text-[14px] text-white placeholder-white/35 focus:outline-none resize-none leading-relaxed"
                  />

                  {/* Selected Sticker Badge */}
                  {selectedSticker && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border mb-2.5 mr-2 animate-fade-in shadow-sm"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        borderColor: 'rgba(255,255,255,0.2)',
                      }}
                    >
                      <span className="text-sm">{selectedSticker.emoji}</span>
                      <span className={selectedSticker.color}>{selectedSticker.label}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedSticker(null)}
                        className="p-0.5 rounded-full hover:bg-white/20 text-white/60 hover:text-white"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  )}

                  {/* Attached Image Preview */}
                  {selectedImage && (
                    <div className="relative rounded-xl overflow-hidden border border-white/15 mb-2.5 max-h-48 group">
                      <img src={selectedImage} alt="Attached snapshot" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-all"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )}

                  {/* Attached GIF Preview */}
                  {selectedGif && (
                    <div className="relative rounded-xl overflow-hidden border border-white/15 mb-2.5 max-h-44 group">
                      <img src={selectedGif} alt="Attached GIF" className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 left-2 text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-white/80">
                        GIF
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedGif(null)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-all"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )}

                  {/* Location & Mood input bar */}
                  {showLocationInput && (
                    <div className="flex items-center gap-2 mb-2 pt-1 border-t border-white/5 animate-fade-in">
                      <div className="flex-1 flex items-center gap-1 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/8 text-xs">
                        <MapPin size={12} className="text-emerald-400 shrink-0" />
                        <input
                          type="text"
                          placeholder="Add location (e.g. Kyoto, Japan)"
                          value={customLocation}
                          onChange={(e) => setCustomLocation(e.target.value)}
                          className="bg-transparent text-white placeholder-white/30 focus:outline-none w-full text-[11px]"
                        />
                      </div>
                      <div className="w-1/3 flex items-center gap-1 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/8 text-xs">
                        <input
                          type="text"
                          placeholder="#MoodTag"
                          value={customMood}
                          onChange={(e) => setCustomMood(e.target.value)}
                          className="bg-transparent text-white placeholder-white/30 focus:outline-none w-full text-[11px]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Poll Builder Inline Form */}
                  {showPollBuilder && (
                    <TaggedPollBuilder
                      draft={pollDraft}
                      onChange={setPollDraft}
                      onRemove={() => {
                        setShowPollBuilder(false);
                        setPollDraft({
                          question: '',
                          options: ['', ''],
                          durationDays: 1,
                        });
                      }}
                    />
                  )}

                  {/* Composer Toolbar */}
                  <div className="flex items-center justify-between border-t border-white/8 pt-2.5 mt-1 gap-1">
                    <div className="flex items-center gap-0.5 sm:gap-1 min-w-0 overflow-x-auto no-scrollbar">
                      {/* Photo attachment button */}
                      <button
                        type="button"
                        onClick={() => setShowPhotoPicker(true)}
                        className={cn(
                          'p-1.5 sm:p-2 rounded-xl text-xs transition-all flex items-center gap-1 shrink-0',
                          selectedImage ? 'bg-emerald-500/20 text-emerald-300' : 'text-white/60 hover:text-white hover:bg-white/10'
                        )}
                        title="Attach Photo or Presets"
                      >
                        <ImageIcon size={15} />
                        <span className="text-[11px] hidden sm:inline">Photo</span>
                      </button>

                      {/* GIF attachment button */}
                      <button
                        type="button"
                        onClick={() => setShowGifPicker(true)}
                        className={cn(
                          'p-1.5 sm:p-2 rounded-xl text-xs transition-all flex items-center gap-1 shrink-0',
                          selectedGif ? 'bg-emerald-500/20 text-emerald-300' : 'text-white/60 hover:text-white hover:bg-white/10'
                        )}
                        title="Pick GIF"
                      >
                        <span className="text-[10px] font-mono font-bold px-1 py-0.5 rounded bg-white/10 border border-white/15">
                          GIF
                        </span>
                        <span className="text-[11px] hidden sm:inline">GIF</span>
                      </button>

                      {/* Sticker button */}
                      <button
                        type="button"
                        onClick={() => setShowStickerPicker(true)}
                        className={cn(
                          'p-1.5 sm:p-2 rounded-xl text-xs transition-all flex items-center gap-1 shrink-0',
                          selectedSticker ? 'bg-indigo-500/20 text-indigo-300' : 'text-white/60 hover:text-white hover:bg-white/10'
                        )}
                        title="Attach Mood Sticker"
                      >
                        <StickerIcon size={15} />
                        <span className="text-[11px] hidden sm:inline">Sticker</span>
                      </button>

                      {/* Poll creation toggle button */}
                      <button
                        type="button"
                        id="compose-poll-btn"
                        onClick={() => setShowPollBuilder((prev) => !prev)}
                        className={cn(
                          'p-1.5 sm:p-2 rounded-xl text-xs transition-all flex items-center gap-1 shrink-0',
                          showPollBuilder
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'text-white/60 hover:text-white hover:bg-white/10'
                        )}
                        title="Create a Poll"
                      >
                        <BarChart2 size={15} />
                        <span className="text-[11px] hidden sm:inline">Poll</span>
                      </button>

                      {/* Location toggle button */}
                      <button
                        type="button"
                        onClick={() => setShowLocationInput((prev) => !prev)}
                        className={cn(
                          'p-1.5 sm:p-2 rounded-xl text-xs transition-all shrink-0',
                          customLocation || showLocationInput ? 'text-emerald-400 bg-emerald-500/10' : 'text-white/60 hover:text-white hover:bg-white/10'
                        )}
                        title="Add Location tag"
                      >
                        <MapPin size={15} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <span className={cn('text-[10px] font-mono', composerText.length > 250 ? 'text-amber-400' : 'text-white/30')}>
                        {280 - composerText.length}
                      </span>
                      <button
                        type="button"
                        id="publish-tagged-post"
                        onClick={handlePublish}
                        disabled={
                          !composerText.trim() &&
                          !selectedImage &&
                          !selectedGif &&
                          !selectedSticker &&
                          (!showPollBuilder || pollDraft.options.filter((o) => o.trim()).length < 2)
                        }
                        className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-emerald-400 text-black text-xs font-semibold hover:bg-emerald-300 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm active:scale-95"
                      >
                        <span>Drop a Rut</span>
                        <Send size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Feed Posts List (Social Timeline with TaggedPostCard or Shimmer Skeleton) */}
        {isFeedLoading || isTabTransitioning ? (
          <TaggedFeedSkeleton
            count={activeTab === 'polls' ? 3 : activeTab === 'visuals' ? 3 : 4}
            variant={activeTab === 'polls' ? 'poll' : activeTab === 'visuals' ? 'image' : 'mixed'}
          />
        ) : filteredPosts.length > 0 ? (
          <div className="divide-y divide-white/[0.06] rounded-2xl bg-black/35 backdrop-blur-md border border-white/10 overflow-hidden">
            {filteredPosts.map((post) => {
              const userIsTagged = isTagged(post.user.id);
              const isLiked = likedIds.includes(post.id);
              const isReposted = repostedIds.includes(post.id);
              const isBookmarked = bookmarkedIds.includes(post.id);

              return (
                <TaggedPostCard
                  key={post.id}
                  post={post}
                  isTagged={userIsTagged}
                  isLiked={isLiked}
                  isReposted={isReposted}
                  isBookmarked={isBookmarked}
                  onToggleTag={toggleTag}
                  onToggleLike={toggleLike}
                  onToggleRepost={toggleRepost}
                  onToggleBookmark={toggleBookmark}
                  onOpenThread={setActiveThreadPost}
                  onShare={setSharingPost}
                  onOpenProfile={setProfileUser}
                  onZoomImage={setZoomedImage}
                  onReportPost={setReportingPost}
                  currentUserId={currentUser?.id}
                />
              );
            })}
          </div>
        ) : (
          /* Empty Feed State */
          <div className="my-12 rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
              <Sparkles size={24} />
            </div>
            <h3 className="text-base font-semibold text-white/90">
              {taggedUsers.length === 0
                ? "You haven't tagged along with anyone yet"
                : searchQuery
                ? 'No matching posts found'
                : 'Your Tagged feed is quiet'}
            </h3>
            <p className="mt-1.5 text-xs text-white/45 max-w-sm leading-relaxed">
              {taggedUsers.length === 0
                ? 'Tag along with creators to walk through their worlds and see what they share on Tagged.'
                : searchQuery
                ? 'Try clearing your search query to see other reflections.'
                : 'Creators in your tagged circle haven’t shared any new updates yet.'}
            </p>

            <button
              type="button"
              onClick={() => setShowTaggedSheet(true)}
              className="mt-5 px-5 py-2.5 rounded-2xl bg-emerald-400 text-black text-xs font-bold hover:bg-emerald-300 transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <Users size={14} />
              <span>
                {taggedUsers.length === 0 ? 'Discover & Tag Creators' : `Manage Tagged (${taggedUsers.length})`}
              </span>
            </button>
          </div>
        )}
      </main>

      {/* ===================== MODAL: STICKER PACK SELECTOR ===================== */}
      {showStickerPicker && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-3 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowStickerPicker(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-white/10 bg-[#12121c] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/8 mb-4">
              <div className="flex items-center gap-2">
                <StickerIcon size={16} className="text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Select a Mood Sticker</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStickerPicker(false)}
                className="p-1 rounded-full text-white/40 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto no-scrollbar py-1">
              {stickerPack.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    setSelectedSticker(st);
                    setShowStickerPicker(false);
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-2xl border bg-white/[0.03] border-white/10 hover:border-white/25 hover:bg-white/[0.08] transition-all text-left group"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">{st.emoji}</span>
                  <span className={cn('text-xs font-medium truncate', st.color)}>{st.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: GIF SELECTOR ===================== */}
      {showGifPicker && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-3 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowGifPicker(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#12121c] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/8 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 border border-white/15">
                  GIF
                </span>
                <h3 className="text-sm font-bold text-white">Pick an Atmospheric GIF</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGifPicker(false)}
                className="p-1 rounded-full text-white/40 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mb-3 pb-1">
              {['All', 'Aesthetic', 'Vibe', 'Mood', 'Night', 'Art', 'Reactions'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setGifCategory(cat)}
                  className={cn(
                    'shrink-0 text-xs px-2.5 py-1 rounded-full border transition-all',
                    gifCategory === cat
                      ? 'bg-white text-black border-white font-semibold'
                      : 'bg-white/5 text-white/60 border-white/8 hover:text-white'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* GIF Grid */}
            <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto no-scrollbar py-1">
              {filteredGifs.map((gif) => (
                <div
                  key={gif.id}
                  onClick={() => {
                    setSelectedGif(gif.url);
                    setSelectedImage(null); // Replace photo if any
                    setShowGifPicker(false);
                  }}
                  className="group relative rounded-xl overflow-hidden border border-white/10 hover:border-emerald-400 cursor-pointer aspect-square bg-black/40"
                >
                  <img src={gif.url} alt={gif.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <span className="absolute bottom-1 left-1 text-[8px] font-mono px-1 py-0.2 rounded bg-black/70 text-white/90 truncate max-w-[90%]">
                    {gif.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: PHOTO ATTACHMENT / PRESETS ===================== */}
      {showPhotoPicker && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-3 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowPhotoPicker(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-white/10 bg-[#12121c] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/8 mb-3">
              <div className="flex items-center gap-2">
                <ImageIcon size={16} className="text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Attach Photo</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPhotoPicker(false)}
                className="p-1 rounded-full text-white/40 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Option 1: Upload from device */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-4 rounded-2xl border-2 border-dashed border-white/20 hover:border-emerald-400 hover:bg-white/[0.04] transition-all flex flex-col items-center justify-center gap-2 text-center mb-4 group"
            >
              <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                <Upload size={20} />
              </div>
              <span className="text-xs font-semibold text-white">Upload from your device</span>
              <span className="text-[10px] text-white/40">Supports PNG, JPG, WebP up to 8MB</span>
            </button>

            {/* Option 2: Curated atmospheric presets */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-2">
                Or pick an atmospheric snapshot
              </p>
              <div className="grid grid-cols-3 gap-2">
                {photoPresets.map((preset, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSelectedImage(preset.url);
                      setSelectedGif(null);
                      setShowPhotoPicker(false);
                    }}
                    className="relative aspect-square rounded-xl overflow-hidden border border-white/10 hover:border-emerald-400 cursor-pointer group"
                  >
                    <img src={preset.url} alt={preset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <span className="absolute bottom-1 left-1 text-[8px] font-mono px-1 py-0.2 rounded bg-black/70 text-white/90">
                      {preset.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: EXPANDED FULL POST & VERTICAL THREAD VIEW ===================== */}
      <TaggedPostDetailModal
        post={currentActivePost}
        isOpen={!!currentActivePost}
        onClose={() => setActiveThreadPost(null)}
        isTagged={currentActivePost ? isTagged(currentActivePost.user.id) : false}
        isLiked={currentActivePost ? likedIds.includes(currentActivePost.id) : false}
        isReposted={currentActivePost ? repostedIds.includes(currentActivePost.id) : false}
        isBookmarked={currentActivePost ? bookmarkedIds.includes(currentActivePost.id) : false}
        onToggleTag={toggleTag}
        onToggleLike={toggleLike}
        onToggleRepost={toggleRepost}
        onToggleBookmark={toggleBookmark}
        onAddReply={handleModalReply}
        onShare={(post) => setSharingPost(post)}
        onOpenProfile={(user) => setProfileUser(user)}
        onZoomImage={(url) => setZoomedImage(url)}
        onReportPost={(post) => setReportingPost(post)}
        currentUser={currentUser}
        stickerPack={stickerPack}
      />

      {/* ===================== MODAL: REPORT POST ===================== */}
      {reportingPost && (
        <ReportModal
          scrutId={reportingPost.id}
          title="Report this Post"
          subtitle="Why are you reporting this post?"
          itemType="post"
          onClose={() => setReportingPost(null)}
        />
      )}

      {/* ===================== MODAL: IMAGE LIGHTBOX ===================== */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl">
            <img src={zoomedImage} alt="Fullscreen view" className="w-full h-full object-contain max-h-[85vh]" />
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-black transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* User Profile Sheet (Tag Along button integrated) */}
      {profileUser && (
        <ScrutDetailSheet
          user={profileUser}
          onClose={() => setProfileUser(null)}
        />
      )}

      {/* Tagged People Sheet (View all tagged creators, discover, and untag) */}
      <TaggedUsersSheet
        open={showTaggedSheet}
        onClose={() => setShowTaggedSheet(false)}
        onOpenProfile={(u) => setProfileUser(u)}
      />

      {/* Share Social Card Modal */}
      {sharingPost && (
        <ShareModal
          conversation={{
            id: sharingPost.id,
            user_id: sharingPost.user.id,
            user: sharingPost.user,
            type: 'statement',
            body: sharingPost.text || 'Glimpse into my world on Scruttin Tagged',
            topic: sharingPost.location_tag || 'Tagged',
            created_at: sharingPost.created_at,
            scrut_count: sharingPost.like_count,
            country_count: 1,
            is_platform: false,
            circulation_score: 0.9,
          }}
          scrut={{
            id: sharingPost.id,
            conversation_id: 'tagged',
            user_id: sharingPost.user.id,
            user: sharingPost.user,
            text: sharingPost.text,
            type: 'text',
            created_at: sharingPost.created_at,
            resonate_count: sharingPost.like_count,
            resonated_by_me: likedIds.includes(sharingPost.id),
          }}
          onClose={() => setSharingPost(null)}
        />
      )}

      {/* Tagged Posting Eligibility & Rules Modal */}
      <TaggedRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />
    </div>
  );
}
