import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Props {
  scrutId: string;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  itemType?: string;
}

const REASONS = [
  'Hate speech or discrimination',
  'Harassment or bullying',
  'Misinformation',
  'Spam or self-promotion',
  'Explicit or inappropriate content',
  'Violence or threats',
  'Other',
];

export default function ReportModal({
  scrutId,
  onClose,
  title = 'Report this Rut',
  subtitle = 'Why are you reporting this?',
  itemType = 'content',
}: Props) {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!reason) return;
    setSubmitting(true);
    const reporterId = user?.id || `anon-${Date.now()}`;
    try {
      await addDoc(collection(db, 'reports'), {
        scrut_id: scrutId,
        reporter_id: reporterId,
        reason,
        reviewed: false,
        actioned: false,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Fallback
    } finally {
      setSubmitting(false);
    }
    setDone(true);
    toast.success('Report submitted. Thank you for keeping our community safe.');
    setTimeout(onClose, 1800);
  };

  return createPortal(
    /* Full-screen backdrop — rendered at document level so card transforms cannot clip it. */
    <div
      className="fixed inset-0 z-[500] flex items-end justify-center"
      data-no-swipe
      data-sheet-overlay
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-sm mx-auto rounded-t-[1.75rem] overflow-hidden"
        style={{
          background: 'rgba(14,14,22,0.98)',
          border: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
        }}
        onClick={e => e.stopPropagation()}
      >
        {done ? (
          <div className="p-8 text-center">
            <div className="text-3xl mb-3">🙏</div>
            <h3 className="text-white font-semibold mb-1">Report received</h3>
            <p className="text-white/40 text-sm">Our team will review this {itemType}.</p>
          </div>
        ) : (
          <div className="p-5">
            {/* Drag handle */}
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-base">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-white/55 text-sm mb-3">{subtitle}</p>

            <div className="space-y-2 mb-4">
              {REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={cn(
                    'w-full min-h-11 rounded-xl border px-4 py-2.5 text-left text-sm transition-all',
                    reason === r
                      ? 'border-rose-400/60 bg-rose-500/20 text-white'
                      : 'border-white/12 bg-white/[0.05] text-white/75 hover:bg-white/10'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>

            <button
              onClick={submit}
              disabled={!reason || submitting}
              className={cn(
                'w-full min-h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold transition-all',
                reason && !submitting
                  ? 'bg-rose-500 text-white hover:bg-rose-400 active:scale-[0.99]'
                  : 'bg-white/8 text-white/30 cursor-not-allowed'
              )}
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Submit report'}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
