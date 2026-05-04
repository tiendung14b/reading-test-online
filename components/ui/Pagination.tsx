"use client";

import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  itemName?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemName = "items"
}: PaginationProps) {
  if (totalPages <= 1) return null;

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

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-10 px-2">
      <p className="text-xs text-text-muted">
        Showing <span className="text-text-secondary font-semibold">{Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)}</span> to <span className="text-text-secondary font-semibold">{Math.min(totalItems, currentPage * itemsPerPage)}</span> of <span className="text-text-secondary font-semibold">{totalItems}</span> {itemName}
      </p>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all bg-white/5 text-text-primary hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed border border-white/5 disabled:hover:bg-white/5"
        >
          Prev
        </button>
        
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
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
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all bg-white/5 text-text-primary hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed border border-white/5 disabled:hover:bg-white/5"
        >
          Next
        </button>
      </div>
    </div>
  );
}
