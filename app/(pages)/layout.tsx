"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { BookOpen, PlusCircle, LayoutDashboard, Settings, HelpCircle, Menu, X, ChevronLeft, ChevronRight, History, Library, Sparkles, MessagesSquare } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import BottomNav from '@/components/BottomNav';

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsOpen(false); // Mobile default closed
      } else {
        setIsOpen(true); // Desktop default open
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navItems = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/history', icon: History, label: 'Practice History' },
    { href: '/ai-history', icon: MessagesSquare, label: 'AI Chat History' },
    { href: '/lessons', icon: Library, label: 'Lessons' },
    { href: '/ai-create', icon: Sparkles, label: 'AI Generator' },
    { href: '/create', icon: PlusCircle, label: 'Create Manual' },
    { href: '/tokens', icon: Settings, label: 'Settings & Tokens' },
  ];

  const sidebarWidth = isMobile 
    ? '280px'
    : (isOpen ? '240px' : '72px');

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Sidebar Overlay for Mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-md transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile by default, only shown as drawer */}
      <aside
        className={`flex flex-col py-5 shrink-0 z-40 transition-all duration-500 ease-in-out ${
          isMobile ? 'fixed inset-y-0 left-0 shadow-2xl z-[150]' : 'relative'
        } ${!isOpen && isMobile ? '-translate-x-full' : 'translate-x-0'} ${
          isMobile ? 'rounded-r-[2.5rem]' : ''
        }`}
        style={{
          width: sidebarWidth,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          overflow: 'hidden'
        }}
      >
        {/* Logo Section */}
        <div className={`mb-10 flex items-center transition-all duration-300 ${
          (isOpen || isMobile) ? 'px-6 justify-between' : 'px-0 justify-center'
        }`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0 shadow-lg shadow-accent/20"
            >
              <BookOpen className="w-5 h-5 text-on-accent" />
            </div>
            {(isOpen || isMobile) && (
              <span className="font-black text-xl tracking-tight whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                EngMaster<span className="text-accent">.io</span>
              </span>
            )}
          </div>
          {isMobile && (
            <button onClick={() => setIsOpen(false)} className="p-3 bg-white/5 rounded-2xl text-text-muted hover:text-text-primary">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Nav Items */}
        <nav className={`flex flex-col gap-2 flex-1 overflow-y-auto custom-scrollbar transition-all duration-300 ${
          (isOpen || isMobile) ? 'px-4' : 'px-2'
        }`}>
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={label}
                onClick={() => { if (isMobile) setIsOpen(false); }}
                className={`flex items-center rounded-2xl transition-all duration-300 group ${
                  isActive ? 'bg-accent/10 text-accent' : 'text-text-muted hover:bg-white/5 hover:text-text-primary'
                } ${
                  (isOpen || isMobile) ? 'px-4 py-4 gap-4' : 'mx-auto w-12 h-12 justify-center'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'scale-110' : ''}`} />
                {(isOpen || isMobile) && (
                  <span className={`font-bold text-sm whitespace-nowrap transition-all duration-300 ${isActive ? 'translate-x-1' : ''}`}>
                    {label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className={`mt-auto space-y-4 transition-all duration-300 ${
          (isOpen || isMobile) ? 'px-4' : 'px-2'
        }`}>
          <div className="h-px bg-white/5 w-full" />
          
          {/* User Profile */}
          <div className={`flex items-center rounded-[1.5rem] bg-white/[0.03] border border-white/5 transition-all duration-300 ${
            (isOpen || isMobile) ? 'p-3 gap-4' : 'mx-auto w-12 h-12 justify-center p-0'
          }`}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center p-0.5 bg-accent/20 border border-accent/20 shrink-0 overflow-hidden">
              <img src="https://i.pinimg.com/736x/57/fb/38/57fb388bf33d55c48684c2506f22a758.jpg" alt="avatar" className="w-full h-full rounded-full object-cover" />
            </div>
            {(isOpen || isMobile) && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-black whitespace-nowrap text-text-primary">Cún 💖</span>
                <span className="text-[10px] text-accent font-black uppercase tracking-[0.15em]">Pro Student</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header
          className="h-16 flex items-center px-6 shrink-0 gap-4 z-30"
          style={{
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {!isMobile && (
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="p-2.5 rounded-xl hover:bg-white/5 text-text-muted transition-all active:scale-95"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex-1 flex items-center gap-3">
            <h2 className="text-sm font-black uppercase tracking-widest text-text-muted">
              {pathname === '/' ? 'Dashboard' : 
               pathname.startsWith('/history') ? 'Archive' :
               pathname === '/create' ? 'Creator' : 
               'Platform'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div
              className="hidden sm:block text-[10px] font-black px-4 py-2 rounded-xl bg-accent/10 text-accent border border-accent/20 uppercase tracking-[0.2em]"
            >
              EngMaster
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto relative" id="main-content-layout">
          <div className={`${isMobile ? 'pb-32' : 'pb-10'}`}>
            {children}
          </div>
        </main>

        {/* Bottom Navigation for Mobile */}
        <BottomNav onMenuClick={() => setIsOpen(true)} />
      </div>
    </div>
  );
}
