/**
 * ComposeModal — contextual composer with live topics from DB + GIF/sticker attachment.
 */
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Mic2, Type, ArrowRight, Loader2, RotateCcw, Image as ImageIcon, Sparkles } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import { createFirestoreScrut, createFirestoreConversation, fetchFirestoreTopics } from '@/lib/firestoreService';
import { useAuth } from '@/contexts/AuthContext';
import RecordingModal from './RecordingModal';
import GifPickerModal from './GifPickerModal';
import ImagePickerModal from './ImagePickerModal';
import { toast } from 'sonner';
import type { ConversationStarter } from '@/types';

type Mode = 'question' | 'statement' | 'open';
type Format = 'voice' | 'text';

interface Props {
  onClose: () => void;
  defaultMode?: Mode;
  contextConversation?: ConversationStarter;
  onPosted?: () => void;
}

const DEFAULT_TOPICS = ['Life', 'Relationships', 'Work', 'Money', 'Technology', 'Culture', 'Family', 'Society', 'Fun'];

export default function ComposeModal({ onClose, defaultMode = 'question', contextConversation, onPosted }: Props) {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [format, setFormat] = useState<Format>('text');
  const [body, setBody] = useState('');
  const [topic, setTopic] = useState('Life');
  const [position, setPosition] = useState<'agree' | 'unsure' | 'disagree' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showRecording, setShowRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [topics, setTopics] = useState<string[]>(DEFAULT_TOPICS);

  // Attachment state
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const attachInputRef = useRef<HTMLInputElement>(null);

  const isAttachmentGif = attachmentUrl
    ? attachmentUrl.toLowerCase().includes('.gif') ||
      attachmentUrl.toLowerCase().includes('giphy') ||
      attachmentUrl.toLowerCase().includes('tenor')
    : false;

  // Load topics from Firestore
  useEffect(() => {
    fetchFirestoreTopics().then((dbTopics) => {
      if (dbTopics && dbTopics.length > 0) {
        setTopics(dbTopics);
        setTopic(dbTopics[0]);
      }
    });
  }, []);

  const isResponse = !!contextConversation;
  const isStarter = !isResponse && mode !== 'open';

  const sheetTitle =
    isResponse
      ? contextConversation.type === 'statement' ? 'Drop your response' : 'Drop your answer'
      : mode === 'question' ? 'Ask the crowd'
      : mode === 'statement' ? 'Make a statement'
      : 'Drop a Rut';

  const handleAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 4 * 1024 * 1024) { toast.error('Attachment must be under 4 MB'); return; }
    setAttachmentUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentUrl(reader.result as string);
      setAttachmentUploading(false);
    };
    reader.onerror = () => {
      toast.error('Failed to read image');
      setAttachmentUploading(false);
    };
    reader.readAsDataURL(file);
    // Clear input so same file can be re-selected if user removes and re-adds
    if (attachInputRef.current) attachInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!user) return toast.error('Sign in to post');
    if (format === 'text' && !body.trim()) return;
    if (format === 'voice' && !audioUrl) return toast.error('Record your take first');

    setSubmitting(true);

    try {
      const userObj = {
        id: user.id,
        display_name: user.display_name,
        avatar_url: user.avatar_url || '',
        country: user.country || 'Global',
        city: user.city,
        bio: user.bio,
      };

      if (isResponse && contextConversation) {
        await createFirestoreScrut({
          userId: user.id,
          user: userObj,
          conversationId: contextConversation.id,
          type: format,
          text: format === 'text' ? body.trim() : undefined,
          audioUrl: format === 'voice' ? audioUrl || undefined : undefined,
          audioDuration: format === 'voice' ? audioDuration || undefined : undefined,
          position: contextConversation.type === 'statement' ? position : null,
          attachmentUrl: attachmentUrl ?? undefined,
        });
      } else if (mode === 'open') {
        await createFirestoreScrut({
          userId: user.id,
          user: userObj,
          type: format,
          text: format === 'text' ? body.trim() : undefined,
          audioUrl: format === 'voice' ? audioUrl || undefined : undefined,
          audioDuration: format === 'voice' ? audioDuration || undefined : undefined,
          attachmentUrl: attachmentUrl ?? undefined,
        });
      } else {
        await createFirestoreConversation({
          userId: user.id,
          user: userObj,
          body: body.trim(),
          topic,
          type: mode,
          isPlatform: false,
        });
      }
    } catch (err: unknown) {
      console.warn('Firestore write warning:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to publish');
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setSubmitted(true);
    onPosted?.();
    setTimeout(onClose, 2000);
  };

  const placeholder =
    isResponse
      ? contextConversation?.type === 'statement' ? 'Share your stance…' : 'Give your answer…'
      : mode === 'question' ? 'What do you want to ask the world?'
      : mode === 'statement' ? 'Put something to the world…'
      : "What's on your mind? Drop a Rut…";

  const submitLabel =
    isResponse ? 'Drop a Rut'
    : mode === 'question' ? 'Ask'
    : mode === 'statement' ? 'State'
    : 'Drop a Rut';

  if (!user) {
    return createPortal(
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" data-no-swipe data-sheet-overlay>
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
        <div className="relative glass rounded-3xl w-full max-w-sm p-6 sm:p-7 text-center shadow-2xl border border-white/15">
          <div className="text-4xl mb-3">🎙</div>
          <h3 className="text-white font-semibold text-lg mb-2">Sign in to post</h3>
          <p className="text-white/50 text-sm mb-6 leading-relaxed">Join Scruttin to give your take and ask questions.</p>
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => { onClose(); window.location.href = '/auth'; }}
              className="w-full py-3 rounded-2xl bg-white text-black font-semibold text-sm hover:bg-white/90 active:scale-[0.98] transition-all shadow-md"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-2xl text-white/50 hover:text-white text-xs font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  if (submitted) {
    return createPortal(
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" data-no-swipe data-sheet-overlay>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div className="relative glass rounded-3xl p-8 text-center max-w-xs w-full shadow-2xl border border-white/15">
          <div className="text-4xl mb-4">{isResponse ? '💬' : mode === 'question' ? '🎙' : mode === 'statement' ? '📣' : '💬'}</div>
          <h3 className="text-white font-semibold text-lg mb-2">
            {isResponse ? 'Your take is out there.'
              : mode === 'question' ? 'Your question is in the crowd.'
              : mode === 'statement' ? "It's out there."
              : 'Said.'}
          </h3>
          {isResponse && contextConversation && (
            <p className="text-white/40 text-sm">
              Added to "{contextConversation.body.slice(0, 48)}{contextConversation.body.length > 48 ? '…' : ''}"
            </p>
          )}
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <>
      {/* z-[500] — above BottomNav and page content, below report modal (z-[600]) */}
      <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-0 sm:p-4" data-no-swipe data-sheet-overlay>
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
        <div
          className="relative glass max-h-[calc(100dvh-0.5rem)] w-full overflow-y-auto overscroll-contain rounded-t-3xl sm:max-w-md sm:rounded-3xl"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-semibold text-base">{sheetTitle}</h3>
                {isStarter && (
                  <p className="text-white/30 text-[11px] mt-0.5">Goes to From the Crowd</p>
                )}
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
                <X size={18} />
              </button>
            </div>

            {/* Context pill */}
            {isResponse && contextConversation && (
              <div className="mb-4 flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/8">
                <div className="shrink-0 w-0.5 self-stretch bg-white/20 rounded-full mt-0.5" style={{ minHeight: 20 }} />
                <div className="flex-1 min-w-0">
                  <p className="text-white/35 text-[10px] uppercase tracking-widest font-medium mb-0.5">
                    {contextConversation.is_platform ? 'Scruttin asks'
                      : contextConversation.type === 'statement' ? 'Statement'
                      : `${contextConversation.user.display_name} asks`}
                  </p>
                  <p className="text-white/70 text-[13px] font-serif leading-snug line-clamp-2 italic">
                    {contextConversation.type === 'statement'
                      ? `"${contextConversation.body}"`
                      : contextConversation.body}
                  </p>
                </div>
              </div>
            )}

            {/* Mode tabs — only Ask and State for crowd starters (no 'open') */}
            {isStarter && (
              <div className="flex gap-1 mb-4 p-1 bg-white/5 rounded-xl">
                {(['question', 'statement'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMode(m);
                      setFormat('text');
                      setAttachmentUrl(null);
                    }}
                    className={cn(
                      'flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all',
                      mode === m ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/60'
                    )}
                  >
                    {m === 'question' ? 'Ask' : 'State'}
                  </button>
                ))}
              </div>
            )}

            {/* Statement stance */}
            {isResponse && contextConversation?.type === 'statement' && (
              <div className="mb-4">
                <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2 font-medium">Your stance</p>
                <div className="flex gap-2">
                  {[{ value: 'agree', label: 'Agree' }, { value: 'unsure', label: 'Unsure' }, { value: 'disagree', label: 'Disagree' }].map(opt => (
                    <button key={opt.value}
                      onClick={() => setPosition(opt.value as 'agree' | 'unsure' | 'disagree')}
                      className={cn('flex-1 py-1.5 rounded-full border text-xs font-medium transition-all',
                        position === opt.value ? 'bg-white/15 border-white/30 text-white' : 'border-white/12 bg-white/5 text-white/50 hover:bg-white/10')}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Format toggle — only for responses / open takes, NOT on the ask sheet */}
            {!isStarter && (
              <div className="flex gap-2 mb-4">
                {(['text', 'voice'] as Format[]).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-all',
                      format === f ? 'border-white/25 bg-white/10 text-white' : 'border-white/8 bg-white/4 text-white/40 hover:bg-white/8 hover:text-white/70'
                    )}
                  >
                    {f === 'voice' ? <><Mic2 size={12} /> Voice</> : <><Type size={12} /> Text</>}
                  </button>
                ))}
              </div>
            )}

            {/* Text input + attachment */}
            {(isStarter || format === 'text') && (
              <>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder={placeholder}
                  rows={3}
                  maxLength={300}
                  className="w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-2xl p-3 text-white placeholder-[rgba(255,255,255,0.25)] text-sm resize-none focus:outline-none focus:border-[rgba(255,255,255,0.25)] font-serif leading-relaxed"
                />
                {/* Attached media preview (only for responses / open takes) */}
                {!isStarter && attachmentUrl && (
                  <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black/40 mt-2 mb-3 group/attached">
                    <img
                      src={attachmentUrl}
                      alt="attached media"
                      className="w-full h-40 sm:h-48 object-cover sm:object-contain bg-black/60"
                    />
                    {/* Badge */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      {isAttachmentGif ? (
                        <span className="px-2 py-0.5 rounded-md bg-purple-600/90 backdrop-blur-md text-white font-bold text-[10px] tracking-wider uppercase shadow-md">
                          GIF
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-600/90 backdrop-blur-md text-white font-semibold text-[10px] tracking-wider uppercase shadow-md flex items-center gap-1">
                          <ImageIcon size={10} /> Photo
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => (isAttachmentGif ? setShowGifPicker(true) : setShowImagePicker(true))}
                        className="px-2.5 py-1 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md text-white/80 hover:text-white border border-white/15 text-[11px] font-medium transition-all"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttachmentUrl(null)}
                        className="p-1.5 rounded-full bg-black/70 hover:bg-rose-500/80 backdrop-blur-md text-white/80 hover:text-white border border-white/15 transition-all"
                        title="Remove attachment"
                        aria-label="Remove attachment"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-1 mb-4">
                  <span className="text-white/25 text-[10px]">{body.length} / 300</span>
                  {/* Modern social attachment controls — only for responses / open takes */}
                  {!isStarter && (
                    <div className="flex items-center gap-2">
                      {attachmentUploading && (
                        <div className="flex items-center gap-1.5 text-xs text-white/50">
                          <Loader2 size={12} className="animate-spin text-white/70" />
                          <span>Uploading...</span>
                        </div>
                      )}

                      {!attachmentUploading && (
                        <>
                          {/* GIF Picker Button */}
                          <button
                            type="button"
                            onClick={() => setShowGifPicker(true)}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 shadow-sm',
                              attachmentUrl && isAttachmentGif
                                ? 'border-purple-400/50 bg-purple-500/20 text-purple-200 ring-1 ring-purple-400/40'
                                : 'border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300'
                            )}
                            title="Attach reaction GIF"
                          >
                            <span className="px-1 py-0.2 rounded bg-purple-400 text-black font-black text-[9px] uppercase tracking-wider">
                              GIF
                            </span>
                            <span>{attachmentUrl && isAttachmentGif ? 'GIF Added' : 'GIF'}</span>
                          </button>

                          {/* Image / Photo Picker Button */}
                          <button
                            type="button"
                            onClick={() => setShowImagePicker(true)}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 shadow-sm',
                              attachmentUrl && !isAttachmentGif
                                ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/40'
                                : 'border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300'
                            )}
                            title="Attach photo or image"
                          >
                            <ImageIcon size={13} className="text-emerald-400" />
                            <span>{attachmentUrl && !isAttachmentGif ? 'Photo Added' : 'Photo'}</span>
                          </button>

                          {/* Hidden file input for custom uploads */}
                          <input
                            ref={attachInputRef}
                            type="file"
                            accept="image/gif,image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={handleAttachment}
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Voice recording — only for responses / open takes */}
            {!isStarter && format === 'voice' && (
              <div className="mb-4">
                {audioUrl ? (
                  <div className="space-y-2 p-3 bg-[rgba(255,255,255,0.05)] rounded-2xl border border-[rgba(255,255,255,0.1)]">
                    <div className="flex items-center justify-between text-xs px-1">
                      <div className="flex items-center gap-1.5 text-rose-400 font-medium">
                        <Mic2 size={13} />
                        <span>Voice take recorded</span>
                      </div>
                      {audioDuration ? (
                        <span className="font-mono text-white/50">{formatDuration(audioDuration)}</span>
                      ) : null}
                    </div>
                    <audio src={audioUrl} controls className="w-full h-8 opacity-80" style={{ filter: 'invert(1)' }} />
                    <button
                      type="button"
                      onClick={() => { setAudioUrl(null); setAudioDuration(null); setShowRecording(true); }}
                      className="w-full py-1.5 text-white/50 hover:text-white text-xs transition-colors flex items-center justify-center gap-1.5 rounded-lg hover:bg-white/5"
                    >
                      <RotateCcw size={12} /> Re-record take
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setShowRecording(true)}
                    className="w-full py-3 rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] text-white/60 hover:bg-[rgba(255,255,255,0.1)] text-sm flex items-center justify-center gap-2 transition-colors">
                    <Mic2 size={15} className="text-rose-400" />
                    Tap to record
                  </button>
                )}
              </div>
            )}

            {/* Topics */}
            {isStarter && topics.length > 0 && (
              <div className="mb-4">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-2 font-medium">Topic</p>
                <div className="flex flex-wrap gap-1.5">
                  {topics.map(t => (
                    <button key={t} onClick={() => setTopic(t)}
                      className={cn('px-2.5 py-1 rounded-full text-xs transition-all',
                        topic === t ? 'bg-white/15 text-white border border-white/25' : 'bg-white/5 text-white/40 border border-white/8 hover:bg-white/10 hover:text-white/70')}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || (format === 'text' ? !body.trim() : !audioUrl)}
              className={cn(
                'w-full py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 mb-2',
                (format === 'text' ? body.trim() : audioUrl) && !submitting
                  ? 'bg-white text-black hover:bg-white/90 active:scale-[0.98]'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              )}>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <>{submitLabel} <ArrowRight size={15} /></>}
            </button>
          </div>
        </div>
      </div>

      {showRecording && (
        <RecordingModal
          onRecorded={(url, dur) => { setAudioUrl(url); setAudioDuration(dur); setShowRecording(false); }}
          onCancel={() => setShowRecording(false)}
        />
      )}

      {showGifPicker && (
        <GifPickerModal
          onSelect={(url) => setAttachmentUrl(url)}
          onClose={() => setShowGifPicker(false)}
          onUploadCustom={() => attachInputRef.current?.click()}
        />
      )}

      {showImagePicker && (
        <ImagePickerModal
          onSelect={(url) => setAttachmentUrl(url)}
          onUploadFile={() => attachInputRef.current?.click()}
          onClose={() => setShowImagePicker(false)}
        />
      )}
    </>,
    document.body
  );
}
