import React, { useRef, useState } from 'react';
import { FileUp, Upload } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useUploadDocument } from '@/hooks/useOnboarding';
import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  MAX_DOCUMENT_FILE_SIZE,
  probeFileMagicBytes,
} from '@/schemas/onboardingSchema';
import { DocumentCategory, DocumentResponse } from '@/types';
import { isApiError } from '@/services/api';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingReplacingDoc?: DocumentResponse | null;
}

const CATEGORY_OPTIONS: { value: DocumentCategory; label: string }[] = [
  {
    value: 'INSTITUTION_REGISTRATION_PROOF',
    label: 'Institution Registration Proof (Mandatory)',
  },
  {
    value: 'AUTHORIZED_SIGNATORY_ID',
    label: 'Authorized Signatory ID (Mandatory)',
  },
  {
    value: 'UNIVERSITY_AFFILIATION_CERTIFICATE',
    label: 'University Affiliation Certificate (Mandatory)',
  },
  {
    value: 'ADDITIONAL_SUPPORTING_DOCUMENT',
    label: 'Additional Supporting Document',
  },
];

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  existingReplacingDoc,
}) => {
  const { mutate: uploadDocument, isPending } = useUploadDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState<DocumentCategory>(
    existingReplacingDoc?.documentCategory || 'INSTITUTION_REGISTRATION_PROOF'
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const isReplacing = Boolean(existingReplacingDoc);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    setServerError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    // 1. Check file size (10 MB)
    if (file.size > MAX_DOCUMENT_FILE_SIZE) {
      setValidationError(
        `File exceeds maximum allowed size of 10 MB (${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)} MB).`
      );
      setSelectedFile(null);
      return;
    }

    // 2. Check extension
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(extension)) {
      setValidationError(
        `Invalid file extension "${extension}". Allowed: ${ALLOWED_DOCUMENT_EXTENSIONS.join(
          ', '
        )}`
      );
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setServerError(null);

    if (!selectedFile) {
      setValidationError('Please select a file to upload.');
      return;
    }

    // Pre-upload binary magic byte validation
    const magicValid = await probeFileMagicBytes(selectedFile);
    if (!magicValid) {
      setValidationError(
        'File binary header is invalid or corrupted. Please upload a genuine PDF, JPEG, or PNG document.'
      );
      return;
    }

    uploadDocument(
      {
        documentCategory: category,
        file: selectedFile,
        replacesDocumentId: existingReplacingDoc?.id,
      },
      {
        onSuccess: () => {
          setSelectedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          onClose();
        },
        onError: (err: unknown) => {
          if (isApiError(err)) {
            setServerError(
              err.message || 'Failed to upload document. Please try again.'
            );
          } else {
            setServerError('An unexpected error occurred during upload.');
          }
        },
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isReplacing
          ? `Replace Document: ${existingReplacingDoc?.originalFilename}`
          : 'Upload Verification Document'
      }
      description={
        isReplacing
          ? `Uploading a new file will replace document "${existingReplacingDoc?.originalFilename}". The previous version remains archived in the revision lineage.`
          : 'Upload institutional credentials for Super Admin review. Supported formats: PDF, JPEG, PNG up to 10MB.'
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {validationError && (
          <Alert variant="error" title="Validation Error">
            {validationError}
          </Alert>
        )}

        {serverError && (
          <Alert variant="error" title="Upload Failed">
            {serverError}
          </Alert>
        )}

        <Select
          label="Document Category"
          required
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={(e) => setCategory(e.target.value as DocumentCategory)}
          disabled={isReplacing || isPending}
          helperText={
            isReplacing
              ? 'Category cannot be modified when replacing an existing document.'
              : undefined
          }
        />

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700 select-none">
            Document File <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:bg-slate-50 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              id="document-upload-file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onChange={handleFileChange}
              disabled={isPending}
              className="hidden"
            />
            <label
              htmlFor="document-upload-file"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <FileUp className="h-8 w-8 text-slate-400" />
              <div className="text-sm text-slate-600">
                <span className="font-semibold text-indigo-600 hover:text-indigo-500">
                  Click to select file
                </span>{' '}
                or drag and drop
              </div>
              <p className="text-xs text-slate-400">
                PDF, JPG, JPEG, or PNG up to 10MB
              </p>
            </label>
          </div>
          {selectedFile && (
            <div className="flex items-center justify-between text-xs bg-slate-100 p-2 rounded text-slate-700">
              <span className="truncate font-medium">{selectedFile.name}</span>
              <span className="font-mono text-slate-500 ml-2">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isPending}
            disabled={!selectedFile}
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            {isReplacing ? 'Replace Document' : 'Upload Document'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
