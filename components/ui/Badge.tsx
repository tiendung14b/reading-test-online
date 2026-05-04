"use client";

import React from 'react';

type BadgeType = 'reading' | 'cloze' | 'rewriting' | 'teal' | 'blue' | 'purple';

interface BadgeProps {
  type: BadgeType;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ type, children, className = "" }: BadgeProps) {
  const getBadgeClass = (t: BadgeType) => {
    switch (t) {
      case 'reading':
      case 'blue':
        return 'badge-blue';
      case 'cloze':
      case 'teal':
        return 'badge-teal';
      case 'rewriting':
      case 'purple':
        return 'badge-purple';
      default:
        return 'badge-teal';
    }
  };

  return (
    <span className={`${getBadgeClass(type)} ${className}`}>
      {children}
    </span>
  );
}
