"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, Clock, ArrowRight, History as HistoryIcon, Calendar, FileText, BookOpen, Target, Award } from 'lucide-react';

type HistoryItem = {
  id: number;
  exercise_id: number;
  title: string;
  type: string;
  score: number;
  completed_at: string;
};

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/history')
      .then(res => res.json())
      .then(data => {
        setHistory(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--accent)';
    if (score >= 50) return 'var(--warning)';
    return 'var(--danger)';
  };

  const stats = [
    { label: 'Total Attempts', value: history.length, icon: HistoryIcon, color: '#00d4aa' },
    { label: 'Exercises Done', value: new Set(history.map(h => h.exercise_id)).size, icon: BookOpen, color: '#60a5fa' },
    { label: 'Average Score', value: history.length > 0 ? Math.round(history.reduce((a, b) => a + b.score, 0) / history.length) + '%' : '0%', icon: Target, color: '#f59e0b' },
    { label: 'Highest Score', value: history.length > 0 ? Math.max(...history.map(h => h.score)) + '%' : '0%', icon: Award, color: '#a78bfa' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>
            Analytics
          </p>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Practice History
          </h1>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="card-glass rounded-2xl p-5 transition-all hover:border-strong"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${stat.color}18` }}
              >
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {loading ? '—' : stat.value}
              </span>
            </div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-60">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
          />
        </div>
      )}

      {/* Empty */}
      {!loading && history.length === 0 && (
        <div className="card-glass rounded-2xl flex flex-col items-center justify-center py-20 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)' }}
          >
            <HistoryIcon className="w-8 h-8" style={{ color: 'var(--accent)' }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            No history yet
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Complete your first exercise to see your history here.
          </p>
          <Link href="/" className="btn-primary px-5 py-2.5 text-sm">
            Go to Dashboard
          </Link>
        </div>
      )}

      {/* History Table/List */}
      {!loading && history.length > 0 && (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="card-glass rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4 transition-all duration-300 hover:border-strong"
            >
              {/* Type Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: item.type === 'reading' ? 'rgba(96, 165, 250, 0.1)' : 'rgba(0, 212, 170, 0.1)' }}
              >
                <FileText className="w-6 h-6" style={{ color: item.type === 'reading' ? '#60a5fa' : 'var(--accent)' }} />
              </div>

              {/* Title and Date */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={item.type === 'reading' ? 'badge-blue' : 'badge-teal'}>
                    {item.type === 'reading' ? 'Reading' : 'Cloze'}
                  </span>
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.completed_at).toLocaleDateString(undefined, { 
                      year: 'numeric', month: 'short', day: 'numeric', 
                      hour: '2-digit', minute: '2-digit' 
                    })}
                  </span>
                </div>
                <h3 className="text-base font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {item.title}
                </h3>
              </div>

              {/* Score */}
              <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-white/5 shrink-0">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Score</span>
                  <span className="text-xl font-bold" style={{ color: getScoreColor(item.score) }}>
                    {item.score}%
                  </span>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <Trophy className="w-5 h-5" style={{ color: item.score >= 80 ? '#f59e0b' : 'var(--text-muted)' }} />
              </div>

              {/* Action */}
              <Link
                href={`/history/${item.id}`}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 hover:bg-accent hover:text-[#0b0f19] transition-all group shrink-0"
              >
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
