"use client";

import { useEffect, useState, Fragment, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Dialog, Listbox, Transition } from '@headlessui/react';
import { BookOpen, CheckCircle, XCircle, X, ChevronLeft, ChevronDown, Trophy, Calendar } from 'lucide-react';
import Loading from '@/components/ui/Loading';
import ScoreBadge from '@/components/ui/ScoreBadge';
import QuestionCard from '@/components/ui/QuestionCard';
import MobilePassageModal from '@/components/ui/MobilePassageModal';
import AIChatModal from '@/components/ui/AIChatModal';
import { BotMessageSquare } from 'lucide-react';

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
  const [activeChatQuestionId, setActiveChatQuestionId] = useState<number | null>(null);
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
      <div className="h-full" style={{ background: 'var(--bg-base)' }}>
        <Loading size="lg" className="h-full" />
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

  const getExerciseContext = (qId: number) => {
    if (!data) return '';
    const q = data.questions.find(x => x.id === qId);
    if (!q) return '';
    const userAns = data.user_answers[q.id];
    const aiEval = data.ai_evaluation?.find(e => e.question_id === q.id);
    let ctx = `Passage Type: ${data.type}\nTitle: ${data.title}\nContent:\n${data.content}\n\nQuestion:\n`;
    ctx += `${q.question_text || 'Fill in the blank'}\n`;
    if (q.options) ctx += `Options: ${JSON.stringify(q.options)}\n`;
    ctx += `Correct Answer: ${q.correct_answer}\nUser Answer: ${userAns || 'None'}\n`;
    if (aiEval && aiEval.correction) ctx += `AI Correction: ${aiEval.correction}\n`;
    return ctx;
  };

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
          <ScoreBadge score={data.score} showIcon />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {/* Mobile Content */}
          <div className="md:hidden card-glass rounded-2xl p-5 mb-6" ref={mobilePassageRef}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3 text-accent">Passage Content</p>
            <ContentPane />
          </div>

          {data.questions.map((q, idx) => {
            const userAns = data.user_answers[q.id];
            const aiEval = data.ai_evaluation?.find(e => e.question_id === q.id);
            const isCorrect = aiEval ? aiEval.isCorrect : userAns === q.correct_answer;
            const aiCorrection = aiEval?.correction;

            const reviewData = {
              isCorrect,
              correctAnswer: q.correct_answer,
              correction: aiCorrection
            };

            return (
              <QuestionCard
                key={q.id}
                type={data.type as any}
                index={idx}
                question={q}
                userAnswer={userAns}
                review={reviewData}
                onAskAI={() => setActiveChatQuestionId(q.id)}
              />
            );
          })}
        </div>
      </div>

      {/* Mobile FABs */}
      <div className="md:hidden fixed bottom-10 right-5 flex flex-col gap-3 z-40">
        {data.type === 'reading' && showFab && (
          <button onClick={() => setIsModalOpen(true)} className="w-12 h-12 flex items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105" style={{ background: 'var(--accent)', color: '#0b0f19' }}>
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
        <ContentPane />
      </MobilePassageModal>

      {/* AI Chat Modal */}
      {activeChatQuestionId && (() => {
        const q = data.questions.find(x => x.id === activeChatQuestionId);
        const qIdx = data.questions.findIndex(x => x.id === activeChatQuestionId);
        const aiEval = data.ai_evaluation?.find(e => e.question_id === activeChatQuestionId);
        return (
          <AIChatModal
            isOpen={!!activeChatQuestionId}
            onClose={() => setActiveChatQuestionId(null)}
            exerciseContext={getExerciseContext(activeChatQuestionId)}
            questionLabel={data.type === 'cloze' ? `Blank [${qIdx + 1}]` : `Question ${qIdx + 1}`}
            questionText={q?.question_text || 'Fill in the blank'}
            userAnswer={data.user_answers[activeChatQuestionId]}
            aiFeedback={aiEval?.correction || ''}
          />
        );
      })()}
    </div>
  );
}
