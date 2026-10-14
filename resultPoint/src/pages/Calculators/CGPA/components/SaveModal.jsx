import React from 'react';
import { X, Lock } from 'lucide-react';

export default function SaveModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl p-5 max-w-sm w-full shadow-card text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-lg text-text-secondary hover:text-text-primary flex items-center justify-center"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent mx-auto flex items-center justify-center mb-2.5">
          <Lock className="w-5 h-5" />
        </div>

        <h3 className="text-sm font-bold text-text-primary">
          Save Your Academic Record
        </h3>
        <p className="mt-1.5 text-xs text-text-secondary leading-relaxed">
          Create an account to save your academic result and track your progress across semesters.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-all shadow-sm"
          >
            Create Account
          </button>
          <button
            type="button"
            className="w-full py-2.5 rounded-xl border border-border hover:bg-surface text-text-primary text-xs font-semibold transition-all"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}