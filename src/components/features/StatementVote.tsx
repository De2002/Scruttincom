import { useState } from 'react';
import type { StatementPosition } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  initialPosition?: StatementPosition;
  onSelect?: (position: StatementPosition) => void;
  compact?: boolean;
}

const OPTIONS: { value: StatementPosition; label: string; color: string; activeClass: string }[] = [
  { value: 'agree', label: 'Agree', color: 'text-emerald-400', activeClass: 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300' },
  { value: 'unsure', label: 'Unsure', color: 'text-amber-400', activeClass: 'bg-amber-500/20 border-amber-400/50 text-amber-300' },
  { value: 'disagree', label: 'Disagree', color: 'text-rose-400', activeClass: 'bg-rose-500/20 border-rose-400/50 text-rose-300' },
];

export default function StatementVote({ initialPosition, onSelect, compact = false }: Props) {
  const [selected, setSelected] = useState<StatementPosition>(initialPosition ?? null);

  const handleSelect = (pos: StatementPosition) => {
    setSelected(pos);
    onSelect?.(pos);
  };

  return (
    <div className={cn('flex gap-2', compact ? 'flex-row' : 'flex-row flex-wrap')}>
      {OPTIONS.map(({ value, label, activeClass }) => (
        <button
          key={value}
          onClick={() => handleSelect(value)}
          className={cn(
            'px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-200',
            selected === value
              ? activeClass
              : 'border-white/12 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 hover:border-white/25'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
