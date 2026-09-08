import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Globe, Mic2, Loader2, X } from 'lucide-react';
import { createFirestoreConversation, fetchFirestoreConversations, fetchFirestoreTopics } from '@/lib/firestoreService';
import { cn, formatCount } from '@/lib/utils';
import AtmosphereControls from '@/components/layout/AtmosphereControls';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { ConversationStarter } from '@/types';

function CrowdIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="8" r="2.5" />
      <path d="M14 20c.5-2.5 2-4.5 4-5" />
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
    is_platform: false,
    circulation_score: 0,
  };
}

export default function FromTheCrowdPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTopic, setActiveTopic] = useState('All');
  const [conversations, setConversations] = useState<ConversationStarter[]>([]);
  const [loading, setLoading] = useState(true);
  const [askOpen, setAskOpen] = useState(false);
  const [dbTopics, setDbTopics] = useState<string[]>([]);

  // Ask form state
  const [question, setQuestion] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('Life');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const fbConvs = await fetchFirestoreConversations({ type: 'question', isPlatform: false });
    setConversations(fbConvs);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Load topics from Firestore
  useEffect(() => {
    fetchFirestoreTopics().then((topics) => {
      setDbTopics(topics);
      if (topics.length > 0) setSelectedTopic(topics[0]);
    });
  }, []);

  const TOPICS = ['All', ...new Set([...dbTopics, ...conversations.map(c => c.topic).filter(Boolean)])];

  const submitQuestion = async () => {
    if (!question.trim() || !user) return;
    setSubmitting(true);
    try {
      await createFirestoreConversation({
        userId: user.id,
        user: {
          id: user.id,
          display_name: user.display_name,
          avatar_url: user.avatar_url || '',
          country: user.country || 'Global',
          city: user.city,
          bio: user.bio,
        },
        body: question.trim(),
        topic: selectedTopic,
        type: 'question',
        isPlatform: false,
      });

      toast.success('Question posted to From the Crowd');
      setQuestion('');
      setAskOpen(false);
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to post question');
    } finally {
      setSubmitting(false);
    }
  };

  const items = conversations.filter(c => activeTopic === 'All' || c.topic === activeTopic);

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <div className="px-4 pt-safe pt-4 pb-0 flex items-center justify-between shrink-0">
        <button onClick={() => navigate('/dive')} className="flex items-center gap-1 text-white/40 hover:text-white/80 transition-colors text-sm">
          <ChevronLeft size={16} /> Dive
        </button>
        <AtmosphereControls />
      </div>

      <div className="flex flex-col items-center pt-6 pb-5 px-6 shrink-0">
        <div className="text-sky-400/80 mb-3"><CrowdIcon size={44} /></div>
        <h1 className="text-white font-bold text-2xl tracking-tight mb-1">From the Crowd</h1>
        <p className="text-white/40 text-xs text-center max-w-[240px] leading-relaxed">
          Real people, real curiosity. Pick a question and give your take.
        </p>
      </div>

      <div className="mx-5 mb-4 border-t border-white/6 shrink-0" />

      {/* Topic filter */}
      <div className="px-4 mb-4 shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {TOPICS.map(topic => (
            <button key={topic} onClick={() => setActiveTopic(topic)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all',
                activeTopic === topic
                  ? 'bg-sky-400/15 text-sky-300 border border-sky-400/30'
                  : 'bg-white/5 text-white/40 border border-white/8 hover:bg-white/10 hover:text-white/70'
              )}>
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Ask inline form */}
      {askOpen && (
        <div className="mx-4 mb-4 p-4 rounded-2xl bg-white/5 border border-white/10 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">Ask the crowd</p>
            <button onClick={() => setAskOpen(false)} className="text-white/30 hover:text-white/70 transition-colors p-1">
              <X size={14} />
            </button>
          </div>
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="What's your question for the crowd?"
            rows={3}
            className="w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2.5 text-white text-sm font-serif resize-none focus:outline-none focus:border-[rgba(255,255,255,0.25)] placeholder-[rgba(255,255,255,0.25)]"
          />
          <div>
            <p className="text-white/30 text-[10px] mb-1.5">Topic</p>
            <div className="flex flex-wrap gap-1.5">
              {dbTopics.map(t => (
                <button key={t} onClick={() => setSelectedTopic(t)}
                  className={cn('px-3 py-1 rounded-full text-xs font-medium transition-all border',
                    selectedTopic === t ? 'bg-sky-400/15 text-sky-300 border-sky-400/30' : 'bg-white/4 text-white/35 border-white/8 hover:bg-white/10')}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={submitQuestion}
            disabled={!question.trim() || submitting}
            className={cn('w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all',
              question.trim() && !submitting ? 'bg-white text-black' : 'bg-white/8 text-white/30 cursor-not-allowed')}>
            {submitting ? <Loader2 size={14} className="animate-spin" /> : 'Post question'}
          </button>
          {!user && <p className="text-white/30 text-xs text-center">Sign in to ask a question</p>}
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-4">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={20} className="text-white/20 animate-spin" /></div>
        ) : items.length > 0 ? items.map((c, i) => (
          <button key={c.id} onClick={() => navigate(`/conversation/${c.id}`)}
            style={{ animationDelay: `${Math.min(i * 70, 420)}ms` }}
            className="scrut-enter w-full text-left p-4 rounded-2xl bg-white/4 border border-white/7 hover:bg-white/8 hover:border-white/14 transition-all group">
            <div className="flex items-center gap-2 mb-2">
              {c.user.avatar_url ? (
                <img src={c.user.avatar_url} alt={c.user.display_name} className="w-5 h-5 rounded-full object-cover opacity-70" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-sky-400/20 flex items-center justify-center">
                  <span className="text-sky-300 text-[9px] font-bold">{c.user.display_name[0]}</span>
                </div>
              )}
              <span className="text-white/35 text-[11px] font-medium">{c.user.display_name}</span>
              <span className="text-white/20 text-[10px]">·</span>
              <span className="text-sky-400/50 text-[10px] font-semibold uppercase tracking-wider">{c.topic}</span>
            </div>
            <p className="font-serif text-white/85 text-[15px] leading-[1.55] mb-3 group-hover:text-white transition-colors">{c.body}</p>
            <div className="flex items-center gap-3 text-white/25 text-[11px]">
              <span className="flex items-center gap-1"><Mic2 size={10} />{formatCount(c.scrut_count)} ruts</span>
              <span className="flex items-center gap-1"><Globe size={10} />{c.country_count} countries</span>
              <span className="ml-auto text-sky-400/40 text-[10px] font-medium group-hover:text-sky-300/60 transition-colors">Dive in →</span>
            </div>
          </button>
        )) : (
          <div className="text-center py-16 text-white/25">
            <p className="text-base">No questions yet. Be the first to ask.</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => {
          if (!user) { navigate('/auth'); return; }
          setAskOpen(v => !v);
        }}
        className={cn(
          'fixed bottom-20 right-5 z-40 px-5 h-10 rounded-full font-semibold text-sm',
          'glass border border-white/12 text-white/60 hover:text-white/90',
          'hover:border-white/25 transition-all duration-200 shadow-lg shadow-black/30',
          askOpen && 'bg-white/15 border-white/25 text-white'
        )}
      >
        {askOpen ? '✕ Cancel' : 'Ask'}
      </button>
    </div>
  );
}
