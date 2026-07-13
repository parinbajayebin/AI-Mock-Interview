import React from 'react';
import { 
  Sparkles, 
  Brain, 
  History, 
  FileText, 
  ArrowRight, 
  Loader2, 
  ExternalLink,
  Lock,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Search
} from 'lucide-react';

export default function PremiumMockInterviewTab({ 
  user, 
  token, 
  resumes, 
  onUpgrade, 
  onInterviewStarted,
  byokProvider,
  byokGeminiKey,
  byokOpenAIKey,
  byokGroqKey,
  byokOpenRouterKey,
  byokModel
}) {
  const [history, setHistory] = React.useState([]);
  const [loadingHistory, setLoadingHistory] = React.useState(true);
  const [selectedRecord, setSelectedRecord] = React.useState(null);
  const [selectedResumeId, setSelectedResumeId] = React.useState(resumes[0]?.id || '');
  const [difficulty, setDifficulty] = React.useState('Mid-Level');
  const [generating, setGenerating] = React.useState(false);
  const [error, setError] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');

  const hdrs = {
    'Authorization': `Bearer ${token}`, 
    'Content-Type': 'application/json',
    ...(byokProvider && byokProvider !== 'default' && { 'X-User-Provider': byokProvider }),
    ...(byokGeminiKey && { 'X-User-Gemini-Key': byokGeminiKey }),
    ...(byokOpenAIKey && { 'X-User-OpenAI-Key': byokOpenAIKey }),
    ...(byokGroqKey && { 'X-User-Groq-Key': byokGroqKey }),
    ...(byokOpenRouterKey && { 'X-User-OpenRouter-Key': byokOpenRouterKey }),
    ...(byokModel && { 'X-User-Model': byokModel })
  };

  React.useEffect(() => {
    if (!user?.is_premium) return;
    
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/ats/history`, {
          headers: hdrs
        });
        if (!response.ok) throw new Error('Failed to fetch ATS history.');
        const data = await response.json();
        setHistory(data);
      } catch (err) {
        console.error(err);
        setError('Error loading past ATS scans.');
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [user?.is_premium]);

  // Lock out basic tier users
  if (!user?.is_premium) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 max-w-md mx-auto py-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200 flex items-center justify-center shadow-lg relative">
          <Lock className="w-8 h-8 text-amber-600" />
          <Sparkles className="w-5 h-5 text-amber-500 absolute -top-1 -right-1 fill-amber-500 animate-pulse" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight text-slate-900">Premium Mock Loop</h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Exclusive Premium Room</p>
          <p className="text-sm text-slate-500 mt-3 leading-relaxed">
            Generate and practice interview loops based on database-saved job descriptions, resume selections, and specific target company background context.
          </p>
        </div>
        <button
          onClick={onUpgrade}
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs rounded-xl shadow-md transition-all uppercase tracking-wider flex items-center gap-1.5"
        >
          Upgrade to Premium <Sparkles className="w-4 h-4 fill-white/10" />
        </button>
      </div>
    );
  }

  const startPremiumInterview = async () => {
    if (!selectedRecord) {
      setError('Please select a target job from your history.');
      return;
    }
    if (!selectedResumeId) {
      setError('Please select a resume first.');
      return;
    }

    setError('');
    setGenerating(true);
    try {
      const finalRole = selectedRecord.role_detected || 'Software Engineer';
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/interviews`, {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({
          resume_id: selectedResumeId,
          role: finalRole,
          difficulty: difficulty,
          job_description: selectedRecord.job_description,
          company_context: selectedRecord.company_context
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to start premium mock interview.');
      }

      const interviewData = await response.json();
      onInterviewStarted(interviewData);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong while generating the questions.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-black tracking-tight text-slate-900">Premium Mock Interview</h1>
          <span className="px-2 py-0.5 text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-200 rounded-full uppercase tracking-wider flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
            Premium
          </span>
        </div>
        <p className="text-[13px] text-slate-500 mt-1">Practice mock interviews created from your saved target jobs, customized companies, and matching resumes.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loadingHistory ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-400 space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <span className="text-xs font-bold uppercase tracking-wider">Loading saved jobs bank...</span>
        </div>
      ) : history.length === 0 ? (
        <div className="glass-panel p-10 rounded-2xl text-center space-y-4 max-w-lg mx-auto">
          <History className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-display font-bold text-slate-800">Your Saved Jobs Bank is Empty</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            You must run an ATS check on a job URL or description first. Once you scan a job, it will automatically save here so you can generate targeted mock interviews.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Panel: History List */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">past job ready resumes</h3>
            
            {/* Search bar inside glassmorphic pattern */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search company or target role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white/40 border border-white/60 rounded-full text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white/60 shadow-inner backdrop-blur-sm transition-all"
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {(() => {
                const filtered = history.filter(record => 
                  (record.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (record.role_detected || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (record.resume_name || '').toLowerCase().includes(searchTerm.toLowerCase())
                );
                if (filtered.length === 0) {
                  return (
                    <div className="text-center text-xs text-slate-400 py-6">
                      No matching records found.
                    </div>
                  );
                }
                return filtered.map((record) => {
                  const isSelected = selectedRecord?.id === record.id;
                  const dateStr = new Date(record.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: '2-digit'
                  });
                  return (
                    <button
                      key={record.id}
                      onClick={() => {
                        setSelectedRecord(record);
                        setError('');
                      }}
                      className={`w-full text-left p-4 rounded-xl transition-all duration-300 flex flex-col justify-between gap-3 relative overflow-hidden ${
                        isSelected
                          ? 'bg-teal-500/10 backdrop-blur-md border border-teal-500/40 text-slate-800 shadow-md ring-1 ring-teal-500/20'
                          : 'bg-white/20 backdrop-blur-md border border-white/30 text-slate-700 hover:bg-white/35 hover:scale-[1.01] hover:shadow-sm'
                      }`}
                    >
                      <div className="w-full flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {record.company_name && (
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                isSelected ? 'bg-teal-500/15 text-teal-700 border border-teal-300/30' : 'bg-slate-100/80 text-teal-700 border border-slate-200'
                              }`}>
                                {record.company_name}
                              </span>
                            )}
                            <span className={`text-[9px] font-bold ${isSelected ? 'text-slate-500' : 'text-slate-500'}`}>
                              {dateStr}
                            </span>
                          </div>
                          <h4 className={`font-display font-black text-sm truncate mt-2 leading-tight ${isSelected ? 'text-slate-900' : 'text-slate-900'}`}>
                            {record.role_detected || 'Software Engineer'}
                          </h4>
                        </div>
                        
                        {/* ATS Score Indicator */}
                        {record.match_score !== null && (
                          <div className="text-right shrink-0">
                            <span className={`block text-[8px] font-bold uppercase tracking-wider text-slate-400`}>Score</span>
                            <span className={`text-base font-black leading-none text-teal-600`}>
                              {record.match_score}%
                            </span>
                          </div>
                        )}
                      </div>

                      <div className={`flex flex-col gap-1.5 text-[11px] pt-2 border-t border-slate-200/50`}>
                        <div className="flex items-center gap-1.5 text-slate-550">
                          <FileText className="w-3.5 h-3.5 shrink-0 text-teal-600" />
                          <span className="truncate">Resume: <strong className="text-slate-800">{record.resume_name || 'Selected Resume'}</strong></span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 uppercase tracking-wider bg-amber-500/10 text-amber-700 border border-amber-200/20`}>
                            <Sparkles className="w-2 h-2 fill-current animate-pulse" />
                            Premium Mock Ready
                          </span>
                          <span className="font-black text-[10px] flex items-center gap-0.5 text-teal-600">
                            {isSelected ? 'Selected ✓' : 'Select Target →'}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                });
              })()}
            </div>
          </div>

          {/* Right Panel: Configure & Launch */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Selected Job & Interview Setup</h3>
            
            {selectedRecord && (
              <div className="glass-panel p-6 space-y-6">
                
                {/* Job Specs Summary */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-5 border-b border-white/20">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-teal-700 bg-teal-500/10 border border-teal-500/20 px-2.5 py-0.5 rounded-full">
                        {selectedRecord.company_name || 'Generic Company'}
                      </span>
                      {selectedRecord.job_url && (
                        <a
                          href={selectedRecord.job_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-500 hover:text-slate-800 flex items-center gap-0.5 text-[11px] font-bold"
                        >
                          View Posting <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <h2 className="font-display font-bold text-lg text-slate-900 mt-1">
                      {selectedRecord.role_detected || 'Software Engineer'}
                    </h2>
                  </div>
                  
                  {selectedRecord.match_score !== null && (
                    <div className="flex items-center gap-3 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-500/20 p-3 rounded-xl">
                      <TrendingUp className="w-5 h-5 text-teal-600" />
                      <div>
                        <div className="text-lg font-black text-slate-800 leading-none">{selectedRecord.match_score}%</div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">ATS Match Rating</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Setup Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select Resume */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Resume Context</label>
                    <select
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/40 hover:bg-white/60 border border-white/50 rounded-xl text-xs font-bold text-slate-700 focus:outline-none transition-all backdrop-blur-sm"
                    >
                      <option value="">-- Choose Resume --</option>
                      {resumes.map(r => (
                        <option key={r.id} value={r.id}>{r.file_name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Difficulty */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Interview Level</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/40 hover:bg-white/60 border border-white/50 rounded-xl text-xs font-bold text-slate-700 focus:outline-none transition-all backdrop-blur-sm"
                    >
                      <option value="Entry-Level">Entry-Level</option>
                      <option value="Mid-Level">Mid-Level</option>
                      <option value="Senior">Senior</option>
                    </select>
                  </div>
                </div>

                {/* Scraped Job Description Snippet */}
                <div className="space-y-2 text-left">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scraped Job Description Details</h4>
                  <div className="p-4 bg-white/30 border border-white/40 rounded-xl max-h-[150px] overflow-y-auto backdrop-blur-sm shadow-inner">
                    <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                      {selectedRecord.job_description}
                    </p>
                  </div>
                </div>

                {/* Launch Button */}
                <div className="pt-2">
                  <button
                    onClick={startPremiumInterview}
                    disabled={generating}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating Company-Themed Questions...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4" />
                        Start Mock Practice Session
                      </>
                    )}
                  </button>
                </div>

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
