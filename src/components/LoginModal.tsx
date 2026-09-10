import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onLoginSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    // STRICT USER REQUIREMENTS: user: admin, password: 10509
    if (cleanUser === 'admin' && cleanPass === '10509') {
      try {
        localStorage.setItem('scripture_auth_authenticated', 'true');
        sessionStorage.setItem('scripture_auth_authenticated', 'true');
      } catch (e) {
        // Ignore storage error if disabled
      }
      setIsSubmitting(false);
      onLoginSuccess();
    } else {
      setIsSubmitting(false);
      setErrorMessage('Invalid username or password. Access is restricted to authorized scholars.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#12141f] border border-amber-500/30 rounded-2xl shadow-2xl p-6 sm:p-7 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-400/40 flex items-center justify-center mb-3 text-amber-400 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-white tracking-wide">
            Scripture Graph Access
          </h2>
          <p className="text-xs text-stone-400 mt-1 max-w-xs">
            Sign in with authorized credentials to view and curate the universal scripture constellation.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-stone-300 uppercase tracking-wider block">
              Username
            </label>
            <input
              id="login-username"
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="username"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-stone-500 text-sm focus:outline-none focus:border-amber-400/70 focus:ring-1 focus:ring-amber-400/30 transition-all font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-stone-300 uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder-stone-500 text-sm focus:outline-none focus:border-amber-400/70 focus:ring-1 focus:ring-amber-400/30 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 transition-colors p-1"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            id="btn-submit-login"
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-linear-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium text-sm transition-all shadow-lg shadow-amber-900/30 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Enter Constellation</span>
          </button>
        </form>
      </div>
    </div>
  );
};
