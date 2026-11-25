# Acadlytic — Phase 03, Module 3.4 Frontend Inspection & Planning Report
## Super Admin Approval Queue & Review Workflow

**Document Version:** 1.1  
**Planning Date:** 2026-11-25  
**Target Module:** Phase 03, Module 3.4 — Super Admin Approval Queue & Review Workflow (Frontend)  
**Authoritative Context Reference:** `docs/00-project-overview/ACADLYTIC_MASTER_CONTEXT.md`  
**Backend Specification Authority:** `docs/03-phase/phase-03-module-3.4-implementation-report.md` (Backend Module 3.4 APPROVED)  
**Planning Status:** INSPECTION & PLANNING ONLY — NOT APPROVED FOR IMPLEMENTATION

---

## I. Executive Summary & Module Scope

### 1. Objective
This planning document specifies the frontend architecture and implementation design for **Phase 03, Module 3.4 — Super Admin Approval Queue & Review Workflow**.

This module delivers the administrative review interface in the platform Super Admin portal, enabling authorized administrators to:
1. View, filter, and paginate the queue of prospective college registration applications awaiting institutional verification.
2. Inspect complete registration details, proposed college administrator credentials, submitted institutional revisions, and historical audit timelines.
3. Access and stream verification documents through secure, tenant-validated endpoints without exposing internal filesystem paths or storage keys.
4. Execute authoritative, transactionally locked review decisions (`APPROVE`, `REQUEST_ACTION`, and non-permanent `REJECT`) utilizing optimistic version concurrency checks (`expectedVersion`) and robust handling for stale state conflicts (`409 Conflict`).

### 2. Architectural & Governance Boundaries
- **Strict Role Isolation:** Accessible exclusively to authenticated users with the `SUPER_ADMIN` role. `COLLEGE_ADMIN` users attempting access are strictly blocked by `RoleGuard` and redirected to `/unauthorized`. Unauthenticated guests are routed to `/auth/login` by `ProtectedRoute`.
- **Backend Authority:** All decision validation, status transitions, version locking, and outbox email dispatches remain strictly within the backend domain (`CollegeReviewService`, `CollegeLifecycleService`). The frontend never mutates authoritative state optimistically.
- **Strict Concurrency Safety & Stale Recovery:** Every decision mutation provides the server-issued `concurrencyVersion` as `expectedVersion`. If another Super Admin or concurrent process updates the college record, the frontend intercepts `409 STALE_APPLICATION_VERSION`, aborts the in-flight decision submission, refetches the latest application state, informs the reviewer that the application changed, and requires fresh inspection before a new decision can be initiated.
- **Accurate Resubmission Semantics:** `resubmissionCount` strictly counts submitted correction revisions ($v_1 = 0$, $v_2 = 1$, $v_3 = 2$, $v_4 = 3$), NOT rejection events. Rejecting revision $v_4$ triggers the backend's Module 3.5 permanent rejection lifecycle.
- **Zero Module 3.5 Spanning:** Operational college activation (`colleges.status = ACTIVE`), 7-day archival, and physical file purging belong to Module 3.5. Module 3.4 Frontend interacts strictly with the approved Module 3.4 REST API endpoints.
- **Scope Restriction:** Inspection and planning only. Zero frontend source code or tests are implemented during this task.

---

## II. Existing Frontend Architecture & Reusable Assets

The Acadlytic frontend (`frontend/`) is built on React 18, Vite 5, TypeScript 5, Tailwind CSS 3, TanStack Query 5, and Zustand 5.

### 1. Existing Relevant Files
| File Path | Existing Role & Reusable Conventions |
| :--- | :--- |
| `frontend/src/routes/index.tsx` | Router definition featuring `ProtectedRoute`, `PublicOnlyRoute`, `RoleGuard`, and `CollegeApprovalGuard`. Contains the existing `/admin` route tree under `RoleGuard allowedRoles={['SUPER_ADMIN']}`. |
| `frontend/src/routes/guards/RoleGuard.tsx` | Enforces role-based permissions (`allowedRoles={['SUPER_ADMIN']}`); redirects unauthorized roles to `/unauthorized`. |
| `frontend/src/routes/guards/ProtectedRoute.tsx` | Enforces authentication; preserves target URL in location state when redirecting to `/auth/login`. |
| `frontend/src/layouts/AppLayout.tsx` | Standard application shell with responsive `Header` and collapsible `Sidebar`. |
| `frontend/src/components/layout/PageContainer.tsx` | Standard content layout container supporting responsive maxWidths (`5xl`, `7xl`), titles, and subtitles. |
| `frontend/src/components/navigation/Sidebar.tsx` | Left navigation sidebar rendering role-tailored links (`SUPER_ADMIN` vs `COLLEGE_ADMIN`). |
| `frontend/src/services/api.ts` | Reusable Axios client with `withCredentials: true`, automated `XSRF-TOKEN` cookie extraction into `X-XSRF-TOKEN` headers, single 403 CSRF token retry, and standardized `ApiError` class. |
| `frontend/src/services/queryKeys.ts` | Centralized TanStack Query key factory (`auth`, `system`, `colleges`, `onboarding`). |
| `frontend/src/types/index.ts` | Shared TypeScript contracts including `CollegeApprovalStatus`, `CollegeStatus`, `DocumentCategory`, `DocumentResponse`, and `ApiResponse<T>`. |
| `frontend/src/components/ui/` | Accessible UI primitives: `Button`, `Card`, `Modal`, `Alert`, `Table` (`TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`), `LoadingSpinner`, `ErrorState`, `Input`, `Select`, `Textarea`. |

### 2. Architectural Patterns Established in Module 3.3
- **Streaming Document Downloads:** In `onboardingService.ts`, binary file downloads use Axios with `responseType: 'blob'`, dynamic MIME extraction, invisible DOM anchor `.click()`, synchronous `anchor.remove()`, and safe 60-second delayed `window.URL.revokeObjectURL(url)` to prevent premature memory revocation during slow I/O.
- **Server-Confirmed Mutations:** TanStack Query mutations do not apply speculative optimistic state. They await the server response, invalidate relevant query cache keys, and handle structured backend errors.
- **Double Submit CSRF:** All state-changing requests (`POST /decision`) rely on automatic Axios interceptor CSRF token attachment.

---

## III. Backend API Contract Inventory

Module 3.4 Frontend interfaces with four REST endpoints exposed by `com.acadlytic.modules.colleges.controller.CollegeReviewController` (all secured with `@PreAuthorize("hasRole('SUPER_ADMIN')")`).

### 1. Review Queue Endpoint
- **Method & Path:** `GET /api/v1/super-admin/colleges/reviews`
- **Controller Method:** `CollegeReviewController.getReviewQueue(...)`
- **Backend Service:** `CollegeReviewService.getPendingReviewQueue(...)`
- **Query Parameters:**
  | Parameter | Type | Required | Default | Validation & Semantics |
  | :--- | :--- | :---: | :---: | :--- |
  | `search` | `string` | No | `null` | Substring match against college legal name, code, admin email. Trimmed; max 100 characters. `400 VALIDATION_ERROR` if > 100. |
  | `from` | `string` (ISO-8601) | No | `null` | Submission start timestamp (`Instant`). Must be $\le$ `to`. `400 INVALID_DATE_RANGE` if `from > to`. |
  | `to` | `string` (ISO-8601) | No | `null` | Submission end timestamp (`Instant`). Must be $\ge$ `from`. `400 INVALID_DATE_RANGE` if `from > to`. |
  | `page` | `number` | No | `0` | Zero-based page index. Must be $\ge 0$. `400 VALIDATION_ERROR` if $< 0$. |
  | `size` | `number` | No | `20` | Page size. Must be between 1 and 100. `400 VALIDATION_ERROR` if $< 1$ or $> 100$. |
  | `sort` | `string` | No | `submittedForReviewAt,asc` | Sort expression in format `property,direction`. Whitelisted properties: `submittedForReviewAt`, `legalName`, `createdAt`. Direction: `asc` or `desc`. Backend automatically appends secondary tie-breaker `.and(Sort.by(Sort.Direction.ASC, "id"))`. `400 INVALID_SORT_PROPERTY` if property not in whitelist. |
- **Success Response (200 OK):** `ApiResponse<PageResponse<ReviewQueueItemResponse>>`
  ```json
  {
    "success": true,
    "message": "Review queue retrieved successfully.",
    "data": {
      "content": [
        {
          "collegeId": 10,
          "collegeCode": "HIT-4421",
          "legalName": "Horizon Institute of Technology",
          "registrationId": 101,
          "versionNumber": 1,
          "status": "PENDING",
          "submittedForReviewAt": "2026-11-20T10:00:00Z",
          "adminName": "John Doe",
          "adminEmail": "admin@horizon.edu",
          "resubmissionCount": 0,
          "actionRequiredCount": 0,
          "documentCount": 3
        }
      ],
      "page": 0,
      "size": 20,
      "totalElements": 1,
      "totalPages": 1,
      "last": true
    }
  }
  ```
- **Error Responses:**
  - `400 BAD_REQUEST`: `VALIDATION_ERROR` (search > 100 chars, page < 0, size not in 1..100); `INVALID_DATE_RANGE` (`from > to`); `INVALID_SORT_PROPERTY` (non-whitelisted sort field).
  - `401 UNAUTHORIZED`: Unauthenticated session (`AUTH_UNAUTHENTICATED`).
  - `403 FORBIDDEN`: Insufficient role (`ACCESS_DENIED`).

### 2. Application Detail Inspection Endpoint
- **Method & Path:** `GET /api/v1/super-admin/colleges/reviews/{collegeId}`
- **Controller Method:** `CollegeReviewController.getReviewDetail(@PathVariable("collegeId") Long collegeId)`
- **Backend Service:** `CollegeReviewService.getReviewDetail(Long collegeId)`
- **Success Response (200 OK):** `ApiResponse<CollegeReviewDetailResponse>`
  ```json
  {
    "success": true,
    "message": "Review detail retrieved successfully.",
    "data": {
      "college": {
        "id": 10,
        "name": "Horizon Institute of Technology",
        "code": "HIT-4421",
        "approvalStatus": "PENDING",
        "status": "PENDING_VERIFICATION",
        "permanentlyRejected": false,
        "resubmissionCount": 0,
        "actionRequiredCount": 0,
        "createdAt": "2026-11-20T08:00:00Z"
      },
      "adminUser": {
        "id": 42,
        "email": "admin@horizon.edu",
        "firstName": "John",
        "lastName": "Doe",
        "emailVerifiedAt": "2026-11-20T09:00:00Z",
        "createdAt": "2026-11-20T08:00:00Z"
      },
      "submittedRevision": {
        "id": 101,
        "versionNumber": 1,
        "status": "PENDING",
        "legalName": "Horizon Institute of Technology",
        "addressLine1": "123 Education Lane",
        "addressLine2": "Suite 400",
        "city": "Metropolis",
        "state": "NY",
        "country": "United States",
        "postalCode": "10001",
        "websiteUrl": "https://horizon.edu",
        "contactPhone": "+1-555-0199",
        "affiliatedUniversityName": "State Technical University",
        "submittedForReviewAt": "2026-11-20T10:00:00Z"
      },
      "activeDocuments": [
        {
          "id": 201,
          "registrationId": 101,
          "documentCategory": "INSTITUTION_REGISTRATION_PROOF",
          "originalFilename": "registration_charter.pdf",
          "mimeType": "application/pdf",
          "fileSizeBytes": 1048576,
          "sha256Checksum": "a1b2c3d4...",
          "replacesDocumentId": null,
          "createdAt": "2026-11-20T09:30:00Z"
        }
      ],
      "revisionHistory": [
        {
          "id": 101,
          "versionNumber": 1,
          "status": "PENDING",
          "legalName": "Horizon Institute of Technology",
          "submittedForReviewAt": "2026-11-20T10:00:00Z",
          "reviewerUserId": null,
          "reviewNotes": null,
          "rejectionReason": null,
          "isPermanentRejection": false,
          "reviewedAt": null,
          "createdAt": "2026-11-20T08:00:00Z"
        }
      ],
      "concurrencyVersion": 0
    }
  }
  ```
- **Error Responses:**
  - `401 UNAUTHORIZED`: Unauthenticated session (`AUTH_UNAUTHENTICATED`).
  - `403 FORBIDDEN`: Missing `SUPER_ADMIN` role (`ACCESS_DENIED`).
  - `404 NOT_FOUND`: `COLLEGE_NOT_FOUND` (Target college does not exist).
  - `409 CONFLICT`: `APPLICATION_NOT_AWAITING_REVIEW` (College or current revision is not in pending review state, permanently rejected, or archived).

### 3. Document Streaming Download Endpoint
- **Method & Path:** `GET /api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}`
- **Controller Method:** `CollegeReviewController.downloadDocument(@PathVariable("collegeId") Long collegeId, @PathVariable("documentId") Long documentId)`
- **Backend Service:** `CollegeReviewService.downloadDocument(Long collegeId, Long documentId)`
- **Success Response (200 OK):** Streaming binary resource (`application/octet-stream` or native MIME).
  - Headers:
    - `Content-Disposition: attachment; filename="<originalFilename>"`
    - `X-Content-Type-Options: nosniff`
    - `Cache-Control: private, no-cache, no-store, must-revalidate`
- **Error Responses:**
  - `401 UNAUTHORIZED`: Unauthenticated session.
  - `403 FORBIDDEN`: Missing `SUPER_ADMIN` role.
  - `404 NOT_FOUND`: `DOCUMENT_NOT_FOUND` or `COLLEGE_NOT_FOUND` (4-step ownership validation guarantees zero cross-tenant disclosure).

### 4. Review Decision Endpoint
- **Method & Path:** `POST /api/v1/super-admin/colleges/reviews/{collegeId}/decision`
- **Controller Method:** `CollegeReviewController.recordDecision(@PathVariable("collegeId") Long collegeId, @Valid @RequestBody ReviewDecisionRequest request)`
- **Backend Service:** `CollegeReviewService.recordDecision(Long collegeId, ReviewDecisionRequest request)`
- **Request Body (`ReviewDecisionRequest`):**
  ```json
  {
    "action": "APPROVE",
    "expectedVersion": 0,
    "reviewNotes": "All submitted accreditation documentation verified successfully.",
    "rejectionReason": null
  }
  ```
- **Validation Rules:**
  - `action`: Required, one of `'APPROVE'`, `'REQUEST_ACTION'`, `'REJECT'`.
  - `expectedVersion`: Required, non-negative integer ($\ge 0$). Must match server-issued `concurrencyVersion`.
  - `reviewNotes`: Optional for `APPROVE` (max 2000 chars); Mandatory for `REQUEST_ACTION` (10..2000 chars).
  - `rejectionReason`: Mandatory for `REJECT` (10..2000 chars).
- **Success Response (200 OK):** `ApiResponse<ReviewDecisionResponse>`
  ```json
  {
    "success": true,
    "message": "Application review decision recorded successfully.",
    "data": {
      "collegeId": 10,
      "registrationId": 101,
      "versionNumber": 1,
      "approvalStatus": "APPROVED",
      "reviewedAt": "2026-11-25T09:00:00Z",
      "reviewerUserId": 1
    }
  }
  ```
- **Error Responses:**
  - `400 BAD_REQUEST`:
    - `VALIDATION_ERROR` (missing action/version, notes < 10 chars for REQUEST_ACTION, reason < 10 chars for REJECT, length > 2000).
    - `MAX_ACTION_REQUIRED_LIMIT_EXCEEDED` (if `college.actionRequiredCount >= 10`).
  - `401 UNAUTHORIZED`: Unauthenticated session (`AUTH_UNAUTHENTICATED`).
  - `403 FORBIDDEN`: Missing `SUPER_ADMIN` role (`ACCESS_DENIED`).
  - `404 NOT_FOUND`: `COLLEGE_NOT_FOUND`.
  - `409 CONFLICT`:
    - `STALE_APPLICATION_VERSION` (`college.getVersion() !== expectedVersion`).
    - `APPLICATION_NOT_AWAITING_REVIEW` (application already decided or revised by college).

---

## IV. UI & Page Design Specifications

### 1. Super Admin Review Queue Page (`/admin/colleges/reviews`)
- **Page Container:** `PageContainer` with `maxWidth="7xl"`, title `"College Registration Approval Queue"`, subtitle `"Inspect prospective institutions awaiting compliance review and administrative verification."`
- **Filters & Search Toolbar (`ReviewQueueFilters`):**
  - Search input: Text filter bound to `search` query parameter (debounced 300ms, max 100 chars, clear button).
  - Date Range picker: ISO-8601 date inputs for `from` and `to`. Client validation ensures `from <= to` before dispatching query.
  - Sorting selector: Dropdown selecting sort property (`submittedForReviewAt`, `legalName`, `createdAt`) and direction (`asc`, `desc`). Default: `submittedForReviewAt,asc` (oldest pending first).
  - Page Size selector: Options `[10, 20, 50]`, default `20`.
  - **Deterministic Pagination Reset:** Changing `search`, `from`, `to`, or `sort` immediately resets `page` to `0` (UI page 1).
- **Review Queue Table (`ReviewQueueTable`):**
  - Columns:
    1. **Institution:** Legal college name, immutable permanent code (`HIT-4421`).
    2. **Revision:** Revision number badge (`v1`, `v2`, etc.), revision status (`PENDING`).
    3. **Submitted At:** Relative and formatted absolute timestamp (`submittedForReviewAt`).
    4. **Administrator:** Admin name (`adminName`) and email (`adminEmail`).
    5. **Correction Resubmissions:** Badge displaying `resubmissionCount / 3` (e.g. `Initial (0/3)` for $v_1$, `Correction 1/3` for $v_2$, `Correction 2/3` for $v_3$, `Correction 3/3` for $v_4$).
    6. **Action Required Cycles:** Badge displaying `actionRequiredCount / 10`.
    7. **Active Documents:** Count badge (`documentCount` active documents).
    8. **Action:** "Review Application" button navigating to `/admin/colleges/reviews/:collegeId`.
- **Pagination Controls:**
  - Previous / Next buttons, page number indicators, total records count (`Showing X to Y of Z applications`).
- **States:**
  - **Loading:** Renders `LoadingSpinner` with `"Loading pending application queue..."`.
  - **Empty Queue:** Informational card with icon: `"No applications currently pending review."`
  - **Filter Empty State:** `"No applications match your search criteria."` with `"Reset Filters"` action.
  - **Error State:** Renders `ErrorState` with retry button.

### 2. Application Review Detail Page (`/admin/colleges/reviews/:collegeId`)
- **Page Container:** `PageContainer` with `maxWidth="7xl"`, breadcrumb navigation (`← Back to Approval Queue`), college title, permanent code, and revision status badge.
- **Top Summary Banner (`CollegeReviewHeader`):**
  - College legal name, code, approval status badge (`PENDING`), creation date, and `concurrencyVersion` indicator.
  - Status indicators for resubmissions (`Resubmission Count: N / 3`) and correction cycles (`Action Required Count: M / 10`).
- **Layout Grid (2 Columns on Desktop, 1 Column on Mobile):**
  - **Left Column (Primary Review Context):**
    1. **Submitted Revision Profile (`SubmittedRevisionCard`):** Full snapshot of institutional data for the active submitted revision (Legal Name, Affiliated University, Contact Phone, Website with external link, Campus Address).
    2. **Active Verification Documents Table (`ReviewDocumentsTable`):**
       - Displays only active, non-superseded documents.
       - Category badge (`INSTITUTION_REGISTRATION_PROOF`, etc.).
       - Original filename, formatted file size (e.g. `1.05 MB`), upload timestamp.
       - Cryptographic checksum (`sha256Checksum`): Exposed via an optional hover tooltip or expandable hash details for audit verification without cluttering primary table columns.
       - Action: "Download Document" button calling streaming download service.
    3. **Revision History Timeline (`ReviewHistoryTimelineCard`):**
       - Expandable/collapsible timeline showing all past revisions ($v_1, v_2\dots$).
       - Displays submission dates, review decisions, past reviewer IDs, and past reviewer notes / rejection reasons.
  - **Right Column (Administrative Contact & Actions):**
    1. **Proposed College Administrator Card (`ReviewAdminUserCard`):** Administrator name, verified email address, email verification timestamp badge.
    2. **Review Decision Panel (`ReviewDecisionPanel`):**
       - Sticky action card containing the 3 permitted review actions:
         - **"Approve Application" (Green / Primary):** Opens `ApproveDecisionModal`.
         - **"Request Corrections" (Amber / Warning):** Opens `RequestActionModal`. Disabled if `actionRequiredCount >= 10`.
         - **"Reject Application" (Rose / Danger):** Opens `RejectApplicationModal`.
       - Explanatory notice detailing that review decisions update institutional verification state, are recorded in immutable audit logs, and trigger automated outbox email notifications to the college administrator.

---

## V. Decision Workflows, Semantics & Concurrency Recovery

### 1. `APPROVE` Workflow (`ApproveDecisionModal`)
- **Semantics:** Approves the college onboarding application. Transitions registration revision status to `APPROVED` and college approval status to `APPROVED`.
- **Backend Boundary:** Does **not** activate operational features (`colleges.status = ACTIVE`); operational college activation and activation email dispatch are executed transactionally by `CollegeLifecycleService` in Module 3.5.
- **Modal Content:**
  - Title: `"Approve College Registration"`
  - Description: `"Confirm administrative approval for this institution. Approval transitions the application to APPROVED and triggers operational activation in Module 3.5."`
  - Optional Review Notes textarea (0..2000 chars).
- **Execution:** Calls `recordDecision(collegeId, { action: 'APPROVE', expectedVersion, reviewNotes })`.
- **Post-Decision:** Navigates back to `/admin/colleges/reviews` with success banner.

### 2. `REQUEST_ACTION` Workflow (`RequestActionModal`)
- **Semantics:** Defers approval and requests specific corrections from the college administrator. Transitions revision status to `ACTION_REQUIRED` and college approval status to `ACTION_REQUIRED`. Unlocks unsubmitted draft revision $v+1$ for the college admin.
- **Backend Boundary:** Does **not** increment `actionRequiredCount` (Module 3.3 increments it upon resubmission). Enforces `actionRequiredCount < 10`.
- **Pre-check:** If `college.actionRequiredCount >= 10`, the "Request Corrections" button is disabled with tooltip: `"Maximum 10 correction rounds exceeded. Application must be approved or rejected."`
- **Modal Content:**
  - Title: `"Request Application Corrections"`
  - Description: `"Specify required corrections or missing documentation. The college administrator will be notified and granted access to submit an updated revision."`
  - Mandatory Review Notes textarea with character counter (10..2000 chars required). Form validation via Zod.
- **Execution:** Calls `recordDecision(collegeId, { action: 'REQUEST_ACTION', expectedVersion, reviewNotes })`.
- **Post-Decision:** Navigates back to `/admin/colleges/reviews` with success banner.

### 3. Non-Permanent `REJECT` Workflow (`RejectApplicationModal`)
- **Semantics:** Rejects the current submitted revision. Sets revision status to `REJECTED` and college approval status to `REJECTED`.
- **Backend Boundary:**
  - If `college.resubmissionCount < 3`: Non-permanent rejection. The college administrator retains the right to create and submit another correction revision (up to $v_4$).
  - If `college.resubmissionCount >= 3`: Final rejection of revision $v_4$. The backend (`CollegeLifecycleService.onPermanentRejection`) executes the permanent rejection lifecycle: marks `permanently_rejected = TRUE`, deactivates college and user accounts, releases unique code and email reservations, revokes sessions, and enqueues permanent rejection notice. The frontend accurately reflects this backend lifecycle rule.
- **Modal Content:**
  - Title: `"Reject College Application"`
  - Mandatory Rejection Reason textarea with character counter (10..2000 chars required). Form validation via Zod.
  - Dynamic Allowance Notice:
    - If `resubmissionCount < 3`: Informational notice: `"This is correction revision v{versionNumber} (Resubmission count: {resubmissionCount} of 3). The college administrator will be permitted to submit up to 3 correction revisions before permanent rejection."`
    - If `resubmissionCount >= 3`: High-priority Caution Alert: `"Final Rejection Warning: This institution is at the maximum resubmission limit (Count: 3 of 3). Rejection will trigger permanent institutional rejection, account deactivation, and release of the reserved college code in the backend."`
- **Execution:** Calls `recordDecision(collegeId, { action: 'REJECT', expectedVersion, rejectionReason })`.
- **Post-Decision:** Navigates back to `/admin/colleges/reviews` with success banner.

### 4. Hardened Stale-Version (`409 STALE_APPLICATION_VERSION`) Recovery Protocol
When two administrators review concurrently or the college state changes while under review:
1. **Decision Aborted:** The in-flight decision submission is immediately aborted and the decision modal is closed.
2. **Automatic State Synchronization:** The frontend triggers `refetch()` on `queryKeys.reviews.detail(collegeId)` to retrieve the latest authoritative data and new `concurrencyVersion`.
3. **Reviewer Notice:** The page renders a high-priority Alert at the top of the review detail:
   `"Application State Changed: This application was updated by another administrator or process while you were viewing it. The page has been refreshed with the latest data. Please inspect the updated details before taking action."`
4. **No Silent Resubmission:** The frontend **strictly prohibits** silently updating `expectedVersion` and resubmitting the original decision. The reviewer must review the refreshed page content and initiate a fresh decision confirmation.

### 5. Ineligible State (`409 APPLICATION_NOT_AWAITING_REVIEW`) Recovery
- If an application was already decided or archived, opening the detail page or submitting a decision returns `409 APPLICATION_NOT_AWAITING_REVIEW`.
- The page renders a prominent Notice banner: `"Application No Longer Awaiting Review. This application has already been processed or is no longer in pending status."` with a primary button `"Return to Approval Queue"`.

---

## VI. Routing & Role Authorization Architecture

### 1. Route Hierarchy
The two review routes will be nested inside the existing protected `/admin` route tree in `frontend/src/routes/index.tsx`:
```tsx
// Protected Super Admin Portal Routes
{
  path: 'admin',
  element: <ProtectedRoute />,
  children: [
    {
      element: <RoleGuard allowedRoles={['SUPER_ADMIN']} />,
      children: [
        {
          element: <AppLayout />,
          children: [
            {
              path: 'dashboard',
              element: <SuperAdminDashboardPage />,
            },
            {
              path: 'colleges',
              element: <SuperAdminDashboardPage />,
            },
            // Phase 03 Module 3.4 Review Workflow Routes
            {
              path: 'colleges/reviews',
              element: <SuperAdminReviewQueuePage />,
            },
            {
              path: 'colleges/reviews/:collegeId',
              element: <CollegeReviewDetailPage />,
            },
          ],
        },
      ],
    },
  ],
},
```

### 2. Guard Enforcement
- **Unauthenticated Users:** Navigating to `/admin/colleges/reviews` or `/admin/colleges/reviews/:collegeId` triggers `ProtectedRoute`, redirecting to `/auth/login` and preserving target URL in `location.state.from`.
- **College Administrators:** Navigating to `/admin/*` triggers `RoleGuard allowedRoles={['SUPER_ADMIN']}`, redirecting immediately to `/unauthorized`.
- **Sidebar Integration:** Update `Sidebar.tsx` to include an `"Approval Queue"` NavLink pointing to `/admin/colleges/reviews` with a `ClipboardCheck` icon for Super Admin users.

---

## VII. Services, Hooks, Schemas & State Management

### 1. API Service Layer (`frontend/src/services/reviewService.ts`)
```ts
export const reviewService = {
  // GET /api/v1/super-admin/colleges/reviews
  async getReviewQueue(params?: ReviewQueueFilterParams): Promise<PageResponse<ReviewQueueItemResponse>>;

  // GET /api/v1/super-admin/colleges/reviews/{collegeId}
  async getReviewDetail(collegeId: number): Promise<CollegeReviewDetailResponse>;

  // GET /api/v1/super-admin/colleges/reviews/{collegeId}/documents/{documentId}
  async downloadDocument(collegeId: number, documentId: number, originalFilename: string): Promise<void>;

  // POST /api/v1/super-admin/colleges/reviews/{collegeId}/decision
  async recordDecision(collegeId: number, request: ReviewDecisionRequest): Promise<ReviewDecisionResponse>;
};
```
- Safe streaming download mirrors `onboardingService.downloadDocument`: retrieves binary blob, triggers temporary anchor download, and schedules 60-second delayed memory revocation via `window.URL.revokeObjectURL(url)`.

### 2. TanStack Query Keys (`frontend/src/services/queryKeys.ts`)
Add `reviews` factory with dedicated `queueRoot` prefix:
```ts
reviews: {
  all: ['reviews'] as const,
  queueRoot: () => [...queryKeys.reviews.all, 'queue'] as const,
  queue: (params?: ReviewQueueFilterParams) =>
    [...queryKeys.reviews.queueRoot(), params] as const,
  detail: (collegeId: number) =>
    [...queryKeys.reviews.all, 'detail', collegeId] as const,
},
```

### 3. TanStack Query Hooks (`frontend/src/hooks/useCollegeReview.ts`)
- `useReviewQueue(params: ReviewQueueFilterParams)`:
  - Query hook wrapping `reviewService.getReviewQueue`.
  - `staleTime: 15000` (15s freshness).
  - Keeps previous data while fetching new pages/filters (`placeholderData: keepPreviousData`).
- `useReviewDetail(collegeId: number)`:
  - Query hook wrapping `reviewService.getReviewDetail`.
  - `staleTime: 30000`.
  - Excludes 401, 403, 404, and 409 from automated retries.
- `useRecordDecision(collegeId: number)`:
  - Mutation hook wrapping `reviewService.recordDecision`.
  - On success:
    - Invalidates the complete queue prefix: `queryClient.invalidateQueries({ queryKey: queryKeys.reviews.queueRoot() })`.
    - Explicitly invalidates target detail: `queryClient.invalidateQueries({ queryKey: queryKeys.reviews.detail(collegeId) })`.
    - Avoids broad unneeded cache invalidations.

### 4. Zod Validation Schemas (`frontend/src/schemas/reviewSchema.ts`)
- `reviewDecisionSchema`:
  - `action`: Enum `['APPROVE', 'REQUEST_ACTION', 'REJECT']`.
  - `expectedVersion`: Non-negative integer.
  - `reviewNotes`: Optional for `APPROVE` (max 2000 chars); Mandatory for `REQUEST_ACTION` (10..2000 chars trimmed).
  - `rejectionReason`: Mandatory for `REJECT` (10..2000 chars trimmed).

---

## VIII. Reconciled File Inventory

The implementation requires **22 total affected files**: 18 created and 4 modified.

### A. Proposed Created Files (18 Files)
| # | File Path | Estimated Lines | Responsibility |
|---|-----------|:---------------:|----------------|
| 1 | `frontend/src/schemas/reviewSchema.ts` | 65 | Zod validation schemas for `APPROVE`, `REQUEST_ACTION`, and `REJECT` decisions. |
| 2 | `frontend/src/services/reviewService.ts` | 130 | Axios client methods for review queue, detail inspection, streaming download, and decision recording. |
| 3 | `frontend/src/hooks/useCollegeReview.ts` | 140 | TanStack Query hooks (`useReviewQueue`, `useReviewDetail`, `useRecordDecision`) with targeted `queueRoot` cache invalidation. |
| 4 | `frontend/src/pages/admin/SuperAdminReviewQueuePage.tsx` | 220 | Review queue listing page with debounced search, date filters, sorting, pagination, and empty/error states. |
| 5 | `frontend/src/pages/admin/CollegeReviewDetailPage.tsx` | 260 | Complete application review detail view integrating domain cards, documents table, history, decision panel, and stale conflict alerts. |
| 6 | `frontend/src/components/review/ReviewQueueTable.tsx` | 160 | Queue data table rendering applicant metadata, version badges, resubmission counters, document count, and review action link. |
| 7 | `frontend/src/components/review/ReviewQueueFilters.tsx` | 140 | Filter toolbar containing search input, date pickers (`from`, `to`), sort dropdown, and page size selector. |
| 8 | `frontend/src/components/review/CollegeReviewHeader.tsx` | 110 | Top summary banner displaying college metadata, permanent code, revision badge, version token, and resubmission counters. |
| 9 | `frontend/src/components/review/SubmittedRevisionCard.tsx` | 120 | Card presenting institutional data for the submitted revision (Legal name, address, university affiliation, contact phone, website). |
| 10 | `frontend/src/components/review/ReviewAdminUserCard.tsx` | 95 | Card presenting proposed administrator credentials, email address, and email verification badge. |
| 11 | `frontend/src/components/review/ReviewDocumentsTable.tsx` | 130 | Active verification documents table with category badges, file sizes, optional checksum tooltip, and safe download actions. |
| 12 | `frontend/src/components/review/ReviewHistoryTimelineCard.tsx` | 130 | Audit history timeline of past revisions ($v_1, v_2\dots$) with outcomes, reviewer IDs, notes, and rejection reasons. |
| 13 | `frontend/src/components/review/ReviewDecisionPanel.tsx` | 110 | Sticky action card containing "Approve Application", "Request Corrections", and "Reject Application" buttons with limit notices. |
| 14 | `frontend/src/components/review/ApproveDecisionModal.tsx` | 95 | Approval confirmation modal with optional review notes textarea and submission lock. |
| 15 | `frontend/src/components/review/RequestActionModal.tsx` | 130 | Correction request modal form with mandatory 10–2000 character review notes and character counter. |
| 16 | `frontend/src/components/review/RejectApplicationModal.tsx` | 140 | Rejection modal form with mandatory 10–2000 character reason and dynamic resubmission count warning. |
| 17 | `frontend/src/components/review/index.ts` | 16 | Barrel export cleanly encapsulating all 11 review domain components. |
| 18 | `frontend/src/test/super-admin-review.test.tsx` | 800 | Comprehensive Vitest suite ($\ge 25$ scenarios) covering queue, detail, download, decisions, and hardened concurrency recovery. |

### B. Proposed Modified Files (4 Files)
| # | File Path | Estimated Diff | Responsibility |
|---|-----------|:--------------:|----------------|
| 1 | `frontend/src/types/index.ts` | +75 lines | Add `PageResponse<T>`, `ReviewQueueItemResponse`, `CollegeReviewDetailResponse`, `CollegeReviewSummaryResponse`, `ReviewAdminUserResponse`, `SubmittedRevisionResponse`, `ReviewHistoryItemResponse`, `ReviewDecisionAction`, `ReviewDecisionRequest`, `ReviewDecisionResponse`, `ReviewQueueFilterParams`. |
| 2 | `frontend/src/services/queryKeys.ts` | +12 lines | Add `queryKeys.reviews` factory with dedicated `queueRoot` prefix. |
| 3 | `frontend/src/routes/index.tsx` | +15 lines | Mount `/admin/colleges/reviews` and `/admin/colleges/reviews/:collegeId` under `ProtectedRoute` and `RoleGuard allowedRoles={['SUPER_ADMIN']}`. |
| 4 | `frontend/src/components/navigation/Sidebar.tsx` | +8 lines | Add `"Approval Queue"` NavLink under Super Admin navigation menu. |

---

## IX. Comprehensive Verification & Test Plan

Automated testing will be authored in `frontend/src/test/super-admin-review.test.tsx` using Vitest and React Testing Library, targeting at least 25 integration scenarios.

### 1. Test Scenarios Breakdown
1. **Route & Guard Protection:**
   - Redirects unauthenticated user navigating to `/admin/colleges/reviews` to `/auth/login`.
   - Redirects authenticated `COLLEGE_ADMIN` to `/unauthorized`.
   - Allows authenticated `SUPER_ADMIN` to access queue and detail pages.
2. **Review Queue Loading & Presentation:**
   - Renders pending queue table with college legal name, code, revision number, admin contact, and active document count.
   - Renders loading spinner during initial query fetch.
   - Renders empty state card when queue has 0 pending applications.
   - Renders filter empty state when search yields no matches.
   - Renders error state with retry button on API failure.
3. **Queue Filtering, Sorting & Deterministic Pagination Reset:**
   - Dispatches search query parameter on debounced input change and resets page to 0.
   - Dispatches date range parameters (`from`, `to`) when valid and resets page to 0.
   - Displays client error when `from > to` and blocks request.
   - Updates sort parameter when sort dropdown changes and resets page to 0.
   - Navigates pages and updates `page` parameter.
4. **Application Detail Inspection:**
   - Navigates from queue row to `/admin/colleges/reviews/:collegeId`.
   - Renders college summary card, permanent code, and version badge.
   - Renders proposed administrator profile card with email verification status.
   - Renders submitted revision details (address, university affiliation, contact phone).
   - Renders active verification documents table excluding superseded files.
   - Renders revision history audit trail timeline ($v_1, v_2\dots$).
   - Handles `404 COLLEGE_NOT_FOUND` with appropriate error alert.
   - Handles `409 APPLICATION_NOT_AWAITING_REVIEW` with warning and back-to-queue action.
5. **Document Inspection & Streaming Download:**
   - Triggers `reviewService.downloadDocument(collegeId, documentId, filename)` on download button click.
   - Verifies binary download trigger without exposing internal storage keys.
6. **Decision Workflow — `APPROVE`:**
   - Opens `ApproveDecisionModal` with clean initial state.
   - Submits `APPROVE` decision with `expectedVersion` and optional notes.
   - Invalidates `queueRoot` and detail query caches on success.
   - Navigates back to queue with success notification.
7. **Decision Workflow — `REQUEST_ACTION`:**
   - Opens `RequestActionModal`.
   - Rejects submission client-side if review notes are < 10 characters.
   - Enforces 2000 character maximum length.
   - Disables "Request Corrections" button when `actionRequiredCount >= 10`.
   - Submits `REQUEST_ACTION` payload and verifies `queueRoot` invalidation.
8. **Decision Workflow — `REJECT`:**
   - Opens `RejectApplicationModal`.
   - Rejects submission client-side if rejection reason is < 10 characters.
   - Displays dynamic resubmission warning for non-permanent rejection ($N < 3$).
   - Displays final permanent rejection warning when $N \ge 3$.
   - Submits `REJECT` payload and invalidates `queueRoot`.
9. **Hardened Stale-Version (409) Recovery:**
   - Intercepts `409 STALE_APPLICATION_VERSION` on decision POST.
   - Aborts decision submission, closes modal, and triggers `refetch()` for application detail.
   - Displays prominent page-level alert informing reviewer that application changed.
   - Confirms that original decision is NOT silently resubmitted and requires fresh reviewer action.
10. **Duplicate Submission Protection:**
    - Disables decision buttons and displays loading indicator while mutation is in flight.

### 2. Regression Invariants
- Baseline 110 tests across 11 test files must continue to pass without regression.
- Total test count post-implementation will reach $\ge 135$ passing tests across 12 test files.
- TypeScript compilation (`tsc -b`) must pass with 0 errors.
- Production build (`npm run build`) must succeed cleanly.

---

## X. Risk Analysis & Technical Mitigations

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Concurrent Decision Race Condition** | Two Super Admins review the same college simultaneously; one approves while the other requests action. | Backend enforces optimistic version check against `@Version`. Frontend catches `409 STALE_APPLICATION_VERSION`, aborts modal submission, refetches fresh state, displays clear page alert, and requires fresh inspection before retrying. |
| **Ineligible Application Review Attempt** | Super Admin attempts to review an application that is no longer pending. | Backend returns `409 APPLICATION_NOT_AWAITING_REVIEW`. Frontend renders clear contextual message explaining state change and provides immediate navigation back to queue. |
| **Accidental Double Click on Decision** | Duplicate HTTP requests sent to `/decision`. | Modal submit buttons enforce `disabled={isPending}` with loading spinner; mutation hook tracks active state. |
| **Exceeding Action Required Limit (10 Rounds)** | Reviewer requests action on a college with 10 rounds, triggering backend 400. | Frontend checks `actionRequiredCount >= 10` and disables "Request Corrections" button with explanatory tooltip before modal is opened. |
| **Large Queue Memory / Render Lag** | Rendering hundreds of queue items in DOM. | Backend enforces bounded pagination (max 100); frontend defaults to 20 items per page with standard server-side pagination. |
| **Blob URL Memory Leak** | Repeated document downloads consume browser heap. | `reviewService.downloadDocument` implements 60-second delayed `URL.revokeObjectURL(url)` cleanup. |

---

## XI. Staged Implementation Plan (Post-Approval Only)

Upon formal user approval of this planning document, implementation will execute across **6 sequential stages**:

- **Stage 1: Types & Query Key Foundation:** Add review DTOs and filters to `types/index.ts`; add `reviews` key factory with `queueRoot` prefix to `services/queryKeys.ts`.
- **Stage 2: Validation Schemas & API Service:** Author `reviewSchema.ts`; author `reviewService.ts` with all 4 endpoints and delayed blob download cleanup.
- **Stage 3: TanStack Query Hooks:** Author `useCollegeReview.ts` with `useReviewQueue`, `useReviewDetail`, and `useRecordDecision` with targeted `queueRoot` and detail cache invalidations.
- **Stage 4: UI Domain Components:** Author all 11 modular domain components in `components/review/` (`ReviewQueueTable`, `ReviewQueueFilters`, `CollegeReviewHeader`, `SubmittedRevisionCard`, `ReviewAdminUserCard`, `ReviewDocumentsTable`, `ReviewHistoryTimelineCard`, `ReviewDecisionPanel`, `ApproveDecisionModal`, `RequestActionModal`, `RejectApplicationModal`) and barrel export `index.ts`.
- **Stage 5: Pages, Routing & Navigation:** Author `SuperAdminReviewQueuePage.tsx` and `CollegeReviewDetailPage.tsx`; mount routes in `routes/index.tsx`; update `Sidebar.tsx`.
- **Stage 6: Automated Testing & Verification:** Author `super-admin-review.test.tsx` ($\ge 25$ tests); execute Vitest suite, TypeScript compilation (`tsc -b`), and production build (`npm run build`); compile final implementation report.

---

## XII. Confirmation of Non-Implementation

In strict adherence to governance instructions:
- **No implementation code has been authored or committed.**
- **No backend code, database migrations, or ADRs were modified.**
- **Module 3.3 implementation remains untouched.**
- **`ACADLYTIC_MASTER_CONTEXT.md` was not modified.**
- **Module 3.4 Frontend remains `NOT_STARTED` pending your formal review and approval of this specification.**
