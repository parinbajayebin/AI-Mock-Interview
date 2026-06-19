import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login, loginWithGoogle, logout } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  // Clear stale session on mount
  useEffect(() => {
    logout();
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
    <div className="min-h-screen bg-animate-gradient flex items-center justify-center p-4">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold font-sans tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Sign in to continue your mock interview preparation
          </p>
        </div>

        {authError && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleStandardSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 glass-input py-2.5 rounded-lg"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
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
                className="w-full pl-4 pr-10 glass-input py-2.5 rounded-lg"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitLoading}
            className="w-full btn-primary flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitLoading ? (
              <span className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="relative my-8 text-center">
          <hr className="border-slate-800" />
          <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#090d16] px-3 text-xs text-slate-500 font-semibold uppercase">
            Or Use Social Sign-in
          </span>
        </div>

        {/* Custom Google login button */}
        <button
          onClick={handleGoogleLogin}
          disabled={isSubmitLoading}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-850 py-2.5 rounded-lg text-sm font-semibold text-slate-200 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.2-5.136 4.2A5.626 5.626 0 0 1 8.35 13a5.626 5.626 0 0 1 5.64-5.6c1.478 0 2.822.56 3.84 1.48L20.88 5.83A9.554 9.554 0 0 0 13.99 3c-5.26 0-9.64 4.01-9.64 9s4.38 9 9.64 9c5.06 0 9.22-3.8 9.22-9 0-.61-.06-1.18-.17-1.715H12.24z"/>
          </svg>
          <span>Sign In with Google</span>
        </button>

        <p className="text-center text-slate-400 text-sm mt-6">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
