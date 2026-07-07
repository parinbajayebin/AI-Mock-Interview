import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';

export default function Login() {
  const { login, loginWithGoogle, logout } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Clear stale session on mount + trigger entrance animation
  useEffect(() => {
    logout();
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const handleStandardSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please fill in all credentials');
      return;
    }
    
    try {
      setIsSubmitLoading(true);
      setAuthError('');
      await login(email, password);
      navigate('/');
    } catch (err) {
      let customError = 'Incorrect email or password.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        customError = 'Invalid email address or password.';
      } else if (err.code === 'auth/too-many-requests') {
        customError = 'Account temporarily locked due to too many failed attempts. Try again later.';
      } else if (err.message) {
        customError = err.message;
      }
      setAuthError(customError);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsSubmitLoading(true);
      setAuthError('');
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      setAuthError(err.message || 'Google verification failed.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* ── Floating decorative orbs for layered depth ── */}
      <div className="fixed top-[10%] left-[8%] w-72 h-72 bg-teal-400/10 rounded-full blur-3xl animate-float pointer-events-none z-0" />
      <div className="fixed bottom-[15%] right-[10%] w-96 h-96 bg-blue-400/8 rounded-full blur-3xl animate-float pointer-events-none z-0" style={{ animationDelay: '-2s' }} />
      <div className="fixed top-[50%] right-[25%] w-48 h-48 bg-rose-300/8 rounded-full blur-3xl animate-float pointer-events-none z-0" style={{ animationDelay: '-4s' }} />

      {/* ── Content ── */}
      <div className={`w-full max-w-[420px] relative z-10 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* Brand Mark */}
        <div className={`flex items-center justify-center gap-2 mb-6 transition-all duration-500 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md shadow-teal-500/10">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-[14px] tracking-tight text-primary">
            InterviewSignal
          </span>
        </div>

        {/* Heading */}
        <div className={`text-center mb-6 transition-all duration-600 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h1 className="font-display text-[42px] leading-[1.05] font-black tracking-tight bg-gradient-to-r from-slate-900 via-teal-950 to-slate-800 bg-clip-text text-transparent">
            Welcome back
          </h1>
          <p className="text-secondary text-[14px] mt-2.5 max-w-[300px] mx-auto leading-relaxed">
            Practice mock interviews with real-time feedback
          </p>
        </div>

        {/* Form Card — Frosted Glass */}
        <div className={`glass-panel rounded-signal-xl p-7 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-[0.97]'}`}>
          
          {/* Error Alert */}
          {authError && (
            <div className="mb-5 p-3.5 rounded-signal-md bg-red-50 border border-red-200 flex items-start gap-3 animate-scale-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span className="text-[13px] text-red-700 leading-snug">{authError}</span>
            </div>
          )}

          <form onSubmit={handleStandardSubmit} className="space-y-4">
            {/* Email */}
            <div className="group">
              <label className="block text-primary/80 text-[13px] font-medium mb-1.5 group-focus-within:text-accent transition-colors">
                Email address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-input py-2.5 px-3.5 rounded-signal-md text-[14px]"
                required
                id="login-email"
              />
            </div>

            {/* Password */}
            <div className="group">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-primary/80 text-[13px] font-medium group-focus-within:text-accent transition-colors">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[12px] text-accent hover:text-accent/70 transition-colors font-medium hover:underline underline-offset-2"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full glass-input py-2.5 px-3.5 pr-11 rounded-signal-md text-[14px]"
                  required
                  id="login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-all duration-200 hover:scale-115 active:scale-90 p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitLoading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 text-[14px] mt-2 group"
              id="login-submit"
            >
              {isSubmitLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white/90 px-3 text-[11px] text-muted font-medium uppercase tracking-wider">
                or
              </span>
            </div>
          </div>

          {/* Discreet Google Button */}
          <div className="flex justify-center">
            <button
              onClick={handleGoogleLogin}
              disabled={isSubmitLoading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white/70 hover:bg-white border border-border hover:border-border/80 rounded-full text-[13px] font-semibold text-secondary hover:text-primary transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-95 group"
              id="login-google"
            >
              <svg className="w-4.5 h-4.5 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        </div>

        {/* Footer link */}
        <p className={`text-center text-secondary text-[13px] mt-5 transition-all duration-500 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-accent font-semibold hover:text-accent/70 transition-colors hover:underline underline-offset-2"
          >
            Create one →
          </Link>
        </p>
      </div>
    </div>
  );
}
