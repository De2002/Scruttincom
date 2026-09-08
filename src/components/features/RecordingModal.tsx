import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Upload, Loader2, X, RotateCcw } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { uploadMediaToCloudflareR2 } from '@/lib/cloudflareService';
import AudioWaveformVisualizer from './AudioWaveformVisualizer';
import VisualRecordingTimer from './VisualRecordingTimer';

interface Props {
  onRecorded: (url: string, duration: number, blob: Blob) => void;
  onCancel: () => void;
}

export default function RecordingModal({ onRecorded, onCancel }: Props) {
  const { user } = useAuth();
  const [state, setState] = useState<'idle' | 'recording' | 'recorded' | 'uploading'>('idle');
  const [duration, setDuration] = useState(0);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [error, setError] = useState('');
  const MAX_DURATION = 180;
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blobRef = useRef<Blob | null>(null);

  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setActiveStream(null);
    }
  };

  const startRecording = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setActiveStream(stream);

      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      setDuration(0);

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size > MAX_FILE_SIZE) {
          setError('Voice Ruts must be 5 MB or smaller. Please record a shorter take.');
          setState('idle');
          stopTracks();
          return;
        }
        blobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setAudioDuration(duration);
        setState('recorded');
        stopTracks();
      };

      mr.start(200);
      setState('recording');

      timerRef.current = setInterval(() => {
        setDuration((d) => {
          if (d + 1 >= MAX_DURATION) {
            window.setTimeout(stopRecording, 0);
            return MAX_DURATION;
          }
          return d + 1;
        });
      }, 1000);
    } catch {
      setError('Microphone access denied. Please allow microphone access in your browser and try again.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
  };

  const upload = async () => {
    if (!blobRef.current || !user) return;
    if (blobRef.current.size > MAX_FILE_SIZE || audioDuration > MAX_DURATION) {
      setError('Voice Ruts must be no longer than 3 minutes and 5 MB.');
      return;
    }

    setState('uploading');
    try {
      const uploadResult = await uploadMediaToCloudflareR2(
        blobRef.current,
        `voice_${user.id}_${Date.now()}.webm`
      );
      const audioToUse = uploadResult.url || audioUrl || '';
      onRecorded(audioToUse, audioDuration, blobRef.current);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to process audio take');
      setState('recorded');
    }
  };

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    stopTracks();
    onCancel();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopTracks();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={handleCancel} />
      <div
        className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-8 sm:pb-6 shadow-2xl border transition-all"
        style={{ background: 'rgba(14,14,24,0.98)', borderColor: 'rgba(255,255,255,0.1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <h3 className="text-white font-semibold text-base">Voice Recording</h3>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            title="Close recording modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-5">
          {/* Visual Recording Timer Component */}
          <VisualRecordingTimer
            elapsedSeconds={state === 'recorded' ? audioDuration : duration}
            maxDuration={MAX_DURATION}
            isRecording={state === 'recording'}
          />

          {/* Audio Waveform Indicator Component */}
          <AudioWaveformVisualizer
            stream={activeStream}
            isRecording={state === 'recording'}
          />

          {error && (
            <div className="w-full p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center">
              {error}
            </div>
          )}

          {/* Controls: Idle State */}
          {state === 'idle' && (
            <div className="flex flex-col items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={startRecording}
                className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center hover:bg-rose-400 active:scale-95 transition-all shadow-lg shadow-rose-500/35 group"
                title="Start recording voice take"
              >
                <Mic size={26} className="text-white group-hover:scale-110 transition-transform" />
              </button>
              <span className="text-xs text-white/50 font-medium">Tap microphone to begin</span>
            </div>
          )}

          {/* Controls: Recording State with Pulse Wave */}
          {state === 'recording' && (
            <div className="flex flex-col items-center gap-2.5 pt-1">
              <div className="relative flex items-center justify-center">
                <div className="absolute -inset-3 rounded-full bg-rose-500/20 animate-ping pointer-events-none" />
                <div className="absolute -inset-1.5 rounded-full bg-rose-500/30 pulse-ring pointer-events-none" />
                <button
                  type="button"
                  onClick={stopRecording}
                  className="relative z-10 w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center hover:bg-rose-500/30 active:scale-95 transition-all shadow-[0_0_24px_rgba(244,63,94,0.4)] group"
                  title="Stop recording"
                >
                  <Square size={22} className="text-rose-400 fill-rose-400 group-hover:scale-110 transition-transform" />
                </button>
              </div>
              <span className="text-xs text-rose-300/80 font-medium animate-pulse">
                Tap square to stop & preview take
              </span>
            </div>
          )}

          {/* Controls: Recorded Preview State */}
          {state === 'recorded' && audioUrl && (
            <div className="w-full space-y-3 pt-1">
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span className="font-medium">Audio Preview</span>
                  <span className="font-mono">{formatDuration(audioDuration)}</span>
                </div>
                <audio src={audioUrl} controls className="w-full h-8 opacity-80" style={{ filter: 'invert(1)' }} />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setState('idle');
                    setAudioUrl(null);
                    setDuration(0);
                    setAudioDuration(0);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-white/12 text-white/60 hover:text-white hover:bg-white/5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw size={13} /> Re-record
                </button>
                <button
                  type="button"
                  onClick={upload}
                  className="flex-1 py-2.5 rounded-xl bg-white text-black font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-white/90 active:scale-[0.99] transition-all shadow-md"
                >
                  <Upload size={13} /> Use this take
                </button>
              </div>
            </div>
          )}

          {/* Controls: Uploading State */}
          {state === 'uploading' && (
            <div className="flex items-center justify-center gap-2 text-white/60 py-4">
              <Loader2 size={18} className="animate-spin text-rose-400" />
              <span className="text-sm font-medium">Processing & uploading voice take…</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
