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

  const handleSubmitInterview = async () => {
    const success = await saveCurrentAnswer();
    if (success) {
      // Transition to active evaluation phase
      onInterviewFinished(interview.id);
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
      return <p key={index} className="text-slate-200 text-sm md:text-base leading-relaxed whitespace-pre-line">{part}</p>;
    });
  };

  if (questions.length === 0) {
    return (
      <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h3 className="font-bold text-slate-100">No questions found</h3>
        <p className="text-xs text-slate-400">This interview session has no questions associated with it.</p>
        <button onClick={onQuit} className="btn-secondary">Go Back</button>
      </div>
    );
  }

  const progressPercentage = ((currentIdx + 1) / questions.length) * 100;
  const currentAnswer = answers[currentQuestion.id] || '';

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 relative overflow-hidden flex flex-col justify-between min-h-[500px]">
      {/* Background radial highlight */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-violet-600/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header Info */}
      <div className="p-6 border-b border-slate-800/80 flex items-center justify-between gap-4 bg-slate-900/10">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-violet-600/10 border border-violet-500/20 text-violet-400 rounded-full">
              {interview.role}
            </span>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-400 rounded-full border border-slate-700">
              {interview.difficulty}
            </span>
          </div>
          <h2 className="text-md font-bold text-slate-100">Interactive Interview Room</h2>
        </div>

        <button 
          onClick={onQuit} 
          className="px-3 py-1.5 rounded-lg bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all duration-200"
        >
          <Square className="w-3 h-3 fill-red-400/20" />
          <span>Quit Session</span>
        </button>
      </div>

      {/* Progress Indicators */}
      <div className="px-6 pt-4 space-y-3">
        <div className="flex justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <span>Question {currentIdx + 1} of {questions.length}</span>
          <span className="flex items-center gap-1.5 text-violet-400 font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>Time Spent: {formatTime(times[currentQuestion.id])}</span>
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-violet-600 to-indigo-600 h-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>

        {/* Bubble Question Pills */}
        <div className="flex justify-center gap-2 pt-1">
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
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                  isActive 
                    ? 'bg-violet-600 border border-violet-500 text-white shadow-lg shadow-violet-600/20 scale-110'
                    : isCompleted
                      ? 'bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                {isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Question & Answer Body */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
        {/* Question Text */}
        <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-850/80 shadow-inner flex gap-4 items-start">
          <div className="p-2 bg-slate-800 text-slate-400 rounded-lg border border-slate-750 font-bold text-sm shrink-0">
            Q{currentIdx + 1}
          </div>
          <div className="space-y-1 w-full">
            {renderQuestionText(currentQuestion.question_text)}
          </div>
        </div>

        {/* Speech Dictation / Error Alerts */}
        {speechError && (
          <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
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
            className="w-full min-h-[160px] p-4 pr-14 rounded-xl text-sm bg-slate-950 border border-slate-850 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition-all leading-relaxed resize-none"
          />

          {/* Glowing Mic button */}
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleRecording}
              disabled={isSubmitting}
              className={`p-2.5 rounded-full border transition-all ${
                isRecording
                  ? 'bg-red-600 border-red-500 text-white animate-pulse shadow-lg shadow-red-600/30'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
              title={isRecording ? 'Stop voice recording' : 'Dictate answer with voice'}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-red-950/20 border border-red-500/10 rounded-xl text-xs text-red-400 text-center font-medium">
            {error}
          </div>
        )}
      </div>

      {/* Footer Navigation Buttons */}
      <div className="p-6 border-t border-slate-800/80 flex items-center justify-between gap-4 bg-slate-900/10">
        <button
          onClick={handlePrev}
          disabled={currentIdx === 0 || isSubmitting}
          className="btn-secondary py-2 px-4 text-xs flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        {currentIdx < questions.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="btn-primary py-2 px-5 text-xs flex items-center gap-1.5"
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
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/15 active:scale-[0.98] transition-all flex items-center gap-1.5"
          >
            {isSubmitting ? (
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
