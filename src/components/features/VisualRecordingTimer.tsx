import { useMemo } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';

interface VisualRecordingTimerProps {
  elapsedSeconds: number;
  maxDuration?: number;
  isRecording: boolean;
  className?: string;
}

export default function VisualRecordingTimer({
  elapsedSeconds,
  maxDuration = 180,
  isRecording,
  className,
}: VisualRecordingTimerProps) {
  const remainingSeconds = Math.max(0, maxDuration - elapsedSeconds);
  const progressPercent = Math.min(100, (elapsedSeconds / maxDuration) * 100);

  // Status flags for visual urgency
  const isUrgent = isRecording && remainingSeconds <= 15;
  const isWarning = isRecording && remainingSeconds <= 30 && !isUrgent;

  // Format minutes, seconds, and tenths
  const formattedMinutes = Math.floor(elapsedSeconds / 60)
    .toString()
    .padStart(2, '0');
  const formattedSeconds = (elapsedSeconds % 60).toString().padStart(2, '0');

  // Milestone marks for progress bar (1m, 2m, 3m)
  const milestones = useMemo(
    () => [
      { label: '1m', percent: (60 / maxDuration) * 100 },
      { label: '2m', percent: (120 / maxDuration) * 100 },
      { label: '3m', percent: 100 },
    ],
    [maxDuration]
  );

  return (
    <div
      className={cn(
        'w-full flex flex-col items-center gap-2.5 p-3.5 rounded-2xl border transition-all duration-300',
        isRecording
          ? isUrgent
            ? 'bg-rose-950/40 border-rose-500/40 shadow-[0_0_24px_rgba(244,63,94,0.25)]'
            : isWarning
            ? 'bg-amber-950/30 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
            : 'bg-white/[0.04] border-white/10 shadow-[0_0_20px_rgba(244,63,94,0.08)]'
          : 'bg-white/[0.02] border-white/5',
        className
      )}
    >
      {/* Top Header Row: Recording Pill & Time Remaining */}
      <div className="w-full flex items-center justify-between">
        {/* REC Badge */}
        <div
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase transition-all duration-200 border',
            isRecording
              ? isUrgent
                ? 'bg-rose-500/25 border-rose-400/50 text-rose-300 animate-pulse'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
              : 'bg-white/5 border-white/10 text-white/40'
          )}
        >
          {isRecording ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-80" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.9)]" />
              </span>
              <span>REC</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-white/30" />
              <span>READY</span>
            </>
          )}
        </div>

        {/* Max Limit / Remaining Countdown */}
        <div className="flex items-center gap-1.5 text-xs">
          {isUrgent ? (
            <span className="flex items-center gap-1 text-rose-400 font-medium animate-pulse">
              <AlertTriangle size={12} />
              {remainingSeconds}s left!
            </span>
          ) : isWarning ? (
            <span className="text-amber-400 font-medium">
              {remainingSeconds}s remaining
            </span>
          ) : (
            <span className="flex items-center gap-1 text-white/40">
              <Clock size={12} />
              <span>Max {formatDuration(maxDuration)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Center Display: Main Monospace Digital Clock */}
      <div className="flex items-baseline justify-center gap-1 my-1">
        <span
          className={cn(
            'font-mono text-3xl sm:text-4xl font-bold tracking-tight tabular-nums transition-colors duration-200',
            isRecording
              ? isUrgent
                ? 'text-rose-400'
                : isWarning
                ? 'text-amber-300'
                : 'text-white'
              : 'text-white/40'
          )}
        >
          {formattedMinutes}:{formattedSeconds}
        </span>
        <span className="text-white/30 text-xs font-mono">
          / {formatDuration(maxDuration)}
        </span>
      </div>

      {/* Visual Timeline Progress Bar */}
      <div className="w-full space-y-1">
        <div className="relative w-full h-2 rounded-full bg-white/10 overflow-hidden">
          {/* Progress fill */}
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              isUrgent
                ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.9)] animate-pulse'
                : isWarning
                ? 'bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.6)]'
                : 'bg-gradient-to-r from-rose-500 to-rose-400'
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Milestone Tick Marks */}
        <div className="relative w-full h-3 text-[9px] text-white/30 select-none">
          {milestones.map((m) => (
            <span
              key={m.label}
              className="absolute -translate-x-1/2"
              style={{ left: `${m.percent}%` }}
            >
              {m.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
