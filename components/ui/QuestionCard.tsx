"use client";

import { CheckCircle, XCircle, Sparkles } from 'lucide-react';

export type QuestionData = {
  id: number;
  question_text: string;
  options?: Record<string, string>;
  correct_answer?: string; // used in history
};

export type QuestionReviewData = {
  isCorrect?: boolean;
  correctAnswer?: string;
  correction?: string | null;
};

interface QuestionCardProps {
  type: 'reading' | 'rewriting' | 'cloze';
  index: number;
  question: QuestionData;
  userAnswer?: string;
  onAnswerChange?: (val: string) => void;
  disabled?: boolean;
  review?: QuestionReviewData | null;
  onAskAI?: () => void;
}

export default function QuestionCard({
  type,
  index,
  question,
  userAnswer = '',
  onAnswerChange,
  disabled = false,
  review,
  onAskAI
}: QuestionCardProps) {
  // Interactive cloze is handled inline in the passage, so return null if not reviewing
  if (type === 'cloze' && !review) return null;

  // Render Cloze Review Card
  if (type === 'cloze' && review) {
    const correctAns = review.correctAnswer || question.correct_answer || '';
    const userOptText = question.options?.[userAnswer] || '';
    const correctOptText = question.options?.[correctAns] || '';

    return (
      <div
        className="rounded-xl p-4"
        style={{
          background: 'var(--bg-card)',
          border: `1px solid ${review.isCorrect ? 'var(--success-dim)' : 'var(--danger-dim)'}`,
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            Blank [{index + 1}]
          </span>
          <div className="flex items-center gap-2">
            {onAskAI && (
              <button
                onClick={onAskAI}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors"
                style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
              >
                <Sparkles className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Ask AI</span>
              </button>
            )}
            {review.isCorrect
              ? <CheckCircle className="w-4 h-4" style={{ color: 'var(--success)' }} />
              : <XCircle className="w-4 h-4" style={{ color: 'var(--danger)' }} />
            }
          </div>
        </div>

        {/* Your answer */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest w-16 shrink-0" style={{ color: 'var(--text-muted)' }}>Your:</span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded"
            style={{
              background: review.isCorrect ? 'var(--success-dim)' : 'var(--danger-dim)',
              color: review.isCorrect ? 'var(--success)' : 'var(--danger)',
            }}
          >
            {userAnswer || '—'}{userOptText ? `. ${userOptText}` : ''}
          </span>
        </div>

        {/* Correct answer */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest w-16 shrink-0" style={{ color: 'var(--text-muted)' }}>Answer:</span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded"
            style={{ background: 'var(--success-dim)', color: 'var(--success)' }}
          >
            {correctAns}{correctOptText ? `. ${correctOptText}` : ''}
          </span>
        </div>

        {/* All options list */}
        {question.options && Object.keys(question.options).length > 0 && (
          <div className="mt-3 pt-3 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
            {Object.entries(question.options).map(([label, text]) => {
              const isUser = label === userAnswer;
              const isCorrectLabel = label === correctAns;
              return (
                <div key={label} className="flex items-center gap-2">
                  <span
                    className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black shrink-0"
                    style={{
                      background: isCorrectLabel ? 'var(--accent)' : isUser && !review.isCorrect ? 'var(--danger)' : 'var(--bg-subtle)',
                      color: isCorrectLabel || (isUser && !review.isCorrect) ? 'var(--text-on-accent)' : 'var(--text-muted)',
                    }}
                  >{label}</span>
                  <span
                    className="text-[11px]"
                    style={{
                      color: isCorrectLabel ? 'var(--success)' : isUser && !review.isCorrect ? 'var(--danger)' : 'var(--text-muted)',
                      fontWeight: isCorrectLabel || isUser ? 600 : 400,
                      textDecoration: isUser && !review.isCorrect ? 'line-through' : 'none',
                    }}
                  >
                    {text || `Option ${label}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Render Standard Question (Reading / Rewriting)
  return (
    <div
      className="rounded-2xl p-5 transition-all duration-200"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${
          review
            ? (review.isCorrect ? 'var(--success-dim)' : 'var(--danger-dim)')
            : 'var(--border)'
        }`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-text-muted">Question {index + 1}</span>
        <div className="flex items-center gap-2">
          {review && onAskAI && (
            <button
              onClick={onAskAI}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors"
              style={{ background: 'var(--success-dim)', color: 'var(--success)', border: '1px solid var(--success-dim)' }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Ask AI</span>
            </button>
          )}
          {review && (
            review.isCorrect
              ? <CheckCircle className="w-4 h-4" style={{ color: 'var(--success)' }} />
              : <XCircle className="w-4 h-4" style={{ color: 'var(--danger)' }} />
          )}
        </div>
      </div>
      
      {/* Question text */}
      <p className="text-sm font-medium mb-4 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
        {question.question_text || `Question ${index + 1}`}
      </p>

      {/* Options / Text Input */}
      {type === 'rewriting' ? (
        <div className="space-y-3">
          {review ? (
            // Review mode rewriting shows what you typed (as disabled textarea or text block)
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest w-16 shrink-0 text-text-muted">Your:</span>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded"
                style={{
                  background: review.isCorrect ? 'var(--success-dim)' : 'var(--danger-dim)',
                  color: review.isCorrect ? 'var(--success)' : 'var(--danger)',
                }}
              >
                {userAnswer || '—'}
              </span>
            </div>
          ) : (
            <textarea
              rows={3}
              placeholder="Type your answer here..."
              value={userAnswer || ''}
              onChange={e => onAnswerChange?.(e.target.value)}
              disabled={disabled}
              className="input-dark w-full px-4 py-3 text-sm leading-relaxed resize-none"
            />
          )}

          {review && (
            <div className="p-4 rounded-xl mt-3" style={{ background: review.isCorrect ? 'var(--success-dim)' : 'var(--danger-dim)', border: `1px solid ${review.isCorrect ? 'var(--success-dim)' : 'var(--danger-dim)'}` }}>
               <p className="text-xs font-bold mb-2 uppercase tracking-widest" style={{ color: review.isCorrect ? 'var(--success)' : 'var(--danger)' }}>
                 {review.isCorrect ? 'Correct!' : (review.correction ? 'Feedback & Correction:' : 'Accepted Answers:')}
               </p>
               
               {review.correction ? (
                 <div 
                   className="text-sm leading-relaxed ai-correction-content"
                   style={{ color: 'var(--text-secondary)' }}
                   dangerouslySetInnerHTML={{ __html: review.correction }}
                 />
               ) : (
                 <ul className="text-sm space-y-1.5" style={{ color: 'var(--text-secondary)' }}>
                   {question.options && Object.values(question.options).filter(Boolean).map((opt, i) => (
                     <li key={i} className="flex gap-2"><span style={{ color: 'var(--accent)' }}>•</span> {opt as string}</li>
                   ))}
                 </ul>
               )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {question.options && Object.entries(question.options).map(([label, text]) => {
            const isSelected = userAnswer === label;
            const correctAns = review?.correctAnswer || question.correct_answer;
            const isCorrectOpt = review && correctAns === label;
            const isWrongOpt = review && isSelected && !review.isCorrect;

            return (
              <button
                key={label}
                onClick={() => onAnswerChange?.(label)}
                disabled={disabled || !!review}
                className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150"
                style={{
                  background: isCorrectOpt
                    ? 'var(--success-dim)'
                    : isWrongOpt
                    ? 'var(--danger-dim)'
                    : isSelected
                    ? 'var(--bg-card-hover)'
                    : 'var(--bg-subtle)',
                  border: `1px solid ${
                    isCorrectOpt
                      ? 'var(--success)'
                      : isWrongOpt
                      ? 'var(--danger)'
                      : isSelected
                      ? 'var(--border-strong)'
                      : 'var(--border)'
                  }`,
                  cursor: (disabled || review) ? 'default' : 'pointer',
                }}
              >
                {/* Option letter badge */}
                <span
                  className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black shrink-0"
                  style={{
                    background: isCorrectOpt
                      ? 'var(--accent)'
                      : isWrongOpt
                      ? 'var(--danger)'
                      : isSelected
                      ? 'var(--border-strong)'
                      : 'var(--bg-subtle)',
                    color: isCorrectOpt || isWrongOpt ? 'var(--text-on-accent)' : 'var(--text-muted)',
                  }}
                >
                  {label}
                </span>
                <span
                  className="text-sm flex-1"
                  style={{
                    color: isCorrectOpt
                      ? 'var(--success)'
                      : isWrongOpt
                      ? 'var(--danger)'
                      : isSelected
                      ? 'var(--text-primary)'
                      : 'var(--text-secondary)',
                    fontWeight: isSelected || isCorrectOpt || isWrongOpt ? 600 : 400,
                  }}
                >
                  {text || `Option ${label}`}
                </span>
                {isCorrectOpt && <CheckCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--success)' }} />}
                {isWrongOpt && <XCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--danger)' }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
