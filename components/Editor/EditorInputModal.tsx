"use client";

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Link, Image, X } from 'lucide-react';

interface EditorInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  placeholder: string;
  initialValue?: string;
  type: 'link' | 'image';
}

export default function EditorInputModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  placeholder,
  initialValue = '',
  type
}: EditorInputModalProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
    }
  }, [isOpen, initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(value);
    onClose();
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity" />
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl p-6 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md card-glass" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="absolute right-4 top-4">
                  <button
                    type="button"
                    className="rounded-lg p-1 text-text-muted hover:bg-white/5 transition-colors"
                    onClick={onClose}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                    {type === 'link' ? (
                      <Link className="w-5 h-5 text-accent" />
                    ) : (
                      <Image className="w-5 h-5 text-accent" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-text-primary">
                      {title}
                    </Dialog.Title>
                    <form onSubmit={handleSubmit} className="mt-4">
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          placeholder={placeholder}
                          autoFocus
                          className="input-dark w-full px-4 py-3 text-sm"
                        />
                        <div className="flex flex-row-reverse gap-3">
                          <button
                            type="submit"
                            className="btn-primary px-6 py-2.5 text-sm"
                          >
                            Add {type === 'link' ? 'Link' : 'Image'}
                          </button>
                          <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-bold text-text-secondary hover:text-text-primary transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </form>
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
