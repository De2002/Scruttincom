import { useEffect, useState } from 'react';
import { usePreferences } from '@/stores/preferencesStore';
import { getAmbientById, COLOR_BACKGROUNDS } from '@/constants/ambients';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface CustomAtmosphere {
  id: string;
  label: string;
  emoji: string;
  video_url: string;
  overlay_color: string;
  overlay_opacity: number;
  accent_color: string;
}

export default function AmbientBackground() {
  const { ambient, reducedMotion } = usePreferences();
  const [customAtmospheres, setCustomAtmospheres] = useState<CustomAtmosphere[]>([]);

  useEffect(() => {
    getDocs(query(collection(db, 'atmosphere_clips'), where('is_active', '==', true)))
      .then((snap) => {
        setCustomAtmospheres(snap.docs.map(d => ({ id: d.id, ...d.data() } as CustomAtmosphere)));
      })
      .catch((err) => {
        console.warn('Atmosphere clips fetch error:', err);
      });
  }, []);

  // Personal upload — stored in public personal-media bucket
  if (ambient.startsWith('personal:')) {
    const mediaUrl = ambient.replace('personal:', '');
    const isVideo = /\.(mp4|webm|mov|ogg)(\?|$)/i.test(mediaUrl);
    return (
      <div className="fixed inset-0 z-0 overflow-hidden">
        {isVideo ? (
          <video
            key={mediaUrl}
            className="absolute inset-0 w-full h-full object-cover"
            src={mediaUrl}
            autoPlay={!reducedMotion}
            muted
            loop={!reducedMotion}
            playsInline
          />
        ) : (
          <img
            key={mediaUrl}
            className="absolute inset-0 w-full h-full object-cover"
            src={mediaUrl}
            alt=""
            aria-hidden
          />
        )}
        <div className="absolute inset-0" style={{ background: 'rgba(8, 8, 18, 0.62)' }} />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.42) 100%)' }}
        />
      </div>
    );
  }

  // Custom DB atmosphere
  const customConfig = customAtmospheres.find(a => a.id === ambient);

  if (customConfig) {
    return (
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video
          key={customConfig.video_url}
          className="absolute inset-0 w-full h-full object-cover ambient-fade"
          src={customConfig.video_url}
          autoPlay={!reducedMotion}
          muted
          loop={!reducedMotion}
          playsInline
        />
        <div
          className="absolute inset-0 ambient-fade"
          style={{ background: `rgba(${customConfig.overlay_color}, ${customConfig.overlay_opacity})` }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.4) 100%)' }}
        />
      </div>
    );
  }

  const builtinConfig = getAmbientById(ambient);
  const colorConfig = COLOR_BACKGROUNDS.find(c => c.id === ambient);

  if (colorConfig) {
    return <div className="fixed inset-0 z-0" style={{ backgroundColor: `rgb(${colorConfig.overlayColor})` }} />;
  }

  if (ambient === 'off') {
    return <div className="fixed inset-0 z-0 bg-[#0a0a12]" />;
  }

  if (ambient === 'minimal') {
    return (
      <div className="fixed inset-0 z-0" style={{ background: `rgb(${builtinConfig.overlayColor})` }}>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(255,255,255,0.03) 0%, transparent 50%)',
          }}
        />
      </div>
    );
  }

  if (!builtinConfig.videoUrl) {
    return <div className="fixed inset-0 z-0 bg-[#0a0a12]" />;
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <video
        key={builtinConfig.videoUrl}
        className="absolute inset-0 w-full h-full object-cover ambient-fade"
        src={builtinConfig.videoUrl}
        autoPlay={!reducedMotion}
        muted
        loop={!reducedMotion}
        playsInline
      />
      <div
        className="absolute inset-0 ambient-fade"
        style={{ background: `rgba(${builtinConfig.overlayColor}, ${builtinConfig.overlayOpacity})` }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.4) 100%)' }}
      />
    </div>
  );
}
