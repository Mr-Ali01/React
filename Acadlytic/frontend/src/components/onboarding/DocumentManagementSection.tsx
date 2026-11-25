import React, { useState } from 'react';
import {
  Download,
  FileCheck2,
  FileText,
  Lock,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { DocumentCategory, DocumentResponse } from '@/types';
import { onboardingService } from '@/services/onboardingService';

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  INSTITUTION_REGISTRATION_PROOF: 'Institution Registration Proof',
  AUTHORIZED_SIGNATORY_ID: 'Authorized Signatory ID',
  UNIVERSITY_AFFILIATION_CERTIFICATE: 'University Affiliation Certificate',
  ADDITIONAL_SUPPORTING_DOCUMENT: 'Additional Supporting Document',
};

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

interface DocumentManagementSectionProps {
  documents: DocumentResponse[];
  isEditable: boolean;
  isEmailVerified: boolean;
  onUploadClick: () => void;
  onReplaceClick: (doc: DocumentResponse) => void;
  onDeleteClick: (doc: DocumentResponse) => void;
  isDeletingId?: number | null;
}

export const DocumentManagementSection: React.FC<
  DocumentManagementSectionProps
> = ({
  documents,
  isEditable,
  isEmailVerified,
  onUploadClick,
  onReplaceClick,
  onDeleteClick,
  isDeletingId,
}) => {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const activeCount = documents.length;
  const isLimitReached = activeCount >= 5;

  const handleDownload = async (doc: DocumentResponse) => {
    try {
      setDownloadingId(doc.id);
      await onboardingService.downloadDocument(doc.id, doc.originalFilename);
    } catch {
      // Handled in download service or toast
    } finally {
      setDownloadingId(null);
    }
  };

  const canUpload = isEditable && isEmailVerified && !isLimitReached;

  return (
    <Card className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-semibold text-slate-900">
              Verification Documents
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {`${activeCount} / 5 Active`}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mandatory documents include Registration Proof, Authorized Signatory ID, and University Affiliation. Maximum 5 active documents per revision.
          </p>
        </div>

        <div>
          <Button
            variant="primary"
            size="sm"
            onClick={onUploadClick}
            disabled={!canUpload}
            className="text-xs"
            title={
              !isEmailVerified
                ? 'Email verification required before uploading documents'
                : !isEditable
                ? 'Document modifications locked while application is under review'
                : isLimitReached
                ? 'Maximum of 5 active documents reached'
                : undefined
            }
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Unverified Email Warning */}
      {!isEmailVerified && (
        <div className="text-xs bg-amber-50 text-amber-900 border border-amber-200 p-2.5 rounded-lg flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-600 shrink-0" />
          <span>
            Document upload and management is locked until you verify your administrator email address.
          </span>
        </div>
      )}

      {/* Document Limit Notice */}
      {isLimitReached && isEditable && (
        <div className="text-xs bg-slate-50 text-slate-600 border border-slate-200 p-2.5 rounded-lg">
          You have reached the maximum allowed limit of 5 active documents. To upload a different file, either delete an unneeded document or use the Replace option.
        </div>
      )}

      {/* Documents Table */}
      {documents.length === 0 ? (
        <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl space-y-3">
          <FileText className="h-10 w-10 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-700">
              No verification documents uploaded yet
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Please upload required institutional credentials (.pdf, .jpg, .png up to 10MB each) to proceed with your onboarding review.
            </p>
          </div>
          {canUpload && (
            <Button
              variant="outline"
              size="sm"
              onClick={onUploadClick}
              className="text-xs mt-2"
            >
              <Upload className="h-3.5 w-3.5 mr-1" />
              Upload First Document
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded At</TableHead>
                <TableHead>Lineage / Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => {
                const isMandatory =
                  doc.documentCategory !== 'ADDITIONAL_SUPPORTING_DOCUMENT';
                const formattedDate = new Date(doc.createdAt).toLocaleDateString(
                  undefined,
                  {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  }
                );

                return (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                            isMandatory
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {DOCUMENT_CATEGORY_LABELS[doc.documentCategory] || doc.documentCategory}
                        </span>
                        {isMandatory && (
                          <span className="block text-[10px] text-indigo-600 font-semibold uppercase tracking-wider">
                            Mandatory
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="max-w-[200px] sm:max-w-xs truncate font-medium text-slate-900 text-sm" title={doc.originalFilename}>
                        {doc.originalFilename}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-slate-500 font-mono">
                      {formatBytes(doc.fileSizeBytes)}
                    </TableCell>

                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                      {formattedDate}
                    </TableCell>

                    <TableCell className="text-xs">
                      {doc.replacesDocumentId ? (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200"
                          title={`Replaced predecessor document ID: ${doc.replacesDocumentId}`}
                        >
                          <RefreshCw className="h-3 w-3" />
                          Replaces doc #{doc.replacesDocumentId}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Active</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                          disabled={downloadingId === doc.id}
                          className="h-8 px-2 text-xs"
                          title="Download document"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>

                        {isEditable && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onReplaceClick(doc)}
                              className="h-8 px-2 text-xs"
                              title="Replace document with an updated version"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDeleteClick(doc)}
                              disabled={isDeletingId === doc.id}
                              className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-slate-200"
                              title="Delete document"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
};
