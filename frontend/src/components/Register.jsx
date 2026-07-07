import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, ArrowLeft, ArrowRight, Sparkles, CheckCircle } from 'lucide-react';

export default function Register() {
  const { register, loginWithGoogle, logout } = useAuth();
  const navigate = useNavigate();

  // Wizard state: 1 = Signup Form, 2 = Verification Message
  const [step, setStep] = useState(1);

  // Form inputs
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI feedback & loaders
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Clear stale session on mount
  useEffect(() => {
    logout();
    requestAnimationFrame(() => setMounted(true));
  }, []);

  // Evaluate Password Strength
  const evaluatePasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-gray-200', percent: 'w-0' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) {
      return { score, label: 'Weak', color: 'bg-red-400', percent: 'w-1/3' };
    } else if (score <= 4) {
      return { score, label: 'Medium', color: 'bg-amber-400', percent: 'w-2/3' };
    } else {
      return { score, label: 'Strong', color: 'bg-emerald-400', percent: 'w-full' };
    }
  };

  const strength = evaluatePasswordStrength(password);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Name validation: letters, spaces, hyphens, apostrophes only, min 2 chars, max 50 chars
    const nameRegex = /^[a-zA-Z\s'-]{2,50}$/;
    if (!nameRegex.test(fullName.trim())) {
      setErrorMsg('Full Name must contain only letters, spaces, hyphens, or apostrophes (2-50 characters)');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long');
      return;
    }

    if (strength.score <= 2) {
      setErrorMsg('Please enter a stronger password containing numbers, capital letters, and symbols');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      await register(fullName, email, password);
      setSuccessMsg('Account created successfully! A verification link has been sent to your email.');
      setStep(2); // Advance to email verification instructions screen
    } catch (err) {
      let customError = 'Registration failed. Please check your credentials.';
      if (err.code === 'auth/email-already-in-use') {
        customError = 'An account with this email address already exists.';
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

  const handleGoogleSignup = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      setErrorMsg(err.message || 'Google registration failed.');
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

        {step === 1 ? (
          <>
            {/* Heading */}
            <div className={`text-center mb-6 transition-all duration-600 delay-200 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
              <h1 className="font-display text-[42px] leading-[1.05] font-black tracking-tight bg-gradient-to-r from-slate-900 via-teal-950 to-slate-800 bg-clip-text text-transparent">Create account</h1>
              <p className="text-secondary text-[14px] mt-2.5 leading-relaxed">Register to start your interview prep journey</p>
            </div>

            <div className={`glass-panel rounded-signal-xl p-7 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              {errorMsg && (
                <div className="mb-5 p-3.5 rounded-signal-md bg-red-50 border border-red-200 flex items-start gap-3 animate-scale-in">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                  <span className="text-[13px] text-red-700 leading-snug">{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="group">
                  <label className="block text-primary/80 text-[13px] font-medium mb-1.5 group-focus-within:text-accent transition-colors">Full Name</label>
                  <input type="text" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="w-full glass-input py-2.5 px-3.5 rounded-signal-md text-[14px]" required />
                </div>

                <div className="group">
                  <label className="block text-primary/80 text-[13px] font-medium mb-1.5 group-focus-within:text-accent transition-colors">Email Address</label>
                  <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full glass-input py-2.5 px-3.5 rounded-signal-md text-[14px]" required />
                </div>

                <div className="group">
                  <label className="block text-primary/80 text-[13px] font-medium mb-1.5 group-focus-within:text-accent transition-colors">Password</label>
                  <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full glass-input py-2.5 px-3.5 rounded-signal-md text-[14px]" required />
                  {password && (
                    <div className="mt-2.5 space-y-1.5">
                      <div className="flex justify-between text-[11px] font-medium">
                        <span className="text-secondary">Strength:</span>
                        <span className={strength.score <= 2 ? "text-red-500" : strength.score <= 4 ? "text-amber-500" : "text-emerald-500"}>{strength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${strength.color} ${strength.percent} transition-all duration-500 rounded-full`} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="group">
                  <label className="block text-primary/80 text-[13px] font-medium mb-1.5 group-focus-within:text-accent transition-colors">Confirm Password</label>
                  <input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full glass-input py-2.5 px-3.5 rounded-signal-md text-[14px]" required />
                </div>

                <button type="submit" disabled={isLoading} className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 text-[14px] mt-3 group">
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center">
                  <span className="bg-white/90 px-3 text-[11px] text-muted font-medium uppercase tracking-wider">or</span>
                </div>
              </div>

              {/* Discreet Google Button */}
              <div className="flex justify-center">
                <button onClick={handleGoogleSignup} disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-white/70 hover:bg-white border border-border hover:border-border/80 rounded-full text-[13px] font-semibold text-secondary hover:text-primary transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-95 group"
                  id="login-google">
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

            <p className={`text-center text-secondary text-[13px] mt-5 transition-all duration-500 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
              Already have an account?{' '}
              <Link to="/login" className="text-accent font-semibold hover:text-accent/70 transition-colors hover:underline underline-offset-2">Sign in →</Link>
            </p>
          </>
        ) : (
          /* ── STEP 2: Email Verification ── */
          <div className="glass-panel rounded-signal-xl p-8 text-center animate-scale-in">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-[28px] font-bold text-primary mb-3">Verify your email</h1>
            <p className="text-secondary text-[14px] leading-relaxed mb-2">
              We sent a verification link to <strong className="text-primary">{email}</strong>
            </p>
            <div className="mt-5 p-4 rounded-signal-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[13px] leading-relaxed">
              Click the link in your email to activate your account, then sign in below.
            </div>

            <div className="flex flex-col gap-3 mt-8">
              <Link to="/login" className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-[14px]">
                Go to Sign In
              </Link>
              <button type="button" onClick={() => setStep(1)}
                className="inline-flex items-center justify-center gap-2 text-[13px] text-secondary hover:text-primary transition-colors mt-1">
                <ArrowLeft className="w-4 h-4" /><span>Back to signup</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
