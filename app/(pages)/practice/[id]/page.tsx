"use client";

import { useEffect, useState, Fragment, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Dialog, Listbox, Transition } from '@headlessui/react';
import { BookOpen, CheckCircle, XCircle, X, ChevronLeft, ChevronDown, Check, GraduationCap, Edit3, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import QuestionCard from '@/components/ui/QuestionCard';
import MobilePassageModal from '@/components/ui/MobilePassageModal';
import AIChatModal from '@/components/ui/AIChatModal';
import { BotMessageSquare } from 'lucide-react';

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
  const [activeChatQuestionId, setActiveChatQuestionId] = useState<number | null>(null);
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
                        ? (isCorrect ? 'var(--success)' : 'var(--danger)')
                        : 'var(--border-strong)'
                    }`,
                    background: results
                      ? (isCorrect ? 'var(--success-dim)' : 'var(--danger-dim)')
                      : 'var(--bg-subtle)',
                    color: results
                      ? (isCorrect ? 'var(--success)' : 'var(--danger)')
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
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-strong)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
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
                              background: active ? 'var(--accent-dim)' : 'transparent',
                              color: selected ? 'var(--accent)' : active ? 'var(--text-primary)' : 'var(--text-secondary)',
                            }}
                          >
                            <span
                              className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black shrink-0"
                              style={{
                                background: selected ? 'var(--accent)' : 'var(--bg-subtle)',
                                color: selected ? 'var(--text-on-accent)' : 'var(--text-muted)',
                              }}
                            >{label}</span>
                            <span className="text-[13px] flex-1">{text || `Option ${label}`}</span>
                            {selected && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />}
                          </li>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>

            {results && !isCorrect && detail && (
              <span className="text-[11px] ml-1 font-semibold" style={{ color: 'var(--success)' }}>
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

  const getExerciseContext = (qId: number) => {
    if (!exercise || !results) return '';
    const q = exercise.questions.find(x => x.id === qId);
    if (!q) return '';
    const userAns = answers[q.id];
    const detail = results.details.find(d => d.question_id === q.id);
    let ctx = `Passage Type: ${exercise.type}\nTitle: ${exercise.title}\nContent:\n${exercise.content}\n\nQuestion:\n`;
    ctx += `${q.question_text || 'Fill in the blank'}\n`;
    if (q.options) ctx += `Options: ${JSON.stringify(q.options)}\n`;
    ctx += `Correct Answer: ${detail?.correct_answer}\nUser Answer: ${userAns || 'None'}\n`;
    if (detail && detail.correction) ctx += `AI Correction: ${detail.correction}\n`;
    return ctx;
  };

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
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-subtle"
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
              className="p-1.5 rounded-lg text-text-muted hover:bg-subtle hover:text-text-secondary transition-all"
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
            <div className="mt-2 h-1 w-40 rounded-full overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
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
              background: 'linear-gradient(135deg, var(--accent-dim), var(--blue-dim))',
              border: '1px solid var(--accent-dim)',
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
            const reviewData = results ? {
              isCorrect: detail?.isCorrect,
              correctAnswer: detail?.correct_answer,
              correction: detail?.correction
            } : null;

            return (
              <QuestionCard
                key={q.id}
                type={exercise.type as any}
                index={idx}
                question={q}
                userAnswer={answers[q.id] || ''}
                onAnswerChange={(val) => handleSelectAnswer(q.id, val)}
                disabled={!!results}
                review={reviewData}
                onAskAI={results ? () => setActiveChatQuestionId(q.id) : undefined}
              />
            );
          })}

          {/* Vocabulary Section */}
          {vocab.length > 0 && (
            <div className="mt-8 pt-6 border-t border-ui-border">
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
                  <div key={v.id} className="flex items-center justify-between p-3 rounded-xl bg-subtle border border-ui-border">
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
                    className="p-3 rounded-xl border border-dashed border-border-strong text-xs text-text-muted hover:text-text-secondary hover:border-accent transition-all"
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
                  <div className="w-4 h-4 border-2 border-text-on-accent/30 border-t-text-on-accent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : 'Submit Answers'}
            </button>
          </div>
        )}
      </div>

      {/* Mobile FABs */}
      <div className="md:hidden fixed bottom-24 right-5 flex flex-col gap-3 z-40">
        {exercise.type === 'reading' && showFab && (
          <button onClick={() => setIsModalOpen(true)} className="w-12 h-12 flex items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105" style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}>
            <BookOpen className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Mobile Modal */}
      <MobilePassageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Reading Passage"
      >
        {renderContentPane()}
      </MobilePassageModal>

      {/* AI Chat Modal */}
      {results && activeChatQuestionId && (() => {
        const q = exercise.questions.find(x => x.id === activeChatQuestionId);
        const qIdx = exercise.questions.findIndex(x => x.id === activeChatQuestionId);
        const detail = results.details.find(d => d.question_id === activeChatQuestionId);
        return (
          <AIChatModal
            isOpen={!!activeChatQuestionId}
            onClose={() => setActiveChatQuestionId(null)}
            exerciseId={id}
            exerciseTitle={exercise.title}
            exerciseType={exercise.type}
            exerciseContext={getExerciseContext(activeChatQuestionId)}
            questionLabel={exercise.type === 'cloze' ? `Blank [${qIdx + 1}]` : `Question ${qIdx + 1}`}
            questionText={q?.question_text || 'Fill in the blank'}
            userAnswer={answers[activeChatQuestionId]}
            aiFeedback={detail?.correction || ''}
          />
        );
      })()}
    </div>
  );
}
