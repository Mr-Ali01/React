import { z } from 'zod';

/**
 * Validation schema for email verification tokens.
 * Backend requires 20 to 255 characters and non-blank input.
 */
export const verifyEmailSchema = z.object({
  token: z
    .string({ required_error: 'Verification token is required' })
    .trim()
    .min(20, 'Verification token must be at least 20 characters')
    .max(255, 'Verification token must not exceed 255 characters'),
});

export type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>;
