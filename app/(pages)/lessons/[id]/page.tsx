"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, List, Trash2, Menu, X, Pencil } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

type Lesson = {
  id: number;
  title: string;
  topic: string;
  content: string;
  created_at: string;
};

type TOCItem = {
  id: string;
  text: string;
  level: number;
};

export default function LessonViewerPage() {
  const params = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [toc, setToc] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isTocOpen, setIsTocOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/lessons/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setLesson(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    if (!lesson || !contentRef.current) return;

    // Build Table of Contents
    const headings = Array.from(contentRef.current.querySelectorAll('h1, h2, h3'));
    const tocItems: TOCItem[] = [];

    headings.forEach((heading, index) => {
      // Assign an ID if it doesn't have one
      if (!heading.id) {
        const textId = heading.textContent?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || `heading-${index}`;
        heading.id = `${textId}-${index}`;
      }
      
      tocItems.push({
        id: heading.id,
        text: heading.textContent || '',
        level: parseInt(heading.tagName[1]),
      });
    });

    setToc(tocItems);

    // Setup Intersection Observer to track active section
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-10% 0px -80% 0px' }
    );

    headings.forEach(h => observer.observe(h));
    return () => observer.disconnect();

  }, [lesson]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
      setIsTocOpen(false); // Close mobile TOC after click
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;
    try {
      const res = await fetch(`/api/lessons/${params.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Lesson deleted successfully');
        router.push('/lessons');
      } else {
        toast.error(data.error || 'Failed to delete lesson');
      }
    } catch (err) {
      toast.error('Failed to delete lesson');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="h-full flex items-center justify-center text-text-muted">
        Lesson not found
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 shrink-0 border-b border-white/5" style={{ background: 'var(--bg-surface)' }}>
        <button
          onClick={() => router.push('/lessons')}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-text-muted"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5 text-accent">
            {lesson.topic}
          </p>
          <h1 className="text-sm font-semibold truncate text-text-primary">
            {lesson.title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile TOC Toggle */}
          {toc.length > 0 && (
            <button
              onClick={() => setIsTocOpen(!isTocOpen)}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-text-muted"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          {/* Edit Button */}
          <button
            onClick={() => router.push(`/lessons/${params.id}/edit`)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors"
            title="Edit Lesson"
          >
            <Pencil className="w-4 h-4" />
          </button>
          {/* Delete Button */}
          <button
            onClick={handleDelete}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors"
            title="Delete Lesson"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Column: Lesson Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth">
          <div className="max-w-3xl mx-auto">
            {/* Title Section */}
            <div className="mb-10">
              <h1 className="text-4xl font-extrabold text-text-primary mb-4 tracking-tight leading-tight">
                {lesson.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-text-muted">
                <span className="badge-teal">{lesson.topic}</span>
                <span>{new Date(lesson.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Injected HTML Content */}
            <div 
              ref={contentRef}
              className="lesson-content"
              dangerouslySetInnerHTML={{ __html: lesson.content }}
            />
          </div>
        </div>

        {/* Right Column: Table of Contents (Desktop only) */}
        {toc.length > 0 && (
          <div className="hidden lg:flex flex-col w-64 xl:w-80 shrink-0 border-l border-white/5" style={{ background: 'var(--bg-surface)' }}>
            <div className="p-5 flex items-center gap-2 border-b border-white/5">
              <List className="w-4 h-4 text-text-muted" />
              <h3 className="text-sm font-bold text-text-primary">Table of Contents</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex flex-col gap-2 relative">
                {/* Active Indicator Line */}
                <div className="absolute left-[7px] top-0 bottom-0 w-[2px] bg-white/5 rounded-full" />
                
                {toc.map(item => {
                  const isActive = activeId === item.id;
                  return (
                    <div 
                      key={item.id}
                      className="relative flex items-center"
                      style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
                    >
                      <div 
                        className={`absolute left-[6px] w-[4px] h-[4px] rounded-full transition-all duration-300 ${isActive ? 'bg-accent scale-150 shadow-[0_0_8px_rgba(0,212,170,0.8)]' : 'bg-transparent'}`} 
                      />
                      <button
                        onClick={() => scrollToHeading(item.id)}
                        className={`text-left text-[13px] py-1.5 px-3 rounded-lg w-full transition-all duration-200 ${
                          isActive 
                            ? 'text-accent font-semibold bg-accent/5' 
                            : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                        }`}
                      >
                        {item.text}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        {/* Mobile TOC Overlay */}
        {isTocOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsTocOpen(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-[80%] max-w-sm bg-bg-surface border-l border-border flex flex-col shadow-2xl animate-in slide-in-from-right">
              <div className="p-5 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4 text-text-muted" />
                  <h3 className="text-sm font-bold text-text-primary">Table of Contents</h3>
                </div>
                <button onClick={() => setIsTocOpen(false)} className="text-text-muted hover:text-text-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <div className="flex flex-col gap-2 relative">
                  <div className="absolute left-[7px] top-0 bottom-0 w-[2px] bg-white/5 rounded-full" />
                  {toc.map(item => {
                    const isActive = activeId === item.id;
                    return (
                      <div 
                        key={item.id}
                        className="relative flex items-center"
                        style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
                      >
                        <div className={`absolute left-[6px] w-[4px] h-[4px] rounded-full transition-all duration-300 ${isActive ? 'bg-accent scale-150 shadow-[0_0_8px_rgba(0,212,170,0.8)]' : 'bg-transparent'}`} />
                        <button
                          onClick={() => scrollToHeading(item.id)}
                          className={`text-left text-[13px] py-2 px-3 rounded-lg w-full transition-all duration-200 ${isActive ? 'text-accent font-semibold bg-accent/5' : 'text-text-secondary'}`}
                        >
                          {item.text}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
