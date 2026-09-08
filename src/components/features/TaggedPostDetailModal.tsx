import { useState, useMemo, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  X,
  MessageCircle,
  Repeat2,
  Heart,
  Bookmark,
  Share2,
  MapPin,
  Smile,
  Send,
  UserPlus,
  UserCheck,
  MoreHorizontal,
  Copy,
  Check,
  Eye,
  Sparkles,
  ExternalLink,
  Flag,
} from 'lucide-react';
import type { TaggedPostItem, TaggedSticker, TaggedReply } from '@/constants/taggedData';
import type { User } from '@/types';
import UserAvatar from '@/components/features/UserAvatar';
import TaggedPollCard from '@/components/features/TaggedPollCard';
import { cn, timeAgo, formatCount } from '@/lib/utils';
import { toast } from 'sonner';

interface TaggedPostDetailModalProps {
  post: TaggedPostItem | null;
  isOpen: boolean;
  onClose: () => void;
  isTagged: boolean;
  isLiked: boolean;
  isReposted: boolean;
  isBookmarked: boolean;
  onToggleTag: (user: User) => void;
  onToggleLike: (postId: string) => void;
  onToggleRepost: (postId: string) => void;
  onToggleBookmark: (postId: string) => void;
  onAddReply: (postId: string, text: string, sticker?: TaggedSticker) => void;
  onShare: (post: TaggedPostItem) => void;
  onOpenProfile: (user: User) => void;
  onZoomImage: (imageUrl: string) => void;
  onReportPost?: (post: TaggedPostItem) => void;
  currentUser: User | null;
  stickerPack: TaggedSticker[];
}

export default function TaggedPostDetailModal({
  post,
  isOpen,
  onClose,
  isTagged,
  isLiked,
  isReposted,
  isBookmarked,
  onToggleTag,
  onToggleLike,
  onToggleRepost,
  onToggleBookmark,
  onAddReply,
  onShare,
  onOpenProfile,
  onZoomImage,
  onReportPost,
  currentUser,
  stickerPack,
}: TaggedPostDetailModalProps) {
  const [replyText, setReplyText] = useState('');
  const [selectedSticker, setSelectedSticker] = useState<TaggedSticker | null>(null);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [repostAnimating, setRepostAnimating] = useState(false);
  const [replyLikes, setReplyLikes] = useState<Record<string, { count: number; liked: boolean }>>({});

  const replyInputRef = useRef<HTMLInputElement | null>(null);
  const repliesContainerRef = useRef<HTMLDivElement | null>(null);

  // Focus reply input if opened via reply intent
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setShowMenu(false);
      setShowStickerPicker(false);
      setReplyText('');
      setSelectedSticker(null);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !post) return null;

  const isAuthor = currentUser?.id === post.user.id;
  const userHandle =
    post.user.twitter ||
    post.user.display_name.toLowerCase().replace(/[^a-z0-9_]/g, '') ||
    'creator';

  const handleLike = () => {
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 400);
    onToggleLike(post.id);
  };

  const handleRepost = () => {
    setRepostAnimating(true);
    setTimeout(() => setRepostAnimating(false), 400);
    onToggleRepost(post.id);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/tagged#${post.id}`);
    setCopied(true);
    toast.success('Thread link copied!');
    setTimeout(() => {
      setCopied(false);
      setShowMenu(false);
    }, 1500);
  };

  const handleSubmitReply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() && !selectedSticker) return;

    onAddReply(post.id, replyText.trim(), selectedSticker || undefined);
    setReplyText('');
    setSelectedSticker(null);
    setShowStickerPicker(false);

    // Scroll to bottom of replies smoothly
    setTimeout(() => {
      if (repliesContainerRef.current) {
        repliesContainerRef.current.scrollTop = repliesContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  const toggleReplyLike = (replyId: string, initialLikes: number) => {
    setReplyLikes((prev) => {
      const current = prev[replyId] || { count: initialLikes, liked: false };
      const nextLiked = !current.liked;
      return {
        ...prev,
        [replyId]: {
          count: current.count + (nextLiked ? 1 : -1),
          liked: nextLiked,
        },
      };
    });
  };

  // Format exact date for full view
  const formattedExactDate = (() => {
    try {
      const d = new Date(post.created_at);
      const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      return `${timeStr} · ${dateStr}`;
    } catch {
      return timeAgo(post.created_at);
    }
  })();

  // Render text with clickable hashtags/mentions
  const formattedText = (() => {
    if (!post.text) return null;
    const parts = post.text.split(/(\s+)/);
    return parts.map((part, idx) => {
      if (part.startsWith('#') && part.length > 1) {
        return (
          <span key={idx} className="text-emerald-400 hover:underline font-medium cursor-pointer">
            {part}
          </span>
        );
      }
      if (part.startsWith('@') && part.length > 1) {
        return (
          <span key={idx} className="text-sky-400 hover:underline font-medium cursor-pointer">
            {part}
          </span>
        );
      }
      return part;
    });
  })();

  const replies = post.replies || [];

  return (
    <div
      id="tagged-post-detail-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 overflow-hidden animate-fade-in"
      onClick={onClose}
    >
      {/* Modal Card */}
      <div
        className="relative w-full sm:max-w-2xl h-[92vh] sm:h-auto sm:max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[#0e0e17] border-t sm:border border-white/12 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-3.5 sm:px-6 py-3 sm:py-3.5 bg-[#0e0e17]/95 backdrop-blur-xl border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 -ml-1 sm:-ml-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors touch-manipulation active:scale-95"
              title="Back to feed"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight">Thread</h2>
              <p className="text-[11px] text-white/40 leading-none mt-0.5">
                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onShare(post)}
              className="p-1.5 sm:p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors touch-manipulation active:scale-95"
              title="Share thread"
            >
              <Share2 size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 -mr-1 sm:-mr-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors touch-manipulation active:scale-95"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Main Scrollable Thread View */}
        <div
          ref={repliesContainerRef}
          className="flex-1 overflow-y-auto px-3.5 sm:px-6 py-3 sm:py-4 space-y-4 no-scrollbar divide-y divide-white/[0.06]"
        >
          {/* ================= 1. PRIMARY EXPANDED POST ================= */}
          <article className="pb-4">
            {/* Re-rut banner if reposted */}
            {isReposted && (
              <div className="flex items-center gap-2 text-[12px] font-semibold text-emerald-400 mb-3 pl-1">
                <Repeat2 size={13} />
                <span>You re-rutted this to your world</span>
              </div>
            )}

            {/* Author Info & Tag Along Pill */}
            <div className="flex items-center justify-between gap-3 mb-3.5">
              <div
                className="flex items-center gap-3 cursor-pointer group/author"
                onClick={() => onOpenProfile(post.user)}
              >
                <UserAvatar user={post.user} size="lg" shape="circle" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-white text-[16px] leading-tight group-hover/author:underline truncate">
                      {post.user.display_name}
                    </span>
                  </div>
                  <p className="text-[13px] text-white/45 font-normal">@{userHandle}</p>
                </div>
              </div>

              {/* Tag Along / Untag Action & More Options */}
              <div className="flex items-center gap-2 shrink-0">
                {!isAuthor && post.user.id !== 'platform' && (
                  <button
                    type="button"
                    onClick={() => onToggleTag(post.user)}
                    className={cn(
                      'text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all flex items-center gap-1.5 active:scale-95',
                      isTagged
                        ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10 hover:border-rose-500/40 hover:text-rose-300 hover:bg-rose-500/10'
                        : 'border-white/20 text-white bg-white/10 hover:bg-emerald-400 hover:text-black hover:border-emerald-400'
                    )}
                  >
                    {isTagged ? (
                      <>
                        <UserCheck size={13} />
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

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <MoreHorizontal size={17} />
                  </button>

                  {showMenu && (
                    <div
                      className="absolute right-0 top-full mt-1 w-44 rounded-2xl bg-[#161624] border border-white/15 p-1.5 shadow-2xl z-30 animate-fade-in"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          onOpenProfile(post.user);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors text-left"
                      >
                        <ExternalLink size={13} className="text-white/50" />
                        <span>View Profile</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors text-left"
                      >
                        {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} className="text-white/50" />}
                        <span>{copied ? 'Copied!' : 'Copy link'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          if (onReportPost) {
                            onReportPost(post);
                          } else {
                            toast.info('Report post requested');
                          }
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 rounded-xl transition-colors text-left"
                      >
                        <Flag size={13} className="text-rose-400" />
                        <span>Report post</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Attached Mood Sticker */}
            {post.sticker && (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border mb-3 shadow-sm"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderColor: 'rgba(255,255,255,0.15)',
                }}
              >
                <span className="text-base">{post.sticker.emoji}</span>
                <span className={post.sticker.color}>{post.sticker.label}</span>
              </div>
            )}

            {/* Post Expanded Text */}
            {post.text && (
              <p className="text-[17px] leading-[1.6] text-[#f4f6fa] whitespace-pre-line mb-3.5 select-text tracking-[-0.01em]">
                {formattedText}
              </p>
            )}

            {/* Attached Poll */}
            {post.poll && (
              <div className="mb-3.5">
                <TaggedPollCard
                  postId={post.id}
                  poll={post.poll}
                  isAuthor={isAuthor}
                />
              </div>
            )}

            {/* Attached Image (Full view) */}
            {post.image_url && (
              <div
                className="relative rounded-2xl overflow-hidden border border-white/12 mb-3.5 group/img cursor-zoom-in max-h-[480px] bg-black/40"
                onClick={() => onZoomImage(post.image_url || '')}
              >
                <img
                  src={post.image_url}
                  alt="Full visual moment"
                  className="w-full h-full object-cover max-h-[480px] group-hover/img:scale-[1.01] transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                  <span className="p-2.5 rounded-full bg-black/70 text-white backdrop-blur-md shadow-lg">
                    <Eye size={18} />
                  </span>
                </div>
              </div>
            )}

            {/* Attached GIF (Full view) */}
            {post.gif_url && (
              <div
                className="relative rounded-2xl overflow-hidden border border-white/12 mb-3.5 group/gif max-h-[380px] cursor-zoom-in bg-black/40"
                onClick={() => onZoomImage(post.gif_url || '')}
              >
                <img
                  src={post.gif_url}
                  alt="Shared GIF"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-3 left-3 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-black/80 text-white border border-white/20">
                  GIF
                </span>
              </div>
            )}

            {/* Metadata (Timestamp & Location Tag) */}
            <div className="flex items-center gap-3 text-[13px] text-white/45 py-2.5 border-y border-white/[0.08] mb-3">
              <span>{formattedExactDate}</span>
              <span className="text-white/20">·</span>
              <span className="text-white/45">Scruttin Tagged</span>
              {post.location_tag && (
                <>
                  <span className="text-white/20">·</span>
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <MapPin size={12} />
                    {post.location_tag}
                  </span>
                </>
              )}
            </div>

            {/* Engagement Stats Bar */}
            <div className="flex items-center gap-5 text-[13px] text-white/60 py-2 border-b border-white/[0.08] mb-2">
              <div>
                <strong className="text-white font-semibold">
                  {formatCount(post.retag_count + (isReposted ? 1 : 0))}
                </strong>{' '}
                <span className="text-white/45">Re-ruts</span>
              </div>
              <div>
                <strong className="text-white font-semibold">
                  {formatCount(post.like_count + (isLiked ? 1 : 0))}
                </strong>{' '}
                <span className="text-white/45">Likes</span>
              </div>
              <div>
                <strong className="text-white font-semibold">
                  {formatCount(replies.length)}
                </strong>{' '}
                <span className="text-white/45">Replies</span>
              </div>
              {isBookmarked && (
                <div className="text-amber-400 text-xs flex items-center gap-1 ml-auto">
                  <Bookmark size={13} fill="currentColor" />
                  <span>Saved</span>
                </div>
              )}
            </div>

            {/* Interactive Engagement Action Buttons */}
            <div className="flex items-center justify-around py-1 text-white/50">
              <button
                type="button"
                onClick={() => replyInputRef.current?.focus()}
                className="flex items-center gap-2 p-2 rounded-full hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                title="Reply"
              >
                <MessageCircle size={18} />
              </button>

              <button
                type="button"
                onClick={handleRepost}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-full transition-colors',
                  isReposted
                    ? 'text-emerald-400 bg-emerald-500/15 font-semibold'
                    : 'hover:text-emerald-400 hover:bg-emerald-500/10'
                )}
                title="Re-rut"
              >
                <Repeat2
                  size={18}
                  className={cn(repostAnimating && 'rotate-180 scale-125 transition-transform')}
                />
              </button>

              <button
                type="button"
                onClick={handleLike}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-full transition-colors',
                  isLiked
                    ? 'text-rose-500 bg-rose-500/15 font-semibold'
                    : 'hover:text-rose-400 hover:bg-rose-500/10'
                )}
                title="Like"
              >
                <Heart
                  size={18}
                  fill={isLiked ? 'currentColor' : 'none'}
                  className={cn(
                    'transition-all duration-200',
                    likeAnimating && 'scale-130',
                    isLiked && 'drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                  )}
                />
              </button>

              <button
                type="button"
                onClick={() => onToggleBookmark(post.id)}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-full transition-colors',
                  isBookmarked
                    ? 'text-amber-400 bg-amber-500/15'
                    : 'hover:text-amber-400 hover:bg-amber-500/10'
                )}
                title="Bookmark"
              >
                <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
              </button>

              <button
                type="button"
                onClick={() => onShare(post)}
                className="flex items-center gap-2 p-2 rounded-full hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                title="Share"
              >
                <Share2 size={18} />
              </button>
            </div>
          </article>

          {/* ================= 2. VERTICAL THREAD REPLIES ================= */}
          <div className="pt-4 space-y-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3 px-1">
              Replies & Conversations
            </h3>

            {replies.length > 0 ? (
              <div className="relative">
                {replies.map((rep, idx) => {
                  const isLast = idx === replies.length - 1;
                  const repLikeState = replyLikes[rep.id] || { count: rep.likes || 0, liked: false };
                  const repHandle =
                    rep.user.twitter ||
                    rep.user.display_name.toLowerCase().replace(/[^a-z0-9_]/g, '') ||
                    'user';

                  return (
                    <div key={rep.id} className="relative flex items-start gap-3.5 py-3 group/reply">
                      {/* Vertical Spine / Connector Line */}
                      {!isLast && (
                        <div
                          className="absolute left-[18px] top-11 bottom-0 w-[2px] bg-white/[0.12] group-hover/reply:bg-white/[0.22] transition-colors"
                          aria-hidden="true"
                        />
                      )}

                      {/* Reply Author Avatar with thread node */}
                      <div
                        className="shrink-0 cursor-pointer pt-0.5 relative z-10"
                        onClick={() => onOpenProfile(rep.user)}
                      >
                        <UserAvatar user={rep.user} size="sm" shape="circle" />
                      </div>

                      {/* Reply Content Box */}
                      <div className="flex-1 min-w-0 pb-1">
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            <button
                              type="button"
                              onClick={() => onOpenProfile(rep.user)}
                              className="font-bold text-white text-[14px] hover:underline truncate cursor-pointer leading-tight"
                            >
                              {rep.user.display_name}
                            </button>
                            <span className="text-[12px] text-white/45">@{repHandle}</span>
                            <span className="text-white/20 text-xs">·</span>
                            <span className="text-[12px] text-white/45">{timeAgo(rep.created_at)}</span>
                          </div>
                        </div>

                        {/* Replying to badge */}
                        <div className="text-[11px] text-white/40 mb-1.5">
                          Replying to <span className="text-emerald-400 font-medium">@{userHandle}</span>
                        </div>

                        {/* Attached Sticker */}
                        {rep.sticker && (
                          <div
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border mb-2 shadow-sm"
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.06)',
                              borderColor: 'rgba(255,255,255,0.15)',
                            }}
                          >
                            <span>{rep.sticker.emoji}</span>
                            <span className={rep.sticker.color}>{rep.sticker.label}</span>
                          </div>
                        )}

                        {/* Reply Text */}
                        <p className="text-[14px] leading-relaxed text-[#e6e8ec] whitespace-pre-line select-text font-normal">
                          {rep.text}
                        </p>

                        {/* Reply Action Bar */}
                        <div className="flex items-center gap-4 mt-2 text-white/40 text-xs">
                          <button
                            type="button"
                            onClick={() => toggleReplyLike(rep.id, rep.likes || 0)}
                            className={cn(
                              'flex items-center gap-1.5 py-1 px-1.5 -ml-1.5 rounded-lg transition-colors',
                              repLikeState.liked
                                ? 'text-rose-400 bg-rose-400/10 font-semibold'
                                : 'hover:text-rose-400 hover:bg-rose-400/10'
                            )}
                          >
                            <Heart size={13} fill={repLikeState.liked ? 'currentColor' : 'none'} />
                            <span>{repLikeState.count > 0 ? repLikeState.count : ''}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setReplyText(`@${repHandle} `);
                              replyInputRef.current?.focus();
                            }}
                            className="flex items-center gap-1.5 py-1 px-1.5 rounded-lg hover:text-sky-400 hover:bg-sky-400/10 transition-colors"
                          >
                            <MessageCircle size={13} />
                            <span>Reply</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 px-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] my-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2.5">
                  <Sparkles size={18} />
                </div>
                <p className="text-sm font-semibold text-white/90 mb-1">No replies yet</p>
                <p className="text-xs text-white/45 max-w-xs mx-auto">
                  Be the first to reply and connect with @{post.user.display_name}’s world!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ================= 3. STICKY BOTTOM REPLY COMPOSER ================= */}
        <footer className="sticky bottom-0 z-20 p-2.5 sm:p-4 pb-3 sm:pb-4 bg-[#0e0e17]/95 backdrop-blur-xl border-t border-white/[0.08]">
          {/* Attached Sticker Chip Preview */}
          {selectedSticker && (
            <div className="flex items-center gap-1.5 mb-2.5">
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-sm"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  borderColor: 'rgba(255,255,255,0.2)',
                }}
              >
                <span>{selectedSticker.emoji}</span>
                <span className={selectedSticker.color}>{selectedSticker.label}</span>
                <button
                  type="button"
                  onClick={() => setSelectedSticker(null)}
                  className="p-0.5 text-white/60 hover:text-white rounded-full ml-0.5 touch-manipulation active:scale-95"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Sticker Popover Selector */}
          {showStickerPicker && (
            <div className="mb-3 p-2.5 rounded-2xl bg-[#181826] border border-white/15 shadow-xl animate-fade-in">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 px-1">
                <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
                  Pick a Mood Sticker
                </span>
                <button
                  type="button"
                  onClick={() => setShowStickerPicker(false)}
                  className="p-1 text-white/40 hover:text-white rounded-full touch-manipulation"
                >
                  <X size={13} />
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto no-scrollbar">
                {stickerPack.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setSelectedSticker(st);
                      setShowStickerPicker(false);
                      replyInputRef.current?.focus();
                    }}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors touch-manipulation active:scale-95"
                  >
                    <span className="text-sm">{st.emoji}</span>
                    <span className="text-[11px] font-medium text-white/80 truncate">{st.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Row with Current User Avatar */}
          <form onSubmit={handleSubmitReply} className="flex items-center gap-2">
            {currentUser && (
              <div className="shrink-0 hidden sm:block">
                <UserAvatar user={currentUser} size="sm" shape="circle" />
              </div>
            )}

            <div className="flex-1 relative flex items-center bg-white/[0.05] border border-white/12 focus-within:border-emerald-500/50 rounded-2xl px-3 py-1.5 transition-colors">
              <input
                ref={replyInputRef}
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Post reply to @${userHandle}...`}
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-white/35 focus:outline-none pr-8 sm:pr-10"
              />

              <button
                type="button"
                onClick={() => setShowStickerPicker(!showStickerPicker)}
                className={cn(
                  'absolute right-1.5 sm:right-2 p-1.5 rounded-xl transition-colors touch-manipulation active:scale-95',
                  selectedSticker || showStickerPicker
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-white/40 hover:text-white hover:bg-white/10'
                )}
                title="Attach mood sticker"
              >
                <Smile size={16} />
              </button>
            </div>

            <button
              type="submit"
              disabled={!replyText.trim() && !selectedSticker}
              className="px-3 sm:px-4 py-2 rounded-xl bg-emerald-400 text-black text-xs font-bold hover:bg-emerald-300 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95 touch-manipulation"
            >
              <span>Reply</span>
              <Send size={12} />
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}
