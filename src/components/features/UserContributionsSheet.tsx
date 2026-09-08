import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  MessageCircle,
  Scale,
  Mic2,
  FileText,
  ChevronRight,
  Sparkles,
  Search,
  ExternalLink,
  Globe,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Plus,
  Loader2,
  Coffee,
} from 'lucide-react';
import { cn, timeAgo, formatCount } from '@/lib/utils';
import type { User, ConversationStarter, Scrut, StatementPosition } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { MOCK_CONVERSATIONS, MOCK_SCRUTS } from '@/constants/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { getMapUrl } from '@/lib/countryMap';

function getTipLabel(url?: string | null): string {
  if (!url) return 'Buy a coffee';
  const l = url.toLowerCase();
  if (l.includes('buymeacoffee.com') || l.includes('bmc.link')) return 'Buy Me a Coffee';
  if (l.includes('ko-fi.com')) return 'Ko-fi';
  if (l.includes('paypal.me') || l.includes('paypal.com')) return 'PayPal';
  return 'Tip & Support';
}

export type ContributionTab = 'questions' | 'claims' | 'responses';

interface Props {
  user: User;
  onClose: () => void;
  initialTab?: ContributionTab;
  onAskQuestion?: () => void;
  onMakeClaim?: () => void;
}

interface UserClaimItem {
  id: string;
  sourceType: 'authored_statement' | 'statement_position';
  statementId: string;
  body: string;
  topic: string;
  position?: StatementPosition;
  userArgument?: string;
  scrutType?: string;
  audioDuration?: number;
  attachmentUrl?: string;
  created_at: string;
  scrut_count?: number;
  country_count?: number;
  resonate_count?: number;
}

interface UserResponseItem {
  id: string;
  conversationId: string;
  questionBody: string;
  topic: string;
  responseType: string;
  text?: string;
  audioDuration?: number;
  attachmentUrl?: string;
  created_at: string;
  resonate_count: number;
}

export default function UserContributionsSheet({
  user,
  onClose,
  initialTab = 'questions',
  onAskQuestion,
  onMakeClaim,
}: Props) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isCurrentUser = currentUser?.id === user.id;

  const [activeTab, setActiveTab] = useState<ContributionTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [questions, setQuestions] = useState<ConversationStarter[]>([]);
  const [claims, setClaims] = useState<UserClaimItem[]>([]);
  const [responses, setResponses] = useState<UserResponseItem[]>([]);

  // Drag-to-dismiss states
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const isDragging = useRef(false);
  const [dragDy, setDragDy] = useState(0);
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('profile-sheet-active');
    requestAnimationFrame(() => setMounted(true));
    return () => document.documentElement.classList.remove('profile-sheet-active');
  }, []);

  const triggerClose = () => {
    setClosing(true);
    setTimeout(onClose, 320);
  };

  // Fetch data
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);

      const userId = user.id;
      const loadedQuestions: ConversationStarter[] = [];
      const loadedClaims: UserClaimItem[] = [];
      const loadedResponses: UserResponseItem[] = [];

      // 1. Check Mock Data
      // Questions asked in mock data
      const mockQs = MOCK_CONVERSATIONS.filter(
        (c) => (c.user_id === userId || c.user?.id === userId) && c.type === 'question'
      );
      loadedQuestions.push(...mockQs);

      // Authored statements in mock data (Claims Made)
      const mockStatements = MOCK_CONVERSATIONS.filter(
        (c) => (c.user_id === userId || c.user?.id === userId) && c.type === 'statement'
      );
      mockStatements.forEach((st) => {
        loadedClaims.push({
          id: `claim-conv-${st.id}`,
          sourceType: 'authored_statement',
          statementId: st.id,
          body: st.body,
          topic: st.topic,
          created_at: st.created_at,
          scrut_count: st.scrut_count,
          country_count: st.country_count,
        });
      });

      // Statement positions in mock scruts
      Object.entries(MOCK_SCRUTS).forEach(([convId, scrutsList]) => {
        const conv = MOCK_CONVERSATIONS.find((c) => c.id === convId);
        scrutsList.forEach((sc) => {
          if (sc.user.id === userId) {
            if (conv?.type === 'statement' || sc.position) {
              loadedClaims.push({
                id: `claim-sc-${sc.id}`,
                sourceType: 'statement_position',
                statementId: convId,
                body: conv?.body || 'Statement Proposition',
                topic: conv?.topic || 'General',
                position: sc.position || 'agree',
                userArgument: sc.text,
                scrutType: sc.type,
                audioDuration: sc.audio_duration,
                created_at: sc.created_at,
                resonate_count: sc.resonate_count || 0,
              });
            } else if (conv?.type === 'question' || !conv) {
              loadedResponses.push({
                id: `resp-sc-${sc.id}`,
                conversationId: convId,
                questionBody: conv?.body || 'Question thread',
                topic: conv?.topic || 'Discussion',
                responseType: sc.type,
                text: sc.text,
                audioDuration: sc.audio_duration,
                created_at: sc.created_at,
                resonate_count: sc.resonate_count || 0,
              });
            }
          }
        });
      });

      // 2. Query Firestore (if real user or active database)
      try {
        const [convSnap, scrutsSnap] = await Promise.all([
          getDocs(query(collection(db, 'conversations'), where('user_id', '==', userId))),
          getDocs(query(collection(db, 'scruts'), where('user_id', '==', userId))),
        ]);

        const convList = convSnap.docs.map(d => ({ id: d.id, ...d.data() } as Record<string, unknown>));
        const scrutsList = scrutsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Record<string, unknown>));

        if (convList.length > 0) {
          convList.forEach((c: Record<string, unknown>) => {
            const convType = c.type as string;
            const cid = c.id as string;
            if (convType === 'question') {
              if (!loadedQuestions.some((q) => q.id === cid)) {
                loadedQuestions.push({
                  id: cid,
                  user_id: userId,
                  user,
                  type: 'question',
                  body: c.body as string,
                  topic: (c.topic as string) || 'Life',
                  created_at: c.created_at as string,
                  scrut_count: (c.scrut_count as number) || 0,
                  country_count: (c.country_count as number) || 0,
                  is_platform: Boolean(c.is_platform),
                  circulation_score: 0,
                });
              }
            } else if (convType === 'statement') {
              if (!loadedClaims.some((cl) => cl.statementId === cid && cl.sourceType === 'authored_statement')) {
                loadedClaims.push({
                  id: `db-claim-${cid}`,
                  sourceType: 'authored_statement',
                  statementId: cid,
                  body: c.body as string,
                  topic: (c.topic as string) || 'Culture',
                  created_at: c.created_at as string,
                  scrut_count: (c.scrut_count as number) || 0,
                  country_count: (c.country_count as number) || 0,
                });
              }
            }
          });
        }

        if (scrutsList.length > 0) {
          scrutsList.forEach((sc: Record<string, unknown>) => {
            const sid = sc.id as string;
            const conv = sc.conversation as Record<string, unknown> | null;
            const convId = (sc.conversation_id as string) || (conv?.id as string) || '';
            const convType = conv?.type as string | undefined;
            const position = sc.position as StatementPosition;

            if (convType === 'statement' || position) {
              if (!loadedClaims.some((cl) => cl.id === `db-sc-${sid}`)) {
                loadedClaims.push({
                  id: `db-sc-${sid}`,
                  sourceType: 'statement_position',
                  statementId: convId,
                  body: (conv?.body as string) || 'Statement Stance',
                  topic: (conv?.topic as string) || 'Discussion',
                  position: position || 'agree',
                  userArgument: sc.text as string | undefined,
                  scrutType: sc.type as string,
                  audioDuration: sc.audio_duration as number | undefined,
                  attachmentUrl: sc.attachment_url as string | undefined,
                  created_at: sc.created_at as string,
                  resonate_count: (sc.resonate_count as number) || 0,
                });
              }
            } else {
              if (!loadedResponses.some((r) => r.id === `db-resp-${sid}`)) {
                loadedResponses.push({
                  id: `db-resp-${sid}`,
                  conversationId: convId,
                  questionBody: (conv?.body as string) || 'Question Discussion',
                  topic: (conv?.topic as string) || 'Open',
                  responseType: (sc.type as string) || 'text',
                  text: sc.text as string | undefined,
                  audioDuration: sc.audio_duration as number | undefined,
                  attachmentUrl: sc.attachment_url as string | undefined,
                  created_at: sc.created_at as string,
                  resonate_count: (sc.resonate_count as number) || 0,
                });
              }
            }
          });
        }
      } catch (err) {
        console.warn('Could not query remote contributions', err);
      }

      if (!cancelled) {
        setQuestions(loadedQuestions);
        setClaims(loadedClaims);
        setResponses(loadedResponses);
        setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Touch drag handlers
  const onTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dy = e.touches[0].clientY - dragStartY.current;
    if (dy > 0) setDragDy(dy);
  };
  const onTouchEnd = () => {
    isDragging.current = false;
    if (dragDy > 80) {
      triggerClose();
    } else {
      setDragDy(0);
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    dragStartY.current = e.clientY;
    isDragging.current = true;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dy = e.clientY - dragStartY.current;
    if (dy > 0) setDragDy(dy);
  };
  const onMouseUp = () => {
    isDragging.current = false;
    if (dragDy > 80) {
      triggerClose();
    } else {
      setDragDy(0);
    }
  };

  // Filtered counts & lists
  const query = searchQuery.trim().toLowerCase();

  const filteredQuestions = useMemo(() => {
    if (!query) return questions;
    return questions.filter(
      (q) => q.body.toLowerCase().includes(query) || q.topic.toLowerCase().includes(query)
    );
  }, [questions, query]);

  const filteredClaims = useMemo(() => {
    if (!query) return claims;
    return claims.filter(
      (c) =>
        c.body.toLowerCase().includes(query) ||
        c.topic.toLowerCase().includes(query) ||
        (c.userArgument && c.userArgument.toLowerCase().includes(query))
    );
  }, [claims, query]);

  const filteredResponses = useMemo(() => {
    if (!query) return responses;
    return responses.filter(
      (r) =>
        r.questionBody.toLowerCase().includes(query) ||
        r.topic.toLowerCase().includes(query) ||
        (r.text && r.text.toLowerCase().includes(query))
    );
  }, [responses, query]);

  const initials = user.display_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sheetY = closing ? '100%' : !mounted ? '100%' : `${dragDy}px`;

  const navigateToConversation = (id: string) => {
    triggerClose();
    navigate(`/conversation/${id}`);
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-[1100] flex items-end',
        'transition-all duration-300',
        mounted && !closing ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0'
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) triggerClose();
      }}
    >
      <div
        ref={sheetRef}
        className="pointer-events-auto relative w-full max-w-xl mx-auto max-h-[calc(100dvh-0.5rem)] overflow-y-auto overscroll-contain"
        style={{
          transform: `translateY(${sheetY})`,
          transition: isDragging.current ? 'none' : 'transform 0.38s cubic-bezier(0.16,1,0.3,1)',
          willChange: 'transform',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      >
        {/* Sheet body */}
        <div
          className="relative rounded-t-3xl overflow-hidden shadow-2xl flex flex-col min-h-[550px] max-h-[88vh]"
          style={{
            background: 'rgba(14, 14, 22, 0.98)',
            backdropFilter: 'blur(28px)',
            borderTop: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          {/* Top handle bar */}
          <div className="flex justify-center pt-3 pb-1 relative z-10 cursor-grab active:cursor-grabbing shrink-0">
            <div className="w-10 h-1.5 rounded-full bg-white/20" />
          </div>

          {/* Header row */}
          <div className="relative z-10 px-5 pt-2 pb-3.5 border-b border-white/[0.08] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.display_name}
                    className="w-11 h-11 rounded-xl object-cover ring-1 ring-white/10"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white/80 font-bold text-sm">
                    {initials}
                  </div>
                )}
                {user.id !== 'platform' && (
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white ring-2 ring-[#0e0e16]">
                    <Sparkles size={8} />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-white font-bold text-base leading-tight truncate">
                    {isCurrentUser ? 'My Contributions' : `${user.display_name}'s Archive`}
                  </h2>
                  {user.country && getMapUrl(user.country) && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/10 border border-white/15 text-[10px] text-white/80 font-medium" title={`${user.country} map silhouette`}>
                      <img
                        src={getMapUrl(user.country)!}
                        alt={user.country}
                        className="w-3.5 h-3.5 object-contain invert opacity-90"
                      />
                      <span className="truncate max-w-[80px]">{user.country}</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <p className="text-white/40 text-xs truncate">
                    @{user.twitter || user.display_name.toLowerCase().replace(/\s+/g, '')}
                    {!getMapUrl(user.country) && ` · ${user.country || 'Global'}`}
                  </p>

                  {user.website && (
                    <a
                      href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/25 text-sky-300 text-[10px] font-medium hover:bg-sky-500/25 transition-colors"
                      title="Visit website / blog"
                    >
                      <Globe size={10} />
                      <span className="truncate max-w-[110px]">{user.website.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink size={8} />
                    </a>
                  )}

                  {(user.tip_link || (typeof window !== 'undefined' && localStorage.getItem(`scruttin_tip_${user.id}`))) && (
                    <a
                      href={(() => {
                        const tip = user.tip_link || (typeof window !== 'undefined' ? localStorage.getItem(`scruttin_tip_${user.id}`) : '');
                        return tip?.startsWith('http') ? tip : `https://${tip}`;
                      })()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-300 text-[10px] font-semibold hover:bg-amber-500/25 transition-colors"
                      title="Send a tip"
                    >
                      <Coffee size={10} className="text-amber-400" />
                      <span>{getTipLabel(user.tip_link || (typeof window !== 'undefined' ? localStorage.getItem(`scruttin_tip_${user.id}`) : ''))}</span>
                      <ExternalLink size={8} />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={triggerClose}
              className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors touch-manipulation"
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>

          {/* Segmented Tab Navigation */}
          <div className="px-5 pt-3 pb-2.5 shrink-0 bg-white/[0.01]">
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/[0.05] rounded-2xl border border-white/[0.07]">
              {/* Tab 1: Questions */}
              <button
                type="button"
                id="tab-questions-asked"
                onClick={() => setActiveTab('questions')}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all touch-manipulation',
                  activeTab === 'questions'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                )}
              >
                <MessageCircle size={13} className="shrink-0" />
                <span className="truncate">Questions</span>
                <span
                  className={cn(
                    'px-1.5 py-0.2 text-[10px] rounded-full font-mono',
                    activeTab === 'questions' ? 'bg-sky-500/30 text-white' : 'bg-white/10 text-white/40'
                  )}
                >
                  {questions.length}
                </span>
              </button>

              {/* Tab 2: Claims */}
              <button
                type="button"
                id="tab-claims-made"
                onClick={() => setActiveTab('claims')}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all touch-manipulation',
                  activeTab === 'claims'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                )}
              >
                <Scale size={13} className="shrink-0" />
                <span className="truncate">Claims</span>
                <span
                  className={cn(
                    'px-1.5 py-0.2 text-[10px] rounded-full font-mono',
                    activeTab === 'claims' ? 'bg-purple-500/30 text-white' : 'bg-white/10 text-white/40'
                  )}
                >
                  {claims.length}
                </span>
              </button>

              {/* Tab 3: Responses */}
              <button
                type="button"
                id="tab-questions-responded"
                onClick={() => setActiveTab('responses')}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all touch-manipulation',
                  activeTab === 'responses'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                )}
              >
                <Mic2 size={13} className="shrink-0" />
                <span className="truncate">Responses</span>
                <span
                  className={cn(
                    'px-1.5 py-0.2 text-[10px] rounded-full font-mono',
                    activeTab === 'responses' ? 'bg-emerald-500/30 text-white' : 'bg-white/10 text-white/40'
                  )}
                >
                  {responses.length}
                </span>
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative mt-2.5">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${
                  activeTab === 'questions'
                    ? 'questions asked…'
                    : activeTab === 'claims'
                    ? 'claims & stances…'
                    : 'responses to questions…'
                }`}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-white/40 hover:text-white"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-white/40 gap-2">
                <Loader2 size={24} className="animate-spin text-emerald-400" />
                <p className="text-xs">Loading contributions…</p>
              </div>
            ) : activeTab === 'questions' ? (
              /* ================= TAB 1: QUESTIONS ASKED ================= */
              filteredQuestions.length === 0 ? (
                <div className="text-center py-14 px-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                  <MessageCircle size={32} className="mx-auto mb-2 text-sky-400/40" />
                  <h3 className="text-white font-medium text-sm mb-1">
                    {query ? 'No matching questions found' : 'No questions asked yet'}
                  </h3>
                  <p className="text-white/40 text-xs max-w-xs mx-auto mb-4">
                    {query
                      ? 'Try another search term'
                      : isCurrentUser
                      ? 'Ask a curious, thoughtful question to hear perspectives from around the world.'
                      : `${user.display_name} hasn't asked questions on Scruttin yet.`}
                  </p>
                  {isCurrentUser && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerClose();
                        if (onAskQuestion) onAskQuestion();
                        else navigate('/dive/crowd');
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-300 text-xs font-semibold transition-all active:scale-95 touch-manipulation"
                    >
                      <Plus size={13} />
                      <span>Ask a Question</span>
                    </button>
                  )}
                </div>
              ) : (
                filteredQuestions.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => navigateToConversation(q.id)}
                    className="w-full text-left p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-sky-500/30 transition-all group active:scale-[0.99] touch-manipulation block"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/25 text-[10px] font-semibold uppercase tracking-wider">
                        {q.topic || 'Question'}
                      </span>
                      <span className="text-white/30 text-[11px]">{timeAgo(q.created_at)}</span>
                    </div>

                    <h4 className="text-white font-serif text-sm leading-snug group-hover:text-sky-200 transition-colors mb-2.5">
                      "{q.body}"
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-white/40 pt-2 border-t border-white/[0.05]">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <MessageCircle size={11} className="text-sky-400" />
                          <strong className="text-white/70 font-sans">{formatCount(q.scrut_count)}</strong> answers
                        </span>
                        {q.country_count > 0 && (
                          <span className="flex items-center gap-1">
                            <Globe size={11} className="text-emerald-400" />
                            <strong className="text-white/70 font-sans">{q.country_count}</strong> countries
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sky-400 group-hover:translate-x-0.5 transition-transform font-medium">
                        <span>Open thread</span>
                        <ChevronRight size={12} />
                      </div>
                    </div>
                  </button>
                ))
              )
            ) : activeTab === 'claims' ? (
              /* ================= TAB 2: CLAIMS MADE ================= */
              filteredClaims.length === 0 ? (
                <div className="text-center py-14 px-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                  <Scale size={32} className="mx-auto mb-2 text-purple-400/40" />
                  <h3 className="text-white font-medium text-sm mb-1">
                    {query ? 'No matching claims found' : 'No claims or stances made yet'}
                  </h3>
                  <p className="text-white/40 text-xs max-w-xs mx-auto mb-4">
                    {query
                      ? 'Try another search keyword'
                      : isCurrentUser
                      ? 'Post a bold statement or take a stance (agree, disagree, unsure) on propositions.'
                      : `${user.display_name} hasn't made statement claims yet.`}
                  </p>
                  {isCurrentUser && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerClose();
                        if (onMakeClaim) onMakeClaim();
                        else navigate('/dive/statements');
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 text-xs font-semibold transition-all active:scale-95 touch-manipulation"
                    >
                      <Plus size={13} />
                      <span>Post a Statement Claim</span>
                    </button>
                  )}
                </div>
              ) : (
                filteredClaims.map((cl) => {
                  const isAuthored = cl.sourceType === 'authored_statement';
                  const positionColor =
                    cl.position === 'agree'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : cl.position === 'disagree'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30';

                  const PositionIcon =
                    cl.position === 'agree'
                      ? CheckCircle2
                      : cl.position === 'disagree'
                      ? XCircle
                      : HelpCircle;

                  return (
                    <button
                      key={cl.id}
                      type="button"
                      onClick={() => navigateToConversation(cl.statementId)}
                      className="w-full text-left p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-purple-500/30 transition-all group active:scale-[0.99] touch-manipulation block"
                    >
                      {/* Header Badge Row */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/25 text-[10px] font-semibold uppercase tracking-wider">
                            {cl.topic || 'Statement'}
                          </span>

                          {isAuthored ? (
                            <span className="px-2 py-0.5 rounded-md bg-white/10 text-white/80 border border-white/15 text-[10px] font-medium">
                              Original Claim Author
                            </span>
                          ) : (
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold capitalize',
                                positionColor
                              )}
                            >
                              <PositionIcon size={10} />
                              {cl.position}
                            </span>
                          )}
                        </div>

                        <span className="text-white/30 text-[11px]">{timeAgo(cl.created_at)}</span>
                      </div>

                      {/* Statement / Claim Text */}
                      <h4 className="text-white font-serif text-sm leading-snug group-hover:text-purple-200 transition-colors mb-2">
                        "{cl.body}"
                      </h4>

                      {/* User's perspective / argument if they responded */}
                      {cl.userArgument && (
                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 mb-2.5 text-xs text-white/70 italic">
                          "{cl.userArgument}"
                        </div>
                      )}

                      {/* Attached media if any */}
                      {cl.attachmentUrl && (
                        <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/40 mb-2.5 max-h-40">
                          <img
                            src={cl.attachmentUrl}
                            alt="Claim attachment"
                            className="w-full h-32 object-cover"
                          />
                          {(cl.attachmentUrl.toLowerCase().includes('.gif') || cl.attachmentUrl.toLowerCase().includes('giphy')) && (
                            <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.2 rounded bg-purple-600/90 text-white font-bold text-[9px] uppercase tracking-wider">
                              GIF
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer Stats */}
                      <div className="flex items-center justify-between text-[11px] text-white/40 pt-2 border-t border-white/[0.05]">
                        <div className="flex items-center gap-3">
                          {cl.scrut_count !== undefined && (
                            <span className="flex items-center gap-1">
                              <MessageCircle size={11} className="text-purple-400" />
                              <strong className="text-white/70 font-sans">{formatCount(cl.scrut_count)}</strong> takes
                            </span>
                          )}
                          {cl.resonate_count !== undefined && cl.resonate_count > 0 && (
                            <span className="flex items-center gap-1 text-rose-300">
                              <span>♥</span>
                              <span>{cl.resonate_count} resonates</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-purple-400 group-hover:translate-x-0.5 transition-transform font-medium">
                          <span>View claim debate</span>
                          <ChevronRight size={12} />
                        </div>
                      </div>
                    </button>
                  );
                })
              )
            ) : (
              /* ================= TAB 3: QUESTIONS RESPONDED TO ================= */
              filteredResponses.length === 0 ? (
                <div className="text-center py-14 px-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                  <Mic2 size={32} className="mx-auto mb-2 text-emerald-400/40" />
                  <h3 className="text-white font-medium text-sm mb-1">
                    {query ? 'No matching responses found' : 'No responses yet'}
                  </h3>
                  <p className="text-white/40 text-xs max-w-xs mx-auto mb-4">
                    {query
                      ? 'Try another search term'
                      : isCurrentUser
                      ? 'Share your voice note or perspective on one of the questions in the stream.'
                      : `${user.display_name} hasn't responded to questions yet.`}
                  </p>
                  {isCurrentUser && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerClose();
                        navigate('/stream');
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all active:scale-95 touch-manipulation"
                    >
                      <MessageCircle size={13} />
                      <span>Browse Stream & Answer</span>
                    </button>
                  )}
                </div>
              ) : (
                filteredResponses.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => navigateToConversation(r.conversationId)}
                    className="w-full text-left p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-emerald-500/30 transition-all group active:scale-[0.99] touch-manipulation block"
                  >
                    {/* Header question context */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                        In response to:
                      </span>
                      <span className="text-white/30 text-[11px]">{timeAgo(r.created_at)}</span>
                    </div>

                    <h5 className="text-white/65 font-serif text-xs leading-snug line-clamp-2 mb-2.5 italic">
                      "{r.questionBody}"
                    </h5>

                    {/* Answer content */}
                    {r.text ? (
                      <div className="p-3 rounded-xl bg-white/[0.04] border border-white/5 mb-2.5">
                        <p className="text-white text-xs leading-relaxed font-sans line-clamp-3">
                          {r.text}
                        </p>
                      </div>
                    ) : r.responseType === 'voice' || r.audioDuration ? (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium mb-2.5">
                        <Mic2 size={13} className="text-emerald-400 animate-pulse" />
                        <span>Voice take recorded ({r.audioDuration || 40}s)</span>
                      </div>
                    ) : null}

                    {/* Attached media if any */}
                    {r.attachmentUrl && (
                      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/40 mb-2.5 max-h-40">
                        <img
                          src={r.attachmentUrl}
                          alt="Response attachment"
                          className="w-full h-32 object-cover"
                        />
                        {(r.attachmentUrl.toLowerCase().includes('.gif') || r.attachmentUrl.toLowerCase().includes('giphy')) && (
                          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.2 rounded bg-purple-600/90 text-white font-bold text-[9px] uppercase tracking-wider">
                            GIF
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-[11px] text-white/40 pt-2 border-t border-white/[0.05]">
                      <div className="flex items-center gap-2">
                        {r.resonate_count > 0 ? (
                          <span className="text-rose-300 font-medium flex items-center gap-1">
                            <span>♥</span>
                            <span>{r.resonate_count} resonates</span>
                          </span>
                        ) : (
                          <span className="text-white/30">Shared perspective</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-emerald-400 group-hover:translate-x-0.5 transition-transform font-medium">
                        <span>Open discussion</span>
                        <ChevronRight size={12} />
                      </div>
                    </div>
                  </button>
                ))
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
