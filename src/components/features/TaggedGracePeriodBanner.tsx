import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Radio, Compass, ChevronDown, ChevronUp, Sparkles, ArrowRight } from 'lucide-react';
import { useTagged } from '@/stores/taggedContext';

interface TaggedGracePeriodBannerProps {
  onOpenRules?: () => void;
}

export default function TaggedGracePeriodBanner({ onOpenRules }: TaggedGracePeriodBannerProps) {
  const navigate = useNavigate();
  const {
    taggersCount,
    taggersThreshold,
    gracePeriodDaysRemaining,
    gracePeriodHoursRemaining,
    simulateTaggersScenario,
    incrementTaggers,
  } = useTagged();

  const [showSimControls, setShowSimControls] = useState(false);
  const needed = Math.max(0, taggersThreshold - taggersCount);

  return (
    <aside
      aria-label="Grace period warning"
      className="mb-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-transparent border border-amber-500/30 p-3 sm:p-3.5 shadow-md relative overflow-hidden"
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/35 flex items-center justify-center text-amber-300 shrink-0 mt-0.5 animate-pulse">
            <Clock size={16} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 border border-amber-500/35 font-mono">
                7-Day Grace Period
              </span>
              <span className="text-xs font-mono font-semibold text-white/90">
                {taggersCount} / {taggersThreshold} Taggers ({needed} needed)
              </span>
            </div>

            <p className="text-xs text-white/85 mt-1 leading-relaxed">
              Your taggers dropped to <strong className="text-amber-300 font-mono font-semibold">{taggersCount}</strong>. You have{' '}
              <strong className="text-white font-semibold font-mono">
                {gracePeriodDaysRemaining ?? 7}d {gracePeriodHoursRemaining ?? 0}h remaining
              </strong>{' '}
              to reach 100 before posting new glimpses is restricted.
            </p>

            <p className="text-[11px] text-amber-200/70 mt-1 flex items-center gap-1.5">
              <Sparkles size={11} className="text-amber-400 shrink-0" />
              <span>You can still post and engage with accounts you tagged along with right now!</span>
            </p>
          </div>
        </div>

        {onOpenRules && (
          <button
            type="button"
            onClick={onOpenRules}
            className="text-[11px] font-medium text-amber-300 hover:text-amber-200 underline underline-offset-2 shrink-0 pt-0.5"
          >
            Rules
          </button>
        )}
      </div>

      {/* Quick Action Bar to Earn Taggers in Stream / Dive */}
      <div className="mt-2.5 pt-2 border-t border-amber-500/15 flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            id="grace-banner-stream-btn"
            onClick={() => navigate('/stream')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white/90 text-[11px] font-medium transition-all"
          >
            <Radio size={12} className="text-violet-300" />
            <span>Earn in Stream</span>
            <ArrowRight size={10} className="text-white/40" />
          </button>

          <button
            type="button"
            id="grace-banner-dive-btn"
            onClick={() => navigate('/dive')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white/90 text-[11px] font-medium transition-all"
          >
            <Compass size={12} className="text-sky-300" />
            <span>Earn in Dive</span>
            <ArrowRight size={10} className="text-white/40" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowSimControls((p) => !p)}
          className="text-[10px] text-white/40 hover:text-white/70 flex items-center gap-1 font-mono ml-auto py-1"
        >
          <span>Test Tools</span>
          {showSimControls ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
      </div>

      {/* Quick Testing Toggles */}
      {showSimControls && (
        <div className="mt-2 p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs animate-fade-in">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => simulateTaggersScenario('grace_expired')}
              className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 text-[10px]"
            >
              Expire 7-Day Grace (Lock Posting)
            </button>
            <button
              type="button"
              onClick={() => simulateTaggersScenario('unlocked')}
              className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 text-[10px]"
            >
              Set 105 Taggers (Unlock)
            </button>
            <button
              type="button"
              onClick={() => incrementTaggers(1, 'Stream listener')}
              className="px-2 py-1 rounded bg-white/15 hover:bg-white/20 text-white text-[10px]"
            >
              +1 Tagger ({taggersCount + 1}/100)
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
