import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import { 
  LogOut, 
  Mail, 
  ShieldCheck, 
  Sparkles, 
  PlusCircle, 
  History, 
  LayoutDashboard, 
  FileText, 
  Loader2, 
  Phone, 
  Linkedin, 
  Globe, 
  CheckCircle2,
  Trash2
} from 'lucide-react';

// Protected Route Guard Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-secondary text-sm">Checking active session...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

import ResumeUpload from './components/ResumeUpload';
import InterviewConfig from './components/InterviewConfig';
import ActiveInterview from './components/ActiveInterview';
import EvaluationReport from './components/EvaluationReport';
import PerformanceAnalytics from './components/PerformanceAnalytics';
import InterviewHistory from './components/InterviewHistory';
import { Brain, CheckCircle, Menu, X, Eye, EyeOff } from 'lucide-react';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const APIKeyGuideModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = React.useState('gemini');

  if (!isOpen) return null;

  const tabs = [
    { id: 'gemini', label: 'Google Gemini (Free)' },
    { id: 'openrouter', label: 'OpenRouter (Free)' },
    { id: 'groq', label: 'Groq (Free)' },
    { id: 'openai', label: 'OpenAI (Paid)' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose}></div>
      
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white/80 backdrop-blur-2xl border border-white/60 rounded-signal-xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col z-50 text-left">
        {/* Header */}
        <div className="p-6 border-b border-slate-200/60 flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900">API Key Sourcing Guide</h3>
            <p className="text-xs text-slate-600 mt-0.5">Learn how to get free or cheap API keys to unlock unlimited interviewing</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-signal-md text-slate-500 hover:text-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200/60 bg-slate-100/50 p-2 gap-1 overflow-x-auto shrink-0">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-signal-md transition-all shrink-0 ${
                activeTab === t.id
                  ? 'bg-white text-slate-900 border border-slate-200/80 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 border border-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-700 flex-1 leading-relaxed">
          {activeTab === 'gemini' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-signal-lg p-4 text-[13px] text-blue-800">
                ⭐ <strong>Recommended:</strong> Google AI Studio provides a 100% free tier for developers. Perfect for testing models like Gemini 1.5 Flash and Pro without billing.
              </div>
              <ol className="space-y-3 list-decimal list-inside text-slate-700 font-medium">
                <li>Go to the <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-secondary underline font-semibold">Google AI Studio Console</a>.</li>
                <li>Log in using any standard Google/Gmail account.</li>
                <li>Click the green <strong>"Get API Key"</strong> button in the left sidebar.</li>
                <li>Click <strong>"Create API Key"</strong>.</li>
                <li>Select a project (or create a new default one) and click <strong>"Create API Key in Existing Project"</strong>.</li>
                <li>Copy the key (starts with <code>AIzaSy...</code>) and paste it into the Gemini API input.</li>
              </ol>
            </div>
          )}

          {activeTab === 'openrouter' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-signal-lg p-4 text-[13px] text-purple-800">
                🌐 OpenRouter gives you access to <strong>100% free open-source models</strong> (like Meta Llama 3, Google Gemma 2, or Mistral 7B) with no payment card required!
              </div>
              <ol className="space-y-3 list-decimal list-inside text-slate-700 font-medium">
                <li>Go to <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-secondary underline font-semibold">OpenRouter.ai</a>.</li>
                <li>Sign up for a free account.</li>
                <li>Go to the <strong>Keys</strong> section in your dashboard.</li>
                <li>Click <strong>"Create Key"</strong>, name it, and click <strong>"Create"</strong>.</li>
                <li>Copy the key (starts with <code>sk-or-v1-...</code>) and configure it in the OpenRouter API Key input.</li>
              </ol>
            </div>
          )}

          {activeTab === 'groq' && (
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-signal-lg p-4 text-[13px] text-orange-800">
                ⚡ Groq provides developer API keys for free with rate limits. Offers blazing fast response times for Llama-3 models.
              </div>
              <ol className="space-y-3 list-decimal list-inside text-slate-700 font-medium">
                <li>Go to the <a href="https://console.groq.com/" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-secondary underline font-semibold">Groq Developer Console</a>.</li>
                <li>Sign up or log in.</li>
                <li>Click on <strong>"API Keys"</strong> in the left navigation sidebar.</li>
                <li>Click <strong>"Create API Key"</strong>.</li>
                <li>Copy the key (starts with <code>gsk_...</code>) and paste it in the settings.</li>
              </ol>
            </div>
          )}

          {activeTab === 'openai' && (
            <div className="space-y-4">
              <div className="bg-teal-50 border border-teal-200 rounded-signal-lg p-4 text-[13px] text-teal-800">
                💳 OpenAI requires a developer account with a pre-funded credit balance (minimum $5). Sessions are extremely cheap (less than $0.01 per interview using GPT-4o mini).
              </div>
              <ol className="space-y-3 list-decimal list-inside text-slate-700 font-medium">
                <li>Go to the <a href="https://platform.openai.com/" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-secondary underline font-semibold">OpenAI Platform</a>.</li>
                <li>Sign up/log in and head to <strong>Settings &gt; Billing</strong> to add a balance of $5.</li>
                <li>Click <strong>"API Keys"</strong> in the left sidebar.</li>
                <li>Click <strong>"+ Create new secret key"</strong>.</li>
                <li>Copy the key (starts with <code>sk-...</code>) immediately.</li>
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200/60 bg-slate-50/80 flex justify-end shrink-0">
          <button onClick={onClose} className="btn-primary px-5 py-2 text-xs">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

const PaymentSuccessModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Light transparent backdrop */}
      <div className="absolute inset-0 bg-white/30 backdrop-blur-lg" onClick={onClose} />

      {/* Card — light glass theme */}
      <div className="relative w-full max-w-sm bg-white/80 backdrop-blur-2xl border border-slate-200/80 rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center z-10">
        {/* Teal glow checkmark */}
        <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mb-5 ring-4 ring-teal-100 shadow-[0_0_32px_rgba(20,184,166,0.25)]">
          <svg className="w-10 h-10 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">Payment Successful!</h2>
        <p className="text-sm text-slate-500 mb-1">Your account has been upgraded to</p>
        <span className="inline-flex items-center gap-1.5 text-amber-600 font-bold text-sm mb-5">
          <Sparkles className="w-4 h-4 fill-amber-400" />
          Premium Tier
        </span>

        <p className="text-xs text-slate-400 mb-6">Page will reload to apply your new benefits.</p>

        <button
          onClick={() => { onClose(); window.location.reload(); }}
          className="w-full py-2.5 px-6 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm transition-all shadow-md hover:shadow-teal-500/30"
        >
          Continue to Dashboard
        </button>
      </div>
    </div>
  );
};

const PremiumPlansModal = ({ isOpen, onClose, onUpgrade }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose}></div>
      
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white/80 backdrop-blur-2xl border border-white/60 rounded-signal-xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col z-50 text-left">
        {/* Header */}
        <div className="p-6 border-b border-slate-200/60 flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900">Choose Your Practice Plan</h3>
            <p className="text-xs text-slate-600 mt-0.5">Upgrade to unlock advanced ATS diagnostics and real company mocks</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-signal-md text-slate-500 hover:text-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Free Tier Card */}
            <div className="glass-panel p-5 rounded-signal-lg border border-slate-200/60 flex flex-col justify-between">
              <div>
                <h4 className="font-display font-bold text-md text-slate-900">Free Tier</h4>
                <p className="text-[11px] text-slate-500 mt-1">Get started with general interview readiness checks</p>
                <div className="my-4">
                  <span className="font-display font-black text-2xl text-slate-900">₹0</span>
                  <span className="text-xs text-slate-500 font-bold ml-1">/ forever</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>2 standard mock interviews</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Basic resume parser feedback</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>General interview questions</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-400 line-through">
                    <X className="w-3.5 h-3.5" />
                    <span>Company Career Page Targeting</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-400 line-through">
                    <X className="w-3.5 h-3.5" />
                    <span>ATS Resume Gap Analysis</span>
                  </li>
                </ul>
              </div>
              <button disabled className="w-full mt-6 py-2 px-4 rounded-signal-md text-xs font-bold bg-slate-100 text-slate-400 cursor-not-allowed">
                Current Plan
              </button>
            </div>

            {/* Premium Tier Card */}
            <div className="glass-panel p-5 rounded-signal-lg border-2 border-accent relative flex flex-col justify-between bg-gradient-to-b from-accent/5 to-transparent">
              <span className="absolute -top-3 right-4 bg-accent text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm animate-pulse">
                Recommended
              </span>
              <div>
                <h4 className="font-display font-bold text-md text-slate-900 flex items-center gap-1.5">
                  Premium Tier <Sparkles className="w-4 h-4 text-accent fill-accent/15" />
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">Accelerate your placement preparation with targeting</p>
                <div className="my-4">
                  <span className="font-display font-black text-2xl text-slate-900">₹199</span>
                  <span className="text-xs text-slate-500 font-bold ml-1">/ month</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-center gap-2 font-semibold text-teal-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 fill-teal-50" />
                    <span>2 Host Credit Mocks (then BYOK)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent fill-accent/5" />
                    <span>Real-time Job Post Scraping</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent fill-accent/5" />
                    <span>ATS Scorer & Skill Gap Matrix</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent fill-accent/5" />
                    <span>Line-by-line Resume Bullet Rewriter</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent fill-accent/5" />
                    <span>Company Cultural values simulator</span>
                  </li>
                </ul>
              </div>
              <button 
                onClick={onUpgrade} 
                className="w-full mt-6 py-2 px-4 rounded-signal-md text-xs font-bold bg-accent hover:bg-accent-secondary text-white shadow-md hover:shadow-lg transition-all"
              >
                Upgrade to Premium
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PROVIDER_MODELS = {
  gemini: [
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Fast)' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Analytical)' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Newest)' }
  ],
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Cost-Effective)' },
    { value: 'gpt-4o', label: 'GPT-4o (Premium)' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Classic)' }
  ],
  groq: [
    { value: 'llama3-8b-8192', label: 'Llama 3 8B (Speed)' },
    { value: 'llama3-70b-8192', label: 'Llama 3 70B (Smart)' },
    { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B (Large context)' }
  ],
  openrouter: [
    { value: 'meta-llama/llama-3-8b-instruct:free', label: 'Llama 3 8B (100% Free)' },
    { value: 'google/gemma-2-9b-it:free', label: 'Gemma 2 9B (100% Free)' },
    { value: 'mistralai/mistral-7b-instruct:free', label: 'Mistral 7B (100% Free)' },
    { value: 'microsoft/phi-3-medium-128k-instruct:free', label: 'Phi-3 Medium (100% Free)' },
    { value: 'openchat/openchat-7b:free', label: 'OpenChat 7B (100% Free)' }
  ]
};

const BYOKWidget = ({
  byokProvider,
  byokGeminiKey,
  byokOpenAIKey,
  byokGroqKey,
  byokOpenRouterKey,
  byokModel,
  onSave,
  onOpenGuide,
  token,
  userId
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  // Local/Temporary draft state - does not modify the global state until Saved
  const [tempProvider, setTempProvider] = React.useState(byokProvider);
  const [tempGeminiKey, setTempGeminiKey] = React.useState(byokGeminiKey);
  const [tempOpenAIKey, setTempOpenAIKey] = React.useState(byokOpenAIKey);
  const [tempGroqKey, setTempGroqKey] = React.useState(byokGroqKey);
  const [tempOpenRouterKey, setTempOpenRouterKey] = React.useState(byokOpenRouterKey);
  const [tempModel, setTempModel] = React.useState(byokModel);

  const [showGemini, setShowGemini] = React.useState(false);
  const [showOpenAI, setShowOpenAI] = React.useState(false);
  const [showGroq, setShowGroq] = React.useState(false);
  const [showOpenRouter, setShowOpenRouter] = React.useState(false);

  const [isValidating, setIsValidating] = React.useState(false);
  const [validationError, setValidationError] = React.useState('');
  const [validationSuccess, setValidationSuccess] = React.useState('');

  // Sync draft state with props when widget is opened/props change
  React.useEffect(() => {
    setTempProvider(byokProvider);
    setTempGeminiKey(byokGeminiKey);
    setTempOpenAIKey(byokOpenAIKey);
    setTempGroqKey(byokGroqKey);
    setTempOpenRouterKey(byokOpenRouterKey);
    setTempModel(byokModel);
    setValidationError('');
    setValidationSuccess('');
  }, [byokProvider, byokGeminiKey, byokOpenAIKey, byokGroqKey, byokOpenRouterKey, byokModel, isOpen]);

  // Adjust model when provider changes in draft state
  const handleProviderChange = (newProvider) => {
    setTempProvider(newProvider);
    if (newProvider === 'default') {
      setTempModel('');
    } else {
      const defaultModel = PROVIDER_MODELS[newProvider]?.[0]?.value || '';
      setTempModel(defaultModel);
    }
  };

  const handleSave = async () => {
    setValidationError('');
    setValidationSuccess('');
    setIsValidating(true);

    const suffix = userId || 'default';

    // 1. Back up current values from localStorage
    const backupKeys = {
      provider: localStorage.getItem(`byok_provider_${suffix}`),
      gemini: localStorage.getItem(`byok_gemini_key_${suffix}`),
      openai: localStorage.getItem(`byok_openai_key_${suffix}`),
      groq: localStorage.getItem(`byok_groq_key_${suffix}`),
      openrouter: localStorage.getItem(`byok_openrouter_key_${suffix}`),
      model: localStorage.getItem(`byok_model_${suffix}`)
    };

    // 2. Temporarily write temp settings to localStorage so the fetch interceptor sends them as headers
    localStorage.setItem(`byok_provider_${suffix}`, tempProvider);
    localStorage.setItem(`byok_gemini_key_${suffix}`, tempGeminiKey);
    localStorage.setItem(`byok_openai_key_${suffix}`, tempOpenAIKey);
    localStorage.setItem(`byok_groq_key_${suffix}`, tempGroqKey);
    localStorage.setItem(`byok_openrouter_key_${suffix}`, tempOpenRouterKey);
    localStorage.setItem(`byok_model_${suffix}`, tempModel);

    try {
      if (tempProvider === 'default') {
        onSave(tempProvider, tempGeminiKey, tempOpenAIKey, tempGroqKey, tempOpenRouterKey, tempModel);
        setValidationSuccess('Using Host Credits.');
        setTimeout(() => setValidationSuccess(''), 2000);
        return;
      }

      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBase}/api/interviews/validate-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'API Key validation failed.');
      }

      // Success! Update global state
      onSave(tempProvider, tempGeminiKey, tempOpenAIKey, tempGroqKey, tempOpenRouterKey, tempModel);
      setValidationSuccess('Configuration verified and saved!');
      setTimeout(() => {
        setValidationSuccess('');
      }, 4000);
    } catch (err) {
      // Restore backups
      localStorage.setItem(`byok_provider_${suffix}`, backupKeys.provider || 'default');
      localStorage.setItem(`byok_gemini_key_${suffix}`, backupKeys.gemini || '');
      localStorage.setItem(`byok_openai_key_${suffix}`, backupKeys.openai || '');
      localStorage.setItem(`byok_groq_key_${suffix}`, backupKeys.groq || '');
      localStorage.setItem(`byok_openrouter_key_${suffix}`, backupKeys.openrouter || '');
      localStorage.setItem(`byok_model_${suffix}`, backupKeys.model || '');
      
      setValidationError(err.message || 'Key validation failed. Please check inputs.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-white/10">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-secondary hover:text-primary transition-colors py-1 text-left focus:outline-none"
      >
        <span className="font-display font-bold text-[10px] tracking-wider uppercase">Already have a key?</span>
        <span className="text-[9px] text-accent/80 font-bold px-1.5 py-0.5 rounded-full bg-accent/5 border border-accent/10">
          {byokProvider === 'default' ? 'Config' : 'Active'}
        </span>
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3.5 animate-slide-down">
          {/* Provider Select */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-secondary">Key Provider</label>
            <select
              value={tempProvider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full glass-input py-1.5 px-2.5 text-[11px] focus:outline-none"
            >
              <option value="default">Host Credits (Basic)</option>
              <option value="gemini">Google Gemini (BYOK)</option>
              <option value="openai">OpenAI (BYOK)</option>
              <option value="groq">Groq (BYOK)</option>
              <option value="openrouter">OpenRouter (BYOK)</option>
            </select>
          </div>

          {/* Conditional Key Inputs */}
          {tempProvider === 'gemini' && (
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-secondary">Gemini API Key</label>
              <div className="relative">
                <input
                  type={showGemini ? 'text' : 'password'}
                  value={tempGeminiKey}
                  onChange={(e) => setTempGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full glass-input py-1.5 pl-2.5 pr-8 text-[11px] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowGemini(!showGemini)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary hover:text-primary focus:outline-none"
                >
                  {showGemini ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {tempProvider === 'openai' && (
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-secondary">OpenAI API Key</label>
              <div className="relative">
                <input
                  type={showOpenAI ? 'text' : 'password'}
                  value={tempOpenAIKey}
                  onChange={(e) => setTempOpenAIKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full glass-input py-1.5 pl-2.5 pr-8 text-[11px] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenAI(!showOpenAI)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary hover:text-primary focus:outline-none"
                >
                  {showOpenAI ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {tempProvider === 'groq' && (
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-secondary">Groq API Key</label>
              <div className="relative">
                <input
                  type={showGroq ? 'text' : 'password'}
                  value={tempGroqKey}
                  onChange={(e) => setTempGroqKey(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full glass-input py-1.5 pl-2.5 pr-8 text-[11px] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowGroq(!showGroq)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary hover:text-primary focus:outline-none"
                >
                  {showGroq ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {tempProvider === 'openrouter' && (
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-secondary">OpenRouter API Key</label>
              <div className="relative">
                <input
                  type={showOpenRouter ? 'text' : 'password'}
                  value={tempOpenRouterKey}
                  onChange={(e) => setTempOpenRouterKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="w-full glass-input py-1.5 pl-2.5 pr-8 text-[11px] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenRouter(!showOpenRouter)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary hover:text-primary focus:outline-none"
                >
                  {showOpenRouter ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Model Selector Section (Redesigned beautifully as requested) */}
          {tempProvider !== 'default' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-semibold text-secondary">Target Model</label>
                <span className="text-[9px] text-accent font-bold px-1.5 py-0.5 rounded-full bg-accent/5 border border-accent/10">
                  Model options
                </span>
              </div>
              <select
                value={tempModel}
                onChange={(e) => setTempModel(e.target.value)}
                className="w-full glass-input py-1.5 px-2 text-[11px] focus:outline-none"
              >
                {PROVIDER_MODELS[tempProvider]?.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Setup Guide Link */}
          <button
            type="button"
            onClick={onOpenGuide}
            className="w-full text-left text-[10px] font-bold text-accent hover:text-accent-secondary flex items-center gap-1 focus:outline-none"
          >
            <span>💡 Setup Guide & Free Keys</span>
          </button>

          {/* Validation Feedback & Save Action */}
          {validationError && (
            <div className="text-[10px] text-red-600 bg-red-50 border border-red-200 rounded-signal-md p-2 leading-normal">
              ⚠️ {validationError}
            </div>
          )}
          {validationSuccess && (
            <div className="text-[10px] text-teal-600 bg-teal-50 border border-teal-200 rounded-signal-md p-2 leading-normal flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              {validationSuccess}
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isValidating}
            className="w-full btn-primary py-1.5 px-3 text-[11px] flex items-center justify-center gap-1.5 font-bold"
          >
            {isValidating ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Verifying...</span>
              </>
            ) : (
              <span>Save & Apply Keys</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

const renderUserTierBadge = (provider, model, isPremium) => {
  if (isPremium && (provider === 'default' || !provider)) {
    return (
      <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
        Premium Tier
      </span>
    );
  }
  
  if (provider === 'default' || !provider) {
    return (
      <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold text-teal-600 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-full select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
        Basic Tier
      </span>
    );
  }
  
  if (provider === 'gemini') {
    return (
      <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold text-violet-600 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded-full select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></span>
        BYOK: Gemini ({model?.includes('2.5') ? '2.5' : model?.includes('pro') ? 'Pro' : 'Flash'})
      </span>
    );
  }

  if (provider === 'openai') {
    return (
      <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold text-cyan-600 bg-cyan-50 border border-cyan-200 px-1.5 py-0.5 rounded-full select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
        BYOK: OpenAI ({model?.includes('mini') ? 'Mini' : model?.includes('turbo') ? 'Turbo' : 'GPT-4'})
      </span>
    );
  }

  if (provider === 'groq') {
    return (
      <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
        BYOK: Groq ({model?.includes('70b') ? '70B' : model?.includes('mixtral') ? 'Mixtral' : '8B'})
      </span>
    );
  }

  if (provider === 'openrouter') {
    return (
      <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-full select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
        BYOK: OpenRouter ({model?.includes('llama') ? 'Llama' : model?.includes('gemma') ? 'Gemma' : model?.includes('mistral') ? 'Mistral' : 'Free'})
      </span>
    );
  }
};

// Verification Dashboard to display auth results, resume analysis, and mock interviews
const Dashboard = () => {
  const { user, logout, token } = useAuth();
  const [resumes, setResumes] = React.useState([]);
  const [selectedResume, setSelectedResume] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('resumes'); // 'resumes' or 'interview'
  const [activeInterview, setActiveInterview] = React.useState(null);
  const [completedInterviewId, setCompletedInterviewId] = React.useState(null);
  const [ongoingInterview, setOngoingInterview] = React.useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [plansModalOpen, setPlansModalOpen] = React.useState(false);
  const [paymentSuccessOpen, setPaymentSuccessOpen] = React.useState(false);

  // BYOK State Management
  const [byokProvider, setByokProvider] = React.useState('default');
  const [byokGeminiKey, setByokGeminiKey] = React.useState('');
  const [byokOpenAIKey, setByokOpenAIKey] = React.useState('');
  const [byokGroqKey, setByokGroqKey] = React.useState('');
  const [byokOpenRouterKey, setByokOpenRouterKey] = React.useState('');
  const [byokModel, setByokModel] = React.useState('');
  const [guideOpen, setGuideOpen] = React.useState(false);
  const [byokIntroDismissed, setByokIntroDismissed] = React.useState(false);

  React.useEffect(() => {
    if (user?.id) {
      const suffix = user.id;
      setByokProvider(localStorage.getItem(`byok_provider_${suffix}`) || localStorage.getItem('byok_provider') || 'default');
      setByokGeminiKey(localStorage.getItem(`byok_gemini_key_${suffix}`) || localStorage.getItem('byok_gemini_key') || '');
      setByokOpenAIKey(localStorage.getItem(`byok_openai_key_${suffix}`) || localStorage.getItem('byok_openai_key') || '');
      setByokGroqKey(localStorage.getItem(`byok_groq_key_${suffix}`) || localStorage.getItem('byok_groq_key') || '');
      setByokOpenRouterKey(localStorage.getItem(`byok_openrouter_key_${suffix}`) || localStorage.getItem('byok_openrouter_key') || '');
      setByokModel(localStorage.getItem(`byok_model_${suffix}`) || localStorage.getItem('byok_model') || '');
      setByokIntroDismissed(localStorage.getItem(`byok_intro_dismissed_${suffix}`) === 'true');
    }
  }, [user]);

  const handleByokSave = (provider, geminiKey, openaiKey, groqKey, openrouterKey, model) => {
    const suffix = user?.id || 'default';
    
    localStorage.setItem(`byok_provider_${suffix}`, provider);
    localStorage.setItem(`byok_gemini_key_${suffix}`, geminiKey);
    localStorage.setItem(`byok_openai_key_${suffix}`, openaiKey);
    localStorage.setItem(`byok_groq_key_${suffix}`, groqKey);
    localStorage.setItem(`byok_openrouter_key_${suffix}`, openrouterKey);
    localStorage.setItem(`byok_model_${suffix}`, model);

    // Fallbacks for backward compatibility
    localStorage.setItem('byok_provider', provider);
    localStorage.setItem('byok_gemini_key', geminiKey);
    localStorage.setItem('byok_openai_key', openaiKey);
    localStorage.setItem('byok_groq_key', groqKey);
    localStorage.setItem('byok_openrouter_key', openrouterKey);
    localStorage.setItem('byok_model', model);

    setByokProvider(provider);
    setByokGeminiKey(geminiKey);
    setByokOpenAIKey(openaiKey);
    setByokGroqKey(groqKey);
    setByokOpenRouterKey(openrouterKey);
    setByokModel(model);
  };

  // Preload Razorpay script on Dashboard mount → instant popup when user clicks Upgrade
  React.useEffect(() => { loadRazorpayScript(); }, []);

  const handleUpgrade = async () => {
    setPlansModalOpen(false); // close plans modal before opening Razorpay overlay

    try {
      // Script already preloaded on mount — this resolves instantly
      const resScript = await loadRazorpayScript();
      if (!resScript) {
        alert("Failed to load Razorpay SDK. Please check your internet connection.");
        return;
      }

      // 1. Create order on backend
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/payments/create-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to create order on payment gateway.');
      }

      const orderData = await response.json();

      // 2. Build Razorpay checkout options (same pattern as Cravify)
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,        // already in paise from backend
        currency: orderData.currency || 'INR',
        name: 'InterviewSignal',
        description: '₹199/month · Premium Subscription',
        order_id: orderData.order_id,
        handler: async function (paymentRes) {
          // Called by Razorpay on successful payment
          try {
            const verifyRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/payments/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: paymentRes.razorpay_order_id || orderData.order_id,
                razorpay_payment_id: paymentRes.razorpay_payment_id,
                razorpay_signature: paymentRes.razorpay_signature,
                is_mock: orderData.is_mock
              })
            });

            if (verifyRes.ok) {
              setPaymentSuccessOpen(true);
            } else {
              const err = await verifyRes.json();
              alert(err.detail || "Payment verification failed. Please contact support.");
            }
          } catch (e) {
            console.error("Verification error:", e);
            alert("Verification failed due to a network error. Please contact support.");
          }
        },
        prefill: {
          name: user?.full_name || '',
          email: user?.email || ''
        },
        theme: {
          color: '#14b8a6'
        },
        modal: {
          ondismiss: () => console.log("Razorpay checkout dismissed by user.")
        }
      };

      if (orderData.is_mock) {
        // Developer sandbox: no real keys on server — simulate payment
        const confirmed = window.confirm(
          "⚠️ Developer Sandbox Mode\n\nNo Razorpay keys are configured on this server.\nSimulate a successful ₹199 payment to test the upgrade flow?"
        );
        if (confirmed) {
          await options.handler({
            razorpay_order_id: orderData.order_id,
            razorpay_payment_id: 'pay_mock_12345',
            razorpay_signature: 'sig_mock_12345'
          });
        }
        return;
      }

      // Real keys present — open the Razorpay checkout overlay (iframe popup)
      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to initialize checkout.");
    }
  };

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        // Fetch Resumes
        const resumeRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/resumes`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (resumeRes.ok) {
          const data = await resumeRes.json();
          setResumes(data);
          if (data.length > 0) {
            setSelectedResume(data[0]);
          }
        }

        // Fetch Interviews
        const interviewRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/interviews`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (interviewRes.ok) {
          const interviews = await interviewRes.json();
          const unfinished = interviews.find(i => i.status === 'Created');
          if (unfinished) {
            setOngoingInterview(unfinished);
          }
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const handleUploadSuccess = (newResume) => {
    setResumes(prev => [newResume, ...prev]);
    setSelectedResume(newResume);
  };

  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm("Are you sure you want to delete this resume? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/resumes/${resumeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to delete resume');
      }

      // Update state
      setResumes(prev => {
        const updated = prev.filter(r => r.id !== resumeId);
        // If we deleted the currently selected resume, select the first one of the updated list
        if (selectedResume?.id === resumeId) {
          setSelectedResume(updated.length > 0 ? updated[0] : null);
        }
        return updated;
      });
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error deleting resume');
    }
  };
  
  return (
    <div className="min-h-screen bg-transparent relative flex flex-col md:flex-row">
      {/* ── Background decoration matching Auth screens ── */}
      <div className="fixed top-[15%] left-[12%] w-80 h-80 bg-teal-400/5 rounded-full blur-3xl animate-float pointer-events-none z-0" />
      <div className="fixed bottom-[20%] right-[15%] w-[450px] h-[450px] bg-blue-400/5 rounded-full blur-3xl animate-float pointer-events-none z-0" style={{ animationDelay: '-3s' }} />

      {/* ── Sidebar Navigation (hidden during active sessions for focus mode) ── */}
      {!activeInterview && !completedInterviewId && (
        <>
          {/* Mobile Navigation Header */}
          <header className="flex md:hidden items-center justify-between p-4 sticky top-0 z-30 w-full glass-panel border-b border-border">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-display font-bold tracking-tight text-[15px] text-primary">InterviewSignal</span>
            </div>
            
            {/* Hamburger Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg bg-white/20 border border-white/30 text-secondary hover:text-primary transition-all active:scale-95"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </header>

          {/* Mobile Menu Dropdown Panel */}
          {mobileMenuOpen && (
            <div className="block md:hidden fixed inset-x-4 top-20 z-20 glass-panel p-5 space-y-5 animate-scale-in">
              {/* Profile Info */}
              <div className="bg-white/10 border border-white/20 rounded-signal-lg p-3.5 relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 text-accent flex items-center justify-center font-display font-bold text-sm shrink-0">
                    {user.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col items-start">
                    <h4 className="font-display font-bold text-[13px] text-primary truncate leading-tight w-full text-left">{user.full_name}</h4>
                    <p className="text-[11px] text-muted truncate mt-0.5 w-full text-left">{user.email}</p>
                    <div className="flex flex-wrap gap-1 items-center mt-1">
                      {renderUserTierBadge(byokProvider, byokModel, user?.is_premium)}
                      {user?.is_premium && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full select-none shadow-sm uppercase shrink-0">
                          <Sparkles className="w-2 h-2 text-amber-500 fill-amber-500" />
                          Premium
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Upgrade Promo (only if basic) */}
              {!user?.is_premium && (
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-signal-lg p-3.5 flex flex-col gap-2 relative overflow-hidden text-left shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-amber-500/20 text-amber-600 rounded-md">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-700">Free Practice Limit</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Upgrade to unlock company-specific targeting & advanced ATS diagnostics.
                  </p>
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setPlansModalOpen(true);
                    }}
                    className="w-full mt-1 py-2 px-3 rounded-signal-md text-[11px] font-black bg-amber-500 hover:bg-amber-600 text-white shadow-sm hover:shadow transition-all text-center flex items-center justify-center gap-1"
                  >
                    Upgrade Plan <Sparkles className="w-2.5 h-2.5 fill-white/10" />
                  </button>
                </div>
              )}

              {/* Nav Tabs */}
              <nav className="space-y-1">
                {[
                  { key: 'resumes', icon: FileText, label: 'Your Resumes' },
                  { key: 'interview', icon: Brain, label: 'Interview Room' },
                  { key: 'analytics', icon: LayoutDashboard, label: 'Analytics' },
                  { key: 'history', icon: History, label: 'Interview History' },
                ].map(({ key, icon: Icon, label }) => {
                  const isActive = activeTab === key;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setActiveTab(key);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-semibold rounded-signal-md transition-all duration-200 border ${
                        isActive
                          ? 'bg-accent/5 border-accent/20 text-accent shadow-sm'
                          : 'bg-white/10 border-white/20 text-secondary hover:bg-white/20 hover:text-primary hover:border-white/30'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-accent' : 'text-secondary'}`} />
                      <span>{label}</span>
                    </button>
                  );
                })}

                {/* BYOK Widget beneath Nav Tabs */}
                <BYOKWidget
                  byokProvider={byokProvider}
                  byokGeminiKey={byokGeminiKey}
                  byokOpenAIKey={byokOpenAIKey}
                  byokGroqKey={byokGroqKey}
                  byokOpenRouterKey={byokOpenRouterKey}
                  byokModel={byokModel}
                  onSave={handleByokSave}
                  onOpenGuide={() => {
                    setMobileMenuOpen(false);
                    setGuideOpen(true);
                  }}
                  token={token}
                  userId={user?.id}
                />
              </nav>

              {/* Sign Out */}
              <div className="pt-4 border-t border-border/60">
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }} 
                  className="w-full btn-secondary flex items-center justify-center gap-2 py-2 px-3 text-[13px]"
                >
                  <LogOut className="w-4 h-4 text-secondary" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {/* Desktop Sidebar (hidden on mobile) */}
          <aside className="hidden md:flex w-72 shrink-0 glass-panel min-h-screen sticky top-0 z-10 flex-col justify-between p-6 border-r border-border">
            <div className="space-y-6">
              {/* Logo */}
              <div className="flex items-center gap-2 px-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-display font-bold tracking-tight text-[16px] text-primary">InterviewSignal</span>
              </div>

              {/* Profile Info */}
              <div className="bg-white/15 border border-white/25 rounded-signal-lg p-3.5 relative overflow-hidden transition-all hover:bg-white/25">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 text-accent flex items-center justify-center font-display font-bold text-sm shrink-0">
                    {user.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col items-start">
                    <h4 className="font-display font-bold text-[13px] text-primary truncate leading-tight w-full text-left">{user.full_name}</h4>
                    <p className="text-[11px] text-muted truncate mt-0.5 w-full text-left">{user.email}</p>
                    <div className="flex flex-wrap gap-1 items-center mt-1">
                      {renderUserTierBadge(byokProvider, byokModel, user?.is_premium)}
                      {user?.is_premium && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full select-none shadow-sm uppercase shrink-0">
                          <Sparkles className="w-2 h-2 text-amber-500 fill-amber-500" />
                          Premium
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Upgrade Promo (only if basic) */}
              {!user?.is_premium && (
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-signal-lg p-3 flex flex-col items-start gap-2 text-left relative overflow-hidden shadow-[0_4px_15px_rgba(245,158,11,0.05)]">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-amber-500/20 text-amber-600 rounded-md">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-700">Free Practice Limit</span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-normal">
                    Upgrade to unlock company-specific targeting & advanced ATS diagnostics.
                  </p>
                  <button 
                    onClick={() => setPlansModalOpen(true)}
                    className="w-full mt-1.5 py-1.5 px-3 rounded-signal-md text-[10px] font-black bg-amber-500 hover:bg-amber-600 text-white shadow-sm hover:shadow transition-all text-center flex items-center justify-center gap-1"
                  >
                    Upgrade Plan <Sparkles className="w-2.5 h-2.5 fill-white/10" />
                  </button>
                </div>
              )}

              {/* Nav Tabs */}
              <nav className="space-y-1">
                {[
                  { key: 'resumes', icon: FileText, label: 'Your Resumes' },
                  { key: 'interview', icon: Brain, label: 'Interview Room' },
                  { key: 'analytics', icon: LayoutDashboard, label: 'Analytics' },
                  { key: 'history', icon: History, label: 'Interview History' },
                ].map(({ key, icon: Icon, label }) => {
                  const isActive = activeTab === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-semibold rounded-signal-md transition-all duration-200 border ${
                        isActive
                          ? 'bg-accent/5 border-accent/20 text-accent shadow-sm'
                          : 'bg-transparent border-transparent text-secondary hover:bg-white/15 hover:text-primary hover:border-white/25'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-accent' : 'text-secondary'}`} />
                      <span>{label}</span>
                    </button>
                  );
                })}

                {/* BYOK Widget beneath Nav Tabs */}
                <BYOKWidget
                  byokProvider={byokProvider}
                  byokGeminiKey={byokGeminiKey}
                  byokOpenAIKey={byokOpenAIKey}
                  byokGroqKey={byokGroqKey}
                  byokOpenRouterKey={byokOpenRouterKey}
                  byokModel={byokModel}
                  onSave={handleByokSave}
                  onOpenGuide={() => setGuideOpen(true)}
                  token={token}
                  userId={user?.id}
                />
              </nav>
            </div>

            {/* Logout button */}
            <div className="pt-4 mt-6 border-t border-border/60">
              <button onClick={logout} className="w-full btn-secondary flex items-center justify-center gap-2 py-2 px-3 text-[13px] group">
                <LogOut className="w-4 h-4 text-secondary group-hover:text-primary transition-colors" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ── Main Content Area ── */}
      <main className="flex-1 min-w-0 relative z-10 flex flex-col">
        {/* Full-width container when focusing, else padded container */}
        <div className={`flex-1 w-full mx-auto ${activeInterview || completedInterviewId ? 'p-0' : 'max-w-6xl px-6 md:px-8 py-8 md:py-10'}`}>
          
          {/* Ongoing Session Banner */}
          {ongoingInterview && !activeInterview && !completedInterviewId && (
            <div className="glass-panel p-4.5 rounded-signal-lg mb-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-slide-up border-l-4 border-l-accent shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 text-accent rounded-xl">
                  <Brain className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-display font-bold text-primary text-[14px]">Ongoing Interview Session</h3>
                  <p className="text-[12px] text-secondary mt-0.5">
                    You have an unfinished {ongoingInterview.difficulty} {ongoingInterview.role} interview.
                  </p>
                </div>
              </div>
              <div className="flex gap-2.5 shrink-0 w-full md:w-auto">
                <button
                  onClick={() => {
                    setActiveInterview(ongoingInterview);
                    setOngoingInterview(null);
                  }}
                  className="flex-1 md:flex-none btn-primary px-3.5 py-2 text-[12px]"
                >
                  Resume Session
                </button>
                <button
                  onClick={async () => {
                    if (window.confirm("Are you sure you want to discard this session? All answered questions will be deleted permanently.")) {
                      try {
                        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/interviews/${ongoingInterview.id}`, {
                          method: 'DELETE',
                          headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (res.ok) {
                          setOngoingInterview(null);
                        }
                      } catch (e) {
                        console.error("Failed to delete interview:", e);
                      }
                    }
                  }}
                  className="flex-1 md:flex-none btn-secondary px-3.5 py-2 text-[12px]"
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          {/* Action Modules Router */}
          {completedInterviewId ? (
            <div className="p-6 md:p-10 max-w-5xl mx-auto">
              <EvaluationReport 
                interviewId={completedInterviewId} 
                token={token}
                onBackToDashboard={() => {
                  setCompletedInterviewId(null);
                  setActiveTab('resumes');
                }} 
              />
            </div>
          ) : activeInterview ? (
            <div className="min-h-screen">
              <ActiveInterview 
                interview={activeInterview}
                token={token}
                onInterviewFinished={(interviewId) => {
                  setCompletedInterviewId(interviewId);
                  setActiveInterview(null);
                }}
                onQuit={() => {
                  if (window.confirm("Are you sure you want to quit? Your active session progress will be lost.")) {
                    setActiveInterview(null);
                  }
                }}
              />
            </div>
          ) : activeTab === 'resumes' ? (
            <div className="space-y-6">
              {/* Header section inside content */}
              <div>
                <h1 className="font-display text-2xl font-black tracking-tight text-primary">Resume Parsing & Skills</h1>
                <p className="text-[13px] text-secondary mt-1">Upload and analyze your tech resumes for tailored interview generation</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Upload & List (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                  <ResumeUpload onUploadSuccess={handleUploadSuccess} />
                  
                  <div className="glass-panel p-5 rounded-signal-lg">
                    <h3 className="font-display font-semibold text-primary mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-accent" />
                      <span>Your Resumes</span>
                    </h3>
                    
                    {isLoading ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="w-5 h-5 animate-spin text-accent" />
                      </div>
                    ) : resumes.length === 0 ? (
                      <p className="text-muted text-[12px] text-center py-6">No resumes uploaded yet.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                        {resumes.map(r => {
                          const isSelected = selectedResume?.id === r.id;
                          return (
                            <button
                              key={r.id}
                              onClick={() => setSelectedResume(r)}
                              className={`w-full text-left p-3 rounded-signal-md border transition-all duration-200 flex flex-col gap-1.5 ${
                                isSelected
                                  ? 'bg-accent/5 border-accent/30 shadow-sm'
                                  : 'bg-white/10 border-white/20 hover:bg-white/25 hover:shadow-sm hover:border-white/35'
                              }`}
                            >
                              <div className="flex justify-between items-center w-full">
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${isSelected ? 'text-accent' : 'text-muted'}`}>
                                  {new Date(r.uploaded_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                                </span>
                                {r.skills && r.skills.length > 0 && (
                                  <span className="px-1.5 py-0.5 bg-accent/10 border border-accent/15 rounded-full text-[9px] font-semibold text-accent">
                                    {r.skills.length} Skills
                                  </span>
                                )}
                              </div>
                              <span className="text-[13px] font-semibold text-primary truncate w-full">{r.file_name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: AI Analysis details (7 cols) */}
                <div className="lg:col-span-7">
                  {selectedResume ? (
                    <div className="glass-panel p-6 rounded-signal-lg space-y-5">
                      <div className="border-b border-border pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full uppercase tracking-wider">
                              AI Parsed
                            </span>
                            {selectedResume.parsed_metadata?.experience_years !== undefined && (
                              <span className="px-2 py-0.5 text-[9px] font-bold bg-accent/5 border border-accent/20 text-accent rounded-full uppercase tracking-wider">
                                {selectedResume.parsed_metadata.experience_years} Years Exp
                              </span>
                            )}
                          </div>
                          <h2 className="font-display text-lg font-bold text-primary truncate max-w-[320px]">{selectedResume.file_name}</h2>
                        </div>
                        <button
                          onClick={() => handleDeleteResume(selectedResume.id)}
                          className="px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[11px] font-bold flex items-center gap-1.5 transition-all duration-200 shrink-0 self-start md:self-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Resume</span>
                        </button>
                      </div>

                      {/* Summary */}
                      {selectedResume.experience_summary && (
                        <div className="space-y-1.5">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted">
                            Career Summary
                          </h4>
                          <div className="p-3.5 bg-white/20 border border-white/30 rounded-signal-md">
                            <p className="text-[13px] text-secondary leading-relaxed">
                              {selectedResume.experience_summary}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Skills */}
                      {selectedResume.skills && selectedResume.skills.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted">
                            Key Skills ({selectedResume.skills.length})
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedResume.skills.map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 bg-accent/5 border border-accent/15 text-accent rounded-full text-[11px] font-semibold hover:bg-accent/10 transition-colors"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Education and Contact Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-border pt-4">
                        {/* Education & Certs */}
                        <div className="space-y-4">
                          {selectedResume.parsed_metadata?.education && selectedResume.parsed_metadata.education.length > 0 ? (
                            <div className="space-y-1.5">
                              <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted">Education</h4>
                              <div className="space-y-2">
                                {selectedResume.parsed_metadata.education.map((edu, idx) => (
                                  <div key={idx} className="text-[12px]">
                                    <p className="font-bold text-primary">
                                      {edu.degree} {edu.field_of_study ? `in ${edu.field_of_study}` : ''}
                                    </p>
                                    <p className="text-secondary text-[11px]">
                                      {edu.school} {edu.graduation_year ? `(${edu.graduation_year})` : ''}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {selectedResume.parsed_metadata?.certifications && selectedResume.parsed_metadata.certifications.length > 0 ? (
                            <div className="space-y-1.5">
                              <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted">Certifications</h4>
                              <ul className="list-disc list-inside text-[12px] text-secondary space-y-1">
                                {selectedResume.parsed_metadata.certifications.map((cert, idx) => (
                                  <li key={idx} className="truncate">{cert}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>

                        {/* Contact Info */}
                        {selectedResume.parsed_metadata?.contact_info && (
                          <div className="space-y-2.5">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted">Contact & Links</h4>
                            <div className="space-y-2 text-[12px]">
                              {selectedResume.parsed_metadata.contact_info.email && (
                                <div className="flex items-center gap-2 text-secondary">
                                  <Mail className="w-3.5 h-3.5 text-accent shrink-0" />
                                  <span className="truncate">{selectedResume.parsed_metadata.contact_info.email}</span>
                                </div>
                              )}
                              {selectedResume.parsed_metadata.contact_info.phone && (
                                <div className="flex items-center gap-2 text-secondary">
                                  <Phone className="w-3.5 h-3.5 text-accent shrink-0" />
                                  <span>{selectedResume.parsed_metadata.contact_info.phone}</span>
                                </div>
                              )}
                              {selectedResume.parsed_metadata.contact_info.linkedin && (
                                <div className="flex items-center gap-2 text-secondary">
                                  <Linkedin className="w-3.5 h-3.5 text-accent shrink-0" />
                                  <a
                                    href={selectedResume.parsed_metadata.contact_info.linkedin.startsWith('http') ? selectedResume.parsed_metadata.contact_info.linkedin : `https://${selectedResume.parsed_metadata.contact_info.linkedin}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:text-accent underline underline-offset-2 transition-colors truncate"
                                  >
                                    LinkedIn
                                  </a>
                                </div>
                              )}
                              {selectedResume.parsed_metadata.contact_info.website && (
                                <div className="flex items-center gap-2 text-secondary">
                                  <Globe className="w-3.5 h-3.5 text-accent shrink-0" />
                                  <a
                                    href={selectedResume.parsed_metadata.contact_info.website.startsWith('http') ? selectedResume.parsed_metadata.contact_info.website : `https://${selectedResume.parsed_metadata.contact_info.website}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:text-accent underline underline-offset-2 transition-colors truncate"
                                  >
                                    Portfolio
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="glass-panel p-6 rounded-signal-lg flex flex-col items-center justify-center text-center h-[320px]">
                      <FileText className="w-12 h-12 text-muted/40 mb-3" />
                      <h3 className="font-display text-md font-bold text-secondary">No Resume Selected</h3>
                      <p className="text-[12px] text-muted max-w-[260px] mt-1.5 leading-relaxed">
                        Upload a PDF resume or select one to view its AI analysis.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'analytics' ? (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-black tracking-tight text-primary">Performance Analytics</h1>
                <p className="text-[13px] text-secondary mt-1">Track your progress and readiness metrics across categories</p>
              </div>
              <PerformanceAnalytics 
                token={token} 
                onStartInterview={() => setActiveTab('interview')} 
              />
            </div>
          ) : activeTab === 'history' ? (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-black tracking-tight text-primary">Interview History</h1>
                <p className="text-[13px] text-secondary mt-1">Review your completed mock sessions and grading transcripts</p>
              </div>
              <InterviewHistory 
                token={token}
                onResumeInterview={(interview) => setActiveInterview(interview)}
                onViewReport={(id) => setCompletedInterviewId(id)}
                onStartNew={() => setActiveTab('interview')}
              />
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6 py-4">
              <div className="text-center">
                <h1 className="font-display text-3xl font-black tracking-tight text-primary">Setup Interview Room</h1>
                <p className="text-[13px] text-secondary mt-1.5">Configure your target role and difficulty for your AI interviewer</p>
              </div>
              <InterviewConfig 
                resumes={resumes} 
                token={token} 
                onInterviewStarted={(interview) => setActiveInterview(interview)} 
              />
            </div>
          )}
        </div>
      </main>

      <APIKeyGuideModal 
        isOpen={guideOpen} 
        onClose={() => setGuideOpen(false)} 
      />

      <PremiumPlansModal
        isOpen={plansModalOpen}
        onClose={() => setPlansModalOpen(false)}
        onUpgrade={handleUpgrade}
      />

      {/* Mobile BYOK Feature Alert Toast */}
      {!byokIntroDismissed && byokProvider === 'default' && (
        <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden bg-white/95 backdrop-blur-xl border border-teal-200/80 p-4 rounded-signal-xl shadow-[0_8px_32px_rgba(20,184,166,0.15)] flex gap-3 items-start animate-slide-up">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 shrink-0">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-display font-bold text-xs text-slate-900 text-left">Unlock Unlimited Mock Interviews</h4>
            <p className="text-[10.5px] text-slate-600 mt-1 leading-normal text-left">
              Already have an API Key? Configure Gemini, OpenAI, Groq, or OpenRouter to unlock unlimited practice sessions.
            </p>
            <div className="flex gap-2.5 mt-2.5">
              <button 
                onClick={() => {
                  setMobileMenuOpen(true);
                  const suffix = user?.id || 'default';
                  setByokIntroDismissed(true);
                  localStorage.setItem(`byok_intro_dismissed_${suffix}`, 'true');
                }} 
                className="text-[10px] font-bold text-accent hover:text-accent-secondary flex items-center gap-0.5"
              >
                Configure Now →
              </button>
              <button 
                onClick={() => setGuideOpen(true)} 
                className="text-[10px] font-bold text-slate-500 hover:text-slate-700"
              >
                Get Free Keys
              </button>
            </div>
          </div>
          <button 
            onClick={() => {
              const suffix = user?.id || 'default';
              setByokIntroDismissed(true);
              localStorage.setItem(`byok_intro_dismissed_${suffix}`, 'true');
            }}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Payment Success Popup */}
      <PaymentSuccessModal
        isOpen={paymentSuccessOpen}
        onClose={() => setPaymentSuccessOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
