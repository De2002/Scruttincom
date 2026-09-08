import { useNavigate } from 'react-router-dom';
import {
  X,
  Lock,
  Clock,
  Heart,
  Radio,
  Compass,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { useTagged } from '@/stores/taggedContext';
import { cn } from '@/lib/utils';

interface TaggedRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TaggedRulesModal({ isOpen, onClose }: TaggedRulesModalProps) {
  const navigate = useNavigate();
  const {
    taggersCount,
    taggersThreshold,
    taggerStatus,
    gracePeriodDaysRemaining,
    gracePeriodHoursRemaining,
  } = useTagged();

  if (!isOpen) return null;

  const isUnlocked = taggerStatus === 'unlocked';
  const isGrace = taggerStatus === 'grace_period';
  const isRestricted = taggerStatus === 'restricted' || taggerStatus === 'locked';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tagged-rules-title"
      className="fixed inset-0 z-[500] flex items-center justify-center p-3 sm:p-4 animate-fade-in"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog Box */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-neutral-900 border border-white/12 shadow-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-white/8">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Community Guidelines
            </span>
            <h2 id="tagged-rules-title" className="text-lg font-bold text-white mt-1.5">
              Tagged Posting Rules & Eligibility
            </h2>
            <p className="text-xs text-white/50 mt-0.5">
              How posting access, taggers, and grace periods work in Tagged
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Current User Status Chip Card */}
        <div className="mb-4 p-3.5 rounded-xl bg-black/40 border border-white/8">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40 font-medium">Your Current Status</span>
            <span
              className={cn(
                'text-[11px] font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1 font-mono',
                isUnlocked && 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                isGrace && 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                isRestricted && 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              )}
            >
              {isUnlocked && <CheckCircle2 size={11} />}
              {isGrace && <Clock size={11} />}
              {isRestricted && <Lock size={11} />}
              {isUnlocked
                ? 'Posting Unlocked'
                : isGrace
                ? `Grace Period (${gracePeriodDaysRemaining}d ${gracePeriodHoursRemaining}h left)`
                : 'Posting Restricted'}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {taggersCount}
            </span>
            <span className="text-white/40 text-xs font-mono font-medium">
              / {taggersThreshold} Taggers
            </span>
          </div>
        </div>

        {/* The 4 Core Rules */}
        <div className="space-y-3 mb-5">
          {/* Rule 1 */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/8 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <UserCheck size={16} />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white">
                1. 100 Taggers to Post in Tagged
              </h3>
              <p className="text-[12px] text-white/60 mt-0.5 leading-relaxed">
                For one to post in Tagged you must have at least 100 taggers (people who have tagged along with your profile). Otherwise you cannot post new glimpses, and your current taggers count is displayed over the composer.
              </p>
            </div>
          </div>

          {/* Rule 2 */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/8 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
              <Clock size={16} />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white">
                2. 7-Day Grace Period if Taggers Drop
              </h3>
              <p className="text-[12px] text-white/60 mt-0.5 leading-relaxed">
                If your number of taggers goes down to maybe 98 (or below 100), you are given a 7-day grace period before being restricted from posting new stuff under Tagged. You can still post normally during these 7 days while working to regain 100 taggers.
              </p>
            </div>
          </div>

          {/* Rule 3 */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/8 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-pink-500/15 border border-pink-500/25 flex items-center justify-center text-pink-300 shrink-0 mt-0.5">
              <Heart size={16} />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white">
                3. Full Engagement with Those You Tagged
              </h3>
              <p className="text-[12px] text-white/60 mt-0.5 leading-relaxed">
                Even if your posting access is restricted, you are never locked out of the community. You can always engage with the creators you have tagged along with — liking, bookmarking, replying, and voting on polls.
              </p>
            </div>
          </div>

          {/* Rule 4 */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/8 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white">
                4. Full Access to Stream & Dive (Earn Taggers Here)
              </h3>
              <p className="text-[12px] text-white/60 mt-0.5 leading-relaxed">
                You have 100% full access to Stream and Dive as always. To get taggers, make use of Dive or Stream! Share voice answers and take stances — when others connect with your thoughts, they tag along with your profile.
              </p>
            </div>
          </div>
        </div>

        {/* Direct Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/8">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/stream');
            }}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-200 border border-violet-500/30 text-xs font-semibold transition-all"
          >
            <Radio size={14} className="text-violet-400" />
            <span>Open Stream</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/dive');
            }}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-200 border border-sky-500/30 text-xs font-semibold transition-all"
          >
            <Compass size={14} className="text-sky-400" />
            <span>Explore Dive</span>
          </button>
        </div>
      </div>
    </div>
  );
}
