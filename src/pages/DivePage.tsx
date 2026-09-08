import { useNavigate } from 'react-router-dom';
import AtmosphereControls from '@/components/layout/AtmosphereControls';

// Wavy Scruttin logo mark
function ScrutinLogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.65} viewBox="0 0 28 18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M1 4 Q4.5 1 8 4 Q11.5 7 15 4 Q18.5 1 22 4 Q24.5 5.5 27 4" />
      <path d="M1 9 Q4.5 6 8 9 Q11.5 12 15 9 Q18.5 6 22 9 Q24.5 10.5 27 9" />
      <path d="M1 14 Q4.5 11 8 14 Q11.5 17 15 14 Q18.5 11 22 14 Q24.5 15.5 27 14" />
    </svg>
  );
}

const SECTIONS = [
  {
    path: '/dive/scruttin-asks',
    tag: 'Scruttin Asks',
    title: 'Questions from the platform',
    description:
      'Scruttin seeds conversations that anyone can answer. No author, no bias — just an open question moving through the world.',
    accent: 'from-white/10 to-white/5',
    dot: 'bg-white',
    badge: '✦',
  },
  {
    path: '/dive/crowd',
    tag: 'From the Crowd',
    title: 'Questions people are asking',
    description:
      "Real questions from real people. One per person, per day — so every question here meant something to whoever wrote it.",
    accent: 'from-sky-500/10 to-sky-500/5',
    dot: 'bg-sky-400',
    badge: '↑',
  },
  {
    path: '/dive/statements',
    tag: 'Statements',
    title: 'Claims put to the world',
    description:
      'Someone said something. Agree, disagree, or sit with it — then say why. Positions without explanation carry no weight here.',
    accent: 'from-amber-500/10 to-amber-500/5',
    dot: 'bg-amber-400',
    badge: '»',
  },
];

export default function DivePage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen pb-20 pt-safe">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-start justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-white/70">
              <ScrutinLogoMark size={26} />
            </span>
            <h1 className="text-white font-bold text-xl tracking-tight">Dive</h1>
          </div>
          <p className="text-white/35 text-xs">
            Choose where to enter. Each current runs differently.
          </p>
        </div>
        <AtmosphereControls />
      </div>

      {/* Intro strip */}
      <div className="px-5 mb-5 shrink-0">
        <p className="text-white/50 text-sm leading-relaxed font-serif">
          Three streams of conversation — each with its own character.
          Pick one and go. You can always surface and choose another.
        </p>
      </div>

      {/* Section gateway cards */}
      <div className="flex-1 px-4 space-y-3 overflow-y-auto">
        {SECTIONS.map((s, i) => (
          <button
            key={s.path}
            onClick={() => navigate(s.path)}
            className="w-full text-left group"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div
              className={`relative rounded-2xl bg-gradient-to-br ${s.accent} border border-white/8
                          p-5 transition-all duration-300 active:scale-[0.98]
                          hover:border-white/15 hover:bg-white/[0.05]`}
            >
              {/* Top row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
                    {s.tag}
                  </span>
                </div>
                <span className="text-white/20 text-lg group-hover:text-white/50 transition-colors font-light">
                  {s.badge}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-white font-semibold text-[17px] leading-snug mb-2">
                {s.title}
              </h2>

              {/* Description */}
              <p className="text-white/40 text-sm leading-relaxed font-serif">
                {s.description}
              </p>

              {/* Enter cue */}
              <div className="mt-4 flex items-center gap-1.5 text-white/30 text-xs group-hover:text-white/60 transition-colors">
                <span className="font-medium">Enter</span>
                <span className="text-[10px] translate-y-px">→</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
