import React from 'react';
import { useToast } from '../../context/ToastContext';
import { CheckCircle } from 'lucide-react';

export default function Toast() {
  const { toast } = useToast();

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 bg-card border border-border text-text-h px-4 py-3 rounded-xl shadow-theme transition-all duration-300 flex items-center gap-2.5 text-xs font-semibold pointer-events-none ${
        toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="w-4 h-4 text-emerald-500 shrink-0">
        <CheckCircle className="w-4 h-4" />
      </div>
      <span>{toast.message}</span>
    </div>
  );
}