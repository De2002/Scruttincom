import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Globe, Mic2, Loader2 } from 'lucide-react';
import { fetchFirestoreConversations, fetchFirestoreTopics } from '@/lib/firestoreService';
import { cn, formatCount } from '@/lib/utils';
import AtmosphereControls from '@/components/layout/AtmosphereControls';
import type { ConversationStarter } from '@/types';

function ScalesIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18" /><path d="M8 21h8" />
      <path d="M3 7l4 8H3l4-8z" /><path d="M21 7l-4 8h8l-4-8z" />
      <path d="M3 7h18" />
    </svg>
  );
}

function mapConv(c: Record<string, unknown>): ConversationStarter {
  const u = (c.user as Record<string, unknown>) ?? {};
  return {
    id: c.id as string,
    user_id: c.user_id as string,
    user: {
      id: (u.id as string) ?? '',
      display_name: (u.display_name as string) ?? 'Someone',
      avatar_url: (u.avatar_url as string) ?? '',
      country: (u.country as string) ?? '',
    },
    type: c.type as 'question' | 'statement' | 'open',
    body: c.body as string,
    topic: (c.topic as string) ?? '',
    created_at: c.created_at as string,
    scrut_count: (c.scrut_count as number) ?? 0,
    country_count: (c.country_count as number) ?? 0,
    is_platform: c.is_platform as boolean,
    circulation_score: 0,
  };
}

export default function StatementsPage() {
  const navigate = useNavigate();
  const [activeTopic, setActiveTopic] = useState('All');
  const [conversations, setConversations] = useState<ConversationStarter[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbTopics, setDbTopics] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [convList, topicsList] = await Promise.all([
        fetchFirestoreConversations({ type: 'statement' }),
        fetchFirestoreTopics(),
      ]);
      setConversations(convList);
      if (topicsList && topicsList.length > 0) {
        setDbTopics(topicsList);
      }
      setLoading(false);
    })();
  }, []);

  const TOPICS = ['All', ...new Set([...dbTopics, ...conversations.map(c => c.topic).filter(Boolean)])];

  const items = conversations.filter(c => activeTopic === 'All' || c.topic === activeTopic);

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <div className="px-4 pt-safe pt-4 pb-0 flex items-center justify-between shrink-0">
        <button onClick={() => navigate('/dive')} className="flex items-center gap-1 text-white/40 hover:text-white/80 transition-colors text-sm">
          <ChevronLeft size={16} /> Dive
        </button>
        <AtmosphereControls />
      </div>

      <div className="flex flex-col items-center pt-6 pb-5 px-6 shrink-0">
        <div className="text-amber-400/80 mb-3"><ScalesIcon size={44} /></div>
        <h1 className="text-white font-bold text-2xl tracking-tight mb-1">Statements</h1>
        <p className="text-white/40 text-xs text-center max-w-[240px] leading-relaxed">
          Claims put to the world. Say where you stand — then explain why.
        </p>
        <div className="flex items-center gap-4 mt-3">
          {[['emerald', 'Agree'], ['amber', 'Unsure'], ['rose', 'Disagree']].map(([c, l]) => (
            <span key={l} className={`flex items-center gap-1 text-${c}-400 text-[10px] font-medium`}>
              <span className={`w-1.5 h-1.5 rounded-full bg-${c}-400`} />{l}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-5 mb-4 border-t border-white/6 shrink-0" />

      <div className="px-4 mb-4 shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {TOPICS.map(topic => (
            <button key={topic} onClick={() => setActiveTopic(topic)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all',
                activeTopic === topic
                  ? 'bg-amber-400/12 text-amber-300 border border-amber-400/30'
                  : 'bg-white/5 text-white/40 border border-white/8 hover:bg-white/10 hover:text-white/70'
              )}>
              {topic}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-4">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={20} className="text-white/20 animate-spin" /></div>
        ) : items.length > 0 ? items.map(c => (
          <button key={c.id} onClick={() => navigate(`/conversation/${c.id}`)}
            className="w-full text-left p-4 rounded-2xl bg-white/4 border border-white/7 hover:bg-white/8 hover:border-amber-400/15 transition-all group">
            <div className="flex items-center gap-2 mb-2">
              {c.user.avatar_url ? (
                <img src={c.user.avatar_url} alt={c.user.display_name} className="w-5 h-5 rounded-full object-cover opacity-70" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center">
                  <span className="text-amber-300 text-[9px] font-bold">{c.is_platform ? 'S' : c.user.display_name[0]}</span>
                </div>
              )}
              <span className="text-white/35 text-[11px] font-medium">{c.is_platform ? 'Scruttin' : c.user.display_name}</span>
              <span className="text-white/20 text-[10px]">·</span>
              <span className="text-amber-400/50 text-[10px] font-semibold uppercase tracking-wider">{c.topic}</span>
            </div>
            <p className="font-serif italic text-white/85 text-[15px] leading-[1.55] mb-3 group-hover:text-white transition-colors">"{c.body}"</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400/60" />
              </div>
              <span className="flex items-center gap-1 text-white/25 text-[11px]"><Mic2 size={10} />{formatCount(c.scrut_count)} responses</span>
              <span className="flex items-center gap-1 text-white/25 text-[11px]"><Globe size={10} />{c.country_count} countries</span>
              <span className="ml-auto text-amber-400/40 text-[10px] font-medium group-hover:text-amber-300/60 transition-colors">Take a side →</span>
            </div>
          </button>
        )) : (
          <div className="text-center py-16 text-white/25">
            <p className="text-base">No statements yet. Make one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
