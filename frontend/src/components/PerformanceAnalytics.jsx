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
      <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 text-sm">Aggregating your preparation metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-8 rounded-2xl border border-red-500/20 bg-red-950/5 text-center flex flex-col items-center justify-center min-h-[300px]">
        <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
        <h3 className="font-semibold text-slate-200">Failed to load analytics</h3>
        <p className="text-red-400/80 text-xs mt-1 max-w-md">{error}</p>
      </div>
    );
  }

  const { total_interviews, avg_score, total_duration_minutes, score_history, skill_performance } = data;

  if (total_interviews === 0) {
    return (
      <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-violet-600/5 rounded-full blur-3xl"></div>
        <div className="p-4 bg-violet-600/10 rounded-2xl border border-violet-500/20 text-violet-400 mb-6">
          <Brain className="w-12 h-12" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">No Analytics Data Yet</h2>
        <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
          Complete at least one mock interview session with feedback to unlock your personalized strengths, weakness, and progress charts.
        </p>
        <button
          onClick={onStartInterview}
          className="btn-primary mt-8 flex items-center gap-2 py-2.5 px-5 text-sm"
        >
          <span>Start Your First Interview</span>
          <ChevronRight className="w-4 h-4" />
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
    <div className="space-y-8 animate-fade-in">
      {/* 1. Header Overview & Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-violet-600/5 rounded-bl-full group-hover:bg-violet-600/10 transition-all"></div>
          <div className="p-3 bg-violet-600/10 text-violet-400 rounded-xl border border-violet-500/20">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Completed Sessions</span>
            <span className="text-2xl font-bold text-slate-100 mt-1 block">{total_interviews}</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-violet-600/5 rounded-bl-full group-hover:bg-violet-600/10 transition-all"></div>
          <div className="p-3 bg-violet-600/10 text-violet-400 rounded-xl border border-violet-500/20">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Average Score</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-100">{avg_score}%</span>
              <span className={`text-[10px] font-semibold flex items-center ${avg_score >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {avg_score >= 70 ? 'Optimal' : 'Needs Practice'}
              </span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-violet-600/5 rounded-bl-full group-hover:bg-violet-600/10 transition-all"></div>
          <div className="p-3 bg-violet-600/10 text-violet-400 rounded-xl border border-violet-500/20">
            <Hourglass className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Practice Time Spent</span>
            <span className="text-2xl font-bold text-slate-100 mt-1 block">
              {total_duration_minutes >= 60 
                ? `${Math.floor(total_duration_minutes / 60)}h ${total_duration_minutes % 60}m`
                : `${total_duration_minutes} mins`
              }
            </span>
          </div>
        </div>
      </div>

      {/* 2. Visualizations Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Progress Line Chart (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-400" />
              <span>Score Improvement Journey</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Chronological record of mock interview scores</p>
          </div>

          <div className="my-6 relative flex justify-center items-center w-full">
            {/* SVG Interactive Chart */}
            <svg 
              viewBox={`0 0 ${width} ${height}`} 
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0"/>
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#1e293b" strokeDasharray="3,3" />
              <line x1={paddingX} y1={(height) / 2} x2={width - paddingX} y2={(height) / 2} stroke="#1e293b" strokeDasharray="3,3" />
              <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#334155" strokeWidth="1" />

              {/* Score Labels on Y-Axis */}
              <text x={paddingX - 10} y={paddingY + 4} textAnchor="end" className="text-[9px] fill-slate-500 font-semibold font-mono">100</text>
              <text x={paddingX - 10} y={(height) / 2 + 4} textAnchor="end" className="text-[9px] fill-slate-500 font-semibold font-mono">50</text>
              <text x={paddingX - 10} y={height - paddingY + 4} textAnchor="end" className="text-[9px] fill-slate-500 font-semibold font-mono">0</text>

              {/* Area Under Line */}
              {areaPath && (
                <path d={areaPath} fill="url(#chartGradient)" />
              )}

              {/* Path Line */}
              {linePath && (
                <path 
                  d={linePath} 
                  fill="none" 
                  stroke="#8b5cf6" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              )}

              {/* X Axis Labels & Helper Grid Lines */}
              {points.map((p, idx) => (
                <g key={idx}>
                  <line x1={p.x} y1={paddingY} x2={p.x} y2={height - paddingY} stroke="#1e293b" strokeWidth="0.5" />
                  <text 
                    x={p.x} 
                    y={height - paddingY + 18} 
                    textAnchor="middle" 
                    className="text-[9px] fill-slate-400 font-semibold"
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
                  fill={hoveredPoint?.index === p.index ? "#a78bfa" : "#8b5cf6"}
                  stroke="#0f172a" 
                  strokeWidth="2" 
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
            </svg>

            {/* Custom Tooltip */}
            {hoveredPoint && (
              <div 
                className="absolute bg-slate-900 border border-violet-500/30 rounded-xl px-3 py-1.5 shadow-xl pointer-events-none text-left backdrop-blur-md animate-fade-in"
                style={{
                  left: `${(hoveredPoint.x / width) * 100}%`,
                  top: `${(hoveredPoint.y / height) * 100 - 18}%`,
                  transform: 'translate(-50%, -100%)'
                }}
              >
                <span className="block text-[9px] text-slate-500 font-semibold uppercase tracking-wider">{hoveredPoint.date}</span>
                <span className="text-xs font-bold text-violet-300">Score: {hoveredPoint.score}%</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Target: Aim for 80% to be placement-ready</span>
            </span>
          </div>
        </div>

        {/* Right Column: Skill Proficiencies (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span>Proficiency by Topic</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Average scores mapped to topic tags</p>
          </div>

          <div className="my-6 space-y-4 max-h-[220px] overflow-y-auto pr-1">
            {skill_performance.slice(0, 5).map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                  <span className="truncate max-w-[160px]">{item.skill}</span>
                  <span className="font-mono text-violet-400">{item.avg_score}%</span>
                </div>
                
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/50 relative">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-500" 
                    style={{ width: `${item.avg_score}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {skill_performance.length > 5 && (
              <p className="text-[10px] text-slate-500 text-center italic pt-1">
                + {skill_performance.length - 5} more skill topics analyzed
              </p>
            )}
          </div>

          <div className="border-t border-slate-800/80 pt-4 flex justify-between items-center text-[10px]">
            <span className="text-slate-500">Strongest Topic:</span>
            <span className="font-bold text-violet-400 truncate max-w-[120px]">{skill_performance[0]?.skill}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;
