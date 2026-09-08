import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ConversationStarter } from '@/types';
import { cn, formatCount } from '@/lib/utils';
import { Globe, Mic2, BookOpen, Pin, Share2 } from 'lucide-react';
import { useStream } from '@/stores/streamContext';
import ShareModal from '@/components/features/ShareModal';

interface Props {
  conversation: ConversationStarter;
  className?: string;
  index?: number;
}

const TOPIC_COLORS: Record<string, string> = {
  Life: 'text-violet-400',
  Relationships: 'text-pink-400',
  Work: 'text-blue-400',
  Money: 'text-emerald-400',
  Technology: 'text-cyan-400',
  Culture: 'text-orange-400',
  Family: 'text-rose-400',
  Society: 'text-amber-400',
  Fun: 'text-yellow-400',
  Education: 'text-indigo-400',
};

export default function ConversationPreviewCard({ conversation, className, index = 0 }: Props) {
  const navigate = useNavigate();
  const { pinned, togglePin } = useStream();
  const [shareOpen, setShareOpen] = useState(false);
  const isPinned = pinned.includes(conversation.id);

  return (
    <>
      <div
        className={cn(
          'glass rounded-2xl p-4 transition-all duration-300 cursor-pointer group',
          'hover:bg-white/[0.06] active:scale-[0.99]',
          className
        )}
        style={{ animationDelay: `${index * 60}ms` }}
        onClick={() => navigate(`/questions/${conversation.id}`)}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {conversation.is_platform ? (
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40 bg-white/8 px-2 py-0.5 rounded-full">
                  Scruttin Asks
                </span>
              ) : (
                <span className="text-[10px] font-medium text-white/40">{conversation.user.display_name}</span>
              )}
              {conversation.topic && (
                <span className={cn('text-[10px] font-medium ml-auto', TOPIC_COLORS[conversation.topic] ?? 'text-white/40')}>
                  {conversation.topic}
                </span>
              )}
            </div>

            <p className={cn(
              'text-white font-serif leading-snug mb-3',
              conversation.type === 'statement'
                ? 'text-[15px] italic'
                : 'text-[15px]'
            )}>
              {conversation.type === 'question' ? `"${conversation.body}"` : `"${conversation.body}"`}
            </p>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-white/35 text-xs">
                <Mic2 size={11} />
                <span>{formatCount(conversation.scrut_count)} scruts</span>
              </div>
              <div className="flex items-center gap-1 text-white/35 text-xs">
                <Globe size={11} />
                <span>{conversation.country_count} countries</span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  type="button"
                  title="Share card on Twitter / X"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShareOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-white/25 hover:text-white/70 hover:bg-white/8 transition-all"
                >
                  <Share2 size={12} />
                </button>
                <button
                  type="button"
                  title={isPinned ? 'Unpin' : 'Pin'}
                  onClick={(e) => { e.stopPropagation(); togglePin(conversation.id); }}
                  className={cn(
                    'p-1.5 rounded-lg transition-all',
                    isPinned
                      ? 'text-amber-400 bg-amber-400/10'
                      : 'text-white/25 hover:text-white/50 hover:bg-white/8'
                  )}
                >
                  <Pin size={12} fill={isPinned ? 'currentColor' : 'none'} />
                </button>
                <span className="text-white/25 text-xs group-hover:text-white/50 transition-colors flex items-center gap-1">
                  <BookOpen size={11} />
                  Listen
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {shareOpen && (
        <ShareModal
          conversation={conversation}
          onClose={() => setShareOpen(false)}
        />
      )}
    </>
  );
}
