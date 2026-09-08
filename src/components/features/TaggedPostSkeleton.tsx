import { MessageCircle, Repeat2, Heart, Bookmark, Share2, ImageIcon, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TaggedSkeletonVariant = 'text' | 'image' | 'poll' | 'mixed';

interface TaggedPostSkeletonProps {
  variant?: 'text' | 'image' | 'poll';
  hasRescrutHeader?: boolean;
  hasRerutHeader?: boolean;
  className?: string;
}

/**
 * Individual high-fidelity shimmer skeleton card replicating TaggedPostCard anatomy:
 * - Re-rut header (optional)
 * - User avatar with pulse/shimmer
 * - User display name, handle, timestamp, and Tag Along button
 * - Post text lines with realistic variable widths
 * - Media block / Poll options / Mood tag placeholders
 * - Footer reaction counts and action buttons
 */
export function TaggedPostSkeleton({
  variant = 'text',
  hasRescrutHeader = false,
  hasRerutHeader = false,
  className,
}: TaggedPostSkeletonProps) {
  const showRerut = hasRerutHeader || hasRescrutHeader;
  return (
    <article
      aria-hidden="true"
      className={cn(
        'relative border-b border-white/[0.08] px-3 py-3.5 sm:px-5 sm:py-4 shimmer-sweep select-none pointer-events-none',
        className
      )}
    >
      {/* Optional Re-rut Header */}
      {showRerut && (
        <div className="flex items-center gap-2 mb-2.5 pl-6 sm:pl-9">
          <Repeat2 size={13} className="text-emerald-400/40 shrink-0" />
          <div className="h-3 w-28 rounded-md bg-white/[0.07] animate-pulse" />
        </div>
      )}

      <div className="flex items-start gap-2.5 sm:gap-3.5">
        {/* Left Column: Author Avatar Skeleton */}
        <div className="shrink-0 pt-0.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/[0.08] ring-1 ring-white/10 animate-pulse" />
        </div>

        {/* Right Column: Post Content */}
        <div className="flex-1 min-w-0">
          {/* Header Row: Name, Handle, Timestamp, Tag Button */}
          <div className="flex items-start justify-between gap-1 mb-2">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
              {/* Display name */}
              <div className="h-4 w-24 sm:w-32 rounded-md bg-white/[0.12] animate-pulse" />
              {/* Tagged badge placeholder */}
              <div className="h-3.5 w-12 rounded-full bg-emerald-500/15 border border-emerald-500/20" />
              {/* Handle */}
              <div className="h-3.5 w-16 sm:w-20 rounded-md bg-white/[0.05] animate-pulse" />
              <span className="text-white/20 text-xs font-mono">·</span>
              {/* Timestamp */}
              <div className="h-3.5 w-10 rounded-md bg-white/[0.05] animate-pulse" />
            </div>

            {/* Top Right Action Button Placeholder */}
            <div className="h-6 w-14 sm:w-16 rounded-full bg-white/[0.07] border border-white/[0.08] shrink-0" />
          </div>

          {/* Location / Mood Tag Skeleton (Randomly or subtly displayed) */}
          {variant !== 'poll' && (
            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="h-4 w-28 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center px-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400/30 mr-1.5" />
                <div className="h-2 w-16 rounded bg-white/[0.08]" />
              </div>
            </div>
          )}

          {/* Text Content Skeleton (Variable widths for organic editorial feel) */}
          <div className="space-y-2 mb-3">
            <div className="h-3.5 w-[96%] rounded bg-white/[0.09] animate-pulse" />
            <div className="h-3.5 w-[84%] rounded bg-white/[0.07] animate-pulse" />
            {variant === 'text' && (
              <div className="h-3.5 w-[62%] rounded bg-white/[0.05] animate-pulse" />
            )}
          </div>

          {/* Media / Attachment Variation: Image / Photo Post */}
          {variant === 'image' && (
            <div className="mb-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.07] overflow-hidden aspect-[16/10] sm:aspect-[16/9] w-full flex flex-col items-center justify-center relative">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/20 mb-2">
                <ImageIcon size={22} className="animate-pulse" />
              </div>
              <div className="h-2.5 w-24 rounded bg-white/[0.06]" />
              {/* Corner Pill Skeleton */}
              <div className="absolute bottom-2.5 right-2.5 h-5 w-16 rounded-full bg-black/40 backdrop-blur-sm border border-white/10" />
            </div>
          )}

          {/* Media / Attachment Variation: Poll Post */}
          {variant === 'poll' && (
            <div className="mb-3.5 space-y-2 rounded-2xl bg-white/[0.02] border border-white/[0.06] p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <BarChart2 size={13} className="text-emerald-400/50" />
                <div className="h-3 w-16 rounded bg-white/[0.08]" />
              </div>
              {/* Option 1 */}
              <div className="h-9 w-full rounded-xl bg-white/[0.05] border border-white/[0.07] px-3 flex items-center justify-between">
                <div className="h-3 w-32 rounded bg-white/[0.1] animate-pulse" />
                <div className="h-3 w-8 rounded bg-white/[0.06]" />
              </div>
              {/* Option 2 */}
              <div className="h-9 w-full rounded-xl bg-white/[0.03] border border-white/[0.05] px-3 flex items-center justify-between">
                <div className="h-3 w-24 rounded bg-white/[0.08] animate-pulse" />
                <div className="h-3 w-8 rounded bg-white/[0.05]" />
              </div>
              {/* Poll footer meta */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-white/20 px-1">
                <div className="h-2.5 w-20 rounded bg-white/[0.04]" />
                <div className="h-2.5 w-16 rounded bg-white/[0.04]" />
              </div>
            </div>
          )}

          {/* Footer Actions Row Skeleton */}
          <div className="flex items-center justify-between pt-1 text-white/20">
            {/* Reply */}
            <div className="flex items-center gap-1.5 py-1">
              <MessageCircle size={15} className="opacity-40" />
              <div className="h-3 w-6 rounded bg-white/[0.06] animate-pulse" />
            </div>

            {/* Repost */}
            <div className="flex items-center gap-1.5 py-1">
              <Repeat2 size={16} className="opacity-40" />
              <div className="h-3 w-5 rounded bg-white/[0.06] animate-pulse" />
            </div>

            {/* Like */}
            <div className="flex items-center gap-1.5 py-1">
              <Heart size={15} className="opacity-40" />
              <div className="h-3 w-6 rounded bg-white/[0.06] animate-pulse" />
            </div>

            {/* Bookmark */}
            <div className="py-1">
              <Bookmark size={15} className="opacity-40" />
            </div>

            {/* Share */}
            <div className="py-1">
              <Share2 size={15} className="opacity-40" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Renders a sequence of skeleton cards with mixed or targeted realistic layouts
 * (Text thought, image/photo post, poll post, and rescrutted post)
 */
export default function TaggedFeedSkeleton({
  count = 4,
  variant = 'mixed',
}: {
  count?: number;
  variant?: 'mixed' | 'text' | 'image' | 'poll';
}) {
  // Balanced variations matching actual feed dynamics
  const mixedVariants: Array<{ variant: 'text' | 'image' | 'poll'; hasRescrutHeader?: boolean }> = [
    { variant: 'text', hasRescrutHeader: true },
    { variant: 'image', hasRescrutHeader: false },
    { variant: 'poll', hasRescrutHeader: false },
    { variant: 'text', hasRescrutHeader: false },
    { variant: 'image', hasRescrutHeader: false },
  ];

  const items = Array.from({ length: Math.max(1, count) }).map((_, idx) => {
    if (variant === 'poll') {
      return { variant: 'poll' as const, hasRescrutHeader: false };
    }
    if (variant === 'image') {
      return { variant: 'image' as const, hasRescrutHeader: false };
    }
    if (variant === 'text') {
      return { variant: 'text' as const, hasRescrutHeader: idx === 0 };
    }
    return mixedVariants[idx % mixedVariants.length];
  });

  return (
    <div
      id="tagged-feed-skeleton-loader"
      aria-label="Loading posts"
      className="divide-y divide-white/[0.06] rounded-2xl bg-black/35 backdrop-blur-md border border-white/10 overflow-hidden"
    >
      {items.map((item, index) => (
        <TaggedPostSkeleton
          key={index}
          variant={item.variant}
          hasRescrutHeader={item.hasRescrutHeader}
        />
      ))}
    </div>
  );
}
