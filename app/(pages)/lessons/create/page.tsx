"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, ChevronLeft, Save, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import RichTextEditor from '@/components/Editor/RichTextEditor';
import AILessonModal from '@/components/Editor/AILessonModal';
import { injectHeadingIds } from '@/lib/lesson-utils';

export default function CreateLessonPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const handleSave = async () => {
    if (!title || !topic || !content) {
      toast.error('Please fill in all fields');
      return;
    }

    setSaving(true);
    try {
      const processedContent = injectHeadingIds(content);
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, topic, content: processedContent }),
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Lesson created successfully');
        router.push(`/lessons/${data.id}`);
      } else {
        toast.error(data.error || 'Failed to create lesson');
      }
    } catch (error) {
      toast.error('Failed to create lesson');
    } finally {
      setSaving(false);
    }
  };

  const handleAIGenerated = (lesson: { title: string; topic: string; content: string }) => {
    setTitle(lesson.title);
    setTopic(lesson.topic);
    setContent(lesson.content);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-bg-base">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-6 py-4 border-b border-white/5 bg-bg-surface/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-all active:scale-95"
            style={{ color: 'var(--text-muted)' }}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-base md:text-lg font-bold text-text-primary">Create Lesson</h1>
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-bold hidden md:block">New Educational Material</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setAiModalOpen(true)}
            className="flex items-center gap-2 px-3 md:px-4 py-2 text-xs md:text-sm rounded-xl transition-all border border-accent/20 bg-accent/5 text-accent hover:bg-accent/10 active:scale-95"
          >
            <Sparkles className="w-4 h-4 md:w-5 h-5" />
            <span className="hidden sm:inline">Generate with AI</span>
            <span className="sm:hidden">AI</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2 px-4 md:px-6 py-2 text-xs md:text-sm rounded-xl active:scale-95 shadow-lg shadow-accent/20"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4 md:w-5 h-5" />
            )}
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      <AILessonModal 
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onGenerate={handleAIGenerated}
      />

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
          
          {/* Settings Section */}
          <section className="p-6 md:p-8 rounded-3xl border border-white/5 bg-bg-surface/50 backdrop-blur-sm space-y-8">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-text-secondary">Lesson Info</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Title */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted px-1">
                  Lesson Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Introduction to React"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="input-dark w-full px-5 py-4 text-base bg-white/[0.02] border-white/5 focus:bg-white/[0.05]"
                />
              </div>
              
              {/* Topic */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted px-1">
                  Topic / Category
                </label>
                <input
                  type="text"
                  placeholder="e.g., Frontend Development"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="input-dark w-full px-5 py-4 text-base bg-white/[0.02] border-white/5 focus:bg-white/[0.05]"
                />
              </div>
            </div>
          </section>

          {/* Content Editor Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
                Detailed Content
              </label>
              <div className="text-[10px] font-medium text-text-muted flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Auto-saving draft
              </div>
            </div>
            
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Start building your lesson content with the tools above..."
            />
          </section>

          <div className="h-20 md:hidden" /> {/* Spacer for mobile */}
        </div>
      </div>
    </div>
  );
}
