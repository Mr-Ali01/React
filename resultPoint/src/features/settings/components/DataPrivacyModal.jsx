import React from 'react';
import { X, ShieldCheck, Database, Lock, EyeOff, CheckCircle2 } from 'lucide-react';

export default function DataPrivacyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/25 flex items-center justify-center text-[#FF6B00]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-h">Data Privacy Policy</h3>
              <p className="text-xs text-text-light">How your academic and personal information is managed.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-bg-sec hover:bg-border text-text-light hover:text-text-h flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs text-text-m leading-relaxed">
          <div className="p-4 rounded-xl bg-bg-sec border border-border space-y-2.5">
            <h4 className="text-xs font-bold text-text-h flex items-center gap-2">
              <Database className="w-4 h-4 text-[#FF6B00]" />
              <span>1. Client-First Isolated Storage</span>
            </h4>
            <p className="text-text-light">
              ResultPoint stores student academic records, calculation history, and goals in authenticated browser storage isolated by your student email. Data is never shared across student accounts.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-bg-sec border border-border space-y-2.5">
            <h4 className="text-xs font-bold text-text-h flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-500" />
              <span>2. No External Third-Party Tracking</span>
            </h4>
            <p className="text-text-light">
              We do not track your activity using external analytics pixels or sell academic performance history to third-party advertisers or recruitment agencies.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-bg-sec border border-border space-y-2.5">
            <h4 className="text-xs font-bold text-text-h flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-[#38BDF8]" />
              <span>3. Full Data Portability & Deletion</span>
            </h4>
            <p className="text-text-light">
              You maintain complete ownership of your academic records. You can download an offline JSON backup anytime via the <strong>Export My Data</strong> feature or clear your data at will.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#FF6B00] hover:bg-[#E05D00] transition-colors cursor-pointer shadow-md shadow-[#FF6B00]/20"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
