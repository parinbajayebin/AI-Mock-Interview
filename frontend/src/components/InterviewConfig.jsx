import React from 'react';
import { Sparkles, Loader2, ArrowRight, Brain, AlertTriangle } from 'lucide-react';

const POPULAR_ROLES = [
  'Backend Engineer',
  'Frontend Engineer',
  'Fullstack Engineer',
  'Data Scientist',
  'DevOps / SRE',
  'Mobile Developer'
];

const DIFFICULTY_LEVELS = [
  { id: 'Entry-Level', label: 'Entry-Level', desc: 'Focuses on core syntax, basics, and simple logic.' },
  { id: 'Mid-Level', label: 'Mid-Level', desc: 'Focuses on systems integration, debugging, and databases.' },
  { id: 'Senior', label: 'Senior', desc: 'Focuses on system design, scalability, and architecture.' }
];

const LOADING_STEPS = [
  'Initializing Gemini 3.5 Flash engine...',
  'Reading your resume and background...',
  'Extracting technical skills and project highlights...',
  'Formulating custom coding & debugging questions...',
  'Generating ideal solutions for grading...',
  'Setting up your mock interview room...'
];

export default function InterviewConfig({ resumes, token, onInterviewStarted }) {
  const [role, setRole] = React.useState(POPULAR_ROLES[0]);
  const [customRole, setCustomRole] = React.useState('');
  const [isCustomRole, setIsCustomRole] = React.useState(false);
  const [difficulty, setDifficulty] = React.useState('Mid-Level');
  const [selectedResumeId, setSelectedResumeId] = React.useState('');
  
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = React.useState(0);
  const [error, setError] = React.useState(null);

  // Set default resume if available
  React.useEffect(() => {
    if (resumes && resumes.length > 0 && !selectedResumeId) {
      setSelectedResumeId(resumes[0].id);
    }
  }, [resumes, selectedResumeId]);

  // Loading step rotator
  React.useEffect(() => {
    let interval;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 3500);
    } else {
      setLoadingStepIndex(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleStartInterview = async (e) => {
    e.preventDefault();
    setError(null);
    setIsGenerating(true);

    const finalRole = isCustomRole ? customRole.trim() : role;
    if (!finalRole) {
      setError('Please specify a target role.');
      setIsGenerating(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/interviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resume_id: selectedResumeId || null,
          role: finalRole,
          difficulty: difficulty
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to start interview');
      }

      const interviewData = await response.json();
      // Notify parent to transition to active interview screen
      onInterviewStarted(interviewData);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong while generating the questions.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="glass-panel p-8 rounded-2xl border border-slate-800 relative overflow-hidden h-full flex flex-col justify-between">
      {/* Background radial highlight */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-violet-600/15 text-violet-400 rounded-xl border border-violet-500/25">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-100">Setup Mock Interview</h3>
            <p className="text-slate-400 text-xs mt-0.5">Customize your session difficulty and scope</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/30 border border-red-500/20 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-300 leading-normal">{error}</p>
          </div>
        )}

        <form onSubmit={handleStartInterview} className="space-y-6">
          {/* Target Role Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Target Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                disabled={isGenerating}
                value={isCustomRole ? 'custom' : role}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setIsCustomRole(true);
                  } else {
                    setIsCustomRole(false);
                    setRole(e.target.value);
                  }
                }}
                className="col-span-2 md:col-span-1 p-2.5 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                {POPULAR_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
                <option value="custom">Other / Custom Role...</option>
              </select>

              {isCustomRole && (
                <input
                  type="text"
                  required
                  placeholder="e.g. Embedded Developer"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  disabled={isGenerating}
                  className="col-span-2 md:col-span-1 p-2.5 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              )}
            </div>
          </div>

          {/* Difficulty Tabs */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTY_LEVELS.map((level) => {
                const isActive = difficulty === level.id;
                return (
                  <button
                    key={level.id}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setDifficulty(level.id)}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                      isActive
                        ? 'bg-violet-600/10 border-violet-500/50 text-violet-300'
                        : 'bg-slate-900/30 border-slate-850 text-slate-400 hover:border-slate-750 hover:bg-slate-900/50'
                    }`}
                  >
                    <span className="text-xs font-bold">{level.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500 leading-normal mt-1.5">
              {DIFFICULTY_LEVELS.find((l) => l.id === difficulty)?.desc}
            </p>
          </div>

          {/* Resume Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Customize with Resume (Optional)
            </label>
            <select
              disabled={isGenerating}
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              className="w-full p-2.5 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value="">-- No Resume (General Questions) --</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.file_name} ({new Date(r.uploaded_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 leading-normal">
              If selected, the AI will build questions based on your projects, certifications, and target skills.
            </p>
          </div>
        </form>
      </div>

      <div className="mt-8 pt-4 border-t border-slate-800/80">
        <button
          onClick={handleStartInterview}
          disabled={isGenerating}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold group"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Generating Session...</span>
            </>
          ) : (
            <>
              <span>Generate Mock Interview</span>
              <ArrowRight className="w-4 h-4 text-white/95 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-slate-850 text-center space-y-6 shadow-2xl">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-xl pointer-events-none animate-pulse"></div>
              <div className="w-20 h-20 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin flex items-center justify-center">
                <Brain className="w-8 h-8 text-violet-400 animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-lg font-bold text-slate-100">Preparing Mock Interview</h4>
              <div className="h-6 flex items-center justify-center">
                <p className="text-xs text-slate-400 transition-all duration-300 animate-fade-in font-medium">
                  {LOADING_STEPS[loadingStepIndex]}
                </p>
              </div>
            </div>

            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-violet-600 to-indigo-600 h-full transition-all duration-1000 ease-out"
                style={{ width: `${((loadingStepIndex + 1) / LOADING_STEPS.length) * 100}%` }}
              ></div>
            </div>
            
            <p className="text-[10px] text-slate-500">This will take about 10-15 seconds. Please don't close the window.</p>
          </div>
        </div>
      )}
    </div>
  );
}
