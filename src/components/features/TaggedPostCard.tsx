import { useState, useMemo } from 'react';
import {
  MessageCircle,
  Repeat2,
  Heart,
  Bookmark,
  Share2,
  MapPin,
  Eye,
  MoreHorizontal,
  UserCheck,
  UserPlus,
  Check,
  Copy,
  ExternalLink,
  Flag,
} from 'lucide-react';
import type { TaggedPostItem } from '@/constants/taggedData';
import type { User } from '@/types';
import UserAvatar from '@/components/features/UserAvatar';
import TaggedPollCard from '@/components/features/TaggedPollCard';
import { cn, timeAgo, formatCount } from '@/lib/utils';
import { toast } from 'sonner';

interface TaggedPostCardProps {
  post: TaggedPostItem;
  isTagged: boolean;
  isLiked: boolean;
  isReposted: boolean;
  isBookmarked: boolean;
  onToggleTag: (user: User) => void;
  onToggleLike: (postId: string) => void;
  onToggleRepost: (postId: string) => void;
  onToggleBookmark: (postId: string) => void;
  onOpenThread: (post: TaggedPostItem) => void;
  onShare: (post: TaggedPostItem) => void;
  onOpenProfile: (user: User) => void;
  onZoomImage: (imageUrl: string) => void;
  onReportPost?: (post: TaggedPostItem) => void;
  currentUserId?: string;
}

export default function TaggedPostCard({
  post,
  isTagged,
  isLiked,
  isReposted,
  isBookmarked,
  onToggleTag,
  onToggleLike,
  onToggleRepost,
  onToggleBookmark,
  onOpenThread,
  onShare,
  onOpenProfile,
  onZoomImage,
  onReportPost,
  currentUserId,
}: TaggedPostCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [repostAnimating, setRepostAnimating] = useState(false);
  const [copied, setCopied] = useState(false);

  const isAuthor = currentUserId === post.user.id;
  const userHandle =
    post.user.twitter ||
    post.user.display_name.toLowerCase().replace(/[^a-z0-9_]/g, '') ||
    'creator';

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 400);
    onToggleLike(post.id);
  };

  const handleRepostClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRepostAnimating(true);
    setTimeout(() => setRepostAnimating(false), 400);
    onToggleRepost(post.id);
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/tagged#${post.id}`);
    setCopied(true);
    toast.success('Post link copied to clipboard!');
    setTimeout(() => {
      setCopied(false);
      setShowMenu(false);
    }, 1500);
  };

  // Render text with styled hashtags and mentions
  const formattedText = useMemo(() => {
    if (!post.text) return null;
    const parts = post.text.split(/(\s+)/);
    return parts.map((part, idx) => {
      if (part.startsWith('#') && part.length > 1) {
        return (
          <span
            key={idx}
            onClick={(e) => e.stopPropagation()}
            className="text-emerald-400 hover:underline font-medium cursor-pointer"
          >
            {part}
          </span>
        );
      }
      if (part.startsWith('@') && part.length > 1) {
        return (
          <span
            key={idx}
            onClick={(e) => e.stopPropagation()}
            className="text-sky-400 hover:underline font-medium cursor-pointer"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  }, [post.text]);

  return (
    <article
      id={`post-${post.id}`}
      onClick={() => onOpenThread(post)}
      className="group relative border-b border-white/[0.08] hover:bg-white/[0.035] transition-colors duration-150 px-3 py-3 sm:px-5 sm:py-4 cursor-pointer"
    >
      {/* Re-rut context banner above post header (like X / Bluesky repost header) */}
      {isReposted && (
        <div className="flex items-center gap-2 text-[12px] font-semibold text-emerald-400/90 mb-2 pl-6 sm:pl-9 tracking-tight">
          <Repeat2 size={13} className="text-emerald-400" />
          <span>Re-rutted by you</span>
        </div>
      )}

      <div className="flex items-start gap-2.5 sm:gap-3.5">
        {/* Left Column: Author Avatar */}
        <div
          className="shrink-0 cursor-pointer pt-0.5"
          onClick={(e) => {
            e.stopPropagation();
            onOpenProfile(post.user);
          }}
          title={`View ${post.user.display_name}'s profile`}
        >
          <div className="relative group/avatar">
            <UserAvatar user={post.user} size="md" shape="circle" />
            <div className="absolute inset-0 rounded-full bg-white/0 group-hover/avatar:bg-white/10 transition-colors" />
          </div>
        </div>

        {/* Right Column: Post Header, Body, Media, Actions */}
        <div className="flex-1 min-w-0">
          {/* Post Header Row */}
          <div className="flex items-start justify-between gap-1 mb-1">
            <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-wrap">
              {/* Display Name */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenProfile(post.user);
                }}
                className="font-bold text-white text-[14px] sm:text-[15px] leading-snug hover:underline truncate cursor-pointer tracking-tight"
              >
                {post.user.display_name}
              </button>

              {/* Handle */}
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenProfile(post.user);
                }}
                className="text-[13px] sm:text-[14px] text-white/45 font-normal truncate hover:text-white/60 cursor-pointer"
              >
                @{userHandle}
              </span>

              <span className="text-white/30 text-xs font-mono select-none">·</span>

              {/* Relative Timestamp */}
              <span
                className="text-[13px] sm:text-[14px] text-white/45 hover:underline cursor-pointer select-none shrink-0"
                title={new Date(post.created_at).toLocaleString()}
              >
                {timeAgo(post.created_at)}
              </span>
            </div>

            {/* Header Right Actions: Tag Along pill or More Menu */}
            <div className="relative shrink-0 flex items-center gap-1">
              {!isAuthor && post.user.id !== 'platform' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTag(post.user);
                  }}
                  className={cn(
                    'text-[11px] font-semibold px-2 sm:px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 active:scale-95',
                    isTagged
                      ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10 hover:border-rose-500/40 hover:text-rose-300 hover:bg-rose-500/10'
                      : 'border-white/20 text-white bg-white/10 hover:bg-emerald-400 hover:text-black hover:border-emerald-400'
                  )}
                  title={isTagged ? 'Untag from your world' : 'Tag along with this creator'}
                >
                  {isTagged ? (
                    <>
                      <UserCheck size={11} />
                      <span className="hidden sm:inline">Tagged</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={11} />
                      <span className="hidden sm:inline">Tag Along</span>
                    </>
                  )}
                </button>
              )}

              {/* More options menu button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors active:scale-95"
                  title="More options"
                >
                  <MoreHorizontal size={16} />
                </button>

                {showMenu && (
                  <div
                    className="absolute right-0 top-full mt-1 w-44 rounded-2xl bg-[#161622] border border-white/15 p-1.5 shadow-2xl z-20 animate-fade-in"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
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
                    {!isAuthor && post.user.id !== 'platform' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          onToggleTag(post.user);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors text-left"
                      >
                        <UserCheck size={13} className={isTagged ? 'text-rose-400' : 'text-emerald-400'} />
                        <span>{isTagged ? 'Untag creator' : 'Tag along'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
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

          {/* Attached Mood Sticker Badge */}
          {post.sticker && (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border mb-2 shadow-sm"
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderColor: 'rgba(255,255,255,0.15)',
              }}
            >
              <span className="text-sm">{post.sticker.emoji}</span>
              <span className={post.sticker.color}>{post.sticker.label}</span>
            </div>
          )}

          {/* Post Content Body */}
          {post.text && (
            <p className="text-[15px] leading-[1.55] text-[#f2f4f8] whitespace-pre-line mb-3 select-text font-normal tracking-[-0.01em]">
              {formattedText}
            </p>
          )}

          {/* Attached Poll */}
          {post.poll && (
            <TaggedPollCard
              postId={post.id}
              poll={post.poll}
              isAuthor={isAuthor}
            />
          )}

          {/* Attached Photo */}
          {post.image_url && (
            <div
              className="relative rounded-2xl overflow-hidden border border-white/10 mb-3 group/img cursor-zoom-in max-h-96 bg-black/30"
              onClick={(e) => {
                e.stopPropagation();
                onZoomImage(post.image_url || '');
              }}
            >
              <img
                src={post.image_url}
                alt="Visual moment"
                className="w-full h-full object-cover group-hover/img:scale-[1.01] transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                <span className="p-2 rounded-full bg-black/60 text-white backdrop-blur-md shadow-md">
                  <Eye size={16} />
                </span>
              </div>
            </div>
          )}

          {/* Attached GIF */}
          {post.gif_url && (
            <div
              className="relative rounded-2xl overflow-hidden border border-white/10 mb-3 group/gif max-h-80 cursor-zoom-in bg-black/40"
              onClick={(e) => {
                e.stopPropagation();
                onZoomImage(post.gif_url || '');
              }}
            >
              <img
                src={post.gif_url}
                alt="Shared GIF"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2.5 left-2.5 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-black/80 text-white border border-white/15">
                GIF
              </span>
            </div>
          )}

          {/* Location & Mood metadata row */}
          {(post.location_tag || post.mood_tag) && (
            <div className="flex items-center gap-2.5 text-[12px] text-white/45 mb-3">
              {post.location_tag && (
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <MapPin size={12} />
                  {post.location_tag}
                </span>
              )}
              {post.mood_tag && (
                <span className="text-white/50 font-medium hover:text-white/80 transition-colors">
                  {post.mood_tag}
                </span>
              )}
            </div>
          )}

          {/* X / Bluesky Style Engagement Action Bar */}
          <div className="flex items-center justify-between max-w-md pt-1 border-t border-white/[0.04] text-white/45 text-xs">
            {/* 1. Reply */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenThread(post);
              }}
              className="group/btn flex items-center gap-1.5 sm:gap-2 p-1.5 -ml-1.5 rounded-full hover:text-sky-400 transition-colors touch-manipulation active:scale-95"
              title="Reply to post"
            >
              <div className="p-1.5 rounded-full group-hover/btn:bg-sky-500/15 transition-colors">
                <MessageCircle size={16} className="group-hover/btn:scale-110 transition-transform" />
              </div>
              <span className="text-[12px] sm:text-[13px] font-medium leading-none min-w-[10px] text-left">
                {post.reply_count > 0 ? post.reply_count : ''}
              </span>
            </button>

            {/* 2. Re-rut (Repost / Re-tag) */}
            <button
              type="button"
              onClick={handleRepostClick}
              className={cn(
                'group/btn flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-full transition-colors touch-manipulation active:scale-95',
                isReposted
                  ? 'text-emerald-400 font-semibold'
                  : 'hover:text-emerald-400'
              )}
              title={isReposted ? 'Undo Re-rut' : 'Re-rut to your world'}
            >
              <div className="p-1.5 rounded-full group-hover/btn:bg-emerald-500/15 transition-colors">
                <Repeat2
                  size={16}
                  className={cn(
                    'transition-transform',
                    repostAnimating ? 'rotate-180 scale-125' : 'group-hover/btn:scale-110'
                  )}
                />
              </div>
              <span className="text-[12px] sm:text-[13px] font-medium leading-none min-w-[10px] text-left">
                {post.retag_count + (isReposted ? 1 : 0) > 0
                  ? post.retag_count + (isReposted ? 1 : 0)
                  : ''}
              </span>
            </button>

            {/* 3. Like with heart animation */}
            <button
              type="button"
              onClick={handleLikeClick}
              className={cn(
                'group/btn flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-full transition-colors touch-manipulation active:scale-95',
                isLiked
                  ? 'text-rose-500 font-semibold'
                  : 'hover:text-rose-400'
              )}
              title={isLiked ? 'Unlike' : 'Like'}
            >
              <div className="p-1.5 rounded-full group-hover/btn:bg-rose-500/15 transition-colors">
                <Heart
                  size={16}
                  fill={isLiked ? 'currentColor' : 'none'}
                  className={cn(
                    'transition-all duration-200',
                    likeAnimating ? 'scale-130' : 'group-hover/btn:scale-110',
                    isLiked && 'drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                  )}
                />
              </div>
              <span className="text-[12px] sm:text-[13px] font-medium leading-none min-w-[10px] text-left">
                {post.like_count + (isLiked ? 1 : 0) > 0
                  ? formatCount(post.like_count + (isLiked ? 1 : 0))
                  : ''}
              </span>
            </button>

            {/* 4. Bookmark */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(post.id);
              }}
              className={cn(
                'group/btn flex items-center gap-1 sm:gap-1.5 p-1.5 rounded-full transition-colors touch-manipulation active:scale-95',
                isBookmarked
                  ? 'text-amber-400 font-semibold'
                  : 'hover:text-amber-400'
              )}
              title={isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
            >
              <div className="p-1.5 rounded-full group-hover/btn:bg-amber-500/15 transition-colors">
                <Bookmark
                  size={16}
                  fill={isBookmarked ? 'currentColor' : 'none'}
                  className="group-hover/btn:scale-110 transition-transform"
                />
              </div>
            </button>

            {/* 5. Share */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShare(post);
              }}
              className="group/btn flex items-center gap-1 sm:gap-1.5 p-1.5 -mr-1.5 rounded-full hover:text-sky-400 transition-colors touch-manipulation active:scale-95"
              title="Share post"
            >
              <div className="p-1.5 rounded-full group-hover/btn:bg-sky-500/15 transition-colors">
                <Share2 size={16} className="group-hover/btn:scale-110 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
