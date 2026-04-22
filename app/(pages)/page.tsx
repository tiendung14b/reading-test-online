"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, FileText, Trophy, Clock, Plus, ArrowRight } from 'lucide-react';

type Exercise = {
  id: number;
  title: string;
  type: string;
  created_at: string;
  highest_score: number | null;
  last_attempt: string | null;
};

export default function Home() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/exercises')
      .then(res => res.json())
      .then(data => { setExercises(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  const stats = [
    { label: 'Total Exercises', value: exercises.length, icon: BookOpen, color: '#00d4aa' },
    { label: 'Completed', value: exercises.filter(e => e.last_attempt).length, icon: Trophy, color: '#f59e0b' },
    { label: 'Reading Tests', value: exercises.filter(e => e.type === 'reading').length, icon: FileText, color: '#60a5fa' },
    { label: 'Cloze Tests', value: exercises.filter(e => e.type === 'cloze').length, icon: FileText, color: '#a78bfa' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>
            Overview
          </p>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Your Exercises
          </h1>
        </div>
        <Link
          href="/create"
          className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm"
        >
          <Plus className="w-4 h-4" />
          New Exercise
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="card-glass rounded-2xl p-5"
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

      {/* Section title */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          All Exercises
        </h2>
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
      {!loading && exercises.length === 0 && (
        <div
          className="card-glass rounded-2xl flex flex-col items-center justify-center py-20 text-center"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)' }}
          >
            <BookOpen className="w-8 h-8" style={{ color: 'var(--accent)' }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            No exercises yet
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Create your first reading or cloze test to get started.
          </p>
          <Link href="/create" className="btn-primary px-5 py-2.5 text-sm">
            Create Exercise
          </Link>
        </div>
      )}

      {/* Exercise Grid */}
      {!loading && exercises.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {exercises.map((ex) => (
            <Link
              key={ex.id}
              href={`/practice/${ex.id}`}
              className="card-glass rounded-2xl p-6 group transition-all duration-300 hover:-translate-y-1 block"
              style={{ textDecoration: 'none' }}
            >
              {/* Top row */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className={ex.type === 'reading' ? 'badge-blue' : 'badge-teal'}
                >
                  {ex.type === 'reading' ? 'Reading' : 'Cloze'}
                </span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:bg-accent"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <ArrowRight
                    className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5"
                    style={{ color: 'var(--text-muted)' }}
                  />
                </div>
              </div>

              {/* Title */}
              <h3
                className="text-base font-semibold leading-snug mb-5 line-clamp-2 transition-colors duration-300 group-hover:text-[var(--accent)]"
                style={{ color: 'var(--text-primary)' }}
              >
                {ex.title}
              </h3>

              {/* Bottom stats */}
              <div
                className="flex items-center justify-between pt-4"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" style={{ color: ex.highest_score ? '#f59e0b' : 'var(--text-muted)' }} />
                  <span className="text-xs font-semibold" style={{ color: ex.highest_score ? '#f59e0b' : 'var(--text-muted)' }}>
                    {ex.highest_score !== null ? `${ex.highest_score}%` : 'Not tried'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {ex.last_attempt ? new Date(ex.last_attempt).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
