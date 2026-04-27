'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowLeft, Send, BookOpen, Layers, ListOrdered, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const DIFFICULTIES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'IELTS 5.0', 'IELTS 6.5', 'IELTS 7.5+'];
const EXERCISE_TYPES = [
  { id: 'reading', label: 'Reading Comprehension', icon: BookOpen },
  { id: 'cloze', label: 'Cloze Test (Fill in blanks)', icon: Layers },
  { id: 'rewriting', label: 'Sentence Rewriting', icon: FileText },
];

export default function AiCreatePage() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('B1');
  const [numQuestions, setNumQuestions] = useState(5);
  const [exerciseType, setExerciseType] = useState('reading');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasTokens, setHasTokens] = useState(true);

  useEffect(() => {
    fetch('/api/tokens/status')
      .then(res => res.json())
      .then(data => setHasTokens(!!data.hasTokens))
      .catch(() => setHasTokens(false));
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return toast.error('Vui lòng nhập chủ đề');
    if (!hasTokens) return toast.error('Hết lượt AI. Vui lòng thêm token.');

    setLoading(true);
    try {
      // 1. Generate via AI
      const aiRes = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          difficulty,
          exerciseType: EXERCISE_TYPES.find(t => t.id === exerciseType)?.label,
          numberOfQuestions: numQuestions,
          description
        })
      });
      
      const aiData = await aiRes.json();
      if (!aiRes.ok || !aiData.success) {
        throw new Error(aiData.error || 'Failed to generate');
      }

      const generated = aiData.data;

      // 2. Auto save to database
      const saveRes = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: generated.title || topic,
          content: generated.content,
          type: exerciseType,
          questions: generated.questions,
          vocabulary: []
        }),
      });

      if (saveRes.ok) {
        toast.success('AI đã tạo và lưu bài tập thành công!');
        router.push('/');
        router.refresh();
      } else {
        const error = await saveRes.json();
        toast.error('Lỗi khi lưu bài tập: ' + error.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-bg-base text-text-primary p-4 md:p-8">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="relative mb-8">
            <Sparkles className="w-20 h-20 text-accent ai-spin-dance" />
            <div className="absolute inset-0 blur-3xl bg-accent/30 rounded-full animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">AI is creating your exercise...</h2>
          <p className="text-text-muted text-center max-w-md px-6">
            Writing content, crafting questions, and double-checking answers just for you.
          </p>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-accent" />
            Tạo bài tập siêu tốc bằng AI
          </h1>
          <p className="text-text-secondary">
            Chỉ cần nhập chủ đề và mô tả, AI sẽ lo phần còn lại từ nội dung đến câu hỏi và đáp án.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-6">
          {/* Topic Input */}
          <div className="card-glass p-6 rounded-3xl">
            <label className="block text-xs font-bold uppercase tracking-widest text-accent mb-3">
              Chủ đề bài tập (Topic)
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ví dụ: Global Warming, Job Interview, Technology in 2025..."
              className="input-dark w-full px-5 py-4 text-lg rounded-2xl"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Exercise Type */}
            <div className="card-glass p-6 rounded-3xl">
              <label className="block text-xs font-bold uppercase tracking-widest text-accent mb-4">
                Dạng bài tập
              </label>
              <div className="grid grid-cols-1 gap-2">
                {EXERCISE_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setExerciseType(t.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      exerciseType === t.id 
                        ? 'bg-accent/10 border-accent text-accent' 
                        : 'bg-white/5 border-white/5 text-text-muted hover:bg-white/10'
                    }`}
                  >
                    <t.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="card-glass p-6 rounded-3xl">
              <label className="block text-xs font-bold uppercase tracking-widest text-accent mb-4">
                Độ khó (Level)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      difficulty === d 
                        ? 'bg-accent text-bg-base border-accent shadow-lg shadow-accent/20' 
                        : 'bg-white/5 border-white/5 text-text-muted hover:bg-white/10 hover:text-text-secondary'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions Count */}
            <div className="card-glass p-6 rounded-3xl flex flex-col justify-center">
              <label className="block text-xs font-bold uppercase tracking-widest text-accent mb-4">
                Số lượng câu hỏi: <span className="text-text-primary text-sm ml-1">{numQuestions}</span>
              </label>
              <div className="px-2">
                <input
                  type="range"
                  min="3"
                  max="20"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent"
                />
                <div className="flex justify-between mt-3 text-[10px] font-bold text-text-muted uppercase tracking-tighter">
                  <span>Sơ cấp</span>
                  <span>Trung bình</span>
                  <span>Nâng cao</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Description */}
          <div className="card-glass p-6 rounded-3xl">
            <label className="block text-xs font-bold uppercase tracking-widest text-accent mb-3">
              Mô tả chi tiết / Yêu cầu thêm (Tùy chọn)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ví dụ: Tập trung vào từ vựng chuyên ngành y tế, sử dụng các cấu trúc câu phức, hoặc yêu cầu bài viết có tính hài hước..."
              rows={4}
              className="input-dark w-full px-5 py-4 text-sm rounded-2xl resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !hasTokens}
            className={`w-full py-5 rounded-3xl font-bold text-lg flex items-center justify-center gap-3 shadow-2xl transition-all ${
              !hasTokens 
                ? 'bg-text-muted cursor-not-allowed' 
                : 'bg-accent text-bg-base hover:scale-[1.02] active:scale-95'
            }`}
            style={hasTokens ? { boxShadow: '0 10px 40px rgba(0,212,170,0.3)' } : {}}
          >
            {loading ? 'Đang tạo...' : (
              <>
                <Send className="w-5 h-5" />
                Tạo và Lưu ngay
              </>
            )}
          </button>
          
          {!hasTokens && (
            <p className="text-center text-danger text-sm font-medium">
              Bạn đã hết lượt sử dụng AI hôm nay. Vui lòng thêm token trong phần Cài đặt.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
