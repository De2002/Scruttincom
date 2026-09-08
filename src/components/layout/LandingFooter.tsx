import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ExternalLink, Check, Copy, Twitter, Music } from 'lucide-react';
import { toast } from 'sonner';

export default function LandingFooter() {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText('founder@scruttin.com');
      setCopiedEmail(true);
      toast.success('Email copied to clipboard (founder@scruttin.com)');
      setTimeout(() => setCopiedEmail(false), 2500);
    } catch {
      window.location.href = 'mailto:founder@scruttin.com';
    }
  };

  return (
    <footer className="border-t border-[#EAE7DF] bg-[#FAF9F5] text-[#191918] transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 pb-8 sm:pb-10 border-b border-[#EAE7DF]">
          {/* Brand & Mission */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <Link to="/" className="w-7 h-7 rounded-md bg-[#191918] text-[#FAF9F5] flex items-center justify-center font-serif font-bold text-xs shadow-sm hover:opacity-90 transition-opacity">
                S
              </Link>
              <Link to="/" className="font-serif font-semibold text-base tracking-tight text-[#191918] hover:opacity-90 transition-opacity">
                Scruttin
              </Link>
              <span className="text-[10px] font-mono tracking-wider uppercase text-[#7A7870] px-2 py-0.5 rounded bg-[#EFECE4]">
                Voices Worldwide
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#636159] font-light leading-relaxed max-w-sm">
              A quiet sanctuary for authentic speech. People sign up, pick timeless questions, and record their own honest audio dispatches from wherever they are. Less showing. More saying.
            </p>

            {/* Direct Founder Email Link & Copy Action */}
            <div className="pt-1 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[#7A7870] font-mono">Founder:</span>
              <a
                href="mailto:founder@scruttin.com"
                id="footer-email-link"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-[#191918] hover:text-black underline underline-offset-4 decoration-[#D0CDC4] hover:decoration-[#191918] transition-all"
              >
                <Mail size={12} className="text-[#7A7870]" />
                <span>founder@scruttin.com</span>
              </a>
              <button
                type="button"
                id="footer-copy-email-btn"
                onClick={handleCopyEmail}
                title="Copy email to clipboard"
                className="p-1 rounded text-[#7A7870] hover:text-[#191918] hover:bg-[#EFECE4] transition-colors"
                aria-label="Copy founder email"
              >
                {copiedEmail ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              </button>
            </div>
          </div>

          {/* Full Page Navigation Links */}
          <div className="md:col-span-4 grid grid-cols-2 gap-6 sm:gap-8">
            <div>
              <h3 className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#7A7870] mb-3">
                Company
              </h3>
              <ul className="space-y-2.5 text-xs text-[#52504A]">
                <li>
                  <Link
                    to="/about"
                    id="footer-link-about"
                    className="hover:text-[#191918] hover:underline underline-offset-4 transition-colors block"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    to="/content-guidelines"
                    id="footer-link-guidelines"
                    className="hover:text-[#191918] hover:underline underline-offset-4 transition-colors block"
                  >
                    Content Guidelines
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#7A7870] mb-3">
                Legal
              </h3>
              <ul className="space-y-2.5 text-xs text-[#52504A]">
                <li>
                  <Link
                    to="/terms"
                    id="footer-link-terms"
                    className="hover:text-[#191918] hover:underline underline-offset-4 transition-colors block"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    id="footer-link-privacy"
                    className="hover:text-[#191918] hover:underline underline-offset-4 transition-colors block"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Social Media Channels */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#7A7870] mb-3">
              Connect
            </h3>
            <div className="flex flex-col gap-2">
              {/* TikTok Handle */}
              <a
                href="https://www.tiktok.com/@scruttin"
                target="_blank"
                rel="noopener noreferrer"
                id="footer-tiktok-link"
                className="inline-flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-[#E2DFD6] hover:border-[#191918] text-xs text-[#383733] hover:text-[#191918] transition-all group shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
              >
                <span className="flex items-center gap-2 font-medium">
                  <Music size={13} className="text-[#7A7870] group-hover:text-[#191918] transition-colors" />
                  <span>TikTok</span>
                </span>
                <span className="flex items-center gap-1 font-mono text-[11px] text-[#7A7870] group-hover:text-[#191918]">
                  <span>@scruttin</span>
                  <ExternalLink size={10} className="opacity-60 group-hover:opacity-100" />
                </span>
              </a>

              {/* X Handle */}
              <a
                href="https://x.com/scruttin"
                target="_blank"
                rel="noopener noreferrer"
                id="footer-x-link"
                className="inline-flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-[#E2DFD6] hover:border-[#191918] text-xs text-[#383733] hover:text-[#191918] transition-all group shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
              >
                <span className="flex items-center gap-2 font-medium">
                  <Twitter size={13} className="text-[#7A7870] group-hover:text-[#191918] transition-colors" />
                  <span>X</span>
                </span>
                <span className="flex items-center gap-1 font-mono text-[11px] text-[#7A7870] group-hover:text-[#191918]">
                  <span>@scruttin</span>
                  <ExternalLink size={10} className="opacity-60 group-hover:opacity-100" />
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#7A7870] font-mono">
          <div className="flex items-center gap-2 flex-wrap text-center sm:text-left">
            <span>&copy; {new Date().getFullYear()} Scruttin.</span>
            <span className="hidden sm:inline">&middot;</span>
            <span>Authentic, self-recorded perspectives worldwide.</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-[#52504A]">Once-in-a-lifetime listening</span>
            <span className="text-[#7A7870]">&middot;</span>
            <span className="text-emerald-700">Live worldwide</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
