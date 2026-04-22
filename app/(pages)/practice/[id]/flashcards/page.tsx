"use client";

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, RotateCcw, Volume2, BookOpen, GraduationCap } from 'lucide-react';

type Vocabulary = {
  id: number;
  word: string;
  meaning: string;
  phonetic: string;
  example: string;
};

export default function FlashcardsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [vocab, setVocab] = useState<Vocabulary[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [exerciseTitle, setExerciseTitle] = useState('');

  useEffect(() => {
    // Fetch exercise title
    fetch(`/api/practice/${id}`)
      .then(res => res.json())
      .then(data => setExerciseTitle(data.title))
      .catch(console.error);

    // Fetch vocabulary
    fetch(`/api/practice/${id}/vocabulary`)
      .then(res => res.json())
      .then(data => {
        setVocab(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const currentWord = vocab[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % vocab.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + vocab.length) % vocab.length);
    }, 150);
  };

  const handleFlip = () => setIsFlipped(!isFlipped);

  const progress = vocab.length > 0 ? ((currentIndex + 1) / vocab.length) * 100 : 0;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-base">
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin border-accent" />
      </div>
    );
  }

  if (vocab.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-bg-base">
        <div className="w-20 h-20 rounded-3xl bg-accent/10 flex items-center justify-center mb-6">
          <BookOpen className="w-10 h-10 text-accent" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">No vocabulary available</h2>
        <p className="text-text-muted mb-8 max-w-xs">This exercise doesn't have any saved vocabulary yet.</p>
        <button onClick={() => router.back()} className="btn-primary px-6 py-3">Back to Exercise</button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-bg-base overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-border bg-bg-surface/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-white/5 text-text-muted transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-0.5">Flashcards</p>
            <h1 className="text-sm font-semibold text-text-primary line-clamp-1">{exerciseTitle}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
          <GraduationCap className="w-4 h-4 text-accent" />
          <span className="text-xs font-bold text-accent">{currentIndex + 1} / {vocab.length}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center overflow-y-auto p-6 relative custom-scrollbar">
        {/* Progress bar at top of main - sticky-like */}
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5 z-10">
          <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center w-full min-h-full py-2 pb-8">
          {/* Card Container */}
          <div className="w-full max-w-lg perspective-1000 aspect-[5/4] md:aspect-[1.5/1] shrink-0 mb-8">
          <div 
            className={`relative w-full h-full transition-transform duration-500 preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
            onClick={handleFlip}
          >
            {/* Front Side */}
            <div className="absolute inset-0 backface-hidden card-glass rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-2xl">
              <div className="absolute top-4 left-6 text-[10px] font-bold uppercase tracking-widest text-text-muted">Term</div>
              <div className="w-full">
                <h2 className="text-3xl md:text-4xl font-black text-text-primary mb-2 tracking-tight">{currentWord.word}</h2>
                {currentWord.phonetic && (
                  <p className="text-base text-accent font-medium mb-4">{currentWord.phonetic}</p>
                )}
                <div className="flex justify-center mt-8">
                   <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center hover:bg-accent/20 transition-colors">
                     <Volume2 className="w-5 h-5 text-accent" />
                   </div>
                </div>
              </div>
              <div className="absolute bottom-8 text-xs font-medium text-text-muted animate-pulse">Tap to reveal meaning</div>
            </div>

            {/* Back Side */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-accent/5 card-glass border-accent/30 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-2xl shadow-accent/5">
              <div className="absolute top-4 left-6 text-[10px] font-bold uppercase tracking-widest text-accent">Definition</div>
              <div className="w-full">
                <p className="text-xl md:text-2xl font-bold text-text-primary mb-4 leading-snug">{currentWord.meaning}</p>
                {currentWord.example && (
                  <div className="text-left bg-black/20 rounded-xl p-4 border border-white/5">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1">Example</p>
                    <p className="text-xs text-text-secondary leading-relaxed italic">"{currentWord.example}"</p>
                  </div>
                )}
              </div>
              <div className="absolute bottom-8 text-xs font-medium text-accent">Tap to flip back</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-6 mt-12 w-full max-w-md">
          <div className="flex items-center gap-6 w-full">
            <button 
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="flex-1 h-14 rounded-2xl flex items-center justify-center gap-2 bg-bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-text-muted transition-all active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-bold">Prev</span>
            </button>
            
            <button 
              onClick={(e) => { e.stopPropagation(); setIsFlipped(!isFlipped); }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 text-text-secondary hover:text-accent transition-all active:scale-95"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="flex-[1.5] h-14 rounded-2xl flex items-center justify-center gap-2 bg-accent text-[#0b0f19] shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all active:scale-95"
            >
              <span className="text-sm font-black uppercase tracking-wider">Next Word</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          </div>
        </div>
      </main>

      {/* CSS for 3D Flip */}
      <style jsx>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}
