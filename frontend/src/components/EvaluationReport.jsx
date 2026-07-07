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
        <Loader2 className="w-9 h-9 animate-spin text-accent mb-4" />
        <p className="text-secondary text-[13px] font-medium">Loading your AI Evaluation Report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-primary mb-2">Something went wrong</h3>
        <p className="text-secondary text-sm mb-6">{error}</p>
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
  let scoreColor = "text-accent";
  let scoreRing = "border-accent/30";
  if (overallScore >= 80) { scoreColor = "text-emerald-600"; scoreRing = "border-emerald-500/30"; }
  else if (overallScore < 60) { scoreColor = "text-amber-600"; scoreRing = "border-amber-500/30"; }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Summary */}
      <div className="glass-panel p-6 md:p-8 rounded-signal-xl border border-border relative overflow-hidden flex flex-col md:flex-row items-center gap-8 shadow-sm">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Score Ring */}
        <div className={`shrink-0 w-28 h-28 rounded-full border-[5px] ${scoreRing} flex flex-col items-center justify-center relative bg-white/30 backdrop-blur-md shadow-inner`}>
          <span className={`text-3xl font-black ${scoreColor} leading-none`}>{overallScore}</span>
          <span className="text-[9px] text-muted font-bold uppercase tracking-wider mt-1">Overall Score</span>
        </div>

        <div className="flex-1 text-center md:text-left z-10">
          <div className="flex items-center gap-2 justify-center md:justify-start mb-1.5">
            <Sparkles className="w-4 h-4 text-accent" />
            <h2 className="text-[10px] font-bold text-accent uppercase tracking-widest">AI Evaluation Report</h2>
          </div>
          <h1 className="font-display text-xl md:text-2xl font-black text-primary leading-tight">
            {report.role} <span className="text-secondary text-sm font-semibold">({report.difficulty})</span>
          </h1>
          <p className="text-secondary text-[13px] leading-relaxed max-w-xl mt-2">
            {report.status === 'Evaluated' 
              ? "Your interview has been fully evaluated. Below is a detailed breakdown of your performance, including AI-generated feedback for each of your answers."
              : "This interview has not been fully evaluated yet."}
          </p>
        </div>

        <div className="shrink-0 z-10">
          <button onClick={onBackToDashboard} className="btn-secondary py-2 px-5 font-bold text-[12px]">
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Questions Breakdown */}
      <div className="space-y-4">
        <h3 className="font-display text-base font-black text-primary px-1 flex items-center gap-2">
          <BrainCircuit className="w-4.5 h-4.5 text-accent" />
          <span>Question Analysis</span>
        </h3>
        
        <div className="grid grid-cols-1 gap-5">
          {report.questions.sort((a,b) => a.order_index - b.order_index).map((q, idx) => (
            <div key={q.id} className="glass-panel rounded-signal-lg border border-border overflow-hidden shadow-sm">
              {/* Question Header */}
              <div className="p-4.5 bg-white/20 border-b border-white/30 flex gap-3.5">
                <div className="shrink-0 w-8 h-8 rounded-full bg-white/40 border border-white/50 flex items-center justify-center text-primary font-bold text-xs shadow-sm">
                  Q{idx + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-primary leading-relaxed">{q.question_text}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {q.expected_skills.map((skill, sIdx) => (
                      <span key={sIdx} className="px-2 py-0.5 rounded bg-white/25 border border-white/35 text-secondary text-[10px] font-semibold">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Answer & Feedback Body */}
              <div className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Your Answer */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-secondary/60" />
                    <span>Your Answer</span>
                  </h4>
                  <div className="p-3.5 rounded-signal-md bg-white/15 border border-white/30 text-[13px] text-secondary min-h-[90px] whitespace-pre-wrap leading-relaxed">
                    {q.response?.user_answer || <span className="text-secondary/40 italic">No answer provided.</span>}
                  </div>
                </div>

                {/* AI Feedback */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Mentor Feedback</span>
                    </h4>
                    {q.response?.score !== null && q.response?.score !== undefined && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        q.response.score >= 80 ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                        q.response.score < 60 ? 'bg-amber-50 border-amber-200 text-amber-600' :
                        'bg-accent/10 border-accent/20 text-accent'
                      }`}>
                        Score: {q.response.score}/100
                      </span>
                    )}
                  </div>
                  <div className="p-3.5 rounded-signal-md bg-accent/5 border border-accent/15 text-[13px] text-primary min-h-[90px] leading-relaxed">
                    {q.response?.feedback || <span className="text-accent/40 italic">Evaluating...</span>}
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
