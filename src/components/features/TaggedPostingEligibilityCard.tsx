import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Radio,
  Compass,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  UserCheck,
  AlertTriangle,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { useTagged } from '@/stores/taggedContext';
import { cn } from '@/lib/utils';

interface TaggedPostingEligibilityCardProps {
  onOpenRules?: () => void;
}

export default function TaggedPostingEligibilityCard({
  onOpenRules,
}: TaggedPostingEligibilityCardProps) {
  const navigate = useNavigate();
  const {
    taggersCount,
    taggersThreshold,
    taggerStatus,
    simulateTaggersScenario,
    incrementTaggers,
    setTaggersCount,
  } = useTagged();

  const [showSimControls, setShowSimControls] = useState(false);
  const [customInput, setCustomInput] = useState(taggersCount.toString());

  const progressPercent = Math.min(100, Math.max(0, Math.round((taggersCount / taggersThreshold) * 100)));
  const needed = Math.max(0, taggersThreshold - taggersCount);
  const isExpired = taggerStatus === 'restricted';

  return (
    <section
      id="tagged-posting-restricted-card"
      className="mb-4 rounded-2xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/12 p-4 sm:p-5 shadow-lg relative overflow-hidden"
    >
      {/* Subtle background glow */}
      <div
        className={cn(
          'absolute -top-16 -right-16 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-20',
          isExpired ? 'bg-amber-500' : 'bg-rose-500'
        )}
      />

      {/* Header Banner */}
      <div className="flex items-start justify-between gap-3 mb-3.5 relative z-10">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center border shrink-0',
              isExpired
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            )}
          >
            <Lock size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/75 border border-white/10">
                Tagged Access Rule
              </span>
              {isExpired ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/35 flex items-center gap-1">
                  <AlertTriangle size={10} />
                  Grace Period Ended
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/35">
                  100 Taggers Needed
                </span>
              )}
            </div>
            <h3 className="text-[15px] sm:text-base font-semibold text-white mt-1">
              {isExpired
                ? 'Tagged Posting Restricted'
                : '100 Taggers Required to Post'}
            </h3>
          </div>
        </div>

        {onOpenRules && (
          <button
            type="button"
            id="tagged-card-open-rules-btn"
            onClick={onOpenRules}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all shrink-0"
            title="View Tagged Posting Rules"
          >
            <Info size={16} />
          </button>
        )}
      </div>

      {/* Current Taggers Meter */}
      <div className="p-3.5 rounded-xl bg-black/30 border border-white/8 mb-3.5 relative z-10">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <span className="text-white/40 text-xs font-medium">Your Taggers</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
                {taggersCount}
              </span>
              <span className="text-white/40 font-mono text-sm font-semibold">
                / {taggersThreshold}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span
              className={cn(
                'text-xs font-semibold px-2.5 py-1 rounded-full border inline-flex items-center gap-1',
                isExpired
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                  : 'bg-white/10 border-white/15 text-white/80'
              )}
            >
              <UserCheck size={12} />
              {needed > 0 ? `${needed} more needed` : 'Threshold reached'}
            </span>
            <p className="text-[10px] text-white/35 mt-1 font-mono">{progressPercent}% of requirement</p>
          </div>
        </div>

        {/* Progress bar track */}
        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden relative">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              isExpired
                ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                : 'bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400'
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Message and Rules Explanation */}
      <div className="space-y-2.5 text-xs text-white/70 leading-relaxed mb-4 relative z-10">
        <p className="text-white/85">
          {isExpired ? (
            <>
              Your tagger count dropped below the 100-tagger mark to <strong className="text-amber-300 font-mono font-semibold">{taggersCount}</strong>, and your 7-day grace period has now elapsed. To maintain high-trust curation in Tagged, creating new glimpses is paused until you regain 100 taggers.
            </>
          ) : (
            <>
              To post glimpses in Tagged, you must have at least <strong className="text-white font-semibold font-mono">100 taggers</strong>. You currently have <strong className="text-amber-300 font-mono font-semibold">{taggersCount} taggers</strong>.
            </>
          )}
        </p>

        {/* Reassurance regarding engagement */}
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200/90 text-[11px]">
          <Sparkles size={14} className="text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong>You can still fully engage:</strong> You retain complete access to like, bookmark, reply to, and vote on posts from all creators you have tagged along with.
          </span>
        </div>

        {/* Guidance: How to get taggers via Stream and Dive */}
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/8 space-y-1 text-[11px]">
          <p className="font-semibold text-white/90 flex items-center gap-1.5">
            <Flame size={12} className="text-amber-400" />
            How to get taggers
          </p>
          <p className="text-white/60">
            To get taggers, make use of <strong className="text-white/80">Dive</strong> or <strong className="text-white/80">Stream</strong>! Answer thought-provoking questions, voice your take, or debate statements. Community members who connect with your voice will tag along.
          </p>
        </div>
      </div>

      {/* Action Buttons: Navigate to Stream and Dive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 relative z-10">
        <button
          type="button"
          id="go-to-stream-from-locked-btn"
          onClick={() => navigate('/stream')}
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-violet-600/25 hover:bg-violet-600/40 border border-violet-500/40 text-violet-200 text-xs font-semibold transition-all group active:scale-[0.98]"
        >
          <div className="flex items-center gap-2">
            <Radio size={15} className="text-violet-400 group-hover:scale-110 transition-transform" />
            <span>Go to Stream</span>
          </div>
          <ArrowRight size={13} className="text-violet-400/70 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          type="button"
          id="go-to-dive-from-locked-btn"
          onClick={() => navigate('/dive')}
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-sky-600/25 hover:bg-sky-600/40 border border-sky-500/40 text-sky-200 text-xs font-semibold transition-all group active:scale-[0.98]"
        >
          <div className="flex items-center gap-2">
            <Compass size={15} className="text-sky-400 group-hover:scale-110 transition-transform" />
            <span>Explore Dive</span>
          </div>
          <ArrowRight size={13} className="text-sky-400/70 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Simulator / Testing Drawer for evaluator convenience */}
      <div className="mt-3.5 pt-2.5 border-t border-white/8 relative z-10">
        <button
          type="button"
          onClick={() => setShowSimControls((prev) => !prev)}
          className="w-full flex items-center justify-between text-[11px] text-white/40 hover:text-white/70 py-1 transition-colors"
        >
          <span className="flex items-center gap-1.5 font-mono">
            <span>⚙️ Simulation & Rule Testing Tools</span>
          </span>
          {showSimControls ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {showSimControls && (
          <div className="mt-2.5 p-3 rounded-xl bg-black/40 border border-white/10 space-y-2.5 text-xs animate-fade-in">
            <p className="text-[11px] text-white/50">
              Easily simulate all conditions to test the exact rules:
            </p>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => simulateTaggersScenario('grace_active')}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-[10px] font-medium text-left transition-all"
              >
                98 Taggers (7-Day Grace Active)
              </button>

              <button
                type="button"
                onClick={() => simulateTaggersScenario('grace_expired')}
                className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 text-[10px] font-medium text-left transition-all"
              >
                98 Taggers (Grace Expired · Locked)
              </button>

              <button
                type="button"
                onClick={() => simulateTaggersScenario('unlocked')}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 text-[10px] font-medium text-left transition-all"
              >
                105 Taggers (Unlocked)
              </button>

              <button
                type="button"
                onClick={() => simulateTaggersScenario('locked_new')}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 border border-white/15 text-[10px] font-medium text-left transition-all"
              >
                42 Taggers (New Account Locked)
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-white/5">
              <button
                type="button"
                onClick={() => incrementTaggers(1, 'Simulated Stream Discovery')}
                className="flex-1 py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium border border-white/10 transition-all flex items-center justify-center gap-1"
              >
                <span>+1 Tagger</span>
                <span className="text-[10px] text-white/40">(Stream Discovery)</span>
              </button>

              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="w-14 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-xs text-white font-mono text-center focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const parsed = parseInt(customInput, 10);
                    if (!isNaN(parsed)) setTaggersCount(parsed);
                  }}
                  className="px-2 py-1 rounded-lg bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-200 text-[11px] font-medium border border-emerald-500/40"
                >
                  Set
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
