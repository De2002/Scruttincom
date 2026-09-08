import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { StreamProvider } from '@/stores/streamContext';
import { TaggedProvider } from '@/stores/taggedContext';
import AmbientBackground from '@/components/layout/AmbientBackground';
import BottomNav from '@/components/layout/BottomNav';
import LandingPage from '@/pages/LandingPage';
import AuthPage from '@/pages/auth/AuthPage';
import MusicPlayer from '@/components/features/MusicPlayer';
import { useEffect, useState } from 'react';
import { fetchFirestoreMusicTracks, fetchFirestoreUserPreferences } from '@/lib/firestoreService';
import StreamPage from '@/pages/StreamPage';
import DivePage from '@/pages/DivePage';
import ScrutinAsksPage from '@/pages/ScrutinAsksPage';
import FromTheCrowdPage from '@/pages/FromTheCrowdPage';
import StatementsPage from '@/pages/StatementsPage';
import TaggedPage from '@/pages/TaggedPage';
import MePage from '@/pages/MePage';
import ConversationPage from '@/pages/ConversationPage';
import AdminPage from '@/pages/admin/AdminPage';
import LegalPage from '@/pages/legal/LegalPage';
import NotFound from '@/pages/NotFound';
import { usePreferences } from '@/stores/preferencesStore';

const FONT_MAP: Record<string, string> = {
  sans: "'Inter', sans-serif",
  serif: "'Lora', serif",
  mono: "'JetBrains Mono', monospace",
};

const TEXT_SCALE_MAP: Record<string, number> = {
  small: 0.9,
  medium: 1,
  large: 1.12,
};

function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const {
    fontFamily,
    textSize,
    setFontFamily,
    setTextSize,
    setAmbient,
    setReducedMotion,
    setMusicEnabled,
    setMusicVolume,
    setSelectedTrack,
    setTypingSpeed,
    setVoiceVolume,
    setTypingSoundEnabled,
  } = usePreferences();

  const [tracks, setTracks] = useState<{ id: string; title: string; artist?: string; url: string }[]>([]);
  useEffect(() => {
    fetchFirestoreMusicTracks().then(data => setTracks(data ?? []));
  }, []);

  // Apply typography preference immediately to document root
  useEffect(() => {
    const fontCss = FONT_MAP[fontFamily] || FONT_MAP.sans;
    document.documentElement.style.setProperty('--scruttin-font', fontCss);
  }, [fontFamily]);

  // Apply text scale preference immediately to document root
  useEffect(() => {
    const scale = TEXT_SCALE_MAP[textSize] ?? 1;
    document.documentElement.style.setProperty('--scruttin-text-scale', String(scale));
  }, [textSize]);

  // Sync DB-stored preferences for signed in user across devices and sessions
  useEffect(() => {
    if (!user) return;
    fetchFirestoreUserPreferences(user.id).then((data) => {
      if (!data) return;
      if (data.ambient) setAmbient(data.ambient);
      if (data.reduced_motion !== undefined) setReducedMotion(data.reduced_motion);
      if (data.music_enabled !== undefined) setMusicEnabled(data.music_enabled);
      if (data.music_volume !== undefined) setMusicVolume(data.music_volume);
      if (data.selected_track_id) setSelectedTrack(data.selected_track_id);
      if (data.font_family) setFontFamily(data.font_family);
      if (data.text_size) setTextSize(data.text_size);
      if (data.typing_speed) setTypingSpeed(data.typing_speed);
      if (data.voice_volume !== undefined) setVoiceVolume(data.voice_volume);
      if (data.typing_sound_enabled !== undefined) setTypingSoundEnabled(data.typing_sound_enabled);
    });
  }, [user, setAmbient, setReducedMotion, setMusicEnabled, setMusicVolume, setSelectedTrack, setFontFamily, setTextSize, setTypingSpeed, setVoiceVolume, setTypingSoundEnabled]);

  useEffect(() => {
    const syncOverlayState = () => {
      const sheetIsOpen = Boolean(document.querySelector('[data-sheet-overlay], [data-radix-dialog-content][data-state="open"], [data-radix-dialog-overlay][data-state="open"]'));
      document.documentElement.classList.toggle('sheet-active', sheetIsOpen);
    };
    syncOverlayState();
    const observer = new MutationObserver(syncOverlayState);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-state'] });
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove('sheet-active');
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-scruttin-base text-scruttin-text">
      <AmbientBackground />
      <MusicPlayer tracks={tracks} />
      <div className="relative z-10 flex flex-col min-h-screen">
        {children}
        <BottomNav />
      </div>
    </div>
  );
}

/** Auth gate — redirect to /auth if not signed in */
function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StreamProvider>
          <TaggedProvider>
            <Toaster
              position="top-center"
              toastOptions={{
                style: { background: 'rgba(20,20,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' },
              }}
            />
            <Routes>
              {/* Public landing */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />

              {/* Public browsing (read-only) */}
              <Route path="/stream" element={<AppShell><StreamPage /></AppShell>} />
              <Route path="/dive" element={<AppShell><DivePage /></AppShell>} />
              <Route path="/dive/scruttin-asks" element={<AppShell><ScrutinAsksPage /></AppShell>} />
              <Route path="/dive/crowd" element={<AppShell><FromTheCrowdPage /></AppShell>} />
              <Route path="/dive/statements" element={<AppShell><StatementsPage /></AppShell>} />
              <Route path="/conversation/:id" element={<AppShell><ConversationPage /></AppShell>} />
              <Route path="/conversations/:id" element={<AppShell><ConversationPage /></AppShell>} />
              <Route path="/questions/:id" element={<AppShell><ConversationPage /></AppShell>} />
              <Route path="/tagged" element={<AppShell><TaggedPage /></AppShell>} />
              <Route path="/spaces" element={<Navigate to="/tagged" replace />} />
              <Route path="/open" element={<Navigate to="/tagged" replace />} />

              {/* Auth required */}
              <Route path="/me" element={<AppShell><Protected><MePage /></Protected></AppShell>} />
              <Route path="/me/activity" element={<AppShell><Protected><MePage /></Protected></AppShell>} />
              <Route path="/activity" element={<AppShell><Protected><MePage /></Protected></AppShell>} />
              <Route path="/admin" element={<Protected><AdminPage /></Protected>} />

              {/* Full documentation & policy pages */}
              <Route path="/about" element={<LegalPage />} />
              <Route path="/content-guidelines" element={<LegalPage />} />
              <Route path="/guidelines" element={<Navigate to="/content-guidelines" replace />} />
              <Route path="/terms" element={<LegalPage />} />
              <Route path="/terms-of-service" element={<Navigate to="/terms" replace />} />
              <Route path="/privacy" element={<LegalPage />} />
              <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </TaggedProvider>
        </StreamProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

