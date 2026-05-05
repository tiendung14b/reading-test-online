"use client";

import { Fragment, useState, useEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Send, Bot, User, Sparkles, ChevronDown, ChevronUp, Bookmark, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { MarkdownText } from './MarkdownText';

export type ChatMessage = {
  id: string;
  role: 'user' | 'ai';
  text: string;
  isTyping?: boolean;
  fullText?: string;
};

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseId?: string | number;
  exerciseTitle?: string;
  exerciseType?: string;
  exerciseContext: string;
  questionLabel?: string;
  questionText?: string;
  userAnswer?: string;
  aiFeedback?: string;
}

export default function AIChatModal({ 
  isOpen, 
  onClose, 
  exerciseId,
  exerciseTitle,
  exerciseType,
  exerciseContext,
  questionLabel,
  questionText,
  userAnswer,
  aiFeedback
}: AIChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isContextExpanded, setIsContextExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Typewriter effect state
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);

  const MAX_QUESTIONS = 10;
  const userQuestionCount = messages.filter(m => m.role === 'user').length;
  const isLimitReached = userQuestionCount >= MAX_QUESTIONS;

  // Reset chat when opened/closed
  useEffect(() => {
    if (isOpen) {
      setMessages([{
        id: 'welcome',
        role: 'ai',
        text: 'Hi there! I am your AI Tutor. I have reviewed your exercise. Do you have any questions about it? (You can ask up to 10 questions).',
      }]);
      setInput('');
      setIsLoading(false);
      setTypingMessageId(null);
    } else {
      // Clear after a short delay so the closing animation is smooth
      setTimeout(() => setMessages([]), 300);
    }
  }, [isOpen]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingMessageId]);

  // Typewriter effect logic
  useEffect(() => {
    if (!typingMessageId) return;

    const msgIndex = messages.findIndex(m => m.id === typingMessageId);
    if (msgIndex === -1) return;

    const msg = messages[msgIndex];
    if (!msg.isTyping || !msg.fullText) return;

    if (msg.text.length < msg.fullText.length) {
      const timeout = setTimeout(() => {
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[msgIndex] = {
            ...newMsgs[msgIndex],
            text: msg.fullText!.slice(0, newMsgs[msgIndex].text.length + 1)
          };
          return newMsgs;
        });
      }, 15); // Adjust speed here
      return () => clearTimeout(timeout);
    } else {
      // Done typing
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[msgIndex] = { ...newMsgs[msgIndex], isTyping: false };
        return newMsgs;
      });
      setTypingMessageId(null);
    }
  }, [typingMessageId, messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || isLimitReached || typingMessageId) return;

    const userText = input.trim();
    setInput('');
    
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
    };

    // Prepare history for API (only real user/ai messages, exclude welcome if we want, but keeping welcome is fine)
    // We only send {role, text} to backend
    const history = messages.filter(m => m.id !== 'welcome').map(m => ({
      role: m.role,
      text: m.fullText || m.text
    }));

    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseContext,
          history,
          message: userText
        }),
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to get response');

      const aiMsgId = (Date.now() + 1).toString();
      const newAiMsg: ChatMessage = {
        id: aiMsgId,
        role: 'ai',
        text: '', // Start empty for typing effect
        fullText: data.text,
        isTyping: true,
      };

      setMessages(prev => [...prev, newAiMsg]);
      setTypingMessageId(aiMsgId);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        text: 'Sorry, I encountered an error while processing your request. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSave = async () => {
    if (messages.length <= 1 || isLoading) return;
    
    // Build a descriptive title
    const typeLabel = exerciseType ? exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1) : '';
    const qSnippet = questionText || '';
    
    let displayTitle = '';
    if (exerciseTitle) {
      displayTitle = `${exerciseTitle} | ${typeLabel} | ${questionLabel || 'General'}`;
      if (qSnippet) displayTitle += ` ${qSnippet}`;
    } else {
      displayTitle = `${qSnippet ? qSnippet : ''}`;
    }

    const savePromise = fetch('/api/ai/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exercise_id: exerciseId,
        title: displayTitle,
        context: exerciseContext,
        messages: messages,
        user_answer: userAnswer,
        ai_feedback: aiFeedback
      }),
    });

    toast.promise(savePromise, {
      loading: 'Saving chat...',
      success: 'Chat saved successfully!',
      error: 'Failed to save chat',
    });
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full sm:pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300 sm:duration-400"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300 sm:duration-400"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col shadow-2xl" style={{ background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)', height: '100dvh' }}>
                    
                    {/* Header */}
                    <div className="px-5 py-4 flex flex-col shrink-0 animate-in fade-in slide-in-from-top-4 duration-500" style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center animate-bounce-subtle" style={{ background: 'rgba(0,212,170,0.15)', color: '#00d4aa' }}>
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <Dialog.Title className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                              AI Tutor
                            </Dialog.Title>
                            <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'var(--text-muted)' }}>
                              {userQuestionCount}/{MAX_QUESTIONS} Questions used
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {messages.length > 1 && (
                            <button
                              onClick={handleSave}
                              className="rounded-lg p-2 transition-colors hover:bg-accent/10 text-accent"
                              title="Save Conversation"
                            >
                              <Bookmark className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            type="button"
                            className="rounded-lg p-2 transition-colors hover:bg-white/5"
                            style={{ color: 'var(--text-muted)' }}
                            onClick={onClose}
                          >
                            <X className="h-5 w-5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      {/* Selected Question Context Display */}
                      {questionText && (
                        <div className="rounded-xl border overflow-hidden animate-in fade-in zoom-in-95 duration-500 delay-150 fill-mode-both" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'var(--border)' }}>
                          <button 
                            onClick={() => setIsContextExpanded(!isContextExpanded)}
                            className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--accent)' }}>
                                {questionLabel || 'Context'}
                              </p>
                              <p className="text-xs line-clamp-1 italic" style={{ color: 'var(--text-secondary)' }}>
                                "{questionText}"
                              </p>
                            </div>
                            {isContextExpanded ? <ChevronUp className="w-4 h-4 text-text-muted ml-2" /> : <ChevronDown className="w-4 h-4 text-text-muted ml-2" />}
                          </button>
                          
                          {isContextExpanded && (
                            <div className="px-3 pb-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                              {userAnswer && (
                                <div className="pt-2 border-t border-white/5">
                                  <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5 text-text-muted">Your Answer:</p>
                                  <p className="text-xs font-semibold text-text-primary">{userAnswer}</p>
                                </div>
                              )}

                              {aiFeedback && (
                                <div className="pt-2 border-t border-white/5">
                                  <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5 text-accent">Initial AI Feedback:</p>
                                  <div className="text-[11px] text-text-secondary leading-relaxed" dangerouslySetInnerHTML={{ __html: aiFeedback }} />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-5" style={{ background: 'var(--bg-base)' }}>
                      {messages.map((msg) => {
                        const isAi = msg.role === 'ai';
                        return (
                          <div key={msg.id} className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${isAi ? '' : 'flex-row-reverse'}`}>
                            <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1" style={{ background: isAi ? 'rgba(0,212,170,0.1)' : 'rgba(255,255,255,0.05)', color: isAi ? '#00d4aa' : 'var(--text-secondary)' }}>
                              {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                            </div>
                            <div className={`max-w-[85%] rounded-2xl p-4 text-[13px] leading-relaxed whitespace-pre-wrap shadow-sm ${isAi ? 'rounded-tl-sm' : 'rounded-tr-sm'}`} style={{ 
                              background: isAi ? 'var(--bg-card)' : 'var(--accent)',
                              color: isAi ? 'var(--text-primary)' : 'var(--text-on-accent)',
                              border: isAi ? '1px solid var(--border)' : 'none'
                            }}>
                              <MarkdownText content={msg.text} />
                              {msg.isTyping && <span className="ml-1 inline-block w-1.5 h-3 bg-accent animate-pulse" />}
                            </div>
                          </div>
                        );
                      })}
                      
                      {isLoading && (
                        <div className="flex gap-3">
                           <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1" style={{ background: 'rgba(0,212,170,0.1)', color: '#00d4aa' }}>
                             <Bot className="w-4 h-4" />
                           </div>
                           <div className="rounded-2xl rounded-tl-sm p-4 flex items-center gap-1.5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                             <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#00d4aa', animationDelay: '0ms' }} />
                             <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#00d4aa', animationDelay: '150ms' }} />
                             <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#00d4aa', animationDelay: '300ms' }} />
                           </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 shrink-0" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                      {isLimitReached ? (
                        <div className="text-center p-3 rounded-xl border border-dashed" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                          <p className="text-sm">You have reached the maximum of 10 questions.</p>
                          <button onClick={onClose} className="text-xs font-semibold mt-2" style={{ color: 'var(--accent)' }}>Close Chat</button>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmit} className="relative">
                          <textarea
                            rows={1}
                            className="w-full rounded-xl pl-4 pr-12 py-3 text-base resize-none focus:outline-none"
                            style={{ 
                              background: 'var(--bg-base)', 
                              border: '1px solid var(--border)',
                              color: 'var(--text-primary)',
                              maxHeight: '120px',
                              fontSize: '16px' // Force 16px to prevent iOS zoom
                            }}
                            placeholder="Ask about your answers..."
                            value={input}
                            onChange={(e) => {
                              setInput(e.target.value);
                              e.target.style.height = 'auto';
                              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                            }}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading || !!typingMessageId}
                          />
                          <button
                            type="submit"
                            disabled={!input.trim() || isLoading || !!typingMessageId}
                            className="absolute right-2 bottom-2 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                            style={{ background: input.trim() && !isLoading && !typingMessageId ? 'var(--accent)' : 'transparent', color: input.trim() && !isLoading && !typingMessageId ? '#0b0f19' : 'var(--text-muted)' }}
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </form>
                      )}
                    </div>

                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
