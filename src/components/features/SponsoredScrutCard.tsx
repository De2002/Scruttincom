/**
 * SponsoredScrutCard — a full-screen sponsored stream item.
 * Clearly labeled "Sponsored". Never disguises itself as user content.
 * Supports text, image, question, and statement formats.
 */
import { useEffect, useRef, useState } from 'react';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import ResonatesButton from './ResonatesButton';
import ComposeModal from './ComposeModal';
import type { AdCampaign } from '@/hooks/useAdSession';

interface Props {
  campaign: AdCampaign;
  onViewDuration?: (seconds: number) => void;
  onSwipeAway?: () => void;
  onCTAClick?: () => void;
  onResonate?: () => void;
  onResponseStarted?: () => void;
}

export default function SponsoredScrutCard({
  campaign,
  onViewDuration,
  onSwipeAway,
  onCTAClick,
  onResonate,
  onResponseStarted,
}: Props) {
  const startedAt = useRef(Date.now());
  const [composeOpen, setComposeOpen] = useState(false);

  useEffect(() => {
    return () => {
      // Report view duration when the card leaves the DOM
      const sec = (Date.now() - startedAt.current) / 1000;
      onViewDuration?.(sec);
      onSwipeAway?.();
    };
  }, []);

  // Build a fake ConversationStarter to pass to ComposeModal context
  const fakeConversation = campaign.headline
    ? {
        id: `sponsored-${campaign.id}`,
        user_id: 'scruttin',
        user: {
          id: 'scruttin',
          display_name: campaign.advertiser_name,
          avatar_url: campaign.advertiser_logo_url ?? '',
          country: '',
        },
        type: 'question' as const,
        body: campaign.headline,
        topic: 'Sponsored',
        created_at: new Date().toISOString(),
        scrut_count: 0,
        country_count: 0,
        is_platform: true,
        circulation_score: 0,
      }
    : null;

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Sponsored badge — always visible, always first */}
      <div className="flex items-center gap-1.5 mb-5">
        {campaign.advertiser_logo_url && (
          <img
            src={campaign.advertiser_logo_url}
            alt={campaign.advertiser_name}
            className="h-4 max-w-[60px] object-contain opacity-60"
          />
        )}
        <span className="text-[9px] uppercase tracking-[0.18em] font-bold text-white/30">
          Sponsored by {campaign.advertiser_name}
        </span>
      </div>

      {/* Content */}
      {campaign.headline && (
        <p className="font-serif text-white/90 text-[20px] leading-[1.55] mb-4">
          "{campaign.headline}"
        </p>
      )}
      {campaign.body && campaign.body !== `Sponsored by ${campaign.advertiser_name}` && (
        <p className="text-white/50 text-[13px] leading-relaxed mb-5 font-serif italic">
          {campaign.body}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 mt-4">
        {/* Resonate */}
        <ResonatesButton
          scrutId={`sponsored-${campaign.id}`}
          initialCount={0}
          initialResonated={false}
          className="opacity-60 hover:opacity-100"
        />

        <div className="flex-1" />

        {/* Respond */}
        {fakeConversation && (
          <button
            onClick={() => {
              onResponseStarted?.();
              setComposeOpen(true);
            }}
            onMouseDown={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
            className="flex items-center gap-1.5 text-white/40 hover:text-white/80 text-[11px] font-medium transition-colors px-3 py-1.5 rounded-full border border-white/10 hover:border-white/25"
          >
            Give your take
            <ArrowRight size={11} />
          </button>
        )}

        {/* CTA */}
        {campaign.destination_url && (
          <button
            onClick={() => {
              onCTAClick?.();
              window.open(campaign.destination_url!, '_blank', 'noopener');
            }}
            onMouseDown={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
            className="p-1.5 text-white/30 hover:text-white/70 transition-colors"
            aria-label="Visit sponsor"
          >
            <ExternalLink size={13} />
          </button>
        )}
      </div>

      {/* Subtle divider clarifying this is not user content */}
      <div className="mt-6 flex items-center gap-2">
        <div className="flex-1 h-px bg-white/6" />
        <span className="text-white/15 text-[9px] uppercase tracking-widest">Sponsored content</span>
        <div className="flex-1 h-px bg-white/6" />
      </div>

      {composeOpen && fakeConversation && (
        <ComposeModal
          onClose={() => setComposeOpen(false)}
          defaultMode="question"
          contextConversation={fakeConversation}
          onPosted={() => {
            // sponsored_response_completed tracked in parent
          }}
        />
      )}
    </div>
  );
}
