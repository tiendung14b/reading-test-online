"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EditLessonPage() {
  const router = useRouter();
  const params = useParams();
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/lessons/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setTitle(data.title);
          setTopic(data.topic);
          setContent(data.content);
        } else {
          toast.error('Lesson not found');
          router.push('/lessons');
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load lesson');
        setLoading(false);
      });
  }, [params.id, router]);

  const handleSave = async () => {
    if (!title || !topic || !content) {
      toast.error('Please fill in all fields');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/lessons/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, topic, content }),
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Lesson updated successfully');
        router.push(`/lessons/${params.id}`);
      } else {
        toast.error(data.error || 'Failed to update lesson');
      }
    } catch (error) {
      toast.error('Failed to update lesson');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-white/5" style={{ background: 'var(--bg-surface)' }}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Edit Lesson</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2 px-4 py-2 text-sm rounded-xl"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save Changes</span>
        </button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Lesson Title
              </label>
              <input
                type="text"
                placeholder="e.g., Introduction to React"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="input-dark w-full px-4 py-3"
              />
            </div>
            
            {/* Topic */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Topic / Category
              </label>
              <input
                type="text"
                placeholder="e.g., Frontend Development"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className="input-dark w-full px-4 py-3"
              />
            </div>
          </div>

          {/* HTML Content */}
          <div className="space-y-2 flex-1 flex flex-col min-h-[600px]">
            <label className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              HTML Content
            </label>
            <textarea
              placeholder="Paste your HTML content here (<h1>, <p>, <code>, etc.)..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="input-dark w-full flex-1 p-4 font-mono text-sm resize-none"
              style={{ lineHeight: '1.6' }}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
