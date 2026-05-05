"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Transition } from '@headlessui/react';
import Link from 'next/link';
import { ChevronLeft, Bot, User, Calendar, BookOpen, MessagesSquare, ChevronDown, ChevronUp } from 'lucide-react';
import Loading from '@/components/ui/Loading';
import { MarkdownText } from '@/components/ui/MarkdownText';

type Message = {
  id: string;
  role: 'user' | 'ai';
  text: string;
};

type ChatHistoryDetail = {
  id: number;
  exercise_id: number | null;
  exercise_title?: string;
  title: string;
  context: string;
  messages: Message[];
  user_answer?: string;
  ai_feedback?: string;
  created_at: string;
};

export default function AIHistoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [history, setHistory] = useState<ChatHistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReviewExpanded, setIsReviewExpanded] = useState(false);

  useEffect(() => {
    fetch(`/api/ai/history/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setHistory(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) return <Loading />;
  if (!history) return <div className="p-10 text-center">History not found</div>;

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 shrink-0 border-b border-ui-border" style={{ background: 'var(--bg-surface)' }}>
        <button
          onClick={() => router.push('/ai-history')}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-subtle transition-colors text-text-muted"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5 text-accent">
            AI Chat History
          </p>
          <h1 className="text-sm font-semibold truncate text-text-primary">
            Session Details
          </h1>
        </div>
        <div className="text-xs text-text-muted flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(history.created_at).toLocaleDateString()}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Answer Review Section */}
            <div className="rounded-2xl bg-bg-surface border border-ui-border shadow-sm mb-10 overflow-hidden">
              <button 
                onClick={() => setIsReviewExpanded(!isReviewExpanded)}
                className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent/10 text-accent">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 px-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-0.5">CONTEXT & REVIEW</p>
                    <p className="text-sm font-bold text-text-primary line-clamp-2 leading-snug">{history.title}</p>
                  </div>
                </div>
                {isReviewExpanded ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
              </button>

              <div className={`grid transition-all duration-500 ease-in-out ${isReviewExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <div className="px-5 pb-5">
                    <div className="pt-2 pb-5 border-b border-ui-border mb-5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">FULL QUESTION CONTEXT</p>
                      <p className="text-sm text-text-primary leading-relaxed italic font-medium line-clamp-4">
                        {history.title}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {history.user_answer && (
                        <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2">Your Answer</p>
                          <p className="text-sm font-medium text-text-primary">{history.user_answer}</p>
                        </div>
                      )}
                      {history.ai_feedback && (
                        <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-success mb-2">AI Suggestion</p>
                          <div 
                            className="text-sm text-text-primary leading-relaxed ai-correction-content"
                            dangerouslySetInnerHTML={{ __html: history.ai_feedback }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {history.messages.map((msg, idx) => {
                const isAi = msg.role === 'ai';
                return (
                  <div key={idx} className={`flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 ${isAi ? '' : 'flex-row-reverse'}`}>
                    <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-1" style={{ background: isAi ? 'var(--accent-dim)' : 'var(--bg-subtle)', color: isAi ? 'var(--accent)' : 'var(--text-secondary)' }}>
                      {isAi ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    <div className={`flex-1 max-w-[85%] rounded-2xl p-5 text-sm leading-relaxed shadow-sm ${isAi ? 'rounded-tl-sm' : 'rounded-tr-sm'}`} style={{ 
                      background: isAi ? 'var(--bg-card)' : 'var(--accent)',
                      color: isAi ? 'var(--text-primary)' : 'var(--text-on-accent)',
                      border: isAi ? '1px solid var(--border)' : 'none'
                    }}>
                      <MarkdownText content={msg.text} />
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="pt-10 pb-20 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-subtle text-text-muted text-[11px] font-bold uppercase tracking-widest border border-ui-border">
                <MessagesSquare className="w-3 h-3" />
                End of saved conversation
              </div>
            </div>
          </div>
        </div>

        {/* Info Sidebar (Desktop only) */}
        <div className="hidden lg:flex flex-col w-64 xl:w-80 shrink-0 border-l border-ui-border" style={{ background: 'var(--bg-surface)' }}>
          <div className="p-5 border-b border-ui-border">
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">Context Details</h3>
            <div className="space-y-4">
              {history.exercise_id && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-1">Exercise</p>
                  <Link href={`/practice/${history.exercise_id}`} className="text-sm font-semibold text-text-primary hover:text-accent transition-colors flex items-start gap-2">
                    <BookOpen className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>View original exercise</span>
                  </Link>
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Saved On</p>
                <p className="text-sm font-semibold text-text-primary">{new Date(history.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="p-5 flex-1 overflow-y-auto">
             <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Technical Context</p>
             <pre className="text-[10px] p-3 rounded-lg bg-subtle text-text-secondary whitespace-pre-wrap leading-relaxed border border-ui-border">
               {history.context}
             </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
