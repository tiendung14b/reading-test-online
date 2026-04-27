"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, ListChecks, Plus, Trash2, Save, Zap, FileText, PenTool, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect } from 'react';

type OptionMap = Record<string, string>; // { A: "text", B: "text", ... }

type Question = {
  question_text: string;
  options: OptionMap;
  correct_answer: string;
};

type VocabularyEntry = {
  word: string;
  meaning: string;
  phonetic: string;
  example: string;
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

const EMPTY_OPTIONS: OptionMap = { A: '', B: '', C: '', D: '' };

function makeQuestion(text = '', options = { ...EMPTY_OPTIONS }, correct = 'A'): Question {
  return { question_text: text, options, correct_answer: correct };
}

export default function CreateTest() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('reading');
  const [questions, setQuestions] = useState<Question[]>([makeQuestion()]);
  const [vocabulary, setVocabulary] = useState<VocabularyEntry[]>([]);
  const [bulkText, setBulkText] = useState('');
  const [loading, setLoading] = useState(false);

  // AI Modal States
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('B1');
  const [aiNumQuestions, setAiNumQuestions] = useState(5);
  const [aiExerciseType, setAiExerciseType] = useState('Multiple Choice / Reading Comprehension');
  const [aiLoading, setAiLoading] = useState(false);
  const [hasTokens, setHasTokens] = useState(true);

  useEffect(() => {
    fetch('/api/tokens/status')
      .then(res => res.json())
      .then(data => setHasTokens(!!data.hasTokens))
      .catch(() => setHasTokens(false));
  }, []);

  const handleAddQuestion = () => setQuestions([...questions, makeQuestion()]);

  const handleRemoveQuestion = (i: number) => {
    const arr = [...questions]; arr.splice(i, 1); setQuestions(arr);
  };

  const updateQuestion = (i: number, patch: Partial<Question>) => {
    const arr = [...questions]; arr[i] = { ...arr[i], ...patch }; setQuestions(arr);
  };

  const updateOption = (qIdx: number, label: string, text: string) => {
    const arr = [...questions];
    arr[qIdx] = { ...arr[qIdx], options: { ...arr[qIdx].options, [label]: text } };
    setQuestions(arr);
  };

  const handleAddVocab = () => setVocabulary([...vocabulary, { word: '', meaning: '', phonetic: '', example: '' }]);
  const handleRemoveVocab = (i: number) => {
    const arr = [...vocabulary]; arr.splice(i, 1); setVocabulary(arr);
  };
  const updateVocab = (i: number, patch: Partial<VocabularyEntry>) => {
    const arr = [...vocabulary]; arr[i] = { ...arr[i], ...patch }; setVocabulary(arr);
  };

  /* ── Bulk Parser ── */
  const parseBulk = () => {
    const raw = bulkText.trim();
    if (!raw) { toast.error('Textarea is empty'); return; }

    if (type === 'cloze') {
      // Cloze format:
      // [1] | *A. however | B. although | C. despite | D. because
      const lines = raw.split('\n').filter(l => l.trim());
      const parsed: Question[] = [];

      for (const line of lines) {
        // Split by |
        const parts = line.split('|').map(p => p.trim());
        if (parts.length < 2) continue;

        // First part may be [n] or just question text
        const headerPart = parts[0];
        const questionText = headerPart.replace(/^\[\d+\]\s*/, '').trim();

        const options: OptionMap = {};
        let correct = 'A';

        for (let i = 1; i < parts.length; i++) {
          let p = parts[i].trim();
          const isCorrect = p.startsWith('*');
          if (isCorrect) p = p.substring(1).trim();

          // Match A. text
          const m = p.match(/^([A-D])\.\s*(.*)/i);
          if (m) {
            const label = m[1].toUpperCase();
            options[label] = m[2].trim();
            if (isCorrect) correct = label;
          }
        }

        // Also check if header part itself has an option (e.g. "[1] | *A. text" where [1] is part[0] but has no option)
        // If first part also contains an option pattern
        const firstOptMatch = parts[0].match(/\*?([A-D])\.\s*(.*)/i);
        if (firstOptMatch && !options[firstOptMatch[1].toUpperCase()]) {
          const isCorrect = parts[0].trim().startsWith('*') || parts[0].includes('*' + firstOptMatch[1]);
          const label = firstOptMatch[1].toUpperCase();
          options[label] = firstOptMatch[2].trim();
          if (isCorrect) correct = label;
        }

        if (Object.keys(options).length > 0) {
          // Fill missing labels
          ['A', 'B', 'C', 'D'].forEach(l => { if (!options[l]) options[l] = ''; });
          parsed.push(makeQuestion(questionText, options, correct));
        }
      }

      if (parsed.length === 0) { toast.error('Could not parse any cloze questions.'); return; }
      setQuestions(parsed);
      toast.success(`Parsed ${parsed.length} cloze questions!`);
      return;
    }

    // Reading format:
    // 1. What is the main topic?
    // *A. The benefits of AI.
    // B. The history of CS.
    // C. How to build a website.
    // D. Modern transportation.
    //
    // 2. According to paragraph 2...

    // Split into question blocks using numbered pattern
    const blocks: string[] = [];
    const lines = raw.split('\n');
    let currentBlock = '';

    for (const line of lines) {
      // Detect new question start: line starting with a number followed by . or )
      if (/^\s*\d+[\.\)]\s+/.test(line)) {
        if (currentBlock.trim()) blocks.push(currentBlock.trim());
        currentBlock = line;
      } else {
        currentBlock += '\n' + line;
      }
    }
    if (currentBlock.trim()) blocks.push(currentBlock.trim());

    const parsed: Question[] = [];

    for (const block of blocks) {
      const blockLines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (blockLines.length === 0) continue;

      // First line is question text (strip number prefix)
      const questionText = blockLines[0].replace(/^\d+[\.\)]\s*/, '').trim();
      const options: OptionMap = {};
      let correct = 'A';

      for (let i = 1; i < blockLines.length; i++) {
        let line = blockLines[i];
        const isCorrect = line.startsWith('*');
        if (isCorrect) line = line.substring(1).trim();

        const m = line.match(/^([A-D])[\.\)]\s*(.*)/i);
        if (m) {
          const label = m[1].toUpperCase();
          options[label] = m[2].trim();
          if (isCorrect) correct = label;
        }
      }

      if (Object.keys(options).length > 0) {
        ['A', 'B', 'C', 'D'].forEach(l => { if (!options[l]) options[l] = ''; });
        parsed.push(makeQuestion(questionText, options, correct));
      }
    }

    if (parsed.length === 0) { toast.error('Could not parse any questions. Check format.'); return; }
    setQuestions(parsed);
    toast.success(`Parsed ${parsed.length} reading questions!`);
  };

  const handleSubmit = async () => {
    if (!title || !content) { toast.error('Please fill in title and content'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, type, questions, vocabulary }),
      });
      if (res.ok) { 
        toast.success('Exercise created successfully!');
        router.push('/'); 
        router.refresh(); 
      }
      else { const e = await res.json(); toast.error('Error: ' + e.error); }
    } catch { toast.error('Server error'); }
    finally { setLoading(false); }
  };

  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) { toast.error('Vui lòng nhập chủ đề'); return; }
    if (!aiExerciseType.trim()) { toast.error('Vui lòng nhập dạng bài tập'); return; }

    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          difficulty: aiDifficulty,
          exerciseType: aiExerciseType,
          numberOfQuestions: aiNumQuestions
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        const generated = data.data;
        if (generated.title) setTitle(generated.title);
        if (generated.content) setContent(generated.content);
        if (generated.questions && Array.isArray(generated.questions)) {
          const newQs = generated.questions.map((q: any) => {
            const opts = q.options || { A: '', B: '', C: '', D: '' };
            return makeQuestion(q.question_text || q.question || '', opts, q.correct_answer || 'A');
          });
          setQuestions(newQs);
        }
        toast.success('Generated successfully!');
        setIsAiModalOpen(false);
      } else {
        toast.error(data.error || 'Failed to generate');
      }
    } catch (err) {
      toast.error('Network error while generating');
    } finally {
      setAiLoading(false);
    }
  };

  const readingPlaceholder = `1. What is the main topic of the passage?
*A. The benefits of artificial intelligence.
B. The history of computer science.
C. How to build a website.
D. Modern transportation systems.

2. According to paragraph 2, where did the event take place?
A. London
B. Paris
*C. New York
D. Tokyo`;

  const clozePlaceholder = `[1] | *A. however | B. although | C. despite | D. because
[2] | A. goes | *B. went | C. gone | D. going
[3] | A. interest | B. interested | *C. interesting | D. interestingly`;

  return (
    <div className="h-full flex" style={{ background: 'var(--bg-base)' }}>

      {/* Left — Form */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-10">
        <div className="max-w-2xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--accent)' }}>Create</p>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>New Exercise</h1>
            </div>
            <button
              onClick={() => {
                if (!hasTokens) {
                  toast.error('Không còn Token AI nào khả dụng. Vui lòng thêm Token trong Cài đặt.');
                  router.push('/tokens');
                  return;
                }
                setIsAiModalOpen(true);
              }}
              className={`btn-primary px-4 py-2 text-sm flex items-center gap-2 rounded-xl shadow-lg transition-transform hover:scale-105 ${!hasTokens ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
              style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #00b894 100%)', color: '#0b0f19', border: 'none' }}
              title={!hasTokens ? "Hết lượt dùng AI. Bấm để nạp thêm." : "Tạo tự động bằng AI"}
            >
              <Sparkles className="w-4 h-4" /> {hasTokens ? 'Tạo bằng AI' : 'Hết lượt AI'}
            </button>
          </div>

          {/* Type selector */}
          <div className="mb-6">
            <label className="text-xs font-semibold uppercase tracking-widest block mb-3" style={{ color: 'var(--text-muted)' }}>
              Exercise Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'reading', label: 'Reading', icon: BookOpen, desc: 'Passage + Q&A' },
                { value: 'cloze', label: 'Cloze Test', icon: ListChecks, desc: 'Fill [1] blanks' },
                { value: 'rewriting', label: 'Rewriting', icon: PenTool, desc: 'Text only' },
              ].map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className="p-4 rounded-xl text-left transition-all duration-200"
                  style={{
                    background: type === value ? 'rgba(0,212,170,0.08)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${type === value ? 'rgba(0,212,170,0.35)' : 'var(--border)'}`,
                    color: type === value ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4" />
                    <span className="font-semibold text-sm">{label}</span>
                  </div>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="mb-5">
            <label className="text-xs font-semibold uppercase tracking-widest block mb-2" style={{ color: 'var(--text-muted)' }}>
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="input-dark w-full px-4 py-3 text-sm"
              placeholder="e.g., TOEIC Reading Practice #1"
            />
          </div>

          {/* Content */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Content
              </label>
              {type === 'cloze' && (
                <span className="badge-teal">Use [1] [2] for blanks</span>
              )}
              {type === 'rewriting' && (
                <span className="badge-teal">Enter your sentence structures or formulas</span>
              )}
            </div>
            <textarea
              required
              rows={12}
              value={content}
              onChange={e => setContent(e.target.value)}
              className="input-dark w-full px-4 py-3 text-sm leading-relaxed resize-none"
              placeholder="Paste your reading passage here..."
            />
          </div>

          {/* Bulk Questions Import */}
          {type !== 'rewriting' && (
            <div
              className="p-5 rounded-xl mb-6"
              style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.15)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
                  Bulk Questions Import
                </span>
              </div>
              <p className="text-[11px] mb-3" style={{ color: 'var(--text-muted)' }}>
                {type === 'reading'
                  ? 'Paste questions with options. Use * before the correct answer letter.'
                  : 'Paste cloze answers. Each line: [n] | *A. text | B. text | C. text | D. text'}
              </p>
              <textarea
                rows={8}
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                className="input-dark w-full px-4 py-3 text-xs leading-relaxed resize-none mb-3 font-mono"
                placeholder={type === 'reading' ? readingPlaceholder : clozePlaceholder}
              />
              <button
                type="button"
                onClick={parseBulk}
                className="btn-primary px-5 py-2.5 text-xs flex items-center gap-2"
              >
                <Zap className="w-3.5 h-3.5" /> Parse & Import
              </button>
            </div>
          )}

          {/* Vocabulary Section */}
          <div className="mt-10 mb-20">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-widest text-text-primary">Vocabulary</h2>
                <p className="text-[11px] text-text-muted mt-1">Add key words for flashcards</p>
              </div>
              <button
                type="button"
                onClick={handleAddVocab}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20"
              >
                <Plus className="w-3.5 h-3.5" /> Add Word
              </button>
            </div>

            <div className="space-y-4">
              {vocabulary.map((v, i) => (
                <div key={i} className="card-glass rounded-2xl p-5 relative group">
                  <button
                    type="button"
                    onClick={() => handleRemoveVocab(i)}
                    className="absolute top-4 right-4 p-2 text-text-muted hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-1.5">Word</label>
                      <input
                        type="text"
                        value={v.word}
                        onChange={e => updateVocab(i, { word: e.target.value })}
                        className="input-dark w-full px-3 py-2 text-sm"
                        placeholder="e.g., Meticulous"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-1.5">Phonetic</label>
                      <input
                        type="text"
                        value={v.phonetic}
                        onChange={e => updateVocab(i, { phonetic: e.target.value })}
                        className="input-dark w-full px-3 py-2 text-sm"
                        placeholder="e.g., /məˈtɪkjələs/"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-1.5">Meaning</label>
                    <input
                      type="text"
                      value={v.meaning}
                      onChange={e => updateVocab(i, { meaning: e.target.value })}
                      className="input-dark w-full px-3 py-2 text-sm"
                      placeholder="Enter word meaning..."
                    />
                  </div>

                  <div className="mt-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-1.5">Example Sentence</label>
                    <textarea
                      rows={2}
                      value={v.example}
                      onChange={e => updateVocab(i, { example: e.target.value })}
                      className="input-dark w-full px-3 py-2 text-sm resize-none"
                      placeholder="Use the word in a sentence..."
                    />
                  </div>
                </div>
              ))}

              {vocabulary.length === 0 && (
                <div className="py-12 text-center rounded-2xl border border-dashed border-white/10">
                  <p className="text-sm text-text-muted italic">No vocabulary added yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right — Questions Panel */}
      <div
        className="w-80 xl:w-96 shrink-0 flex flex-col overflow-hidden"
        style={{ background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)' }}
      >
        {/* Panel header */}
        <div
          className="px-5 py-4 flex items-center justify-between shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Questions</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{questions.length} items</p>
          </div>
          <button
            type="button"
            onClick={handleAddQuestion}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{ background: 'rgba(0,212,170,0.1)', color: 'var(--accent)', border: '1px solid rgba(0,212,170,0.2)' }}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Questions list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {questions.map((q, i) => (
            <div
              key={i}
              className="rounded-xl p-4"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)' }}
                >
                  #{i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(i)}
                  className="w-6 h-6 rounded flex items-center justify-center transition-all hover:text-red-400"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Question text */}
              <input
                type="text"
                placeholder={type === 'cloze' ? 'Blank label (optional)' : type === 'rewriting' ? 'Original sentence' : 'Question text'}
                value={q.question_text}
                onChange={e => updateQuestion(i, { question_text: e.target.value })}
                className="input-dark w-full px-3 py-2 text-[11px] mb-3"
              />

              {/* Options with content */}
              <div className="space-y-1.5 mb-3">
                {['A', 'B', 'C', 'D'].map((label, optIndex) => (
                  <div key={label} className="flex items-center gap-2">
                    {type !== 'rewriting' && (
                      <button
                        type="button"
                        onClick={() => updateQuestion(i, { correct_answer: label })}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 transition-all"
                        style={q.correct_answer === label ? {
                          background: 'var(--accent)',
                          color: '#0b0f19',
                          boxShadow: '0 0 10px rgba(0,212,170,0.3)',
                        } : {
                          background: 'rgba(255,255,255,0.04)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border)',
                        }}
                        title={q.correct_answer === label ? 'Correct answer' : 'Click to set as correct'}
                      >
                        {label}
                      </button>
                    )}
                    {type === 'rewriting' && (
                      <span className="text-[10px] font-bold text-text-muted w-6 text-center">{optIndex + 1}.</span>
                    )}
                    <input
                      type="text"
                      placeholder={type === 'rewriting' ? 'Acceptable answer...' : `Option ${label} content...`}
                      value={q.options[label] || ''}
                      onChange={e => updateOption(i, label, e.target.value)}
                      className="input-dark flex-1 px-2 py-1.5 text-[11px]"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Save button */}
        <div
          className="p-4 shrink-0"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save & Publish'}
          </button>
        </div>
      </div>

      {/* AI Generate Modal */}
      <Transition appear show={isAiModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => !aiLoading && setIsAiModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95 translate-y-4" enterTo="opacity-100 scale-100 translate-y-0" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100 translate-y-0" leaveTo="opacity-0 scale-95 translate-y-4">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-bg-surface border border-border p-6 text-left align-middle shadow-2xl transition-all relative">
                  {/* Decorative Header */}
                  <div className="absolute top-0 left-0 right-0 h-32 opacity-20 pointer-events-none" style={{ background: 'linear-gradient(180deg, var(--accent) 0%, transparent 100%)', filter: 'blur(40px)' }} />
                  
                  <div className="flex items-center justify-between mb-6 relative">
                    <Dialog.Title as="h3" className="text-lg font-bold flex items-center gap-2 text-text-primary">
                      <Sparkles className="w-5 h-5 text-accent" /> Tạo câu hỏi AI
                    </Dialog.Title>
                    <button onClick={() => !aiLoading && setIsAiModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-text-muted">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-5 relative">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-2 block">Chủ đề (Topic)</label>
                      <input
                        type="text"
                        value={aiTopic}
                        onChange={e => setAiTopic(e.target.value)}
                        className="input-dark w-full px-4 py-3 text-sm rounded-xl focus:border-accent/50 focus:bg-accent/5 transition-all"
                        placeholder="VD: Global Warming, The History of Internet..."
                        disabled={aiLoading}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-2 block">Độ khó</label>
                        <select
                          value={aiDifficulty}
                          onChange={e => setAiDifficulty(e.target.value)}
                          className="input-dark w-full px-4 py-3 text-sm rounded-xl appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M6%209L12%2015L18%209%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_12px_center]"
                          disabled={aiLoading}
                        >
                          <option value="A1">A1 (Beginner)</option>
                          <option value="A2">A2 (Elementary)</option>
                          <option value="B1">B1 (Intermediate)</option>
                          <option value="B2">B2 (Upper Intermediate)</option>
                          <option value="C1">C1 (Advanced)</option>
                          <option value="C2">C2 (Proficient)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-2 block">Số lượng</label>
                        <select
                          value={aiNumQuestions}
                          onChange={e => setAiNumQuestions(Number(e.target.value))}
                          className="input-dark w-full px-4 py-3 text-sm rounded-xl appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M6%209L12%2015L18%209%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_12px_center]"
                          disabled={aiLoading}
                        >
                          <option value={5}>5 câu</option>
                          <option value={10}>10 câu</option>
                          <option value={15}>15 câu</option>
                          <option value={20}>20 câu</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-2 block">Dạng bài tập</label>
                      <input
                        type="text"
                        value={aiExerciseType}
                        onChange={e => setAiExerciseType(e.target.value)}
                        className="input-dark w-full px-4 py-3 text-sm rounded-xl focus:border-accent/50 focus:bg-accent/5 transition-all"
                        placeholder="VD: Trắc nghiệm đọc hiểu, Viết lại câu, Điền từ vào đoạn văn..."
                        disabled={aiLoading}
                      />
                    </div>
                  </div>

                  <div className="mt-8 pt-6 flex gap-3 relative" style={{ borderTop: '1px solid var(--border)' }}>
                    <button
                      type="button"
                      className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-text-secondary hover:bg-white/5 hover:text-text-primary transition-colors disabled:opacity-50"
                      onClick={() => setIsAiModalOpen(false)}
                      disabled={aiLoading}
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      className="flex-[2] py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent/20 hover:shadow-accent/40 disabled:opacity-50 disabled:shadow-none"
                      style={{ background: 'var(--accent)', color: '#0b0f19' }}
                      onClick={handleAiGenerate}
                      disabled={aiLoading}
                    >
                      {aiLoading ? (
                        <>
                          <Sparkles className="w-4 h-4 ai-spin-dance" />
                          Đang phân tích & tạo...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" /> Bắt đầu tạo
                        </>
                      )}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
