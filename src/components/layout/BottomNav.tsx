import { useNavigate, useLocation } from 'react-router-dom';
import { Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTagged } from '@/stores/taggedContext';

// Wavy icon for Dive
function WavesIcon({ size = 20, strokeWidth = 1.6 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
      <path d="M2 8 Q6 5 10 8 Q14 11 18 8 Q20.5 6.5 22 8" />
      <path d="M2 12 Q6 9 10 12 Q14 15 18 12 Q20.5 10.5 22 12" />
      <path d="M2 16 Q6 13 10 16 Q14 19 18 16 Q20.5 14.5 22 16" />
    </svg>
  );
}

// S logo icon (favicon) for Stream tab
function SLogoIcon({ size = 20, active = false }: { size?: number; active?: boolean }) {
  return (
    <img
      src="/favicon.png"
      alt="Stream"
      width={size}
      height={size}
      className={cn('object-contain transition-opacity', active ? 'opacity-90' : 'opacity-40')}
      style={{ filter: 'brightness(0) invert(1)' }}
    />
  );
}

const NAV_ITEMS = [
  { path: '/stream', label: 'Stream', icon: 'slogo' },
  { path: '/dive', label: 'Dive', icon: 'waves' },
  { path: '/tagged', label: 'Tagged', icon: 'tagged' },
  { path: '/me', label: 'Me', icon: 'user' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { taggedIds } = useTagged();

  return (
    <nav aria-label="Primary navigation" className="fixed bottom-0 left-0 right-0 z-10 safe-area-pb px-3 pb-2 transition-all duration-300 ease-out sm:px-5 sheet-nav">
      <div className="mx-auto max-w-lg rounded-[1.35rem] border border-white/10 bg-black/65 p-1.5 shadow-[0_-10px_35px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
        <div className="flex items-center justify-around">
          {NAV_ITEMS.map(({ path, label, icon }) => {
            const active = pathname === path || (path !== '/stream' && pathname.startsWith(path));
            const sw = active ? 2.2 : 1.6;
            return (
              <button
                key={path}
                id={`nav-${label.toLowerCase()}`}
                onClick={() => navigate(path)}
                className={cn(
                  'relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                  active ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white/75'
                )}
              >
                <span className={cn('relative transition-all duration-200', active && 'drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]')}>
                  {icon === 'slogo' && <SLogoIcon size={20} active={active} />}
                  {icon === 'waves' && <WavesIcon size={20} strokeWidth={sw} />}
                  {icon === 'tagged' && (
                    <>
                      <Users size={20} strokeWidth={sw} />
                      {taggedIds.length > 0 && !active && (
                        <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </>
                  )}
                  {icon === 'user' && <User size={20} strokeWidth={sw} />}
                </span>
                <span className={cn('text-[10px] font-medium tracking-wide transition-all', active ? 'opacity-100' : 'opacity-60')}>
                  {label}
                </span>
                {active && (
                  <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-white opacity-80" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

