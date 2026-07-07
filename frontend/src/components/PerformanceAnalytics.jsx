import React, { useEffect, useState } from 'react';
import { 
  Trophy, 
  Hourglass, 
  Target, 
  TrendingUp, 
  Sparkles, 
  AlertCircle,
  TrendingDown,
  ChevronRight,
  Brain
} from 'lucide-react';

const PerformanceAnalytics = ({ token, onStartInterview }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/analytics`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error("Failed to load your analytics dashboard.");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [token]);

  if (loading) {
    return (
      <div className="glass-panel p-12 rounded-signal-lg border border-border text-center flex flex-col items-center justify-center min-h-[350px]">
        <div className="w-9 h-9 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-secondary text-[13px] font-medium">Aggregating your preparation metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-8 rounded-signal-lg border border-red-200 bg-red-50 text-center flex flex-col items-center justify-center min-h-[250px]">
        <AlertCircle className="w-9 h-9 text-red-500 mb-3" />
        <h3 className="font-bold text-red-700 text-sm">Failed to load analytics</h3>
        <p className="text-red-600/80 text-[12px] mt-1 max-w-md">{error}</p>
      </div>
    );
  }

  const { total_interviews, avg_score, total_duration_minutes, score_history, skill_performance } = data;

  if (total_interviews === 0) {
    return (
      <div className="glass-panel p-12 rounded-signal-lg border border-border text-center flex flex-col items-center justify-center min-h-[350px] relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-teal-500/5 rounded-full blur-3xl"></div>
        <div className="p-3 bg-accent/10 rounded-xl border border-accent/15 text-accent mb-5">
          <Brain className="w-10 h-10" />
        </div>
        <h2 className="font-display text-lg font-black text-primary">No Analytics Data Yet</h2>
        <p className="text-secondary text-[13px] mt-1.5 max-w-sm mx-auto leading-relaxed">
          Complete at least one mock interview session with feedback to unlock your personalized strengths, weakness, and progress charts.
        </p>
        <button
          onClick={onStartInterview}
          className="btn-primary mt-6 flex items-center gap-1.5 py-2 px-4.5 text-[12px] font-bold"
        >
          <span>Start Your First Interview</span>
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      </div>
    );
  }

  // --- CUSTOM SVG LINE CHART CONFIGURATION ---
  const width = 500;
  const height = 220;
  const paddingX = 40;
  const paddingY = 40;

  // Generate coordinates for points
  const points = score_history.map((item, idx) => {
    const x = score_history.length > 1
      ? paddingX + (idx / (score_history.length - 1)) * (width - 2 * paddingX)
      : width / 2;
    const y = height - paddingY - (item.score / 100) * (height - 2 * paddingY);
    return { x, y, score: item.score, date: item.date, index: idx };
  });

  // Construct SVG Path
  let linePath = "";
  let areaPath = "";

  if (points.length > 0) {
    if (points.length === 1) {
      linePath = `M ${points[0].x - 10} ${points[0].y} L ${points[0].x + 10} ${points[0].y}`;
    } else {
      linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(" ");
      areaPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Header Overview & Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-panel p-5 rounded-signal-lg border border-border flex items-center gap-4 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 w-16 h-16 bg-teal-500/5 rounded-bl-full group-hover:bg-teal-500/10 transition-all"></div>
          <div className="p-2.5 bg-accent/10 text-accent rounded-xl border border-accent/15">
            <Trophy className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-muted tracking-wider">Completed Sessions</span>
            <span className="text-xl font-black text-primary mt-0.5 block leading-none">{total_interviews}</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-signal-lg border border-border flex items-center gap-4 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 w-16 h-16 bg-teal-500/5 rounded-bl-full group-hover:bg-teal-500/10 transition-all"></div>
          <div className="p-2.5 bg-accent/10 text-accent rounded-xl border border-accent/15">
            <Target className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-muted tracking-wider">Average Score</span>
            <div className="flex items-baseline gap-1.5 mt-0.5 leading-none">
              <span className="text-xl font-black text-primary">{avg_score}%</span>
              <span className={`text-[10px] font-bold ${avg_score >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {avg_score >= 70 ? 'Optimal' : 'Needs Practice'}
              </span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-signal-lg border border-border flex items-center gap-4 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 w-16 h-16 bg-teal-500/5 rounded-bl-full group-hover:bg-teal-500/10 transition-all"></div>
          <div className="p-2.5 bg-accent/10 text-accent rounded-xl border border-accent/15">
            <Hourglass className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-muted tracking-wider">Practice Time Spent</span>
            <span className="text-xl font-black text-primary mt-0.5 block leading-none">
              {total_duration_minutes >= 60 
                ? `${Math.floor(total_duration_minutes / 60)}h ${total_duration_minutes % 60}m`
                : `${total_duration_minutes} mins`
              }
            </span>
          </div>
        </div>
      </div>

      {/* 2. Visualizations Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Progress Line Chart (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-signal-lg border border-border flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="font-display font-semibold text-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span>Score Improvement Journey</span>
            </h3>
            <p className="text-[11px] text-secondary mt-0.5">Chronological record of mock interview scores</p>
          </div>

          <div className="my-4 relative flex justify-center items-center w-full">
            {/* SVG Interactive Chart */}
            <svg 
              viewBox={`0 0 ${width} ${height}`} 
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity="0.15"/>
                  <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0"/>
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#e2e8f0" strokeDasharray="3,3" />
              <line x1={paddingX} y1={(height) / 2} x2={width - paddingX} y2={(height) / 2} stroke="#e2e8f0" strokeDasharray="3,3" />
              <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#cbd5e1" strokeWidth="1" />

              {/* Score Labels on Y-Axis */}
              <text x={paddingX - 10} y={paddingY + 3} textAnchor="end" className="text-[9px] fill-slate-400 font-bold font-mono">100</text>
              <text x={paddingX - 10} y={(height) / 2 + 3} textAnchor="end" className="text-[9px] fill-slate-400 font-bold font-mono">50</text>
              <text x={paddingX - 10} y={height - paddingY + 3} textAnchor="end" className="text-[9px] fill-slate-400 font-bold font-mono">0</text>

              {/* Area Under Line */}
              {areaPath && (
                <path d={areaPath} fill="url(#chartGradient)" />
              )}

              {/* Path Line */}
              {linePath && (
                <path 
                  d={linePath} 
                  fill="none" 
                  stroke="#0d9488" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              )}

              {/* X Axis Labels & Helper Grid Lines */}
              {points.map((p, idx) => (
                <g key={idx}>
                  <line x1={p.x} y1={paddingY} x2={p.x} y2={height - paddingY} stroke="#f1f5f9" strokeWidth="1" />
                  <text 
                    x={p.x} 
                    y={height - paddingY + 16} 
                    textAnchor="middle" 
                    className="text-[9px] fill-slate-500 font-bold"
                  >
                    {p.date}
                  </text>
                </g>
              ))}

              {/* Hoverable Interactive Dots */}
              {points.map((p) => (
                <circle 
                  key={p.index} 
                  cx={p.x} 
                  cy={p.y} 
                  r={hoveredPoint?.index === p.index ? "6" : "4"} 
                  fill={hoveredPoint?.index === p.index ? "#14b8a6" : "#0d9488"}
                  stroke="#ffffff" 
                  strokeWidth="1.5" 
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
            </svg>

            {/* Custom Tooltip */}
            {hoveredPoint && (
              <div 
                className="absolute bg-white/30 border border-white/40 rounded-lg px-2.5 py-1.5 shadow-md pointer-events-none text-left backdrop-blur-md animate-fade-in z-20"
                style={{
                  left: `${(hoveredPoint.x / width) * 100}%`,
                  top: `${(hoveredPoint.y / height) * 100 - 15}%`,
                  transform: 'translate(-50%, -100%)'
                }}
              >
                <span className="block text-[9px] text-secondary font-bold uppercase tracking-wider">{hoveredPoint.date}</span>
                <span className="text-[12px] font-black text-accent">Score: {hoveredPoint.score}%</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3.5 text-[10px] text-secondary">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Target: Aim for 80% to be placement-ready</span>
            </span>
          </div>
        </div>

        {/* Right Column: Skill Proficiencies (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-signal-lg border border-border flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="font-display font-semibold text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>Proficiency by Topic</span>
            </h3>
            <p className="text-[11px] text-secondary mt-0.5">Average scores mapped to topic tags</p>
          </div>

          <div className="my-4 space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
            {skill_performance.slice(0, 5).map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-[12px] font-bold text-primary">
                  <span className="truncate max-w-[160px]">{item.skill}</span>
                  <span className="font-mono text-accent font-bold">{item.avg_score}%</span>
                </div>
                
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-border/20 relative">
                  <div 
                    className="h-full bg-accent rounded-full transition-all duration-500" 
                    style={{ width: `${item.avg_score}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {skill_performance.length > 5 && (
              <p className="text-[10px] text-muted text-center italic pt-1">
                + {skill_performance.length - 5} more skill topics analyzed
              </p>
            )}
          </div>

          <div className="border-t border-border pt-3.5 flex justify-between items-center text-[11px]">
            <span className="text-secondary font-medium">Strongest Topic:</span>
            <span className="font-bold text-accent truncate max-w-[120px]">{skill_performance[0]?.skill}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;
