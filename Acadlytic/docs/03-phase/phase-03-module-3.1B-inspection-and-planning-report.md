# Acadlytic — Phase 03, Module 3.1B Inspection and Planning Report
## Public College Registration Portal (Frontend)

**Document Reference:** `docs/03-phase/phase-03-module-3.1B-inspection-and-planning-report.md`  
**Target Module:** Phase 03, Module 3.1B — Public College Registration Portal (Frontend)  
**Authoritative Context Reference:** `docs/00-project-overview/ACADLYTIC_MASTER_CONTEXT.md`  
**Execution Mode:** Strict Read-Only Inspection & Planning Revision  
**Planning Version:** v1.1 (Consolidated Reconciliation)  
**Timestamp:** 2026-11-24T19:55:00+05:30  
**Status:** `DRAFT / PENDING USER APPROVAL`  

---

## 1. Executive Summary & Objective

With the completion and formal user approval of all Phase 03 backend modules (**Module 3.1A**, **Module 3.2**, **Module 3.3**, **Module 3.4**, and **Module 3.5**) and 237/237 passing tests against Testcontainers MySQL 8.0.36, the project progresses to the frontend implementation phase.

In accordance with the approved Phase 03 execution strategy:
> *"Complete all Phase 03 backend modules first. Then implement the Phase 03 frontend module-by-module. After that, perform end-to-end verification."*

The initial frontend target is **Module 3.1B — Public College Registration Portal**.

### 1.1 Objective of Module 3.1B
Module 3.1B delivers the public-facing self-service onboarding portal that allows prospective educational institutions to submit their initial registration application and nominate their initial primary College Administrator.

The portal provides:
1. A structured, accessible, and responsive self-registration interface mounted at `/auth/register-college`.
2. Institutional detail collection: College Legal Name, unique College Code, Affiliated University Name, Website URL (optional), and Contact Phone.
3. Campus location collection: Address Line 1, Address Line 2 (optional), City, State, Country, and Postal / PIN Code.
4. Proposed College Administrator account details: Administrator First Name, Last Name, Official Email Address, and secure Password with client-side Confirmation Password.
5. Strict client-side validation mirroring backend `@Valid` constraints and `PasswordPolicyValidator` rules using Zod and React Hook Form.
6. Clean separation between the 16-control frontend form type and the 15-field backend `RegisterCollegeRequest` payload (ensuring `confirmPassword` is never sent over the wire).
7. Seamless CSRF token synchronization via `apiClient` (`X-XSRF-TOKEN` cookie/header handshake with Spring Security).
8. Accurate rate-limiting error handling that extracts and respects the HTTP `Retry-After` response header without inventing or hardcoding timeout durations.
9. Comprehensive error handling covering field validation failures (400), password policy violations (400), duplicate college code conflict (409), duplicate administrator email conflict (409), rate limiting (429), and network failures.
10. Clear post-registration confirmation view (`RegistrationSuccessView`) presenting registration metadata, accurate instructions to check both inbox and spam folders for the dispatched email, preservation of the backend-defined **48-hour email verification requirement**, and an explicit roadmap of the subsequent onboarding stages (verification $\to$ restricted dashboard document upload $\to$ Super Admin review $\to$ operational activation).

---

## 2. Source-Verified Backend Contracts & Architectural Alignment

A strict, read-only inspection of the backend source code (`RegisterCollegeRequest.java`, `CollegeRegistrationResponse.java`, `CollegeRegistrationController.java`, `CollegeRegistrationService.java`, `PasswordPolicyValidator.java`, `IpRateLimiter.java`, and `GlobalExceptionHandler.java`) establishes the exact contracts governing Module 3.1B.

### 2.1 Endpoint Specification
- **Method & Path:** `POST /api/v1/college-registrations`
- **Authentication:** Publicly accessible (configured as `permitAll()` in Spring Security).
- **CSRF Protection:** Enforced. Requires valid `X-XSRF-TOKEN` request header matching the session cookie.
- **Rate Limiting:** Sliding-window rate limiter (`IpRateLimiter`) enforcing 5 requests per rolling 3600-second window per client IP address.

### 2.2 Request DTO Contract (`RegisterCollegeRequest` — 15 Fields)
The backend DTO is a Java record with exactly 15 properties. All field validation annotations run prior to service-layer execution:

| Field | Java Type | Validation Annotations | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `legalName` | `String` | `@NotBlank`, `@Size(max = 255)` | Full registered institutional name. Leading/trailing whitespace trimmed. |
| `code` | `String` | `@NotBlank`, `@Size(min = 2, max = 50)`, `@Pattern(regexp = "^[A-Za-z0-9_-]+$")` | Unique institutional slug. Letters, numbers, hyphens, and underscores only. Backend service normalizes to uppercase. |
| `affiliatedUniversityName` | `String` | `@NotBlank`, `@Size(max = 255)` | Governing university name. |
| `addressLine1` | `String` | `@NotBlank`, `@Size(max = 255)` | Street address / campus location. |
| `addressLine2` | `String` | `@Size(max = 255)` | Optional address extension. Backend converts blank/empty to `null`. |
| `city` | `String` | `@NotBlank`, `@Size(max = 100)` | Municipality / city name. |
| `state` | `String` | `@NotBlank`, `@Size(max = 100)` | State / province. |
| `country` | `String` | `@NotBlank`, `@Size(max = 100)` | Country name. |
| `postalCode` | `String` | `@NotBlank`, `@Size(max = 30)` | Postal / ZIP / PIN code. |
| `websiteUrl` | `String` | `@Size(max = 255)` | Optional institutional web address. No `@URL` annotation enforced by backend. Backend converts blank/empty to `null`. |
| `contactPhone` | `String` | `@NotBlank`, `@Size(max = 50)` | Primary institutional telephone number. |
| `adminFirstName` | `String` | `@NotBlank`, `@Size(max = 100)` | Proposed administrator first name. |
| `adminLastName` | `String` | `@NotBlank`, `@Size(max = 100)` | Proposed administrator last name. |
| `adminEmail` | `String` | `@NotBlank`, `@Email`, `@Size(max = 255)` | Proposed administrator official email. Normalized to lowercase. |
| `password` | `String` | `@NotBlank` | Raw password. Validated by `PasswordPolicyValidator` and hashed with BCrypt. |

> [!IMPORTANT]
> Notice that `RegisterCollegeRequest` does **not** contain `confirmPassword`. The confirmation password is a frontend-only validation construct. Furthermore, `websiteUrl` does not have a `@URL` annotation on the backend; it only enforces `@Size(max = 255)`.

### 2.3 Password Policy Reconciliation (`PasswordPolicyValidator.java`)
Source code inspection of `PasswordPolicyValidator.java` reveals the exact rules enforced by the backend:
1. **Length Boundaries:** Must be between 12 and 128 characters (`MIN_LENGTH = 12`, `MAX_LENGTH = 128`).
2. **Character Classes:** **None enforced.** The backend does **not** mandate uppercase, lowercase, numbers, or special symbols. (Passphrases and arbitrary characters within the length limits are accepted).
3. **Email Containment:** Strictly forbidden. The validator lowercases both the password and the email; if the password equals or contains the email address (`normalized.contains(normalizedEmail)`), it throws `PASSWORD_POLICY_VIOLATION` with *"Password must not contain your email address."*
4. **Common / Breached Password Denylist:** Strictly enforced by checking the lowercased password against `security/common-passwords.txt`. If matched, it throws `PASSWORD_POLICY_VIOLATION` with *"This password is too common or has appeared in known breaches. Please choose a stronger password."*

> [!NOTE]
> The frontend Zod schema and `PasswordStrengthMeter` must reflect these exact structural rules. The frontend must **not** arbitrarily block submission if a password lacks uppercase or numbers (which would reject valid passphrases acceptable to the backend). The frontend must **not** attempt to download or bundle the common password denylist; denylist rejection is handled via backend error response.

### 2.4 Success Response Structure (`CollegeRegistrationResponse`)
Upon successful intake, the backend returns HTTP `201 Created` with `ApiResponse<CollegeRegistrationResponse>`:
```json
{
  "success": true,
  "message": "College registration initiated successfully",
  "data": {
    "collegeId": 101,
    "registrationId": 201,
    "versionNumber": 1,
    "collegeName": "Horizon Institute of Technology",
    "collegeCode": "HORIZON-TECH",
    "status": "PENDING",
    "adminEmail": "admin@horizon.edu",
    "submittedForReview": false,
    "message": null
  },
  "timestamp": "2026-11-24T19:55:00.000Z"
}
```

### 2.5 Session & Authentication Semantics
- **No Authenticated Session Created:** The public registration endpoint returns JSON only. It does **not** create an HTTP session, does **not** issue the `ACADLYTIC_SID` cookie, and does **not** log the user in.
- **Unverified Status:** The initial `User` is persisted with `status = ACTIVE` but `emailVerifiedAt = null`.
- **Login Blocked:** If the user immediately attempts to sign in via `/auth/login`, `AuthService.login()` validates that `emailVerifiedAt` is populated. The user is strictly prevented from logging into the platform until email verification is completed.
- **Token Generation:** A single-use 48-hour email verification token (`EMAIL_VERIFICATION_TTL = Duration.ofHours(48)`) is generated and an outbox email is enqueued.

### 2.6 Error Responses & HTTP Status Matrix
All error responses adhere to the standard `ApiResponse` envelope:

| Status Code | Error Code (`errorCode`) | Trigger Condition | Response Body / Headers |
| :--- | :--- | :--- | :--- |
| `400 Bad Request` | `VALIDATION_ERROR` | Bean validation failure (`@Valid`) on request fields. | Contains `errors: Map<String, String>` mapping invalid fields to messages. |
| `400 Bad Request` | `PASSWORD_POLICY_VIOLATION` | Password $< 12$ or $> 128$ chars, contains email, or matches breach denylist. | `message`: Detailed failure explanation. |
| `400 Bad Request` | `MALFORMED_REQUEST` | Unparseable or malformed JSON payload. | `message`: "Malformed request payload." |
| `403 Forbidden` | `CSRF_TOKEN_INVALID` | Missing or invalid `X-XSRF-TOKEN` header. | Triggers automatic single-retry via `apiClient`. |
| `409 Conflict` | `COLLEGE_CODE_ALREADY_EXISTS` | Active college with this code already exists. | `message`: "An active college with this college code already exists." |
| `409 Conflict` | `EMAIL_ALREADY_EXISTS` | Active user account with this email already exists. | `message`: "An active account with this email address already exists." |
| `429 Too Many Requests` | `RATE_LIMIT_EXCEEDED` | Exceeded 5 registration requests in 3600s rolling window. | Header: `Retry-After: <seconds>`<br>`message`: "Too many registration requests from this IP address. Please try again later." |

---

## 3. Rate-Limit Handling & `Retry-After` Header Extraction

Inspection of `IpRateLimiter.java` and `GlobalExceptionHandler.java` confirms the exact rate-limiting behavior:
```java
// IpRateLimiter.java
long secondsUntilExpiry = Duration.between(windowStart, oldestAttempt).getSeconds();
long retryAfter = Math.max(1, secondsUntilExpiry);
throw new RateLimitExceededException("Too many registration requests from this IP address...", retryAfter);

// GlobalExceptionHandler.java
return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
        .header(HttpHeaders.RETRY_AFTER, String.valueOf(ex.getRetryAfterSeconds()))
        .body(ApiResponse.errorWithCode(ex.getErrorCode(), ex.getMessage()));
```

### 3.1 Frontend Extraction Logic
The Axios error interceptor or the registration mutation catch-block extracts the header using case-insensitive header lookup:
```ts
function extractRetryAfterSeconds(error: unknown): number | null {
  if (axios.isAxiosError(error) && error.response?.headers) {
    const rawHeader =
      error.response.headers['retry-after'] ||
      (typeof error.response.headers.get === 'function'
        ? error.response.headers.get('retry-after')
        : null);

    if (rawHeader) {
      const parsed = parseInt(String(rawHeader), 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }
  return null;
}
```

### 3.2 UI Countdown & Fallback Specifications
- **When `retryAfter` is Present & Valid ($> 0$):**
  - Initialize an active countdown state (`secondsRemaining = retryAfter`).
  - Render an urgent warning alert:  
    `"Rate limit exceeded. You have made too many registration attempts from this IP address. Please wait {formatSeconds(secondsRemaining)} before trying again."`
  - Tick down every 1000ms.
  - Disable the submit button until the timer reaches zero.
- **When `retryAfter` is Absent, Non-Numeric, or $\le 0$:**
  - **Strict Principle:** **Do not invent or hardcode a fake timer (e.g., do NOT assume 3600 seconds or 60 seconds).**
  - Render a persistent rate-limit warning:  
    `"Too many registration requests have been submitted from this IP address. Please wait a while before attempting to register again."`
  - Keep the form submit button disabled or provide a manual "Dismiss" action.

---

## 4. Accurate Success Messaging & Lifecycle Guidance

Merely receiving an HTTP 201 response confirms that the server accepted the application and enqueued the notification in the transactional outbox; **it does not confirm that the email has arrived in the applicant's inbox.**

### 4.1 Success Presentation (`RegistrationSuccessView`)
The confirmation screen must communicate:
1. **Application Received:** Clearly state that the institutional registration for `{collegeName}` (`{collegeCode}`) has been successfully recorded in `PENDING` status.
2. **Verification Email Dispatched:** Inform the applicant that a verification email has been sent to `{adminEmail}`.
3. **Inbox & Spam Folder Advisory:** Explicitly advise the applicant:
   > *"Delivery may take a few minutes depending on your email provider. Please check both your **Inbox** and your **Spam / Junk** folder."*
4. **48-Hour Verification Deadline:** Explicitly communicate the backend-enforced 48-hour expiration:
   > *"For security reasons, your verification link will expire in **48 hours**. Unverified applications that remain incomplete are automatically purged after 7 days."*
5. **Session Clarity:** Explicitly clarify that the applicant is **not yet signed in**.
6. **Onboarding Roadmap (4 Stages):**
   - **Stage 1 (Current):** Email Verification — Click the link received by email.
   - **Stage 2:** Document Submission — Sign in to the Restricted Onboarding Dashboard to upload required institutional accreditation documents.
   - **Stage 3:** Super Admin Review — The Acadlytic platform team reviews submitted credentials.
   - **Stage 4:** Operational Activation — Full access to college academic management.
7. **Call to Action:** Render a primary button `"Proceed to Sign In"` directing to `/auth/login`, accompanied by a clear note: *"Note: You will be able to sign in once your email address is verified."*

---

## 5. Form Inventory & Component Architecture

### 5.1 Form Control Inventory (16 Total Controls)
The frontend form consists of 16 rendered interactive controls: 15 backend contract fields plus 1 frontend-only confirmation field:

```text
Section 1: Institution Details (5 controls)
├── 1. legalName                  (Input, text, required)
├── 2. code                       (Input, text, required, uppercase normalized)
├── 3. affiliatedUniversityName   (Input, text, required)
├── 4. websiteUrl                 (Input, url, optional)
└── 5. contactPhone               (Input, tel, required)

Section 2: Campus Address & Location (6 controls)
├── 6. addressLine1               (Input, text, required)
├── 7. addressLine2               (Input, text, optional)
├── 8. city                       (Input, text, required)
├── 9. state                      (Input, text, required)
├── 10. country                   (Input, text, required)
└── 11. postalCode                (Input, text, required)

Section 3: Primary Administrator Account (5 controls)
├── 12. adminFirstName            (Input, text, required)
├── 13. adminLastName             (Input, text, required)
├── 14. adminEmail                (Input, email, required)
├── 15. password                  (Input, password, required)
└── 16. confirmPassword           (Input, password, required, frontend-only)
```

### 5.2 Responsive Layout Container Expansion (`AuthLayout.tsx`)
`AuthLayout.tsx` currently encloses child outlets in `sm:max-w-md` (448px), tailored for 2-field login screens. A 16-control form in a 448px container forces severe vertical scrolling.

**Approved Layout Adaptation:**
Modify `AuthLayout.tsx` to detect whether the active route is `/auth/register-college`:
- Standard auth pages (`/auth/login`, `/auth/forgot-password`, `/auth/reset-password`): retain `sm:max-w-md`.
- College registration page (`/auth/register-college`): expand container to `sm:max-w-3xl` (768px).
- Internal form grid:
  - Mobile ($< 640\text{px}$): Single column (`grid-cols-1`).
  - Tablet/Desktop ($\ge 640\text{px}$): Two-column pairing (`sm:grid-cols-2`).
  - Full-width span fields: `legalName`, `affiliatedUniversityName`, `addressLine1`, `addressLine2`.
  - Paired fields: `code` + `contactPhone`, `city` + `state`, `country` + `postalCode`, `adminFirstName` + `adminLastName`, `password` + `confirmPassword`.

---

## 6. Zod Validation & Type Separation

### 6.1 Type Separation Architecture
To ensure strict contract isolation, two distinct TypeScript interfaces are defined:

```ts
// 1. Frontend Form Values (16 fields)
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
  confirmPassword: string; // Frontend-only
}

// 2. Backend API Request DTO (Exact 15 contract fields)
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
```

### 6.2 Normalization & Sanitization Pipeline
When transforming form values to the API payload, `toRegisterCollegeRequest()` guarantees:
1. `confirmPassword` is destructured and dropped.
2. `code` is trimmed and converted to uppercase: `values.code.trim().toUpperCase()`.
3. String fields are trimmed: whitespace-only entries cannot bypass validation.
4. Optional fields (`addressLine2`, `websiteUrl`) are trimmed; if empty or whitespace-only, they serialize as `null`.
5. `adminEmail` is trimmed and lowercased.
6. `password` is transmitted as-is (never trimmed, preserving user-intended passphrase spacing).

```ts
export function toRegisterCollegeRequest(
  values: RegisterCollegeFormValues
): RegisterCollegeRequest {
  const { confirmPassword, ...rest } = values;
  return {
    ...rest,
    code: rest.code.trim().toUpperCase(),
    legalName: rest.legalName.trim(),
    affiliatedUniversityName: rest.affiliatedUniversityName.trim(),
    addressLine1: rest.addressLine1.trim(),
    addressLine2: rest.addressLine2?.trim() || null,
    city: rest.city.trim(),
    state: rest.state.trim(),
    country: rest.country.trim(),
    postalCode: rest.postalCode.trim(),
    websiteUrl: rest.websiteUrl?.trim() || null,
    contactPhone: rest.contactPhone.trim(),
    adminFirstName: rest.adminFirstName.trim(),
    adminLastName: rest.adminLastName.trim(),
    adminEmail: rest.adminEmail.trim().toLowerCase(),
    password: rest.password,
  };
}
```

### 6.3 Zod Validation Schema (`registerCollegeSchema`)
The schema enforces trimmed checks before evaluating `.min(1)` to reject whitespace-only submissions:

```ts
export const registerCollegeSchema = z
  .object({
    // Institution Details
    legalName: z
      .string()
      .trim()
      .min(1, 'College legal name is required')
      .max(255, 'Legal name must not exceed 255 characters'),
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

    // Location Details
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

    // Administrator Details
    adminFirstName: z
      .string()
      .trim()
      .min(1, 'First name is required')
      .max(100, 'First name must not exceed 100 characters'),
    adminLastName: z
      .string()
      .trim()
      .min(1, 'Last name is required')
      .max(100, 'Last name must not exceed 100 characters'),
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
      if (!data.adminEmail || data.adminEmail.length < 3) return true;
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
```

---

## 7. CSRF Synchronization & Error Mapping Matrix

### 7.1 CSRF Handshake Details
Inspection of `src/services/api.ts` reveals that `apiClient` manages CSRF tokens automatically:
1. **Pre-Flight Bootstrap:** For mutating methods (`POST`, `PUT`, `DELETE`), if `document.cookie` does not contain `XSRF-TOKEN`, `apiClient` invokes `GET /api/v1/auth/csrf` to retrieve the cookie before dispatching the primary request.
2. **Header Attachment:** Attaches the `X-XSRF-TOKEN` header on all outgoing state-changing requests.
3. **Transparent Recovery:** If the backend responds with HTTP 403 `CSRF_TOKEN_INVALID`, the Axios response interceptor refreshes the cookie via `/auth/csrf` and retries the original request once (`_csrfRetry = true`).

### 7.2 Backend Error Mapping Matrix
When an error reaches the frontend form controller, it is translated into precise UI feedback:

| HTTP Status | Backend `errorCode` | Target Form Element | UI Presentation & Action |
| :--- | :--- | :--- | :--- |
| `400` | `VALIDATION_ERROR` | Individual fields via `errors: Map<String, String>` | Calls `setError(fieldName, { type: 'server', message })` for each invalid field. |
| `400` | `PASSWORD_POLICY_VIOLATION` | `password` field | Calls `setError('password', { type: 'server', message })`. Renders server denial reason beneath the password input. |
| `409` | `COLLEGE_CODE_ALREADY_EXISTS` | `code` field | Calls `setError('code', { type: 'server', message: 'This college code is already registered.' })`. Displays top banner advising selection of a different code. |
| `409` | `EMAIL_ALREADY_EXISTS` | `adminEmail` field | Calls `setError('adminEmail', { type: 'server', message: 'An account with this email already exists.' })`. Displays banner with a direct link to `/auth/login`. |
| `429` | `RATE_LIMIT_EXCEEDED` | Top banner + submit button | Extracts `Retry-After` header. If present, runs countdown timer. If absent, displays persistent rate limit warning. Disables submit button. |
| `403` | `CSRF_TOKEN_INVALID` | Top banner | Rendered only if automatic interceptor retry failed. Provides `"Refresh Security Token"` action. |
| `500` / Network | `INTERNAL_ERROR` / `ERR_NETWORK` | Top banner | Generic error alert: `"Unable to complete registration. Please check your internet connection or contact support."` |

---

## 8. Vitest Test Strategy & Verification Scenarios

The test suite will be implemented at `frontend/src/test/register-college.test.tsx` using Vitest, `@testing-library/react`, and `@testing-library/user-event`.

### 8.1 Key Verification Scenarios
1. **16-Control Initial Render:**
   - Asserts all 16 inputs render with appropriate labels, placeholders, and required asterisks.
   - Verifies 3 distinct section headers are displayed.
   - Verifies submit button is enabled and not in loading state.
2. **Whitespace-Only Rejection:**
   - Inputs spaces into required fields (`legalName = "   "`).
   - Submits form; asserts `.min(1)` validation error appears and no network request is dispatched.
3. **College Code Format Validation:**
   - Enters invalid code (`"CODE 123!"`).
   - Asserts pattern regex error is displayed.
   - Enters valid lowercase code (`"mit-01"`).
   - Asserts payload serialization transforms it to `"MIT-01"`.
4. **Password Policy Structural Enforcement:**
   - Enters password shorter than 12 characters $\to$ displays 12-char requirement error.
   - Enters password containing the entered administrator email $\to$ displays email containment error.
   - Enters matching passwords with $\ge 12$ characters $\to$ validation succeeds.
5. **Password Confirmation Mismatch:**
   - Enters valid password and mismatched confirmPassword $\to$ displays `"Passwords do not match"` under confirmPassword.
6. **Successful Submission & Success View Transition:**
   - Fills all 16 controls with valid data.
   - Mocks API response: HTTP 201 with `CollegeRegistrationResponse`.
   - Submits form; verifies payload matches exact 15-field contract (verifies `confirmPassword` was NOT sent).
   - Asserts form unmounts and `RegistrationSuccessView` renders.
   - Asserts college name, code, admin email, 48-hour expiration, spam folder notice, and onboarding roadmap are visible.
7. **Duplicate College Code (409 Conflict):**
   - Mocks 409 `COLLEGE_CODE_ALREADY_EXISTS`.
   - Asserts `code` input receives server error and top conflict alert is displayed.
8. **Duplicate Email Conflict (409 Conflict):**
   - Mocks 409 `EMAIL_ALREADY_EXISTS`.
   - Asserts `adminEmail` input receives server error and login suggestion is shown.
9. **Password Breach Denylist Denial (400 Bad Request):**
   - Mocks 400 `PASSWORD_POLICY_VIOLATION` with message: `"This password is too common or has appeared in known breaches. Please choose a stronger password."`
   - Asserts error is attached to the `password` field.
10. **Rate Limit Handling with Valid `Retry-After` Header (429):**
    - Mocks 429 with header `Retry-After: 120`.
    - Asserts submit button is disabled and countdown alert starts at 2 minutes.
11. **Rate Limit Handling with Missing `Retry-After` Header (429):**
    - Mocks 429 without `Retry-After` header.
    - Asserts submit button is disabled and alert displays generic rate limit message without a fabricated countdown.
12. **In-Flight Loading State:**
    - Asserts inputs and submit button are disabled while network request is pending.

---

## 9. Proposed File Inventory & Exact Responsibilities

### 9.1 Files to Create (8 Files)

| File Path | Single Responsibility |
| :--- | :--- |
| `frontend/src/services/collegeRegistrationService.ts` | Axios API call for `POST /api/v1/college-registrations` and form-to-DTO payload serialization (`toRegisterCollegeRequest`). |
| `frontend/src/hooks/useCollegeRegistration.ts` | TanStack Query mutation hook `useRegisterCollege()`, managing loading state, success transition, and `Retry-After` header extraction. |
| `frontend/src/schemas/registrationSchema.ts` | Zod validation schema `registerCollegeSchema`, TypeScript types (`RegisterCollegeFormValues`, `RegisterCollegeRequest`), and normalization helpers. |
| `frontend/src/components/registration/RegistrationForm.tsx` | Form UI component rendering the 16 controls across 3 sections, binding React Hook Form, and displaying field-level/banner errors. |
| `frontend/src/components/registration/RegistrationSectionHeader.tsx` | Reusable presentational banner displaying section step numbers, titles, and descriptions. |
| `frontend/src/components/registration/PasswordStrengthMeter.tsx` | Visual checklist for password length ($\ge 12$), email exclusion, and advisory complexity indicators. |
| `frontend/src/components/registration/RegistrationSuccessView.tsx` | Post-registration confirmation view detailing application metadata, 48-hour email verification requirement, spam notice, and onboarding next steps. |
| `frontend/src/test/register-college.test.tsx` | Comprehensive Vitest suite validating rendering, validation, submission, duplicate conflict errors, rate-limiting headers, and success transition. |

### 9.2 Files to Modify (4 Files)

| File Path | Exact Modification Scope |
| :--- | :--- |
| `frontend/src/pages/auth/RegisterCollegePage.tsx` | Replace existing static placeholder with registration workflow controller toggling between `RegistrationForm` and `RegistrationSuccessView`. |
| `frontend/src/layouts/AuthLayout.tsx` | Provide conditional container width expansion (`sm:max-w-3xl`) when active path is `/auth/register-college` while keeping `sm:max-w-md` for standard auth pages. |
| `frontend/src/types/index.ts` | Centralize domain types by re-exporting registration interfaces and declaring `CollegeRegistrationResponse`. |
| `frontend/src/services/queryKeys.ts` | Add registration mutation key `COLLEGE_REGISTRATION` to the centralized query key registry. |

---

## 10. Risk Assessment & Limitations

### 10.1 Identified Technical Risks & Mitigations

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Mobile Form Fatigue:** 16 fields can overwhelm mobile users. | Medium | Group fields into 3 numbered visual cards; use single-column layout on mobile and two-column on desktop; provide auto-complete attributes (`autoComplete="given-name"`, `email`, etc.). |
| **Password Rule Discrepancy:** Enforcing frontend rules that the backend doesn't require could reject valid passphrases. | High | Frontend Zod schema matches backend `PasswordPolicyValidator` exactly (12–128 chars, no email containment). Complexity is advisory, not blocking. |
| **Silent Header Drop in Axios:** If Axios interceptor doesn't preserve response headers on error. | Medium | `useCollegeRegistration` or `api.ts` directly inspects `error.response?.headers` for `retry-after` before falling back to default messaging. |
| **Applicant Tries Immediate Login:** Unverified applicant attempts to sign in immediately after registration. | High | `RegistrationSuccessView` prominently emphasizes that the account is not yet active, requires email verification within 48 hours, and explains subsequent review steps. |

### 10.2 Technical Limitations Established from Inspection
- **Common Password Denylist:** The curated denylist (`security/common-passwords.txt`) resides exclusively on the backend server. The frontend cannot validate against this denylist client-side. When a common password is submitted, the backend returns HTTP 400 `PASSWORD_POLICY_VIOLATION`, which the form displays on the password input.
- **Email Delivery Confirmation:** The backend uses an asynchronous transactional outbox pattern. The HTTP 201 response confirms database persistence of the registration, user, token, and outbox record, but does not track external SMTP delivery. The UI must explicitly manage user expectations regarding delivery latency and spam folders.

---

## 11. Strict Read-Only Compliance Confirmation

In strict compliance with execution instructions:
- **Zero source files were created or modified** in `frontend/src` or `backend/src`.
- **Zero database migrations** were created or altered.
- **Zero backend APIs** were altered.
- `docs/00-project-overview/ACADLYTIC_MASTER_CONTEXT.md` was **not modified**.
- No implementation has begun.

**Planning Version:** v1.1  
**Module Status:** `DRAFT / PENDING USER APPROVAL`.
