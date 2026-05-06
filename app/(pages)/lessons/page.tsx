"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, PlusCircle, Clock, Trash2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import AILessonModal from '@/components/Editor/AILessonModal';
import { useRouter } from 'next/navigation';

type Lesson = {
  id: number;
  title: string;
  topic: string;
  created_at: string;
};

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const router = useRouter();

  const fetchLessons = () => {
    fetch('/api/lessons')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setLessons(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to the lesson
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    try {
      const res = await fetch(`/api/lessons/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Lesson deleted successfully');
        fetchLessons();
      } else {
        toast.error(data.error || 'Failed to delete lesson');
      }
    } catch (err) {
      toast.error('Failed to delete lesson');
    }
  };
  const handleAIGenerated = async (lesson: { title: string; topic: string; content: string }) => {
    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lesson),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Lesson created successfully');
        fetchLessons();
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to create lesson');
      }
    } catch (err) {
      toast.error('Failed to create lesson');
    }
  };

  // Group lessons by topic
  const groupedLessons = lessons.reduce((acc, lesson) => {
    if (!acc[lesson.topic]) acc[lesson.topic] = [];
    acc[lesson.topic].push(lesson);
    return acc;
  }, {} as Record<string, Lesson[]>);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
            Lessons Library
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Browse and read educational materials, tutorials, and notes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAIModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg font-bold bg-white/5 border border-white/5 hover:bg-white/10 active:scale-95"
          >
            <Sparkles className="w-4.5 h-4.5 text-accent" />
            <span>Generate with AI</span>
          </button>
          <Link 
            href="/lessons/create"
            className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg font-bold"
            style={{ background: 'var(--accent)', color: 'var(--text-on-accent)', border: '1px solid var(--accent-dim)' }}
          >
            <PlusCircle className="w-4.5 h-4.5" />
            <span>New Lesson</span>
          </Link>
        </div>
      </div>

      <AILessonModal 
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onGenerate={handleAIGenerated}
      />

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : lessons.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center card-glass rounded-3xl p-10 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--bg-subtle)' }}>
            <BookOpen className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No Lessons Found</h3>
          <p className="text-sm max-w-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            There are no lessons available yet. Start building your library by creating the first one!
          </p>
          <Link href="/lessons/create" className="btn-primary px-5 py-2.5 rounded-xl text-sm">
            Create Lesson
          </Link>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-10">
          {Object.entries(groupedLessons).map(([topic, topicLessons]) => (
            <div key={topic} className="space-y-4">
              <h2 className="text-lg font-bold tracking-tight border-b pb-2" style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                {topic}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topicLessons.map(lesson => (
                  <Link 
                    href={`/lessons/${lesson.id}`} 
                    key={lesson.id}
                    className="card-glass p-5 rounded-2xl flex flex-col gap-3 group transition-all duration-300 hover:-translate-y-1 relative"
                  >
                    <div className="flex items-start justify-between gap-3 pr-8">
                      <h3 className="font-semibold leading-snug group-hover:text-accent transition-colors" style={{ color: 'var(--text-primary)' }}>
                        {lesson.title}
                      </h3>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                        <BookOpen className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(lesson.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {/* Delete button (absolute positioned) */}
                    <button 
                      onClick={(e) => handleDelete(lesson.id, e)}
                      className="absolute bottom-4 right-4 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-subtle hover:bg-danger/10 text-text-muted hover:text-danger z-10"
                      title="Delete Lesson"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
