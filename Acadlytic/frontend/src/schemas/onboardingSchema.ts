import { z } from 'zod';

// Maximum upload file size: 10 MB (10,485,760 bytes)
export const MAX_DOCUMENT_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file extensions
export const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

// Allowed MIME types
export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];

/**
 * Zod schema for editing unsubmitted draft profile fields via PUT /my-application.
 * Matches backend validation rules in UpdateApplicationRequest.java.
 */
export const updateApplicationSchema = z.object({
  legalName: z
    .string({ required_error: 'Legal name is required.' })
    .trim()
    .min(1, 'Legal name is required.')
    .max(255, 'Legal name must not exceed 255 characters.'),

  addressLine1: z
    .string({ required_error: 'Address line 1 is required.' })
    .trim()
    .min(1, 'Address line 1 is required.')
    .max(255, 'Address line 1 must not exceed 255 characters.'),

  addressLine2: z
    .string()
    .trim()
    .max(255, 'Address line 2 must not exceed 255 characters.')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),

  city: z
    .string({ required_error: 'City is required.' })
    .trim()
    .min(1, 'City is required.')
    .max(100, 'City must not exceed 100 characters.'),

  state: z
    .string({ required_error: 'State is required.' })
    .trim()
    .min(1, 'State is required.')
    .max(100, 'State must not exceed 100 characters.'),

  country: z
    .string({ required_error: 'Country is required.' })
    .trim()
    .min(1, 'Country is required.')
    .max(100, 'Country must not exceed 100 characters.'),

  postalCode: z
    .string({ required_error: 'Postal code is required.' })
    .trim()
    .min(1, 'Postal code is required.')
    .max(30, 'Postal code must not exceed 30 characters.'),

  websiteUrl: z
    .string()
    .trim()
    .max(255, 'Website URL must not exceed 255 characters.')
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val || val.length === 0) return true;
        try {
          const parsed = new URL(val);
          return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
          return false;
        }
      },
      { message: 'Please enter a valid URL (e.g. https://college.edu).' }
    )
    .transform((val) => (val && val.length > 0 ? val : null)),

  contactPhone: z
    .string({ required_error: 'Contact phone is required.' })
    .trim()
    .min(1, 'Contact phone is required.')
    .max(50, 'Contact phone must not exceed 50 characters.'),

  affiliatedUniversityName: z
    .string({ required_error: 'Affiliated university name is required.' })
    .trim()
    .min(1, 'Affiliated university name is required.')
    .max(255, 'Affiliated university name must not exceed 255 characters.'),
});

export type UpdateApplicationFormValues = z.infer<typeof updateApplicationSchema>;

/**
 * Zod schema for client-side pre-validation of verification document uploads.
 */
export const documentUploadSchema = z.object({
  documentCategory: z.enum([
    'UNIVERSITY_AFFILIATION_CERTIFICATE',
    'AUTHORIZED_SIGNATORY_ID',
    'INSTITUTION_REGISTRATION_PROOF',
    'ADDITIONAL_SUPPORTING_DOCUMENT',
  ] as const, {
    required_error: 'Please select a document category.',
  }),

  file: z
    .custom<File>((val) => typeof File !== 'undefined' && val instanceof File, {
      message: 'A document file is required.',
    })
    .refine((file) => file.size > 0, {
      message: 'Document file cannot be empty.',
    })
    .refine((file) => file.size <= MAX_DOCUMENT_FILE_SIZE, {
      message: 'File size must not exceed 10 MB.',
    })
    .refine(
      (file) => {
        const lowerName = file.name.toLowerCase();
        return ALLOWED_DOCUMENT_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
      },
      {
        message: 'Invalid file format. Only PDF, JPEG, and PNG files are accepted.',
      }
    ),

  replacesDocumentId: z.number().nullable().optional(),
});

export type DocumentUploadFormValues = z.infer<typeof documentUploadSchema>;

/**
 * Client-side magic byte probe helper.
 * Reads initial bytes to provide immediate user guidance before uploading.
 * Note: Purely UX enhancement; backend DocumentValidator remains authoritative security boundary.
 */
export async function probeFileMagicBytes(file: File): Promise<boolean> {
  try {
    const slice = file.slice(0, 8);
    const arrayBuffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    if (bytes.length < 3) return false;

    // PDF: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
    if (
      bytes.length >= 5 &&
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46 &&
      bytes[4] === 0x2d
    ) {
      return true;
    }

    // JPEG: 0xFF, 0xD8, 0xFF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return true;
    }

    // PNG: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
    if (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
