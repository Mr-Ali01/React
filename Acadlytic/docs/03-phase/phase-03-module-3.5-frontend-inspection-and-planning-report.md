# Acadlytic — Phase 03, Module 3.5 Frontend Inspection & Planning Report
## Approval Lifecycle, College Activation & Revisions (Frontend)

**Document Reference:** `docs/03-phase/phase-03-module-3.5-frontend-inspection-and-planning-report.md`  
**Target Module:** Phase 03, Module 3.5 — Approval Lifecycle, College Activation & Revisions (Frontend)  
**Project Root:** `C:\React\Acadlytic`  
**Execution Mode:** Strict Inspection & Planning Only (NO Implementation Authorized)  
**Planning Version:** v1.1 (Consolidated Reconciliation)  
**Timestamp:** 2026-11-25T16:30:00+05:30  
**Authoritative Context Reference:** `docs/00-project-overview/ACADLYTIC_MASTER_CONTEXT.md`  
**Backend Specification Authority:** `docs/03-phase/phase-03-module-3.5-implementation-report.md` (APPROVED)  
**Preceding Frontend Authority:** `docs/03-phase/phase-03-module-3.4-frontend-implementation-report.md` (v1.1 APPROVED)  
**Status:** PENDING PROJECT OWNER REVIEW & FORMAL APPROVAL  

---

## 1. Executive Summary

Phase 03 of the Acadlytic platform governs prospective college tenant registration, compliance document management, verification lifecycle, administrative review, and operational activation.

Backend Module 3.5 (**Approval Lifecycle, College Activation & Revisions**) was implemented and formally approved on 2026-11-24 (`237/237` passing backend tests across Testcontainers MySQL 8.0.36, Flyway schema V5). Preceding Frontend Module 3.4 (**Super Admin Approval Queue & Review Workflow**) was implemented, reconciled to v1.1, and formally approved on 2026-11-25 (`136/136` passing frontend tests across 12 test files).

This document establishes the reconciled technical architecture, component design, route flow, error mappings, and automated test strategy for **Phase 03, Module 3.5 Frontend** (Version 1.1), resolving all findings from the project owner's review.

### 1.1 Core Mission of Module 3.5 Frontend
While Module 3.4 delivers the Super Admin approval queue and review decision recording (`APPROVE`, `REQUEST_ACTION`, `REJECT`), Module 3.5 Frontend owns the **downstream operational activation lifecycle, post-approval onboarding transition, rich College Admin active dashboard, and terminal account error state experiences (`COLLEGE_SUSPENDED`, `COLLEGE_INACTIVE`, `REGISTRATION_PERMANENTLY_REJECTED`)**.

Specifically, Module 3.5 Frontend will deliver:
1. **College Admin Operational Welcome & Activation Dashboard (`/college/dashboard`):** Transform the minimal 80-line placeholder shell into a complete, institutional onboarding-complete portal displaying active status badges (`ACTIVE`, `APPROVED`, `UNLOCKED`), institutional credentials (name, permanent code, safe institutional tenancy reference), approval milestone summaries (approved revision $v_n$, approval timestamp, reviewer notes), and the Phase 04+ institutional readiness roadmap.
2. **Approved Registration & Document Dossier Inspector:** An encapsulated read-only modal on `/college/dashboard` enabling the active College Admin to review their permanently approved profile details, historical revision timeline ($v_1 \dots v_n$), and download compliance documents with safe streaming blob URLs.
3. **Live Approval Transition & Route Redirection:** Reactive cache synchronization between restricted onboarding and active dashboard views, enabling seamless client-side transition when an application is approved while strictly eliminating redirect loops.
4. **Terminal Account State Handling:** Hardened error recovery and dedicated UI status cards for `COLLEGE_SUSPENDED` (account suspended), `COLLEGE_INACTIVE` (account archived/inactive), and `REGISTRATION_PERMANENTLY_REJECTED` (three-strikes exhaustion).
5. **Route Guard Hardening:** Hardening `CollegeApprovalGuard.tsx` to verify `user.collegeApprovalStatus === 'APPROVED'`, `user.collegeStatus === 'ACTIVE'`, and `user.managementUnlocked === true`, preventing unauthorized access while eliminating redirect cycles.

### 1.2 Summary of Reconciled Findings in Version 1.1
This Version 1.1 report incorporates comprehensive technical reconciliations based on deep inspection of the repository source code:
1. **Permanent Rejection vs Session Revocation Lifecycle:** Traced the complete execution sequence from database session deletion to Spring Security `ApiAuthenticationEntryPoint` (401 `AUTH_UNAUTHENTICATED`), Axios interceptor login redirection, and subsequent login attempt behavior (where `AuthService.login` returns 403 `AUTH_ACCOUNT_INACTIVE` due to user deactivation). Clarified the role of the asynchronous outbox email notification as the primary delivery channel for the formal permanent rejection letter.
2. **Suspension, Inactivity & Guard Loop Elimination:** Formally mapped the interaction between `SessionValidationFilter.java`, `CollegeAccessGuard.java`, and `CollegeApprovalGuard.tsx`. Demonstrated why checking `collegeStatus === 'ACTIVE'` and `managementUnlocked === true` in `CollegeApprovalGuard` directs suspended/inactive users to `/onboarding-status`, where `useMyApplication` catches 403 and renders `SuspendedCollegeCard` without triggering a redirect loop.
3. **Live Approval Synchronization:** Removed citations of the non-existent `authStore.syncUser()`. Replaced with the real frontend synchronization sequence using `authService.getMe()`, `queryKeys.auth.currentUser()`, and `useAuthStore.getState().setUser(updatedUser)`.
4. **Dashboard Data Availability & Identifier Safety:** Systematically classified all dashboard fields into Confirmed Available, Derivable, Static Informational, or Unsupported. Excluded internal database IDs and storage keys. Clarified that compliance documents are approved collectively as part of the application approval and have no individual `isVerified` boolean in the backend DTO.
5. **Component and File Inventory Reconciliation:** Established a verified 10-file inventory (7 created + 3 modified). Clarified that `PermanentlyRejectedView` remains inlined inside `OnboardingStatusPage.tsx` (with bugfix for 403 disambiguation), and noted that `RevisionHistoryDrawer.tsx` already contains the permanent rejection badge from Module 3.3/3.4.
6. **Document Download Error Contract:** Verified the exact backend exception mappings in `CollegeOnboardingController`, `CollegeOnboardingService`, and `LocalFileSystemDocumentStorageService`. Confirmed that both missing metadata and missing physical files return 404 with `errorCode: "DOCUMENT_NOT_FOUND"`, cross-tenant downloads return 403 `ACCESS_DENIED`, and unpermitted states return 403.
7. **Lifecycle & Architecture Invariants:** Confirmed atomic activation occurs inside Module 3.4 `APPROVE`, outbox email enqueueing is transactional while SMTP dispatch is asynchronous, and zero new endpoints or DTOs are introduced.

### 1.3 Governance Declaration
This document is an **inspection and planning report only**. In accordance with project governance rules:
- Zero application code, tests, backend sources, or database migrations are modified.
- Module 3.5 Frontend remains strictly at `NOT_STARTED` / Awaiting project-owner planning approval.

---

## 2. Authoritative Documents Inspected

The following authoritative repository artifacts were inspected and reconciled:

1. **[ACADLYTIC_MASTER_CONTEXT.md](file:///c:/React/Acadlytic/docs/00-project-overview/ACADLYTIC_MASTER_CONTEXT.md):** Verified overall project governance, MVP two-role rule (`SUPER_ADMIN` and `COLLEGE_ADMIN`), architectural boundaries (modular monolith, session cookies, zero JWT), and current development status (Phase 03 backend complete & approved; frontend modules 3.1B, 3.2, 3.3, and 3.4 approved; Module 3.5 pending).
2. **[phase-03-module-3.5-implementation-report.md](file:///c:/React/Acadlytic/docs/03-phase/phase-03-module-3.5-implementation-report.md):** Inspected the approved backend lifecycle engine, including atomic operational activation in `CollegeLifecycleService.onCollegeApproved`, three-strikes permanent rejection protocol on revision $v_4$, session revocation via `SessionRevocationService`, and scheduled background retention sweepers.
3. **[phase-03-module-3.5-inspection-and-planning-report.md](file:///c:/React/Acadlytic/docs/03-phase/phase-03-module-3.5-inspection-and-planning-report.md) (v1.1):** Inspected original backend planning assumptions, state machine diagrams, MySQL virtual generated columns reservation release mechanics, and outbox email templates.
4. **[phase-03-module-3.4-frontend-inspection-and-planning-report.md](file:///c:/React/Acadlytic/docs/03-phase/phase-03-module-3.4-frontend-inspection-and-planning-report.md) (v1.1 APPROVED):** Verified approved Super Admin review queue contracts, review decision modal architecture, resubmission count semantics ($v_1=0$, $v_2=1$, $v_3=2$, $v_4=3$), and optimistic version locking.
5. **[phase-03-module-3.4-frontend-implementation-report.md](file:///c:/React/Acadlytic/docs/03-phase/phase-03-module-3.4-frontend-implementation-report.md) (v1.1 APPROVED):** Inspected actual implementation evidence, canonical route structure (`/admin/colleges/reviews` and `/admin/colleges/reviews/:collegeId`), `Sidebar.tsx` approval queue link, and the 136-test baseline across 12 test files.
6. **Backend Source Code Inspected:**
   - `com.acadlytic.modules.colleges.service.CollegeLifecycleService` (lines 1-250: `onCollegeApproved`, `onNonPermanentRejection`, `onPermanentRejection`)
   - `com.acadlytic.security.SessionRevocationService` (lines 1-88: `revokeAllSessionsForCollege`, `revokeAllSessionsForUser`)
   - `com.acadlytic.security.SessionValidationFilter` (lines 1-150: live status checks, session invalidation)
   - `com.acadlytic.security.ApiAuthenticationEntryPoint` (lines 1-35: 401 `AUTH_UNAUTHENTICATED` contract)
   - `com.acadlytic.modules.auth.service.AuthService` (lines 180-230, 570-625: login user status vs college status checks)
   - `com.acadlytic.security.CollegeAccessGuard` (lines 1-142: `requireApprovedAndActiveCollege`, `requireRestrictedOnboardingAccess`)
   - `com.acadlytic.modules.colleges.controller.CollegeOnboardingController` (lines 90-140: `downloadDocument` endpoint)
   - `com.acadlytic.modules.colleges.service.CollegeOnboardingService` (lines 550-600: `downloadDocument` tenant validation)
   - `com.acadlytic.modules.colleges.storage.LocalFileSystemDocumentStorageService` (lines 40-90: `loadAsResource` exception mapping)
7. **Frontend Source Code Inspected:**
   - `src/services/api.ts` (lines 200-240: 401 interception and login redirect)
   - `src/stores/authStore.ts` (lines 1-33: Zustand store methods — confirmed `syncUser` does not exist)
   - `src/services/authService.ts` (lines 1-60: `getMe`, `login`, `logout`)
   - `src/services/queryKeys.ts` (lines 1-35: query key structure)
   - `src/pages/auth/LoginPage.tsx` (lines 35-70: login error code mappings)
   - `src/pages/OnboardingStatusPage.tsx` (lines 70-120: 403 permanent rejection handling)
   - `src/pages/dashboard/CollegeAdminDashboardPage.tsx` (lines 1-80: placeholder shell)
   - `src/routes/guards/CollegeApprovalGuard.tsx` (lines 1-30: current guard logic)
   - `src/components/onboarding/RevisionHistoryDrawer.tsx` (lines 100-125: permanent rejection badge)
   - `src/types/index.ts` (lines 1-240: `CurrentUser`, `MyApplicationResponse`, `DocumentResponse`)

---

## 3. Forensic Analysis: Permanent Rejection vs Session Revocation

A deep code trace was performed across the backend and frontend to resolve the exact user lifecycle and UX sequence following permanent rejection.

### 3.1 The Backend Permanent Rejection Sequence
When a Super Admin rejects an application on its final correction round ($v_4$, where `resubmissionCount == 3`):
```
Super Admin: POST /api/v1/super-admin/colleges/reviews/{id}/decision (REJECT)
  └── CollegeReviewService.recordDecision
        └── CollegeLifecycleService.onPermanentRejection
```
Inside `CollegeLifecycleService.onPermanentRejection`:
1. `submittedRevision.setPermanentRejection(true)` is persisted.
2. `college.setStatus(CollegeStatus.INACTIVE)` and `college.setPermanentlyRejected(true)` are persisted.
3. All associated users are updated: `user.setStatus(UserStatus.INACTIVE)` and `user.setEmailReleased(true)`.
4. `sessionRevocationService.revokeAllSessionsForCollege(college.getId())` is called. This queries `SPRING_SESSION` for all principal keys associated with the college's users and executes `sessionRepository.deleteById(sessionId)`.
5. Virtual generated columns (`active_college_code`, `active_email`, `active_college_admin_college_id`) instantly evaluate to `NULL`, releasing all system reservations.
6. The transactional outbox email notification `COLLEGE_REGISTRATION_PERMANENTLY_REJECTED` is enqueued atomically.

### 3.2 In-Flight Impact on the Authenticated College Admin
If the College Admin is actively logged in and viewing `/onboarding-status` (or any other route) when permanent rejection occurs:
1. Their browser holds a cookie named `ACADLYTIC_SID` with their former session ID.
2. On their **very next HTTP request** (e.g. TanStack Query background refetch or button click):
   - The request arrives at the backend. Spring Session JDBC filter attempts to locate the session ID in `SPRING_SESSION`.
   - Because `sessionRepository.deleteById` was executed during permanent rejection, the session **does not exist** in the database.
   - Spring Security does not populate `SecurityContextHolder` (`authentication == null`).
   - The request reaches `ApiAuthenticationEntryPoint.commence()`.
   - The backend responds with **HTTP 401 Unauthorized** and JSON payload:
     ```json
     {
       "success": false,
       "errorCode": "AUTH_UNAUTHENTICATED",
       "message": "Authentication is required."
     }
     ```
3. In `frontend/src/services/api.ts` (lines 211-234):
   - The Axios response interceptor intercepts the HTTP 401.
   - Because the URL is not `/auth/me` and not `/auth/login`, it executes lines 225-232:
     ```typescript
     useAuthStore.getState().clearAuth();
     sessionPurgeCallback?.();
     if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/login')) {
       window.location.assign('/auth/login');
     }
     ```
   - The auth store is wiped, and the browser is **immediately redirected to `/auth/login`**!
4. **Architectural Reality:** An authenticated College Admin **NEVER remains on `/onboarding-status`** in normal operational flow after permanent rejection is committed. Their session is revoked server-side, causing their next request to yield 401 and redirect to `/auth/login`.

### 3.3 Subsequent Login Attempt Behavior
When the permanently rejected admin arrives at `/auth/login` and attempts to log in with their credentials:
1. `AuthService.login` matches the password hash and verifies `user.getRole().isActiveInMvp()`.
2. At line 194 of `AuthService.java`:
   ```java
   if (user.getStatus() != UserStatus.ACTIVE) {
       auditEventService.recordIndependently(..., Map.of("reason", "USER_INACTIVE"));
       throw new AppException(
               "AUTH_ACCOUNT_INACTIVE",
               "Your account is inactive.",
               HttpStatus.FORBIDDEN);
   }
   ```
3. Because `CollegeLifecycleService.onPermanentRejection` set `user.status = UserStatus.INACTIVE`, the condition `user.getStatus() != UserStatus.ACTIVE` is **true**!
4. The backend throws **HTTP 403 Forbidden with `errorCode: "AUTH_ACCOUNT_INACTIVE"`**.
5. Notice: `validateCollegeAllowsLogin(user, clientIp)` (which throws `REGISTRATION_PERMANENTLY_REJECTED` at line 590) is **never reached** because the user check at line 194 short-circuits execution!
6. In `LoginPage.tsx` (lines 50-51):
   `AUTH_ACCOUNT_INACTIVE` is caught and displayed as:
   `"Your account is inactive."`
   (If `user.status` were somehow active, line 45 would display: `"This college registration has been permanently rejected."`).

### 3.4 Reconciliation of the Permanent Rejection User Experience
To provide a cohesive, truthful user experience without violating backend security boundaries:
1. **Primary Delivery Channel — Transactional Outbox Email:**  
   The definitive, comprehensive explanation of the permanent rejection—including the formal notification letter, the reviewer's reason, the 3-strikes exhaustion details, and the release of institution code and email reservations—is delivered directly to the administrator's verified inbox via the transactional outbox email notification (`COLLEGE_REGISTRATION_PERMANENTLY_REJECTED`).
2. **Login Page Experience (`LoginPage.tsx`):**  
   The login page already handles `AUTH_ACCOUNT_INACTIVE` and `REGISTRATION_PERMANENTLY_REJECTED`. The administrator is informed of their account state upon attempting to log in.
3. **Defensive Inlined Rejection View on `/onboarding-status`:**  
   `OnboardingStatusPage.tsx` already contains an inlined permanent rejection view (lines 78-116). This view handles edge cases such as:
   - A race condition where `GET /my-application` returns before the session deletion is committed in the database.
   - Component-level unit and integration testing where mock responses return `403 REGISTRATION_PERMANENTLY_REJECTED`.
   - **Critical Bugfix Required:** Currently, line 74 of `OnboardingStatusPage.tsx` checks:
     `isApiError(error) && (error.status === 403 || error.errorCode === 'REGISTRATION_PERMANENTLY_REJECTED')`
     Because of `error.status === 403`, **ANY** 403 error (such as `COLLEGE_SUSPENDED`, `COLLEGE_INACTIVE`, or `ACCESS_DENIED`) erroneously triggers the permanent rejection view! In Module 3.5, this condition must be corrected to strictly check:
     `isApiError(error) && error.errorCode === 'REGISTRATION_PERMANENTLY_REJECTED'`.
4. **Zero Public Unauthenticated Endpoints:**  
   The platform will **never** invent an unauthenticated `/public/registration-status` endpoint. Unauthenticated registration probing would leak prospective tenant review outcomes and violate data privacy standards.

---

## 4. Suspension, Inactivity & Route Guard Hardening

### 4.1 Forensic Analysis of Suspension and Inactivity
When a college tenant's operational status is set to `SUSPENDED` or `INACTIVE`:

```
               [ User Request Arrives ]
                          │
                          ▼
            [ SessionValidationFilter ]
                          │
         ┌────────────────┴────────────────┐
         ▼                                 ▼
[ College SUSPENDED ]             [ College INACTIVE ]
- Invalidate session              - Invalidate session
- Clear SecurityContext           - Clear SecurityContext
- Return 403 COLLEGE_SUSPENDED    - Return 403 COLLEGE_INACTIVE
```

1. **`SessionValidationFilter.java` (lines 134-145):**
   - For an active session belonging to a `COLLEGE_ADMIN`, if `college.getStatus() == CollegeStatus.SUSPENDED`:
     Calls `invalidateAndClear(session)` and writes HTTP 403 `COLLEGE_SUSPENDED`.
   - If `college.getStatus() == CollegeStatus.INACTIVE`:
     Calls `invalidateAndClear(session)` and writes HTTP 403 `COLLEGE_INACTIVE`.
2. **Subsequent API Request:**
   - Because `invalidateAndClear(session)` destroyed the session, the very next request lacks a valid session, returning 401 `AUTH_UNAUTHENTICATED` via `ApiAuthenticationEntryPoint` and redirecting to `/auth/login`.
3. **Subsequent Login Attempt:**
   - At `/auth/login`, `AuthService.login` invokes `validateCollegeAllowsLogin`.
   - Lines 595-609 throw HTTP 403 `COLLEGE_SUSPENDED` (`"This college account is currently suspended. Please contact Acadlytic support."`).
   - Lines 611-625 throw HTTP 403 `COLLEGE_INACTIVE` (`"This college account is inactive. Please contact Acadlytic support."`).
   - `LoginPage.tsx` renders these exact error messages.

### 4.2 `CollegeApprovalGuard.tsx` Hardening & Loop Elimination
Inspection of `CollegeApprovalGuard.tsx` (lines 21-27) reveals that it currently checks:
```typescript
if (user.role === 'COLLEGE_ADMIN' && user.collegeApprovalStatus !== 'APPROVED') {
  return <Navigate to="/onboarding-status" replace />;
}
```
Notice: It does **not** check `user.collegeStatus` or `user.managementUnlocked`!
If an approved college (`collegeApprovalStatus === 'APPROVED'`) is later `SUSPENDED` or `INACTIVE`, `CollegeApprovalGuard` would incorrectly allow them to access `/college/dashboard`.

In Module 3.5, `CollegeApprovalGuard.tsx` will be hardened:
```typescript
if (
  user.role === 'COLLEGE_ADMIN' &&
  (user.collegeApprovalStatus !== 'APPROVED' ||
    user.collegeStatus !== 'ACTIVE' ||
    !user.managementUnlocked)
) {
  return <Navigate to="/onboarding-status" replace />;
}
```

#### Why There Is Zero Redirect Loop:
1. When an unapproved, suspended, or inactive user accesses `/college/dashboard`, `CollegeApprovalGuard` redirects them to `/onboarding-status`.
2. On `/onboarding-status`, `OnboardingStatusPage` executes `useMyApplication()`.
3. In `CollegeAccessGuard.java` (lines 128-139), `requireRestrictedOnboardingAccess()` checks:
   - If `college.getStatus() == SUSPENDED`, throws HTTP 403 `COLLEGE_SUSPENDED`.
   - If `college.getStatus() == INACTIVE`, throws HTTP 403 `COLLEGE_INACTIVE`.
4. `OnboardingStatusPage` catches these errors and renders `SuspendedCollegeCard` (with variant `suspended` or `inactive`).
5. `SuspendedCollegeCard` displays a clear explanation and an action button to `/auth/login`.
6. It does **not** attempt to navigate back to `/college/dashboard`.
7. Conversely, an approved and active user on `/onboarding-status` is redirected to `/college/dashboard`. On `/college/dashboard`, `CollegeApprovalGuard` sees `user.collegeApprovalStatus === 'APPROVED'`, `user.collegeStatus === 'ACTIVE'`, and `user.managementUnlocked === true`, and renders `<Outlet />`.
8. The navigation paths are strictly unidirectional and deterministic.

---

## 5. Live Approval Synchronization Flow

### 5.1 Elimination of Non-Existent Helper
Inspection of `frontend/src/stores/authStore.ts` confirms:
`authStore.syncUser()` **DOES NOT EXIST**.
`useAuthStore` only provides:
- `user: CurrentUser | null`
- `isAuthenticated: boolean`
- `isLoading: boolean`
- `setUser(user: CurrentUser | null)`
- `clearAuth()`
- `setLoading(loading: boolean)`

### 5.2 The Real Frontend Transition Mechanism
Module 3.5 will implement live approval synchronization using strictly existing, verified primitives:

```
[ OnboardingStatusPage polls useMyApplication() ]
                        │
                        ▼
   [ Application reflects APPROVED & ACTIVE ]
                        │
                        ▼
            [ Call authService.getMe() ]
            (GET /api/v1/auth/me)
                        │
                        ▼
    [ Fresh CurrentUser with managementUnlocked=true ]
                        │
                        ▼
   [ useAuthStore.getState().setUser(updatedUser) ]
                        │
                        ▼
 [ queryClient.invalidateQueries(queryKeys.auth.currentUser()) ]
                        │
                        ▼
        [ Display Transition Notice Banner ]
 "Application Approved! Redirecting to College Dashboard..."
                        │
                        ▼
 [ navigate('/college/dashboard', { replace: true }) ]
                        │
                        ▼
      [ CollegeApprovalGuard Evaluates Fresh User ]
           (APPROVED + ACTIVE + UNLOCKED)
                        │
                        ▼
            [ Render <Outlet /> ]
```

1. While the College Admin is on `/onboarding-status`, `useMyApplication()` periodically fetches application state.
2. When the Super Admin approves the application, `application.college.approvalStatus === 'APPROVED'` and `application.college.status === 'ACTIVE'`.
3. An effect on `OnboardingStatusPage` detects this transition.
4. The page calls `authService.getMe()`, retrieving a fresh `CurrentUserResponse` containing:
   - `collegeApprovalStatus: 'APPROVED'`
   - `collegeStatus: 'ACTIVE'`
   - `managementUnlocked: true`
5. The page invokes `useAuthStore.getState().setUser(freshUser)` and invalidates `queryKeys.auth.currentUser()`.
6. With the Zustand store synchronously updated, `navigate('/college/dashboard', { replace: true })` is invoked.
7. `CollegeApprovalGuard` evaluates the updated store, confirms approval, and allows access to the dashboard.
8. Zero secondary passwords, verification tokens, or re-logins are required.

---

## 6. Dashboard Data Availability & Identifier Safety Matrix

Every proposed dashboard data field has been reconciled against backend DTOs (`CurrentUserResponse` and `MyApplicationResponse`):

| Proposed Dashboard Field | Backend Source | Classification | UI Presentation & Safety Rule |
| :--- | :--- | :--- | :--- |
| **Institutional Legal Name** | `currentRevision.profile.legalName` or `user.collegeName` | Confirmed Available | Rendered prominently in hero banner and dossier header. |
| **Permanent College Code** | `college.code` or `user.collegeCode` | Confirmed Available | Rendered in monospace badge (`e.g. DU-ENG`). Canonical institution reference. |
| **Institutional Tenancy Reference** | Derived from `college.code` | Derivable | Client-safe reference. **Internal database row ID (`college.id`) is strictly omitted**. |
| **University Affiliation** | `currentRevision.profile.affiliatedUniversityName` | Confirmed Available | Rendered in credentials card and dossier profile. |
| **Campus Address & Contact** | `currentRevision.profile.addressLine1`, `city`, `state`, `postalCode`, `contactPhone`, `websiteUrl` | Confirmed Available | Rendered read-only in dossier modal. |
| **Operational Tenancy Status** | `college.status` (`ACTIVE`) | Confirmed Available | Emerald badge: `Status: ACTIVE`. |
| **Application Approval Status** | `college.approvalStatus` (`APPROVED`) | Confirmed Available | Emerald badge: `Approval: APPROVED`. |
| **Management Authorization** | `user.managementUnlocked` (`true`) | Confirmed Available | Emerald badge: `Management: UNLOCKED`. |
| **Approved Revision Number** | `currentRevision.versionNumber` | Confirmed Available | Milestone card badge: `Approved Revision: v{versionNumber}`. |
| **Approval Reviewed Timestamp** | `reviewFeedback.reviewedAt` | Confirmed Available | Formatted via `formatDateTime(reviewedAt)`. |
| **Reviewer Notes / Feedback** | `reviewFeedback.reviewNotes` | Confirmed Available | Rendered in milestone card; omitted if null/empty. |
| **Active Compliance Documents** | `activeDocuments[]` (`documentCategory`, `originalFilename`, `fileSizeBytes`, `sha256Checksum`, `createdAt`) | Confirmed Available | Rendered in read-only dossier table with formatted file size and category badges. |
| **Document "Verified" Status** | **None** (backend DTO has no `isVerified` flag) | **Unsupported** | **OMITTED**. Documents are approved collectively as part of the revision approval. No fabricated individual "verified" badges. |
| **Document Storage Key / Path** | `storageKey` | **Unsupported** | **STRICTLY EXCLUDED**. Internal storage keys are sensitive infrastructure internals. |
| **Historical Revision Timeline** | `revisionHistory[]` (`versionNumber`, `status`, `submittedForReviewAt`, `reviewedAt`) | Confirmed Available | Rendered chronologically in dossier modal. |
| **Completed Onboarding Checklist** | Derived from onboarding completion | Derivable | 4 completed milestones (Registration, Email Verified, Documents Approved, Tenancy Activated). |
| **Phase 04+ Readiness Roadmap** | N/A (Upcoming phase features) | Static Informational | Static visual guidance card on upcoming academic departments, faculty, and student setup. |

---

## 7. Document Download Error Contract

Inspection of the backend streaming document download flow:
```
Controller: CollegeOnboardingController.downloadDocument(documentId)
  └── Service: CollegeOnboardingService.downloadDocument(documentId)
        └── Storage: LocalFileSystemDocumentStorageService.loadAsResource(storageKey)
```

### 7.1 Backend Error Mapping
1. **Document Metadata Record Not Found:**  
   If `documentId` does not exist in `college_registration_documents`:  
   `CollegeOnboardingService` line 580 throws:
   `new AppException("DOCUMENT_NOT_FOUND", "Document not found.", HttpStatus.NOT_FOUND)` (HTTP 404).
2. **Physical Storage File Not Found on Disk:**  
   If the metadata row exists but the file on disk was purged by a background sweeper:  
   `LocalFileSystemDocumentStorageService.loadAsResource` line 83 throws:
   `new AppException("DOCUMENT_NOT_FOUND", "Document file not found on storage.", HttpStatus.NOT_FOUND)` (HTTP 404).
   *(Note: The backend throws `DOCUMENT_NOT_FOUND` in both cases; there is no `DOCUMENT_FILE_NOT_FOUND` error code).*
3. **Cross-Tenant Unauthorized Access:**  
   If the document belongs to another college tenant:  
   `CollegeOnboardingService` line 583 throws:
   `new AppException("ACCESS_DENIED", "Access denied to document belonging to another college.", HttpStatus.FORBIDDEN)` (HTTP 403).
4. **Tenant Access Guard Blocks Access:**  
   If the requesting college is permanently rejected, suspended, or inactive:  
   `CollegeAccessGuard.requireRestrictedOnboardingAccess()` throws HTTP 403 with `REGISTRATION_PERMANENTLY_REJECTED`, `COLLEGE_SUSPENDED`, or `COLLEGE_INACTIVE`.

### 7.2 Frontend Error Handling Contract
- When `useDownloadDocument` receives HTTP 404 (`DOCUMENT_NOT_FOUND`):  
  Display an informative error toast: *"The requested compliance document is no longer available in storage."*
- When receiving HTTP 403 (`ACCESS_DENIED`):  
  Display: *"You do not have permission to download this document."*
- On success: Stream binary blob, trigger browser download via temporary anchor element, and revoke object URL after 60 seconds.

---

## 8. Role-Based Functional Requirements

### 8.1 College Administrator (`COLLEGE_ADMIN`)

#### REQ-3.5-F01: Operational Welcome Dashboard
- **Route:** `/college/dashboard` (`CollegeAdminDashboardPage.tsx`)
- **Condition:** `user.collegeApprovalStatus === 'APPROVED'` AND `user.collegeStatus === 'ACTIVE'` AND `user.managementUnlocked === true`.
- **Components:**
  - `CollegeActivationHeroBanner`: Celebratory banner displaying institutional legal name, permanent college code, safe institutional tenancy reference, and green status badges (`ACTIVE`, `APPROVED`, `UNLOCKED`).
  - `ActivationMilestoneCard`: Card displaying approved revision number ($v_n$), reviewed timestamp, reviewer feedback notes, and "View Approved Registration Dossier" button.
  - `InstitutionalReadinessRoadmapCard`: Informational card displaying upcoming Phase 04+ capabilities (Academic Departments, Faculty Ingestion, Student Rosters).
  - Completed Onboarding Checklist: Summary of 4 verified onboarding milestones.

#### REQ-3.5-F02: Approved Registration & Document Dossier Modal
- **Trigger:** "View Approved Registration Dossier" button in `ActivationMilestoneCard`.
- **Component:** `ApprovedDossierModal.tsx`
- **Functionality:**
  - Queries `useMyApplication()` (`GET /api/v1/college-registrations/my-application`).
  - Displays read-only institutional profile details (campus address, contact phone, website URL, university affiliation).
  - Displays active compliance documents table with category badges, formatted file sizes, SHA-256 checksums, and streaming download triggers.
  - Displays historical revision audit timeline ($v_1 \dots v_n$) with submission dates, outcomes, and reviewer feedback.
  - Strictly read-only: zero edit, upload, delete, or submit buttons.

#### REQ-3.5-F03: Live Approval State Transition
- **Route:** `/onboarding-status` (`OnboardingStatusPage.tsx`)
- **Functionality:**
  - Detects `application.college.approvalStatus === 'APPROVED'` and `application.college.status === 'ACTIVE'`.
  - Calls `authService.getMe()`, updates Zustand auth store via `setUser(updatedUser)`, and invalidates `queryKeys.auth.currentUser()`.
  - Displays transition message: *"Application Approved! Redirecting to your active College Dashboard..."*
  - Navigates via `navigate('/college/dashboard', { replace: true })`.

#### REQ-3.5-F04: Account Suspension & Inactivity Handling
- **Route:** `/onboarding-status`
- **Component:** `SuspendedCollegeCard.tsx`
- **Functionality:**
  - When `useMyApplication` returns HTTP 403 with `errorCode: 'COLLEGE_SUSPENDED'`, renders Amber card explaining institutional suspension and providing support contact.
  - When returning HTTP 403 with `errorCode: 'COLLEGE_INACTIVE'`, renders Slate card explaining inactive/archived account status.
  - Provides a single action button: *"Return to Login"* redirecting to `/auth/login`.

#### REQ-3.5-F05: Permanent Rejection Disambiguation
- **Route:** `/onboarding-status`
- **Functionality:**
  - Corrects line 74 of `OnboardingStatusPage.tsx` to strictly check `error.errorCode === 'REGISTRATION_PERMANENTLY_REJECTED'` (preventing generic 403 errors from falsely triggering permanent rejection).
  - Renders the existing inlined permanent rejection view detailing three-strikes exhaustion and reservation release.

---

## 9. Component and File Inventory (Reconciled)

The proposed file inventory is strictly reconciled to **10 total affected files** (7 created + 3 modified):

```
frontend/src/
├── components/activation/
│   ├── CollegeActivationHeroBanner.tsx       [CREATED]
│   ├── ActivationMilestoneCard.tsx           [CREATED]
│   ├── InstitutionalReadinessRoadmapCard.tsx [CREATED]
│   ├── ApprovedDossierModal.tsx              [CREATED]
│   ├── SuspendedCollegeCard.tsx              [CREATED]
│   └── index.ts                              [CREATED]
├── pages/
│   ├── dashboard/CollegeAdminDashboardPage.tsx [MODIFIED]
│   └── OnboardingStatusPage.tsx                [MODIFIED]
├── routes/guards/
│   └── CollegeApprovalGuard.tsx                [MODIFIED]
└── test/
    └── college-activation.test.tsx             [CREATED]
```

### 9.1 Proposed Created Files (7 Files)

| # | File Path | Responsibility | Layer |
| :-: | :--- | :--- | :--- |
| 1 | `frontend/src/components/activation/CollegeActivationHeroBanner.tsx` | Celebratory hero banner rendering college legal name, permanent code, safe tenancy reference, and green status badges (`ACTIVE`, `APPROVED`, `UNLOCKED`). | UI Domain |
| 2 | `frontend/src/components/activation/ActivationMilestoneCard.tsx` | Summary card displaying approved revision ($v_n$), reviewed timestamp, reviewer feedback notes, and "View Approved Registration Dossier" button. | UI Domain |
| 3 | `frontend/src/components/activation/InstitutionalReadinessRoadmapCard.tsx` | Informational roadmap card presenting upcoming Phase 04+ capabilities (Academic Departments, Faculty Ingestion, Student Rosters). | UI Domain |
| 4 | `frontend/src/components/activation/ApprovedDossierModal.tsx` | Modal dialog rendering read-only institutional profile details, active compliance documents with streaming download triggers, and revision audit timeline. | UI Domain |
| 5 | `frontend/src/components/activation/SuspendedCollegeCard.tsx` | Unified stateful error card rendering suspension notice (`COLLEGE_SUSPENDED`) or inactive notice (`COLLEGE_INACTIVE`) with support contact and login redirect. | UI Domain |
| 6 | `frontend/src/components/activation/index.ts` | Barrel export encapsulating all 5 activation domain components. | Barrel Export |
| 7 | `frontend/src/test/college-activation.test.tsx` | Comprehensive Vitest suite (17 test scenarios) verifying activation dashboard, dossier modal, streaming downloads, error cards, and live approval sync. | Test Suite |

### 9.2 Proposed Modified Files (3 Files)

| # | File Path | Exact Modifications | Reason |
| :-: | :--- | :--- | :--- |
| 1 | `frontend/src/pages/dashboard/CollegeAdminDashboardPage.tsx` | Replace the 80-line placeholder shell with the complete operational welcome dashboard integrating `CollegeActivationHeroBanner`, `ActivationMilestoneCard`, `InstitutionalReadinessRoadmapCard`, and `ApprovedDossierModal`. Remove raw DB ID display. | Elevate College Admin landing experience upon operational activation. |
| 2 | `frontend/src/pages/OnboardingStatusPage.tsx` | 1. Disambiguate 403 handling (fix line 74 so only `REGISTRATION_PERMANENTLY_REJECTED` triggers permanent rejection).<br>2. Add handling for `COLLEGE_SUSPENDED` and `COLLEGE_INACTIVE` rendering `SuspendedCollegeCard`.<br>3. Add live approval detection effect: when application is approved & active, call `authService.getMe()`, update store via `setUser()`, and navigate to `/college/dashboard`. | Harden terminal error states and enable seamless post-approval transition. |
| 3 | `frontend/src/routes/guards/CollegeApprovalGuard.tsx` | Update guard condition to check `user.collegeApprovalStatus !== 'APPROVED' || user.collegeStatus !== 'ACTIVE' || !user.managementUnlocked`. | Prevent suspended or inactive colleges from accessing active management dashboard while eliminating redirect loops. |

### 9.3 Reconciliation of Previously Referenced Files
- **`PermanentlyRejectedView`:** Remains inlined inside `OnboardingStatusPage.tsx` (lines 78-116). Extracting it into a separate file is unnecessary because `OnboardingStatusPage` is its sole consumer, and `LoginPage.tsx` handles the primary user-facing error when logging in. Fixing line 74 resolves all review concerns without file proliferation.
- **`RevisionHistoryDrawer.tsx`:** Inspection confirmed lines 113-117 already render the permanent rejection badge:
  ```typescript
  {rev.isPermanentRejection && (
    <span className="text-rose-600 font-semibold">Permanent Rejection</span>
  )}
  ```
  This was implemented and tested in Module 3.3/3.4. No modifications are needed.
- **`InactiveCollegeCard.tsx`:** Unified into `SuspendedCollegeCard.tsx` via a `status: 'SUSPENDED' | 'INACTIVE'` prop, eliminating code duplication between two nearly identical alert cards.

---

## 10. API and Service Integration

Module 3.5 Frontend leverages existing backend endpoints and DTOs with **zero backend modifications**:

### 10.1 Service Methods Consumed
1. **`authService.getMe()` (`GET /api/v1/auth/me`):**  
   Retrieves fresh `CurrentUserResponse` containing `collegeApprovalStatus`, `collegeStatus`, and `managementUnlocked`. Used during live approval synchronization.
2. **`onboardingService.getMyApplication()` (`GET /api/v1/college-registrations/my-application`):**  
   Retrieves complete `MyApplicationResponse` containing `college`, `currentRevision`, `reviewFeedback`, `checklist`, `activeDocuments`, and `revisionHistory`. Used by `ApprovedDossierModal` and `OnboardingStatusPage`.
3. **`onboardingService.downloadDocument(documentId)` (`GET /api/v1/college-registrations/my-application/documents/{documentId}`):**  
   Streams binary document with safe headers (`X-Content-Type-Options: nosniff`, `Content-Disposition: attachment`). Used by `ApprovedDossierModal`.

### 10.2 Zero New Endpoints or DTOs
- No new REST controllers, endpoints, or DTOs are required.
- Operational activation is synchronous and atomic within Module 3.4 `APPROVE`.
- Transactional outbox rows are internal to the backend; the UI presents operational status without querying outbox internals.

---

## 11. State Management and Cache Coordination

### 11.1 Zustand Store (`useAuthStore`)
- Stores authenticated `user: CurrentUser | null`.
- Upon live approval detection on `/onboarding-status`:
  1. `authService.getMe()` fetches fresh `CurrentUser`.
  2. `useAuthStore.getState().setUser(freshUser)` synchronously updates store state.
  3. `CollegeApprovalGuard` unlocks immediately.

### 11.2 TanStack Query Cache
- Query keys used:
  - `queryKeys.auth.currentUser()`
  - `queryKeys.onboarding.myApplication()`
- Invalidation flow:
  - When live approval is detected, `queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser() })` ensures all cached auth data is updated.
  - Active dossier data in `ApprovedDossierModal` shares `queryKeys.onboarding.myApplication()` with 30-second stale time, avoiding redundant network roundtrips.

---

## 12. Validation and Error Handling

| Error Code | HTTP Status | Origin / Cause | Frontend UI Representation |
| :--- | :---: | :--- | :--- |
| `COLLEGE_SUSPENDED` | 403 | Tenancy suspended by platform admin | `SuspendedCollegeCard` (Amber variant): Institutional account suspended notice with support contact. |
| `COLLEGE_INACTIVE` | 403 | Tenancy inactive or archived by 7-day sweeper | `SuspendedCollegeCard` (Slate variant): Institutional account inactive notice with support contact. |
| `REGISTRATION_PERMANENTLY_REJECTED` | 403 | Three-strikes limit exhausted ($v_4$ rejected) | `PermanentlyRejectedView`: Red ban alert detailing permanent termination and reservation release. |
| `DOCUMENT_NOT_FOUND` | 404 | Document metadata not found or physical file purged | Error toast: *"The requested compliance document is no longer available in storage."* |
| `ACCESS_DENIED` | 403 | Cross-tenant document access attempt | Error toast: *"You do not have permission to download this document."* |

---

## 13. Concurrency and Lifecycle Edge Cases

| Edge Case | Backend Mechanism | Frontend Handling |
| :--- | :--- | :--- |
| **Concurrent Approval While on Onboarding Status** | Super Admin approves application; backend transaction commits `status = ACTIVE`, `approvalStatus = APPROVED`. | `OnboardingStatusPage` detects approved state on next refetch, fetches `getMe()`, updates auth store, and navigates to `/college/dashboard`. |
| **Concurrent Permanent Rejection While Editing** | Super Admin rejects $v_4$; backend transaction revokes sessions, deactivates user, enqueues outbox email. | Next request returns 401 `AUTH_UNAUTHENTICATED`. Axios interceptor clears store and redirects to `/auth/login`. On login attempt, `AuthService` returns 403 `AUTH_ACCOUNT_INACTIVE`. |
| **Direct Navigation to `/college/dashboard` by Unapproved User** | Unapproved user types URL into address bar. | Hardened `CollegeApprovalGuard` checks `collegeApprovalStatus !== 'APPROVED'`, redirects to `/onboarding-status`. |
| **Direct Navigation to `/onboarding-status` by Approved User** | Approved user types URL into address bar. | `OnboardingStatusPage` detects `APPROVED` + `ACTIVE`, redirects to `/college/dashboard`. |
| **Direct Navigation by Suspended User** | Suspended college admin attempts to access `/college/dashboard`. | `CollegeApprovalGuard` checks `collegeStatus !== 'ACTIVE'`, redirects to `/onboarding-status`. Page catches 403 `COLLEGE_SUSPENDED` and renders `SuspendedCollegeCard`. |
| **Download of Purged Compliance Document** | Background sweeper purged physical file older than retention window. | Backend storage returns 404 `DOCUMENT_NOT_FOUND`. Frontend displays friendly toast without crashing. |

---

## 14. Automated Testing Strategy (17 Test Scenarios)

A dedicated test suite `frontend/src/test/college-activation.test.tsx` will be created covering 17 exhaustive test scenarios:

### Test Scenarios:
1. **Renders Operational Dashboard:** Verifies `/college/dashboard` renders college legal name, permanent college code, safe tenancy reference, and active status badges.
2. **Status Badges Verification:** Asserts `ACTIVE`, `APPROVED`, and `UNLOCKED` status badges render with emerald visual styling.
3. **Approval Milestone Summary:** Asserts approved revision number ($v_n$), reviewed timestamp, and reviewer feedback notes render correctly.
4. **Completed Onboarding Checklist:** Asserts all 4 checklist steps are displayed as completed milestones.
5. **Readiness Roadmap Display:** Asserts Phase 04+ roadmap card outlines academic structure and result processing milestones.
6. **Opens Approved Dossier Modal:** Clicks "View Approved Registration Dossier" and verifies modal opens with profile details.
7. **Dossier Compliance Documents Table:** Asserts active compliance documents render with category badges, file sizes, and download buttons.
8. **Dossier Streaming Download Trigger:** Clicks download button and verifies `onboardingService.downloadDocument` is invoked with correct document ID.
9. **Dossier Revision History Timeline:** Asserts past revisions render chronologically with outcomes and review notes.
10. **Dossier Read-Only Enforcement:** Asserts zero edit, upload, delete, or submit buttons exist within the dossier modal.
11. **OnboardingStatusPage Approval Redirection:** Verifies `OnboardingStatusPage` redirects approved & active admins to `/college/dashboard`.
12. **OnboardingStatusPage Live Approval Detection:** Simulates `useMyApplication` returning approved status, verifies `authService.getMe()` call, auth store update, and clean redirect.
13. **Suspended College Error Handling:** Simulates 403 `COLLEGE_SUSPENDED` and verifies `SuspendedCollegeCard` renders with Amber styling and support contact.
14. **Inactive College Error Handling:** Simulates 403 `COLLEGE_INACTIVE` and verifies `SuspendedCollegeCard` renders with Slate styling.
15. **Permanent Rejection Disambiguation:** Simulates 403 `REGISTRATION_PERMANENTLY_REJECTED` and verifies inlined permanent rejection view renders; verifies other 403s do NOT trigger it.
16. **CollegeApprovalGuard Hardening:** Asserts guard blocks access to `/college/dashboard` if `collegeStatus !== 'ACTIVE'` or `managementUnlocked !== true`.
17. **Purged Document 404 Handling:** Asserts user-friendly error toast is displayed when document streaming download returns 404 `DOCUMENT_NOT_FOUND`.

---

## 15. Manual Browser/API Acceptance Testing Strategy

| Step | Environment | Action | Expected Result |
| :---: | :--- | :--- | :--- |
| **1** | Browser DevTools | Log in as approved `COLLEGE_ADMIN` | Lands on `/college/dashboard` with active welcome banner, institutional credentials, and emerald status badges. |
| **2** | Browser DevTools | Inspect `/college/dashboard` network tab | `GET /api/v1/auth/me` returns `collegeApprovalStatus: 'APPROVED'`, `collegeStatus: 'ACTIVE'`, `managementUnlocked: true`. |
| **3** | Browser UI | Click "View Approved Registration Dossier" | Modal opens displaying read-only profile, compliance documents, and revision history. |
| **4** | Browser UI | Click document download in dossier | Browser triggers file download; blob URL revoked after 60s; zero server storage paths exposed. |
| **5** | Browser UI | Navigate manually to `/onboarding-status` | Browser URL immediately rewrites to `/college/dashboard` (zero redirect loops). |
| **6** | Super Admin UI | Reject application on revision $v_4$ in `/admin/colleges/reviews/:id` | Decision modal confirms permanent rejection; college deactivated; sessions revoked. |
| **7** | Browser UI | In separate incognito window, attempt login as rejected college admin | Login page displays account inactive / permanent rejection notice. |
| **8** | Database / Mailpit | Inspect `outbox_emails` and Mailpit inbox | `COLLEGE_REGISTRATION_APPROVED` or `COLLEGE_REGISTRATION_PERMANENTLY_REJECTED` enqueued and delivered. |

---

## 16. Implementation Stages and Dependencies

```text
Stage 1: Activation Domain Components (Created)
└── CollegeActivationHeroBanner, ActivationMilestoneCard, InstitutionalReadinessRoadmapCard,
    ApprovedDossierModal, SuspendedCollegeCard, barrel export index.ts

Stage 2: Dashboard Elevation & Guard Hardening (Modified)
├── Elevate CollegeAdminDashboardPage with activation components
├── Enhance OnboardingStatusPage with refined 403 error routing & live approval sync
└── Harden CollegeApprovalGuard with collegeStatus and managementUnlocked checks

Stage 3: Automated Verification & Test Suite
├── Implement src/test/college-activation.test.tsx (17 scenarios)
├── Execute full Vitest regression suite (expanding baseline from 136 to ~153 tests across 13 files)
├── Run strict TypeScript compilation (tsc -b)
└── Run production Vite build (npm run build)

Stage 4: Implementation Report & Master Context Update
├── Author phase-03-module-3.5-frontend-implementation-report.md (v1.0)
└── Present report to project owner for formal review and approval
```

---

## 17. Explicit Out-of-Scope Items

To prevent scope creep and preserve platform architectural boundaries:
- **NO Microservices or Architectural Extraction:** Remains modular monolith.
- **NO JWT Tokens or LocalStorage Storage:** Strictly stateful HTTP-only session cookies (`ACADLYTIC_SID`).
- **NO `ACADEMIC_STAFF` or `STUDENT` Portals:** Post-MVP roles strictly excluded.
- **NO Phase 04 Academic Department Provisioning:** Handled in subsequent phase.
- **NO Manual "Activate College" Button:** Operational activation is atomic with `APPROVE`.
- **NO Public Unauthenticated Registration Status Endpoints:** Preserves tenant data privacy.
- **NO Database Migrations:** Schema V5 remains complete and unchanged.

---

## 18. Final Recommended Implementation Plan

1. **Approval Authorization:** Await explicit project-owner authorization of this planning report v1.1 before modifying any code.
2. **Implementation Execution:** Execute Stages 1 through 3 strictly according to the 10-file inventory documented in Section 9.
3. **Baseline Expansion:** Increase the automated test baseline from 136 to approximately 153 passing tests across 13 test files.
4. **Phase 03 Conclusion:** Following Module 3.5 Frontend completion and approval, Phase 03 Frontend and Phase 03 Overall will be ready for final milestone closure.
