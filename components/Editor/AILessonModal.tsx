"use client";

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Sparkles, X, Wand2, Loader2, BookOpen, PenTool, MessageSquare, Info } from 'lucide-react';
import toast from 'react-hot-toast';

interface AILessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (lesson: { title: string; topic: string; content: string }) => void;
}

const LESSON_TYPES = [
  { id: 'Writing: Email/Letter', label: 'Email / Letter', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'Writing: Essay', label: 'Argumentative Essay', icon: <PenTool className="w-4 h-4" /> },
  { id: 'Reading Comprehension', label: 'Reading Passage', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'Grammar Guide', label: 'Grammar Explanation', icon: <Info className="w-4 h-4" /> },
  { id: 'Vocabulary Building', label: 'Vocabulary List', icon: <Sparkles className="w-4 h-4" /> },
];

const DIFFICULTY_LEVELS = ['Beginner', 'Elementary', 'Intermediate', 'Upper-Intermediate', 'Advanced', 'IELTS / TOEFL'];

export default function AILessonModal({ isOpen, onClose, onGenerate }: AILessonModalProps) {
  const [topic, setTopic] = useState('');
  const [lessonType, setLessonType] = useState(LESSON_TYPES[0].id);
  const [difficulty, setDifficulty] = useState(DIFFICULTY_LEVELS[2]);
  const [language, setLanguage] = useState('Vietnamese');
  const [instructions, setInstructions] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!topic) {
      toast.error('Please enter what the lesson is about');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/lessons/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, lessonType, difficulty, instructions, language }),
      });
      const data = await res.json();

      if (data.success) {
        // Set the lesson category (topic) to the Lesson Type label instead of the specific topic
        const lessonTypeLabel = LESSON_TYPES.find(t => t.id === lessonType)?.label || topic;
        onGenerate({
          ...data.lesson,
          topic: lessonTypeLabel
        });
        toast.success('Lesson generated successfully!');
        onClose();
      } else {
        toast.error(data.error || 'Failed to generate lesson');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[150]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity" />
        </Transition.Child>

        {/* Full-screen Loading Overlay */}
        {generating && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
            <div className="relative mb-8">
              <Sparkles className="w-20 h-20 text-accent ai-spin-dance" />
              <div className="absolute inset-0 blur-3xl bg-accent/30 rounded-full animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">AI is drafting your lesson...</h2>
            <p className="text-text-muted text-center max-w-md px-6">
              Researching topic, structuring content, and writing educational material just for you.
            </p>
          </div>
        )}

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-0 sm:p-4 text-center sm:items-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-full sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-10 text-left shadow-2xl transition-all w-full sm:max-w-3xl bg-bg-surface/90 backdrop-blur-xl border-t sm:border border-white/10">
                {/* Mobile Handle */}
                <div 
                  className="w-full flex justify-center pb-4 -mt-2 cursor-pointer sm:hidden"
                  onClick={onClose}
                >
                  <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                </div>

                <div className="sticky top-0 float-right z-30 -mr-2 -mt-2">
                  <button
                    type="button"
                    className="rounded-xl p-3 text-text-muted hover:bg-white/10 transition-all active:scale-90 bg-bg-surface/80 backdrop-blur-md shadow-lg border border-white/5"
                    onClick={onClose}
                  >
                    <X className="h-5 w-5 sm:h-6 sm:h-6" />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-10">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-accent/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-8 h-8 text-accent animate-pulse" />
                  </div>
                  <div>
                    <Dialog.Title as="h3" className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
                      AI Content Studio
                    </Dialog.Title>
                    <p className="text-text-secondary text-sm sm:text-base font-medium">Magically generate professional English lessons</p>
                  </div>
                </div>

                <div className="space-y-10">
                  {/* Lesson Type Cards */}
                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted px-1">
                      Choose Lesson Type
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {LESSON_TYPES.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setLessonType(type.id)}
                          className={`flex flex-col items-center justify-center gap-3 p-4 rounded-3xl border-2 transition-all active:scale-95 ${
                            lessonType === type.id
                              ? 'bg-accent/10 border-accent text-accent shadow-lg shadow-accent/10'
                              : 'bg-white/[0.02] border-white/5 text-text-secondary hover:border-white/10'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                            lessonType === type.id ? 'bg-accent text-on-accent' : 'bg-white/5'
                          }`}>
                            {type.icon}
                          </div>
                          <span className="text-[11px] sm:text-xs font-bold text-center leading-tight">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language Toggle */}
                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted px-1">
                      Instruction Language
                    </label>
                    <div className="flex p-1.5 rounded-2xl bg-white/[0.03] border border-white/5 w-fit">
                      {['Vietnamese', 'English'].map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setLanguage(lang)}
                          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            language === lang
                              ? 'bg-accent text-on-accent shadow-lg shadow-accent/20'
                              : 'text-text-muted hover:text-text-secondary'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Topic & Difficulty */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted px-1">
                        What is it about?
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Job Interview Etiquette"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="input-dark w-full px-6 py-4.5 rounded-2xl bg-white/[0.03] border-white/5 focus:bg-white/[0.06] text-base"
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted px-1">
                        Target Level
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {DIFFICULTY_LEVELS.map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setDifficulty(level)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                              difficulty === level
                                ? 'bg-accent text-on-accent shadow-lg shadow-accent/20'
                                : 'bg-white/5 text-text-secondary hover:bg-white/10'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted px-1">
                      Personalize (Optional)
                    </label>
                    <textarea
                      placeholder="e.g., Use British English and include 5 common idioms."
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      className="input-dark w-full px-6 py-4.5 rounded-2xl bg-white/[0.03] border-white/5 focus:bg-white/[0.06] h-32 resize-none text-base"
                    />
                  </div>

                  {/* Actions */}
                  <div className="pt-6 flex flex-col sm:flex-row-reverse items-center gap-4">
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={generating}
                      className="btn-primary w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 text-base font-black rounded-2xl group transition-all disabled:opacity-50 shadow-xl shadow-accent/20"
                    >
                      {generating ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Wand2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                      )}
                      <span>{generating ? 'Drafting Content...' : 'Generate Lesson'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full sm:w-auto px-8 py-5 text-sm font-bold text-text-secondary hover:text-text-primary transition-all active:scale-95"
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
