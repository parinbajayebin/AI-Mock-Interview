import React, { useEffect, useState } from 'react';
import { Loader2, BrainCircuit, CheckCircle2, AlertCircle, Sparkles, ChevronRight } from 'lucide-react';

export default function EvaluationReport({ interviewId, token, onBackToDashboard }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/interviews/${interviewId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error("Failed to load evaluation report.");
        const data = await res.json();
        setReport(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [interviewId, token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-violet-500 mb-4" />
        <p className="text-slate-400">Loading your AI Evaluation Report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Something went wrong</h3>
        <p className="text-slate-400 text-sm mb-6">{error}</p>
        <button onClick={onBackToDashboard} className="btn-secondary py-2 px-5">Back to Dashboard</button>
      </div>
    );
  }

  if (!report) return null;

  // Calculate overall score from individual responses
  let totalScore = 0;
  let scoredQuestions = 0;
  report.questions.forEach(q => {
    if (q.response && q.response.score !== null) {
      totalScore += q.response.score;
      scoredQuestions += 1;
    }
  });
  const overallScore = scoredQuestions > 0 ? Math.round(totalScore / scoredQuestions) : 0;

  // Color logic for score
  let scoreColor = "text-violet-400";
  let scoreRing = "border-violet-500/30";
  if (overallScore >= 80) { scoreColor = "text-green-400"; scoreRing = "border-green-500/30"; }
  else if (overallScore < 60) { scoreColor = "text-orange-400"; scoreRing = "border-orange-500/30"; }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Summary */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 shadow-xl">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Score Ring */}
        <div className={`shrink-0 w-32 h-32 rounded-full border-[6px] ${scoreRing} flex flex-col items-center justify-center relative bg-slate-900/50`}>
          <span className={`text-4xl font-bold ${scoreColor}`}>{overallScore}</span>
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Overall Score</span>
        </div>

        <div className="flex-1 text-center md:text-left z-10">
          <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <h2 className="text-xs font-semibold text-violet-400 uppercase tracking-widest">AI Evaluation Report</h2>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
            {report.role} <span className="text-slate-500 text-lg">({report.difficulty})</span>
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
            {report.status === 'Evaluated' 
              ? "Your interview has been fully evaluated. Below is a detailed breakdown of your performance, including AI-generated feedback for each of your answers."
              : "This interview has not been fully evaluated yet."}
          </p>
        </div>

        <div className="shrink-0 z-10">
          <button onClick={onBackToDashboard} className="btn-secondary py-2.5 px-6 font-semibold">
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Questions Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-100 px-2 flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-violet-400" />
          <span>Question Analysis</span>
        </h3>
        
        <div className="grid grid-cols-1 gap-6">
          {report.questions.sort((a,b) => a.order_index - b.order_index).map((q, idx) => (
            <div key={q.id} className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
              {/* Question Header */}
              <div className="p-5 bg-slate-900/40 border-b border-slate-800/50 flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs">
                  Q{idx + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200 leading-relaxed">{q.question_text}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {q.expected_skills.map((skill, sIdx) => (
                      <span key={sIdx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-semibold">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Answer & Feedback Body */}
              <div className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Your Answer */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                    Your Answer
                  </h4>
                  <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/50 text-sm text-slate-300 min-h-[100px] whitespace-pre-wrap leading-relaxed">
                    {q.response?.user_answer || <span className="text-slate-600 italic">No answer provided.</span>}
                  </div>
                </div>

                {/* AI Feedback */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Mentor Feedback
                    </h4>
                    {q.response?.score !== null && q.response?.score !== undefined && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        q.response.score >= 80 ? 'bg-green-500/10 text-green-400' :
                        q.response.score < 60 ? 'bg-orange-500/10 text-orange-400' :
                        'bg-violet-500/10 text-violet-400'
                      }`}>
                        Score: {q.response.score}/100
                      </span>
                    )}
                  </div>
                  <div className="p-4 rounded-xl bg-violet-900/10 border border-violet-500/20 text-sm text-violet-100 min-h-[100px] leading-relaxed">
                    {q.response?.feedback || <span className="text-violet-400/50 italic">Evaluating...</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
