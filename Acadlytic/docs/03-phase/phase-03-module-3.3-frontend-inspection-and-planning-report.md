# Acadlytic — Phase 03, Module 3.3 Frontend Inspection & Planning Report (v1.1)
## Module 3.3: College Admin Restricted Dashboard, Document Management & Review Submission (Frontend)

**Document:** `docs/03-phase/phase-03-module-3.3-frontend-inspection-and-planning-report.md`  
**Version:** 1.1 (Consolidated Technical Reconciliation: Route Guard Nesting, Authoritative Frozen State Derivation, Permanent Rejection Lifecycle, Data Source Ownership & Download Cleanup)  
**Target Module:** Phase 03, Module 3.3 — Frontend Implementation Planning  
**Project Root:** `c:\React\Acadlytic`  
**Authoritative Backend Specification:** `docs/03-phase/phase-03-module-3.3-inspection-and-planning-report.md` (v2.2)  
**Authoritative Backend Implementation Report:** `docs/03-phase/phase-03-module-3.3-implementation-report.md`  
**Authoritative Project Context:** `docs/00-project-overview/ACADLYTIC_MASTER_CONTEXT.md`  
**Planning Date:** 2026-11-25  
**Execution Mode:** Inspection & Planning ONLY (Implementation Strictly Prohibited in this turn)  
**Status:** DRAFT / PENDING PROJECT-OWNER REVIEW & APPROVAL  

---

## Architectural Revision History

| Version | Date | Key Architectural Changes & Technical Reconciliations |
|---|---|---|
| **v1.0** | 2026-11-25 | Initial frontend inspection and planning report. Established 8-endpoint backend contract matrix, user workflow, component breakdown, TanStack Query hooks, and Vitest test plan. |
| **v1.1** | 2026-11-25 | **Consolidated Technical Reconciliation:**<br>1. **File Inventory Count Reconciliation:** Reconciled Section I to explicitly declare 13 proposed created files, 4 modified files, and 17 total affected files with full path verification.<br>2. **Route Guard & Navigation Architecture:** Formally defined route nesting for `/onboarding-status`, proving it must bypass `CollegeApprovalGuard` (nested under `ProtectedRoute` and `RoleGuard allowedRoles={['COLLEGE_ADMIN']}`) to prevent infinite redirect loops, with automatic client-side redirection to `/college/dashboard` for approved administrators.<br>3. **Authoritative Frozen State Derivation:** Inspected `OnboardingChecklistResponse` and `CurrentRevisionResponse`, establishing a resilient derivation helper (`isDraft === false && submittedForReviewAt !== null && status === 'PENDING'`) that protects against Jackson boolean serialization variations.<br>4. **Permanent Rejection Lifecycle & Session Revocation:** Code-level evidence from `CollegeLifecycleService`, `SessionRevocationService`, and `SessionValidationFilter` establishing observable API behavior (HTTP 403 `REGISTRATION_PERMANENTLY_REJECTED` and HTTP 401 `AUTH_UNAUTHENTICATED`) and frontend handling.<br>5. **Single-Source Data Fetching Strategy:** Standardized on `GET /my-application` as the authoritative single source of truth for both dashboard checklist and active documents, eliminating redundant queries.<br>6. **Safe Download Lifecycle:** Replaced synchronous `revokeObjectURL` with delayed asynchronous cleanup to prevent premature blob stream termination across browsers.<br>7. **Server-Confirmed Profile Updates:** Eliminated optimistic profile updates in favor of server-confirmed mutation followed by query refetch and auth store college name synchronization.<br>8. **Counter Off-by-One Boundaries & Multipart Config:** Explicitly documented `actionRequiredCount < 10`, `resubmissionCount < 3`, and Axios `{ headers: { 'Content-Type': undefined } }` boundary generation. |

---

## A. Executive Summary

### 1. Scope & Purpose
Phase 03, Module 3.3 (**College Admin Restricted Dashboard, Document Management & Review Submission — Frontend**) provides authenticated `COLLEGE_ADMIN` users with a dedicated, self-service operational workspace during their onboarding lifecycle. 

Prior to platform approval by `SUPER_ADMIN`, a college remains unapproved (`PENDING`, `ACTION_REQUIRED`, or non-permanent `REJECTED`). During this period, the administrator is restricted from accessing academic management APIs (student records, courses, exams, results), but must be able to:
1. **Inspect Application State:** Real-time visibility into the college's registration status, active revision version ($v_1, v_2\dots$), submission timestamps, live onboarding checklist, decoupled review feedback, and immutable historical revisions.
2. **Manage Institutional Profile:** View and edit institutional contact details, campus address, and affiliation information strictly while in an editable draft state (`isDraft === true`).
3. **Execute Document Management:** Upload, list, replace, remove, and stream-download verification documents across mandatory (`UNIVERSITY_AFFILIATION_CERTIFICATE`, `AUTHORIZED_SIGNATORY_ID`) and optional categories (`INSTITUTION_REGISTRATION_PROOF`, `ADDITIONAL_SUPPORTING_DOCUMENT`) with client-side format and size pre-validation.
4. **Create Immutable Correction Drafts:** When an application receives an `ACTION_REQUIRED` or non-permanent `REJECTED` decision, initiate a new editable correction revision ($v+1$) carrying forward active documents and decoupling historical review feedback.
5. **Submit Application for Review:** Validate mandatory gates (administrator email verification and mandatory document attachment) and submit the application for Super Admin evaluation, transitioning the revision into an immutable frozen state.

### 2. Implementation Readiness & Backend Grounding
The backend for Module 3.3 is **100% complete, verified, and APPROVED** (142/142 tests passing across unit and Testcontainers MySQL 8.0.36 integration suites; schema V4/V5 active). All 8 REST endpoints exposed by `CollegeOnboardingController` are live, verified, and contractually stable. Furthermore, Module 3.1B (Registration Portal) and Module 3.2 (Email Verification) frontend modules are completed and approved, providing proven patterns for Axios CSRF handling, typed `ApiError`, strict `Retry-After` parsing, and reusable verification buttons.

### 3. Major Integration Considerations
- **Session & CSRF Coupling:** All Module 3.3 endpoints require an active session cookie (`ACADLYTIC_SID`) and `COLLEGE_ADMIN` role. Mutating requests (`POST`, `PUT`, `DELETE`) require synchronized `X-XSRF-TOKEN` headers.
- **Multipart Form Uploads:** Verification document upload uses `multipart/form-data`. Axios must let the browser handle boundary generation while preserving the session cookie and CSRF token.
- **Strict In-Place Freeze Protection:** When an application is submitted (`submittedForReviewAt !== null`), all mutating operations (`PUT /my-application`, `POST /documents`, `DELETE /documents/{id}`) return `409 APPLICATION_FROZEN_IN_REVIEW`. The UI must deterministically disable all editing and uploading controls when frozen.
- **Decoupled Review Feedback:** When editing correction draft $v+1$, the Super Admin's review notes from revision $v$ remain visible in a decoupled card, allowing the administrator to reference exact review feedback while updating documents.
- **Dual Verification Routes & Resend Integration:** Seamlessly embeds `<ResendVerificationButton />` into the onboarding checklist if the administrator's email is unverified, resolving the email gate without requiring navigation away from the dashboard.

---

## B. Existing Architecture Inventory

### 1. Existing Relevant Files & Current Responsibilities
| File Path | Role in Module 3.3 |
|:---|:---|
| `frontend/src/routes/guards/CollegeApprovalGuard.tsx` | Route guard checking `collegeApprovalStatus`. Currently redirects unapproved `COLLEGE_ADMIN` users to `/onboarding-status`. |
| `frontend/src/routes/guards/ProtectedRoute.tsx` | Ensures user is authenticated (`isAuthenticated === true`); redirects unauthenticated callers to `/auth/login`. |
| `frontend/src/routes/guards/RoleGuard.tsx` | Restricts route access based on allowed roles (`COLLEGE_ADMIN`). |
| `frontend/src/routes/index.tsx` | Router definition configuring public, auth, and protected branches. |
| `frontend/src/pages/OnboardingStatusPage.tsx` | Existing static informational view; targeted for upgrade into the full interactive Restricted Dashboard. |
| `frontend/src/services/api.ts` | Axios instance with `withCredentials: true`, CSRF token interceptor, single-retry handler, typed `ApiError`, and `parseRetryAfter`. |
| `frontend/src/services/queryKeys.ts` | Centralized TanStack Query key factory; must be extended with `onboarding` keys. |
| `frontend/src/stores/authStore.ts` | Zustand store tracking `user`, `isAuthenticated`, `isLoading`, and `setUser`. |
| `frontend/src/components/verification/ResendVerificationButton.tsx` | Reusable button managing dual-layer rate limits and active countdowns for email verification resend. |
| `frontend/src/components/ui/*` | Reusable accessible primitives: `Button`, `Card`, `Input`, `Select`, `Textarea`, `Modal`, `Alert`, `Table`, `LoadingSpinner`, `ErrorState`. |

### 2. Reusable Code & Existing Patterns
- **Authentication State:** `useAuthStore` provides live access to `user` (`collegeApprovalStatus`, `emailVerified`, `collegeName`, `collegeCode`).
- **CSRF & Session Invalidation:** `apiClient` automatically extracts the `XSRF-TOKEN` cookie, adds `X-XSRF-TOKEN` to mutating requests, and transparently retries on `403 CSRF_TOKEN_INVALID`. On session expiration (`401`), it triggers store cleanup.
- **Error Normalization:** `ApiError` provides typed access to `errorCode`, `status`, and field-level `errors`.
- **UI Primitives:** Modal dialogs, form controls, responsive tables, loading skeletons, and alerts are already established and tested.

### 3. Architecture Gaps Requiring New Frontend Work
- **Service Layer:** No onboarding API service exists (`frontend/src/services/onboardingService.ts` must be created).
- **TanStack Query Hooks:** No query or mutation hooks exist for application retrieval, profile updates, document operations, draft creation, or review submission (`frontend/src/hooks/useOnboarding.ts` must be created).
- **Validation Schemas:** Zod schemas are needed for draft profile updates and document upload constraints (`frontend/src/schemas/onboardingSchema.ts`).
- **Domain UI Components:** Dedicated onboarding components (status banner, review feedback card, checklist, profile card, edit modal, document manager, submission modal, revision history drawer) must be created under `frontend/src/components/onboarding/`.
- **TypeScript DTOs:** Onboarding DTOs matching backend records must be added to `frontend/src/types/index.ts`.
- **Route Guard Protection:** `/onboarding-status` must be moved inside `ProtectedRoute` and `RoleGuard` so that only authenticated `COLLEGE_ADMIN` users access it, redirecting unauthenticated guests to `/auth/login`.

---

## C. Backend API Contract Matrix

The following matrix documents the exact backend API contracts implemented in `CollegeOnboardingController.java` and verified by `CollegeOnboardingIntegrationTest.java`:

| # | Endpoint | Method | Auth & Role | Request Payload / Multipart | Response Payload (`data`) | Status Codes | Business Rules & Invariants |
|:---|:---|:---:|:---|:---|:---|:---:|:---|
| 1 | `/api/v1/college-registrations/my-application` | `GET` | Session Cookie<br>`COLLEGE_ADMIN` | None | `MyApplicationResponse`<br>- `college`<br>- `currentRevision`<br>- `reviewFeedback`<br>- `resubmission`<br>- `checklist`<br>- `activeDocuments`<br>- `revisionHistory` | 200 OK<br>401 Unauth<br>403 Denied | - Read-only aggregation.<br>- Resolves highest version revision as `currentRevision`.<br>- Resolves `reviewFeedback` strictly from `colleges.current_registration_id`.<br>- Resolves active documents via leaf-node replacement tree.<br>- Blocks suspended/inactive/permanently rejected tenants with 403. |
| 2 | `/api/v1/college-registrations/my-application/correction-draft` | `POST` | Session Cookie<br>`COLLEGE_ADMIN`<br>`X-XSRF-TOKEN` | Empty body (`{}`) | `CurrentRevisionResponse`<br>- `id`<br>- `versionNumber`<br>- `status` (`PENDING`)<br>- `submittedForReviewAt` (`null`)<br>- `isDraft` (`true`)<br>- `profile` | 201 Created<br>400 Bad Req<br>409 Conflict | - Acquires parent `College` pessimistic write lock (`SELECT ... FOR UPDATE`).<br>- Idempotent: returns existing unsubmitted draft if already open.<br>- Allowed only if submitted revision is `ACTION_REQUIRED` (count < 10) or non-permanent `REJECTED` (count < 3).<br>- Clones active documents to new rows with duplicated storage keys.<br>- Rejects if frozen in review with 409. |
| 3 | `/api/v1/college-registrations/my-application` | `PUT` | Session Cookie<br>`COLLEGE_ADMIN`<br>`X-XSRF-TOKEN` | `UpdateApplicationRequest`<br>- 10 profile fields | `CurrentRevisionResponse` | 200 OK<br>400 Validation<br>409 Conflict | - Modifies draft profile fields under parent row lock.<br>- Rejects if revision is submitted (`submittedForReviewAt != null`) with 409.<br>- Synchronizes `colleges.name` atomically when `legalName` is updated.<br>- Trims all string inputs; optional fields convert blank to null. |
| 4 | `/api/v1/college-registrations/my-application/documents` | `POST` | Session Cookie<br>`COLLEGE_ADMIN`<br>`X-XSRF-TOKEN` | `multipart/form-data`<br>- `file`: Binary file<br>- `documentCategory`: Enum<br>- `replacesDocumentId`: Long (opt) | `DocumentResponse`<br>- `id`<br>- `registrationId`<br>- `documentCategory`<br>- `originalFilename`<br>- `mimeType`<br>- `fileSizeBytes`<br>- `sha256Checksum`<br>- `replacesDocumentId`<br>- `createdAt` | 201 Created<br>400 Bad Req<br>404 Not Found<br>409 Conflict | - Magic byte & MIME validation for PDF, JPEG, PNG.<br>- Max 10 MB per file (`10,485,760` bytes).<br>- Max 5 active documents per revision.<br>- `replacesDocumentId` must belong to current draft; cross-revision replacement rejected with 400.<br>- Replacement category must match target category.<br>- Auto-replaces existing document of same category if `replacesDocumentId` omitted.<br>- Rejects if frozen with 409. |
| 5 | `/api/v1/college-registrations/my-application/documents` | `GET` | Session Cookie<br>`COLLEGE_ADMIN` | None | `List<DocumentResponse>` | 200 OK | - Lists active (non-superseded) documents for active revision.<br>- Computed via `d.id NOT IN (replaces_document_id of draft docs)`. |
| 6 | `/api/v1/college-registrations/my-application/documents/{documentId}` | `GET` | Session Cookie<br>`COLLEGE_ADMIN` | None | Raw Binary Stream (`Resource`) | 200 OK<br>403 Denied<br>404 Not Found | - Safe download headers: `Content-Disposition: attachment; filename="..."`, `X-Content-Type-Options: nosniff`.<br>- Strict tenant ownership verification: `doc.collegeId == principal.collegeId`. Cross-tenant blocked with 403. |
| 7 | `/api/v1/college-registrations/my-application/documents/{documentId}` | `DELETE` | Session Cookie<br>`COLLEGE_ADMIN`<br>`X-XSRF-TOKEN` | None | `ApiResponse<Void>` | 200 OK<br>400 Bad Req<br>403 Denied<br>409 Conflict | - Deletes document row from draft under parent lock.<br>- Restores superseded predecessor to active set automatically.<br>- Rejects historical or already-superseded deletion with 400.<br>- Rejects if frozen with 409. |
| 8 | `/api/v1/college-registrations/my-application/submit` | `POST` | Session Cookie<br>`COLLEGE_ADMIN`<br>`X-XSRF-TOKEN` | Empty body (`{}`) | `SubmitApplicationResponse`<br>- `registrationId`<br>- `versionNumber`<br>- `status` (`PENDING`)<br>- `submittedForReviewAt`<br>- `message` | 200 OK<br>400 Bad Req<br>409 Conflict | - Enforces email verified gate (`user.emailVerifiedAt != null`).<br>- Enforces mandatory categories (`UNIVERSITY_AFFILIATION_CERTIFICATE`, `AUTHORIZED_SIGNATORY_ID`).<br>- Freezes revision (`submittedForReviewAt = NOW()`, `status = PENDING`).<br>- Sets `colleges.current_registration_id = draft.id`.<br>- Increments safety counters on resubmission.<br>- Emits audit event. |

---

## D. User Workflow & State Machine

### 1. Route Nesting & Navigation Architecture
Inspection of `frontend/src/routes/guards/CollegeApprovalGuard.tsx` reveals:
```tsx
// CollegeApprovalGuard.tsx
if (user.role === 'COLLEGE_ADMIN' && user.collegeApprovalStatus !== 'APPROVED') {
  return <Navigate to="/onboarding-status" replace />;
}
```
If `/onboarding-status` were nested inside `CollegeApprovalGuard`, an unapproved `COLLEGE_ADMIN` navigating to `/onboarding-status` would be redirected by `CollegeApprovalGuard` to `/onboarding-status`, causing an **infinite redirect loop**.

**Reconciled Route Nesting Architecture:**
1. `/onboarding-status` is nested under `ProtectedRoute` and `RoleGuard allowedRoles={['COLLEGE_ADMIN']}`, but **strictly OUTSIDE / AS A SIBLING TO** `CollegeApprovalGuard`:
```tsx
// In frontend/src/routes/index.tsx
{
  path: 'onboarding-status',
  element: <ProtectedRoute />,
  children: [
    {
      element: <RoleGuard allowedRoles={['COLLEGE_ADMIN']} />,
      children: [
        {
          element: <AppLayout />,
          children: [
            {
              index: true,
              element: <OnboardingStatusPage />,
            },
          ],
        },
      ],
    },
  ],
}
```
2. **Access Control Matrix:**
   - **Unauthenticated guest:** Hits `ProtectedRoute` $\to$ Redirected to `/auth/login?from=/onboarding-status`.
   - **Authenticated `SUPER_ADMIN`:** Hits `RoleGuard` $\to$ Redirected to `/unauthorized`.
   - **Unapproved `COLLEGE_ADMIN` (`PENDING`, `ACTION_REQUIRED`, `REJECTED`):** Passes `ProtectedRoute` and `RoleGuard` $\to$ Successfully renders `OnboardingStatusPage`.
   - **Approved `COLLEGE_ADMIN` (`APPROVED`):** `OnboardingStatusPage` inspects `user.collegeApprovalStatus === 'APPROVED'` and returns `<Navigate to="/college/dashboard" replace />`.
   - When an unapproved `COLLEGE_ADMIN` attempts to visit `/college/dashboard`, `CollegeApprovalGuard` intercepts the request and safely navigates to `/onboarding-status`.
   - **Zero redirect loops; complete role and approval enforcement.**

---

### 2. The College Administrator Journey

```
                        [College Admin Authenticates]
                                      │
                                      ▼
                        [CollegeApprovalGuard Checks]
                                      │
                          Is college approved?
                                   /     \
                                 YES      NO
                                 /         \
                                ▼           ▼
                        [/college/dashboard] [/onboarding-status]
                                            (Restricted Dashboard)
                                                    │
                                                    ▼
                                          [GET /my-application]
                                                    │
              ┌─────────────────────────────────────┴─────────────────────────────────────┐
              ▼                                                                           ▼
      [Draft State: isDraft == true]                                     [Submitted State: isDraft == false]
      (Revision 1 initial, or v+1 correction)                                             │
              │                                                                           ▼
      ┌───────┴───────────────────────────┐                         Is status PENDING?
      │                                   │                                /        \
      ▼                                   ▼                              YES         NO
[Email Unverified]                [Email Verified]                       /            \
- Checklist: Email [!]            - Checklist: Email [✓]                ▼              ▼
- Resend button active            - Upload docs allowed          [FROZEN IN REVIEW] [Review Decision Received]
- Submission blocked              - Edit profile allowed         - All edits locked  - ACTION_REQUIRED (cap 10)
                                  - Upload mandatory docs        - Status banner     - REJECTED (cap 3)
                                          │                      - Read-only docs    - PERMANENT REJECTION
                                          ▼                                                  │
                                  [All Gates Satisfied]                                      ▼
                                  - Affiliation Cert [✓]                       [Start Correction Draft]
                                  - Signatory ID [✓]                           - Calls POST /correction-draft
                                  - Checklist Ready [✓]                        - Creates v+1, clones docs
                                          │                                    - Decouples review feedback
                                          ▼                                    - Transitions to Draft State
                                  [Submit Application]
                                  - Calls POST /submit
                                  - Transitions to FROZEN
```

---

### 3. Authoritative Frozen State Derivation
In the backend implementation:
- `OnboardingChecklistResponse.java` includes `boolean isFrozenInReview`.
- `CurrentRevisionResponse.java` includes `submittedForReviewAt`, `isDraft`, and `status`.
- In `CollegeOnboardingService.java` (lines 142–143):
  ```java
  boolean isFrozenInReview = (latestRevision.getSubmittedForReviewAt() != null)
          && (latestRevision.getStatus() == CollegeApprovalStatus.PENDING);
  ```

Because boolean property names in Java records can be serialized by Jackson as either `isFrozenInReview` or `frozenInReview`, the frontend **must not rely solely on a single property name**. 

**Resilient Frontend Derivation Helper (`frontend/src/hooks/useOnboarding.ts`):**
```ts
export function isApplicationFrozenInReview(
  currentRevision?: CurrentRevisionResponse | null,
  checklist?: OnboardingChecklistResponse | null
): boolean {
  if (checklist?.isFrozenInReview !== undefined) {
    return Boolean(checklist.isFrozenInReview);
  }
  // Authoritative fallback derived directly from core revision fields:
  return (
    Boolean(currentRevision && !currentRevision.isDraft) &&
    currentRevision?.submittedForReviewAt !== null &&
    currentRevision?.status === 'PENDING'
  );
}
```
**Editing Availability Rule:**
Profile editing, document uploading, and document deletion are enabled **strictly when**:
`currentRevision?.isDraft === true && currentRevision?.submittedForReviewAt === null`.
Whenever `isApplicationFrozenInReview(...) === true` or `currentRevision?.isDraft === false`, all mutating actions in the UI are disabled.

---

### 4. Permanent Rejection & Session Revocation Lifecycle
Inspection of the backend lifecycle implementation (`CollegeLifecycleService.java`, `SessionValidationFilter.java`, and `SessionRevocationService.java`) establishes the exact observable API behavior following a `SUPER_ADMIN` permanent rejection decision:

1. **Backend Mutations Executed:**
   - `colleges.status = INACTIVE` and `colleges.permanently_rejected = TRUE`.
   - `users.status = INACTIVE` and `users.email_released = TRUE`.
   - `sessionRevocationService.revokeAllSessionsForCollege(college.getId())` deletes all active sessions from the Spring Session JDBC repository.
2. **Observable Client API Behavior:**
   - **Initial Request:** In `SessionValidationFilter.java` (lines 128–133):
     ```java
     if (college.isPermanentlyRejected()) {
         invalidateAndClear(session);
         writeError(response, HttpStatus.FORBIDDEN, "REGISTRATION_PERMANENTLY_REJECTED",
                 "This college registration has been permanently rejected.");
         return;
     }
     ```
     If an in-flight session reaches the server before database session deletion finishes, the filter returns **HTTP 403 FORBIDDEN** with `errorCode: "REGISTRATION_PERMANENTLY_REJECTED"`, and invalidates the session immediately.
   - **Subsequent Requests:** Once session rows are deleted from MySQL, Spring Session treats the incoming session cookie as nonexistent. Spring Security rejects the request at the security filter boundary with **HTTP 401 UNAUTHORIZED** (`errorCode: "AUTH_UNAUTHENTICATED"`).
3. **Frontend Handling Strategy:**
   - On **HTTP 403 `REGISTRATION_PERMANENTLY_REJECTED`**: The frontend renders an unrecoverable, prominent Permanent Rejection Notice banner advising the user that the institutional registration has been permanently closed, disables all actions, and clears local active user credentials.
   - On **HTTP 401 `AUTH_UNAUTHENTICATED`**: The existing Axios interceptor in `frontend/src/services/api.ts` invokes `useAuthStore.getState().clearAuth()`, clears local session state, and redirects the user to `/auth/login`.

---

## E. Page and Component Plan

### 1. Component Detailed Specifications

#### 1. `OnboardingStatusPage.tsx` (Primary Dashboard Container)
- **Responsibility:** Top-level page container fetching `GET /my-application` via `useMyApplication()`. Manages global loading skeletons, error states, and renders child components in a responsive layout (`max-w-6xl`).
- **Authorization:** `COLLEGE_ADMIN` session only. If `user.collegeApprovalStatus === 'APPROVED'`, automatically redirects to `/college/dashboard`.
- **States Handled:** Loading skeleton, Network Error / Server 500 (with retry), 403 Permanent Rejection / Inactive alert, and Active Dashboard.

#### 2. `OnboardingStatusBanner.tsx`
- **Responsibility:** Displays visual lifecycle badge (`Draft`, `Under Review`, `Action Required`, `Rejected`), current revision badge ($v_1, v_2$), submission timestamp, and safety allowance badges (e.g., `Correction Round 1 of 10`, `Resubmissions 0 of 3 used`).
- **Actions:** Renders `Start Correction Draft` button when `checklist.canStartCorrectionDraft === true`.

#### 3. `ReviewFeedbackCard.tsx`
- **Responsibility:** Sourced strictly from `reviewFeedback`. Shows reviewer notes (`reviewNotes`), rejection reasons (`rejectionReason`), and review timestamp (`reviewedAt`).
- **Decoupled Visibility:** Remains prominently visible at the top of the dashboard while the administrator is working in a correction draft ($v+1$), ensuring they have continuous visibility of requested corrections.

#### 4. `OnboardingChecklistCard.tsx`
- **Responsibility:** Visual progress checklist:
  1. *Administrator Email:* Green check if `checklist.emailVerified === true`; amber warning with embedded `<ResendVerificationButton />` if false.
  2. *Institutional Profile:* Green check if required profile fields are present.
  3. *Mandatory Verification Documents:* Green check if both `UNIVERSITY_AFFILIATION_CERTIFICATE` and `AUTHORIZED_SIGNATORY_ID` are active; amber warning if missing.
  4. *Application Submission:* Green check if submitted; pending badge if draft.
- **Guidance:** Provides explicit helper text informing the user what is missing before submission is permitted.

#### 5. `CollegeProfileCard.tsx` & `EditProfileModal.tsx`
- **Responsibility:** Displays institution legal name, college code, phone, website, university, and address.
- **Edit Trigger:** "Edit Profile" button is enabled only when `currentRevision.isDraft === true`.
- **Modal Validation:** `EditProfileModal` uses React Hook Form + Zod (`updateApplicationSchema`). Maps field-level server validation errors. Displays a warning that editing `legalName` will synchronize the college tenant name.
- **Server Confirmation:** Updates are strictly server-confirmed. Upon `PUT /my-application` resolution, `useOnboarding` invalidates `myApplication` and synchronizes `user.collegeName` in `authStore`.

#### 6. `DocumentManagementSection.tsx` & `DocumentUploadModal.tsx`
- **Responsibility:** Displays active documents in a structured table: Category, Filename, Size, Upload Date, Replacement Lineage (`Replaces: doc_id`), and Actions.
- **Actions per Row:**
  - `Download`: Calls `onboardingService.downloadDocument(doc.id, doc.originalFilename)` with safe delayed URL cleanup.
  - `Replace`: Opens upload modal with `replacesDocumentId` preset (only enabled if `isDraft === true`).
  - `Delete`: Opens delete confirmation dialog (only enabled if `isDraft === true`). Explains that deleting a replacement document restores the predecessor.
- **Upload Modal:** File picker restricted to `.pdf, .jpg, .jpeg, .png`, category dropdown, client-side 10 MB limit check, and client-side magic byte probe.

#### 7. `SubmitApplicationModal.tsx`
- **Responsibility:** Confirmation gate before calling `POST /submit`.
- **Content:** Summarizes application details, lists attached mandatory documents, and requires explicit confirmation acknowledging that **the application will freeze and cannot be edited while under Super Admin review**.

#### 8. `RevisionHistoryDrawer.tsx`
- **Responsibility:** Collapsible/modal timeline displaying historical revisions ($v_1, v_2\dots$) from `revisionHistory`, showing submission date, decision date, outcome status, and reviewer feedback.

---

## F. State Management & API Integration Plan

### 1. Single-Source Data Fetching Strategy
Although the backend provides both `GET /my-application` and `GET /my-application/documents`, the frontend **standardizes on `GET /my-application` as the authoritative single source of truth**:
- **Why Both Exist on Backend:** `GET /documents` is a fine-grained sub-resource; `GET /my-application` is the full dashboard aggregate.
- **Why Frontend Standardizes on `GET /my-application`:**
  - `MyApplicationResponse` embeds `activeDocuments: List<DocumentResponse>` alongside `checklist: OnboardingChecklistResponse`.
  - When a document is uploaded, replaced, or deleted, `checklist.requiredDocumentsUploaded` and `checklist.canSubmitForReview` change atomically.
  - Relying exclusively on `GET /my-application` guarantees that active documents and checklist gates are always 100% in sync without race conditions or multiple roundtrips.
- **Query Ownership:**
  - Primary query key: `queryKeys.onboarding.myApplication()`.
  - Stale Time: 30 seconds.
  - Cache Invalidation: All mutations (`uploadDocument`, `deleteDocument`, `updateDraftProfile`, `createCorrectionDraft`, `submitApplication`) call `queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.myApplication() })`.

### 2. Centralized Query Keys (`frontend/src/services/queryKeys.ts`)
```ts
export const queryKeys = {
  // ... existing auth, system, colleges keys
  onboarding: {
    all: ['onboarding'] as const,
    myApplication: () => [...queryKeys.onboarding.all, 'myApplication'] as const,
  },
};
```

### 3. Multipart Upload & Boundary Generation
In `frontend/src/services/api.ts`, default Axios headers define `'Content-Type': 'application/json'`. When submitting `FormData`, passing `{ headers: { 'Content-Type': undefined } }` removes the default JSON header and allows the browser to automatically set `Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...`:

```ts
export async function uploadDocument(
  file: File,
  documentCategory: DocumentCategory,
  replacesDocumentId?: number | null
): Promise<DocumentResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentCategory', documentCategory);
  if (replacesDocumentId) {
    formData.append('replacesDocumentId', replacesDocumentId.toString());
  }

  const response = await apiClient.post<ApiResponse<DocumentResponse>>(
    '/college-registrations/my-application/documents',
    formData,
    {
      headers: {
        'Content-Type': undefined,
      },
    }
  );
  return response.data.data;
}
```

### 4. Safe Streaming Download Lifecycle
Calling `window.URL.revokeObjectURL(url)` immediately after dispatching a native anchor click can cause premature stream termination in Chrome, Firefox, and Safari if the download manager has not finished reading the blob stream into disk.

**Reconciled Safe Download Implementation (`frontend/src/services/onboardingService.ts`):**
```ts
export async function downloadDocument(documentId: number, originalFilename: string): Promise<void> {
  const response = await apiClient.get(
    `/college-registrations/my-application/documents/${documentId}`,
    {
      responseType: 'blob',
    }
  );

  const contentType = response.headers['content-type'] || 'application/octet-stream';
  const blob = new Blob([response.data], { type: contentType });
  const objectUrl = window.URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.setAttribute('download', originalFilename);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  // Asynchronous cleanup with 60-second delay:
  // Gives browser download manager sufficient time to complete file I/O
  // while preventing permanent memory leaks.
  setTimeout(() => {
    window.URL.revokeObjectURL(objectUrl);
  }, 60000);
}
```

### 5. Server-Confirmed Profile Updates
Optimistic updates are strictly avoided for `PUT /my-application` because:
1. `legalName` updates trigger server-side tenant name synchronization (`colleges.name = legalName`).
2. The backend trims strings and validates constraints; optimistic values could deviate from server reality.
3. If an application was frozen in another tab, the backend returns `409 APPLICATION_FROZEN_IN_REVIEW`.

**Strategy:** The profile edit form keeps inputs disabled during mutation (`isPending === true`). Upon `200 OK` server resolution, the modal closes, `queryKeys.onboarding.myApplication()` is invalidated, and `useAuthStore` updates `user.collegeName` if `legalName` was modified.

---

## G. Validation and Security Plan

### 1. Client-Side Pre-Validation vs. Server Authority
- **Security Invariant:** Client-side checks exist purely to enhance user experience and provide immediate feedback. **The backend validation layer is the sole authoritative security boundary.**
- **Profile Updates (`updateApplicationSchema`):**
  - All 10 fields trimmed before evaluation.
  - Required fields: `legalName` (1–255), `addressLine1` (1–255), `city` (1–100), `state` (1–100), `country` (1–100), `postalCode` (1–30), `contactPhone` (1–50), `affiliatedUniversityName` (1–255).
  - Optional fields: `addressLine2` (max 255), `websiteUrl` (max 255, valid URL if non-empty). Blank values converted to `null`.
- **Document Pre-Upload Validation (`documentUploadSchema`):**
  - File presence (`file !== null && file.size > 0`).
  - File size cap (`file.size <= 10 * 1024 * 1024` bytes). Immediate rejection if $> 10 \text{ MB}$.
  - Allowed extensions: `.pdf`, `.jpg`, `.jpeg`, `.png`.
  - Client-side Magic Byte Probe (reads first 8 bytes via `FileReader` to warn users early):
    - PDF: `[0x25, 0x50, 0x44, 0x46, 0x2D]` (`%PDF-`)
    - JPEG: `[0xFF, 0xD8, 0xFF]`
    - PNG: `[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]`

### 2. Tenant Isolation & Security
- **No Storage Key Exposure:** Physical filesystem keys and paths (`storageKey`) are strictly omitted from `DocumentResponse`.
- **Download Security Headers:** Verified streaming response headers (`Content-Disposition: attachment; filename="..."`, `X-Content-Type-Options: nosniff`).

---

## H. Test Plan

An automated Vitest suite (`frontend/src/test/onboarding-dashboard.test.tsx`) will be established to provide comprehensive regression coverage:

### 1. Dashboard State & Rendering Tests
1. **Initial Draft Rendering:** Renders initial draft state with unverified email banner, profile details, empty documents list, and disabled submit button.
2. **Frozen State Rendering:** When `isFrozenInReview === true` (`status === 'PENDING'`, `submittedForReviewAt !== null`), verifies all edit and upload controls are disabled and "Under Review" banner is displayed.
3. **Action Required State:** Renders `ACTION_REQUIRED` status, decoupled review feedback card from previous revision, allowance counters (e.g. `Correction 1 of 10`), and enabled `Start Correction Draft` button.
4. **Non-Permanent Rejected State:** Renders `REJECTED` status, rejection reason, resubmission allowance (e.g. `Resubmissions: 0 of 3 used`), and `Start Correction Draft` button.
5. **Permanent Rejection (403):** Renders unrecoverable rejection alert when backend returns `403 REGISTRATION_PERMANENTLY_REJECTED`.

### 2. Profile Editing Tests
6. **Server-Confirmed Profile Update:** Submits 10 profile fields to `PUT /my-application`, verifies loading state during in-flight request, and asserts that refetched server data updates the profile card.
7. **Client-Side Validation Failures:** Rejects missing legal name, invalid postal code, or over-length strings without calling backend.
8. **Server-Side Validation Mapping:** Maps backend `400 VALIDATION_ERROR` field errors to corresponding input fields.
9. **Frozen Edit Rejection:** Verifies `409 APPLICATION_FROZEN_IN_REVIEW` displays error banner and prevents form submission.

### 3. Document Management Tests
10. **Document Listing:** Displays active documents with correct category badges, formatted file sizes, and download links.
11. **Valid Document Upload:** Uploads valid PDF file with category, verifies `201 Created` response, and updates active documents table.
12. **Client-Side Size Rejection:** Rejects file $> 10 \text{ MB}$ client-side with immediate error message without dispatching network request.
13. **Client-Side Type Rejection:** Rejects disallowed file types (`.exe`, `.docx`) client-side.
14. **Magic Byte Mismatch Handling:** Handles backend `400 INVALID_DOCUMENT_FORMAT` when spoofed file is submitted.
15. **Document Replacement:** Uploads replacement document with `replacesDocumentId`, verifying replacement badge (`Replaces: ...`) in table.
16. **Active Limit Enforcement:** Displays error when uploading 6th active document (`400 DOCUMENT_LIMIT_EXCEEDED`).
17. **Safe Document Download:** Triggers binary blob download with original filename and schedules asynchronous URL revocation.
18. **Document Deletion & Predecessor Restoration:** Deletes active replacement document and verifies active document list updates.
19. **Frozen Document Operations:** Verifies upload and delete buttons are disabled or rejected with 409 when application is frozen.

### 4. Review Submission Tests
20. **Unverified Email Gate:** Disables submission button or shows error when `checklist.emailVerified === false`.
21. **Missing Mandatory Documents Gate:** Disables submission button when either `UNIVERSITY_AFFILIATION_CERTIFICATE` or `AUTHORIZED_SIGNATORY_ID` is missing.
22. **Successful Submission:** When all gates are met, opening confirmation modal and clicking submit calls `POST /submit`, freezes application, and transitions UI to `PENDING` review state.
23. **Max Resubmission Limit Exceeded:** Displays error when backend returns `400 MAX_RESUBMISSION_LIMIT_EXCEEDED`.
24. **Max Action Required Limit Exceeded:** Displays error when backend returns `400 MAX_ACTION_REQUIRED_LIMIT_EXCEEDED`.

### 5. Correction Draft Creation Tests
25. **Successful Draft Creation:** Clicking `Start Correction Draft` on `ACTION_REQUIRED` application calls `POST /correction-draft`, creates revision $v+1$, and displays editable workspace with decoupled feedback.
26. **Idempotent Draft Return:** Returns existing draft revision without error if draft is already open.

### 6. Regression & Integration Tests
27. **Route Protection (Unauthenticated):** Unauthenticated guest accessing `/onboarding-status` is redirected to `/auth/login`.
28. **Approved College Admin Navigation:** Approved college admin (`collegeApprovalStatus === 'APPROVED'`) is redirected to `/college/dashboard`.
29. **Email Verification Resend Integration:** Clicking resend verification from the onboarding checklist successfully calls `authService.resendVerification()` with active countdown.

---

## I. Reconciled File-Level Implementation Plan

The file inventory is reconciled below. **Total affected files: 17 (13 files to create, 4 files to modify).**

### 1. Files to Create (13 Files)
1. `frontend/src/services/onboardingService.ts`: Axios API service methods for all 8 onboarding endpoints and safe streaming download helper.
2. `frontend/src/hooks/useOnboarding.ts`: TanStack Query queries, mutations, cache invalidation, and `isApplicationFrozenInReview` derivation helper.
3. `frontend/src/schemas/onboardingSchema.ts`: Zod validation schemas for profile updates and file uploads.
4. `frontend/src/components/onboarding/OnboardingStatusBanner.tsx`: Top status hero banner with status badges, revision indicators, and correction draft triggers.
5. `frontend/src/components/onboarding/ReviewFeedbackCard.tsx`: Decoupled Super Admin review notes and rejection reasons display card.
6. `frontend/src/components/onboarding/OnboardingChecklistCard.tsx`: Interactive 4-step checklist with embedded email verification resend button.
7. `frontend/src/components/onboarding/CollegeProfileCard.tsx`: Profile summary card with inline edit trigger.
8. `frontend/src/components/onboarding/EditProfileModal.tsx`: Accessible dialog for editing draft profile fields.
9. `frontend/src/components/onboarding/DocumentManagementSection.tsx`: Active documents table, upload dropzone, replacement badges, and actions.
10. `frontend/src/components/onboarding/DocumentUploadModal.tsx`: Upload modal with category selection and client-side pre-validation.
11. `frontend/src/components/onboarding/SubmitApplicationModal.tsx`: Pre-submission confirmation modal enforcing freeze acknowledgement.
12. `frontend/src/components/onboarding/RevisionHistoryDrawer.tsx`: Timeline drawer showing historical revisions.
13. `frontend/src/test/onboarding-dashboard.test.tsx`: Comprehensive Vitest automated test suite covering 29 distinct scenarios.

### 2. Files to Modify (4 Files)
1. `frontend/src/types/index.ts`: Add onboarding DTO interfaces (`MyApplicationResponse`, `CurrentRevisionResponse`, `CollegeSummaryResponse`, `CollegeProfileResponse`, `ReviewFeedbackResponse`, `ResubmissionAllowanceResponse`, `OnboardingChecklistResponse`, `DocumentResponse`, `DocumentCategory`, `UpdateApplicationRequest`, `SubmitApplicationResponse`, `RevisionSummaryResponse`).
2. `frontend/src/services/queryKeys.ts`: Add `queryKeys.onboarding` factory (`myApplication`).
3. `frontend/src/routes/index.tsx`: Move `/onboarding-status` into the protected `COLLEGE_ADMIN` branch under `ProtectedRoute` and `RoleGuard` (bypassing `CollegeApprovalGuard`).
4. `frontend/src/pages/OnboardingStatusPage.tsx`: Upgrade the static status view into the interactive Restricted Dashboard coordinating all onboarding components.

---

## J. Risks, Gaps, and Dependencies

### 1. Risk Classification Matrix

| Risk / Gap | Severity | Category | Mitigation Strategy |
|:---|:---:|:---:|:---|
| **Route Redirect Loop** | `HIGH` | Routing Architecture | Route `/onboarding-status` strictly outside `CollegeApprovalGuard`. Protect with `ProtectedRoute` and `RoleGuard`. Redirect approved admins to `/college/dashboard` inside page container. |
| **Premature Object URL Revocation** | `MEDIUM` | Browser Download | Delay `revokeObjectURL` by 60 seconds via `setTimeout`, allowing download manager to complete file read before releasing memory. |
| **Multipart Header Boundary Stripping** | `MEDIUM` | Axios Configuration | Pass `{ headers: { 'Content-Type': undefined } }` when posting `FormData` so Axios does not overwrite browser multipart boundary. |
| **Premature Optimistic Updates** | `LOW` | Data Consistency | Enforce server-confirmed updates followed by query invalidation. Keep edit modal open with errors on failure. |
| **Jackson Boolean Field Deserialization** | `LOW` | Contract Reliability | Implement `isApplicationFrozenInReview` helper evaluating both `checklist.isFrozenInReview` and core revision fields (`isDraft === false`, `status === 'PENDING'`). |

---

## K. Proposed Implementation Sequence

1. **Phase 1 — Foundation:** Add TypeScript DTOs to `types/index.ts`, Zod schemas to `schemas/onboardingSchema.ts`, query keys to `queryKeys.ts`, and create `services/onboardingService.ts`.
2. **Phase 2 — State Management:** Create `hooks/useOnboarding.ts` with TanStack Query hooks, mutation handlers, and query cache invalidations.
3. **Phase 3 — UI Components & Dashboard:** Build `OnboardingStatusBanner`, `ReviewFeedbackCard`, `OnboardingChecklistCard`, `CollegeProfileCard`, `EditProfileModal`, `DocumentManagementSection`, `DocumentUploadModal`, `SubmitApplicationModal`, and `RevisionHistoryDrawer`. Upgrade `OnboardingStatusPage.tsx` and secure route nesting in `routes/index.tsx`.
4. **Phase 4 — Automated Testing & Hardening:** Implement 29 automated scenarios in `src/test/onboarding-dashboard.test.tsx`, execute full frontend regression suite (`npm test`), verify TypeScript (`tsc`), and run production build (`npm run build`).

---

## L. Measurable Acceptance Criteria

Before Module 3.3 Frontend can be considered implementation-complete, it must satisfy:
1. **API Integration:** All 8 backend endpoints successfully integrated and mapped to typed responses.
2. **State Machine Accuracy:** Deterministically renders all 7 application states (`Initial Draft`, `Frozen in Review`, `Action Required`, `Correction Draft`, `Rejected`, `Permanently Rejected`, `Approved`).
3. **Freeze Guarantee:** When `isFrozenInReview === true` or `isDraft === false`, profile editing and document upload/deletion controls are strictly disabled in the UI.
4. **Correction Draft Creation:** `Start Correction Draft` successfully initiates revision $v+1$ and displays decoupled review notes.
5. **Document Validation:** Rejects files $> 10 \text{ MB}$, empty files, or invalid file extensions client-side.
6. **Lineage Invariants:** Successfully replaces intra-draft documents and confirms deletion restores predecessor to the active set.
7. **Submission Gates:** Blocks submission if email is unverified or mandatory documents are missing; successfully submits and freezes revision when gates are met.
8. **Automated Testing:** Dedicated Vitest test suite passes with $\ge 25$ focused scenarios.
9. **Full Suite Regression:** Full frontend test suite (all test files) passes with 0 failures, 0 skipped.
10. **Build & Type Cleanliness:** TypeScript compiles with zero errors; production build succeeds cleanly.
11. **Zero Unapproved File Mutations:** Zero changes made to backend code, database migrations, ADRs, or Master Context.
