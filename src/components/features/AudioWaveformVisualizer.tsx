import { useEffect, useRef, useState } from 'react';
import { Volume2, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioWaveformVisualizerProps {
  stream: MediaStream | null;
  isRecording: boolean;
  className?: string;
}

export default function AudioWaveformVisualizer({
  stream,
  isRecording,
  className,
}: AudioWaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [hasVoiceActivity, setHasVoiceActivity] = useState<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 320;
    const height = rect.height || 64;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let animationId: number | null = null;
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;

    const BAR_COUNT = 36;
    const barWidth = 3.5;
    const gap = (width - BAR_COUNT * barWidth) / (BAR_COUNT - 1);
    const minHeight = 4;
    const maxHeight = height - 12;

    // Fallback smoothed bars for natural movement
    const smoothedHeights = new Float32Array(BAR_COUNT).fill(minHeight);
    let phase = 0;

    if (stream && isRecording) {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContext = new AudioCtx();

        if (audioContext.state === 'suspended') {
          audioContext.resume().catch(() => {});
        }

        analyser = audioContext.createAnalyser();
        analyser.fftSize = 128; // 64 frequency bins
        analyser.smoothingTimeConstant = 0.72;
        analyser.minDecibels = -85;
        analyser.maxDecibels = -15;

        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
      } catch (err) {
        console.warn('Web Audio initialization fallback:', err);
      }
    }

    const freqData = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      phase += 0.05;

      let currentAvg = 0;

      if (analyser && freqData && isRecording) {
        analyser.getByteFrequencyData(freqData);

        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < freqData.length; i++) {
          sum += freqData[i];
        }
        currentAvg = sum / freqData.length / 255;
      } else if (isRecording) {
        // Subtle organic sine wave if analyser not directly available
        currentAvg = 0.15 + Math.sin(phase * 1.5) * 0.08;
      }

      setAudioLevel(currentAvg);
      setHasVoiceActivity(currentAvg > 0.06);

      // Draw bars
      for (let i = 0; i < BAR_COUNT; i++) {
        let targetHeight = minHeight;

        if (isRecording) {
          if (analyser && freqData) {
            // Map bar index to frequency bins with center-peaked weighting
            const centerDist = Math.abs(i - (BAR_COUNT - 1) / 2) / ((BAR_COUNT - 1) / 2);
            const freqIndex = Math.min(
              freqData.length - 1,
              Math.floor((i / BAR_COUNT) * (freqData.length * 0.75))
            );
            const rawVal = freqData[freqIndex] / 255;
            const weightedVal = rawVal * (1 - centerDist * 0.35);

            // Add subtle breathing wave so quiet pauses still feel organic
            const idleWave = (Math.sin(phase * 2 + i * 0.3) + 1) * 0.06;
            const normalized = Math.max(idleWave, weightedVal);

            targetHeight = minHeight + normalized * (maxHeight - minHeight);
          } else {
            // Simulated idle wave
            const wave = (Math.sin(phase * 3 + i * 0.35) + 1) * 0.5;
            targetHeight = minHeight + wave * (maxHeight * 0.45);
          }
        } else {
          // Idle state - gentle resting bars
          const restingWave = Math.sin(i * 0.25) * 2;
          targetHeight = minHeight + 3 + restingWave;
        }

        // Smooth height transitions
        smoothedHeights[i] += (targetHeight - smoothedHeights[i]) * 0.28;
        const barH = Math.max(minHeight, Math.min(maxHeight, smoothedHeights[i]));

        const x = i * (barWidth + gap);
        const y = (height - barH) / 2;

        // Dynamic gradient based on voice energy and position
        const gradient = ctx.createLinearGradient(0, y, 0, y + barH);
        if (isRecording) {
          if (currentAvg > 0.12) {
            gradient.addColorStop(0, '#fda4af'); // rose-300
            gradient.addColorStop(0.5, '#f43f5e'); // rose-500
            gradient.addColorStop(1, '#e11d48'); // rose-600
          } else {
            gradient.addColorStop(0, '#fb7185'); // rose-400
            gradient.addColorStop(1, '#e11d48'); // rose-600
          }
        } else {
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0.15)');
        }

        ctx.fillStyle = gradient;

        // Subtle glow when voice peaks
        if (isRecording && currentAvg > 0.1) {
          ctx.shadowColor = 'rgba(244, 63, 94, 0.45)';
          ctx.shadowBlur = 6;
        } else {
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }

        // Draw rounded pill bar
        const radius = barWidth / 2;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + barWidth, y, x + barWidth, y + barH, radius);
        ctx.arcTo(x + barWidth, y + barH, x, y + barH, radius);
        ctx.arcTo(x, y + barH, x, y, radius);
        ctx.arcTo(x, y, x + barWidth, y, radius);
        ctx.closePath();
        ctx.fill();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (source) source.disconnect();
      if (analyser) analyser.disconnect();
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => {});
      }
    };
  }, [stream, isRecording]);

  return (
    <div className={cn('w-full flex flex-col items-center gap-3', className)}>
      {/* Waveform Canvas */}
      <div className="relative w-full h-16 sm:h-20 flex items-center justify-center px-2 py-1 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md overflow-hidden shadow-inner">
        {/* Subtle background guide line */}
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-px bg-white/[0.06]" />

        <canvas
          ref={canvasRef}
          className="w-full h-full relative z-10"
          style={{ width: '100%', height: '100%' }}
        />

        {/* Ambient background glow when active */}
        {isRecording && hasVoiceActivity && (
          <div
            className="absolute inset-0 bg-rose-500/10 blur-xl pointer-events-none transition-opacity duration-300"
            style={{ opacity: Math.min(1, audioLevel * 3) }}
          />
        )}
      </div>

      {/* Real-time Voice Activity & Audio Meter */}
      <div className="w-full flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              'w-2 h-2 rounded-full transition-colors duration-200',
              !isRecording
                ? 'bg-white/20'
                : hasVoiceActivity
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                : 'bg-amber-400/80'
            )}
          />
          <span className="text-white/60 font-medium text-[11px]">
            {!isRecording
              ? 'Mic standby'
              : hasVoiceActivity
              ? 'Voice detected'
              : 'Listening for voice...'}
          </span>
        </div>

        {/* Live level meter bars */}
        <div className="flex items-center gap-1">
          <Volume2
            size={12}
            className={cn(
              'transition-colors',
              isRecording && hasVoiceActivity ? 'text-rose-400' : 'text-white/30'
            )}
          />
          <div className="flex items-center gap-0.5 h-2 w-16 bg-white/10 rounded-full px-0.5 overflow-hidden">
            <div
              className={cn(
                'h-1 rounded-full transition-all duration-75',
                audioLevel > 0.6
                  ? 'bg-rose-500'
                  : audioLevel > 0.3
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              )}
              style={{
                width: isRecording ? `${Math.min(100, Math.max(8, audioLevel * 140))}%` : '0%',
              }}
            />
          </div>
          <span className="text-[10px] text-white/40 tabular-nums font-mono min-w-[28px] text-right">
            {isRecording ? `${Math.round(audioLevel * 100)}%` : '0%'}
          </span>
        </div>
      </div>
    </div>
  );
}
