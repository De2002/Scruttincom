import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { toggleFirestoreResonate } from '@/lib/firestoreService';
import { useAuth } from '@/contexts/AuthContext';
import resonatesImg from '@/assets/resonates_red.png';
import resonatesActiveImg from '@/assets/resonates_active.png';

interface Props {
  scrutId: string;
  initialCount?: number;
  initialResonated?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ResonatesButton({ scrutId, initialCount = 0, initialResonated = false, className, size = 'md' }: Props) {
  const { user } = useAuth();
  const [resonated, setResonated] = useState(initialResonated);
  const [count, setCount] = useState(initialCount);
  const [burst, setBurst] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setResonated(initialResonated);
    setCount(initialCount);
  }, [initialResonated, initialCount]);

  const toggle = async (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!user || pending) return;
    const next = !resonated;
    setResonated(next);
    setCount(c => next ? c + 1 : Math.max(0, c - 1));
    if (next) {
      setBurst(true);
      setTimeout(() => setBurst(false), 600);
    }
    setPending(true);
    try {
      await toggleFirestoreResonate(scrutId, user.id, !next);
    } catch {
      // rollback if failed
      setResonated(!next);
      setCount(c => next ? Math.max(0, c - 1) : c + 1);
    } finally {
      setPending(false);
    }
  };

  const iconSize = size === 'lg' ? 34 : size === 'sm' ? 22 : 28;
  const textSize = size === 'lg' ? 'text-sm' : size === 'sm' ? 'text-[10px]' : 'text-[12px]';

  return (
    <button
      onClick={toggle}
      onTouchEnd={toggle}
      disabled={!user}
      className={cn(
        'flex items-center gap-1.5 transition-all duration-200 group select-none',
        !user && 'cursor-default',
        className
      )}
      aria-label={resonated ? 'Remove resonate' : 'Resonate'}
    >
      <span
        className={cn(
          'relative flex items-center justify-center transition-all duration-200',
          burst ? 'scale-130' : resonated ? 'scale-110' : 'scale-100 group-hover:scale-110',
        )}
        style={{ width: iconSize, height: iconSize }}
      >
        <img
          src={resonated ? resonatesActiveImg : resonatesImg}
          alt="Resonates"
          className={cn(
            'w-full h-full object-contain transition-all duration-200',
            !resonated && 'opacity-55 group-hover:opacity-80',
          )}
        />
        {/* Ripple on activation */}
        {burst && (
          <>
            <span className="absolute inset-0 rounded-full bg-rose-400/25 animate-ping" style={{ animationDuration: '0.45s', animationIterationCount: '1' }} />
            <span className="absolute inset-[-6px] rounded-full bg-rose-400/12 animate-ping" style={{ animationDuration: '0.6s', animationIterationCount: '1' }} />
          </>
        )}
      </span>
      <span className={cn(
        'font-medium tabular-nums transition-all duration-200',
        textSize,
        resonated ? 'text-rose-400' : 'text-white/45 group-hover:text-white/65',
        count === 0 && !resonated && 'opacity-0'
      )}>
        {count > 0 ? count : ''}
      </span>
    </button>
  );
}
