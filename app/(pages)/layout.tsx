"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, PlusCircle, LayoutDashboard, Settings, HelpCircle } from 'lucide-react';

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/create', icon: PlusCircle, label: 'Create' },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Sidebar */}
      <aside
        className="w-[72px] flex flex-col items-center py-5 gap-2 shrink-0 z-50"
        style={{
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Logo */}
        <div className="mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent)', boxShadow: '0 0 20px rgba(0,212,170,0.4)' }}
          >
            <BookOpen className="w-5 h-5" style={{ color: '#0b0f19' }} />
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className="sidebar-icon"
                style={isActive ? {
                  background: 'rgba(0,212,170,0.12)',
                  color: 'var(--accent)',
                } : {}}
              >
                <Icon className="w-5 h-5" />
              </Link>
            );
          })}
        </nav>

        {/* Bottom icons */}
        <div className="flex flex-col gap-1 mt-auto">
          <button className="sidebar-icon" title="Help">
            <HelpCircle className="w-5 h-5" />
          </button>
          <button className="sidebar-icon" title="Settings">
            <Settings className="w-5 h-5" />
          </button>
          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-full mt-2 flex items-center justify-center text-xs font-bold"
            style={{
              background: 'linear-gradient(135deg, #00d4aa, #0077ff)',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            DF
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <header
          className="h-14 flex items-center px-6 shrink-0"
          style={{
            background: 'rgba(17,24,39,0.8)',
            borderBottom: '1px solid var(--border)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex-1 flex items-center gap-3">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {pathname === '/' ? 'Dashboard' : pathname === '/create' ? 'Create Exercise' : 'Practice Mode'}
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
