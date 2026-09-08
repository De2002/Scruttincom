import { useState } from 'react';
import { ChevronRight, Headphones, MoreHorizontal, Play, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type Space = { id: string; title: string; host: string; category: string; listeners: string; color: string; description: string; episode: string; duration: string };

const spaces: Space[] = [
  { id: 'ideas', title: 'Ideas worth sharing', host: 'Scruttin community', category: 'Culture', listeners: '2.4k', color: 'from-amber-200/35 to-orange-400/10', description: 'Conversations that make you pause, reconsider, and see the familiar differently.', episode: 'What did you change your mind about?', duration: '42 min' },
  { id: 'everyday', title: 'Everyday questions', host: 'Maya Okafor', category: 'Life', listeners: '1.8k', color: 'from-cyan-200/30 to-blue-400/10', description: 'Small questions. Honest answers. A space for the things we usually leave unsaid.', episode: 'The things our parents never understood', duration: '28 min' },
  { id: 'elsewhere', title: 'Somewhere else', host: 'Joel Tetteh', category: 'Culture', listeners: '946', color: 'from-rose-200/30 to-purple-400/10', description: 'What feels ordinary in one place can be surprising everywhere else.', episode: 'Normal here, strange there', duration: '35 min' },
  { id: 'work', title: 'After work', host: 'Nia Mensah', category: 'Work', listeners: '721', color: 'from-emerald-200/25 to-teal-400/10', description: 'A slower space for thinking about work, ambition, and the life around it.', episode: 'When work changes your friendships', duration: '31 min' },
];

function SpaceCard({ space, onOpen }: { space: Space; onOpen: () => void }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.045] shadow-[0_14px_40px_rgba(0,0,0,0.16)]">
      <button type="button" onClick={onOpen} className={cn('relative flex h-36 w-full items-end bg-gradient-to-br p-5 text-left', space.color)}>
        <span className="absolute right-4 top-4 rounded-full bg-black/20 p-2 text-white/70"><MoreHorizontal size={18} /></span>
        <div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">{space.category}</p><h2 className="max-w-[14rem] text-2xl font-semibold tracking-tight text-white">{space.title}</h2></div>
      </button>
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between text-xs text-white/40"><span>Hosted by {space.host}</span><span>{space.listeners} listening</span></div>
        <p className="text-sm leading-6 text-white/65">{space.description}</p>
        <button type="button" onClick={onOpen} className="flex items-center gap-3 rounded-2xl bg-white/[0.06] p-3 text-left transition-colors hover:bg-white/[0.1]"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-black"><Play size={15} fill="currentColor" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm text-white/85">{space.episode}</span><span className="text-xs text-white/35">Latest episode · {space.duration}</span></span><ChevronRight size={16} className="text-white/30" /></button>
      </div>
    </article>
  );
}

export default function SpacesPage() {
  const [selected, setSelected] = useState<Space | null>(null);
  return <main className="fixed inset-0 flex flex-col overflow-hidden bg-scruttin-base pb-16 text-white"><header className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-5 pb-4 pt-safe pt-4"><div><h1 className="text-xl font-semibold tracking-tight">Spaces</h1><p className="mt-1 text-sm text-white/40">Places for deeper conversations</p></div><div className="flex items-center gap-1"><button type="button" aria-label="Search spaces" className="rounded-xl p-2.5 text-white/45 hover:bg-white/10 hover:text-white"><Search size={18} /></button><button type="button" aria-label="Create a space" className="rounded-xl bg-white p-2.5 text-black hover:bg-white/85"><Plus size={18} /></button></div></header><div className="flex-1 overflow-y-auto overscroll-contain"><div className="mx-auto flex max-w-lg flex-col gap-5 px-5 py-6"><div className="flex items-center gap-3 text-sm text-white/55"><Headphones size={17} /><span>Explore spaces shaped by people, not algorithms.</span></div>{spaces.map((space) => <SpaceCard key={space.id} space={space} onOpen={() => setSelected(space)} />)}</div></div>{selected && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-3 backdrop-blur-sm" onClick={() => setSelected(null)}><section role="dialog" aria-modal="true" aria-label={`${selected.title} space`} onClick={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#171722] p-6"><div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" /><p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">{selected.category} space</p><h2 className="mt-2 text-2xl font-semibold">{selected.title}</h2><p className="mt-4 text-sm leading-6 text-white/60">{selected.description}</p><button type="button" className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-black"><Play size={15} fill="currentColor" /> Listen to latest episode</button></section></div>}</main>;
}
