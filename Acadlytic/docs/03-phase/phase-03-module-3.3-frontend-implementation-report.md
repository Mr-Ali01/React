# Acadlytic — Phase 03, Module 3.3 Frontend Implementation Report
## College Admin Restricted Dashboard, Document Management & Review Submission

**Document Version:** 1.1  
**Implementation Date:** 2026-11-25  
**Target Module:** Phase 03, Module 3.3 — College Admin Restricted Dashboard, Document Management & Review Submission (Frontend)  
**Specification Authority:** `docs/03-phase/phase-03-module-3.3-frontend-inspection-and-planning-report.md` (v1.1)  
**Implementation Status:** IMPLEMENTED & VERIFIED — PENDING USER REVIEW & FORMAL APPROVAL

---

## I. Executive Summary

Phase 03, Module 3.3 Frontend has been implemented strictly in accordance with approved Planning Report v1.1 and reconciled to Document Version 1.1. This module delivers the complete restricted workspace for unapproved and pending `COLLEGE_ADMIN` users, allowing them to track institutional verification progress, fulfill mandatory compliance milestones, edit draft registration details, manage compliance documentation with predecessor lineage tracking, and formally submit revisions for Super Admin review.

### Key Implementation Achievements:
1. **Protected Route Architecture Without Redirect Loops:** `/onboarding-status` is nested under `ProtectedRoute` and `RoleGuard allowedRoles={['COLLEGE_ADMIN']}`, but strictly *outside* `CollegeApprovalGuard`. Approved admins visiting `/onboarding-status` are redirected client-side to `/college/dashboard`, while unapproved admins accessing `/college/*` are redirected by `CollegeApprovalGuard` to `/onboarding-status`.
2. **Authoritative State Derivations:** Implemented robust derivations `isApplicationFrozenInReview` and `isDraftEditable` to handle boolean deserialization variants (`isFrozenInReview` vs. `frozenInReview`) and fallback to core revision states (`submittedForReviewAt !== null && !isDraft && status === 'PENDING'`).
3. **Single-Source Data Fetching:** Built around `useMyApplication()`, querying `GET /api/v1/college-registrations/my-application` as the single authoritative aggregate. All draft mutations invalidate `queryKeys.onboarding.myApplication()`, ensuring synchronization between active documents, profile, feedback, and checklist gates.
4. **Server-Confirmed Profile Updates:** Institutional profile edits via `PUT /my-application` do not apply optimistic updates, ensuring strict alignment with server validation rules and atomic synchronization of the college tenant name in `useAuthStore`.
5. **Document Lifecycle & Lineage:** Implemented upload, replacement, deletion, and download workflows enforcing the 5 active document ceiling. Replacement documents preserve lineage via `replacesDocumentId`, and deleting a replacement document restores its predecessor.
6. **Streaming Download & Boundary Safety:** Multipart form submission clears default JSON headers (`{ headers: { 'Content-Type': undefined } }`) for browser boundary generation. Document downloads use safe delayed object URL revocation (60-second timer) to prevent aborted downloads in modern browsers.
7. **Two-Tier Permanent Rejection Lifecycles:** Renders an unrecoverable rejection state on HTTP 403 `REGISTRATION_PERMANENTLY_REJECTED` and handles subsequent session destruction cleanly.
8. **100% Automated Test Pass Rate:** Verified with 26 dedicated dashboard tests and 110/110 passing tests across the entire frontend suite (11 test files), maintaining the 84 baseline tests with zero regressions, plus clean TypeScript compilation (`tsc -b`) and a successful production build (`vite build`).

---

## II. Exact File Inventory

The implementation touches a total of 19 files: 14 created and 5 modified.

### A. Created Files (14 files)
| # | File Path | Lines | Responsibility |
|---|-----------|-------|----------------|
| 1 | `frontend/src/schemas/onboardingSchema.ts` | 186 | Zod validation schemas for profile updates (`updateApplicationSchema`), document uploads (`documentUploadSchema`), and binary magic byte probe helper (`probeFileMagicBytes`). |
| 2 | `frontend/src/services/onboardingService.ts` | 156 | Axios API client for all 8 backend onboarding endpoints, including streaming download with safe 60s cleanup. |
| 3 | `frontend/src/hooks/useOnboarding.ts` | 184 | TanStack Query hooks (`useMyApplication`, `useCreateCorrectionDraft`, `useUpdateDraftProfile`, `useUploadDocument`, `useDeleteDocument`, `useSubmitApplication`) and derivation helpers. |
| 4 | `frontend/src/components/onboarding/OnboardingStatusBanner.tsx` | 194 | Hero status banner with lifecycle badge, revision badge, resubmission counters, frozen notice, and "Start Correction Draft" action. |
| 5 | `frontend/src/components/onboarding/ReviewFeedbackCard.tsx` | 89 | Decoupled review card presenting Super Admin deficiency notes, rejection reasons, and review timestamps. |
| 6 | `frontend/src/components/onboarding/OnboardingChecklistCard.tsx` | 237 | 4-step interactive compliance checklist with embedded `<ResendVerificationButton />`, progress bar, and review submit trigger. |
| 7 | `frontend/src/components/onboarding/CollegeProfileCard.tsx` | 129 | Card displaying institutional details (legal name, permanent code, address, phone, website, university) with edit trigger. |
| 8 | `frontend/src/components/onboarding/EditProfileModal.tsx` | 179 | Modal form using React Hook Form + Zod resolver with immutable code display and backend field-error mapping. |
| 9 | `frontend/src/components/onboarding/DocumentManagementSection.tsx` | 277 | Active verification documents table with category badges, formatted file sizes, replacement lineage badges, and download/replace/delete actions. |
| 10 | `frontend/src/components/onboarding/DocumentUploadModal.tsx` | 227 | Upload modal with category selector, drag-and-drop file picker, 10MB limit enforcement, pre-upload magic byte probe, and replace mode. |
| 11 | `frontend/src/components/onboarding/SubmitApplicationModal.tsx` | 98 | Confirmation modal detailing irrevocable application freeze and checklist verification before triggering submission. |
| 12 | `frontend/src/components/onboarding/RevisionHistoryDrawer.tsx` | 129 | Modal dialog presenting the historical revision audit trail ($v_1, v_2\dots$) with outcomes and reviewer notes. |
| 13 | `frontend/src/components/onboarding/index.ts` | 11 | Barrel export cleanly encapsulating all 9 onboarding domain components. *(Additional file beyond the 13 planned)* |
| 14 | `frontend/src/test/onboarding-dashboard.test.tsx` | 1032 | Comprehensive Vitest suite with 26 automated integration test scenarios covering the full restricted dashboard. |

### B. Modified Files (5 files)
| # | File Path | Changes | Responsibility |
|---|-----------|---------|----------------|
| 1 | `frontend/src/types/index.ts` | +88 lines | Added `DocumentCategory`, `CollegeSummaryResponse`, `CollegeProfileResponse`, `CurrentRevisionResponse`, `ReviewFeedbackResponse`, `ResubmissionAllowanceResponse`, `OnboardingChecklistResponse`, `DocumentResponse`, `RevisionSummaryResponse`, `MyApplicationResponse`, `UpdateApplicationRequest`, and `SubmitApplicationResponse`. |
| 2 | `frontend/src/services/queryKeys.ts` | +7 lines | Added `queryKeys.onboarding` factory (`myApplication`, `activeDocuments`). |
| 3 | `frontend/src/pages/OnboardingStatusPage.tsx` | Replaced (354 lines) | Full restricted dashboard implementation integrating all domain components, queries, mutations, unverified email banner, and error states. |
| 4 | `frontend/src/routes/index.tsx` | +17 lines | Moved `/onboarding-status` from public routes to protected routes under `ProtectedRoute` and `RoleGuard allowedRoles={['COLLEGE_ADMIN']}`, strictly outside `CollegeApprovalGuard`. |
| 5 | `frontend/.gitignore` | +2 lines | Added `vite.config.js` and `vite.config.d.ts` build artifacts to ignore list. *(Additional file beyond the 4 planned)* |

### C. Technical Rationale for Additional Files
1. **`src/components/onboarding/index.ts` (14th created file):** Planning Report v1.1 proposed 13 created files (including the 9 individual components and the test file). Adding `index.ts` establishes a standard module boundary / barrel export for `@/components/onboarding`, simplifying imports across `OnboardingStatusPage.tsx` and test files, consistent with existing frontend conventions (e.g. `@/components/ui`, `@/components/verification`).
2. **`frontend/.gitignore` (5th modified file):** Executing `tsc -b` during verification generated `vite.config.js` and `vite.config.d.ts` in the `frontend/` directory. Adding these two transient build artifacts to `.gitignore` was necessary to prevent compiler output from polluting the Git working tree.

---

## III. Architecture & Technical Decisions

### 1. Route Nesting & Guard Protection
The routing for `/onboarding-status` is strictly isolated from `CollegeApprovalGuard`:
```tsx
// Protected College Admin Onboarding Status Route (Must be strictly outside CollegeApprovalGuard)
{
  element: <ProtectedRoute />,
  children: [
    {
      element: <RoleGuard allowedRoles={['COLLEGE_ADMIN']} />,
      children: [
        {
          element: <AppLayout />,
          children: [
            {
              path: 'onboarding-status',
              element: <OnboardingStatusPage />,
            },
          ],
        },
      ],
    },
  ],
},
```
- **Unauthenticated Visitors:** Redirected to `/auth/login` by `ProtectedRoute`, with `returnUrl` preserved.
- **Unauthorized Roles (`SUPER_ADMIN`, etc.):** Redirected to `/unauthorized` by `RoleGuard`.
- **Approved College Admins:** Navigating to `/onboarding-status` are detected client-side by `OnboardingStatusPage` and immediately redirected via `<Navigate to="/college/dashboard" replace />`.
- **Unapproved College Admins:** Attempting to reach `/college/*` are redirected to `/onboarding-status` by `CollegeApprovalGuard`. Placing `/onboarding-status` outside `CollegeApprovalGuard` guarantees zero redirect loops.

### 2. Derivation of Frozen State
Due to Jackson boolean serialization nuances, boolean record accessors may serialize as either `isFrozenInReview` or `frozenInReview`. The derivation helper inspects both, with a deterministic fallback to revision state:
```ts
export function isApplicationFrozenInReview(
  currentRevision?: CurrentRevisionResponse | null,
  checklist?: OnboardingChecklistResponse | null
): boolean {
  if (checklist?.isFrozenInReview !== undefined) {
    return Boolean(checklist.isFrozenInReview);
  }
  if (checklist?.frozenInReview !== undefined) {
    return Boolean(checklist.frozenInReview);
  }
  return (
    Boolean(currentRevision && !currentRevision.isDraft) &&
    currentRevision?.submittedForReviewAt !== null &&
    currentRevision?.status === 'PENDING'
  );
}
```

### 3. Server-Confirmed Profile Updates
In accordance with ADR guidelines, the frontend never assumes successful profile updates or changes to tenant names. `useUpdateDraftProfile` executes `PUT /college-registrations/my-application` and on success invalidates `queryKeys.onboarding.myApplication()` and synchronizes `user.collegeName` in `useAuthStore` using the server-returned `legalName`.

### 4. Multipart Boundary Safety & Download Cleanup
- **Multipart Upload:** Default Axios headers specify `Content-Type: application/json`. In `onboardingService.uploadDocument`, headers are passed as `{ headers: { 'Content-Type': undefined } }`, allowing the browser to inject `multipart/form-data; boundary=----WebKitFormBoundary...`.
- **Delayed Cleanup:** Immediate invocation of `URL.revokeObjectURL(url)` cancels stream downloads in Chromium and Firefox. A 60-second `setTimeout` guarantees complete I/O transfer before releasing memory.

---

## IV. Critical Behavior Implementation & Test Evidence Audit

The five critical module behaviors were audited against actual source code and test files:

| # | Critical Behavior | Implementation Status | Test Coverage Status | Code Reference | Test Reference |
|---|-------------------|-----------------------|----------------------|----------------|----------------|
| 1 | **Correction & resubmission limits** | **Implemented** | **Implemented and tested** | `OnboardingStatusBanner.tsx:71-75, 133-162` | `onboarding-dashboard.test.tsx:244-329, 950-989` (Tests 4, 5, 25) |
| 2 | **Document mutation query invalidation** | **Implemented** | **Implemented but not directly tested** | `useOnboarding.ts:133-139, 155-161` | `onboarding-dashboard.test.tsx:631-655, 830-889` (Tests 16, 22, 23) |
| 3 | **Subsequent 401 auth cleanup & login redirect** | **Implemented** | **Implemented but not directly tested in Module 3.3 suite** *(Covered in global auth suite)* | `OnboardingStatusPage.tsx:72-117`, `api.ts:222-234`, `useOnboarding.ts:61-66` | `onboarding-dashboard.test.tsx:331-352` (Test 6); `email-verification.test.tsx:610-630` (Test 28) |
| 4 | **Blob URL & temporary anchor cleanup** | **Implemented** | **Implemented but not directly tested** | `onboardingService.ts:105-132` | `onboarding-dashboard.test.tsx:610-630` (Test 15) |
| 5 | **Server-confirmed legal-name synchronization** | **Implemented** | **Implemented but not directly tested** | `useOnboarding.ts:100-110` | `onboarding-dashboard.test.tsx:474-511` (Test 11) |

### Detailed Behavior Analysis:

1. **Correction and Resubmission Limits:**
   - *Implementation:* `OnboardingStatusBanner.tsx` inspects `resubmission` fields (`resubmissionCount`, `maxRejections`, `actionRequiredCount`, `maxActionRequired`). It renders counter metrics, gates the "Start Correction Draft" action with `canStartCorrection = (status === 'ACTION_REQUIRED' || status === 'REJECTED') && !currentRevision.isDraft && checklist.canStartCorrectionDraft;`, and displays a red lock notice (`Maximum resubmissions reached. Further revisions are locked.`) if resubmissions are exhausted.
   - *Test Evidence:* Directly asserted in Test 4 (verifies `ACTION_REQUIRED` status renders feedback and displays "Start Correction Draft" button), Test 5 (verifies `REJECTED` status renders `1 / 3` counter display, rejection reasoning, and "Start Correction Draft" button), and Test 25 (verifies clicking "Start Correction Draft" invokes `createCorrectionDraft` and creates revision v2). *(Note: Rendering of the limit-exhaustion string when `canStartCorrectionDraft: false` is implemented in lines 152-160 but not separately asserted in a standalone exhaustion test).*

2. **Document Mutation Query Invalidation:**
   - *Implementation:* In `frontend/src/hooks/useOnboarding.ts`, `useUploadDocument` (lines 133-139) and `useDeleteDocument` (lines 155-161) define `onSuccess` handlers that invalidate `queryKeys.onboarding.myApplication()` and `queryKeys.onboarding.activeDocuments()`.
   - *Test Evidence:* In `onboarding-dashboard.test.tsx`, Test 16 (delete) and Tests 22 & 23 (upload and replace) execute these mutations via UI interactions and assert that `onboardingService.deleteDocument` and `onboardingService.uploadDocument` are called with correct arguments. However, `queryClient.invalidateQueries` is not explicitly asserted with a Vitest spy.

3. **Subsequent 401 Authentication Cleanup & Login Navigation:**
   - *Implementation:* `useMyApplication` excludes 401 and 403 from query retries (`retry: (failureCount, error) => error.status === 401 || error.status === 403 ? false : failureCount < 1`). When the backend permanently rejects an application (HTTP 403 `REGISTRATION_PERMANENTLY_REJECTED`), it destroys the user session in Spring Session JDBC. `OnboardingStatusPage.tsx` renders the permanent rejection alert with a "Return to Login" button. When the user navigates or makes any subsequent request with an invalid session, the backend responds with HTTP 401 `AUTH_UNAUTHENTICATED`. The global Axios response interceptor (`src/services/api.ts` lines 222-234) catches this 401 on protected resources, clears `useAuthStore`, calls `sessionPurgeCallback?.()`, and executes `window.location.assign('/auth/login')`.
   - *Test Evidence:* Test 6 directly tests the HTTP 403 permanent rejection screen and the "Return to Login" button. The subsequent 401 cleanup is covered by shared auth interceptor tests in `src/test/email-verification.test.tsx` (Test 28) and `src/test/auth-me-unauthenticated.test.tsx`, but is not directly re-tested inside `onboarding-dashboard.test.tsx`.

4. **Blob URL and Temporary Anchor Cleanup:**
   - *Implementation:* In `frontend/src/services/onboardingService.ts` (`downloadDocument`, lines 105-132), a `Blob` is created from the response binary data, an object URL is generated via `window.URL.createObjectURL(blob)`, an invisible anchor is attached to `document.body`, `.click()` is dispatched, the anchor is synchronously removed (`anchor.remove()`), and `window.URL.revokeObjectURL(objectUrl)` is scheduled with a safe 60-second delay (`setTimeout(..., 60000)`).
   - *Test Evidence:* Test 15 in `onboarding-dashboard.test.tsx` verifies that clicking the download action invokes `onboardingService.downloadDocument(201, 'registration_charter.pdf')`. The internal DOM anchor attachment/removal and 60s `revokeObjectURL` timer are not directly asserted with fake timers.

5. **Server-Confirmed Legal-Name Synchronization:**
   - *Implementation:* In `frontend/src/hooks/useOnboarding.ts` (`useUpdateDraftProfile`, lines 100-110), only upon mutation success does the hook synchronize `useAuthStore.getState().setUser({ ...user, collegeName: data.profile.legalName })` using the server-confirmed `data.profile.legalName`.
   - *Test Evidence:* Test 11 in `onboarding-dashboard.test.tsx` tests the submission of the profile modal and verifies `onboardingService.updateDraftProfile` is called with `{ legalName: 'Horizon University of Technology' }`. Direct assertion of `useAuthStore.getState().user?.collegeName` post-mutation is not explicitly present in Test 11.

---

## V. Automated Verification Results

### 1. Dedicated Dashboard Suite (`src/test/onboarding-dashboard.test.tsx`)
```
 ✓ src/test/onboarding-dashboard.test.tsx (26 tests) 4719ms
   ✓ 1. renders draft application v1 with college summary, code, and editing open 461ms
   ✓ 2. redirects approved COLLEGE_ADMIN to /college/dashboard immediately
   ✓ 3. renders frozen-in-review state with locked banner and disabled actions 373ms
   ✓ 4. renders ACTION_REQUIRED status with reviewer feedback card and Start Correction button
   ✓ 5. renders REJECTED status with rejection reason and resubmission counters
   ✓ 6. renders permanent rejection screen on HTTP 403 REGISTRATION_PERMANENTLY_REJECTED
   ✓ 7. displays Step 1 unverified email alert and ResendVerificationButton if user email is unverified
   ✓ 8. unlocks review submission button when all 4 checklist steps are satisfied
   ✓ 9. displays complete profile fields and permanent immutable college code
   ✓ 10. opens EditProfileModal pre-filled with profile data and code disabled 370ms
   ✓ 11. submits profile edits and updates query cache without optimistic tenant sync 461ms
   ✓ 12. displays server validation errors in EditProfileModal on PUT failure 454ms
   ✓ 13. renders active documents table with category badges, sizes, and lineage info
   ✓ 14. disables Upload Document button when active document limit (5) is reached
   ✓ 15. triggers document download via onboardingService.downloadDocument
   ✓ 16. prompts confirmation and deletes document with predecessor restoration notice
   ✓ 17. cancels document deletion if confirmation is declined
   ✓ 18. opens DocumentUploadModal and validates file selection
   ✓ 19. rejects files exceeding 10MB in upload modal with client validation error
   ✓ 20. rejects files with invalid extension in upload modal
   ✓ 21. rejects files failing binary magic byte probe before making API call
   ✓ 22. successfully uploads valid document and closes modal
   ✓ 23. opens upload modal in replace mode with pre-filled category and replacesDocumentId
   ✓ 24. opens SubmitApplicationModal and emphasizes application freeze upon confirmation
   ✓ 25. creates correction draft from ACTION_REQUIRED state and updates revision
   ✓ 26. opens RevisionHistoryDrawer and displays past submitted revisions audit trail

Test Files: 1 passed (1)
Tests:      26 passed (26)
Duration:   4.72s
```

### 2. Full Frontend Suite Verification (`npx vitest run`)
Complete terminal summary captured from execution:
```
 RUN  v2.1.9 c:/React/Acadlytic/frontend

 ✓ src/test/college-approval-guard.test.tsx     (2 tests) 101ms
 ✓ src/test/csrf-interceptor.test.tsx           (2 tests) 48ms
 ✓ src/test/login-errors.test.tsx               (2 tests) 2557ms
 ✓ src/test/reset-password-validation.test.tsx  (3 tests) 3029ms
 ✓ src/test/email-verification.test.tsx         (43 tests) 3017ms
 ✓ src/test/register-college.test.tsx           (26 tests) 4115ms
 ✓ src/test/onboarding-dashboard.test.tsx       (26 tests) 4719ms
 ✓ src/test/role-guard.test.tsx                 (2 tests) 90ms
 ✓ src/test/protected-route.test.tsx            (2 tests) 95ms
 ✓ src/test/auth-me-unauthenticated.test.tsx    (1 test) 105ms
 ✓ src/test/login-success.test.tsx              (1 test) 893ms

 Test Files  11 passed (11)
      Tests  110 passed (110)
   Start at  08:25:25
   Duration  25.55s (transform 4.95s, setup 14.32s, collect 21.49s, tests 18.77s, environment 32.24s, prepare 12.21s)
```

### 3. Detailed Test Count & Baseline Reconciliation
- **Baseline Test Count:** Prior to Module 3.3, the frontend test suite comprised **84 tests** across 10 test files:
  - `college-approval-guard.test.tsx`: 2 tests
  - `csrf-interceptor.test.tsx`: 2 tests
  - `login-errors.test.tsx`: 2 tests
  - `reset-password-validation.test.tsx`: 3 tests
  - `role-guard.test.tsx`: 2 tests
  - `protected-route.test.tsx`: 2 tests
  - `auth-me-unauthenticated.test.tsx`: 1 test
  - `login-success.test.tsx`: 1 test
  - `register-college.test.tsx`: 26 tests *(Previously misstated as 22 in report v1.0)*
  - `email-verification.test.tsx`: 43 tests
  - **Subtotal:** 2 + 2 + 2 + 3 + 2 + 2 + 1 + 1 + 26 + 43 = **84 tests**
- **Module 3.3 Contribution:** Added `onboarding-dashboard.test.tsx` containing **26 tests**.
- **Reconciled Total:** 84 baseline + 26 Module 3.3 = **110 tests** across 11 test files.
- *Discrepancy Resolution:* In report v1.0, `register-college.test.tsx` was incorrectly listed as having 22 tests (which yielded a breakdown sum of 106). The actual test count is 26 tests, bringing the verified breakdown to exactly 110 tests with zero discrepancies.

### 4. TypeScript Compilation & Production Build Verification
```
> acadlytic-frontend@0.0.1 build
> tsc && vite build

vite v5.4.21 building for production...
transforming...
✓ 1759 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.55 kB │ gzip:   0.37 kB
dist/assets/index-Bt5iHk_b.css   32.44 kB │ gzip:   6.28 kB
dist/assets/index-CSMGOXDK.js   586.15 kB │ gzip: 172.86 kB
✓ built in 5.56s
```

---

## VI. Protocol Compliance & Non-Modification Constraints

1. **Frontend Isolation:** All changes were strictly confined to `frontend/`. Zero backend source files, migrations, or database configurations were modified.
2. **Master Context Integrity:** `docs/00-project-overview/ACADLYTIC_MASTER_CONTEXT.md` was **not modified** during this task, in strict compliance with governance rules.
3. **Approval Status:** Module 3.3 is **not marked as APPROVED**. Approval is deferred exclusively to project owner review.
4. **Manual Browser Verification:** Transparently noted as pending user acceptance testing.

---

## VII. Manual Verification Guide for Reviewers

To manually verify Module 3.3 in a browser:
1. Start the supporting infrastructure using Docker Compose:
   ```bash
   docker compose up -d
   ```
   *Services verified from `docker-compose.yml`:*
   - **MySQL 8.0:** Container `acadlytic-mysql` on port `3306` (database: `acadlytic`, user: `acadlytic_user`).
   - **Mailpit:** Container `acadlytic-mailpit` on SMTP port `1025` and Web UI port `8025`.
2. Start the Spring Boot backend:
   ```bash
   mvn spring-boot:run
   ```
3. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```
4. Register a new college via `/auth/register-college`.
5. Log in as the unverified admin:
   - Observe redirect to `/onboarding-status`.
   - Observe hero banner indicating `Revision v1 (Draft)`.
   - Observe the top warning banner stating that email verification is required, with the `<ResendVerificationButton />`.
   - Observe that "Upload Document" is disabled due to unverified email.
6. Verify email via link in Mailpit Web UI (`http://localhost:8025`).
7. Refresh or navigate back to `/onboarding-status`:
   - Step 1 in checklist shows a green checkmark.
   - Document upload button is now enabled.
8. Click "Edit Profile", update fields, and observe server-confirmed updates without optimistic state glitches.
9. Upload mandatory verification documents (`INSTITUTION_REGISTRATION_PROOF`, `AUTHORIZED_SIGNATORY_ID`, `UNIVERSITY_AFFILIATION_CERTIFICATE`). Observe lineage and size display.
10. Click "Submit Application" when Step 4 unlocks. Acknowledge the freeze dialog.
11. Observe the dashboard transition to the frozen state:
    - Banner reflects `Under Review — Application Frozen`.
    - Profile editing, document upload, replacement, and deletion are disabled.
    - Super Admin can now review the application in Phase 03, Module 3.4 — Super Admin Review Queue.
