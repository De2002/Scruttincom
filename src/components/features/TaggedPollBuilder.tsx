/**
 * TaggedPollBuilder — Inline form to create and configure a poll in the Tagged composer.
 */
import { Plus, X, BarChart2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PollDraft {
  question: string;
  options: string[];
  durationDays: number;
}

interface TaggedPollBuilderProps {
  draft: PollDraft;
  onChange: (updated: PollDraft) => void;
  onRemove: () => void;
}

const DURATION_OPTIONS = [
  { days: 1, label: '1 day' },
  { days: 3, label: '3 days' },
  { days: 7, label: '7 days' },
];

export default function TaggedPollBuilder({ draft, onChange, onRemove }: TaggedPollBuilderProps) {
  const handleQuestionChange = (question: string) => {
    onChange({ ...draft, question });
  };

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...draft.options];
    updatedOptions[index] = value;
    onChange({ ...draft, options: updatedOptions });
  };

  const handleAddOption = () => {
    if (draft.options.length < 4) {
      onChange({
        ...draft,
        options: [...draft.options, ''],
      });
    }
  };

  const handleRemoveOption = (index: number) => {
    if (draft.options.length > 2) {
      const updatedOptions = draft.options.filter((_, i) => i !== index);
      onChange({ ...draft, options: updatedOptions });
    }
  };

  const handleDurationSelect = (days: number) => {
    onChange({ ...draft, durationDays: days });
  };

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3 sm:p-3.5 mb-3 text-xs animate-fade-in shadow-inner">
      {/* Poll Header & Dismiss */}
      <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-white/[0.08]">
        <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-300 font-semibold">
          <BarChart2 size={14} className="text-emerald-400" />
          <span>Create Poll</span>
          <span className="text-[10px] font-normal text-white/40">
            ({draft.options.length}/4)
          </span>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="text-white/40 hover:text-rose-400 p-1 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-1 text-[11px] touch-manipulation active:scale-95"
          title="Remove poll from post"
        >
          <X size={13} />
          <span>Remove</span>
        </button>
      </div>

      {/* Poll Question (Optional specific header) */}
      <div className="mb-2.5">
        <label className="block text-[11px] text-white/50 mb-1 font-medium">
          Poll Question or Subject (optional)
        </label>
        <input
          type="text"
          value={draft.question}
          onChange={(e) => handleQuestionChange(e.target.value)}
          placeholder="e.g., What's your late-night setup?"
          maxLength={100}
          className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      {/* Options List */}
      <div className="space-y-2 mb-3">
        <label className="block text-[11px] text-white/50 font-medium">
          Poll Options (minimum 2)
        </label>
        {draft.options.map((opt, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1 relative flex items-center">
              <span className="absolute left-3 text-[11px] font-mono text-white/30 select-none">
                {index + 1}.
              </span>
              <input
                type="text"
                value={opt}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                maxLength={60}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            {draft.options.length > 2 && (
              <button
                type="button"
                onClick={() => handleRemoveOption(index)}
                className="p-2 text-white/40 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors touch-manipulation active:scale-95"
                title="Remove option"
              >
                <X size={13} />
              </button>
            )}
          </div>
        ))}

        {draft.options.length < 4 && (
          <button
            type="button"
            onClick={handleAddOption}
            className="w-full py-2 border border-dashed border-white/20 hover:border-emerald-400/50 rounded-xl text-white/60 hover:text-emerald-300 transition-colors flex items-center justify-center gap-1 text-[11px] font-medium touch-manipulation active:scale-95"
          >
            <Plus size={12} />
            <span>Add option ({4 - draft.options.length} remaining)</span>
          </button>
        )}
      </div>

      {/* Duration Selector */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] text-[11px] flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-white/50">
          <Clock size={12} className="text-emerald-400" />
          <span>Duration:</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          {DURATION_OPTIONS.map((item) => (
            <button
              key={item.days}
              type="button"
              onClick={() => handleDurationSelect(item.days)}
              className={cn(
                'px-2.5 sm:px-3 py-1 rounded-lg transition-all font-medium touch-manipulation active:scale-95',
                draft.durationDays === item.days
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                  : 'bg-white/[0.05] text-white/50 border border-white/5 hover:text-white'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
