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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [overallStats, setOverallStats] = useState({
    totalAttempts: 0,
    exercisesDone: 0,
    averageScore: 0,
    highestScore: 0,
  });
  const itemsPerPage = 10;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: itemsPerPage.toString(),
    });

    fetch(`/api/history?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.items) {
          setHistory(data.items);
          setOverallStats(data.stats);
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.totalItems);
        } else {
          setHistory([]);
          setTotalPages(1);
          setTotalItems(0);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [currentPage]);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);
      if (currentPage <= 3) {
        end = maxVisible;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - maxVisible + 1;
      }
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--accent)';
    if (score >= 50) return 'var(--warning)';
    return 'var(--danger)';
  };

  const stats = [
    { label: 'Total Attempts', value: overallStats.totalAttempts, icon: HistoryIcon, color: '#00d4aa' },
    { label: 'Exercises Done', value: overallStats.exercisesDone, icon: BookOpen, color: '#60a5fa' },
    { label: 'Average Score', value: overallStats.totalAttempts > 0 ? overallStats.averageScore + '%' : '0%', icon: Target, color: '#f59e0b' },
    { label: 'Highest Score', value: overallStats.totalAttempts > 0 ? overallStats.highestScore + '%' : '0%', icon: Award, color: '#a78bfa' },
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
      {!loading && totalItems === 0 && (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-10 px-2">
          <p className="text-xs text-text-muted">
            Showing <span className="text-text-secondary font-semibold">{Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)}</span> to <span className="text-text-secondary font-semibold">{Math.min(totalItems, currentPage * itemsPerPage)}</span> of <span className="text-text-secondary font-semibold">{totalItems}</span> attempts
          </p>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all bg-white/5 text-text-primary hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed border border-white/5 disabled:hover:bg-white/5"
            >
              Prev
            </button>
            
            <div className="flex items-center gap-1">
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all border border-white/5 ${
                    currentPage === page
                      ? 'bg-accent text-[#0b0f19] shadow-lg shadow-accent/20'
                      : 'bg-white/5 text-text-muted hover:text-text-primary hover:bg-white/10'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all bg-white/5 text-text-primary hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed border border-white/5 disabled:hover:bg-white/5"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
