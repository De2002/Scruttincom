/**
 * useAdSession — manages ad frequency controls, decides when to show sponsored/ambient ads,
 * and tracks impressions. All thresholds come from the active campaign config.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { fetchFirestoreActiveAdCampaigns, recordFirestoreAdEvent } from '@/lib/firestoreService';

export interface AdCampaign {
  id: string;
  advertiser_name: string;
  advertiser_logo_url?: string;
  format: 'ambient' | 'sponsored_scrut';
  status: string;
  headline?: string;
  body?: string;
  destination_url?: string;
  target_topics?: string[];
  target_country?: string;
  ambient_placement: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  ambient_fade_in_sec: number;
  ambient_visible_sec: number;
  ambient_fade_out_sec: number;
  min_scruts_between_ads: number;
  min_minutes_between_ads: number;
  max_sponsored_per_session: number;
  max_ambient_per_session: number;
}

interface SessionState {
  scrutsSinceLastAd: number;
  lastAdTimestamp: number | null;
  sponsoredShownCount: number;
  ambientShownCount: number;
}

const SESSION_ID = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function useAdSession(currentTopic?: string) {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [activeSponsoredCampaign, setActiveSponsoredCampaign] = useState<AdCampaign | null>(null);
  const [activeAmbientCampaign, setActiveAmbientCampaign] = useState<AdCampaign | null>(null);
  const session = useRef<SessionState>({
    scrutsSinceLastAd: 0,
    lastAdTimestamp: null,
    sponsoredShownCount: 0,
    ambientShownCount: 0,
  });

  // Load active campaigns once
  useEffect(() => {
    fetchFirestoreActiveAdCampaigns().then((data) => {
      if (data) setCampaigns(data as AdCampaign[]);
    });
  }, []);

  // Select ambient campaign based on topic match
  useEffect(() => {
    if (!campaigns.length) return;
    const ambient = campaigns.filter(c => c.format === 'ambient');
    if (!ambient.length) return;
    const topicMatch = ambient.find(c =>
      c.target_topics?.some(t => t.toLowerCase() === currentTopic?.toLowerCase())
    );
    setActiveAmbientCampaign(topicMatch ?? ambient[0]);
  }, [campaigns, currentTopic]);

  /** Call every time a scrut is viewed. Returns the campaign to inject if frequency allows. */
  const onScrutViewed = useCallback((): AdCampaign | null => {
    session.current.scrutsSinceLastAd += 1;

    const sponsored = campaigns.filter(c => c.format === 'sponsored_scrut');
    if (!sponsored.length) return null;

    const topicMatch = sponsored.find(c =>
      c.target_topics?.some(t => t.toLowerCase() === currentTopic?.toLowerCase())
    );
    const campaign = topicMatch ?? sponsored[0];
    const s = session.current;

    const minutesSinceLast = s.lastAdTimestamp
      ? (Date.now() - s.lastAdTimestamp) / 60000
      : Infinity;

    const canShow =
      s.scrutsSinceLastAd >= campaign.min_scruts_between_ads &&
      minutesSinceLast >= campaign.min_minutes_between_ads &&
      s.sponsoredShownCount < campaign.max_sponsored_per_session;

    if (canShow) {
      session.current.scrutsSinceLastAd = 0;
      session.current.lastAdTimestamp = Date.now();
      session.current.sponsoredShownCount += 1;
      return campaign;
    }

    return null;
  }, [campaigns, currentTopic]);

  /** Record an ad event */
  const trackEvent = useCallback(async (
    campaignId: string,
    eventType: string,
    valueNum?: number,
    metadata?: Record<string, unknown>
  ) => {
    await recordFirestoreAdEvent(campaignId, SESSION_ID, eventType, valueNum, metadata);
  }, []);

  return {
    activeAmbientCampaign,
    activeSponsoredCampaign,
    onScrutViewed,
    trackEvent,
  };
}
