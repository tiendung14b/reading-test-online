"use client";

import { useEffect, useState, Fragment, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Dialog, Listbox, Transition } from '@headlessui/react';
import { BookOpen, CheckCircle, XCircle, X, ChevronLeft, ChevronDown, Check, GraduationCap, Edit3, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

type Question = {
  id: number;
  question_text: string;
  options: Record<string, string>; // { A: "text", B: "text", ... }
  order_index: number;
};

type Vocabulary = {
  id: number;
  word: string;
  meaning: string;
  phonetic: string;
  example: string;
};

type Exercise = {
  id: number;
  title: string;
  content: string;
  type: string;
  questions: Question[];
};

type ResultDetail = {
  question_id: number;
  user_answer: string;
  correct_answer: string;
  isCorrect: boolean;
  correction?: string;
};

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function PracticePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<{ score: number; total: number; details: ResultDetail[] } | null>(null);
  const [vocab, setVocab] = useState<Vocabulary[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFab, setShowFab] = useState(false);
  const mobilePassageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mobilePassageRef.current;
    if (!el) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show FAB when passage is scrolled out of view at the top 
        setShowFab(!entry.isIntersecting && entry.boundingClientRect.bottom < window.innerHeight);
      },
      { threshold: 0 }
    );
    
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, exercise]);

  useEffect(() => {
    fetch(`/api/practice/${id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setExercise(data);
          const init: Record<number, string> = {};
          data.questions.forEach((q: Question) => { init[q.id] = ''; });
          setAnswers(init);
        }
        setLoading(false);
      });

    fetch(`/api/practice/${id}/vocabulary`)
      .then(res => res.json())
      .then(data => setVocab(Array.isArray(data) ? data : []));
  }, [id]);

  const handleSelectAnswer = (qId: number, ans: string) => {
    if (results) return;
    setAnswers(prev => ({ ...prev, [qId]: ans }));
  };

  const handleSubmit = async () => {
    if (submitting || results) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/practice/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (data.success) setResults({ score: data.score, total: data.total, details: data.details });
      else toast.error(data.error);
    } catch { toast.error('Submit failed'); }
    finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (!exercise) return (
    <div className="h-full flex items-center justify-center" style={{ background: 'var(--bg-base)', color: 'var(--text-muted)' }}>
      Exercise not found
    </div>
  );

  /* ----- Cloze renderer ----- */
  const renderCloze = (text: string) => {
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, idx) => {
      const match = part.match(/\[(\d+)\]/);
      if (match) {
        const num = parseInt(match[1], 10);
        const q = exercise.questions.find(q => q.order_index === num - 1);
        if (!q) return <span key={idx}>{part}</span>;
        const detail = results?.details.find(d => d.question_id === q.id);
        const isCorrect = detail?.isCorrect;

        return (
          <span key={idx} className="inline-block mx-1 align-middle relative">
            <Listbox
              value={answers[q.id] || ''}
              onChange={(val) => { if (!results) handleSelectAnswer(q.id, val); }}
              disabled={false}
            >
              <div className="relative inline-block">
                <Listbox.Button
                  className="inline-flex items-center gap-1.5 px-2.5 rounded-lg text-[13px] font-semibold transition-all"
                  style={{
                    height: '28px',
                    border: `1.5px solid ${
                      results
                        ? (isCorrect ? 'rgba(0,212,170,0.6)' : 'rgba(255,77,109,0.6)')
                        : 'rgba(255,255,255,0.2)'
                    }`,
                    background: results
                      ? (isCorrect ? 'rgba(0,212,170,0.12)' : 'rgba(255,77,109,0.12)')
                      : 'rgba(255,255,255,0.07)',
                    color: results
                      ? (isCorrect ? '#00d4aa' : '#ff4d6d')
                      : answers[q.id] ? 'var(--text-primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    outline: 'none',
                    backdropFilter: 'blur(4px)',
                    minWidth: '60px',
                  }}
                >
                  <span>
                    {answers[q.id]
                      ? `${answers[q.id]}${q.options[answers[q.id]] ? `. ${q.options[answers[q.id]].slice(0, 20)}${q.options[answers[q.id]].length > 20 ? '…' : ''}` : ''}`
                      : '— select —'}
                  </span>
                  {!results && <ChevronDown className="w-3 h-3 shrink-0 opacity-50" />}
                </Listbox.Button>

                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Listbox.Options
                    className="absolute z-50 mt-1 rounded-xl overflow-hidden focus:outline-none"
                    style={{
                      background: '#1a1f2e',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                      minWidth: '200px',
                      left: 0,
                    }}
                  >
                    {Object.entries(q.options).map(([label, text]) => (
                      <Listbox.Option key={label} value={label} as={Fragment}>
                        {({ active, selected }) => (
                          <li
                            className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors"
                            style={{
                              background: active ? 'rgba(0,212,170,0.1)' : 'transparent',
                              color: selected ? '#00d4aa' : active ? 'var(--text-primary)' : 'var(--text-secondary)',
                            }}
                          >
                            <span
                              className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black shrink-0"
                              style={{
                                background: selected ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                                color: selected ? '#0b0f19' : 'var(--text-muted)',
                              }}
                            >{label}</span>
                            <span className="text-[13px] flex-1">{text || `Option ${label}`}</span>
                            {selected && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: '#00d4aa' }} />}
                          </li>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>

            {results && !isCorrect && detail && (
              <span className="text-[11px] ml-1 font-semibold" style={{ color: '#00d4aa' }}>
                → {detail.correct_answer}
              </span>
            )}
          </span>
        );
      }
      return (
        <Fragment key={idx}>
          {part.split('\n').map((line, i) =>
            <Fragment key={i}>{i > 0 && <br />}{line}</Fragment>
          )}
        </Fragment>
      );
    });
  };

  const renderContentPane = () => (
    <div
      className="leading-8 text-base whitespace-pre-wrap"
      style={{ color: 'var(--text-secondary)', fontFamily: "'Georgia', serif", lineHeight: '1.85' }}
    >
      {exercise.type === 'cloze' ? renderCloze(exercise.content) : exercise.content}
    </div>
  );

  const answeredCount = Object.values(answers).filter(Boolean).length;
  const totalQ = exercise.questions.length;
  const progressPct = totalQ > 0 ? Math.round((answeredCount / totalQ) * 100) : 0;

  return (
    <div
      className="flex h-full overflow-hidden relative"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* AI Grading Loading Overlay */}
      <Transition
        show={submitting}
        as={Fragment}
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="relative mb-8">
            <Sparkles className="w-16 h-16 text-accent ai-spin-dance" />
            <div className="absolute inset-0 blur-2xl bg-accent/20 rounded-full animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">AI is grading your answers...</h2>
          <p className="text-text-muted text-sm px-8 text-center max-w-md">
            Analyzing your context, grammar, and nuances to provide the most accurate feedback.
          </p>
        </div>
      </Transition>
      {/* Left — Reading/Content pane */}
      <div
        className="hidden md:flex flex-col overflow-hidden"
        style={{ width: '55%', borderRight: '1px solid var(--border)', background: 'var(--bg-surface)' }}
      >
        {/* Pane header */}
        <div
          className="flex items-center gap-3 px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <button
            onClick={() => router.push('/')}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/5"
            style={{ color: 'var(--text-muted)' }}
          >
            <ChevronLeft className="w-4.5 h-4.5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--accent)' }}>
              {exercise.type === 'reading' ? 'Reading Passage' : exercise.type === 'rewriting' ? 'Rewriting' : 'Cloze Test'}
            </p>
            <h1 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {exercise.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/practice/${id}/flashcards`)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Study Flashcards</span>
            </button>
            <button
              onClick={() => router.push(`/edit/${id}`)}
              className="p-1.5 rounded-lg text-text-muted hover:bg-white/5 hover:text-text-secondary transition-all"
              title="Edit Exercise"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          {renderContentPane()}
        </div>
      </div>

      {/* Right — Questions pane */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--bg-base)' }}>
        {/* Panel header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}
        >
          <div className="flex-1 min-w-0">
            {/* Mobile Title */}
            <div className="md:hidden flex flex-col mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--accent)' }}>
                {exercise.type === 'reading' ? 'Reading Passage' : exercise.type === 'rewriting' ? 'Rewriting' : 'Cloze Test'}
              </p>
              <h1 className="text-sm font-bold text-text-primary truncate">{exercise.title}</h1>
            </div>

            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Questions
              <span className="ml-2 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                {answeredCount}/{totalQ} answered
              </span>
            </h2>
            {/* Progress bar */}
            <div className="mt-2 h-1 w-40 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%`, background: 'var(--accent)' }}
              />
            </div>
          </div>
        </div>

        {/* Score banner */}
        {results && (
          <div
            className="mx-5 mt-5 p-5 rounded-2xl shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(0,212,170,0.15), rgba(0,119,255,0.1))',
              border: '1px solid rgba(0,212,170,0.25)',
            }}
          >
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>
              Session Complete
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {Math.round((results.score / results.total) * 100)}%
              </span>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {results.score}/{results.total} correct
              </span>
            </div>
            <button
              onClick={() => router.push('/')}
              className="mt-3 btn-primary px-4 py-2 text-xs"
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {/* Questions list */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
          {/* Mobile: inline cloze content */}
          {exercise.type === 'cloze' && (
            <div
              className="md:hidden rounded-2xl p-5 mb-4"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', lineHeight: '1.8' }}
            >
              {renderContentPane()}
            </div>
          )}

          {/* Mobile: inline reading content */}
          {exercise.type === 'reading' && (
            <div
              ref={mobilePassageRef}
              className="md:hidden rounded-2xl p-5 mb-6"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', lineHeight: '1.8' }}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--accent)' }}>Reading Passage</p>
              {renderContentPane()}
            </div>
          )}

          {exercise.questions.map((q, idx) => {
            const detail = results?.details.find(d => d.question_id === q.id);
            const isReading = exercise.type === 'reading';

            if (exercise.type === 'cloze' && results) {
              const userAns = detail?.user_answer || '—';
              const correctAns = detail?.correct_answer || '';
              const userOptText = q.options[userAns] || '';
              const correctOptText = q.options[correctAns] || '';

              return (
                <div
                  key={q.id}
                  className="rounded-xl p-4"
                  style={{
                    background: 'var(--bg-card)',
                    border: `1px solid ${detail?.isCorrect ? 'rgba(0,212,170,0.3)' : 'rgba(255,77,109,0.3)'}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                      Blank [{idx + 1}]
                    </span>
                    {detail?.isCorrect
                      ? <CheckCircle className="w-4 h-4" style={{ color: '#00d4aa' }} />
                      : <XCircle className="w-4 h-4" style={{ color: '#ff4d6d' }} />
                    }
                  </div>

                  {/* Your answer */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest w-16 shrink-0" style={{ color: 'var(--text-muted)' }}>Your:</span>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded"
                      style={{
                        background: detail?.isCorrect ? 'rgba(0,212,170,0.1)' : 'rgba(255,77,109,0.1)',
                        color: detail?.isCorrect ? '#00d4aa' : '#ff4d6d',
                      }}
                    >
                      {userAns}{userOptText ? `. ${userOptText}` : ''}
                    </span>
                  </div>

                  {/* Correct answer */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest w-16 shrink-0" style={{ color: 'var(--text-muted)' }}>Answer:</span>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded"
                      style={{ background: 'rgba(0,212,170,0.1)', color: '#00d4aa' }}
                    >
                      {correctAns}{correctOptText ? `. ${correctOptText}` : ''}
                    </span>
                  </div>

                  {/* All options list */}
                  <div className="mt-3 pt-3 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
                    {Object.entries(q.options).map(([label, text]) => {
                      const isUser = label === userAns;
                      const isCorrectLabel = label === correctAns;
                      return (
                        <div key={label} className="flex items-center gap-2">
                          <span
                            className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black shrink-0"
                            style={{
                              background: isCorrectLabel ? 'var(--accent)' : isUser && !detail?.isCorrect ? '#ff4d6d' : 'rgba(255,255,255,0.04)',
                              color: isCorrectLabel || (isUser && !detail?.isCorrect) ? '#0b0f19' : 'var(--text-muted)',
                            }}
                          >{label}</span>
                          <span
                            className="text-[11px]"
                            style={{
                              color: isCorrectLabel ? '#00d4aa' : isUser && !detail?.isCorrect ? '#ff4d6d' : 'var(--text-muted)',
                              fontWeight: isCorrectLabel || isUser ? 600 : 400,
                              textDecoration: isUser && !detail?.isCorrect ? 'line-through' : 'none',
                            }}
                          >
                            {text || `Option ${label}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (exercise.type === 'cloze') return null;

            return (
              <div
                key={q.id}
                className="rounded-2xl p-5 transition-all duration-200"
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${
                    results
                      ? (detail?.isCorrect ? 'rgba(0,212,170,0.3)' : 'rgba(255,77,109,0.25)')
                      : 'var(--border)'
                  }`,
                }}
              >
                {/* Question text */}
                <p className="text-sm font-medium mb-4 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold mr-2 align-middle"
                    style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--text-muted)' }}
                  >
                    {idx + 1}
                  </span>
                  {q.question_text || `Question ${idx + 1}`}
                </p>

                {/* Options / Text Input */}
                {exercise.type === 'rewriting' ? (
                  <div className="space-y-3">
                    <textarea
                      rows={3}
                      placeholder="Type your answer here..."
                      value={answers[q.id] || ''}
                      onChange={e => handleSelectAnswer(q.id, e.target.value)}
                      disabled={!!results}
                      className="input-dark w-full px-4 py-3 text-sm leading-relaxed resize-none"
                    />
                    {results && detail && (
                      <div className="p-4 rounded-xl mt-3" style={{ background: detail.isCorrect ? 'rgba(0,212,170,0.1)' : 'rgba(255,77,109,0.1)', border: `1px solid ${detail.isCorrect ? 'rgba(0,212,170,0.2)' : 'rgba(255,77,109,0.2)'}` }}>
                         <p className="text-xs font-bold mb-2 uppercase tracking-widest" style={{ color: detail.isCorrect ? '#00d4aa' : '#ff4d6d' }}>
                           {detail.isCorrect ? 'Correct!' : (detail.correction ? 'Feedback & Correction:' : 'Accepted Answers:')}
                         </p>
                         
                         {detail.correction ? (
                           <div 
                             className="text-sm leading-relaxed ai-correction-content"
                             style={{ color: 'var(--text-secondary)' }}
                             dangerouslySetInnerHTML={{ __html: detail.correction }}
                           />
                         ) : (
                           <ul className="text-sm space-y-1.5" style={{ color: 'var(--text-secondary)' }}>
                             {Object.values(q.options).filter(Boolean).map((opt, i) => (
                               <li key={i} className="flex gap-2"><span style={{ color: 'var(--accent)' }}>•</span> {opt}</li>
                             ))}
                           </ul>
                         )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                  {Object.entries(q.options).map(([label, text]) => {
                    const isSelected = answers[q.id] === label;
                    const isCorrectOpt = results && detail?.correct_answer === label;
                    const isWrongOpt = results && isSelected && !detail?.isCorrect;

                    return (
                      <button
                        key={label}
                        onClick={() => handleSelectAnswer(q.id, label)}
                        disabled={!!results}
                        className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150"
                        style={{
                          background: isCorrectOpt
                            ? 'rgba(0,212,170,0.1)'
                            : isWrongOpt
                            ? 'rgba(255,77,109,0.1)'
                            : isSelected
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${
                            isCorrectOpt
                              ? 'rgba(0,212,170,0.45)'
                              : isWrongOpt
                              ? 'rgba(255,77,109,0.45)'
                              : isSelected
                              ? 'rgba(255,255,255,0.18)'
                              : 'var(--border)'
                          }`,
                          cursor: results ? 'default' : 'pointer',
                        }}
                      >
                        {/* Option letter badge */}
                        <span
                          className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black shrink-0"
                          style={{
                            background: isCorrectOpt
                              ? 'var(--accent)'
                              : isWrongOpt
                              ? '#ff4d6d'
                              : isSelected
                              ? 'rgba(255,255,255,0.15)'
                              : 'rgba(255,255,255,0.06)',
                            color: isCorrectOpt || isWrongOpt ? '#0b0f19' : 'var(--text-muted)',
                          }}
                        >
                          {label}
                        </span>
                        <span
                          className="text-sm flex-1"
                          style={{
                            color: isCorrectOpt
                              ? '#00d4aa'
                              : isWrongOpt
                              ? '#ff4d6d'
                              : isSelected
                              ? 'var(--text-primary)'
                              : 'var(--text-secondary)',
                            fontWeight: isSelected || isCorrectOpt || isWrongOpt ? 600 : 400,
                          }}
                        >
                          {text || `Option ${label}`}
                        </span>
                        {isCorrectOpt && <CheckCircle className="w-4 h-4 shrink-0" style={{ color: '#00d4aa' }} />}
                        {isWrongOpt && <XCircle className="w-4 h-4 shrink-0" style={{ color: '#ff4d6d' }} />}
                      </button>
                    );
                  })}
                </div>
                )}
              </div>
            );
          })}

          {/* Vocabulary Section */}
          {vocab.length > 0 && (
            <div className="mt-8 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">Key Vocabulary</h3>
                <button 
                  onClick={() => router.push(`/practice/${id}/flashcards`)}
                  className="text-[10px] font-bold uppercase tracking-widest text-accent hover:underline"
                >
                  View All Cards
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {vocab.slice(0, 5).map(v => (
                  <div key={v.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div>
                      <p className="text-sm font-bold text-text-primary">{v.word}</p>
                      <p className="text-[10px] text-text-muted">{v.phonetic}</p>
                    </div>
                    <p className="text-xs text-text-secondary italic">{v.meaning}</p>
                  </div>
                ))}
                {vocab.length > 5 && (
                  <button 
                    onClick={() => router.push(`/practice/${id}/flashcards`)}
                    className="p-3 rounded-xl border border-dashed border-white/10 text-xs text-text-muted hover:text-text-secondary hover:border-white/20 transition-all"
                  >
                    + {vocab.length - 5} more words. Practice with Flashcards →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Submit footer */}
        {!results && (
          <div
            className="px-5 py-4 shrink-0"
            style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}
          >
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0b0f19]/30 border-t-[#0b0f19] rounded-full animate-spin" />
                  Submitting...
                </>
              ) : 'Submit Answers'}
            </button>
          </div>
        )}
      </div>

      {/* Mobile FAB to open Reading Content */}
      {exercise.type === 'reading' && showFab && (
        <button
          className="md:hidden fixed bottom-24 right-5 w-12 h-12 flex items-center justify-center rounded-full z-40 transition-all duration-300"
          style={{ background: 'var(--accent)', color: '#0b0f19', boxShadow: '0 4px 20px rgba(0,212,170,0.4)' }}
          onClick={() => setIsModalOpen(true)}
        >
          <BookOpen className="w-5 h-5" />
        </button>
      )}

      {/* Mobile modal for reading passage */}
      <Transition show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 md:hidden" onClose={() => setIsModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end p-3">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-8"
                enterTo="opacity-100 translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-8"
              >
                <Dialog.Panel
                  className="w-full rounded-2xl overflow-hidden"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
                >
                  <div
                    className="flex items-center justify-between px-5 py-4 shrink-0"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <Dialog.Title className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Reading Passage
                    </Dialog.Title>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="overflow-y-auto px-5 py-5 flex-1">
                    {renderContentPane()}
                  </div>
                  <div className="px-5 py-4 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
                    <button
                      className="w-full py-3 rounded-xl text-sm font-semibold"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}
                      onClick={() => setIsModalOpen(false)}
                    >
                      Back to Questions
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
