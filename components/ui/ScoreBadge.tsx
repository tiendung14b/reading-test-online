"use client";

import { Trophy } from 'lucide-react';

interface ScoreBadgeProps {
  score: number;
  showIcon?: boolean;
  className?: string;
}

export default function ScoreBadge({ score, showIcon = false, className = "" }: ScoreBadgeProps) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'var(--accent)';
    if (s >= 50) return 'var(--warning)';
    return 'var(--danger)';
  };

  const color = getScoreColor(score);

  return (
    <div className={`flex items-center gap-4 px-4 py-2 rounded-xl bg-white/5 shrink-0 ${className}`}>
      <div className="flex flex-col items-center">
        <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Score</span>
        <span className="text-xl font-bold" style={{ color }}>
          {score}%
        </span>
      </div>
      {showIcon && (
        <>
          <div className="h-8 w-px bg-white/10" />
          <Trophy className="w-5 h-5" style={{ color: score >= 80 ? '#f59e0b' : 'var(--text-muted)' }} />
        </>
      )}
    </div>
  );
}
