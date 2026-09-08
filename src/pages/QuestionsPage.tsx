import { useState } from 'react';
import { Search, SlidersHorizontal, Plus } from 'lucide-react';
import { MOCK_CONVERSATIONS } from '@/constants/mockData';
import { cn } from '@/lib/utils';
import ConversationPreviewCard from '@/components/features/ConversationPreviewCard';
import AtmosphereControls from '@/components/layout/AtmosphereControls';
import ComposeModal from '@/components/features/ComposeModal';

const TOPICS = ['All', 'Life', 'Relationships', 'Work', 'Money', 'Technology', 'Culture', 'Family', 'Society', 'Fun'];

export default function QuestionsPage() {
  const [search, setSearch] = useState('');
  const [activeTopic, setActiveTopic] = useState('All');
  const [composeOpen, setComposeOpen] = useState(false);

  const filtered = MOCK_CONVERSATIONS.filter(c => {
    const matchTopic = activeTopic === 'All' || c.topic === activeTopic;
    const matchSearch = search.length === 0 || c.body.toLowerCase().includes(search.toLowerCase());
    return matchTopic && matchSearch;
  });

  const platformQs = filtered.filter(c => c.is_platform && c.type === 'question');
  const userQs = filtered.filter(c => !c.is_platform && c.type === 'question');
  const statements = filtered.filter(c => c.type === 'statement');

  return (
    <div className="flex flex-col h-screen pb-20">
      <div className="px-4 pt-safe pt-4 pb-3 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white font-bold text-xl">Questions</h1>
            <p className="text-white/40 text-xs mt-0.5">Conversations happening now</p>
          </div>
          <div className="flex items-center gap-2">
            <AtmosphereControls />
            <button
              onClick={() => setComposeOpen(true)}
              className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-full text-white/70 hover:text-white transition-all text-xs"
            >
              <Plus size={13} /> Ask
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full glass rounded-xl pl-8 pr-4 py-2.5 text-white text-sm placeholder-white/25 focus:outline-none focus:border-white/25 border border-white/8"
          />
        </div>

        {/* Topic filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {TOPICS.map(topic => (
            <button
              key={topic}
              onClick={() => setActiveTopic(topic)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-all',
                activeTopic === topic
                  ? 'bg-white/15 text-white border border-white/25'
                  : 'bg-white/5 text-white/40 border border-white/8 hover:bg-white/10 hover:text-white/70'
              )}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6">
        {platformQs.length > 0 && (
          <section>
            <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-3">Scruttin Asks</p>
            <div className="space-y-2">
              {platformQs.map((c, i) => <ConversationPreviewCard key={c.id} conversation={c} index={i} />)}
            </div>
          </section>
        )}

        {statements.length > 0 && (
          <section>
            <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-3">Statements</p>
            <div className="space-y-2">
              {statements.map((c, i) => <ConversationPreviewCard key={c.id} conversation={c} index={i} />)}
            </div>
          </section>
        )}

        {userQs.length > 0 && (
          <section>
            <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-3">From the Crowd</p>
            <div className="space-y-2">
              {userQs.map((c, i) => <ConversationPreviewCard key={c.id} conversation={c} index={i} />)}
            </div>
          </section>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-white/30">
            <p className="text-lg mb-1">Nothing matches</p>
            <p className="text-sm">Try a different topic or search term</p>
          </div>
        )}
      </div>

      {composeOpen && <ComposeModal onClose={() => setComposeOpen(false)} defaultMode="question" />}
    </div>
  );
}
