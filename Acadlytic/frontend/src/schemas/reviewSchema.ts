import { z } from 'zod';

/**
 * Zod validation schema for Super Admin review decisions.
 * Enforces business rules:
 * - APPROVE: action is APPROVE, notes optional, rejectionReason not required.
 * - REQUEST_ACTION: action is REQUEST_ACTION, notes REQUIRED (min 10 chars, max 2000), rejectionReason not required.
 * - REJECT: action is REJECT, rejectionReason REQUIRED (min 10 chars, max 1000), notes optional.
 * - expectedVersion: integer >= 0 matching current concurrencyVersion.
 */
export const reviewDecisionSchema = z
  .object({
    action: z.enum(['APPROVE', 'REQUEST_ACTION', 'REJECT'] as const, {
      required_error: 'Decision action is required.',
    }),
    notes: z
      .string()
      .max(2000, 'Review notes cannot exceed 2000 characters.')
      .optional()
      .nullable(),
    rejectionReason: z
      .string()
      .max(1000, 'Rejection reason cannot exceed 1000 characters.')
      .optional()
      .nullable(),
    expectedVersion: z
      .number({ required_error: 'Concurrency version is required.' })
      .int('Concurrency version must be an integer.')
      .min(0, 'Invalid concurrency version.'),
  })
  .superRefine((data, ctx) => {
    if (data.action === 'REQUEST_ACTION') {
      const trimmedNotes = typeof data.notes === 'string' ? data.notes.trim() : '';
      if (trimmedNotes.length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['notes'],
          message: 'Review notes must be at least 10 characters when requesting action.',
        });
      }
    }
    if (data.action === 'REJECT') {
      const trimmedReason =
        typeof data.rejectionReason === 'string'
          ? data.rejectionReason.trim()
          : '';
      if (trimmedReason.length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['rejectionReason'],
          message: 'Rejection reason must be at least 10 characters when rejecting an application.',
        });
      }
    }
  });

export type ReviewDecisionFormValues = z.infer<typeof reviewDecisionSchema>;

/**
 * Filter validation schema for review queue search and date boundaries.
 */
export const reviewQueueFilterSchema = z
  .object({
    search: z
      .string()
      .trim()
      .max(100, 'Search term cannot exceed 100 characters.')
      .optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    sort: z.string().optional(),
    page: z.number().int().min(0).optional(),
    size: z.number().int().min(1).max(100).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.from && data.to) {
      const fromDate = new Date(data.from);
      const toDate = new Date(data.to);
      if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
        if (fromDate > toDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['from'],
            message: 'Start date cannot be after end date.',
          });
        }
      }
    }
  });

export type ReviewQueueFilterFormValues = z.infer<typeof reviewQueueFilterSchema>;

/**
 * Zod validation schema for individual document review decisions (Module 3.6).
 * Enforces business rules:
 * - action: ACCEPT or REJECT.
 * - expectedDocumentVersion: integer >= 0 matching current document version (version 0 is valid!).
 * - notes: optional, max 1000 characters.
 * - rejectionReason: mandatory if REJECT (10-1000 characters); must be empty/null if ACCEPT.
 */
export const documentReviewDecisionSchema = z
  .object({
    action: z.enum(['ACCEPT', 'REJECT'] as const, {
      required_error: 'Review action is required.',
    }),
    expectedDocumentVersion: z
      .number({ required_error: 'Document version is required.' })
      .int('Document version must be an integer.')
      .min(0, 'Invalid document version.'),
    notes: z
      .string()
      .max(1000, 'Review notes cannot exceed 1000 characters.')
      .optional()
      .nullable(),
    rejectionReason: z
      .string()
      .max(1000, 'Rejection reason cannot exceed 1000 characters.')
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.action === 'REJECT') {
      const trimmed =
        typeof data.rejectionReason === 'string'
          ? data.rejectionReason.trim()
          : '';
      if (trimmed.length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['rejectionReason'],
          message:
            'Rejection reason must be at least 10 characters when rejecting a document.',
        });
      }
    }
    if (data.action === 'ACCEPT') {
      const trimmed =
        typeof data.rejectionReason === 'string'
          ? data.rejectionReason.trim()
          : '';
      if (trimmed.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['rejectionReason'],
          message: 'Rejection reason must be empty when accepting a document.',
        });
      }
    }
  });

export type DocumentReviewDecisionFormValues = z.infer<
  typeof documentReviewDecisionSchema
>;
