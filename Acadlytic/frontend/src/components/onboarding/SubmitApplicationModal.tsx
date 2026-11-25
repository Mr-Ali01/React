import React from 'react';
import { CheckCircle2, Lock, Send } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { OnboardingChecklistResponse } from '@/types';

interface SubmitApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  versionNumber: number;
  checklist: OnboardingChecklistResponse;
}

export const SubmitApplicationModal: React.FC<SubmitApplicationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  versionNumber,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Submit Application for Review (v${versionNumber})`}
      size="md"
    >
      <div className="space-y-4">
        {/* Warning Callout */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start gap-3 text-amber-900 text-sm">
          <Lock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold">Irrevocable Submission & Review Lock</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              Once submitted, your application and uploaded documents will be
              <strong> locked and frozen</strong>. You will not be able to edit profile details, upload new documents, or delete files until the Super Admin team completes their review.
            </p>
          </div>
        </div>

        {/* Verification Requirements Check */}
        <div className="space-y-2 bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-xs text-slate-700">
          <p className="font-semibold text-slate-900 uppercase tracking-wider text-[11px]">
            Requirements Verified:
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Administrator email verified</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Institutional profile complete</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Mandatory verification documents uploaded</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Are you sure you want to proceed and submit Revision v{versionNumber} for official verification?
        </p>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onSubmit}
            isLoading={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Confirm & Submit
          </Button>
        </div>
      </div>
    </Modal>
  );
};
