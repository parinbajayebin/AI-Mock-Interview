import React from 'react';
import { 
  Sparkles, 
  Loader2, 
  ArrowLeft, 
  ArrowRight, 
  Mic, 
  MicOff, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  HelpCircle,
  Square
} from 'lucide-react';

export default function ActiveInterview({ interview, token, onInterviewFinished, onQuit }) {
  const questions = interview.questions || [];
  
  const [currentIdx, setCurrentIdx] = React.useState(() => {
    const unansweredIdx = questions.findIndex(q => !q.response);
    return unansweredIdx === -1 ? 0 : unansweredIdx;
  });
  
  const [answers, setAnswers] = React.useState(() => {
    const initialAnswers = {};
    questions.forEach(q => {
      if (q.response) {
        initialAnswers[q.id] = q.response.user_answer || '';
      }
    });
    return initialAnswers;
  });

  const [times, setTimes] = React.useState(() => {
    const initialTimes = {};
    questions.forEach(q => {
      if (q.response) {
        initialTimes[q.id] = q.response.duration_seconds || 0;
      }
    });
    return initialTimes;
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Voice recording state
  const [isRecording, setIsRecording] = React.useState(false);
  const [speechError, setSpeechError] = React.useState(null);
  const recognitionRef = React.useRef(null);

  const currentQuestion = questions[currentIdx];

  // Stopwatches for each question
  const timerRef = React.useRef(null);

  // Initialize timers
  React.useEffect(() => {
    // Start stopwatch for current question
    if (currentQuestion) {
      if (!times[currentQuestion.id]) {
        setTimes(prev => ({ ...prev, [currentQuestion.id]: 0 }));
      }

      timerRef.current = setInterval(() => {
        setTimes(prev => ({
          ...prev,
          [currentQuestion.id]: (prev[currentQuestion.id] || 0) + 1
        }));
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentIdx, currentQuestion]);

  // Handle Web Speech API setup
  React.useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsRecording(true);
        setSpeechError(null);
      };

      rec.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        if (transcript && currentQuestion) {
          setAnswers(prev => {
            const existing = prev[currentQuestion.id] || '';
            const separator = existing ? ' ' : '';
            return {
              ...prev,
              [currentQuestion.id]: existing + separator + transcript
            };
          });
        }
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission blocked. Please allow mic access in your browser settings.');
        } else {
          setSpeechError(`Voice input error: ${event.error}`);
        }
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [currentIdx, currentQuestion]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setSpeechError('Web Speech API is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setSpeechError(null);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  const handleTextChange = (e) => {
    if (currentQuestion) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: e.target.value
      }));
    }
  };

  const saveCurrentAnswer = async () => {
    if (!currentQuestion) return false;
    const answerText = answers[currentQuestion.id]?.trim() || '';
    if (!answerText) {
      setError('Please provide an answer before proceeding.');
      return false;
    }

    setError(null);
    setIsSubmitting(true);
    // Stop recording if active
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || ''}/api/interviews/${interview.id}/questions/${currentQuestion.id}/answer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            user_answer: answerText,
            duration_seconds: times[currentQuestion.id] || 0
          })
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to save response');
      }

      setIsSubmitting(false);
      return true;
    } catch (err) {
      console.error(err);
      setError(err.message || 'Network error saving response. Please try again.');
      setIsSubmitting(false);
      return false;
    }
  };

  const handleNext = async () => {
    const success = await saveCurrentAnswer();
    if (success) {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(prev => prev + 1);
      }
    }
  };

  const handlePrev = () => {
    setError(null);
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  const [isEvaluating, setIsEvaluating] = React.useState(false);

  const handleSubmitInterview = async () => {
    const success = await saveCurrentAnswer();
    if (success) {
      setIsEvaluating(true);
      setError(null);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || ''}/api/interviews/${interview.id}/evaluate`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || 'Failed to evaluate interview');
        }
        // Transition to active evaluation phase
        onInterviewFinished(interview.id);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Error generating AI evaluation. Please try again.');
        setIsEvaluating(false);
      }
    }
  };

  const formatTime = (totalSeconds) => {
    const s = totalSeconds || 0;
    const minutes = Math.floor(s / 60);
    const seconds = s % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Helper to split text and render Markdown-like code fences
  const renderQuestionText = (text) => {
    if (!text) return null;
    const parts = text.split(/(```[a-z]*\n[\s\S]*?\n```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const lines = part.split('\n');
        const code = lines.slice(1, -1).join('\n');
        return (
          <pre key={index} className="my-4 p-4 rounded-xl bg-slate-950 border border-slate-800 overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed">
            <code>{code}</code>
          </pre>
        );
      }
      return <p key={index} style={{ color: '#0f172a' }} className="font-semibold text-sm md:text-base leading-relaxed whitespace-pre-line">{part}</p>;
    });
  };

  if (questions.length === 0) {
    return (
      <div className="glass-panel p-8 rounded-signal-lg text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="font-display font-bold text-primary">No questions found</h3>
        <p className="text-[12px] text-secondary">This interview session has no questions associated with it.</p>
        <button onClick={onQuit} className="btn-secondary">Go Back</button>
      </div>
    );
  }

  const progressPercentage = ((currentIdx + 1) / questions.length) * 100;
  const currentAnswer = answers[currentQuestion.id] || '';

  return (
    <div className="glass-panel rounded-signal-lg border border-border relative overflow-hidden flex flex-col justify-between min-h-[550px] shadow-sm">
      {/* Background radial highlight */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header Info */}
      <div className="p-5 border-b border-border flex items-center justify-between gap-4 bg-white/40">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="px-2 py-0.5 text-[9px] font-bold bg-accent/5 border border-accent/15 text-accent rounded-full uppercase tracking-wider">
              {interview.role}
            </span>
            <span className="px-2 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-700 rounded-full border border-slate-200 uppercase tracking-wider">
              {interview.difficulty}
            </span>
            {(interview.job_description || interview.company_context) && (
              <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-600 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                Premium Loop
              </span>
            )}
          </div>
          <h2 className="font-display text-base font-black tracking-tight text-primary">
            {(interview.job_description || interview.company_context) ? 'Personalized Mock Loop' : 'Interactive Interview Room'}
          </h2>
        </div>

        <button 
          onClick={onQuit} 
          className="px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[11px] font-bold flex items-center gap-1.5 transition-all duration-200"
        >
          <Square className="w-3 h-3 fill-red-600/10" />
          <span>Quit Session</span>
        </button>
      </div>

      {/* Progress Indicators */}
      <div className="px-6 pt-4 space-y-3">
        <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-secondary">
          <span>Question {currentIdx + 1} of {questions.length}</span>
          <span className="flex items-center gap-1 text-accent font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono">{formatTime(times[currentQuestion.id])}</span>
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-border/20">
          <div 
            className="bg-accent h-full transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>

        {(interview.job_description || interview.company_context) && (
          <div className="px-3.5 py-2.5 bg-gradient-to-r from-amber-500/5 via-teal-500/5 to-cyan-500/5 border border-amber-500/15 rounded-lg flex items-center justify-between gap-3 text-[11.5px] text-slate-500">
            <span className="leading-relaxed text-left">
              🔒 <strong>Premium Session:</strong> This mock interview loop is customized to reference actual projects, system engineering challenges, and tech stack requirements found in the target job spec and company history.
            </span>
          </div>
        )}

        {/* Bubble Question Pills */}
        <div className="flex justify-center gap-1.5 pt-1">
          {questions.map((q, idx) => {
            const isCompleted = answers[q.id]?.trim().length > 0 && idx !== currentIdx;
            const isActive = idx === currentIdx;
            return (
              <button
                key={q.id}
                disabled={isSubmitting}
                onClick={async () => {
                  // Save current before jumping
                  if (idx !== currentIdx) {
                    const saved = await saveCurrentAnswer();
                    if (saved) setCurrentIdx(idx);
                  }
                }}
                className={`w-7 h-7 rounded-full text-[11px] font-bold flex items-center justify-center transition-all border ${
                  isActive 
                    ? 'bg-accent border-accent text-white shadow-sm scale-110'
                    : isCompleted
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                      : 'bg-white/10 border-white/20 text-secondary hover:border-white/30 hover:bg-white/20'
                }`}
              >
                {isCompleted ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Question & Answer Body */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
        {/* Question Text */}
        <div className="p-4.5 rounded-signal-lg bg-white/20 border border-white/30 backdrop-blur-md shadow-inner flex gap-3.5 items-start">
          <div className="p-2 bg-white/40 text-accent rounded-lg border border-white/50 font-bold text-[12px] shrink-0">
            Q{currentIdx + 1}
          </div>
          <div className="space-y-1 w-full min-w-0">
            {renderQuestionText(currentQuestion.question_text)}
          </div>
        </div>

        {/* Speech Dictation / Error Alerts */}
        {speechError && (
          <div className="p-3 bg-red-50/50 backdrop-blur-md border border-red-200 rounded-signal-md flex items-center gap-2 text-[12px] text-red-700">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p>{speechError}</p>
          </div>
        )}

        {/* Answer Textarea */}
        <div className="relative">
          <textarea
            disabled={isSubmitting}
            value={currentAnswer}
            onChange={handleTextChange}
            placeholder="Type your response here. Try to explain your architecture, logic, or step-by-step approach in detail..."
            className="w-full min-h-[160px] p-4 pr-12 rounded-signal-md text-[13px] bg-white/25 border border-white/35 text-primary placeholder-secondary/40 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all leading-relaxed resize-none shadow-sm"
          />

          {/* Glowing Mic button */}
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleRecording}
              disabled={isSubmitting}
              className={`p-2 rounded-full border transition-all ${
                isRecording
                  ? 'bg-red-600 border-red-500 text-white animate-pulse shadow-md shadow-red-600/20'
                  : 'bg-white/25 border border-white/35 text-secondary hover:text-primary hover:bg-white/40 hover:shadow-sm'
              }`}
              title={isRecording ? 'Stop voice recording' : 'Dictate answer with voice'}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-signal-md text-[12px] text-red-700 text-center font-bold">
            {error}
          </div>
        )}
      </div>

      {/* Footer Navigation Buttons */}
      <div className="p-5 border-t border-border flex items-center justify-between gap-4 bg-white/40">
        <button
          onClick={handlePrev}
          disabled={currentIdx === 0 || isSubmitting}
          className="btn-secondary py-2 px-4 text-[12px] flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        {currentIdx < questions.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="btn-primary py-2 px-5 text-[12px] flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>Save & Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleSubmitInterview}
            disabled={isSubmitting || isEvaluating}
            className="px-5 py-2 px-6 rounded-signal-md bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-[12px] font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-60"
          >
            {isEvaluating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>AI is evaluating...</span>
              </>
            ) : isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>Submit & Generate Evaluation</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
