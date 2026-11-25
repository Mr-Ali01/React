import React, { useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  Globe,
  Layers,
  MapPin,
  Phone,
  XCircle,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DOCUMENT_CATEGORY_LABELS, formatBytes } from '@/components/onboarding/DocumentManagementSection';
import { onboardingService } from '@/services/onboardingService';
import type {
  CollegeApprovalStatus,
  DocumentResponse,
  MyApplicationResponse,
} from '@/types';

interface ApprovedDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: MyApplicationResponse | null;
  isLoading?: boolean;
}

export const ApprovedDossierModal: React.FC<ApprovedDossierModalProps> = ({
  isOpen,
  onClose,
  application,
  isLoading = false,
}) => {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const profile = application?.currentRevision?.profile;
  const college = application?.college;
  const activeDocs = application?.activeDocuments || [];
  const revisionHistory = application?.revisionHistory || [];

  const handleDownload = async (doc: DocumentResponse) => {
    try {
      setDownloadingId(doc.id);
      setDownloadError(null);
      await onboardingService.downloadDocument(doc.id, doc.originalFilename);
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : 'The requested compliance document is no longer available in storage.';
      setDownloadError(msg);
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status: CollegeApprovalStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Approved
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Clock className="h-3 w-3 text-sky-600" />
            Pending
          </span>
        );
      case 'ACTION_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="h-3 w-3 text-amber-600" />
            Action Required
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="h-3 w-3 text-rose-600" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Approved Institutional Registration Dossier"
      description="Read-only audit record of verified registration details, active compliance documents, and historical revision timeline."
      size="xl"
    >
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Download error alert (if any) */}
            {downloadError && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center justify-between">
                <span>{downloadError}</span>
                <button
                  type="button"
                  onClick={() => setDownloadError(null)}
                  className="text-rose-600 hover:text-rose-800 font-bold ml-2"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Section 1: Verified Institutional Profile */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-indigo-600" />
                  Institutional Entity &amp; Affiliation
                </h4>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800">
                  Code: {college?.code || 'N/A'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="font-medium text-slate-500">Legal Entity Name:</span>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {profile?.legalName || college?.name || 'N/A'}
                  </div>
                </div>

                <div>
                  <span className="font-medium text-slate-500">University Affiliation:</span>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {profile?.affiliatedUniversityName || 'N/A'}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <span className="font-medium text-slate-500 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    Campus Address:
                  </span>
                  <div className="text-slate-800 mt-0.5">
                    {[
                      profile?.addressLine1,
                      profile?.addressLine2,
                      profile?.city,
                      profile?.state,
                      profile?.postalCode,
                      profile?.country,
                    ]
                      .filter(Boolean)
                      .join(', ') || 'N/A'}
                  </div>
                </div>

                <div>
                  <span className="font-medium text-slate-500 flex items-center gap-1">
                    <Phone className="h-3 w-3 text-slate-400" />
                    Contact Phone:
                  </span>
                  <div className="text-slate-800 mt-0.5 font-mono">
                    {profile?.contactPhone || 'N/A'}
                  </div>
                </div>

                <div>
                  <span className="font-medium text-slate-500 flex items-center gap-1">
                    <Globe className="h-3 w-3 text-slate-400" />
                    Official Website:
                  </span>
                  <div className="text-slate-800 mt-0.5 truncate">
                    {profile?.websiteUrl ? (
                      <a
                        href={profile.websiteUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-indigo-600 hover:underline"
                      >
                        {profile.websiteUrl}
                      </a>
                    ) : (
                      'Not provided'
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Active Compliance Documents */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileCheck2 className="h-4 w-4 text-indigo-600" />
                  Active Compliance Documents ({activeDocs.length})
                </h4>
                <span className="text-[11px] text-slate-500">
                  Approved under revision v{application?.currentRevision?.versionNumber || 1}
                </span>
              </div>

              {activeDocs.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                  No compliance documents recorded for this revision.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Document Category</TableHead>
                        <TableHead className="text-xs">Original Filename</TableHead>
                        <TableHead className="text-xs">File Size</TableHead>
                        <TableHead className="text-xs text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeDocs.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="text-xs font-medium text-slate-900">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {DOCUMENT_CATEGORY_LABELS[doc.documentCategory] ||
                                doc.documentCategory}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-slate-700 font-mono truncate max-w-[200px]">
                            {doc.originalFilename}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                            {formatBytes(doc.fileSizeBytes)}
                          </TableCell>
                          <TableCell className="text-xs text-right whitespace-nowrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(doc)}
                              disabled={downloadingId === doc.id}
                              className="text-xs py-1 px-2.5 h-auto"
                            >
                              {downloadingId === doc.id ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <span className="flex items-center gap-1 text-indigo-600">
                                  <Download className="h-3 w-3" />
                                  Download
                                </span>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Section 3: Revision History Audit Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-indigo-600" />
                Revision History Timeline ({revisionHistory.length})
              </h4>

              {revisionHistory.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                  No historical revisions recorded.
                </div>
              ) : (
                <div className="space-y-2">
                  {revisionHistory.map((rev) => {
                    const submittedDate = rev.submittedForReviewAt
                      ? new Date(rev.submittedForReviewAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : 'Not submitted';
                    const reviewedDate = rev.reviewedAt
                      ? new Date(rev.reviewedAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : null;

                    return (
                      <div
                        key={rev.id}
                        className="p-3 rounded-lg border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            Revision v{rev.versionNumber}
                          </span>
                          {getStatusBadge(rev.status)}
                          {rev.isPermanentRejection && (
                            <span className="text-rose-600 font-semibold px-1.5 py-0.2 rounded bg-rose-50 border border-rose-200">
                              Permanently Rejected
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                          <span>Submitted: {submittedDate}</span>
                          {reviewedDate && <span>Reviewed: {reviewedDate}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <Button variant="outline" onClick={onClose}>
          Close Dossier
        </Button>
      </div>
    </Modal>
  );
};
