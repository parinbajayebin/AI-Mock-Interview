import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, AlertTriangle, CheckCircle, ArrowLeft, ArrowRight, KeyRound } from 'lucide-react';

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

  // Clear stale session on mount
  useEffect(() => {
    logout();
  }, []);

  // Evaluate Password Strength
  const evaluatePasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-700', percent: 'w-0' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) {
      return { score, label: 'Weak Password', color: 'bg-red-500', percent: 'w-1/3' };
    } else if (score <= 4) {
      return { score, label: 'Medium Strength', color: 'bg-yellow-500', percent: 'w-2/3' };
    } else {
      return { score, label: 'Strong Password', color: 'bg-emerald-500', percent: 'w-full' };
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
    <div className="min-h-screen bg-animate-gradient flex items-center justify-center p-4">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl">

        {step === 1 ? (
          /* ==============================================================================
             STEP 1: USER DETAILS SIGNUP FORM
             ============================================================================== */
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-4">
                <User className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold font-sans tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
                Create Account
              </h1>
              <p className="text-slate-400 text-sm mt-2">
                Register a new candidate profile to begin
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 glass-input py-2 rounded-lg text-sm"
                    required
                  />
                </div>
              </div>

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
                    className="w-full pl-10 glass-input py-2 rounded-lg text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 glass-input py-2 rounded-lg text-sm"
                    required
                  />
                </div>

                {/* Visual Password Strength Meter */}
                {password && (
                  <div className="mt-2.5 space-y-1.5">
                    <div className="flex justify-between text-xxs font-medium">
                      <span className="text-slate-400">Password strength:</span>
                      <span className={strength.score <= 2 ? "text-red-400" : strength.score <= 4 ? "text-yellow-400" : "text-emerald-400"}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${strength.color} ${strength.percent} transition-all duration-300`}></div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 glass-input py-2 rounded-lg text-sm"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary flex items-center justify-center gap-2 mt-4"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>Sign Up with Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6 text-center">
              <hr className="border-slate-800" />
              <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#090d16] px-3 text-xs text-slate-500 font-semibold uppercase">
                Or Use Social Signup
              </span>
            </div>

            {/* Custom Google Auth button */}
            <button
              onClick={handleGoogleSignup}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-850 py-2.5 rounded-lg text-sm font-semibold text-slate-200 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.2-5.136 4.2A5.626 5.626 0 0 1 8.35 13a5.626 5.626 0 0 1 5.64-5.6c1.478 0 2.822.56 3.84 1.48L20.88 5.83A9.554 9.554 0 0 0 13.99 3c-5.26 0-9.64 4.01-9.64 9s4.38 9 9.64 9c5.06 0 9.22-3.8 9.22-9 0-.61-.06-1.18-.17-1.715H12.24z"/>
              </svg>
              <span>Sign Up with Google</span>
            </button>

            <p className="text-center text-slate-400 text-sm mt-6">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                Login here
              </Link>
            </p>
          </>
        ) : (
          /* ==============================================================================
             STEP 2: EMAIL VERIFICATION CHECK MESSAGE
             ============================================================================== */
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
                <KeyRound className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold font-sans tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
                Verify Your Email
              </h1>
              <p className="text-slate-400 text-sm mt-4 leading-relaxed">
                We have dispatched a verification link to <strong className="text-slate-200">{email}</strong>.
              </p>
              <div className="mt-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm">
                Please click the link inside the verification email to activate your account. Once verified, you can sign in below.
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-8">
              <Link
                to="/login"
                className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm text-center"
              >
                Proceed to Login
              </Link>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors mt-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Go back to signup</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
