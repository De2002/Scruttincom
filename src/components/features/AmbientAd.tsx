/**
 * AmbientAd — subtle sponsorship watermark placed in the background environment layer.
 * Operates independently from scrut content: fades in, stays visible, fades out.
 * Never overlaps core navigation, controls, or scrut text.
 */
import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { AdCampaign } from '@/hooks/useAdSession';

interface Props {
  campaign: AdCampaign;
  onImpression?: (durationSec: number) => void;
  onClickThrough?: () => void;
}

type Phase = 'hidden' | 'fading-in' | 'visible' | 'fading-out';

export default function AmbientAd({ campaign, onImpression, onClickThrough }: Props) {
  const [phase, setPhase] = useState<Phase>('hidden');
  const visibleSince = useRef<number | null>(null);

  useEffect(() => {
    // Start fade-in after a short delay so scrut content loads first
    const startTimer = setTimeout(() => {
      setPhase('fading-in');
      setTimeout(() => {
        setPhase('visible');
        visibleSince.current = Date.now();
        onImpression?.(0); // impression event at visible start

        // Fade out after configured duration
        setTimeout(() => {
          setPhase('fading-out');
          setTimeout(() => {
            setPhase('hidden');
            if (visibleSince.current) {
              const duration = (Date.now() - visibleSince.current) / 1000;
              onImpression?.(duration);
            }
          }, (campaign.ambient_fade_out_sec ?? 2) * 1000);
        }, (campaign.ambient_visible_sec ?? 7) * 1000);
      }, (campaign.ambient_fade_in_sec ?? 3) * 1000);
    }, 800);

    return () => clearTimeout(startTimer);
  }, [campaign]);

  if (phase === 'hidden') return null;

  const placementClass: Record<string, string> = {
    'top-left': 'top-20 left-4',
    'top-right': 'top-20 right-4',
    'bottom-left': 'bottom-32 left-4',
    'bottom-right': 'bottom-32 right-4',
  };

  const pos = placementClass[campaign.ambient_placement ?? 'bottom-right'];

  return (
    <div
      className={cn(
        'absolute z-20 pointer-events-auto select-none',
        pos,
        'transition-all duration-1000',
        phase === 'fading-in' && 'opacity-0',
        phase === 'visible' && 'opacity-100',
        phase === 'fading-out' && 'opacity-0',
      )}
      style={{
        transitionDuration:
          phase === 'fading-in'
            ? `${(campaign.ambient_fade_in_sec ?? 3) * 1000}ms`
            : `${(campaign.ambient_fade_out_sec ?? 2) * 1000}ms`,
      }}
    >
      <button
        onClick={() => {
          if (campaign.destination_url) {
            onClickThrough?.();
            window.open(campaign.destination_url, '_blank', 'noopener');
          }
        }}
        className="group flex flex-col items-end gap-0.5 cursor-pointer"
        aria-label={`Sponsored: ${campaign.advertiser_name}`}
      >
        {campaign.advertiser_logo_url && (
          <img
            src={campaign.advertiser_logo_url}
            alt={campaign.advertiser_name}
            className="h-5 max-w-[80px] object-contain opacity-50 group-hover:opacity-70 transition-opacity"
          />
        )}
        <p className="text-white/55 font-semibold text-[11px] tracking-tight group-hover:text-white/80 transition-colors">
          {campaign.advertiser_name}
        </p>
        {campaign.headline && (
          <p className="text-white/30 text-[10px] max-w-[120px] text-right leading-snug group-hover:text-white/50 transition-colors">
            {campaign.headline}
          </p>
        )}
        <p className="text-white/20 text-[8px] uppercase tracking-[0.14em] font-medium mt-0.5">
          Sponsored
        </p>
      </button>
    </div>
  );
}
