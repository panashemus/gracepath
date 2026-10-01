import { useState, useEffect, type FormEvent } from 'react';
import { X, Mail, Lock, Sparkles, Loader2, AlertCircle, AtSign } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { isSupabaseConfigured } from '../lib/supabase';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  title?: string;
  subtitle?: string;
}

export default function AuthModal({
  open,
  onClose,
  initialMode = 'signup',
  title,
  subtitle,
}: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; username?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError(null);
      setFieldErrors({});
      setEmail('');
      setPassword('');
      setUsername('');
    }
  }, [open, initialMode]);

  if (!open) return null;

  const validate = (): boolean => {
    const errors: { email?: string; password?: string; username?: string } = {};
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (mode === 'signup' && username) {
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errors.username = 'Only letters, numbers, and underscores';
      } else if (username.length < 3) {
        errors.username = 'At least 3 characters';
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setSubmitting(true);
    const result = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password, username);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      onClose();
    }
  };

  const defaultTitle = mode === 'signin' ? 'Welcome Back' : 'Create Your Account';
  const defaultSubtitle = mode === 'signin'
    ? 'Sign in to access your prayers and journal'
    : 'Join GracePath to save your prayers and track your spiritual journey';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-950/40 backdrop-blur-sm animate-fade-in">
      <div className="relative mx-4 w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl animate-scale-in">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-champagne-50">
            <Sparkles className="h-7 w-7 text-champagne-500" />
          </div>
          <h2 className="text-2xl font-semibold text-ink-900">{title ?? defaultTitle}</h2>
          <p className="mt-2 text-sm text-ink-500">{subtitle ?? defaultSubtitle}</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Authentication is temporarily unavailable. Please try again later.</span>
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 animate-fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Username <span className="text-ink-400">(optional)</span></label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (fieldErrors.username) setFieldErrors((p) => ({ ...p, username: undefined }));
                  }}
                  placeholder="your_handle"
                  className={`input-field !pl-10 ${fieldErrors.username ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : ''}`}
                  disabled={submitting}
                  autoComplete="username"
                />
              </div>
              {fieldErrors.username ? (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.username}</p>
              ) : (
                <p className="mt-1 text-xs text-ink-400">Letters, numbers, underscores. Used in the community.</p>
              )}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                }}
                placeholder="you@example.com"
                className={`input-field !pl-10 ${fieldErrors.email ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : ''}`}
                disabled={submitting}
                autoComplete="email"
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                }}
                placeholder="At least 6 characters"
                className={`input-field !pl-10 ${fieldErrors.password ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : ''}`}
                disabled={submitting}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || !isSupabaseConfigured}
            className="btn-gold w-full text-sm disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {submitting
              ? 'Please wait...'
              : mode === 'signin'
              ? 'Sign In'
              : 'Create Account'}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-ink-500">
          {mode === 'signin' ? (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => { setMode('signup'); setError(null); setFieldErrors({}); }}
                className="font-medium text-champagne-600 transition-colors hover:text-champagne-700"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => { setMode('signin'); setError(null); setFieldErrors({}); }}
                className="font-medium text-champagne-600 transition-colors hover:text-champagne-700"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
