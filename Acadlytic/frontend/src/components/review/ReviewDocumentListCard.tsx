import React, { useState } from 'react';
import {
  FileText,
  AlertTriangle,
  Lock,
} from 'lucide-react';
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
import {
  DocumentStatusBadge,
} from './DocumentStatusBadge';
import { DocumentPreviewReviewModal } from './DocumentPreviewReviewModal';
import { DocumentReviewDecisionModal } from './DocumentReviewDecisionModal';
import { DocumentReviewHistoryModal } from './DocumentReviewHistoryModal';
import type {
  CollegeApprovalStatus,
  DocumentCategory,
  DocumentResponse,
  DocumentVerificationStatus,
  DocumentVerificationProvenance,
} from '@/types';

export const REVIEW_DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  INSTITUTION_REGISTRATION_PROOF: 'Institution Registration Proof',
  AUTHORIZED_SIGNATORY_ID: 'Authorized Signatory ID',
  UNIVERSITY_AFFILIATION_CERTIFICATE: 'University Affiliation Certificate',
  ADDITIONAL_SUPPORTING_DOCUMENT: 'Additional Supporting Document',
};

export const MANDATORY_DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'UNIVERSITY_AFFILIATION_CERTIFICATE',
  'AUTHORIZED_SIGNATORY_ID',
];

export const VALID_VERIFICATION_STATUSES: readonly (DocumentVerificationStatus | string)[] = [
  'PENDING',
  'ACCEPTED',
  'REJECTED',
];

export const VALID_VERIFICATION_PROVENANCES: readonly (DocumentVerificationProvenance | string)[] = [
  'NOT_REVIEWED',
  'DIRECT_REVIEW',
  'CARRIED_FORWARD',
  'LEGACY_COLLEGE_APPROVAL',
];

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export interface DocumentReadinessAssessment {
  isReadyForApproval: boolean;
  totalDocuments: number;
  acceptedCount: number;
  pendingCount: number;
  rejectedCount: number;
  missingMandatoryCategories: DocumentCategory[];
  hasMandatoryDocuments: boolean;
  hasRejectedDocuments: boolean;
  hasPendingDocuments: boolean;
  hasInvalidDocumentData: boolean;
  blockers: string[];
}

/**
 * Authoritative document readiness assessment for Super Admin College Approval.
 *
 * Rules:
 * 1. Both mandatory categories (UNIVERSITY_AFFILIATION_CERTIFICATE and AUTHORIZED_SIGNATORY_ID) must be present.
 * 2. Every active uploaded document must have verificationStatus === 'ACCEPTED'.
 * 3. Any document with missing/invalid verification data (status, provenance, or version) fails closed.
 * 4. Any pending or rejected document blocks college approval.
 */
export function assessDocumentReadiness(
  documents: DocumentResponse[] = []
): DocumentReadinessAssessment {
  const docs = documents ?? [];
  let acceptedCount = 0;
  let pendingCount = 0;
  let rejectedCount = 0;
  let hasInvalidDocumentData = false;

  const presentCategories = new Set<DocumentCategory>();

  for (const doc of docs) {
    if (doc.documentCategory) {
      presentCategories.add(doc.documentCategory);
    }

    const isValidStatus =
      Boolean(doc.verificationStatus) &&
      VALID_VERIFICATION_STATUSES.includes(doc.verificationStatus as DocumentVerificationStatus);
    const isValidProvenance =
      Boolean(doc.verificationProvenance) &&
      VALID_VERIFICATION_PROVENANCES.includes(
        doc.verificationProvenance as DocumentVerificationProvenance
      );
    const isValidVersion =
      typeof doc.version === 'number' &&
      Number.isSafeInteger(doc.version) &&
      doc.version >= 0;

    if (!isValidStatus || !isValidProvenance || !isValidVersion) {
      hasInvalidDocumentData = true;
    }

    if (doc.verificationStatus === 'ACCEPTED') {
      acceptedCount++;
    } else if (doc.verificationStatus === 'REJECTED') {
      rejectedCount++;
    } else {
      pendingCount++;
    }
  }

  const missingMandatoryCategories = MANDATORY_DOCUMENT_CATEGORIES.filter(
    (cat) => !presentCategories.has(cat)
  );

  const hasMandatoryDocuments = missingMandatoryCategories.length === 0;
  const hasRejectedDocuments = rejectedCount > 0;
  const hasPendingDocuments = pendingCount > 0;

  const blockers: string[] = [];

  if (hasInvalidDocumentData) {
    blockers.push(
      'One or more documents contain invalid or unrecognized verification data.'
    );
  }

  if (missingMandatoryCategories.length > 0) {
    const missingNames = missingMandatoryCategories
      .map((cat) => REVIEW_DOCUMENT_CATEGORY_LABELS[cat] || cat)
      .join(', ');
    blockers.push(`Missing mandatory verification document(s): ${missingNames}.`);
  }

  if (hasRejectedDocuments) {
    blockers.push(
      `${rejectedCount} document(s) have been rejected. Corrections must be requested.`
    );
  }

  if (hasPendingDocuments) {
    blockers.push(`${pendingCount} document(s) are pending verification.`);
  }

  const isReadyForApproval =
    !hasInvalidDocumentData &&
    hasMandatoryDocuments &&
    !hasRejectedDocuments &&
    !hasPendingDocuments &&
    docs.length > 0 &&
    acceptedCount === docs.length;

  return {
    isReadyForApproval,
    totalDocuments: docs.length,
    acceptedCount,
    pendingCount,
    rejectedCount,
    missingMandatoryCategories,
    hasMandatoryDocuments,
    hasRejectedDocuments,
    hasPendingDocuments,
    hasInvalidDocumentData,
    blockers,
  };
}

interface ReviewDocumentListCardProps {
  collegeId?: number | null;
  documents?: DocumentResponse[];
  collegeApprovalStatus?: CollegeApprovalStatus;
  onRefresh?: () => void;
}

export const ReviewDocumentListCard: React.FC<ReviewDocumentListCardProps> = ({
  collegeId,
  documents = [],
  collegeApprovalStatus = 'PENDING',
  onRefresh,
}) => {
  const docs = documents ?? [];
  const isCollegeIdValid = typeof collegeId === 'number' && collegeId > 0;

  // Unified Preview & Review Modal state
  const [selectedDocForReview, setSelectedDocForReview] =
    useState<DocumentResponse | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Fallback modal states
  const [selectedDocForDecision, setSelectedDocForDecision] =
    useState<DocumentResponse | null>(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);

  const [selectedDocForHistory, setSelectedDocForHistory] =
    useState<DocumentResponse | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const handleOpenReviewModal = (doc: DocumentResponse) => {
    setSelectedDocForReview(doc);
    setIsReviewModalOpen(true);
  };

  const handleCloseReviewModal = () => {
    setIsReviewModalOpen(false);
    setSelectedDocForReview(null);
  };

  const handleCloseDecisionModal = () => {
    setIsDecisionModalOpen(false);
    setSelectedDocForDecision(null);
  };

  const handleCloseHistoryModal = () => {
    setIsHistoryModalOpen(false);
    setSelectedDocForHistory(null);
  };

  const isLifecycleFrozen = collegeApprovalStatus !== 'PENDING';

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-sky-600" />
            Active Verification Documents ({docs.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual document verification decisions with audit provenance and version tracking.
          </p>
        </div>
        {isLifecycleFrozen && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <Lock className="h-3.5 w-3.5 text-amber-600" />
            Decisions Frozen ({collegeApprovalStatus})
          </span>
        )}
      </div>

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
                <TableHead>Document</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Checksum & Version</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((doc) => {
                const hasValidVersion =
                  typeof doc.version === 'number' &&
                  Number.isSafeInteger(doc.version) &&
                  doc.version >= 0;

                const hasInvalidStatus =
                  !doc.verificationStatus ||
                  !VALID_VERIFICATION_STATUSES.includes(
                    doc.verificationStatus as DocumentVerificationStatus
                  );

                const hasInvalidProvenance =
                  !doc.verificationProvenance ||
                  !VALID_VERIFICATION_PROVENANCES.includes(
                    doc.verificationProvenance as DocumentVerificationProvenance
                  );

                const hasIntegrityIssue =
                  !hasValidVersion || hasInvalidStatus || hasInvalidProvenance;

                return (
                  <TableRow key={doc.id}>
                    {/* Category Column */}
                    <TableCell className="font-medium text-slate-900 align-top">
                      <div className="space-y-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                          {REVIEW_DOCUMENT_CATEGORY_LABELS[
                            doc.documentCategory
                          ] || doc.documentCategory}
                        </span>

                        {/* Replacement Document Indicator */}
                        {doc.replacesDocumentId != null && (
                          <div>
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded"
                              title={`This document replaces previous document ID #${doc.replacesDocumentId}`}
                            >
                              <AlertTriangle className="h-3 w-3 text-amber-600" />
                              Replacement for #{doc.replacesDocumentId}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Document Details Column */}
                    <TableCell className="text-slate-700 align-top">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-medium text-sm">
                          <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                          <span
                            className="truncate max-w-xs"
                            title={doc.originalFilename}
                          >
                            {doc.originalFilename}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatBytes(doc.fileSizeBytes)}
                        </div>

                        {/* Rejection Reason Callout */}
                        {doc.verificationStatus === 'REJECTED' && doc.rejectionReason && (
                          <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-900">
                            <span className="font-semibold block text-[11px] uppercase tracking-wider text-rose-700 mb-0.5">
                              Rejection Reason:
                            </span>
                            <p className="whitespace-pre-wrap text-rose-800">
                              {doc.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Status Column (Only verification status badge, Direct Review provenance badge removed) */}
                    <TableCell className="align-top">
                      <div className="flex flex-col gap-1.5">
                        <DocumentStatusBadge status={doc.verificationStatus} />
                        {hasIntegrityIssue && (
                          <span className="text-[11px] text-red-600 font-medium">
                            Lockout: Data integrity error
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Checksum & Version Column */}
                    <TableCell className="align-top">
                      <div className="space-y-1 text-xs">
                        <div>
                          {doc.sha256Checksum ? (
                            <code
                              className="font-mono text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded cursor-help border border-slate-200"
                              title={`Full SHA-256 Checksum: ${doc.sha256Checksum}`}
                            >
                              {doc.sha256Checksum.slice(0, 8)}...
                              {doc.sha256Checksum.slice(-6)}
                            </code>
                          ) : (
                            <span className="text-slate-400 text-xs">None</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {hasValidVersion ? (
                            <span>Version #{doc.version}</span>
                          ) : (
                            <span className="text-red-600 font-bold">
                              Version Invalid
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Actions Column (Single Review Button) */}
                    <TableCell className="text-right align-top">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReviewModal(doc)}
                        aria-label={`Review ${doc.originalFilename}`}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 h-8 font-medium text-sky-700 border-sky-300 hover:bg-sky-50"
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Document Review Decision (Reject) Modal */}
      <DocumentReviewDecisionModal
        isOpen={isDecisionModalOpen}
        onClose={handleCloseDecisionModal}
        collegeId={isCollegeIdValid ? (collegeId as number) : 0}
        document={selectedDocForDecision}
        onDecisionSuccess={() => {
          if (onRefresh) onRefresh();
        }}
        onStaleConflict={() => {
          if (onRefresh) onRefresh();
        }}
      />

      {/* Document Review History Audit Modal */}
      <DocumentReviewHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={handleCloseHistoryModal}
        collegeId={isCollegeIdValid ? (collegeId as number) : 0}
        document={selectedDocForHistory}
      />

      {/* Unified Document Preview & Review Modal */}
      <DocumentPreviewReviewModal
        isOpen={isReviewModalOpen}
        onClose={handleCloseReviewModal}
        collegeId={isCollegeIdValid ? (collegeId as number) : 0}
        document={selectedDocForReview}
        collegeApprovalStatus={collegeApprovalStatus}
        onDecisionSuccess={() => {
          if (onRefresh) onRefresh();
        }}
        onStaleConflict={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </Card>
  );
};
