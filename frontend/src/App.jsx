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
  CheckCircle2 
} from 'lucide-react';

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

import ResumeUpload from './components/ResumeUpload';
import InterviewConfig from './components/InterviewConfig';
import ActiveInterview from './components/ActiveInterview';
import EvaluationReport from './components/EvaluationReport';
import PerformanceAnalytics from './components/PerformanceAnalytics';
import InterviewHistory from './components/InterviewHistory';
import { Brain, CheckCircle } from 'lucide-react';

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
  
  return (
    <div className="min-h-screen bg-animate-gradient flex flex-col">
      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/40 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-violet-600/10 rounded-lg text-violet-400 border border-violet-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-bold tracking-tight text-lg text-white">AI Mock Interview Platform</span>
        </div>
        
        <button onClick={logout} className="btn-secondary flex items-center gap-2 py-2 px-3 text-sm">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12">
        {/* User Card */}
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

        {/* Unfinished Interview Banner */}
        {ongoingInterview && !activeInterview && !completedInterviewId && (
          <div className="glass-panel p-6 rounded-2xl border border-violet-500/30 bg-violet-950/10 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-violet-600/20 text-violet-400 rounded-xl border border-violet-500/30 animate-pulse">
                <Brain className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-slate-100 text-sm md:text-base">Ongoing Interview Session</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  You have an unfinished {ongoingInterview.difficulty} {ongoingInterview.role} interview.
                </p>
              </div>
            </div>
            <div className="flex gap-3 shrink-0 w-full md:w-auto">
              <button
                onClick={() => {
                  setActiveInterview(ongoingInterview);
                  setOngoingInterview(null);
                }}
                className="flex-1 md:flex-none px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-violet-600/15"
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
                className="flex-1 md:flex-none px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold transition-all"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        {!activeInterview && !completedInterviewId && (
          <div className="flex gap-2 border-b border-slate-800 pb-4 mb-8">
            <button
              onClick={() => setActiveTab('resumes')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all border ${
                activeTab === 'resumes'
                  ? 'bg-violet-600/10 border-violet-500/30 text-violet-400'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Resume Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab('interview')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all border ${
                activeTab === 'interview'
                  ? 'bg-violet-600/10 border-violet-500/30 text-violet-400'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Interview Prep</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all border ${
                activeTab === 'analytics'
                  ? 'bg-violet-600/10 border-violet-500/30 text-violet-400'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Performance Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all border ${
                activeTab === 'history'
                  ? 'bg-violet-600/10 border-violet-500/30 text-violet-400'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Interview History</span>
            </button>
          </div>
        )}

        {/* Action Modules */}
        {completedInterviewId ? (
          <EvaluationReport 
            interviewId={completedInterviewId} 
            token={token}
            onBackToDashboard={() => {
              setCompletedInterviewId(null);
              setActiveTab('resumes');
            }} 
          />
        ) : activeInterview ? (
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
        ) : activeTab === 'resumes' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Upload & List (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <ResumeUpload onUploadSuccess={handleUploadSuccess} />
              
              <div className="glass-panel p-6 rounded-2xl border border-slate-800">
                <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-400" />
                  <span>Your Resumes</span>
                </h3>
                
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                  </div>
                ) : resumes.length === 0 ? (
                  <p className="text-slate-500 text-xs text-center py-6">No resumes uploaded yet.</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {resumes.map(r => {
                      const isSelected = selectedResume?.id === r.id;
                      return (
                        <button
                          key={r.id}
                          onClick={() => setSelectedResume(r)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1 ${
                            isSelected
                              ? 'bg-violet-600/10 border-violet-500/50 shadow-indigo-500/5'
                              : 'bg-slate-900/30 border-slate-800/80 hover:bg-slate-900/50 hover:border-slate-700'
                          }`}
                        >
                          <span className={`text-[10px] font-semibold uppercase tracking-wider ${isSelected ? 'text-violet-400' : 'text-slate-500'}`}>
                            {new Date(r.uploaded_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                          </span>
                          <span className="text-sm font-medium text-slate-200 truncate w-full">{r.file_name}</span>
                          {r.skills && r.skills.length > 0 && (
                            <span className="text-[10px] text-slate-500 truncate w-full">
                              {r.skills.length} skills extracted
                            </span>
                          )}
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
                <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-6">
                  {/* Header */}
                  <div className="border-b border-slate-800/80 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-green-500/10 border border-green-500/20 text-green-400 rounded-full">
                          AI Parsed
                        </span>
                        {selectedResume.parsed_metadata?.experience_years !== undefined && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-full">
                            {selectedResume.parsed_metadata.experience_years} Years Exp
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-bold text-slate-100 truncate max-w-[320px]">{selectedResume.file_name}</h2>
                    </div>
                  </div>

                  {/* Summary */}
                  {selectedResume.experience_summary && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Career Summary
                      </h4>
                      <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-5">
                          <Sparkles className="w-12 h-12 text-violet-400" />
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed relative z-10">
                          {selectedResume.experience_summary}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {selectedResume.skills && selectedResume.skills.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Key Skills ({selectedResume.skills.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedResume.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-violet-600/10 border border-violet-500/20 text-violet-300 rounded-full text-xs font-medium hover:border-violet-500/40 transition-colors"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education and Contact Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-800/80 pt-6">
                    {/* Education & Certs */}
                    <div className="space-y-4">
                      {selectedResume.parsed_metadata?.education && selectedResume.parsed_metadata.education.length > 0 ? (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Education
                          </h4>
                          <div className="space-y-2">
                            {selectedResume.parsed_metadata.education.map((edu, idx) => (
                              <div key={idx} className="text-xs">
                                <p className="font-semibold text-slate-300">
                                  {edu.degree} {edu.field_of_study ? `in ${edu.field_of_study}` : ''}
                                </p>
                                <p className="text-slate-500">
                                  {edu.school} {edu.graduation_year ? `(${edu.graduation_year})` : ''}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {selectedResume.parsed_metadata?.certifications && selectedResume.parsed_metadata.certifications.length > 0 ? (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Certifications
                          </h4>
                          <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                            {selectedResume.parsed_metadata.certifications.map((cert, idx) => (
                              <li key={idx}>{cert}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>

                    {/* Contact Info */}
                    {selectedResume.parsed_metadata?.contact_info && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Contact & Links
                        </h4>
                        <div className="space-y-2 text-xs">
                          {selectedResume.parsed_metadata.contact_info.email && (
                            <div className="flex items-center gap-2 text-slate-400">
                              <Mail className="w-3.5 h-3.5 text-violet-400" />
                              <span>{selectedResume.parsed_metadata.contact_info.email}</span>
                            </div>
                          )}
                          {selectedResume.parsed_metadata.contact_info.phone && (
                            <div className="flex items-center gap-2 text-slate-400">
                              <Phone className="w-3.5 h-3.5 text-violet-400" />
                              <span>{selectedResume.parsed_metadata.contact_info.phone}</span>
                            </div>
                          )}
                          {selectedResume.parsed_metadata.contact_info.linkedin && (
                            <div className="flex items-center gap-2 text-slate-400">
                              <Linkedin className="w-3.5 h-3.5 text-violet-400" />
                              <a
                                href={selectedResume.parsed_metadata.contact_info.linkedin.startsWith('http') ? selectedResume.parsed_metadata.contact_info.linkedin : `https://${selectedResume.parsed_metadata.contact_info.linkedin}`}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:text-violet-300 underline transition-colors"
                              >
                                LinkedIn
                              </a>
                            </div>
                          )}
                          {selectedResume.parsed_metadata.contact_info.website && (
                            <div className="flex items-center gap-2 text-slate-400">
                              <Globe className="w-3.5 h-3.5 text-violet-400" />
                              <a
                                href={selectedResume.parsed_metadata.contact_info.website.startsWith('http') ? selectedResume.parsed_metadata.contact_info.website : `https://${selectedResume.parsed_metadata.contact_info.website}`}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:text-violet-300 underline transition-colors"
                              >
                                Portfolio Website
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="glass-panel p-8 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center h-[350px] opacity-75">
                  <FileText className="w-16 h-16 text-slate-700 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-400">No Resume Selected</h3>
                  <p className="text-xs text-slate-500 max-w-[280px] mt-2">
                    Upload a PDF resume on the left or select an existing one to view its AI skillset analysis and metadata.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'analytics' ? (
          <PerformanceAnalytics 
            token={token} 
            onStartInterview={() => setActiveTab('interview')} 
          />
        ) : activeTab === 'history' ? (
          <InterviewHistory 
            token={token}
            onResumeInterview={(interview) => setActiveInterview(interview)}
            onViewReport={(id) => setCompletedInterviewId(id)}
            onStartNew={() => setActiveTab('interview')}
          />
        ) : (
          <div className="max-w-2xl mx-auto">
            <InterviewConfig 
              resumes={resumes} 
              token={token} 
              onInterviewStarted={(interview) => setActiveInterview(interview)} 
            />
          </div>
        )}
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
