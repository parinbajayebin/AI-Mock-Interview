import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login, handleGoogleCallback } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  // Initialize Google Sign-In Button
  useEffect(() => {
    let checkInterval;
    
    const initializeGoogleAuth = async () => {
      try {
        const res = await fetch('/api/auth/google/config');
        const data = await res.json();
        
        if (!data.client_id) {
          console.warn("Google Client ID not configured in backend");
          return;
        }

        // Poll every 100ms for window.google to be loaded by index.html script tag
        checkInterval = setInterval(() => {
          if (window.google) {
            clearInterval(checkInterval);
            
            window.google.accounts.id.initialize({
              client_id: data.client_id,
              callback: handleGoogleCredentialResponse,
              auto_select: false
            });
            
            window.google.accounts.id.renderButton(
              document.getElementById("google-signin-btn"),
              { 
                theme: "filled_dark", 
                size: "large", 
                width: "100%", 
                text: "signin_with",
                shape: "rectangular"
              }
            );
          }
        }, 100);
      } catch (err) {
        console.error("Google Auth initialization error:", err);
      }
    };
    
    initializeGoogleAuth();
    
    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []);

  const handleGoogleCredentialResponse = async (response) => {
    try {
      setIsSubmitLoading(true);
      setAuthError('');
      // Send verified google credential JWT to backend
      await handleGoogleCallback(response.credential);
      navigate('/');
    } catch (err) {
      setAuthError(err.message || 'Google verification failed.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

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
      setAuthError(err.message || 'Incorrect email or password.');
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

        {/* Google OAuth Login Button Target */}
        <div className="w-full flex justify-center mb-6">
          <div id="google-signin-btn" className="w-full min-h-[44px]"></div>
        </div>

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
