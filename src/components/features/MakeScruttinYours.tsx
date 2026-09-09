/**
 * MakeScruttinYours — personalization panel.
 * - Loads topics from DB for ComposeModal
 * - Typography selections applied immediately to document root (CSS var)
 * - All preferences DB-synced for cross-device
 * - Personal BG/music default once uploaded
 */
import { useState, useEffect, useCallback } from 'react';
import { Upload, Music, Film, Type, Sliders, Loader2, Check, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/stores/preferencesStore';
import { AMBIENT_CONFIGS } from '@/constants/ambients';
import {
  uploadMediaToCloudflareR2,
  fetchD1MusicTracks,
  fetchD1AtmosphereClips,
  fetchD1TypingSounds,
  fetchD1UserPreferences,
  saveD1UserPreferences,
} from '@/lib/d1Service';
import { setTypingSoundUrl, setTypingSoundEnabled } from '@/components/features/TextReveal';
import { toast } from 'sonner';

interface MusicTrack { id: string; title: string; artist?: string; }
interface CustomAtmosphere { id: string; label: string; emoji: string; }
interface TypingSound { id: string; title: string; url: string; is_default: boolean; }

const FONT_OPTIONS = [
  { id: 'sans', label: 'Sans', preview: 'Aa', css: "'Inter', sans-serif" },
  { id: 'serif', label: 'Serif', preview: 'Aa', css: "'Lora', serif" },
  { id: 'mono', label: 'Mono', preview: 'Aa', css: "'JetBrains Mono', monospace" },
];

const TEXT_SIZES = [
  { id: 'small', label: 'Small', scale: 0.9 },
  { id: 'medium', label: 'Medium', scale: 1 },
  { id: 'large', label: 'Large', scale: 1.12 },
];

const TYPING_SPEEDS = [
  { id: 'slow', label: 'Slow' },
  { id: 'normal', label: 'Normal' },
  { id: 'fast', label: 'Fast' },
  { id: 'instant', label: 'Instant' },
];

/** Apply font preference immediately to document root */
function applyFont(fontId: string) {
  const f = FONT_OPTIONS.find(f => f.id === fontId);
  if (f) document.documentElement.style.setProperty('--scruttin-font', f.css);
}

/** Apply text size scale to document root */
function applyTextScale(sizeId: string) {
  const s = TEXT_SIZES.find(s => s.id === sizeId);
  if (s) document.documentElement.style.setProperty('--scruttin-text-scale', String(s.scale));
}

export default function MakeScruttinYours() {
  const { user } = useAuth();
  const {
    ambient, setAmbient,
    reducedMotion, setReducedMotion,
    musicEnabled, setMusicEnabled,
    musicVolume, setMusicVolume,
    selectedTrackId, setSelectedTrack,
    fontFamily, setFontFamily,
    textSize, setTextSize,
    typingSpeed, setTypingSpeed,
    voiceVolume, setVoiceVolume,
    autoPlayVoice, setAutoPlayVoice,
    typingSoundEnabled: prefTypingSound, setTypingSoundEnabled: setPrefTypingSound,
  } = usePreferences();

  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
  const [customAtmospheres, setCustomAtmospheres] = useState<CustomAtmosphere[]>([]);
  const [typingSounds, setTypingSounds] = useState<TypingSound[]>([]);
  const [personalBgUploading, setPersonalBgUploading] = useState(false);
  const [personalMusicUploading, setPersonalMusicUploading] = useState(false);
  const [personalBgName, setPersonalBgName] = useState<string | null>(null);
  const [personalMusicName, setPersonalMusicName] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const saveToDb = useCallback(async (patch: Record<string, unknown>) => {
    if (!user) return;
    try {
      await saveD1UserPreferences(user.id, patch);
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    } catch (err) {
      console.error('Pref save error:', err);
    }
  }, [user]);

  const handlePrefChange = useCallback((patch: Record<string, unknown>) => {
    if (user) saveToDb(patch);
  }, [user, saveToDb]);

  // Load DB data and sync preferences from DB
  useEffect(() => {
    fetchD1MusicTracks()
      .then((tracks) => {
        setMusicTracks(tracks as MusicTrack[]);
      }).catch(() => {});

    fetchD1AtmosphereClips()
      .then((clips) => {
        setCustomAtmospheres(clips.map(c => ({ id: c.id, label: c.label, emoji: c.emoji || '✨' })));
      }).catch(() => {});

    fetchD1TypingSounds()
      .then((sounds) => {
        setTypingSounds(sounds.map(s => ({ ...s, is_default: false })));
        if (sounds.length > 0) setTypingSoundUrl(sounds[0].url);
      }).catch(() => {});

    if (user) {
      fetchD1UserPreferences(user.id)
        .then((data) => {
          if (!data) return;
          if (data.ambient) { setAmbient(data.ambient as string); }
          if (data.reduced_motion !== undefined) setReducedMotion(Boolean(data.reduced_motion));
          if (data.music_enabled !== undefined) setMusicEnabled(Boolean(data.music_enabled));
          if (data.music_volume !== undefined) setMusicVolume(Number(data.music_volume));
          if (data.selected_track_id) setSelectedTrack(data.selected_track_id as string);
          if (data.font_family) {
            setFontFamily(data.font_family as string);
            applyFont(data.font_family as string);
          }
          if (data.text_size) {
            setTextSize(data.text_size as string);
            applyTextScale(data.text_size as string);
          }
          if (data.typing_speed) setTypingSpeed(data.typing_speed as string);
          if (data.voice_volume !== undefined) setVoiceVolume(Number(data.voice_volume));
          if (data.typing_sound_enabled !== undefined) {
            setPrefTypingSound(Boolean(data.typing_sound_enabled));
            setTypingSoundEnabled(Boolean(data.typing_sound_enabled));
          }
          if (data.personal_bg_url) setPersonalBgName('Custom background active');
          if (data.personal_music_url) setPersonalMusicName('Custom music active');
        }).catch(() => {});
    }
  }, [user]);

  // Apply font immediately on load from store
  useEffect(() => { applyFont(fontFamily); }, [fontFamily]);
  useEffect(() => { applyTextScale(textSize); }, [textSize]);
  useEffect(() => { setTypingSoundEnabled(prefTypingSound); }, [prefTypingSound]);

  const uploadPersonalBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return toast.error('Sign in to upload personal backgrounds');
    setPersonalBgUploading(true);
    try {
      const uploadRes = await uploadMediaToCloudflareR2(file, `bg_${user.id}_${Date.now()}_${file.name}`);
      const publicUrl = uploadRes.url;
      if (!publicUrl) throw new Error('Could not upload file');
      const ambientVal = `personal:${publicUrl}`;
      setAmbient(ambientVal);
      await saveToDb({ ambient: ambientVal, personal_bg_url: publicUrl });
      setPersonalBgName(file.name);
      toast.success('Personal background set as default');
    } catch {
      toast.error('Failed to process personal background');
    } finally {
      setPersonalBgUploading(false);
    }
  };

  const uploadPersonalMusic = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return toast.error('Sign in to upload personal music');
    setPersonalMusicUploading(true);
    try {
      const uploadRes = await uploadMediaToCloudflareR2(file, `music_${user.id}_${Date.now()}_${file.name}`);
      const publicUrl = uploadRes.url;
      if (!publicUrl) throw new Error('Could not upload file');
      setSelectedTrack(`personal:${publicUrl}`);
      setMusicEnabled(true);
      await saveToDb({ personal_music_url: publicUrl, music_enabled: true, selected_track_id: null });
      setPersonalMusicName(file.name);
      toast.success('Personal music set as default');
    } catch {
      toast.error('Failed to process personal music');
    } finally {
      setPersonalMusicUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-[15px]">Make Scruttin Yours</h3>
          <p className="text-white/30 text-xs mt-0.5">Your experience. Private to you. Synced across devices.</p>
        </div>
        {saved && (
          <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
            <Check size={12} /> Saved
          </span>
        )}
      </div>

      {/* Background */}
      <section>
        <p className="text-white/35 text-[10px] uppercase tracking-widest font-semibold mb-3 flex items-center gap-1.5">
          <Film size={11} /> Background
        </p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {AMBIENT_CONFIGS.map(a => (
            <button key={a.id}
              onClick={() => { setAmbient(a.id); handlePrefChange({ ambient: a.id }); }}
              className={cn('rounded-xl p-2.5 text-center transition-all border',
                ambient === a.id ? 'bg-white/12 border-white/25 text-white' : 'bg-white/4 border-white/7 text-white/40 hover:bg-white/8 hover:text-white/70')}>
              <span className="text-base block mb-0.5">{a.emoji}</span>
              <span className="text-[9px] font-medium">{a.label}</span>
            </button>
          ))}
          {customAtmospheres.map(a => (
            <button key={a.id}
              onClick={() => { setAmbient(a.id); handlePrefChange({ ambient: a.id }); }}
              className={cn('rounded-xl p-2.5 text-center transition-all border',
                ambient === a.id ? 'bg-white/12 border-white/25 text-white' : 'bg-white/4 border-white/7 text-white/40 hover:bg-white/8 hover:text-white/70')}>
              <span className="text-base block mb-0.5">{a.emoji}</span>
              <span className="text-[9px] font-medium">{a.label}</span>
            </button>
          ))}
        </div>
        {user && (
          <label className="flex items-center gap-2 cursor-pointer w-full px-3 py-2.5 rounded-xl border border-white/8 bg-white/4 hover:bg-white/8 transition-colors">
            {personalBgUploading
              ? <Loader2 size={13} className="text-white/40 animate-spin" />
              : <Upload size={13} className="text-white/40" />}
            <span className="text-white/40 text-xs truncate flex-1">
              {personalBgName ?? 'Upload personal background (video/image)'}
            </span>
            <span className="text-white/20 text-[9px]">Private · default</span>
            <input type="file" accept="video/*,image/*" className="hidden" onChange={uploadPersonalBg} disabled={personalBgUploading} />
          </label>
        )}
      </section>

      {/* Music */}
      <section>
        <p className="text-white/35 text-[10px] uppercase tracking-widest font-semibold mb-3 flex items-center gap-1.5">
          <Music size={11} /> Music
        </p>
        <div className="rounded-2xl p-3 bg-white/4 border border-white/7 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">Background music</span>
            <button
              onClick={() => { setMusicEnabled(!musicEnabled); handlePrefChange({ music_enabled: !musicEnabled }); }}
              className={cn('w-10 h-6 rounded-full border transition-all relative shrink-0', musicEnabled ? 'bg-white/20 border-white/30' : 'bg-white/5 border-white/10')}>
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: musicEnabled ? '18px' : '2px' }} />
            </button>
          </div>
          {musicEnabled && (
            <>
              <div>
                <div className="flex justify-between text-[10px] text-white/30 mb-1">
                  <span>Music volume</span><span>{musicVolume}%</span>
                </div>
                <input type="range" min={0} max={100} value={musicVolume}
                  onChange={e => { setMusicVolume(Number(e.target.value)); handlePrefChange({ music_volume: Number(e.target.value) }); }}
                  className="w-full h-1 accent-white" />
              </div>
              {musicTracks.length > 0 && (
                <div className="space-y-1">
                  <p className="text-white/30 text-[10px] mb-1.5">Platform tracks</p>
                  {musicTracks.map(t => (
                    <button key={t.id}
                      onClick={() => { setSelectedTrack(t.id); handlePrefChange({ selected_track_id: t.id, personal_music_url: null }); }}
                      className={cn('w-full text-left px-3 py-2 rounded-xl text-xs transition-all',
                        selectedTrackId === t.id ? 'bg-white/15 text-white border border-white/20' : 'bg-white/5 text-white/45 border border-white/6 hover:bg-white/10')}>
                      {t.title}{t.artist ? ` — ${t.artist}` : ''}
                    </button>
                  ))}
                </div>
              )}
              {user && (
                <label className="flex items-center gap-2 cursor-pointer w-full px-3 py-2 rounded-xl border border-white/8 bg-white/4 hover:bg-white/8 transition-colors">
                  {personalMusicUploading
                    ? <Loader2 size={12} className="text-white/40 animate-spin" />
                    : <Upload size={12} className="text-white/40" />}
                  <span className="text-white/40 text-xs truncate flex-1">
                    {personalMusicName ?? 'Upload your own music (private · default)'}
                  </span>
                  <input type="file" accept="audio/*" className="hidden" onChange={uploadPersonalMusic} disabled={personalMusicUploading} />
                </label>
              )}
            </>
          )}
        </div>
      </section>

      {/* Voice & Audio */}
      <section>
        <p className="text-white/35 text-[10px] uppercase tracking-widest font-semibold mb-3 flex items-center gap-1.5">
          <Sliders size={11} /> Voice & Audio
        </p>
        <div className="rounded-2xl p-3 bg-white/4 border border-white/7 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Auto-play voice</p>
              <p className="text-white/25 text-xs mt-0.5">Plays when a voice scrut appears</p>
            </div>
            <button
              onClick={() => { setAutoPlayVoice(!autoPlayVoice); handlePrefChange({ auto_play_voice: !autoPlayVoice }); }}
              className={cn('w-10 h-6 rounded-full border transition-all relative shrink-0', autoPlayVoice ? 'bg-white/20 border-white/30' : 'bg-white/5 border-white/10')}>
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: autoPlayVoice ? '18px' : '2px' }} />
            </button>
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-white/30 mb-1">
              <span>Voice note volume</span><span>{voiceVolume ?? 80}%</span>
            </div>
            <input type="range" min={0} max={100} value={voiceVolume ?? 80}
              onChange={e => { setVoiceVolume(Number(e.target.value)); handlePrefChange({ voice_volume: Number(e.target.value) }); }}
              className="w-full h-1 accent-white" />
          </div>
        </div>
      </section>

      {/* Typing Sound */}
      <section>
        <p className="text-white/35 text-[10px] uppercase tracking-widest font-semibold mb-3 flex items-center gap-1.5">
          <Volume2 size={11} /> Typing Sound
        </p>
        <div className="rounded-2xl p-3 bg-white/4 border border-white/7 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Typing effect sound</p>
              <p className="text-white/25 text-xs mt-0.5">Plays during text reveal animation</p>
            </div>
            <button
              onClick={() => {
                const next = !prefTypingSound;
                setPrefTypingSound(next);
                setTypingSoundEnabled(next);
                handlePrefChange({ typing_sound_enabled: next });
              }}
              className={cn('w-10 h-6 rounded-full border transition-all relative shrink-0', prefTypingSound ? 'bg-white/20 border-white/30' : 'bg-white/5 border-white/10')}>
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: prefTypingSound ? '18px' : '2px' }} />
            </button>
          </div>
          {typingSounds.length > 0 && prefTypingSound && (
            <div className="space-y-1">
              <p className="text-white/25 text-[10px] mb-1">Available sounds</p>
              {typingSounds.map(s => (
                <button key={s.id}
                  onClick={() => setTypingSoundUrl(s.url)}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs bg-white/5 text-white/45 border border-white/6 hover:bg-white/10 transition-all">
                  {s.title}{s.is_default ? ' (default)' : ''}
                </button>
              ))}
            </div>
          )}
          {typingSounds.length === 0 && <p className="text-white/25 text-xs">No typing sounds uploaded yet</p>}
        </div>
      </section>

      {/* Typography — functional, applies immediately */}
      <section>
        <p className="text-white/35 text-[10px] uppercase tracking-widest font-semibold mb-3 flex items-center gap-1.5">
          <Type size={11} /> Typography
        </p>
        <div className="space-y-3">
          <div>
            <p className="text-white/25 text-[10px] mb-2">Font style</p>
            <div className="flex gap-2">
              {FONT_OPTIONS.map(f => (
                <button key={f.id}
                  onClick={() => {
                    setFontFamily(f.id);
                    applyFont(f.id);
                    handlePrefChange({ font_family: f.id });
                  }}
                  className={cn('flex-1 py-2.5 rounded-xl border text-center transition-all',
                    fontFamily === f.id ? 'bg-white/12 border-white/25 text-white' : 'bg-white/4 border-white/7 text-white/35 hover:bg-white/8')}>
                  <span className={cn('block text-[17px] font-medium leading-none mb-0.5',
                    f.id === 'serif' && 'font-serif',
                    f.id === 'mono' && 'font-mono'
                  )}>{f.preview}</span>
                  <span className="text-[9px] mt-1 block">{f.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-white/25 text-[10px] mb-2">Text size</p>
            <div className="flex gap-2">
              {TEXT_SIZES.map(s => (
                <button key={s.id}
                  onClick={() => {
                    setTextSize(s.id);
                    applyTextScale(s.id);
                    handlePrefChange({ text_size: s.id });
                  }}
                  className={cn('flex-1 py-2 rounded-xl border text-xs font-medium transition-all',
                    textSize === s.id ? 'bg-white/12 border-white/25 text-white' : 'bg-white/4 border-white/7 text-white/35 hover:bg-white/8')}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-white/25 text-[10px] mb-2">Typing reveal speed</p>
            <div className="flex gap-1.5">
              {TYPING_SPEEDS.map(s => (
                <button key={s.id}
                  onClick={() => { setTypingSpeed(s.id); handlePrefChange({ typing_speed: s.id }); }}
                  className={cn('flex-1 py-2 rounded-xl border text-[10px] font-medium transition-all',
                    typingSpeed === s.id ? 'bg-white/12 border-white/25 text-white' : 'bg-white/4 border-white/7 text-white/30 hover:bg-white/8')}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Accessibility */}
      <section>
        <p className="text-white/35 text-[10px] uppercase tracking-widest font-semibold mb-3">Accessibility</p>
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/4 border border-white/7">
          <div>
            <p className="text-white/60 text-sm">Reduce motion</p>
            <p className="text-white/25 text-xs mt-0.5">Fewer animations & transitions</p>
          </div>
          <button
            onClick={() => { setReducedMotion(!reducedMotion); handlePrefChange({ reduced_motion: !reducedMotion }); }}
            className={cn('w-10 h-6 rounded-full border transition-all relative shrink-0', reducedMotion ? 'bg-white/20 border-white/30' : 'bg-white/5 border-white/10')}>
            <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: reducedMotion ? '18px' : '2px' }} />
          </button>
        </div>
      </section>

      {!user && (
        <p className="text-white/25 text-xs text-center">Sign in to sync preferences across devices</p>
      )}
    </div>
  );
}
