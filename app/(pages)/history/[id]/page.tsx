"use client";

import { useEffect, useState, Fragment, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Dialog, Listbox, Transition } from '@headlessui/react';
import { BookOpen, CheckCircle, XCircle, X, ChevronLeft, ChevronDown, Trophy, Calendar } from 'lucide-react';

type Question = {
  id: number;
  question_text: string;
  options: Record<string, string>;
  correct_answer: string;
  order_index: number;
};

type HistoryDetail = {
  result_id: number;
  score: number;
  user_answers: Record<number, string>;
  ai_evaluation?: Array<{
    question_id: number;
    user_answer: string;
    correct_answer: string;
    isCorrect: boolean;
    correction: string | null;
  }> | null;
  completed_at: string;
  exercise_id: number;
  title: string;
  content: string;
  type: string;
  questions: Question[];
};

export default function HistoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<HistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFab, setShowFab] = useState(false);
  const mobilePassageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/history/${id}`)
      .then(res => res.json())
      .then(d => {
        if (!d.error) setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const el = mobilePassageRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowFab(!entry.isIntersecting && entry.boundingClientRect.bottom < window.innerHeight),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, data]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!data) return (
    <div className="h-full flex items-center justify-center flex-col gap-4" style={{ background: 'var(--bg-base)' }}>
      <p style={{ color: 'var(--text-muted)' }}>History record not found</p>
      <button onClick={() => router.push('/history')} className="btn-primary px-4 py-2 text-sm">Back to History</button>
    </div>
  );

  const renderCloze = (text: string) => {
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, idx) => {
      const match = part.match(/\[(\d+)\]/);
      if (match) {
        const num = parseInt(match[1], 10);
        const q = data.questions.find(q => q.order_index === num - 1);
        if (!q) return <span key={idx}>{part}</span>;
        
        const userAns = data.user_answers[q.id];
        const isCorrect = userAns === q.correct_answer;

        return (
          <span key={idx} className="inline-block mx-1 align-middle relative group">
            <span
              className="inline-flex items-center px-2.5 rounded-lg text-[13px] font-semibold transition-all"
              style={{
                height: '28px',
                border: `1.5px solid ${isCorrect ? 'rgba(0,212,170,0.6)' : 'rgba(255,77,109,0.6)'}`,
                background: isCorrect ? 'rgba(0,212,170,0.12)' : 'rgba(255,77,109,0.12)',
                color: isCorrect ? '#00d4aa' : '#ff4d6d',
                backdropFilter: 'blur(4px)',
                minWidth: '60px',
              }}
            >
              {userAns || '—'}
            </span>
            {!isCorrect && (
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-[#0b0f19] text-[10px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                Correct: {q.correct_answer}
              </span>
            )}
          </span>
        );
      }
      return <Fragment key={idx}>{part}</Fragment>;
    });
  };

  const ContentPane = () => (
    <div className="leading-8 text-base whitespace-pre-wrap" style={{ color: 'var(--text-secondary)', fontFamily: "'Georgia', serif", lineHeight: '1.85' }}>
      {data.type === 'cloze' ? renderCloze(data.content) : data.content}
    </div>
  );

  return (
    <div className="flex h-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Left Pane - Desktop */}
      <div className="hidden md:flex flex-col overflow-hidden" style={{ width: '55%', borderRight: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <div className="flex items-center gap-3 px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => router.push('/history')} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 text-text-muted">
            <ChevronLeft className="w-4.5 h-4.5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--accent)' }}>Review: {data.type === 'reading' ? 'Passage' : 'Cloze'}</p>
            <h1 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{data.title}</h1>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-8"><ContentPane /></div>
      </div>

      {/* Right Pane */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary">Review Results</h2>
            <span className="text-xs text-text-muted flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(data.completed_at).toLocaleDateString()}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-text-primary">{data.score}%</span>
              <span className="text-sm text-text-muted">Final Score</span>
            </div>
            <Trophy className="w-8 h-8" style={{ color: data.score >= 80 ? 'var(--accent)' : 'var(--text-muted)' }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {/* Mobile Content */}
          <div className="md:hidden card-glass rounded-2xl p-5 mb-6" ref={mobilePassageRef}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3 text-accent">Passage Content</p>
            <ContentPane />
          </div>

          {data.questions.map((q, idx) => {
            const userAns = data.user_answers[q.id];
            const isCorrect = userAns === q.correct_answer;
            const aiEval = data.ai_evaluation?.find(e => e.question_id === q.id);
            const aiCorrection = aiEval?.correction;

            return (
              <div key={q.id} className="rounded-2xl p-5 card-glass" style={{ border: `1px solid ${isCorrect ? 'rgba(0,212,170,0.2)' : 'rgba(255,77,109,0.2)'}` }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-text-muted">Question {idx + 1}</span>
                  {isCorrect ? <CheckCircle className="w-4 h-4 text-accent" /> : <XCircle className="w-4 h-4 text-danger" />}
                </div>
                {data.type !== 'cloze' && <p className="text-sm font-medium mb-4 text-text-primary">{q.question_text}</p>}
                
                {data.type === 'rewriting' ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest w-16 shrink-0 text-text-muted">Your:</span>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded"
                        style={{
                          background: isCorrect ? 'rgba(0,212,170,0.1)' : 'rgba(255,77,109,0.1)',
                          color: isCorrect ? '#00d4aa' : '#ff4d6d',
                        }}
                      >
                        {userAns || '—'}
                      </span>
                    </div>
                    <div className="p-4 rounded-xl mt-3" style={{ background: isCorrect ? 'rgba(0,212,170,0.1)' : 'rgba(255,77,109,0.1)', border: `1px solid ${isCorrect ? 'rgba(0,212,170,0.2)' : 'rgba(255,77,109,0.2)'}` }}>
                       <p className="text-xs font-bold mb-2 uppercase tracking-widest" style={{ color: isCorrect ? '#00d4aa' : '#ff4d6d' }}>
                         {isCorrect ? 'Correct!' : 'Accepted Answers:'}
                       </p>
                       <ul className="text-sm space-y-1.5" style={{ color: 'var(--text-secondary)' }}>
                         {Object.values(q.options).filter(Boolean).map((opt, i) => (
                           <li key={i} className="flex gap-2"><span style={{ color: 'var(--accent)' }}>•</span> {opt}</li>
                         ))}
                       </ul>
                       {aiCorrection && (
                         <div className="mt-3 p-3 rounded-lg border border-white/10" style={{ background: 'rgba(0,0,0,0.2)' }}>
                           <p className="text-[11px] font-bold uppercase tracking-widest text-accent mb-1.5">AI Feedback & Explanation</p>
                           <div className="text-sm text-text-secondary leading-relaxed ai-feedback-content" dangerouslySetInnerHTML={{ __html: aiCorrection }} />
                         </div>
                       )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(q.options).map(([label, text]) => {
                      const isSelected = userAns === label;
                      const isCorrectOpt = q.correct_answer === label;
                      return (
                        <div key={label} className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{
                          background: isCorrectOpt ? 'rgba(0,212,170,0.08)' : isSelected && !isCorrect ? 'rgba(255,77,109,0.08)' : 'rgba(255,255,255,0.02)',
                          borderColor: isCorrectOpt ? 'rgba(0,212,170,0.3)' : isSelected && !isCorrect ? 'rgba(255,77,109,0.3)' : 'var(--border)'
                        }}>
                          <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black shrink-0" style={{
                            background: isCorrectOpt ? 'var(--accent)' : isSelected && !isCorrect ? '#ff4d6d' : 'rgba(255,255,255,0.06)',
                            color: isCorrectOpt || (isSelected && !isCorrect) ? '#0b0f19' : 'var(--text-muted)'
                          }}>{label}</span>
                          <span className="text-sm flex-1" style={{
                            color: isCorrectOpt ? '#00d4aa' : isSelected && !isCorrect ? '#ff4d6d' : 'var(--text-secondary)',
                            fontWeight: isSelected || isCorrectOpt ? 600 : 400
                          }}>{text}</span>
                          {isCorrectOpt && <CheckCircle className="w-4 h-4 text-accent" />}
                          {isSelected && !isCorrect && <XCircle className="w-4 h-4 text-danger" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile FAB */}
      {data.type === 'reading' && showFab && (
        <button onClick={() => setIsModalOpen(true)} className="md:hidden fixed bottom-10 right-5 w-12 h-12 flex items-center justify-center rounded-full z-40 shadow-lg" style={{ background: 'var(--accent)', color: '#0b0f19' }}>
          <BookOpen className="w-5 h-5" />
        </button>
      )}

      {/* Mobile Modal */}
      <Transition show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 md:hidden" onClose={() => setIsModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end p-3">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-8" enterTo="opacity-100 translate-y-0" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-8">
                <Dialog.Panel className="w-full rounded-2xl overflow-hidden bg-bg-surface border border-border flex flex-col" style={{ maxHeight: '85vh' }}>
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <Dialog.Title className="text-sm font-semibold text-text-primary">Reading Passage</Dialog.Title>
                    <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-text-muted"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="overflow-y-auto px-5 py-6 flex-1"><ContentPane /></div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
