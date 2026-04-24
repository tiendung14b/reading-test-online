"use client";

import { useEffect, useState, Fragment } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BookOpen, ListChecks, Plus, Trash2, Save, Zap, FileText, ChevronLeft, PenTool, AlertTriangle, X } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import toast from 'react-hot-toast';

type OptionMap = Record<string, string>;

type Question = {
  id?: number;
  question_text: string;
  options: OptionMap;
  correct_answer: string;
};

type VocabularyEntry = {
  id?: number;
  word: string;
  meaning: string;
  phonetic: string;
  example: string;
};

const EMPTY_OPTIONS: OptionMap = { A: '', B: '', C: '', D: '' };

function makeQuestion(text = '', options = { ...EMPTY_OPTIONS }, correct = 'A'): Question {
  return { question_text: text, options, correct_answer: correct };
}

export default function EditTest() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('reading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [vocabulary, setVocabulary] = useState<VocabularyEntry[]>([]);
  const [bulkText, setBulkText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/practice/${id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setTitle(data.title);
          setContent(data.content);
          setType(data.type);
          setQuestions(data.questions || []);
          setVocabulary(data.vocabulary || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

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

  const parseBulk = () => {
    // Re-use logic from Create page (simplified here for brevity, but full implementation is better)
    // Actually, I'll just include the full logic to ensure it works.
    const raw = bulkText.trim();
    if (!raw) return;

    if (type === 'cloze') {
      const lines = raw.split('\n').filter(l => l.trim());
      const parsed: Question[] = [];
      for (const line of lines) {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length < 2) continue;
        const questionText = parts[0].replace(/^\[\d+\]\s*/, '').trim();
        const options: OptionMap = {};
        let correct = 'A';
        for (let i = 1; i < parts.length; i++) {
          let p = parts[i];
          const isCorrect = p.startsWith('*');
          if (isCorrect) p = p.substring(1).trim();
          const m = p.match(/^([A-D])\.\s*(.*)/i);
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
      if (parsed.length > 0) setQuestions(parsed);
    } else {
      const blocks: string[] = [];
      const lines = raw.split('\n');
      let currentBlock = '';
      for (const line of lines) {
        if (/^\s*\d+[\.\)]\s+/.test(line)) {
          if (currentBlock.trim()) blocks.push(currentBlock.trim());
          currentBlock = line;
        } else currentBlock += '\n' + line;
      }
      if (currentBlock.trim()) blocks.push(currentBlock.trim());
      const parsed: Question[] = [];
      for (const block of blocks) {
        const blockLines = block.split('\n').map(l => l.trim()).filter(Boolean);
        if (blockLines.length === 0) continue;
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
      if (parsed.length > 0) setQuestions(parsed);
    }
  };

  const handleSubmit = async () => {
    if (!title || !content) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/practice/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, type, questions, vocabulary }),
      });
      if (res.ok) { 
        toast.success('Update successful');
        router.push(`/practice/${id}`); 
        router.refresh(); 
      }
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/practice/${id}`, { method: 'DELETE' });
      if (res.ok) { 
        toast.success('Exercise deleted');
        router.push('/'); 
        router.refresh(); 
      }
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  if (loading) return <div className="h-full flex items-center justify-center bg-bg-base"><div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin border-accent" /></div>;

  return (
    <div className="h-full flex flex-col bg-bg-base">
      {/* Sticky Header */}
      <header className="px-6 py-4 flex items-center justify-between bg-bg-surface/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-white/5 text-text-muted"><ChevronLeft className="w-5 h-5" /></button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-0.5">Editing Exercise</p>
            <h1 className="text-sm font-semibold text-text-primary line-clamp-1">{title || 'Loading...'}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={handleDelete} className="px-4 py-2 text-xs font-bold text-danger hover:bg-danger/10 rounded-lg transition-all">Delete</button>
           <button onClick={handleSubmit} disabled={saving} className="btn-primary px-6 py-2 text-xs flex items-center gap-2">
             <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Form */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-3xl">
            {/* Type selector */}
            <div className="mb-8">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-4">Exercise Type</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[{ v: 'reading', l: 'Reading', i: BookOpen }, { v: 'cloze', l: 'Cloze Test', i: ListChecks }, { v: 'rewriting', l: 'Rewriting', i: PenTool }].map(t => (
                  <button key={t.v} onClick={() => setType(t.v)} className={`p-5 rounded-2xl text-left border transition-all ${type === t.v ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-white/5 border-border text-text-secondary'}`}>
                    <t.i className="w-5 h-5 mb-2" />
                    <span className="font-bold text-sm">{t.l}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-2">Exercise Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="input-dark w-full px-5 py-3.5 text-base" placeholder="Enter title..." />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-2">Content</label>
                <textarea rows={12} value={content} onChange={e => setContent(e.target.value)} className="input-dark w-full px-5 py-4 text-sm leading-relaxed resize-none" placeholder="Paste passage content here..." />
              </div>
            </div>

            {/* Bulk Import */}
            {type !== 'rewriting' && (
              <div className="mt-10 p-6 rounded-2xl bg-accent/5 border border-accent/20">
                <div className="flex items-center gap-2 mb-4 text-accent">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Quick Import Questions</span>
                </div>
                <textarea rows={6} value={bulkText} onChange={e => setBulkText(e.target.value)} className="input-dark w-full px-4 py-3 text-xs mb-4 font-mono" placeholder="Paste questions here to parse..." />
                <button onClick={parseBulk} className="btn-primary px-5 py-2.5 text-xs">Import & Replace Questions</button>
              </div>
            )}

            {/* Vocabulary Section */}
            <div className="mt-12 mb-20">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-text-primary">Vocabulary Items</h2>
                <button onClick={handleAddVocab} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-accent/10 text-accent border border-accent/20 transition-all hover:bg-accent/20">
                  <Plus className="w-4 h-4" /> Add New Word
                </button>
              </div>
              <div className="space-y-4">
                {vocabulary.map((v, i) => (
                  <div key={i} className="card-glass rounded-2xl p-6 relative group border-white/5">
                    <button onClick={() => handleRemoveVocab(i)} className="absolute top-6 right-6 text-text-muted hover:text-danger"><Trash2 className="w-4 h-4" /></button>
                    <div className="grid grid-cols-2 gap-6 mb-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Word</label>
                        <input value={v.word} onChange={e => updateVocab(i, { word: e.target.value })} className="input-dark w-full px-4 py-2.5 text-sm font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Phonetic</label>
                        <input value={v.phonetic} onChange={e => updateVocab(i, { phonetic: e.target.value })} className="input-dark w-full px-4 py-2.5 text-sm" />
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Meaning</label>
                      <input value={v.meaning} onChange={e => updateVocab(i, { meaning: e.target.value })} className="input-dark w-full px-4 py-2.5 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Example</label>
                      <textarea rows={2} value={v.example} onChange={e => updateVocab(i, { example: e.target.value })} className="input-dark w-full px-4 py-2.5 text-sm resize-none" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Questions Panel */}
        <div className="w-96 shrink-0 bg-bg-surface flex flex-col border-l border-white/5">
          <div className="p-5 flex items-center justify-between">
            <span className="text-sm font-bold text-text-primary">Questions ({questions.length})</span>
            <button onClick={handleAddQuestion} className="w-9 h-9 rounded-xl flex items-center justify-center bg-accent/10 text-accent border border-accent/20 transition-all hover:bg-accent/20"><Plus className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {questions.map((q, i) => (
              <div key={i} className="card-glass rounded-2xl p-5 border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-text-muted uppercase">Question #{i + 1}</span>
                  <button onClick={() => handleRemoveQuestion(i)} className="text-text-muted hover:text-danger"><Trash2 className="w-4 h-4" /></button>
                </div>
                <input value={q.question_text} onChange={e => updateQuestion(i, { question_text: e.target.value })} className="input-dark w-full px-3 py-2 text-xs mb-4" placeholder={type === 'cloze' ? 'Blank label (optional)' : type === 'rewriting' ? 'Original sentence' : 'Enter question...'} />
                <div className="space-y-2">
                  {['A','B','C','D'].map((l, optIndex) => (
                    <div key={l} className="flex gap-2 items-center">
                      {type !== 'rewriting' && (
                        <button onClick={() => updateQuestion(i, { correct_answer: l })} className={`w-7 h-7 rounded-lg text-[10px] font-black shrink-0 transition-all ${q.correct_answer === l ? 'bg-accent text-[#0b0f19] shadow-lg shadow-accent/30' : 'bg-white/5 text-text-muted border border-white/5'}`}>{l}</button>
                      )}
                      {type === 'rewriting' && (
                        <span className="text-[10px] font-bold text-text-muted w-6 text-center">{optIndex + 1}.</span>
                      )}
                      <input value={q.options[l] || ''} onChange={e => updateOption(i, l, e.target.value)} className="input-dark flex-1 px-2.5 py-1.5 text-xs" placeholder={type === 'rewriting' ? 'Acceptable answer...' : `Option ${l} content...`} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Transition appear show={showDeleteModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => !deleting && setShowDeleteModal(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-bg-surface border border-border p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3 text-danger">
                      <div className="p-2 bg-danger/10 rounded-lg">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <Dialog.Title as="h3" className="text-lg font-bold leading-6">Delete Exercise</Dialog.Title>
                    </div>
                    <button onClick={() => !deleting && setShowDeleteModal(false)} className="text-text-muted hover:text-text-primary transition-colors"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="mt-2 mb-8">
                    <p className="text-sm text-text-secondary leading-relaxed">
                      Are you sure you want to delete <span className="font-semibold text-text-primary">"{title || 'this exercise'}"</span>? This action cannot be undone and will permanently remove all associated questions and vocabulary.
                    </p>
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <button type="button" onClick={() => setShowDeleteModal(false)} disabled={deleting} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all">Cancel</button>
                    <button type="button" onClick={confirmDelete} disabled={deleting} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-danger text-white hover:bg-danger/90 transition-all flex items-center gap-2 shadow-lg shadow-danger/20">
                      {deleting ? (
                        <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Deleting...</>
                      ) : (
                        <><Trash2 className="w-4 h-4" /> Delete Exercise</>
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
