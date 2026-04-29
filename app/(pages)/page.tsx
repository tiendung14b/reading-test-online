"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, FileText, Trophy, Clock, Plus, ArrowRight, Search, Filter, Edit3 } from 'lucide-react';

type Exercise = {
  id: number;
  title: string;
  type: string;
  created_at: string;
  highest_score: number | null;
  last_attempt: string | null;
};

export default function Home() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'reading' | 'cloze' | 'rewriting'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 9;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: itemsPerPage.toString(),
      search: searchQuery,
      type: typeFilter
    });

    fetch(`/api/exercises?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.items) {
          setExercises(data.items);
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.totalItems);
        } else {
          setExercises([]);
          setTotalPages(1);
          setTotalItems(0);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [currentPage, searchQuery, typeFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter]);

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
      </div>



      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search exercises by title..."
            className="input-dark w-full pl-11 py-3 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Type Tabs */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
          {(['all', 'reading', 'cloze', 'rewriting'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                typeFilter === type 
                  ? 'bg-accent text-[#0b0f19] shadow-lg shadow-accent/20' 
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Section title */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted">
          {typeFilter === 'all' ? 'All Exercises' : `${typeFilter} Exercises`}
          {searchQuery && <span className="ml-2 font-normal lowercase">matching "{searchQuery}"</span>}
          <span className="ml-2 text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-text-secondary">
            {totalItems}
          </span>
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
      {!loading && totalItems === 0 && !searchQuery && typeFilter === 'all' && (
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
            <div
              key={ex.id}
              onClick={() => router.push(`/practice/${ex.id}`)}
              className="card-glass rounded-2xl p-6 group transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            >
              {/* Top row */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className={ex.type === 'reading' ? 'badge-blue' : ex.type === 'rewriting' ? 'badge-purple' : 'badge-teal'}
                >
                  {ex.type === 'reading' ? 'Reading' : ex.type === 'rewriting' ? 'Rewriting' : 'Cloze'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/edit/${ex.id}`); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-accent/10 hover:text-accent border-none outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)' }}
                    title="Edit Exercise"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:bg-accent"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    <ArrowRight
                      className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-[#0b0f19]"
                      style={{ color: 'var(--text-muted)' }}
                    />
                  </div>
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
            </div>
          ))}
        </div>
      )}

      {/* No results from filter */}
      {!loading && totalItems === 0 && (searchQuery || typeFilter !== 'all') && (
        <div className="card-glass rounded-2xl flex flex-col items-center justify-center py-20 text-center">
          <Search className="w-12 h-12 text-text-muted mb-4 opacity-20" />
          <h3 className="text-lg font-semibold mb-2 text-text-primary">No results found</h3>
          <p className="text-sm text-text-muted mb-6">
            Try adjusting your search or filters to find what you're looking for.
          </p>
          <button 
            onClick={() => { setSearchQuery(''); setTypeFilter('all'); }}
            className="text-accent text-sm font-bold hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-10 px-2">
          <p className="text-xs text-text-muted">
            Showing <span className="text-text-secondary font-semibold">{Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)}</span> to <span className="text-text-secondary font-semibold">{Math.min(totalItems, currentPage * itemsPerPage)}</span> of <span className="text-text-secondary font-semibold">{totalItems}</span> exercises
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
