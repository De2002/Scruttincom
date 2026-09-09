import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { fetchFirestoreConversations, fetchFirestoreTopics } from '@/lib/firestoreService';
import ConversationPreviewCard from '@/components/features/ConversationPreviewCard';
import AtmosphereControls from '@/components/layout/AtmosphereControls';
import type { ConversationStarter } from '@/types';

function ScrutinMark() {
  return (
    <svg viewBox="0 0 64 42" fill="none" stroke="currentColor" strokeLinecap="round" className="w-full h-full">
      <path strokeWidth={3.5} d="M2 9 Q9 3 16 9 Q23 15 30 9 Q37 3 44 9 Q51 15 58 9 Q60.5 7.5 62 9" />
      <path strokeWidth={3.5} d="M2 21 Q9 15 16 21 Q23 27 30 21 Q37 15 44 21 Q51 27 58 21 Q60.5 19.5 62 21" />
      <path strokeWidth={3.5} d="M2 33 Q9 27 16 33 Q23 39 30 33 Q37 27 44 33 Q51 39 58 33 Q60.5 31.5 62 33" />
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
      display_name: (u.display_name as string) ?? 'Scruttin',
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

export default function ScrutinAsksPage() {
  const navigate = useNavigate();
  const [activeTopic, setActiveTopic] = useState('All');
  const [conversations, setConversations] = useState<ConversationStarter[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbTopics, setDbTopics] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [convList, topicsList] = await Promise.all([
        fetchFirestoreConversations({ type: 'question', isPlatform: true }),
        fetchFirestoreTopics(),
      ]);
      setConversations(convList);
      if (topicsList && topicsList.length > 0) {
        setDbTopics(topicsList.map((topic) => topic.label));
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
        <div className="text-white/80 mb-3" style={{ width: 56, height: 37 }}>
          <ScrutinMark />
        </div>
        <h1 className="text-white font-bold text-2xl tracking-tight mb-1">Scruttin Asks</h1>
        <p className="text-white/40 text-xs text-center max-w-[240px] leading-relaxed">
          Questions from the platform — no author, no agenda. Just something worth answering.
        </p>
      </div>

      <div className="mx-5 mb-4 border-t border-white/6 shrink-0" />

      <div className="px-4 mb-4 shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {TOPICS.map(topic => (
            <button key={topic} onClick={() => setActiveTopic(topic)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all
                ${activeTopic === topic
                  ? 'bg-white/15 text-white border border-white/25'
                  : 'bg-white/5 text-white/40 border border-white/8 hover:bg-white/10 hover:text-white/70'}`}>
              {topic}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-4">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={20} className="text-white/20 animate-spin" /></div>
        ) : items.length > 0 ? (
          items.map((c, i) => <ConversationPreviewCard key={c.id} conversation={c} index={i} />)
        ) : (
          <div className="text-center py-16 text-white/25">
            <p className="text-base">Nothing in this topic yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
