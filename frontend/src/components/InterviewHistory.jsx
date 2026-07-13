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

const InterviewHistory = ({ token, onResumeInterview, onViewReport, onStartNew, premiumOnly = false }) => {
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
      const filtered = json.filter(item => {
        const isPremium = !!(item.job_description || item.company_context);
        return premiumOnly ? isPremium : !isPremium;
      });
      setInterviews(filtered);
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
  }, [searchRole, difficulty, status, premiumOnly]);

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
    <div className="space-y-5 animate-fade-in">
      {/* Search & Filters */}
      <div className="glass-panel p-4 rounded-signal-lg border border-border flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/60" />
          <input
            type="text"
            placeholder="Search target role..."
            value={searchRole}
            onChange={(e) => setSearchRole(e.target.value)}
            className="w-full pl-9 pr-4 py-2 glass-input rounded-signal-md text-[13px] focus:outline-none"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="flex-1 md:flex-none px-3 py-2 glass-input rounded-signal-md text-[13px] focus:outline-none"
          >
            <option value="">All Difficulties</option>
            <option value="Entry-Level">Entry-Level</option>
            <option value="Mid-Level">Mid-Level</option>
            <option value="Senior">Senior</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex-1 md:flex-none px-3 py-2 glass-input rounded-signal-md text-[13px] focus:outline-none"
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
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="glass-panel p-8 rounded-signal-lg border border-red-200 bg-red-50 text-center flex flex-col items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
          <p className="text-red-700 text-sm font-semibold">{error}</p>
        </div>
      ) : interviews.length === 0 ? (
        <div className="glass-panel p-12 rounded-signal-lg border border-border text-center flex flex-col items-center justify-center min-h-[300px]">
          <Brain className="w-12 h-12 text-secondary/40 mb-4" />
          <h3 className="text-primary font-bold">No interviews match your filters</h3>
          <p className="text-secondary text-[13px] mt-1.5 max-w-sm">
            Try adjusting your search criteria or configure a new mock interview session to practice.
          </p>
          {(searchRole || difficulty || status) ? (
            <button
              onClick={() => {
                setSearchRole('');
                setDifficulty('');
                setStatus('');
              }}
              className="mt-6 btn-secondary py-1.5 px-4 text-xs font-bold"
            >
              Reset Filters
            </button>
          ) : (
            <button
              onClick={onStartNew}
              className="btn-primary mt-6 flex items-center gap-1.5 py-2 px-4 text-xs font-bold"
            >
              <span>Setup Interview Session</span>
              <ChevronRight className="w-3.5 h-3.5 text-white" />
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
                className="glass-panel p-5 rounded-signal-lg border border-border hover:border-accent/40 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden shadow-sm"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-bl-full pointer-events-none"></div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[9px] font-bold text-accent bg-accent/5 border border-accent/15 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {item.difficulty}
                      </span>
                      <h4 className="font-display font-black text-primary mt-2 text-base leading-tight truncate max-w-[200px]" title={item.role}>
                        {item.role}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      {isEvaluated ? (
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-bold text-muted uppercase tracking-wider">Score</span>
                          <span className={`text-lg font-black leading-none mt-0.5 ${avgScore >= 70 ? 'text-emerald-600' : avgScore >= 45 ? 'text-amber-600' : 'text-red-600'}`}>
                            {avgScore}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full animate-pulse">
                          In Progress
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-secondary">
                    <Calendar className="w-3.5 h-3.5 text-secondary/60" />
                    <span>{new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border mt-5 pt-3.5">
                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-2 text-secondary hover:text-red-600 bg-white/15 border border-white/25 hover:border-red-200 rounded-signal-md transition-all duration-200"
                    title="Delete interview history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {isEvaluated ? (
                    <button
                      onClick={() => onViewReport(item.id)}
                      className="btn-secondary py-1.5 px-3.5 text-[12px] flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Feedback Report</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onResumeInterview(item)}
                      className="btn-primary py-1.5 px-3.5 text-[12px] flex items-center gap-1"
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
