import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CloudRain,
  Snowflake,
  Zap,
  MapPin,
  Coffee,
  Globe,
  Sparkles,
  Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { fetchFirestoreConversations } from '@/lib/firestoreService';
import { MOCK_CONVERSATIONS } from '@/constants/mockData';
import LandingFooter from '@/components/layout/LandingFooter';

interface FeaturedCountry {
  name: string;
  demonym: string;
  iso: string;
}

const FEATURED_COUNTRIES: FeaturedCountry[] = [
  { name: 'Japan', demonym: 'Japanese', iso: 'jp' },
  { name: 'Nigeria', demonym: 'Nigerians', iso: 'ng' },
  { name: 'United Kingdom', demonym: 'British', iso: 'gb' },
  { name: 'France', demonym: 'French', iso: 'fr' },
  { name: 'Brazil', demonym: 'Brazilians', iso: 'br' },
  { name: 'Kenya', demonym: 'Kenyans', iso: 'ke' },
  { name: 'Germany', demonym: 'Germans', iso: 'de' },
  { name: 'Canada', demonym: 'Canadians', iso: 'ca' },
  { name: 'Ghana', demonym: 'Ghanaians', iso: 'gh' },
  { name: 'Mexico', demonym: 'Mexicans', iso: 'mx' },
  { name: 'India', demonym: 'Indians', iso: 'in' },
  { name: 'South Korea', demonym: 'South Koreans', iso: 'kr' },
  { name: 'Italy', demonym: 'Italians', iso: 'it' },
  { name: 'South Africa', demonym: 'South Africans', iso: 'za' },
  { name: 'Australia', demonym: 'Australians', iso: 'au' },
  { name: 'Spain', demonym: 'Spanish', iso: 'es' },
  { name: 'Egypt', demonym: 'Egyptians', iso: 'eg' },
  { name: 'Colombia', demonym: 'Colombians', iso: 'co' },
  { name: 'Jamaica', demonym: 'Jamaicans', iso: 'jm' },
  { name: 'Ireland', demonym: 'Irish', iso: 'ie' },
  { name: 'Argentina', demonym: 'Argentines', iso: 'ar' },
  { name: 'United States', demonym: 'Americans', iso: 'us' },
  { name: 'Indonesia', demonym: 'Indonesians', iso: 'id' },
  { name: 'Sweden', demonym: 'Swedes', iso: 'se' },
];

interface SystemQuestion {
  id: string;
  body: string;
  topic?: string;
  scrut_count?: number;
  country_count?: number;
}

const FALLBACK_QUESTIONS: SystemQuestion[] = [
  {
    id: 'fb-street',
    body: 'What is something your city or culture understands that the rest of the world gets wrong?',
    topic: 'Culture',
    scrut_count: 3120,
    country_count: 54,
  },
  {
    id: 'fb-c1',
    body: "What's something you stopped caring about as you got older?",
    topic: 'Life',
    scrut_count: 2847,
    country_count: 41,
  },
  {
    id: 'fb-c4',
    body: "What's something that's normal in your country but surprises foreigners?",
    topic: 'Culture',
    scrut_count: 892,
    country_count: 53,
  },
  {
    id: 'fb-c3',
    body: "What's something your parents were right about?",
    topic: 'Family',
    scrut_count: 3421,
    country_count: 47,
  },
  {
    id: 'fb-c5',
    body: 'When did you realise you were actually becoming an adult?',
    topic: 'Life',
    scrut_count: 1587,
    country_count: 33,
  },
  {
    id: 'fb-c7',
    body: "What's something adulthood didn't prepare you for?",
    topic: 'Life',
    scrut_count: 4102,
    country_count: 58,
  },
  {
    id: 'fb-c8',
    body: 'What does success mean to you?',
    topic: 'Philosophy',
    scrut_count: 2103,
    country_count: 39,
  },
];

const ATMOSPHERE_OPTIONS = [
  { id: 'rain', name: 'Rainfall', icon: CloudRain, desc: 'Gentle precipitation & soft acoustic dampening' },
  { id: 'snow', name: 'Snowfall', icon: Snowflake, desc: 'Quiet drifting flakes & winter stillness' },
  { id: 'thunder', name: 'Thunder', icon: Zap, desc: 'Distant rolling storms for solitary night listening' },
  { id: 'custom', name: 'Personal Wallpaper', icon: Sparkles, desc: 'Upload your own photographs as listening backdrops' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [questions, setQuestions] = useState<SystemQuestion[]>(FALLBACK_QUESTIONS);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedAtmosphere, setSelectedAtmosphere] = useState('rain');

  // Random moving country silhouette in header (cycles every 2.8 seconds)
  const [countryIndex, setCountryIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountryIndex(prev => {
        let next = Math.floor(Math.random() * FEATURED_COUNTRIES.length);
        while (next === prev && FEATURED_COUNTRIES.length > 1) {
          next = Math.floor(Math.random() * FEATURED_COUNTRIES.length);
        }
        return next;
      });
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const cycleRandomCountry = () => {
    setCountryIndex(prev => {
      let next = Math.floor(Math.random() * FEATURED_COUNTRIES.length);
      while (next === prev && FEATURED_COUNTRIES.length > 1) {
        next = Math.floor(Math.random() * FEATURED_COUNTRIES.length);
      }
      return next;
    });
  };

  const currentCountry = FEATURED_COUNTRIES[countryIndex] ?? FEATURED_COUNTRIES[0];

  // Touch swipe support for mobile
  const touchStartXRef = useRef<number | null>(null);

  // Load questions from Firestore + Mock data
  useEffect(() => {
    let isMounted = true;
    async function loadQuestions() {
      try {
        const firestoreList = await fetchFirestoreConversations('question');
        if (isMounted && firestoreList && firestoreList.length > 0) {
          const mapped: SystemQuestion[] = firestoreList.map(q => ({
            id: q.id,
            body: q.body,
            topic: q.topic || 'General',
            scrut_count: q.scrut_count || 120,
            country_count: q.country_count || 15,
          }));

          // Merge unique questions strictly by id and body
          const seenIds = new Set<string>();
          const seenBodies = new Set<string>();
          const combined: SystemQuestion[] = [];

          const addQuestion = (item: SystemQuestion) => {
            const id = (item.id || '').trim();
            const normBody = (item.body || '').trim().toLowerCase();
            if (!id || seenIds.has(id) || seenBodies.has(normBody)) return;
            seenIds.add(id);
            seenBodies.add(normBody);
            combined.push(item);
          };

          // Real database questions take precedence
          mapped.forEach(addQuestion);
          // Supplement with fallback questions if needed
          FALLBACK_QUESTIONS.forEach(addQuestion);

          setQuestions(combined.length > 0 ? combined : FALLBACK_QUESTIONS);
        } else if (isMounted) {
          // Add any mock conversations of type 'question'
          const mocks = MOCK_CONVERSATIONS.filter(c => c.type === 'question').map(q => ({
            id: q.id,
            body: q.body,
            topic: q.topic || 'Culture',
            scrut_count: q.scrut_count,
            country_count: q.country_count,
          }));

          const seenIds = new Set<string>();
          const seenBodies = new Set<string>();
          const combined: SystemQuestion[] = [];

          const addQuestion = (item: SystemQuestion) => {
            const id = (item.id || '').trim();
            const normBody = (item.body || '').trim().toLowerCase();
            if (!id || seenIds.has(id) || seenBodies.has(normBody)) return;
            seenIds.add(id);
            seenBodies.add(normBody);
            combined.push(item);
          };

          mocks.forEach(addQuestion);
          FALLBACK_QUESTIONS.forEach(addQuestion);

          setQuestions(combined.length > 0 ? combined : FALLBACK_QUESTIONS);
        }
      } catch {
        // use default fallback questions
      }
    }
    loadQuestions();
    return () => {
      isMounted = false;
    };
  }, []);

  // Slide through questions automatically every 6 seconds
  useEffect(() => {
    if (isHovered || questions.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentQuestionIndex(prev => (prev + 1) % questions.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isHovered, questions.length]);

  const handlePrevQuestion = () => {
    setCurrentQuestionIndex(prev => (prev - 1 + questions.length) % questions.length);
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex(prev => (prev + 1) % questions.length);
  };

  // Mobile swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNextQuestion();
      } else {
        handlePrevQuestion();
      }
    }
    touchStartXRef.current = null;
  };

  const currentQ = questions[currentQuestionIndex] ?? questions[0];

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#191918] font-sans antialiased selection:bg-[#EAE8E0] selection:text-[#191918]">
      {/* Top Border Accent */}
      <div className="h-1 bg-[#191918] w-full" />

      {/* Header */}
      <header className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-5 flex items-center justify-between border-b border-[#EBE8E0]">
        <div
          onClick={cycleRandomCountry}
          title="Click to explore another nation's voice"
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group select-none min-w-0"
        >
          {/* Moving Country Map Silhouette */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#191918] text-[#FAF9F5] flex items-center justify-center p-1.5 shadow-sm shrink-0 overflow-hidden relative border border-[#2D2D2A]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCountry.iso}
                initial={{ opacity: 0, scale: 0.75, rotate: -6 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotate: 0,
                  y: [0, -1.5, 0, 1.5, 0],
                  x: [0, 1, 0, -1, 0],
                }}
                exit={{ opacity: 0, scale: 0.75, rotate: 6 }}
                transition={{
                  opacity: { duration: 0.25 },
                  scale: { duration: 0.25 },
                  rotate: { duration: 0.25 },
                  y: { repeat: Infinity, duration: 3.5, ease: 'easeInOut' },
                  x: { repeat: Infinity, duration: 4, ease: 'easeInOut' },
                }}
                className="w-full h-full flex items-center justify-center"
              >
                <img
                  src={`https://raw.githubusercontent.com/djaiss/mapsicon/master/all/${currentCountry.iso}/256.png`}
                  alt={`${currentCountry.name} map silhouette`}
                  className="w-full h-full object-contain filter brightness-0 invert pointer-events-none"
                  loading="eager"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dynamic Country People on Scruttin */}
          <div className="flex flex-col justify-center min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCountry.iso}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.2 }}
                className="min-w-0"
              >
                <span className="font-serif font-semibold text-sm sm:text-base md:text-lg tracking-tight text-[#191918] block leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                  {currentCountry.demonym} on Scruttin
                </span>
                <span className="text-[9px] sm:text-[10px] tracking-wider uppercase text-[#76746E] font-medium font-mono block leading-tight">
                  {currentCountry.name} &middot; Everyday Voices
                </span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Center / Right Navigation */}
        <nav className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 text-xs font-medium text-[#64625B]">
            <button
              type="button"
              onClick={() => navigate('/stream')}
              className="hover:text-[#191918] transition-colors"
            >
              The Stream
            </button>
            <button
              type="button"
              onClick={() => navigate('/dive')}
              className="hover:text-[#191918] transition-colors"
            >
              Questions
            </button>
            <button
              type="button"
              onClick={() => navigate('/tagged')}
              className="hover:text-[#191918] transition-colors"
            >
              Tagged Feed
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {user ? (
              <button
                type="button"
                id="header-stream-open"
                onClick={() => navigate('/stream')}
                className="h-8 sm:h-9 px-3 sm:px-4 rounded-full bg-[#191918] text-[#FAF9F5] text-[11px] sm:text-xs font-medium hover:bg-black transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span>Enter Stream</span>
                <ArrowRight size={11} className="sm:size-3" />
              </button>
            ) : (
              <button
                type="button"
                id="header-join-now"
                onClick={() => navigate('/auth')}
                className="h-8 sm:h-9 px-3.5 sm:px-4 rounded-full bg-[#191918] text-[#FAF9F5] text-[11px] sm:text-xs font-medium hover:bg-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <span>Join now</span>
                <ArrowRight size={11} className="sm:size-3" />
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-16 pb-16 sm:pb-20">
        <div className="max-w-3xl mb-10 sm:mb-12">
          <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.2em] sm:tracking-[0.22em] text-[#7A7870] mb-2 sm:mb-3">
            A quiet sanctuary for authentic speech
          </p>

          <h1 className="font-serif font-normal text-3xl sm:text-5xl lg:text-6xl text-[#141413] tracking-tight leading-[1.12] mb-4 sm:mb-5">
            One question. Multiple ruts from strangers around the world.
          </h1>

          <p className="text-sm sm:text-lg text-[#55534C] font-light leading-relaxed mb-6 sm:mb-8 max-w-2xl">
            Real people across the world speaking their truth. Listen to candid, self-recorded voice dispatches and written ruts from Tokyo to Lagos. Every rut is experienced <strong className="font-semibold text-[#191918]">once in a lifetime</strong>—free from algorithmic feeds, outrage machines, and vanity follower counts.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              id="hero-enter-stream-btn"
              onClick={() => navigate('/stream')}
              className="h-11 sm:h-12 px-6 sm:px-7 rounded-full bg-[#191918] text-[#FAF9F5] font-medium text-xs sm:text-sm hover:bg-black transition-all flex items-center gap-2 shadow-sm active:scale-[0.98]"
            >
              <span>Experience the Stream</span>
              <ArrowRight size={13} className="sm:size-3.5" />
            </button>
            <button
              type="button"
              id="hero-browse-questions-btn"
              onClick={() => navigate('/dive')}
              className="h-11 sm:h-12 px-5 sm:px-6 rounded-full bg-white border border-[#DCD9D0] text-[#383733] hover:border-[#191918] hover:text-[#191918] font-medium text-xs sm:text-sm transition-all flex items-center gap-2"
            >
              <span>Browse Global Prompts</span>
            </button>
          </div>
        </div>

        {/* The Question Posed to the Streets: Slides through questions in system (Mobile-responsive header) */}
        <section
          aria-label="Current Global Street Interview Questions"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="rounded-2xl border border-[#E2DFD6] bg-white p-4 sm:p-8 md:p-10 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-14 sm:mb-20 transition-all select-none"
        >
          {/* Card Header (Fixed for mobile: non-wrapping badge, clean spacing) */}
          <div className="pb-3 sm:pb-5 border-b border-[#EFECE4]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-[#191918] text-white text-[10px] sm:text-[11px] font-mono tracking-wider uppercase font-semibold whitespace-nowrap shrink-0">
                  <Radio size={10} className="text-amber-300 shrink-0 sm:size-[11px]" />
                  Street Interview
                </span>
                <span className="text-[10px] sm:text-xs text-[#7A7870] font-mono whitespace-nowrap">
                  Worldwide Dispatch &middot; {questions.length} Questions
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[#4A684C] font-mono font-medium whitespace-nowrap self-start sm:self-auto">
                <Sparkles size={11} className="shrink-0 text-emerald-600 sm:size-3" />
                <span>Once in a lifetime listening experience</span>
              </div>
            </div>
          </div>

          {/* THE QUESTION POSED TO THE STREETS — Slider */}
          <div className="py-7 sm:py-9">
            {/* Top row with label and carousel controls */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#7A7870]">
                THE QUESTION POSED TO THE STREETS
              </p>

              {/* Slider Controls */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#7A7870] tabular-nums">
                  {String(currentQuestionIndex + 1).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    id="prev-question-btn"
                    onClick={handlePrevQuestion}
                    aria-label="Previous question"
                    className="w-7 h-7 rounded-full border border-[#DCD8CC] bg-[#FAF9F5] hover:bg-[#EAE7DE] flex items-center justify-center text-[#191918] transition-colors active:scale-95"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    id="next-question-btn"
                    onClick={handleNextQuestion}
                    aria-label="Next question"
                    className="w-7 h-7 rounded-full border border-[#DCD8CC] bg-[#FAF9F5] hover:bg-[#EAE7DE] flex items-center justify-center text-[#191918] transition-colors active:scale-95"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* The Question Text */}
            <div className="min-h-[110px] sm:min-h-[120px] flex flex-col justify-center">
              <h2
                key={currentQ?.id ? `q-text-${currentQ.id}` : `q-text-${currentQuestionIndex}`}
                className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#141413] leading-snug sm:leading-tight font-normal transition-all duration-300"
              >
                “{currentQ?.body}”
              </h2>
            </div>

            {/* Slider Dots / Indicators */}
            <div className="flex items-center gap-1.5 mt-5 overflow-x-auto pb-1 scrollbar-none">
              {questions.map((q, idx) => (
                <button
                  key={`q-indicator-${q.id || idx}`}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(idx)}
                  aria-label={`Go to question ${idx + 1}`}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    idx === currentQuestionIndex
                      ? 'w-7 bg-[#191918]'
                      : 'w-2 bg-[#E2DFD6] hover:bg-[#C9C5BA]'
                  )}
                />
              ))}
            </div>

            {/* Question Details Bar: Responses, Countries & CTA */}
            <div className="pt-6 mt-6 border-t border-[#EFECE4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 sm:gap-3 text-[#6E6B62] font-mono flex-wrap">
                {currentQ.topic && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EAE7DF] text-[#383733] font-medium text-[11px]">
                    {currentQ.topic}
                  </span>
                )}
                <span className="text-[11px] sm:text-xs">
                  {currentQ.country_count ?? 42} countries responded
                </span>
                <span className="text-[#C4C0B4]">&middot;</span>
                <span className="text-[11px] sm:text-xs">
                  {(currentQ.scrut_count ?? 1240).toLocaleString()} ruts in circulation
                </span>
              </div>

              <button
                type="button"
                onClick={() => navigate('/stream')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#191918] hover:text-black self-start sm:self-auto group transition-colors"
              >
                <span>Listen to ruts for this question</span>
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </section>

        {/* The Four Architectural Tenets */}
        <section aria-labelledby="tenets-heading" className="mb-16 sm:mb-20">
          <div className="border-b border-[#E2DFD6] pb-4 mb-8">
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#7A7870] mb-1">
              Structure & Intention
            </p>
            <h2 id="tenets-heading" className="font-serif text-2xl sm:text-3xl text-[#141413] font-normal">
              How Scruttin Operates
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. One Question, Multiple Ruts */}
            <div className="p-6 rounded-xl bg-white border border-[#E2DFD6] flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono text-[#7A7870] block mb-3">01 / The Prompt</span>
                <h3 className="font-serif text-lg text-[#141413] font-medium mb-2 leading-snug">
                  One Question, Multiple Ruts
                </h3>
                <p className="text-xs text-[#5C5A52] leading-relaxed">
                  Real human perspectives. Evocative questions posed to the community, answered by authentic self-recorded spoken dispatches and written reflections from members worldwide.
                </p>
              </div>
            </div>

            {/* 2. Once in a Lifetime */}
            <div className="p-6 rounded-xl bg-white border border-[#E2DFD6] flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono text-[#7A7870] block mb-3">02 / Ephemeral Cadence</span>
                <h3 className="font-serif text-lg text-[#141413] font-medium mb-2 leading-snug">
                  Once in a Lifetime
                </h3>
                <p className="text-xs text-[#5C5A52] leading-relaxed">
                  In the stream, each rut is encountered once. Listen deeply, absorb the stranger's world, and let it pass—no addictive replay loops or algorithmic doomscrolling.
                </p>
              </div>
            </div>

            {/* 3. The 100 Taggers Threshold */}
            <div className="p-6 rounded-xl bg-white border border-[#E2DFD6] flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono text-[#7A7870] block mb-3">03 / Proven Resonance</span>
                <h3 className="font-serif text-lg text-[#141413] font-medium mb-2 leading-snug">
                  Tagged Feed at 100
                </h3>
                <p className="text-xs text-[#5C5A52] leading-relaxed">
                  Tag along with thinkers whose perspectives ground you. When 100 strangers tag along with your voice, you unlock the right to post in the exclusive Tagged Feed.
                </p>
              </div>
            </div>

            {/* 4. Living Atmosphere */}
            <div className="p-6 rounded-xl bg-white border border-[#E2DFD6] flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono text-[#7A7870] block mb-3">04 / Audio Sanctuary</span>
                <h3 className="font-serif text-lg text-[#141413] font-medium mb-2 leading-snug">
                  Tailored Atmospheres
                </h3>
                <p className="text-xs text-[#5C5A52] leading-relaxed">
                  Surround your thoughts with falling rain, gentle snowfall, night thunder, or personal photo wallpapers designed for calm, uninterrupted contemplation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Creator Ecosystem: Clean layout without public archive preview */}
        <section aria-labelledby="creator-ecosystem-heading" className="rounded-2xl border border-[#E2DFD6] bg-white p-6 sm:p-10 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-16 sm:mb-20">
          <div className="max-w-3xl mb-8">
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#7A7870] mb-2">
              Creator Empowerment
            </p>
            <h2 id="creator-ecosystem-heading" className="font-serif text-2xl sm:text-3xl text-[#141413] font-normal leading-tight mb-3">
              A platform that honors where you speak from, and sends readers to your craft.
            </h2>
            <p className="text-xs sm:text-sm text-[#55534C] leading-relaxed font-light">
              Scruttin doesn't trap your audience inside a walled garden. Concise ruts introduce your worldview to strangers, driving meaningful traffic to your longform work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[#EFECE4]">
            <div className="flex flex-col gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F2EFE9] flex items-center justify-center text-[#191918]">
                <MapPin size={15} />
              </div>
              <h3 className="font-serif text-base font-semibold text-[#191918]">
                Country Map Silhouettes
              </h3>
              <p className="text-xs text-[#55534C] leading-relaxed font-light">
                Your geographic silhouette appears beside your name—listeners instantly discover where on the globe your voice and culture originated.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F2EFE9] flex items-center justify-center text-[#191918]">
                <Globe size={15} />
              </div>
              <h3 className="font-serif text-base font-semibold text-[#191918]">
                Direct Traffic To Your Blog
              </h3>
              <p className="text-xs text-[#55534C] leading-relaxed font-light">
                Your short ruts serve as natural portals. Interested listeners can click through directly to read your essays and visit your independent domain.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F2EFE9] flex items-center justify-center text-[#191918]">
                <Coffee size={15} />
              </div>
              <h3 className="font-serif text-base font-semibold text-[#191918]">
                Direct Coffee & Tip Support
              </h3>
              <p className="text-xs text-[#55534C] leading-relaxed font-light">
                Link your Buy Me a Coffee, Ko-fi, or PayPal so listeners around the globe can support your work directly without middleman cuts.
              </p>
            </div>
          </div>
        </section>

        {/* Atmosphere Experience Picker */}
        <section aria-labelledby="atmosphere-heading" className="p-6 sm:p-8 rounded-2xl border border-[#E2DFD6] bg-white mb-16 sm:mb-20">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-6 pb-4 border-b border-[#EFECE4] gap-2">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#7A7870] mb-1">
                Acoustic Backdrop
              </p>
              <h2 id="atmosphere-heading" className="font-serif text-2xl text-[#141413] font-normal">
                Choose Your Listening Atmosphere
              </h2>
            </div>
            <p className="text-xs text-[#7A7870]">Configurable anytime inside Make Scruttin Yours</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {ATMOSPHERE_OPTIONS.map(atmo => {
              const Icon = atmo.icon;
              const isSelected = selectedAtmosphere === atmo.id;
              return (
                <button
                  key={atmo.id}
                  type="button"
                  onClick={() => setSelectedAtmosphere(atmo.id)}
                  className={cn(
                    'p-4 rounded-xl text-left border transition-all',
                    isSelected
                      ? 'bg-[#FAF9F5] border-[#191918] shadow-sm'
                      : 'bg-white border-[#E5E2D9] hover:border-[#CFCBC0]'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon size={16} className={isSelected ? 'text-[#191918]' : 'text-[#7A7870]'} />
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#191918]" />
                    )}
                  </div>
                  <h3 className="text-xs font-semibold text-[#191918] mb-1">{atmo.name}</h3>
                  <p className="text-[11px] text-[#696760] leading-relaxed">{atmo.desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Final Quiet Invitation */}
        <section className="text-center py-14 sm:py-16 px-6 rounded-2xl bg-[#FAF9F6] border border-[#E2DFD6]">
          <h2 className="font-serif text-2xl sm:text-4xl text-[#141413] font-normal mb-4">
            Hear what the world is saying right now.
          </h2>
          <p className="text-sm sm:text-base text-[#55534C] max-w-xl mx-auto mb-8 font-light leading-relaxed">
            Step into the stream to listen anonymously, or step up to the microphone to answer today's question with your own self-recorded rut.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              id="cta-bottom-stream"
              onClick={() => navigate('/stream')}
              className="h-12 px-8 rounded-full bg-[#191918] text-white font-medium text-sm hover:bg-black transition-all flex items-center gap-2 shadow-sm"
            >
              <span>Enter The Stream</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
      </main>

      {/* Minimal Editorial Footer */}
      <LandingFooter />
    </div>
  );
}
