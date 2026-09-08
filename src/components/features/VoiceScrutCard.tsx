import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { formatDuration, cn } from '@/lib/utils';
import UserAvatar from './UserAvatar';
import { notifyVoiceStart, notifyVoiceEnd } from './MusicPlayer';
import type { User } from '@/types';

interface Props {
  duration: number;
  user: User;
  scrutId?: string;
  audioUrl?: string;
  className?: string;
  autoPlay?: boolean;
  onPlaybackEnd?: () => void;
  onPlaybackStart?: () => void;
  showUser?: boolean;
  onAvatarClick?: () => void;
  contextText?: string;
}

const COUNTRY_ISO: Record<string, string> = {
  Nigeria:'ng', Brazil:'br', Ghana:'gh', Japan:'jp', India:'in', Mexico:'mx',
  Germany:'de', USA:'us', 'United States':'us', Canada:'ca', Australia:'au',
  Kenya:'ke', France:'fr', Spain:'es', Italy:'it', UK:'gb', 'United Kingdom':'gb',
  Argentina:'ar', China:'cn', 'South Africa':'za', Egypt:'eg', Turkey:'tr',
  Indonesia:'id', Pakistan:'pk', Philippines:'ph', Vietnam:'vn', Thailand:'th',
  Colombia:'co', Chile:'cl', Peru:'pe', Sweden:'se', Norway:'no', Netherlands:'nl',
  Poland:'pl', Portugal:'pt', Ukraine:'ua', Russia:'ru', 'South Korea':'kr',
  Uganda:'ug', Rwanda:'rw', Senegal:'sn', Cameroon:'cm',
};

export default function VoiceScrutCard({
  duration, user, scrutId, audioUrl, className, autoPlay = false,
  onPlaybackEnd, onPlaybackStart, showUser = true, onAvatarClick, contextText,
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaDuration, setMediaDuration] = useState(duration);
  const [autoplayed, setAutoplayed] = useState(false);
  const total = mediaDuration || duration || 1;
  const progress = Math.min(1, currentTime / total);
  const location = [user.city, user.country].filter(Boolean).join(', ');
  const mapUrl = user.country && COUNTRY_ISO[user.country]
    ? `https://raw.githubusercontent.com/djaiss/mapsicon/master/all/${COUNTRY_ISO[user.country]}/256.png`
    : null;

  const startPlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      await audio.play();
      setPlaying(true);
      notifyVoiceStart();
      onPlaybackStart?.();
    } catch {
      setPlaying(false);
    }
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playing) {
      audioRef.current?.pause();
      notifyVoiceEnd();
    } else {
      void startPlay();
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setMediaDuration(Number.isFinite(audio.duration) ? audio.duration : duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => { setPlaying(false); };
    const onEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
      notifyVoiceEnd();
      onPlaybackEnd?.();
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
      notifyVoiceEnd();
    };
  }, [duration, onPlaybackEnd]);

  // Reset autoplayed flag when a new scrut appears (autoPlay prop changes)
  useEffect(() => {
    setAutoplayed(false);
  }, [scrutId]);

  useEffect(() => {
    if (autoPlay && !autoplayed && audioUrl) {
      setAutoplayed(true);
      const timer = window.setTimeout(() => void startPlay(), 300);
      return () => window.clearTimeout(timer);
    }
  }, [autoPlay, autoplayed, audioUrl]);

  return (
    <div className={cn('relative flex flex-col gap-4', className)}>
      {mapUrl && <img src={mapUrl} alt="" aria-hidden className="pointer-events-none absolute right-0 top-0 size-28 object-contain opacity-[0.08]" />}
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}

      {/* Profile section */}
      {showUser && (
        <div className="flex flex-col items-center gap-2">
          {/* Avatar with play ring */}
          <button type="button" onClick={onAvatarClick} aria-label={`View ${user.display_name} profile`} className="relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
            <div
              className={cn(
                'w-24 h-24 rounded-full overflow-hidden border-2 transition-all duration-300',
                playing ? 'border-white/60 shadow-[0_0_24px_rgba(255,255,255,0.15)]' : 'border-white/15',
              )}
            >
              <UserAvatar user={user} size="xl" shape="circle" className="w-full h-full" />
            </div>
            {/* Pulsing ring when playing */}
            {playing && (
              <>
                <span className="absolute inset-[-4px] rounded-full border border-white/25 animate-ping" style={{ animationDuration: '1.4s' }} />
                <span className="absolute inset-[-10px] rounded-full border border-white/10 animate-ping" style={{ animationDuration: '1.8s' }} />
              </>
            )}
          </button>

          {/* Name and context */}
          <div className="text-center">
            <p className="text-white font-semibold text-[15px]">{user.display_name} <span className="font-normal text-white/45">on</span></p>
            {contextText && <p className="mt-2 max-w-xs font-serif text-[17px] italic leading-7 text-white/55">“{contextText}”</p>}
            {location && <p className="mt-1 text-xs text-white/35">{location}</p>}
          </div>


        </div>
      )}

      {/* Playback control and timestamps */}
      <div className="flex items-center justify-center gap-3">
        {/* Play/pause button */}
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? 'Pause voice Rut' : 'Play voice Rut'}
          className={cn(
            'relative shrink-0 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
            playing ? 'border-white/50 bg-white/15 text-white' : 'border-white/15 bg-white/7 text-white/60 hover:bg-white/12 hover:text-white',
          )}
        >

          <span className="relative z-10 flex size-8 items-center justify-center rounded-full bg-black/35 backdrop-blur-sm">
            {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </span>
        </button>

        <div className="flex items-center gap-2 font-mono text-[10px] tabular-nums text-white/35">
          <span>{formatDuration(Math.floor(currentTime))}</span>
          <span className="text-white/20">/</span>
          <span className="text-white/25">{formatDuration(Math.floor(total))}</span>
        </div>
      </div>
    </div>
  );
}
