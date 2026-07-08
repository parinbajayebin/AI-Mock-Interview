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
import { Brain, CheckCircle, Menu, X } from 'lucide-react';

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
                  <div className="min-w-0 flex-1">
                    <h4 className="font-display font-bold text-[13px] text-primary truncate leading-tight">{user.full_name}</h4>
                    <p className="text-[11px] text-muted truncate mt-0.5">{user.email}</p>
                  </div>
                </div>
              </div>

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
                  <div className="min-w-0 flex-1">
                    <h4 className="font-display font-bold text-[13px] text-primary truncate leading-tight">{user.full_name}</h4>
                    <p className="text-[11px] text-muted truncate mt-0.5">{user.email}</p>
                  </div>
                </div>
              </div>

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
