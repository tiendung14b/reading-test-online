"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, List, Trash2, Menu, Pencil, X } from 'lucide-react';
import { Transition, Dialog, DialogPanel } from '@headlessui/react';
import parse from 'html-react-parser';
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
  const [showFloatingToc, setShowFloatingToc] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/lessons/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setLesson(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    document.getElementById('main-content-layout')?.addEventListener('scroll', (e) => {
      if ((e as any)?.target?.scrollTop > 300) {
        setShowFloatingToc(true);
      } else {
        setShowFloatingToc(false);
      }
    });
    return () => {
      document.getElementById('main-content-layout')?.removeEventListener('scroll', () => {
        console.log('scroll');
      });
    }
  }, [params.id]);

  const headingsRef = useRef<HTMLHeadingElement[]>([]);

  useEffect(() => {
    if (!lesson || !contentRef.current) return;

    let observer: IntersectionObserver | null = null;

    const timeoutId = setTimeout(() => {
      if (!contentRef.current) return;

      const headings = Array.from(contentRef.current.querySelectorAll('h1, h2, h3')) as HTMLHeadingElement[];
      headingsRef.current = headings;
      
      setToc(headings.map(heading => ({
        id: heading.id,
        text: heading.textContent || '',
        level: parseInt(heading.tagName[1]),
      })));

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setActiveId(entry.target.id);
            }
          });
        },
        { rootMargin: '-10% 0px -80% 0px' }
      );

      headings.forEach(h => observer?.observe(h));
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observer?.disconnect();
    };
  }, [lesson]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start', offsetTop: -20 } as any);
    } else {
      console.warn("Không tìm thấy target để cuộn tới:", { id, element });
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
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg-base)' }} >
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 shrink-0 border-b border-ui-border" style={{ background: 'var(--bg-surface)' }}>
        <button
          onClick={() => router.push('/lessons')}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-subtle transition-colors text-text-muted"
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
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-subtle text-text-muted"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          {/* Edit Button */}
          <button
            onClick={() => router.push(`/lessons/${params.id}/edit`)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-subtle text-text-muted hover:text-text-primary transition-colors"
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
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth"
        >
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

            {/* Rendered HTML Content using html-react-parser */}
            <div 
              ref={contentRef}
              className="lesson-content"
            >
              {parse(lesson.content)}
            </div>
          </div>
        </div>

        {/* empty div to make space for right column */}
        <div className="hidden lg:flex w-64 xl:w-80 shrink-0 border-l border-ui-border" style={{ background: 'var(--bg-surface)' }} />

        {/* Right Column: Table of Contents (Desktop only) */}
        {toc.length > 0 && (
          <div className="hidden lg:flex fixed right-0 top-30 flex-col w-64 xl:w-80 shrink-0 border-l border-ui-border" style={{ background: 'var(--bg-surface)' }}>
            <div className="p-5 flex items-center gap-2 border-b border-ui-border">
              <List className="w-4 h-4 text-text-muted" />
              <h3 className="text-sm font-bold text-text-primary">Table of Contents</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex flex-col gap-2 relative">
                {/* Active Indicator Line */}
                <div className="absolute left-[7px] top-0 bottom-0 w-[2px] bg-ui-border rounded-full" />
                
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
                        className={`text-left text-[13px] py-1.5 px-3 ml-2 rounded-lg w-full transition-all duration-200 ${
                          isActive 
                            ? 'text-accent font-semibold bg-accent/5' 
                            : 'text-text-secondary hover:text-text-primary hover:bg-subtle'
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
        
        {/* Mobile TOC Overlay with Headless UI Animations */}
        <Transition show={isTocOpen}>
          <Dialog onClose={() => setIsTocOpen(false)} className="relative z-50 lg:hidden">
            {/* Backdrop with fade animation */}
            <Transition.Child
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-hidden">
              <div className="absolute inset-0 overflow-hidden">
                <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-[80vw] pl-10">
                  {/* Panel with slide animation */}
                  <Transition.Child
                    enter="transform transition ease-in-out duration-400 sm:duration-600"
                    enterFrom="translate-x-full"
                    enterTo="translate-x-0"
                    leave="transform transition ease-in-out duration-400 sm:duration-600"
                    leaveFrom="translate-x-0"
                    leaveTo="translate-x-full"
                  >
                    <DialogPanel className="pointer-events-auto w-screen max-w-sm h-full">
                      <div className="flex h-full flex-col bg-bg-surface border-l border-ui-border shadow-2xl">
                        <div className="p-5 flex items-center justify-between border-b border-ui-border">
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
                            <div className="absolute left-[7px] top-0 bottom-0 w-[2px] bg-ui-border rounded-full" />
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
                                    onClick={() => {
                                      scrollToHeading(item.id)
                                      setIsTocOpen(false)
                                    }}
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
                    </DialogPanel>
                  </Transition.Child>
                </div>
              </div>
            </div>
          </Dialog>
        </Transition>

      </div>

      {/* Floating TOC Button (Mobile Only) */}
      <div className={`fixed bottom-28 right-6 z-40 transition-all duration-500 lg:hidden ${showFloatingToc ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-50 pointer-events-none'}`}>
        <button
          onClick={() => setIsTocOpen(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-xl border border-white/20 active:scale-95 transition-transform"
          style={{ 
            background: 'var(--accent)',
            color: 'var(--text-on-accent)',
            boxShadow: '0 15px 30px rgba(0,212,170,0.4), inset 0 0 15px rgba(255,255,255,0.3)'
          }}
        >
          <List className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
