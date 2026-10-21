import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function DeleteEducationModal({
  isOpen,
  record,
  onConfirm,
  onCancel
}) {
  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scaleUp">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-500 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-text-h tracking-tight">
              Delete Education Record?
            </h3>
            <p className="text-xs text-text-light">
              This action requires confirmation.
            </p>
          </div>
        </div>

        <div className="p-4 bg-bg-sec rounded-xl border border-border space-y-2 text-xs leading-relaxed text-text-m">
          <p>
            Are you sure you want to delete the record for{' '}
            <span className="font-bold text-text-h">{record.level}</span> ({record.category})?
          </p>
          <p className="text-text-light">
            This will permanently remove this education qualification and its saved scorecards. Your personal profile, login credentials, and other degrees will remain completely safe.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-text-m hover:text-text-h bg-bg-sec hover:bg-border border border-border transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(record.id)}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/25 transition-all cursor-pointer active:scale-95 flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Confirm & Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
