import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Info,
  BookOpen,
  FileText,
  ShieldCheck,
  ArrowLeft,
  Mail,
  Copy,
  Check,
  ExternalLink,
  Twitter,
  Music,
  Share2,
  Mic,
  Users,
  Sparkles,
  Radio,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import LandingFooter from '@/components/layout/LandingFooter';
import { useAuth } from '@/contexts/AuthContext';

export type LegalDocType = 'about' | 'guidelines' | 'terms' | 'privacy';

interface TabItem {
  id: LegalDocType;
  label: string;
  path: string;
  icon: typeof Info;
}

const TABS: TabItem[] = [
  { id: 'about', label: 'About', path: '/about', icon: Info },
  { id: 'guidelines', label: 'Content Guidelines', path: '/content-guidelines', icon: BookOpen },
  { id: 'terms', label: 'Terms of Service', path: '/terms', icon: FileText },
  { id: 'privacy', label: 'Privacy Policy', path: '/privacy', icon: ShieldCheck },
];

function getDocTypeFromPath(pathname: string): LegalDocType {
  if (pathname.includes('guidelines')) return 'guidelines';
  if (pathname.includes('terms')) return 'terms';
  if (pathname.includes('privacy')) return 'privacy';
  return 'about';
}

export default function LegalPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentDoc = getDocTypeFromPath(location.pathname);

  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Scroll to top whenever route changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText('founder@scruttin.com');
      setCopiedEmail(true);
      toast.success('Email copied (founder@scruttin.com)');
      setTimeout(() => setCopiedEmail(false), 2500);
    } catch {
      window.location.href = 'mailto:founder@scruttin.com';
    }
  };

  const handleCopyPageUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      toast.success('Page link copied to clipboard');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toast.error('Unable to copy URL');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#191918] selection:bg-[#EAE6DA] selection:text-[#191918] flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#FAF9F5]/90 backdrop-blur-md border-b border-[#EAE7DF]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#7A7870] hover:text-[#191918] transition-colors py-1.5 px-2 rounded-md hover:bg-[#EFECE4]"
              title="Return to Scruttin home"
            >
              <ArrowLeft size={13} />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Home</span>
            </Link>

            <div className="h-4 w-px bg-[#EAE7DF]" />

            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-6 h-6 rounded bg-[#191918] text-[#FAF9F5] flex items-center justify-center font-serif font-bold text-xs shadow-sm">
                S
              </div>
              <span className="font-serif font-semibold text-base tracking-tight text-[#191918] group-hover:opacity-80 transition-opacity">
                Scruttin
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/stream"
              className="px-3 py-1.5 rounded-full text-xs font-medium text-[#52504A] hover:text-[#191918] hover:bg-[#EFECE4] transition-colors"
            >
              Stream
            </Link>

            {user ? (
              <button
                type="button"
                onClick={() => navigate('/stream')}
                className="h-8 px-3.5 rounded-full bg-[#191918] text-[#FAF9F5] text-xs font-medium hover:bg-black transition-all flex items-center gap-1.5 shadow-sm"
              >
                Go to App
              </button>
            ) : (
              <Link
                to="/auth"
                className="h-8 px-3.5 rounded-full bg-[#191918] text-[#FAF9F5] text-xs font-medium hover:bg-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                Join now
              </Link>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <nav
            className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar border-t border-[#EAE7DF]/60 py-2"
            aria-label="Documentation navigation"
          >
            {TABS.map((tab) => {
              const isActive = currentDoc === tab.id;
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.id}
                  to={tab.path}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#191918] text-white shadow-sm'
                      : 'text-[#636159] hover:bg-[#EFECE4] hover:text-[#191918]'
                  }`}
                >
                  <Icon size={13} className={isActive ? 'text-white' : 'text-[#7A7870]'} />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Document Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-14">
        {/* Document Header */}
        <div className="border-b border-[#EAE7DF] pb-6 sm:pb-8 mb-8 sm:mb-10">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#7A7870]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>Scruttin Official Documentation</span>
              <span>&middot;</span>
              <span>Updated September 2026</span>
            </div>

            <button
              type="button"
              onClick={handleCopyPageUrl}
              className="inline-flex items-center gap-1.5 text-xs text-[#7A7870] hover:text-[#191918] px-2.5 py-1 rounded-md hover:bg-[#EFECE4] transition-colors font-mono"
              title="Share or copy page link"
            >
              {copiedLink ? <Check size={12} className="text-emerald-600" /> : <Share2 size={12} />}
              <span>{copiedLink ? 'Link Copied' : 'Share'}</span>
            </button>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-tight text-[#141413] leading-tight mb-3">
            {currentDoc === 'about' && 'About Scruttin'}
            {currentDoc === 'guidelines' && 'Content Guidelines'}
            {currentDoc === 'terms' && 'Terms of Service'}
            {currentDoc === 'privacy' && 'Privacy Policy'}
          </h1>

          <p className="text-sm sm:text-base text-[#636159] font-light max-w-2xl leading-relaxed">
            {currentDoc === 'about' &&
              'A quiet, algorithm-free sanctuary where real individuals worldwide self-record their authentic reflections and voice dispatches.'}
            {currentDoc === 'guidelines' &&
              'The fundamental principles that protect our sanctuary: speaking for yourself, human consent, zero AI-synthetic speech, and mutual civility.'}
            {currentDoc === 'terms' &&
              'The terms, rights, and conditions governing membership, self-recorded submissions, and use of the Scruttin broadcast stream.'}
            {currentDoc === 'privacy' &&
              'Our commitment to strict privacy, zero tracking pixels, on-demand microphone access, and user data rights.'}
          </p>
        </div>

        {/* Dynamic Body Content */}
        {currentDoc === 'about' && <AboutContent onCopyEmail={handleCopyEmail} copiedEmail={copiedEmail} />}
        {currentDoc === 'guidelines' && <GuidelinesContent />}
        {currentDoc === 'terms' && <TermsContent />}
        {currentDoc === 'privacy' && <PrivacyContent />}

        {/* Direct Help & Contact Box */}
        <section className="mt-12 sm:mt-16 p-6 sm:p-8 rounded-2xl bg-white border border-[#E2DFD6] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <h3 className="font-serif text-lg sm:text-xl font-medium text-[#191918]">
                Direct Founder Contact
              </h3>
              <p className="text-xs sm:text-sm text-[#636159] max-w-lg leading-relaxed">
                Have a proposal, an authentic question you want to pose to the global community, or need assistance with your ruts or account? Speak directly with our founder.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="mailto:founder@scruttin.com"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#191918] text-white text-xs font-medium hover:bg-black transition-all shadow-sm"
              >
                <Mail size={13} />
                <span>founder@scruttin.com</span>
              </a>
              <button
                type="button"
                onClick={handleCopyEmail}
                title="Copy founder email"
                className="p-2 rounded-lg border border-[#E2DFD6] bg-[#FAF9F5] text-[#52504A] hover:text-[#191918] hover:bg-[#EFECE4] transition-colors"
                aria-label="Copy email address"
              >
                {copiedEmail ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-[#EAE7DF] flex flex-wrap items-center justify-between gap-3 text-xs text-[#7A7870] font-mono">
            <span>Official Social Channels:</span>
            <div className="flex items-center gap-4">
              <a
                href="https://www.tiktok.com/@scruttin"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-[#191918] transition-colors"
              >
                <Music size={12} />
                <span>TikTok @scruttin</span>
                <ExternalLink size={10} />
              </a>
              <a
                href="https://x.com/scruttin"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-[#191918] transition-colors"
              >
                <Twitter size={12} />
                <span>X @scruttin</span>
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Shared Editorial Footer */}
      <LandingFooter />
    </div>
  );
}

/* =========================================================================
   ABOUT CONTENT
   ========================================================================= */
function AboutContent({ onCopyEmail, copiedEmail }: { onCopyEmail: () => void; copiedEmail: boolean }) {
  return (
    <article className="space-y-10 text-[#3C3A35] leading-relaxed">
      {/* Narrative Section 1 */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-[#141413] tracking-tight">
          The Problem with the Modern Social Feed
        </h2>
        <p className="text-base font-light text-[#4A4842] leading-relaxed">
          Modern social platforms were promised as places of human connection. Over the last decade, however, they evolved into algorithmic stages designed for perpetual performance. Outrage is optimized for distribution; video feeds demand high-gloss production values; and vanity follower counts dictate whose voice deserves to be heard.
        </p>
        <p className="text-base font-light text-[#4A4842] leading-relaxed">
          In the process, the simple, honest thoughts of everyday people became drowned out. We stopped listening to understand, and started scrolling to react.
        </p>
      </section>

      {/* The Core Concept Callout */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#F4F2EB] border border-[#E4E0D5] space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#7A7870]">
          <Mic size={14} className="text-[#191918]" />
          <span>How Scruttin Works</span>
        </div>
        <h3 className="font-serif text-xl sm:text-2xl text-[#191918]">
          No Production Crews. Real People Recording Themselves.
        </h3>
        <p className="text-sm sm:text-base text-[#52504A] font-light leading-relaxed">
          We do not deploy film crews onto city sidewalks to interview pedestrians. Instead, <strong>Scruttin is open to everyone</strong>. Anyone can create an account, browse community questions, and record an unedited voice dispatch or candid written reflection directly from their phone or computer.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-white/80 border border-[#E2DFD6] space-y-1">
            <span className="text-xs font-mono font-semibold text-[#191918] uppercase">1. One Question</span>
            <p className="text-xs text-[#636159]">
              Timeless, evocative prompts that look past surface small talk into real lived experiences.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/80 border border-[#E2DFD6] space-y-1">
            <span className="text-xs font-mono font-semibold text-[#191918] uppercase">2. Spoken Dispatches</span>
            <p className="text-xs text-[#636159]">
              Real members speaking from Tokyo to Lagos, sharing raw voice notes without cosmetic filters.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/80 border border-[#E2DFD6] space-y-1">
            <span className="text-xs font-mono font-semibold text-[#191918] uppercase">3. Once-in-a-Lifetime</span>
            <p className="text-xs text-[#636159]">
              In the Stream, ruts are broadcast in the moment. When they pass, you listen with full presence.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: The Philosophy */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-[#141413] tracking-tight">
          The Once-in-a-Lifetime Listening Experience
        </h2>
        <p className="text-base font-light text-[#4A4842] leading-relaxed">
          When you walk down a street and hear someone speak, you cannot rewind their voice or save it into an archive folder. You either listen with full attention right then, or the moment is gone.
        </p>
        <p className="text-base font-light text-[#4A4842] leading-relaxed">
          Scruttin adopts this exact philosophy. Ruts are experienced live in the Stream. There are no like counts, no viral retweet graphs, and no endless replay loops. By removing the hoarding mindset, listening becomes a mindful, grounding habit.
        </p>
      </section>

      {/* Section 4: Global Voices */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-[#141413] tracking-tight">
          Connecting Cultures Without The Filter
        </h2>
        <p className="text-base font-light text-[#4A4842] leading-relaxed">
          Whether you are in Accra, Paris, Kyoto, Bogota, or Chicago, hearing someone's natural cadence and ambient background noise—the morning rain, the train announcement, the evening crickets—anchors you in their reality.
        </p>
        <p className="text-base font-light text-[#4A4842] leading-relaxed">
          We believe there is immense beauty in the ordinary thoughts of human beings. That is what Scruttin protects.
        </p>
      </section>
    </article>
  );
}

/* =========================================================================
   CONTENT GUIDELINES CONTENT
   ========================================================================= */
function GuidelinesContent() {
  return (
    <article className="space-y-8 text-[#3C3A35] leading-relaxed">
      <div className="p-4 sm:p-5 rounded-xl bg-[#FAF6ED] border border-[#E6E0D2] flex items-start gap-3">
        <BookOpen size={18} className="text-[#191918] shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm text-[#52504A]">
          Scruttin is a shared sanctuary. Because members record and publish their own audio and text ruts directly, every participant shares responsibility for keeping our broadcast clean, honest, and respectful.
        </p>
      </div>

      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-white border border-[#E2DFD6] space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#191918] text-white flex items-center justify-center text-xs font-mono font-bold">
              1
            </span>
            <h3 className="font-serif text-xl text-[#191918]">Speak For Yourself</h3>
          </div>
          <p className="text-sm font-light text-[#52504A] leading-relaxed pl-8">
            Record your own voice and articulate your own genuine thoughts. You may not upload clandestine recordings of other people, secretly wiretapped conversations, or recordings made without the speaker's express knowledge and consent.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E2DFD6] space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#191918] text-white flex items-center justify-center text-xs font-mono font-bold">
              2
            </span>
            <h3 className="font-serif text-xl text-[#191918]">Strict Ban on AI & Synthetic Slop</h3>
          </div>
          <p className="text-sm font-light text-[#52504A] leading-relaxed pl-8">
            Every rut must be recorded or penned by a living human being. AI voice clones, text-to-speech generators, synthetic bot uploads, and ChatGPT-generated ruts are strictly forbidden. Accounts posting synthetic speech are banned permanently.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E2DFD6] space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#191918] text-white flex items-center justify-center text-xs font-mono font-bold">
              3
            </span>
            <h3 className="font-serif text-xl text-[#191918]">Civility & Zero Tolerance for Hate Speech</h3>
          </div>
          <p className="text-sm font-light text-[#52504A] leading-relaxed pl-8">
            Honesty does not mean cruelty. We enforce an absolute zero-tolerance policy against hate speech, incitement of violence, racial slurs, misogyny, homophobia, religious bigotry, harassment, and personal attacks. Such content is purged immediately.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E2DFD6] space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#191918] text-white flex items-center justify-center text-xs font-mono font-bold">
              4
            </span>
            <h3 className="font-serif text-xl text-[#191918]">Privacy & Doxxing Protections</h3>
          </div>
          <p className="text-sm font-light text-[#52504A] leading-relaxed pl-8">
            Never broadcast private personal information—including phone numbers, physical residential addresses, private license plates, or employer details—belonging to yourself or others. Protect individual anonymity.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E2DFD6] space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#191918] text-white flex items-center justify-center text-xs font-mono font-bold">
              5
            </span>
            <h3 className="font-serif text-xl text-[#191918]">Commercial Spam & Self-Promotion</h3>
          </div>
          <p className="text-sm font-light text-[#52504A] leading-relaxed pl-8">
            Ruts are not advertising slots. Do not record audio advertisements, affiliate marketing pitches, cryptocurrency shills, or promotional solicitations. Authentic portfolio or tipping links are reserved strictly for creator profile pages.
          </p>
        </div>
      </div>

      <div className="p-5 rounded-xl bg-[#FAF9F5] border border-[#EAE7DF] text-xs text-[#7A7870] space-y-1">
        <span className="font-semibold text-[#191918] block">Reporting Violations</span>
        <p>
          If you encounter a rut that violates these standards, report it directly within the player or email{' '}
          <a href="mailto:founder@scruttin.com" className="text-[#191918] underline font-medium">
            founder@scruttin.com
          </a>{' '}
          with details. Our moderation team reviews reports promptly.
        </p>
      </div>
    </article>
  );
}

/* =========================================================================
   TERMS OF SERVICE CONTENT
   ========================================================================= */
function TermsContent() {
  return (
    <article className="space-y-8 text-[#3C3A35] leading-relaxed text-sm">
      <div className="space-y-3">
        <h2 className="font-serif text-2xl text-[#141413] tracking-tight">1. Agreement to Terms</h2>
        <p className="font-light text-[#4A4842] leading-relaxed">
          These Terms of Service ("Terms") govern your access to and use of the website, mobile services, and applications provided by Scruttin ("Scruttin", "we", "us", or "our"). By visiting our site, creating an account, or listening to or submitting any voice or written content, you agree to be bound by these Terms.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="font-serif text-2xl text-[#141413] tracking-tight">2. Eligibility & Accounts</h2>
        <p className="font-light text-[#4A4842] leading-relaxed">
          You must be at least 13 years old (or the applicable minimum legal age in your jurisdiction) to use Scruttin. When creating an account, you must provide accurate information and keep your credentials secure. You are solely responsible for all activity under your account.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="font-serif text-2xl text-[#141413] tracking-tight">3. User Submissions & Intellectual Property</h2>
        <p className="font-light text-[#4A4842] leading-relaxed">
          <strong>You retain ownership of your content.</strong> When you record an audio rut or publish a written submission, you retain all underlying copyright and intellectual property rights.
        </p>
        <p className="font-light text-[#4A4842] leading-relaxed">
          By publishing content on Scruttin, you grant Scruttin a worldwide, non-exclusive, royalty-free license to host, stream, display, store, distribute, and broadcast that content within our platform services. You represent and warrant that you possess all necessary rights to grant this license and that your recording does not infringe on third-party privacy or copyright.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="font-serif text-2xl text-[#141413] tracking-tight">4. Prohibited Conduct</h2>
        <p className="font-light text-[#4A4842] leading-relaxed">
          You agree not to:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 font-light text-[#4A4842]">
          <li>Upload non-consensual recordings of third parties without explicit authorization.</li>
          <li>Deploy automated scripts, bots, spiders, or scrapers to extract audio or metadata.</li>
          <li>Submit artificial intelligence-generated voices, text synthesizers, or fraudulent impersonations.</li>
          <li>Engage in harassment, hate speech, defamation, or threats of physical violence.</li>
          <li>Attempt to circumvent platform limits, security mechanisms, or authentication flows.</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="font-serif text-2xl text-[#141413] tracking-tight">5. Peer Tipping & External Portfolios</h2>
        <p className="font-light text-[#4A4842] leading-relaxed">
          Scruttin may allow verified creators to link their personal BuyMeACoffee, Ko-fi, or external portfolio handles on their user profile. Any financial transactions between community members occur strictly on external platforms; Scruttin takes zero transaction cut and assumes no liability for external payments.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="font-serif text-2xl text-[#141413] tracking-tight">6. The Ephemeral Stream Experience</h2>
        <p className="font-light text-[#4A4842] leading-relaxed">
          Scruttin operates on an in-the-moment listening philosophy. While content is stored securely in our databases, Scruttin does not guarantee permanent archival or perpetual accessibility of all broadcast ruts.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="font-serif text-2xl text-[#141413] tracking-tight">7. Termination & Disclaimers</h2>
        <p className="font-light text-[#4A4842] leading-relaxed">
          We reserve the right to suspend or terminate accounts that repeatedly violate our Content Guidelines. The platform is provided "as is" without warranty of any kind. Opinions expressed in ruts belong solely to the individual speaker.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="font-serif text-2xl text-[#141413] tracking-tight">8. Inquiries</h2>
        <p className="font-light text-[#4A4842] leading-relaxed">
          For legal inquiries regarding these Terms, contact{' '}
          <a href="mailto:founder@scruttin.com" className="text-[#191918] underline font-medium">
            founder@scruttin.com
          </a>.
        </p>
      </div>
    </article>
  );
}

/* =========================================================================
   PRIVACY POLICY CONTENT
   ========================================================================= */
function PrivacyContent() {
  return (
    <article className="space-y-8 text-[#3C3A35] leading-relaxed text-sm">
      <div className="space-y-3">
        <h2 className="font-serif text-2xl text-[#141413] tracking-tight">1. Our Privacy Philosophy</h2>
        <p className="font-light text-[#4A4842] leading-relaxed">
          At Scruttin, we believe vulnerability and authentic human conversation require respect for privacy. We do not sell your personal information, monetize your voice recordings to train third-party AI models, or track your browsing activity across other websites with advertising trackers.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="font-serif text-2xl text-[#141413] tracking-tight">2. Information We Collect</h2>
        <div className="space-y-2 pl-4 border-l-2 border-[#E2DFD6]">
          <h4 className="font-medium text-[#191918]">A. Account Information</h4>
          <p className="font-light text-[#4A4842]">
            When you sign up via Google or email, we collect your email address, display name, handle, and avatar URL to identify your profile.
          </p>

          <h4 className="font-medium text-[#191918] pt-2">B. Content You Author</h4>
          <p className="font-light text-[#4A4842]">
            When you submit a rut, we store the audio recording or text response, your designated location tag (e.g. city or country), and timestamp.
          </p>

          <h4 className="font-medium text-[#191918] pt-2">C. Technical & Playback Preferences</h4>
          <p className="font-light text-[#4A4842]">
            We store client-side preferences (such as ambient noise choices like rain or thunder, typography scale, and audio volume) to deliver a seamless listening experience.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-serif text-2xl text-[#141413] tracking-tight">3. Microphone Permissions</h2>
        <p className="font-light text-[#4A4842] leading-relaxed">
          Scruttin requests microphone access <strong>only when you explicitly trigger audio recording</strong> in your browser. We never access, sample, or listen to your microphone in the background. You can revoke microphone access at any time through your browser settings.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="font-serif text-2xl text-[#141413] tracking-tight">4. How We Use Information</h2>
        <ul className="list-disc pl-5 space-y-1.5 font-light text-[#4A4842]">
          <li>To stream your voice dispatches to fellow listeners worldwide.</li>
          <li>To display your author profile, country flag, and bio information.</li>
          <li>To maintain platform security, filter abusive bots, and enforce civility guidelines.</li>
          <li>To provide customer support when you reach out to our team.</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="font-serif text-2xl text-[#141413] tracking-tight">5. Data Retention & Your Rights</h2>
        <p className="font-light text-[#4A4842] leading-relaxed">
          You retain full control over your personal data. You have the right to access, rectify, or permanently delete your account and all associated voice dispatches at any time.
        </p>
        <p className="font-light text-[#4A4842] leading-relaxed">
          To request complete account and data removal, email our founder at{' '}
          <a href="mailto:founder@scruttin.com" className="text-[#191918] underline font-medium">
            founder@scruttin.com
          </a>. Requests are processed within 48 business hours.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="font-serif text-2xl text-[#141413] tracking-tight">6. Third-Party Service Providers</h2>
        <p className="font-light text-[#4A4842] leading-relaxed">
          We use reputable, enterprise-grade cloud providers for authentication and database infrastructure (Firebase / Google Cloud). These service providers process data under strict data protection agreements and cannot use your data for independent purposes.
        </p>
      </div>
    </article>
  );
}
