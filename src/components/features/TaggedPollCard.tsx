/**
 * TaggedPollCard — Interactive voting and live results component for Tagged text posts.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, CheckCircle2, Check, Clock, Sparkles, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaggedPoll } from '@/constants/taggedData';
import { useTagged } from '@/stores/taggedContext';

interface TaggedPollCardProps {
  postId: string;
  poll: TaggedPoll;
  isAuthor?: boolean;
}

export default function TaggedPollCard({ postId, poll, isAuthor = false }: TaggedPollCardProps) {
  const { votePoll, getUserPollVote } = useTagged();
  const userVotedOptionId = getUserPollVote(postId) || poll.user_voted_option_id;
  const [showResultsOnly, setShowResultsOnly] = useState(false);
  const [justVoted, setJustVoted] = useState(false);

  const hasVoted = Boolean(userVotedOptionId);
  const totalVotes = poll.total_votes || 0;

  // Calculate highest voted option for winner highlight
  const maxVotes = Math.max(...poll.options.map((o) => o.votes), 0);

  // Clear "just voted" feedback after animation completes
  useEffect(() => {
    if (justVoted) {
      const timer = setTimeout(() => setJustVoted(false), 2400);
      return () => clearTimeout(timer);
    }
  }, [justVoted]);

  const handleVote = (e: React.MouseEvent, optionId: string) => {
    e.stopPropagation();
    setJustVoted(true);
    votePoll(postId, optionId);
    setShowResultsOnly(false);
  };

  const handleToggleViewResults = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowResultsOnly((prev) => !prev);
  };

  // Determine if we should display percentage bars
  const showResults = hasVoted || showResultsOnly || isAuthor;

  // Check if poll ended
  const isPollClosed = Boolean(poll.ends_at && new Date(poll.ends_at).getTime() <= Date.now());

  // Calculate time remaining representation
  const getTimeRemaining = () => {
    if (!poll.ends_at) return 'Active poll';
    const end = new Date(poll.ends_at).getTime();
    const now = Date.now();
    const diffHours = Math.round((end - now) / (1000 * 60 * 60));
    if (diffHours <= 0) return 'Final results';
    if (diffHours < 24) return `${diffHours}h left`;
    const days = Math.round(diffHours / 24);
    return `${days}d left`;
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="rounded-2xl border border-white/12 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-3 sm:p-3.5 mb-3 select-none backdrop-blur-sm shadow-inner transition-all"
    >
      {/* Poll Header */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
            <BarChart2 size={13} />
          </div>
          <span className="text-xs font-semibold text-white/90 truncate">
            {poll.question || 'Community Poll'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-white/50 shrink-0 font-medium">
          <span className="inline-flex items-center gap-1">
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                isPollClosed ? 'bg-white/30' : 'bg-emerald-400 animate-pulse'
              )}
            />
            <Clock size={11} className="text-white/40" />
            <span>{getTimeRemaining()}</span>
          </span>
        </div>
      </div>

      {/* Options List */}
      <div className="space-y-2">
        <AnimatePresence initial={false} mode="wait">
          {showResults ? (
            <motion.div
              key="results-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-2"
            >
              {poll.options.map((option, index) => {
                const isSelected = userVotedOptionId === option.id;
                const isLeader = maxVotes > 0 && option.votes === maxVotes && totalVotes > 0;
                const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;

                return (
                  <motion.div
                    key={option.id}
                    onClick={(e) => handleVote(e, option.id)}
                    animate={
                      isLeader && justVoted
                        ? {
                            scale: [1, 1.018, 1],
                            transition: { duration: 0.5, ease: 'easeOut', delay: 0.1 },
                          }
                        : undefined
                    }
                    className={cn(
                      'relative overflow-hidden rounded-xl border p-2.5 transition-all group/opt cursor-pointer',
                      // Winning option highlight styling
                      isLeader && isSelected
                        ? 'border-amber-400/60 bg-gradient-to-r from-amber-500/[0.12] via-emerald-500/[0.08] to-amber-500/[0.03] shadow-[0_0_22px_rgba(251,191,36,0.22)] ring-1 ring-amber-400/50'
                        : isLeader
                        ? 'border-amber-400/50 bg-gradient-to-r from-amber-500/[0.09] via-amber-400/[0.04] to-transparent shadow-[0_0_18px_rgba(251,191,36,0.16)] ring-1 ring-amber-400/40'
                        : isSelected
                        ? 'border-emerald-500/45 bg-emerald-500/[0.09] ring-1 ring-emerald-500/30'
                        : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20'
                    )}
                    title={isLeader ? 'Leading choice · Click to vote' : 'Click to vote or switch your choice'}
                  >
                    {/* Animated fill progress bar */}
                    <motion.div
                      key={`progress-${option.id}-${percentage}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(percentage, 2)}%` }}
                      transition={{
                        type: 'spring',
                        damping: 22,
                        stiffness: 120,
                        mass: 0.8,
                        delay: index * 0.05,
                      }}
                      className={cn(
                        'absolute inset-y-0 left-0 rounded-xl pointer-events-none',
                        isLeader && isSelected
                          ? 'bg-gradient-to-r from-emerald-500/35 via-amber-400/30 to-amber-300/20'
                          : isLeader
                          ? 'bg-gradient-to-r from-amber-400/35 via-amber-300/20 to-amber-100/10'
                          : isSelected
                          ? 'bg-gradient-to-r from-emerald-500/30 to-emerald-500/15'
                          : 'bg-white/[0.08]'
                      )}
                    >
                      {/* Subtle shimmering light sweep across the winning bar */}
                      {isLeader && totalVotes > 0 && (
                        <motion.div
                          initial={{ x: '-100%', opacity: 0 }}
                          animate={{ x: '250%', opacity: [0, 0.75, 0] }}
                          transition={{
                            repeat: Infinity,
                            repeatDelay: 2.2,
                            duration: 1.6,
                            ease: 'easeInOut',
                          }}
                          className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-amber-200/30 to-transparent pointer-events-none"
                        />
                      )}
                    </motion.div>

                    {/* Content Overlay */}
                    <div className="relative z-10 flex items-center justify-between gap-2.5 text-xs">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <span
                          className={cn(
                            'font-mono text-[11px] shrink-0 w-3 transition-colors',
                            isLeader ? 'text-amber-300/80 font-bold' : 'text-white/40'
                          )}
                        >
                          {index + 1}.
                        </span>
                        <span
                          className={cn(
                            'truncate text-[12px] sm:text-[13px] transition-colors',
                            isLeader && isSelected
                              ? 'text-white font-bold'
                              : isLeader
                              ? 'text-amber-50 font-semibold'
                              : isSelected
                              ? 'text-white font-semibold'
                              : 'text-white/85'
                          )}
                        >
                          {option.text}
                        </span>

                        {/* Winning Option Highlight Badge */}
                        {isLeader && totalVotes > 0 && (
                          <motion.span
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', damping: 16, stiffness: 220 }}
                            className={cn(
                              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold shrink-0 tracking-wide',
                              isSelected
                                ? 'bg-amber-400/25 text-amber-200 border border-amber-400/50 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                                : 'bg-amber-400/15 text-amber-300 border border-amber-400/40'
                            )}
                            title={isPollClosed ? 'Final winner' : 'Currently leading the poll'}
                          >
                            <Crown size={10} className="text-amber-300 fill-amber-300/40" />
                            <span>{isPollClosed ? 'Winner' : 'Winning'}</span>
                          </motion.span>
                        )}

                        {/* User Voted Badge */}
                        {isSelected && (
                          <motion.span
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 shrink-0"
                          >
                            <Check size={9} />
                            <span>Voted</span>
                          </motion.span>
                        )}
                      </div>

                      {/* Percentage & Vote Count */}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 font-mono text-xs">
                        <span className="text-[11px] text-white/45 hidden sm:inline">
                          {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
                        </span>
                        <motion.span
                          key={`${percentage}-${option.votes}`}
                          initial={{ scale: 0.9, opacity: 0.8 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className={cn(
                            'text-[12px] sm:text-[13px] font-bold min-w-[34px] text-right transition-colors',
                            isLeader
                              ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.35)] font-extrabold'
                              : isSelected
                              ? 'text-emerald-400'
                              : 'text-white/75'
                          )}
                        >
                          {percentage}%
                        </motion.span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="ballot-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              {poll.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={(e) => handleVote(e, option.id)}
                  className="w-full text-left rounded-xl border border-white/15 bg-white/[0.04] hover:bg-emerald-500/10 hover:border-emerald-500/40 p-2.5 transition-all group/btn flex items-center justify-between gap-3 active:scale-[0.99] touch-manipulation"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-4 w-4 rounded-full border border-white/30 group-hover/btn:border-emerald-400 group-hover/btn:bg-emerald-400/20 transition-all flex items-center justify-center shrink-0">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-[13px] text-white/90 group-hover/btn:text-white truncate font-medium">
                      {option.text}
                    </span>
                  </div>

                  <span className="text-[11px] text-white/40 group-hover/btn:text-emerald-300 font-mono shrink-0 transition-colors">
                    Vote
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Poll Footer */}
      <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between flex-wrap gap-2 text-[11px] text-white/45">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white/70">
            {totalVotes} {totalVotes === 1 ? 'total vote' : 'total votes'}
          </span>
          {hasVoted && (
            <>
              <span className="text-white/20">·</span>
              <span className="text-emerald-400/90 font-medium flex items-center gap-1">
                <CheckCircle2 size={11} />
                <span>Voted</span>
              </span>
            </>
          )}
          {justVoted && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-amber-300 font-medium flex items-center gap-1"
            >
              <Sparkles size={10} />
              <span>Results updated</span>
            </motion.span>
          )}
        </div>

        <div>
          {!hasVoted && !isAuthor && (
            <button
              type="button"
              onClick={handleToggleViewResults}
              className="hover:text-white transition-colors underline underline-offset-2 touch-manipulation"
            >
              {showResultsOnly ? 'Hide live results' : 'View results without voting'}
            </button>
          )}
          {hasVoted && (
            <span className="text-white/40 text-[10px]">
              Tap any option to switch vote
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
