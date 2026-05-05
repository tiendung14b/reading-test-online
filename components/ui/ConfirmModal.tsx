"use client";

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}: ConfirmModalProps) {
  
  const variantStyles = {
    danger: {
      icon: <AlertTriangle className="w-6 h-6 text-danger" />,
      bg: 'var(--danger-dim)',
      btn: 'bg-danger hover:bg-danger/90 text-white shadow-lg shadow-danger/25'
    },
    warning: {
      icon: <AlertTriangle className="w-6 h-6 text-warning" />,
      bg: 'rgba(245, 158, 11, 0.1)',
      btn: 'bg-warning hover:opacity-90 text-white shadow-lg shadow-warning/20'
    },
    info: {
      icon: <AlertTriangle className="w-6 h-6 text-accent" />,
      bg: 'var(--accent-dim)',
      btn: 'bg-accent hover:opacity-90 text-on-accent shadow-lg shadow-accent/20'
    }
  };

  const style = variantStyles[variant];

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl p-6 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg card-glass" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="absolute right-4 top-4">
                  <button
                    type="button"
                    className="rounded-lg p-1 text-text-muted hover:bg-subtle transition-colors"
                    onClick={onClose}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:mx-0 sm:h-10 sm:w-10" style={{ background: style.bg }}>
                    {style.icon}
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-text-primary">
                      {title}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-text-secondary leading-relaxed">
                        {message}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 sm:mt-8 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    type="button"
                    className={`inline-flex w-full justify-center rounded-xl px-5 py-2.5 text-sm font-bold shadow-sm sm:w-auto transition-all ${style.btn}`}
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                  >
                    {confirmText}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-xl bg-subtle px-5 py-2.5 text-sm font-bold text-text-primary shadow-sm hover:bg-ui-border-strong sm:mt-0 sm:w-auto transition-all"
                    onClick={onClose}
                  >
                    {cancelText}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
