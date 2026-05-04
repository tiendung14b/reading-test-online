"use client";

import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  loading?: boolean;
}

export default function StatsCard({ label, value, icon: Icon, color, loading = false }: StatsCardProps) {
  return (
    <div className="card-glass rounded-2xl p-5 transition-all hover:border-strong">
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Icon className="w-4 h-4" style={{ color: color }} />
        </div>
        <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {loading ? '—' : value}
        </span>
      </div>
      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
    </div>
  );
}
