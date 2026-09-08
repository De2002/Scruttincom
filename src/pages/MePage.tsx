import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Mic2,
  MessageCircle,
  Camera,
  Loader2,
  Edit3,
  Check,
  X,
  Coffee,
  Layers,
  ChevronRight,
  ExternalLink,
  MapPin,
  Globe,
} from 'lucide-react';
import { fetchFirestoreUserStats, fetchFirestoreUserScruts } from '@/lib/firestoreService';
import { useAuth } from '@/contexts/AuthContext';
import MakeScruttinYours from '@/components/features/MakeScruttinYours';
import MeTopBar from '@/components/features/MeTopBar';
import UserContributionsSheet from '@/components/features/UserContributionsSheet';
import ComposeModal from '@/components/features/ComposeModal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getMapUrl, COMMON_COUNTRIES } from '@/lib/countryMap';

type Tab = 'scruts' | 'yours' | 'account';

function ensureHttps(url: string) {
  return url.startsWith('http') ? url : `https://${url}`;
}

function getTipLabel(url?: string | null): string {
  if (!url) return 'Buy a coffee';
  const l = url.toLowerCase();
  if (l.includes('buymeacoffee.com') || l.includes('bmc.link')) return 'Buy Me a Coffee';
  if (l.includes('ko-fi.com')) return 'Ko-fi';
  if (l.includes('paypal.me') || l.includes('paypal.com')) return 'PayPal';
  return 'Tip & Support';
}

interface MyScrut {
  id: string;
  text?: string;
  type: string;
  created_at: string;
  resonate_count: number;
  conversation_id?: string;
  conversation?: { body: string; topic: string };
}

const INPUT_CLS = 'w-full bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.12)] rounded-xl px-3 py-2.5 text-white text-sm placeholder-[rgba(255,255,255,0.25)] focus:outline-none focus:border-[rgba(255,255,255,0.28)] transition-colors';

export default function MePage() {
  const { user, loading, refreshUser, updateProfile } = useAuth();
  const navigate = useNavigate();

  const location = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>('scruts');
  const [myScruts, setMyScruts] = useState<MyScrut[]>([]);
  const [activity, setActivity] = useState({ scruts_given: 0, conversations_asked: 0 });
  const [dataLoading, setDataLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editTwitter, setEditTwitter] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editTipLink, setEditTipLink] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Contributions sheet state & Compose modal state
  const [showContributionsSheet, setShowContributionsSheet] = useState(false);
  const [composeModalMode, setComposeModalMode] = useState<'question' | 'statement' | null>(null);

  // Auto-open activity sheet if navigated with ?tab=activity or path contains activity
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('tab') === 'activity' || location.pathname.includes('/activity')) {
      setShowContributionsSheet(true);
    }
  }, [location]);

  useEffect(() => {
    if (!loading && !user) navigate('/auth', { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    setEditName(user.display_name ?? '');
    setEditBio(user.bio ?? '');
    setEditCity(user.city ?? '');
    setEditCountry(user.country ?? '');
    setEditWebsite(user.website ?? '');
    setEditTwitter(user.twitter ?? '');
    setEditInstagram(user.instagram ?? '');
    const currentTip =
      user.tip_link ||
      (typeof window !== 'undefined'
        ? localStorage.getItem(`scruttin_tip_${user.id}`) || localStorage.getItem(`scruttin_tip_link_${user.id}`) || ''
        : '');
    setEditTipLink(currentTip);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setDataLoading(true);
      const [stats, scruts] = await Promise.all([
        fetchFirestoreUserStats(user.id),
        fetchFirestoreUserScruts(user.id),
      ]);
      setActivity(stats);
      setMyScruts(scruts as MyScrut[]);
      setDataLoading(false);
    })();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);

    const cleanTip = editTipLink.trim();
    try {
      localStorage.setItem(`scruttin_tip_${user.id}`, cleanTip);
      localStorage.setItem(`scruttin_tip_link_${user.id}`, cleanTip);
    } catch {
      /* storage unavailable */
    }

    try {
      await updateProfile({
        display_name: editName.trim(),
        bio: editBio.trim() || undefined,
        city: editCity.trim() || undefined,
        country: editCountry.trim() || undefined,
        website: editWebsite.trim() || undefined,
        twitter: editTwitter.trim().replace('@', '') || undefined,
        instagram: editInstagram.trim().replace('@', '') || undefined,
        tip_link: cleanTip || undefined,
      });
      await refreshUser();
      setEditing(false);
      toast.success('Profile updated');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        await updateProfile({ avatar_url: base64 });
        await refreshUser();
        setAvatarUploading(false);
        toast.success('Photo updated');
      };
      reader.onerror = () => {
        toast.error('Failed to read image');
        setAvatarUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
      setAvatarUploading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={24} className="text-white/30 animate-spin" />
      </div>
    );
  }

  const initials = user.display_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col min-h-screen pb-24 overflow-y-auto">
      {/* Top bar */}
      <div className="px-5 pt-safe pt-4 pb-0 flex items-center justify-between shrink-0">
        <h1 className="text-white font-bold text-xl tracking-tight">Me</h1>
        <MeTopBar />
      </div>

      {/* Profile hero */}
      <div className="px-5 pt-5 pb-0 shrink-0">
        <div className="relative rounded-3xl overflow-hidden p-5 mb-4"
          style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>

          <div className="flex items-start gap-4 mb-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <label className="cursor-pointer">
                <div className="w-16 h-16 rounded-2xl overflow-hidden relative"
                  style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.5) 0%,rgba(59,130,246,0.5) 100%)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-xl text-white">{initials}</div>
                  )}
                  {avatarUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 size={16} className="animate-spin text-white" />
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white/15 border border-white/20 flex items-center justify-center">
                  <Camera size={10} className="text-white/60" />
                </div>
              </label>
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              {editing ? (
                <div className="space-y-1.5 mb-1.5">
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className={cn(INPUT_CLS, 'mb-1')}
                    placeholder="Display name"
                  />
                  <div className="flex gap-2">
                    <input
                      value={editCity}
                      onChange={e => setEditCity(e.target.value)}
                      placeholder="City (e.g. Lagos, London)"
                      className={cn(INPUT_CLS, 'flex-1 text-xs py-1.5')}
                    />
                    <div className="flex-1 relative">
                      <input
                        value={editCountry}
                        onChange={e => setEditCountry(e.target.value)}
                        placeholder="Country (for map silhouette)"
                        list="me-common-countries"
                        className={cn(INPUT_CLS, 'text-xs py-1.5')}
                      />
                      <datalist id="me-common-countries">
                        {COMMON_COUNTRIES.map(c => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                  <p className="text-[10px] text-white/30">
                    Setting your country unlocks your country map silhouette on your profile.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-white font-bold text-[18px] leading-tight">{user.display_name}</h2>
                    {user.country && getMapUrl(user.country) && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[11px] text-white/80 font-medium"
                        title={`${user.country} country map silhouette`}
                      >
                        <img
                          src={getMapUrl(user.country)!}
                          alt={user.country}
                          className="w-3.5 h-3.5 object-contain invert opacity-90"
                        />
                        <span>{user.country}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-white/40 text-xs">
                    <MapPin size={11} className="shrink-0 text-white/30" />
                    <span>
                      {user.city ? `${user.city}, ${user.country || 'Global'}` : (user.country || 'No country set')}
                    </span>
                    {!user.country && (
                      <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="text-amber-300/80 hover:text-amber-300 text-[11px] underline ml-1"
                      >
                        + Set country for map
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Tipping Coffee Badge and Website Link */}
              {!editing && (
                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                  {user.website && (
                    <a
                      href={ensureHttps(user.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/35 transition-all shadow-sm active:scale-95 group"
                      title="Visit your blog / website"
                    >
                      <Globe size={11} className="text-sky-400 group-hover:scale-110 transition-transform" />
                      <span className="truncate max-w-[140px]">{user.website.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink size={10} className="text-sky-400/60" />
                    </a>
                  )}

                  {editTipLink ? (
                    <a
                      href={ensureHttps(editTipLink)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 transition-all shadow-sm active:scale-95 group"
                    >
                      <Coffee size={12} className="text-amber-400 group-hover:scale-110 transition-transform" />
                      <span>{getTipLabel(editTipLink)}</span>
                      <ExternalLink size={10} className="text-amber-400/60" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="inline-flex items-center gap-1.5 text-[11px] text-amber-300/80 hover:text-amber-300 transition-colors"
                    >
                      <Coffee size={11} className="text-amber-400" />
                      <span className="underline underline-offset-2">+ Add Coffee / PayPal / Ko-fi tip link</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {editing ? (
              <div className="flex gap-1 shrink-0">
                <button onClick={() => setEditing(false)} className="p-1.5 text-white/30 hover:text-white/70 transition-colors"><X size={15} /></button>
                <button onClick={saveProfile} disabled={savingProfile} className="p-1.5 text-emerald-400 hover:text-emerald-300 transition-colors">
                  {savingProfile ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                </button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} className="shrink-0 p-1.5 text-white/25 hover:text-white/60 transition-colors">
                <Edit3 size={14} />
              </button>
            )}
          </div>

          {editing ? (
            <textarea
              value={editBio}
              onChange={e => setEditBio(e.target.value)}
              placeholder="A sentence about yourself…"
              rows={2}
              className="w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 py-2.5 text-white/70 text-sm font-serif resize-none focus:outline-none focus:border-[rgba(255,255,255,0.25)] mb-4 placeholder-[rgba(255,255,255,0.25)]"
            />
          ) : (
            user.bio && <p className="text-white/55 text-[13px] font-serif leading-[1.65] mb-4">{user.bio}</p>
          )}

          {editing && (
            <div className="space-y-2 mb-4">
              {/* Tipping / Coffee link field */}
              <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <Coffee size={13} className="text-amber-400" />
                    Tipping & Support link
                  </span>
                  {editTipLink && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                      {getTipLabel(editTipLink)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-white/40">
                  Add your Buy Me a Coffee, PayPal.me, or Ko-fi URL. This displays a coffee icon on your profile sheet.
                </p>
                <div className="relative">
                  <input
                    value={editTipLink}
                    onChange={e => setEditTipLink(e.target.value)}
                    placeholder="https://buymeacoffee.com/... or paypal.me/... or ko-fi.com/..."
                    className={cn(INPUT_CLS, 'pl-8 text-xs font-mono text-amber-200 placeholder-white/20')}
                  />
                  <Coffee size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-400/60 pointer-events-none" />
                </div>
              </div>

              <input value={editWebsite} onChange={e => setEditWebsite(e.target.value)} placeholder="Website" className={INPUT_CLS} />
              <div className="flex gap-2">
                <input value={editTwitter} onChange={e => setEditTwitter(e.target.value)} placeholder="Twitter / X" className={cn(INPUT_CLS, 'flex-1')} style={{ width: 'auto' }} />
                <input value={editInstagram} onChange={e => setEditInstagram(e.target.value)} placeholder="Instagram" className={cn(INPUT_CLS, 'flex-1')} style={{ width: 'auto' }} />
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Scruts given', value: activity.scruts_given, icon: Mic2, color: 'text-violet-400' },
              { label: 'Questions asked', value: activity.conversations_asked, icon: MessageCircle, color: 'text-sky-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-2xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Icon size={12} className={cn('mx-auto mb-1.5', color)} strokeWidth={1.8} />
                <p className="text-white font-bold text-[20px] leading-none">{value}</p>
                <p className="text-white/30 text-[10px] mt-1 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Button linking to Questions asked, Claims made & Questions responded to */}
          <button
            type="button"
            id="me-view-contributions-btn"
            onClick={() => setShowContributionsSheet(true)}
            className="w-full mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/15 via-sky-500/10 to-emerald-500/10 hover:from-purple-500/25 hover:via-sky-500/20 hover:to-emerald-500/20 border border-white/10 hover:border-purple-500/40 transition-all text-left group active:scale-[0.99] touch-manipulation flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/35 flex items-center justify-center text-purple-300 shrink-0 shadow-inner">
                <Layers size={17} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-white group-hover:text-purple-200 transition-colors">
                    Questions, Claims & Responses
                  </p>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/25 text-purple-300 font-mono">
                    Activity
                  </span>
                </div>
                <p className="text-[11px] text-white/50 truncate">
                  Questions asked · Claims made · Questions responded to
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-4">
          {([
            { id: 'scruts', label: 'My Scruts' },
            { id: 'yours', label: '✦ Make It Yours' },
            { id: 'account', label: 'Account' },
          ] as { id: Tab; label: string }[]).map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={cn('flex-1 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                activeTab === t.id ? 'bg-white/15 text-white' : 'text-white/35 hover:text-white/60')}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 px-5 pb-4">
        {activeTab === 'scruts' && (
          dataLoading ? (
            <div className="flex justify-center py-12"><Loader2 size={18} className="text-white/20 animate-spin" /></div>
          ) : myScruts.length === 0 ? (
            <div className="text-center py-16 text-white/25">
              <Mic2 size={28} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium mb-1 text-white/40 text-sm">No scruts yet</p>
              <p className="text-xs">Join a conversation in the stream</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myScruts.map(s => (
                <button
                  key={s.id}
                  onClick={() => s.conversation_id && navigate(`/conversation/${s.conversation_id}`)}
                  className="w-full text-left p-4 rounded-2xl bg-white/4 border border-white/7 hover:bg-white/8 transition-all"
                >
                  {s.conversation && (
                    <p className="text-[10px] font-medium uppercase tracking-widest text-white/30 mb-1.5 truncate">
                      {(s.conversation as Record<string, unknown>).topic as string} · {((s.conversation as Record<string, unknown>).body as string)?.slice(0, 50)}…
                    </p>
                  )}
                  {s.type === 'text' && s.text ? (
                    <p className="text-white/75 font-serif text-[13px] leading-snug line-clamp-3">{s.text}</p>
                  ) : (
                    <p className="text-white/40 text-[13px] italic">Voice scrut</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-white/20 text-[10px]">{new Date(s.created_at).toLocaleDateString()}</span>
                    {s.resonate_count > 0 && (
                      <span className="text-rose-400/70 text-[10px]">{s.resonate_count} resonates</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )
        )}

        {activeTab === 'yours' && <MakeScruttinYours />}

        {activeTab === 'account' && (
          <div className="space-y-4">
            {/* Country Map Silhouette card */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin size={15} className="text-emerald-400" />
                  <h3 className="text-white font-semibold text-sm">Country Map Silhouette</h3>
                </div>
                {user.country && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                    {user.country}
                  </span>
                )}
              </div>

              {user.country && getMapUrl(user.country) ? (
                <div className="flex items-center gap-4 p-3 rounded-xl bg-black/20 border border-white/5">
                  <div className="w-14 h-14 rounded-lg bg-white/5 flex items-center justify-center shrink-0 p-1">
                    <img
                      src={getMapUrl(user.country)!}
                      alt={user.country}
                      className="w-12 h-12 object-contain invert opacity-90"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-xs font-semibold">{user.country} map</p>
                    <p className="text-white/40 text-[11px] mt-0.5 leading-relaxed">
                      This authentic map silhouette is displayed when strangers explore your profile after listening to your ruts.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-left space-y-2">
                  <p className="text-white/50 text-xs leading-relaxed">
                    Set your country on your profile so strangers worldwide can discover your country map silhouette when hearing your ruts.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {COMMON_COUNTRIES.slice(0, 8).map(country => (
                      <button
                        key={country}
                        type="button"
                        onClick={async () => {
                          try {
                            await updateProfile({ country });
                            await refreshUser();
                            toast.success(`Country set to ${country}`);
                          } catch {
                            toast.error('Failed to set country');
                          }
                        }}
                        className="px-2.5 py-1 rounded-full text-[11px] bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
                      >
                        {country}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="px-4 py-3 rounded-xl bg-white/4 border border-white/6">
                <p className="text-white/40 text-xs mb-0.5">Signed in as</p>
                <p className="text-white/70 text-sm">{user.email}</p>
              </div>
              {user.date_of_birth && (
                <div className="px-4 py-3 rounded-xl bg-white/4 border border-white/6">
                  <p className="text-white/40 text-xs mb-0.5">Date of birth</p>
                  <p className="text-white/60 text-sm">{new Date(user.date_of_birth).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Activity / Contributions Slide-Up Sheet */}
      {showContributionsSheet && (
        <UserContributionsSheet
          user={{
            id: user.id,
            display_name: user.display_name,
            avatar_url: user.avatar_url || '',
            country: user.country || 'Global',
            city: user.city,
            bio: user.bio,
            website: user.website,
            twitter: user.twitter,
            instagram: user.instagram,
            tip_link: editTipLink || user.tip_link,
          }}
          onClose={() => setShowContributionsSheet(false)}
          onAskQuestion={() => setComposeModalMode('question')}
          onMakeClaim={() => setComposeModalMode('statement')}
        />
      )}

      {/* Compose modal for quick question or claim creation */}
      {composeModalMode && (
        <ComposeModal
          defaultMode={composeModalMode}
          onClose={() => setComposeModalMode(null)}
          onPosted={() => {
            setComposeModalMode(null);
            refreshUser();
          }}
        />
      )}
    </div>
  );
}
