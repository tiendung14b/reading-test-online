"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, PlusCircle, LayoutDashboard, Settings, HelpCircle, Menu, X, ChevronLeft, ChevronRight, History, Library } from 'lucide-react';
import { useState, useEffect } from 'react';

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
    { href: '/history', icon: History, label: 'History' },
    { href: '/lessons', icon: Library, label: 'Lessons' },
    { href: '/create', icon: PlusCircle, label: 'Create' },
  ];

  const sidebarWidth = isMobile 
    ? (isOpen ? '240px' : '0px') 
    : (isOpen ? '240px' : '72px');

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Sidebar Overlay for Mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`flex flex-col py-5 shrink-0 z-50 transition-all duration-300 ease-in-out ${
          isMobile ? 'fixed inset-y-0 left-0 shadow-2xl' : 'relative'
        } ${!isOpen && isMobile ? '-translate-x-full' : 'translate-x-0'}`}
        style={{
          width: sidebarWidth,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          overflow: 'hidden'
        }}
      >
        {/* Logo Section */}
        <div className={`px-4 mb-8 flex items-center ${!isOpen && !isMobile ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--accent)', boxShadow: '0 0 20px rgba(0,212,170,0.4)' }}
            >
              <BookOpen className="w-5 h-5" style={{ color: '#0b0f19' }} />
            </div>
            {(isOpen || isMobile) && (
              <span className="font-bold text-lg tracking-tight whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                EngMaster
              </span>
            )}
          </div>
          {isMobile && (
            <button onClick={() => setIsOpen(false)} className="p-2 text-text-secondary hover:text-text-primary">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex flex-col gap-2 px-3 flex-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={label}
                onClick={() => { if (isMobile) setIsOpen(false); }}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
                  isActive ? 'bg-accent/10 text-accent' : 'text-text-muted hover:bg-white/5 hover:text-text-secondary'
                }`}
                style={isActive ? {
                  background: 'rgba(0,212,170,0.12)',
                  color: 'var(--accent)',
                } : {}}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {(isOpen || isMobile) && (
                  <span className="font-medium whitespace-nowrap transition-opacity duration-300">
                    {label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom icons */}
        <div className="flex flex-col gap-2 px-3 mt-auto border-t border-white/5 pt-4">
          <button className="flex items-center gap-3 p-3 rounded-xl text-text-muted hover:bg-white/5 hover:text-text-secondary transition-all group">
            <HelpCircle className="w-5 h-5 shrink-0" />
            {(isOpen || isMobile) && <span className="font-medium whitespace-nowrap">Help Center</span>}
          </button>
          <Link href="/tokens" onClick={() => { if (isMobile) setIsOpen(false); }} className="flex items-center gap-3 p-3 rounded-xl text-text-muted hover:bg-white/5 hover:text-text-secondary transition-all group">
            <Settings className="w-5 h-5 shrink-0" />
            {(isOpen || isMobile) && <span className="font-medium whitespace-nowrap">Settings & API Keys</span>}
          </Link>
          
          {/* User Profile */}
          <div className={`mt-2 flex items-center gap-3 p-2 rounded-xl bg-white/5 ${!isOpen && !isMobile ? 'justify-center' : ''}`}>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{
                background: 'linear-gradient(135deg, #00d4aa, #0077ff)',
                color: '#fff',
              }}
            >
              DF
            </div>
            {(isOpen || isMobile) && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>Dung Phan</span>
                <span className="text-[10px] text-text-muted uppercase tracking-wider">Pro Plan</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <header
          className="h-14 flex items-center px-4 shrink-0 gap-4"
          style={{
            background: 'rgba(17,24,39,0.8)',
            borderBottom: '1px solid var(--border)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-white/5 text-text-secondary transition-colors"
            title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-center gap-3">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {pathname === '/' ? 'Dashboard' : 
               pathname.startsWith('/history') ? 'Practice History' :
               pathname === '/create' ? 'Create Exercise' : 
               'Practice Mode'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(0,212,170,0.1)', color: 'var(--accent)', border: '1px solid rgba(0,212,170,0.2)' }}
            >
              EngMaster.io
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
