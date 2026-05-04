"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, Clock, ArrowRight, History as HistoryIcon, Calendar, FileText, BookOpen, Target, Award } from 'lucide-react';
import Loading from '@/components/ui/Loading';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import StatsCard from '@/components/ui/StatsCard';
import ScoreBadge from '@/components/ui/ScoreBadge';

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

  // Removed getPageNumbers and getScoreColor as they are now in shared components

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
          <StatsCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            loading={loading}
          />
        ))}
      </div>

      {/* Loading */}
      {loading && <Loading />}

      {/* Empty */}
      {!loading && totalItems === 0 && (
        <EmptyState
          icon={HistoryIcon}
          title="No history yet"
          description="Complete your first exercise to see your history here."
          action={
            <Link href="/" className="btn-primary px-5 py-2.5 text-sm">
              Go to Dashboard
            </Link>
          }
        />
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
                  <Badge type={item.type as any}>
                    {item.type === 'reading' ? 'Reading' : 'Cloze'}
                  </Badge>
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
              <ScoreBadge score={item.score} showIcon />

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
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        itemName="attempts"
      />
    </div>
  );
}
