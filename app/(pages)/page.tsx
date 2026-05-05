"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, FileText, Trophy, Clock, Plus, ArrowRight, Search, Filter, Edit3 } from 'lucide-react';
import Loading from '@/components/ui/Loading';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';

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

  // Removed local getPageNumbers function as it's now in the Pagination component

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
        <div className="flex bg-subtle p-1 rounded-xl border border-ui-border">
          {(['all', 'reading', 'cloze', 'rewriting'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                typeFilter === type 
                  ? 'bg-accent text-on-accent shadow-lg shadow-accent/20' 
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
          <span className="ml-2 text-[10px] bg-subtle px-2 py-0.5 rounded-full text-text-secondary">
            {totalItems}
          </span>
        </h2>
      </div>

      {/* Loading */}
      {loading && <Loading />}

      {/* Empty */}
      {!loading && totalItems === 0 && !searchQuery && typeFilter === 'all' && (
        <EmptyState
          icon={BookOpen}
          title="No exercises yet"
          description="Create your first reading or cloze test to get started."
          action={
            <Link href="/create" className="btn-primary px-5 py-2.5 text-sm">
              Create Exercise
            </Link>
          }
        />
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
                <Badge type={ex.type as any}>
                  {ex.type === 'reading' ? 'Reading' : ex.type === 'rewriting' ? 'Rewriting' : 'Cloze'}
                </Badge>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/edit/${ex.id}`); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-accent/10 hover:text-accent border-none outline-none"
                    style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}
                    title="Edit Exercise"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:bg-accent"
                    style={{ background: 'var(--bg-subtle)' }}
                  >
                    <ArrowRight
                      className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 text-text-muted group-hover:text-text-on-accent"
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
                  <Trophy className="w-3.5 h-3.5" style={{ color: ex.highest_score ? 'var(--warning)' : 'var(--text-muted)' }} />
                  <span className="text-xs font-semibold" style={{ color: ex.highest_score ? 'var(--warning)' : 'var(--text-muted)' }}>
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
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        itemName="exercises"
      />
    </div>
  );
}
