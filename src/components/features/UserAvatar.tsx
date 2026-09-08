import type { User } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  user: User;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 'circle' (default) | 'square' — rounded square, used for text scruts */
  shape?: 'circle' | 'square';
  className?: string;
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-14 h-14 text-lg',
};

const radii = {
  circle: 'rounded-full',
  square: 'rounded-xl',
};

export default function UserAvatar({ user, size = 'md', shape = 'circle', className }: Props) {
  const initials = user.display_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const radius = radii[shape];

  if (user.id === 'platform') {
    return (
      <div className={cn(
        radius,
        'flex items-center justify-center font-bold text-black shrink-0',
        'bg-gradient-to-br from-white to-gray-200',
        sizes[size], className
      )}>
        S
      </div>
    );
  }

  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.display_name}
        className={cn(radius, 'object-cover shrink-0', sizes[size], className)}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  return (
    <div className={cn(
      radius,
      'flex items-center justify-center font-semibold text-white/80 bg-white/10 border border-white/15 shrink-0',
      sizes[size], className
    )}>
      {initials}
    </div>
  );
}
