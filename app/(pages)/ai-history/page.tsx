"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessagesSquare, Calendar, ArrowRight, Trash2, BookOpen } from 'lucide-react';
import Loading from '@/components/ui/Loading';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ui/ConfirmModal';

type ChatHistory = {
  id: number;
  exercise_id: number | null;
  exercise_title: string | null;
  title: string;
  created_at: string;
};

export default function AIHistoryPage() {
  const [histories, setHistories] = useState<ChatHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/ai/history')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setHistories(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      const res = await fetch(`/api/ai/history/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        setHistories(prev => prev.filter(h => h.id !== deleteId));
        toast.success('Chat history deleted');
      } else {
        toast.error('Failed to delete chat history');
      }
    } catch (err) {
      toast.error('Error deleting chat history');
    } finally {
      setDeleteId(null);
    }
  };

  const confirmDelete = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    setDeleteId(id);
  };

  if (loading) return <Loading />;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>
          Review
        </p>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          AI Tutor History
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Review your previous conversations with the AI Tutor.
        </p>
      </div>

      {histories.length === 0 ? (
        <div className="card-glass rounded-2xl p-10 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--bg-subtle)' }}>
            <MessagesSquare className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No saved chats</h3>
          <p className="text-sm text-text-muted mb-6 max-w-sm">
            Save your conversations with the AI Tutor during practice sessions to see them here.
          </p>
          <Link href="/" className="btn-primary px-6 py-2.5 text-sm">
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {histories.map((history) => (
            <Link 
              key={history.id} 
              href={`/ai-history/${history.id}`}
              className="card-glass rounded-2xl p-5 flex items-center gap-4 transition-all hover:border-ui-border-strong group"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                <MessagesSquare className="w-6 h-6" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-accent/10 text-[9px] font-black uppercase tracking-wider text-accent border border-accent/10">
                    <MessagesSquare className="w-2.5 h-2.5" />
                    <span>Saved Chat</span>
                  </div>
                  <span className="text-[11px] text-text-muted flex items-center gap-1 font-medium">
                    <Calendar className="w-3 h-3" />
                    {new Date(history.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-accent transition-colors leading-tight line-clamp-2">
                  {history.title}
                </h3>
                {history.exercise_title && (
                  <p className="text-[11px] text-text-muted flex items-center gap-1.5 mt-1 font-medium">
                    <BookOpen className="w-3 h-3 text-accent/60" />
                    <span className="truncate">{history.exercise_title}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => confirmDelete(history.id, e)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:bg-danger/10 hover:text-danger transition-all"
                  title="Delete History"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-subtle group-hover:bg-accent group-hover:text-on-accent transition-all">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Chat History"
        message="Are you sure you want to delete this chat history? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
