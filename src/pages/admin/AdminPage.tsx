
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, FileText, Music, Film, Flag, Plus, Trash2, 
  Upload, Loader2, CheckCircle, XCircle,
  ArrowLeft, BarChart3, Megaphone, Eye, MousePointer, Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  fetchD1AdminStats,
  fetchD1AdminReports,
  actionD1AdminReport,
  fetchD1AdminUsers,
  toggleD1AdminRole,
  fetchD1AdminCampaigns,
  createD1AdminCampaign,
  updateD1AdminCampaignStatus,
  fetchD1MusicTracks,
  createD1MusicTrack,
  deleteD1MusicTrack,
  fetchD1AtmosphereClips,
  createD1Atmosphere,
  deleteD1Atmosphere,
  fetchD1Topics,
  createD1Topic,
  deleteD1Topic,
  fetchD1TypingSounds,
  createD1TypingSound,
  deleteD1TypingSound,
  uploadD1Media
} from '@/lib/d1Service';

type Tab = 'overview' | 'reports' | 'music' | 'atmosphere' | 'typing' | 'topics' | 'users' | 'ads';

interface Report {
  id: string;
  scrut_id: string;
  reason: string;
  reviewed: boolean;
  actioned: boolean;
  created_at: string;
  reporter?: { display_name: string };
  scrut?: { text: string | null; type: string };
}

interface MusicTrack {
  id: string;
  title: string;
  artist?: string;
  url: string;
  created_at: string;
}

interface AtmosphereClip {
  id: string;
  label: string;
  emoji: string;
  video_url: string;
  overlay_color: string;
  overlay_opacity: number;
  accent_color: string;
  created_at: string;
}

interface Topic {
  id: string;
  label: string;
  color: string;
  sort_order: number;
}

interface AdCampaign {
  id: string;
  advertiser_name: string;
  advertiser_logo_url: string | null;
  format: 'ambient' | 'sponsored_scrut';
  status: string;
  headline?: string | null;
  body?: string | null;
  destination_url?: string | null;
  target_topics?: string[];
  start_at?: string | null;
  end_at?: string | null;
  created_at: string;
  min_scruts_between_ads: number;
}

interface AdStats {
  impressions: number;
  clicks: number;
  resonates: number;
  responses: number;
  avg_view_sec: number;
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');

  useEffect(() => {
    if (!loading && (!user || !user.is_admin)) navigate('/', { replace: true });
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a12]">
        <Loader2 size={24} className="text-white/30 animate-spin" />
      </div>
    );
  }
  if (!user?.is_admin) return null;

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-white/6 px-5 py-4 flex items-center gap-3"
        style={{ background: 'rgba(10,10,18,0.95)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => navigate('/stream')} className="text-white/40 hover:text-white p-1 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <svg width="16" height="11" viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="text-white/60">
            <path d="M1 3 Q4 1 7 3 Q10 5 13 3 Q16 1 19 3 Q21 4 23 3" />
            <path d="M1 8 Q4 6 7 8 Q10 10 13 8 Q16 6 19 8 Q21 9 23 8" />
            <path d="M1 13 Q4 11 7 13 Q10 15 13 13 Q16 11 19 13 Q21 14 23 13" />
          </svg>
          <span className="font-bold text-[15px] tracking-tight">Admin</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto border-b border-white/6">
        <div className="flex px-5 gap-1 min-w-max py-2">
          {([
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'ads', label: 'Ads', icon: Megaphone },
            { id: 'reports', label: 'Reports', icon: Flag },
            { id: 'music', label: 'Music', icon: Music },
            { id: 'atmosphere', label: 'Atmospheres', icon: Film },
            { id: 'typing', label: 'Typing Sound', icon: Music },
            { id: 'topics', label: 'Topics', icon: FileText },
            { id: 'users', label: 'Users', icon: Users },
          ] as { id: Tab; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }[]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                tab === t.id ? 'bg-white/12 text-white' : 'text-white/40 hover:text-white/70')}>
              <t.icon size={13} strokeWidth={1.6} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6">
        {tab === 'overview' && <OverviewTab />}
        {tab === 'ads' && <AdsTab />}
        {tab === 'reports' && <ReportsTab />}
        {tab === 'music' && <MusicTab />}
        {tab === 'atmosphere' && <AtmosphereTab />}
        {tab === 'typing' && <TypingSoundsTab />}
        {tab === 'topics' && <TopicsTab />}
        {tab === 'users' && <UsersTab />}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="rounded-2xl p-4 bg-white/4 border border-white/7">
      <p className="text-white/40 text-xs mb-2">{label}</p>
      <p className={cn('font-bold text-2xl', color ?? 'text-white')}>{value}</p>
    </div>
  );
}

function OverviewTab() {
  const [stats, setStats] = useState({ users: 0, scruts: 0, conversations: 0, reports: 0 });
  useEffect(() => {
    fetchD1AdminStats()
      .then((data) => setStats(data))
      .catch((err) => console.warn('Overview stats fetch warning:', err));
  }, []);
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard label="Total Users" value={stats.users} />
      <StatCard label="Total Ruts" value={stats.scruts} />
      <StatCard label="Conversations" value={stats.conversations} />
      <StatCard label="Pending Reports" value={stats.reports} color={stats.reports > 0 ? 'text-rose-400' : 'text-white'} />
    </div>
  );
}

function AdsTab() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adStats, setAdStats] = useState<Record<string, AdStats>>({});

  // Create form
  const [advertiserName, setAdvertiserName] = useState('');
  const [format, setFormat] = useState<'ambient' | 'sponsored_scrut'>('sponsored_scrut');
  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [targetTopics, setTargetTopics] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [minScruts, setMinScruts] = useState('5');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    try {
      const data = await fetchD1AdminCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.warn('Failed to load campaigns:', err);
    }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateD1AdminCampaignStatus(id, status);
      toast.success(`Campaign ${status}`);
      load();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const create = async () => {
    if (!advertiserName.trim() || !user) return;
    setUploading(true);

    let logoUrl = '';
    if (logoFile) {
      const uploaded = await uploadD1Media(logoFile);
      logoUrl = uploaded.url;
    }

    try {
      await createD1AdminCampaign({
        advertiser_name: advertiserName.trim(),
        advertiser_logo_url: logoUrl || null,
        format,
        headline: headline.trim() || null,
        body: body.trim() || null,
        destination_url: destinationUrl.trim() || null,
        target_topics: targetTopics ? targetTopics.split(',').map(t => t.trim()) : [],
        start_at: startAt || null,
        end_at: endAt || null,
        min_scruts_between_ads: Number(minScruts) || 5,
      });
      toast.success('Campaign created');
      setCreating(false);
      setAdvertiserName(''); setHeadline(''); setBody(''); setDestinationUrl('');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create campaign');
    } finally {
      setUploading(false);
    }
  };

  const INPUT = 'w-full bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.12)] rounded-xl px-3 py-2.5 text-white text-sm placeholder-[rgba(255,255,255,0.25)] focus:outline-none focus:border-[rgba(255,255,255,0.28)]';
  const STATUS_COLORS: Record<string, string> = { // Moved STATUS_COLORS here
    draft: 'text-white/40 border-white/15',
    active: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/8',
    paused: 'text-amber-400 border-amber-400/30 bg-amber-400/8',
    ended: 'text-white/25 border-white/10',
    scheduled: 'text-sky-400 border-sky-400/30 bg-sky-400/8',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-white font-semibold">Campaigns</p>
        <button onClick={() => setCreating(!creating)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-white/90 transition-colors">
          <Plus size={13} /> New campaign
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="rounded-2xl p-4 bg-white/4 border border-white/8 space-y-3">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">New Campaign</p>
          <input value={advertiserName} onChange={e => setAdvertiserName(e.target.value)} placeholder="Advertiser name *"
            className={INPUT} />
          <div className="flex gap-2">
            <button onClick={() => setFormat('sponsored_scrut')}
              className={cn('flex-1 py-2 rounded-xl border text-xs font-medium transition-all', format === 'sponsored_scrut' ? 'bg-white/12 border-white/25 text-white' : 'bg-white/4 border-white/8 text-white/40')}>
              Sponsored Rut
            </button>
            <button onClick={() => setFormat('ambient')}
              className={cn('flex-1 py-2 rounded-xl border text-xs font-medium transition-all', format === 'ambient' ? 'bg-white/12 border-white/25 text-white' : 'bg-white/4 border-white/8 text-white/40')}>
              Ambient Ad
            </button>
          </div>
          <input value={headline} onChange={e => setHeadline(e.target.value)} placeholder="Headline / question"
            className={INPUT} />
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Body text" rows={2}
            className={cn(INPUT, 'resize-none')} />
          <input value={destinationUrl} onChange={e => setDestinationUrl(e.target.value)} placeholder="Destination URL"
            className={INPUT} />
          <input value={targetTopics} onChange={e => setTargetTopics(e.target.value)} placeholder="Target topics (comma-separated)"
            className={INPUT} />
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-white/30 text-[10px] mb-1">Start date</p>
              <input type="date" value={startAt} onChange={e => setStartAt(e.target.value)}
                className={cn(INPUT, 'text-white')} style={{ colorScheme: 'dark' }} />
            </div>
            <div className="flex-1">
              <p className="text-white/30 text-[10px] mb-1">End date</p>
              <input type="date" value={endAt} onChange={e => setEndAt(e.target.value)}
                className={cn(INPUT, 'text-white')} style={{ colorScheme: 'dark' }} />
            </div>
          </div>
          <div>
            <p className="text-white/30 text-[10px] mb-1">Min ruts between ads</p>
            <input type="number" value={minScruts} onChange={e => setMinScruts(e.target.value)} min="1"
              className={cn(INPUT, 'w-24')} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer w-full px-3 py-2.5 rounded-xl border border-white/8 bg-white/4">
            <Upload size={13} className="text-white/40" />
            <span className="text-white/40 text-xs flex-1 truncate">{logoFile ? logoFile.name : 'Upload logo (optional)'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={e => setLogoFile(e.target.files?.[0] ?? null)} />
          </label>
          <button onClick={create} disabled={!advertiserName.trim() || uploading}
            className={cn('w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all',
              advertiserName.trim() && !uploading ? 'bg-white text-black' : 'bg-white/8 text-white/30 cursor-not-allowed')}>
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <><Plus size={15} /> Create campaign</>}
          </button>
        </div>
      )}

      {/* Campaign list */}
      {campaigns.map(c => {
        const stats = adStats[c.id];
        const isSelected = selectedId === c.id;
        return (
          <div key={c.id} className="rounded-2xl overflow-hidden border border-white/8 bg-white/3">
            <button onClick={() => setSelectedId(isSelected ? null : c.id)}
              className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/4 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn('text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded border', STATUS_COLORS[c.status] ?? 'text-white/30 border-white/10')}>
                    {c.status}
                  </span>
                  <span className="text-white/30 text-[9px] uppercase tracking-wide">{c.format === 'ambient' ? 'Ambient' : 'Sponsored'}</span>
                </div>
                <p className="text-white font-semibold text-sm truncate">{c.advertiser_name}</p>
                {c.headline && <p className="text-white/45 text-xs mt-0.5 line-clamp-1 font-serif">"{c.headline}"</p>}
              </div>
              {stats && (
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-1 text-white/30 text-[10px] justify-end">
                    <Eye size={9} />{stats.impressions}
                  </div>
                  <div className="flex items-center gap-1 text-white/30 text-[10px] justify-end mt-0.5">
                    <MousePointer size={9} />{stats.clicks}
                  </div>
                </div>
              )}
            </button>

            {isSelected && (
              <div className="px-4 pb-4 border-t border-white/6 pt-3 space-y-3">
                {/* Stats panel */}
                {stats && (
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Impressions', value: stats.impressions, icon: Eye },
                      { label: 'Clicks', value: stats.clicks, icon: MousePointer },
                      { label: 'Resonates', value: stats.resonates, icon: () => <span className="text-[10px]">❤</span> },
                      { label: 'Responses', value: stats.responses, icon: () => <span className="text-[10px]">💬</span> },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="rounded-xl p-2 bg-white/5 text-center">
                        <Icon size={11} className="text-white/30 mx-auto mb-1" />
                        <p className="text-white font-bold text-base leading-none">{value}</p>
                        <p className="text-white/25 text-[8px] mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                )}
                {stats && stats.avg_view_sec > 0 && (
                  <div className="flex items-center gap-1.5 text-white/30 text-[11px]">
                    <Clock size={11} />
                    Avg view: {stats.avg_view_sec.toFixed(1)}s
                  </div>
                )}

                {/* Status controls */}
                <div className="flex gap-2 flex-wrap">
                  {['active', 'paused', 'ended'].map(s => (
                    <button key={s} onClick={() => updateStatus(c.id, s)}
                      disabled={c.status === s}
                      className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                        c.status === s ? 'bg-white/12 border-white/20 text-white' : 'bg-white/4 border-white/8 text-white/40 hover:bg-white/10')}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {!campaigns.length && (
        <p className="text-white/25 text-sm text-center py-8">No campaigns yet. Create one above.</p>
      )}
    </div>
  );
}

function ReportsTab() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchD1AdminReports();
      setReports(data as Report[]);
    } catch {
      setReports([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const action = async (report: Report, hide: boolean) => {
    try {
      await actionD1AdminReport(report.id, hide, report.scrut_id);
      toast.success(hide ? 'Rut hidden sitewide' : 'Report dismissed');
      load();
    } catch {
      toast.error('Failed to update report');
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={20} className="text-white/30 animate-spin" /></div>;
  if (!reports.length) return (
    <div className="text-center py-16 text-white/30">
      <CheckCircle size={28} className="mx-auto mb-3 opacity-40" />
      <p>No reports yet</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {reports.map(r => (
        <div key={r.id} className={cn('rounded-2xl p-4 border', r.reviewed ? 'bg-white/2 border-white/5 opacity-50' : 'bg-white/5 border-white/10')}>
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-rose-400/80 text-xs font-medium mb-1">{r.reason}</p>
              <p className="text-white/60 text-sm line-clamp-2 font-serif">
                {r.scrut?.text ? `"${r.scrut.text}"` : `[${r.scrut?.type ?? 'voice'} rut]`}
              </p>
            </div>
            {r.actioned && <span className="shrink-0 text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full">Hidden</span>}
          </div>
          <p className="text-white/25 text-[10px] mb-3">
            Reported by {r.reporter?.display_name ?? 'unknown'} · {new Date(r.created_at).toLocaleDateString()}
          </p>
          {!r.reviewed && (
            <div className="flex gap-2">
              <button onClick={() => action(r, true)}
                className="flex-1 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium hover:bg-rose-500/25 transition-colors flex items-center justify-center gap-1.5">
                <XCircle size={12} /> Hide rut
              </button>
              <button onClick={() => action(r, false)}
                className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5">
                <CheckCircle size={12} /> Dismiss
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MusicTab() {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const load = async () => {
    try {
      const data = await fetchD1MusicTracks();
      setTracks(data as MusicTrack[]);
    } catch {
      setTracks([]);
    }
  };

  useEffect(() => { load(); }, []);

  const upload = async () => {
    if (!file || !title.trim() || !user) return;
    setUploading(true);
    try {
      const uploaded = await uploadD1Media(file);
      await createD1MusicTrack(title.trim(), artist.trim() || '', uploaded.url);
      toast.success('Track uploaded');
      setTitle(''); setArtist(''); setFile(null);
      load();
    } catch {
      toast.error('Failed to upload track');
    } finally {
      setUploading(false);
    }
  };

  const remove = async (track: MusicTrack) => {
    try {
      await deleteD1MusicTrack(track.id);
      toast.success('Track removed');
      load();
    } catch {
      toast.error('Failed to remove track');
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-4 bg-white/4 border border-white/8 space-y-3">
        <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">Upload Track</p>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Track title *"
          className="w-full bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.12)] rounded-xl px-3 py-2.5 text-white text-sm placeholder-[rgba(255,255,255,0.25)] focus:outline-none focus:border-[rgba(255,255,255,0.28)]" />
        <input value={artist} onChange={e => setArtist(e.target.value)} placeholder="Artist (optional)"
          className="w-full bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.12)] rounded-xl px-3 py-2.5 text-white text-sm placeholder-[rgba(255,255,255,0.25)] focus:outline-none focus:border-[rgba(255,255,255,0.28)]" />
        <label className="flex items-center gap-2 cursor-pointer">
          <div className="flex-1 bg-white/6 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/40 truncate">
            {file ? file.name : 'Choose audio file (MP3, M4A, OGG)'}
          </div>
          <input type="file" accept="audio/*" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          <Upload size={16} className="text-white/40 shrink-0" />
        </label>
        <button onClick={upload} disabled={!file || !title.trim() || uploading}
          className={cn('w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all',
            file && title.trim() && !uploading ? 'bg-white text-black' : 'bg-white/8 text-white/30 cursor-not-allowed')}>
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <><Plus size={15} /> Upload track</>}
        </button>
      </div>
      {tracks.map(t => (
        <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/7">
          <Music size={14} className="text-white/30 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{t.title}</p>
            {t.artist && <p className="text-white/40 text-xs">{t.artist}</p>}
          </div>
          <button onClick={() => remove(t)} className="p-1.5 text-white/20 hover:text-rose-400 transition-colors"><Trash2 size={14} /></button>
        </div>
      ))}
      {!tracks.length && <p className="text-white/25 text-sm text-center py-8">No tracks uploaded yet</p>}
    </div>
  );
}

function AtmosphereTab() {
  const { user } = useAuth();
  const [clips, setClips] = useState<AtmosphereClip[]>([]);
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('🎬');
  const [overlayColor, setOverlayColor] = useState('10, 10, 20');
  const [accentColor, setAccentColor] = useState('#ffffff');
  const [file, setFile] = useState<File | null>(null);

  const load = async () => {
    try {
      const data = await fetchD1AtmosphereClips();
      setClips(data as AtmosphereClip[]);
    } catch {
      setClips([]);
    }
  };

  useEffect(() => { load(); }, []);

  const upload = async () => {
    if (!file || !label.trim() || !user) return;
    setUploading(true);
    try {
      const uploaded = await uploadD1Media(file);
      await createD1Atmosphere({
        label: label.trim(),
        emoji,
        video_url: uploaded.url,
        overlay_color: overlayColor,
        overlay_opacity: 0.65,
        accent_color: accentColor,
      });
      toast.success('Atmosphere added');
      setLabel(''); setFile(null);
      load();
    } catch {
      toast.error('Failed to add atmosphere');
    } finally {
      setUploading(false);
    }
  };

  const remove = async (clip: AtmosphereClip) => {
    try {
      await deleteD1Atmosphere(clip.id);
      toast.success('Atmosphere removed');
      load();
    } catch {
      toast.error('Failed to remove atmosphere');
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-4 bg-white/4 border border-white/8 space-y-3">
        <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">Add Atmosphere</p>
        <div className="flex gap-2">
          <input value={emoji} onChange={e => setEmoji(e.target.value)} placeholder="Emoji"
            className="w-16 bg-white/6 border border-white/10 rounded-xl px-3 py-2.5 text-white text-lg text-center focus:outline-none focus:border-white/25" />
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label (e.g. Desert)"
            className="flex-1 bg-white/6 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/25 focus:outline-none focus:border-white/25" />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-white/30 text-[10px] uppercase tracking-widest block mb-1">Overlay RGB</label>
            <input value={overlayColor} onChange={e => setOverlayColor(e.target.value)} placeholder="10, 10, 20"
              className="w-full bg-white/6 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/25 focus:outline-none focus:border-white/25" />
          </div>
          <div>
            <label className="text-white/30 text-[10px] uppercase tracking-widest block mb-1">Accent</label>
            <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
              className="w-12 h-9 bg-transparent border border-white/10 rounded-xl cursor-pointer" />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <div className="flex-1 bg-white/6 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/40 truncate">
            {file ? file.name : 'Choose video file (MP4, WebM)'}
          </div>
          <input type="file" accept="video/*" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          <Upload size={16} className="text-white/40 shrink-0" />
        </label>
        <button onClick={upload} disabled={!file || !label.trim() || uploading}
          className={cn('w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all',
            file && label.trim() && !uploading ? 'bg-white text-black' : 'bg-white/8 text-white/30 cursor-not-allowed')}>
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <><Plus size={15} /> Add atmosphere</>}
        </button>
      </div>
      {clips.map(c => (
        <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/7">
          <span className="text-xl">{c.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium">{c.label}</p>
            <p className="text-white/30 text-xs truncate">{c.video_url?.startsWith('data:') ? 'Custom video asset' : c.video_url?.split('/').pop()}</p>
          </div>
          <button onClick={() => remove(c)} className="p-1.5 text-white/20 hover:text-rose-400 transition-colors"><Trash2 size={14} /></button>
        </div>
      ))}
      {!clips.length && <p className="text-white/25 text-sm text-center py-8">No custom atmospheres yet</p>}
    </div>
  );
}

function TopicsTab() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);
  const [color, setColor] = useState('text-violet-400');

  const COLOR_OPTIONS = [
    { label: 'Violet', value: 'text-violet-400' }, { label: 'Pink', value: 'text-pink-400' },
    { label: 'Blue', value: 'text-blue-400' }, { label: 'Emerald', value: 'text-emerald-400' },
    { label: 'Cyan', value: 'text-cyan-400' }, { label: 'Orange', value: 'text-orange-400' },
    { label: 'Rose', value: 'text-rose-400' }, { label: 'Indigo', value: 'text-indigo-400' },
    { label: 'Yellow', value: 'text-yellow-400' }, { label: 'Amber', value: 'text-amber-400' },
  ];

  const load = async () => {
    try {
      const data = await fetchD1Topics();
      setTopics(data as Topic[]);
    } catch {
      setTopics([]);
    }
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!newLabel.trim()) return;
    setAdding(true);
    try {
      await createD1Topic(newLabel.trim(), color, topics.length + 1);
      toast.success('Topic added');
      setNewLabel('');
      load();
    } catch {
      toast.error('Failed to add topic');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4 bg-white/4 border border-white/8 space-y-3">
        <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">Add Topic</p>
        <div className="flex gap-2">
          <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Topic name"
            className="flex-1 bg-white/6 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/25 focus:outline-none focus:border-white/25" />
          <select value={color} onChange={e => setColor(e.target.value)}
            className="bg-white/6 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none">
            {COLOR_OPTIONS.map(c => <option key={c.value} value={c.value} style={{ background: '#0a0a12' }}>{c.label}</option>)}
          </select>
        </div>
        <button onClick={add} disabled={!newLabel.trim() || adding}
          className={cn('w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all',
            newLabel.trim() && !adding ? 'bg-white text-black' : 'bg-white/8 text-white/30 cursor-not-allowed')}>
          {adding ? <Loader2 size={15} className="animate-spin" /> : <><Plus size={15} /> Add topic</>}
        </button>
      </div>
      <div className="space-y-2">
        {topics.map(t => (
          <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/7">
            <span className={cn('font-medium text-sm', t.color)}>{t.label}</span>
            <div className="flex-1" />
            <button onClick={async () => { await deleteD1Topic(t.id); load(); }}
              className="p-1.5 text-white/20 hover:text-rose-400 transition-colors"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TypingSoundsTab() {
  const { user } = useAuth();
  const [sounds, setSounds] = useState<{ id: string; title: string; url: string; is_default: boolean; created_at: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const load = async () => {
    try {
      const data = await fetchD1TypingSounds();
      setSounds(data.map((d: TypingSound) => ({
        id: d.id,
        title: d.title || '',
        url: d.url || '',
        is_default: Boolean(d.is_default),
        created_at: d.created_at || '',
      })));
    } catch {
      setSounds([]);
    }
  };
  useEffect(() => { load(); }, []);

  const upload = async () => {
    if (!file || !title.trim() || !user) return;
    setUploading(true);
    try {
      const uploaded = await uploadD1Media(file);
      await createD1TypingSound(title.trim(), uploaded.url, isDefault);
      toast.success('Sound uploaded');
      setTitle(''); setFile(null); setIsDefault(false);
      load();
    } catch {
      toast.error('Failed to upload sound');
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteD1TypingSound(id);
      toast.success('Sound removed');
      load();
    } catch {
      toast.error('Failed to remove sound');
    }
  };

  const INPUT = 'w-full bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.12)] rounded-xl px-3 py-2.5 text-white text-sm placeholder-[rgba(255,255,255,0.25)] focus:outline-none focus:border-[rgba(255,255,255,0.28)]';

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-4 bg-white/4 border border-white/8 space-y-3">
        <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">Upload Typing Sound</p>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Sound name *" className={INPUT} />
        <label className="flex items-center gap-2 cursor-pointer">
          <div className="flex-1 bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.12)] rounded-xl px-3 py-2.5 text-sm text-white/40 truncate">
            {file ? file.name : 'Choose audio file (MP3, WAV, OGG)'}
          </div>
          <input type="file" accept="audio/*" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          <Upload size={16} className="text-white/40 shrink-0" />
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="rounded" />
          <span className="text-white/50 text-xs">Set as default typing sound</span>
        </label>
        <button onClick={upload} disabled={!file || !title.trim() || uploading}
          className={cn('w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all',
            file && title.trim() && !uploading ? 'bg-white text-black' : 'bg-white/8 text-white/30 cursor-not-allowed')}>
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <><Plus size={15} /> Upload sound</>}
        </button>
      </div>
      {sounds.map(s => (
        <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/7">
          <Music size={14} className="text-white/30 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{s.title}</p>
            {s.is_default && <p className="text-emerald-400/70 text-xs">Default</p>}
          </div>
          <button onClick={() => remove(s.id)} className="p-1.5 text-white/20 hover:text-rose-400 transition-colors"><Trash2 size={14} /></button>
        </div>
      ))}
      {!sounds.length && <p className="text-white/25 text-sm text-center py-8">No typing sounds uploaded yet</p>}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<{ id: string; display_name: string | null; email: string; country: string | null; is_admin: boolean }[]>([]);

  useEffect(() => {
    fetchD1AdminUsers().then((data) => {
      setUsers(data);
    }).catch(() => setUsers([]));
  }, []);

  const toggleAdmin = async (id: string, current: boolean) => {
    try {
      await toggleD1AdminRole(id, !current);
      setUsers(u => u.map(x => x.id === id ? { ...x, is_admin: !current } : x));
      toast.success(current ? 'Admin removed' : 'Admin granted');
    } catch {
      toast.error('Failed to update admin role');
    }
  };

  return (
    <div className="space-y-2">
      {users.map(u => (
        <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/7">
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{u.display_name ?? '—'}</p>
            <p className="text-white/35 text-xs truncate">{u.email} {u.country && `· ${u.country}`}</p>
          </div>
          <button onClick={() => toggleAdmin(u.id, u.is_admin)}
            className={cn('text-[10px] font-semibold px-2 py-1 rounded-full border transition-all',
              u.is_admin ? 'text-amber-300 border-amber-400/40 bg-amber-400/10' : 'text-white/30 border-white/10 hover:text-white/60')}>
            {u.is_admin ? 'Admin' : 'Make admin'}
          </button>
        </div>
      ))}
      {!users.length && <p className="text-white/25 text-sm text-center py-8">No users yet</p>}
    </div>
  );
}
