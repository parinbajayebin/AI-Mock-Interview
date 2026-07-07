import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowLeft, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';

export default function ForgotPassword() {
  const { sendForgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      setIsLoading(true);
      await sendForgotPassword(email);
      setSuccessMsg('Password reset link sent! Please check your inbox.');
    } catch (err) {
      let customError = 'Unable to trigger password recovery. Please verify your email.';
      if (err.code === 'auth/user-not-found') {
        customError = 'No account found with this email address.';
      } else if (err.code === 'auth/invalid-email') {
        customError = 'Invalid email address format.';
      } else if (err.message) {
        customError = err.message;
      }
      setErrorMsg(customError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* ── Floating decorative orbs for depth ── */}
      <div className="fixed top-[10%] left-[8%] w-72 h-72 bg-teal-400/10 rounded-full blur-3xl animate-float pointer-events-none z-0" />
      <div className="fixed bottom-[15%] right-[10%] w-96 h-96 bg-blue-400/8 rounded-full blur-3xl animate-float pointer-events-none z-0" style={{ animationDelay: '-2s' }} />

      <div className={`w-full max-w-[420px] relative z-10 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        
        {/* Brand Mark */}
        <div className={`flex items-center justify-center gap-2 mb-6 transition-all duration-500 delay-100 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md shadow-teal-500/10">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-[14px] tracking-tight text-primary">InterviewSignal</span>
        </div>

        {/* Heading */}
        <div className={`text-center mb-6 transition-all duration-600 delay-200 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <h1 className="font-display text-[42px] leading-[1.05] font-black tracking-tight bg-gradient-to-r from-slate-900 via-teal-950 to-slate-800 bg-clip-text text-transparent">Reset password</h1>
          <p className="text-secondary text-[14px] mt-2.5 max-w-[300px] mx-auto leading-relaxed">
            Enter your email and we'll send you a recovery link
          </p>
        </div>

        {/* Form Card */}
        <div className={`glass-panel rounded-signal-xl p-7 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-signal-md bg-red-50 border border-red-200 flex items-start gap-3 animate-scale-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span className="text-[13px] text-red-700 leading-snug">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-signal-md bg-emerald-50 border border-emerald-200 flex items-start gap-3 animate-scale-in">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
              <span className="text-[13px] text-emerald-700 leading-snug">{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              />
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 text-[14px] group">
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Send recovery link</span>
              )}
            </button>
          </form>

          <div className="text-center mt-5">
            <Link to="/login" className="inline-flex items-center gap-2 text-[13px] text-secondary hover:text-primary transition-colors font-medium group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
              <span>Back to sign in</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
