"use client";

import React from 'react';

export const MarkdownText = ({ content }: { content: string }) => {
  if (!content) return null;
  
  const lines = content.split('\n');
  
  return (
    <div className="space-y-2">
      {lines.map((line, idx) => {
        if (!line.trim()) return <div key={idx} className="h-2" />;
        
        if (line.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-sm font-bold mt-3 mb-1" style={{ color: 'var(--accent)' }}>
              {line.replace('### ', '')}
            </h4>
          );
        }

        if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
          const text = line.trim().replace(/^[-•]\s+/, '');
          return (
            <div key={idx} className="pl-4 flex gap-2">
              <span className="shrink-0" style={{ color: 'var(--accent)' }}>•</span>
              <span>{renderInline(text)}</span>
            </div>
          );
        }

        return <p key={idx}>{renderInline(line)}</p>;
      })}
    </div>
  );
};

const renderInline = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (!part) return null;
    
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-accent">{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic text-text-secondary">{part.slice(1, -1)}</em>;
    }
    
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded font-mono text-[12px] bg-subtle text-accent border border-ui-border">
          {part.slice(1, -1)}
        </code>
      );
    }
    
    return <span key={i}>{part}</span>;
  });
};
