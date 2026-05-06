"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Library, Sparkles, Clock, LayoutGrid } from 'lucide-react';
import { Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface BottomNavProps {
  onMenuClick: () => void;
}

export default function BottomNav({ onMenuClick }: BottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: LayoutDashboard, label: 'Home' },
    { href: '/lessons', icon: Library, label: 'Lessons' },
    { href: '/ai-create', icon: Sparkles, label: 'Create', isCenter: true },
    { href: '/history', icon: Clock, label: 'History' },
    { label: 'Menu', icon: LayoutGrid, onClick: onMenuClick },
  ];

  return (
    <div className="fixed bottom-8 left-0 right-0 z-[60] px-6 lg:hidden pointer-events-none">
      <div className="max-w-[400px] mx-auto relative pointer-events-auto">
        <div className="flex items-center justify-around bg-[#0b0f19]/90 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] px-2 py-3 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)]">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = item.href ? pathname === item.href : false;

            if (item.isCenter) {
              return (
                <div key={index} className="relative flex justify-center w-16">
                  <Link
                    href={item.href!}
                    className={`absolute -top-10 w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-2xl ${
                      isActive 
                        ? 'bg-accent text-on-accent' 
                        : 'bg-[#0f172a] text-accent border-[6px] border-[#0b0f19]'
                    }`}
                    style={{
                      boxShadow: isActive 
                        ? '0 10px 30px rgba(0,212,170,0.4), inset 0 0 15px rgba(255,255,255,0.2)' 
                        : '0 15px 30px rgba(0,0,0,0.6)'
                    }}
                  >
                    <Icon className="w-8 h-8" />
                  </Link>
                </div>
              );
            }

            const Content = (
              <div className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${
                isActive ? 'text-accent' : 'text-text-muted'
              }`}>
                <Icon className={`w-6 h-6 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,212,170,0.5)]' : ''} transition-all duration-300`} />
              </div>
            );

            if (item.href) {
              return (
                <Link key={index} href={item.href} className="flex-1">
                  {Content}
                </Link>
              );
            }

            return (
              <button key={index} onClick={item.onClick} className="flex-1">
                {Content}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
