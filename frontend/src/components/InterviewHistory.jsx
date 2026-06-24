import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Trash2, 
  Play, 
  FileText, 
  Calendar, 
  Sparkles, 
  AlertCircle,
  Brain,
  ChevronRight
} from 'lucide-react';

const InterviewHistory = ({ token, onResumeInterview, onViewReport, onStartNew }) => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchRole, setSearchRole] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [status, setStatus] = useState('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (searchRole) queryParams.append('role', searchRole);
      if (difficulty) queryParams.append('difficulty', difficulty);
      if (status) queryParams.append('status', status);

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/interviews?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to load interview history.");
      const json = await res.json();
      setInterviews(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search for role
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchHistory();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchRole, difficulty, status]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this interview history? All questions, responses, and feedback will be lost forever.")) {
      return;
    }
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/interviews/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        // Refresh local list
        setInterviews(prev => prev.filter(item => item.id !== id));
      } else {
        alert("Failed to delete interview history.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search & Filters */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search target role..."
            value={searchRole}
            onChange={(e) => setSearchRole(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 placeholder-slate-600 transition-all"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="flex-1 md:flex-none px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 text-sm focus:outline-none focus:border-violet-500/50"
          >
            <option value="">All Difficulties</option>
            <option value="Entry-Level">Entry-Level</option>
            <option value="Mid-Level">Mid-Level</option>
            <option value="Senior">Senior</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex-1 md:flex-none px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 text-sm focus:outline-none focus:border-violet-500/50"
          >
            <option value="">All Statuses</option>
            <option value="Created">In-Progress</option>
            <option value="Evaluated">Evaluated</option>
          </select>
        </div>
      </div>

      {/* History List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="glass-panel p-8 rounded-2xl border border-red-500/20 bg-red-950/5 text-center flex flex-col items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      ) : interviews.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center flex flex-col items-center justify-center min-h-[300px]">
          <Brain className="w-12 h-12 text-slate-700 mb-4" />
          <h3 className="text-slate-300 font-semibold">No interviews match your filters</h3>
          <p className="text-slate-500 text-xs mt-1 max-w-sm">
            Try adjusting your search criteria or configure a new mock interview session to practice.
          </p>
          {(searchRole || difficulty || status) ? (
            <button
              onClick={() => {
                setSearchRole('');
                setDifficulty('');
                setStatus('');
              }}
              className="mt-6 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 rounded-xl text-xs font-semibold transition-all"
            >
              Reset Filters
            </button>
          ) : (
            <button
              onClick={onStartNew}
              className="btn-primary mt-6 flex items-center gap-1.5 py-2 px-4 text-xs font-bold"
            >
              <span>Setup Interview Session</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interviews.map(item => {
            const isEvaluated = item.status === 'Evaluated';
            
            // Calculate average score for evaluated interviews
            let avgScore = 0;
            if (isEvaluated && item.questions) {
              const scores = item.questions
                .map(q => q.response?.score)
                .filter(s => s !== undefined && s !== null);
              if (scores.length > 0) {
                avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
              }
            }

            return (
              <div 
                key={item.id} 
                className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 rounded-bl-full pointer-events-none"></div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {item.difficulty}
                      </span>
                      <h4 className="font-bold text-slate-200 mt-2 text-base leading-tight truncate max-w-[200px]">
                        {item.role}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      {isEvaluated ? (
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Score</span>
                          <span className={`text-lg font-extrabold ${avgScore >= 70 ? 'text-emerald-400' : avgScore >= 45 ? 'text-amber-400' : 'text-red-400'}`}>
                            {avgScore}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full animate-pulse">
                          In Progress
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-600" />
                    <span>{new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-900 mt-5 pt-4">
                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-2 text-slate-600 hover:text-red-400 bg-slate-950 border border-slate-900 hover:border-red-500/20 rounded-xl transition-all"
                    title="Delete interview session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {isEvaluated ? (
                    <button
                      onClick={() => onViewReport(item.id)}
                      className="px-4 py-1.5 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/20 text-violet-300 text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Feedback Report</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onResumeInterview(item)}
                      className="px-4 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all shadow-lg shadow-violet-600/10"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Resume Session</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InterviewHistory;
