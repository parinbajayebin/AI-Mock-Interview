import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import { LogOut, Mail, ShieldCheck, Sparkles, PlusCircle, History, LayoutDashboard } from 'lucide-react';

// Protected Route Guard Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm">Checking active session...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Verification Dashboard to display auth results
const Dashboard = () => {
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen bg-animate-gradient flex flex-col">
      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/40 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-violet-600/10 rounded-lg text-violet-400 border border-violet-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-bold tracking-tight text-lg">AI Mock Interview Platform</span>
        </div>
        
        <button onClick={logout} className="btn-secondary flex items-center gap-2 py-2 px-3 text-sm">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12">
        <div className="glass-panel p-8 rounded-2xl border border-slate-800 mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Hello, {user.full_name}!
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Authentication successfully configured. Here are your account profile details:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/80 flex items-center gap-3">
              <Mail className="w-5 h-5 text-violet-400" />
              <div>
                <span className="block text-xs text-slate-500 uppercase font-semibold">Email</span>
                <span className="text-sm font-medium text-slate-200">{user.email}</span>
              </div>
            </div>
            
            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800/80 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-violet-400" />
              <div>
                <span className="block text-xs text-slate-500 uppercase font-semibold">Login Provider</span>
                <span className="text-sm font-medium text-slate-200 capitalize">{user.auth_provider}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Roadmap Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-slate-900/30 border border-slate-800/50 rounded-xl flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                <LayoutDashboard className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-200">Current Dashboard</h3>
              <p className="text-slate-500 text-xs mt-2">Active session details and verification statistics.</p>
            </div>
            <span className="text-indigo-400 text-xs font-semibold uppercase mt-4">Module 1 (Ready)</span>
          </div>

          <div className="p-6 bg-slate-900/30 border border-slate-800/50 rounded-xl flex flex-col justify-between opacity-50">
            <div>
              <div className="w-8 h-8 rounded-lg bg-slate-700/20 text-slate-400 flex items-center justify-center mb-4">
                <PlusCircle className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-400">Resume Upload</h3>
              <p className="text-slate-500 text-xs mt-2">Upload resume PDF files to trigger AI skillset extraction.</p>
            </div>
            <span className="text-slate-500 text-xs font-semibold uppercase mt-4">Module 2 (Pending)</span>
          </div>

          <div className="p-6 bg-slate-900/30 border border-slate-800/50 rounded-xl flex flex-col justify-between opacity-50">
            <div>
              <div className="w-8 h-8 rounded-lg bg-slate-700/20 text-slate-400 flex items-center justify-center mb-4">
                <History className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-400">Mock Interviews</h3>
              <p className="text-slate-500 text-xs mt-2">Run custom sessions and browse history.</p>
            </div>
            <span className="text-slate-500 text-xs font-semibold uppercase mt-4">Module 4 (Pending)</span>
          </div>
        </div>
      </main>
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
          {/* Fallback routing redirection */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
