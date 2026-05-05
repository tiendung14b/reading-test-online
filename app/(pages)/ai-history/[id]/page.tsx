"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Bot, User, Calendar, BookOpen, MessagesSquare } from 'lucide-react';
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
  created_at: string;
};

export default function AIHistoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [history, setHistory] = useState<ChatHistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);

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
            AI Chat Review
          </p>
          <h1 className="text-sm font-semibold truncate text-text-primary">
            {history.title}
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
          <div className="max-w-3xl mx-auto space-y-6">
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
