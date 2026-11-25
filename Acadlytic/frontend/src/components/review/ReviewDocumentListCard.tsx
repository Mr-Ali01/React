import React, { useState } from 'react';
import { Download, FileText, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { useDownloadReviewDocument } from '@/hooks/useCollegeReview';
import type { DocumentCategory, DocumentResponse } from '@/types';

export const REVIEW_DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
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

interface ReviewDocumentListCardProps {
  collegeId: number;
  documents?: DocumentResponse[];
}

export const ReviewDocumentListCard: React.FC<ReviewDocumentListCardProps> = ({
  collegeId,
  documents = [],
}) => {
  const docs = documents ?? [];
  const downloadMutation = useDownloadReviewDocument();
  const [downloadingDocId, setDownloadingDocId] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async (doc: DocumentResponse) => {
    try {
      setDownloadError(null);
      setDownloadingDocId(doc.id);
      await downloadMutation.mutateAsync({
        collegeId,
        documentId: doc.id,
        filename: doc.originalFilename,
      });
    } catch {
      setDownloadError(`Failed to download ${doc.originalFilename}. Please try again.`);
    } finally {
      setDownloadingDocId(null);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
        <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <FileText className="h-5 w-5 text-sky-600" />
          Active Verification Documents ({docs.length})
        </h3>
        <span className="text-xs text-slate-500 font-medium">
          Secure Streamed Verification
        </span>
      </div>

      {downloadError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
          <ShieldAlert className="h-4 w-4 text-red-600 flex-shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      {docs.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          No verification documents currently attached to this revision.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Filename</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>SHA-256 Checksum</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium text-slate-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                      {REVIEW_DOCUMENT_CATEGORY_LABELS[doc.documentCategory] ||
                        doc.documentCategory}
                    </span>
                  </TableCell>

                  <TableCell className="text-slate-700">
                    <div className="flex items-center gap-1.5 font-medium text-sm">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <span className="truncate max-w-xs" title={doc.originalFilename}>
                        {doc.originalFilename}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-slate-500 text-xs">
                    {formatBytes(doc.fileSizeBytes)}
                  </TableCell>

                  <TableCell>
                    {doc.sha256Checksum ? (
                      <code
                        className="font-mono text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded cursor-help border border-slate-200"
                        title={`Full SHA-256 Checksum: ${doc.sha256Checksum}`}
                      >
                        {doc.sha256Checksum.slice(0, 8)}...{doc.sha256Checksum.slice(-6)}
                      </code>
                    ) : (
                      <span className="text-slate-400 text-xs">None</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      disabled={downloadingDocId === doc.id}
                      className="inline-flex items-center gap-1 text-xs"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {downloadingDocId === doc.id ? 'Downloading...' : 'Download'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
};
