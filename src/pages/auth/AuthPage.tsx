import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

type Step = 'signin' | 'onboarding';

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Argentina','Armenia','Australia',
  'Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium',
  'Belize','Benin','Bolivia','Bosnia','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso',
  'Burundi','Cambodia','Cameroon','Canada','Chile','China','Colombia','Congo','Costa Rica',
  'Croatia','Cuba','Cyprus','Czech Republic','Denmark','Ecuador','Egypt','El Salvador',
  'Estonia','Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia','Germany',
  'Ghana','Greece','Guatemala','Guinea','Haiti','Honduras','Hungary','Iceland','India',
  'Indonesia','Iran','Iraq','Ireland','Israel','Italy','Ivory Coast','Jamaica','Japan',
  'Jordan','Kazakhstan','Kenya','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Liberia',
  'Libya','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Mali','Malta',
  'Mauritania','Mauritius','Mexico','Moldova','Mongolia','Montenegro','Morocco','Mozambique',
  'Myanmar','Namibia','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria',
  'North Korea','Norway','Oman','Pakistan','Palestine','Panama','Paraguay','Peru',
  'Philippines','Poland','Portugal','Qatar','Romania','Russia','Rwanda','Saudi Arabia',
  'Senegal','Serbia','Sierra Leone','Singapore','Slovakia','Slovenia','Somalia',
  'South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Sweden',
  'Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand','Togo','Trinidad',
  'Tunisia','Turkey','Turkmenistan','UAE','Uganda','UK','Ukraine','United Kingdom',
  'Uruguay','USA','Uzbekistan','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
];

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, updateProfile } = useAuth();

  const [step, setStep] = useState<Step>('signin');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [dob, setDob] = useState('');
  const [country, setCountry] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) {
      if (!user.onboarded && !user.country) {
        setDisplayName(user.display_name || '');
        setStep('onboarding');
      } else {
        navigate('/stream', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  const handleGoogleSignIn = async () => {
    setError('');
    setSubmitting(true);
    try {
      await signInWithGoogle();
      // Auth state change will handle routing/onboarding step
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign in failed';
      if (!msg.includes('popup-closed-by-user')) {
        if (msg.includes('auth/unauthorized-domain')) {
          setError(
            `Domain Unauthorized: "${window.location.hostname}" must be added to your Firebase Console under Authentication > Settings > Authorized domains.`
          );
        } else {
          setError(msg);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password) return setError('Enter your email and password');
    if (authMode === 'signup' && password !== confirmPassword) return setError('Passwords do not match');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    setError('');
    setSubmitting(true);
    try {
      if (authMode === 'signup') await signUpWithEmail(email, password);
      else await signInWithEmail(email, password);
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: unknown }).code) : '';
      setError(code === 'auth/invalid-credential' ? 'Email or password is incorrect' : code === 'auth/email-already-in-use' ? 'An account already exists for this email' : 'Authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const completeOnboarding = async () => {
    if (!displayName.trim()) return setError('Enter your display name');
    if (!country) return setError('Select your country');
    setError('');
    setSubmitting(true);

    try {
      await updateProfile({
        display_name: displayName.trim(),
        country,
        date_of_birth: dob || undefined,
        onboarded: true,
      });
      navigate('/stream', { replace: true });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a12]">
        <Loader2 size={24} className="text-white/30 animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a0a12] px-6">
      {/* Ambient gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.12) 0%, transparent 60%)' }}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <svg
            width="22"
            height="15"
            viewBox="0 0 24 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            className="text-white/90"
          >
            <path d="M1 3 Q4 1 7 3 Q10 5 13 3 Q16 1 19 3 Q21 4 23 3" />
            <path d="M1 8 Q4 6 7 8 Q10 10 13 8 Q16 6 19 8 Q21 9 23 8" />
            <path d="M1 13 Q4 11 7 13 Q10 15 13 13 Q16 11 19 13 Q21 14 23 13" />
          </svg>
          <span className="text-white font-bold text-[17px] tracking-tight">Scruttin</span>
        </div>

        {/* Step: Signin */}
        {step === 'signin' && (
          <div>
            <h1 className="text-white font-bold text-2xl mb-1.5 font-serif">Join the conversation.</h1>
            <p className="text-white/40 text-sm mb-8 leading-relaxed">
              Sign in with your Google account to record thoughts, ask questions, and resonate.
            </p>

            <div className="space-y-4">
              <button
                type="button"
                id="google-signin-btn"
                onClick={handleGoogleSignIn}
                disabled={submitting}
                className={cn(
                  'w-full py-3.5 px-4 rounded-2xl font-medium text-sm flex items-center justify-center gap-3 transition-all border border-white/10 bg-white text-black hover:bg-white/95 active:scale-[0.98]',
                  submitting && 'opacity-60 cursor-not-allowed'
                )}
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin text-black" />
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.93 6.72-4.93z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-3 text-white/20 text-[10px] uppercase tracking-widest"><span className="h-px flex-1 bg-white/10" />or<span className="h-px flex-1 bg-white/10" /></div>
              <div className="space-y-3">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" autoComplete="email" className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-white/30" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-white/30" />
                {authMode === 'signup' && <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" autoComplete="new-password" className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-white/30" />}
                <button type="button" onClick={handleEmailAuth} disabled={submitting} className="w-full py-3.5 rounded-2xl font-medium text-sm bg-white/10 text-white hover:bg-white/15 transition-colors disabled:opacity-50">{authMode === 'signup' ? 'Create account with email' : 'Sign in with email'}</button>
                <button type="button" onClick={() => { setAuthMode(authMode === 'signup' ? 'signin' : 'signup'); setError(''); }} className="w-full text-white/40 hover:text-white/70 text-xs transition-colors">{authMode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create an account'}</button>
              </div>
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center">
                  {error}
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-white/5">
              <p className="text-white/30 text-xs leading-relaxed text-center">
                By continuing, you enter a calm audio-first space protected by Firebase authentication and zero-outrage principles.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-6 flex items-center gap-1.5 text-white/30 hover:text-white/60 text-xs transition-colors mx-auto"
            >
              <ArrowLeft size={12} /> Back to home
            </button>
          </div>
        )}

        {/* Step: Onboarding */}
        {step === 'onboarding' && (
          <div>
            <h1 className="text-white font-bold text-2xl mb-1.5 font-serif">Welcome to Scruttin.</h1>
            <p className="text-white/40 text-sm mb-8 leading-relaxed">
              Tell us how you'd like your voice to be introduced.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-white/40 text-[10px] uppercase tracking-widest font-medium block mb-1.5">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    setError('');
                  }}
                  placeholder="How should people know you?"
                  className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>
              <div>
                <label className="text-white/40 text-[10px] uppercase tracking-widest font-medium block mb-1.5">
                  Country *
                </label>
                <select
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setError('');
                  }}
                  className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-colors appearance-none"
                  style={{ color: country ? 'white' : 'rgba(255,255,255,0.25)' }}
                >
                  <option value="" disabled style={{ background: '#0a0a12' }}>
                    Where are you from?
                  </option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c} style={{ background: '#0a0a12', color: 'white' }}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-white/40 text-[10px] uppercase tracking-widest font-medium block mb-1.5">
                  Date of Birth <span className="normal-case text-white/20">(optional)</span>
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-colors"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              {error && <p className="text-rose-400 text-xs">{error}</p>}
              <button
                type="button"
                onClick={completeOnboarding}
                disabled={submitting || !displayName.trim() || !country}
                className={cn(
                  'w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all mt-2',
                  displayName.trim() && country && !submitting
                    ? 'bg-white text-black hover:bg-white/90'
                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                )}
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    Enter the stream <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
