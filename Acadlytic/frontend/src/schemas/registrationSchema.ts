import { z } from 'zod';

/**
 * Frontend-only form state interface (16 controls).
 * Includes client-side confirmPassword.
 */
export interface RegisterCollegeFormValues {
  legalName: string;
  code: string;
  affiliatedUniversityName: string;
  websiteUrl?: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  password: string;
  confirmPassword: string;
}

/**
 * Backend API Request DTO (Exact 15 contract fields).
 * confirmPassword is strictly excluded.
 */
export interface RegisterCollegeRequest {
  legalName: string;
  code: string;
  affiliatedUniversityName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  websiteUrl?: string | null;
  contactPhone: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  password: string;
}

/**
 * Transforms client form values into the exact 15-field backend payload.
 * - Trims required string fields.
 * - Uppercases college code after trimming.
 * - Lowercases admin email after trimming.
 * - Converts blank/whitespace-only optional fields (addressLine2, websiteUrl) to null.
 * - Preserves password exactly as entered (never trimmed or altered).
 * - Excludes confirmPassword.
 */
export function toRegisterCollegeRequest(
  values: RegisterCollegeFormValues
): RegisterCollegeRequest {
  const { confirmPassword: _confirmPassword, ...rest } = values;

  return {
    ...rest,
    code: rest.code.trim().toUpperCase(),
    legalName: rest.legalName.trim(),
    affiliatedUniversityName: rest.affiliatedUniversityName.trim(),
    addressLine1: rest.addressLine1.trim(),
    addressLine2:
      rest.addressLine2 && rest.addressLine2.trim().length > 0
        ? rest.addressLine2.trim()
        : null,
    city: rest.city.trim(),
    state: rest.state.trim(),
    country: rest.country.trim(),
    postalCode: rest.postalCode.trim(),
    websiteUrl:
      rest.websiteUrl && rest.websiteUrl.trim().length > 0
        ? rest.websiteUrl.trim()
        : null,
    contactPhone: rest.contactPhone.trim(),
    adminFirstName: rest.adminFirstName.trim(),
    adminLastName: rest.adminLastName.trim(),
    adminEmail: rest.adminEmail.trim().toLowerCase(),
    password: rest.password,
  };
}

/**
 * Zod validation schema for the 16-control college registration form.
 * Ensures trimming before length evaluation so whitespace-only entries fail validation.
 */
export const registerCollegeSchema = z
  .object({
    // Section 1: Institution Details
    legalName: z
      .string()
      .trim()
      .min(1, 'College legal name is required')
      .max(255, 'College legal name must not exceed 255 characters'),
    code: z
      .string()
      .trim()
      .min(2, 'College code must be between 2 and 50 characters')
      .max(50, 'College code must be between 2 and 50 characters')
      .regex(
        /^[A-Za-z0-9_-]+$/,
        'College code must contain only letters, numbers, underscores, and hyphens'
      ),
    affiliatedUniversityName: z
      .string()
      .trim()
      .min(1, 'Affiliated university name is required')
      .max(255, 'Affiliated university name must not exceed 255 characters'),
    websiteUrl: z
      .string()
      .trim()
      .max(255, 'Website URL must not exceed 255 characters')
      .optional()
      .or(z.literal('')),
    contactPhone: z
      .string()
      .trim()
      .min(1, 'Contact phone is required')
      .max(50, 'Contact phone must not exceed 50 characters'),

    // Section 2: Campus Address & Location
    addressLine1: z
      .string()
      .trim()
      .min(1, 'Address line 1 is required')
      .max(255, 'Address line 1 must not exceed 255 characters'),
    addressLine2: z
      .string()
      .trim()
      .max(255, 'Address line 2 must not exceed 255 characters')
      .optional()
      .or(z.literal('')),
    city: z
      .string()
      .trim()
      .min(1, 'City is required')
      .max(100, 'City must not exceed 100 characters'),
    state: z
      .string()
      .trim()
      .min(1, 'State is required')
      .max(100, 'State must not exceed 100 characters'),
    country: z
      .string()
      .trim()
      .min(1, 'Country is required')
      .max(100, 'Country must not exceed 100 characters'),
    postalCode: z
      .string()
      .trim()
      .min(1, 'Postal code is required')
      .max(30, 'Postal code must not exceed 30 characters'),

    // Section 3: Primary Administrator Account
    adminFirstName: z
      .string()
      .trim()
      .min(1, 'Administrator first name is required')
      .max(100, 'Administrator first name must not exceed 100 characters'),
    adminLastName: z
      .string()
      .trim()
      .min(1, 'Administrator last name is required')
      .max(100, 'Administrator last name must not exceed 100 characters'),
    adminEmail: z
      .string()
      .trim()
      .min(1, 'Administrator email is required')
      .email('A valid administrator email address is required')
      .max(255, 'Administrator email must not exceed 255 characters'),
    password: z
      .string()
      .min(12, 'Password must be between 12 and 128 characters')
      .max(128, 'Password must be between 12 and 128 characters'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),
  })
  .refine(
    (data) => {
      if (!data.adminEmail || data.adminEmail.trim().length < 3) return true;
      const normalizedEmail = data.adminEmail.trim().toLowerCase();
      const normalizedPassword = data.password.toLowerCase();
      return !normalizedPassword.includes(normalizedEmail);
    },
    {
      message: 'Password must not contain your email address',
      path: ['password'],
    }
  )
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
