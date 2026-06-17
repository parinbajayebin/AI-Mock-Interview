import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, AlertTriangle, CheckCircle, ArrowLeft, ArrowRight, ShieldAlert, KeyRound } from 'lucide-react';

export default function Register() {
  const { register, verifyOtp, resendOtp, handleGoogleCallback } = useAuth();
  const navigate = useNavigate();

  // Wizard state: 1 = Signup Form, 2 = OTP Verification
  const [step, setStep] = useState(1);

  // Form inputs
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // UI feedback & loaders
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Resend OTP countdown timer
  const [resendTimer, setResendTimer] = useState(0);

  // Initialize Google Sign-in for Signup
  useEffect(() => {
    if (step !== 1) return;

    const initializeGoogleAuth = async () => {
      try {
        const res = await fetch('/api/auth/google/config');
        const data = await res.json();
        
        if (data.client_id && window.google) {
          window.google.accounts.id.initialize({
            client_id: data.client_id,
            callback: handleGoogleCredentialResponse,
            auto_select: false
          });
          
          window.google.accounts.id.renderButton(
            document.getElementById("google-signup-btn"),
            { 
              theme: "filled_dark", 
              size: "large", 
              width: "100%", 
              text: "signup_with",
              shape: "rectangular"
            }
          );
        }
      } catch (err) {
        console.error("Google Auth signup initialization error:", err);
      }
    };
    
    const timer = setTimeout(initializeGoogleAuth, 500);
    return () => clearTimeout(timer);
  }, [step]);

  // Handle countdown timer for OTP resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleGoogleCredentialResponse = async (response) => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      // Sign up and log in directly using Google credentials
      await handleGoogleCallback(response.credential);
      navigate('/');
    } catch (err) {
      setErrorMsg(err.message || 'Google registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

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
      setSuccessMsg('Legitimate account initialized! An OTP code has been dispatched to your email.');
      setResendTimer(60); // Initialize 60s countdown for resend
      setStep(2); // Advance to OTP verification wizard step
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerifySubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (otpCode.length !== 6) {
      setErrorMsg('Please enter a 6-digit verification code');
      return;
    }

    try {
      setIsLoading(true);
      await verifyOtp(email, otpCode);
      setSuccessMsg('Account verified and logged in successfully!');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed. Incorrect or expired OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      setIsLoading(true);
      await resendOtp(email);
      setSuccessMsg('A new verification OTP code has been sent to your email.');
      setResendTimer(60);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resend verification code.');
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

            {/* Google OAuth signup option */}
            <div className="w-full flex justify-center mb-4">
              <div id="google-signup-btn" className="w-full min-h-[44px]"></div>
            </div>

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
             STEP 2: EMAIL OTP VERIFICATION SCREEN
             ============================================================================== */
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
                <KeyRound className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold font-sans tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
                Verify Email
              </h1>
              <p className="text-slate-400 text-sm mt-2">
                We sent a 6-digit verification code to <strong>{email}</strong>
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-5 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm flex items-start gap-3">
                <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleOtpVerifySubmit} className="space-y-6">
              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider text-center mb-3">
                  Verification OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-3xl font-bold tracking-[10px] pl-[10px] py-3 glass-input rounded-xl border border-slate-700 font-mono"
                  required
                />
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    'Verify and Activate'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || isLoading}
                  className="w-full btn-secondary text-sm flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {resendTimer > 0 ? (
                    `Resend OTP in ${resendTimer}s`
                  ) : (
                    'Resend Verification Code'
                  )}
                </button>
              </div>
            </form>

            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Change signup details</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
