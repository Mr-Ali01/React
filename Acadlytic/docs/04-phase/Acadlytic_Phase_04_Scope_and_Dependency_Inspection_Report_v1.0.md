# Acadlytic — Phase 04 Scope & Dependency Inspection Report

**Document Version:** 1.0  
**Date:** 2026-11-27  
**Target Phase:** Phase 04 — College Management (Tenant Management & Profile)  
**Task Classification:** Non-Mutating Architectural Scope, Implementation & Dependency Inspection  
**Status:** `INSPECTION COMPLETE — READY FOR ARCHITECTURAL REVIEW`

---

## 1. Executive Summary

This report delivers a comprehensive, evidence-based architectural inspection of the codebase, database schemas, and documentation for **Phase 04: College Management (Tenant Management & Profile)**.

### Key Conclusions:
1. **Phase 04 Current Status:** Formally `NOT_STARTED`. Zero Phase 04 REST endpoints, services, or dedicated management UI components exist in the repository.
2. **Substantial Existing Foundation (Phases 01–03):** While Phase 04 feature development has not started, extensive foundational infrastructure was already implemented and approved during Phases 02 and 03:
   - The authoritative `colleges` database table is active (Flyway migrations `V1`, `V3`, `V4`, `V5`, `V6`).
   - The `College` JPA entity and `CollegeRepository` exist with optimistic concurrency versioning (`@Version Long version`).
   - The dual lifecycle status enums (`CollegeStatus` and `CollegeApprovalStatus`) are active in production.
   - Server-side tenant isolation is enforced by [CollegeAccessGuard.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/security/CollegeAccessGuard.java).
   - Immediate session revocation for suspended colleges is operational via [SessionRevocationService.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/security/SessionRevocationService.java) (`ADR-10`, `ADR-05`).
   - The Single Active College Admin rule (`ADR-06`) is enforced in MySQL via a generated virtual column (`active_college_admin_college_id`) and unique constraint.
3. **Phase 03 Compatibility Assessment:** Phase 04 can **safely proceed** to planning and backend implementation while Phase 03 manual E2E verification remains pending:
   - Phase 03 automated verification is 100% complete (296/296 Testcontainers MySQL tests passed; 213/213 Vitest frontend tests passed; clean package build).
   - Phase 04 operates strictly downstream on colleges that have already attained `approval_status = APPROVED` and `status = ACTIVE`.
   - [CollegeAccessGuard.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/security/CollegeAccessGuard.java) guarantees that any prospective college still in onboarding (`PENDING`, `ACTION_REQUIRED`, `REJECTED`) is locked out of Phase 04 operational endpoints with `403 COLLEGE_NOT_APPROVED`.
   - Phase 03 progress tracking remains strictly independent as `IN_PROGRESS`.
4. **Core Technical Architectural Requirement for Phase 04:**
   - In Phase 03, college address, contact phone, website, and affiliated university details were captured on the registration dossier (`college_registrations`). The `colleges` table currently lacks these operational columns.
   - Phase 04 must introduce Flyway Migration `V7` to extend `colleges` with its operational profile attributes (`address_line1`, `address_line2`, `city`, `state`, `country`, `postal_code`, `website_url`, `contact_phone`, `affiliated_university_name`), backfilled from approved registration dossiers. This establishes `colleges` as the authoritative operational read/write model while preserving the immutability of historical registration records.

---

## 2. Documentation Inspected

The following authoritative project documents were inspected:

| Document Path | Key Sections / Concepts Inspected |
|:---|:---|
| [ACADLYTIC_MASTER_CONTEXT.md](file:///c:/React/Acadlytic/docs/00-project-overview/ACADLYTIC_MASTER_CONTEXT.md) | Section 6 (Core MVP Modules), Section 13.1 (Status Dashboard), Section 13.2 (Phase Status Table), Section 13.5 (Verification Tracker), Section 13.7 (Current Development Position), Section 14 (Project Boundaries), Section 15 (AI Agent Responsibility). |
| [roadmap.md](file:///c:/React/Acadlytic/docs/08-task-breakdown/roadmap.md) | Phase 03 (Lines 200–225), Phase 04 Scope & Exit Criteria (Lines 227–252), Phase 05–07 downstream dependencies (Lines 254–300). |
| [epics.md](file:///c:/React/Acadlytic/docs/08-task-breakdown/epics.md) | Epic E2: Tenant & College Management (Lines 6–8, 43–100). |
| [tasks.md](file:///c:/React/Acadlytic/docs/08-task-breakdown/tasks.md) | EPIC-04: Tasks 04.01 through 04.04 (Lines 217–256). |
| [college-management.md (Feature Spec)](file:///c:/React/Acadlytic/docs/09-development/feature-specifications/college-management.md) | Full 1500-line specification: Purpose, Actors, Core Concepts, Creation API, List/Search/Pagination, Detail API, Update API, Status Management, Admin Assignment, Audit Events, Security. |
| [college-management-implementation.md](file:///c:/React/Acadlytic/docs/09-development/implementation-notes/college-management-implementation.md) | Full 2073-line implementation guide: Architecture, Tenant Boundaries, Single Active Admin, Suspension Behavior, API contracts, Frontend pages, Test structures, Implementation sequence (Section 93). |
| [api-architecture.md](file:///c:/React/Acadlytic/docs/05-architecture/api-architecture.md) | Sections 22–27 (Lines 610–722): Phase 04 endpoints, Super Admin platform management vs College Admin profile updates, status management. |
| [database-architecture.md](file:///c:/React/Acadlytic/docs/05-architecture/database-architecture.md) | Sections 23–24 (Lines 565–614): Conceptual `colleges` entity structure, constraints, foreign keys. |
| [data-ownership.md](file:///c:/React/Acadlytic/docs/05-architecture/data-ownership.md) | Multi-tenant isolation principles, `college_id` scoping rules, cross-tenant prevention. |
| [page-specifications.md](file:///c:/React/Acadlytic/docs/06-design/page-specifications.md) | Lines 164–166, 590–730: Super Admin College Hub and College Admin Profile UI specifications. |
| **Architectural Decision Records** | `ADR-01` to `ADR-19`, specifically: `ADR-05` (Session Revocation), `ADR-06` (Single Active College Admin), `ADR-07` (Versioned Revisions & Concurrency), `ADR-08` (Approval Lifecycle), `ADR-10` (Suspension Session Revocation). |

---

## 3. Existing Implementation Findings

A rigorous inspection of the current codebase ([backend](file:///c:/React/Acadlytic/backend), [frontend](file:///c:/React/Acadlytic/frontend), and [Flyway migrations](file:///c:/React/Acadlytic/backend/src/main/resources/db/migration)) was performed to identify what already exists versus what Phase 04 must build.

### 3.1 Existing Backend Components

#### 1. Entity: `College.java`
- **Location:** [College.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/entity/College.java)
- **Current Fields:** `id`, `name`, `code`, `approvalStatus` (`CollegeApprovalStatus`), `status` (`CollegeStatus`), `permanentlyRejected` (`boolean`), `currentRegistrationId` (`Long`), `resubmissionCount` (`int`), `actionRequiredCount` (`int`), `archivedAt` (`Instant`), `version` (`@Version Long`), `createdAt`, `updatedAt`.
- **Existing Method:** `boolean isManagementUnlocked()` (returns true only when `!permanentlyRejected && archivedAt == null && approvalStatus == APPROVED && status == ACTIVE`).
- **Missing for Phase 04:** Operational profile fields (`addressLine1`, `addressLine2`, `city`, `state`, `country`, `postalCode`, `websiteUrl`, `contactPhone`, `affiliatedUniversityName`).

#### 2. Repository: `CollegeRepository.java`
- **Location:** [CollegeRepository.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/repository/CollegeRepository.java)
- **Existing Queries:** `findById`, `findByIdWithLock` (pessimistic write lock), `findByCode`, `existsByCode`.
- **Missing for Phase 04:** Paginated directory queries with search (by name/code) and filtering (by operational status, approval status, university); needs Spring Data `JpaSpecificationExecutor<College>`.

#### 3. Controllers & REST APIs
- **Current Controllers:**
  - `CollegeRegistrationController.java`: Mapped to `/api/v1/college-registrations` (Phase 03 intake).
  - `CollegeOnboardingController.java`: Mapped to `/api/v1/college-registrations/my-application` (Phase 03 restricted onboarding dashboard).
  - `CollegeReviewController.java`: Mapped to `/api/v1/super-admin/colleges/reviews` (Phase 03 review queue).
- **Findings:** **Zero REST endpoints** are mapped to `/api/v1/colleges`. Endpoints `GET /api/v1/colleges`, `GET /api/v1/colleges/{id}`, `PUT /api/v1/colleges/{id}`, `PATCH /api/v1/colleges/{id}/status`, `GET /api/v1/colleges/my-college`, and `PUT /api/v1/colleges/my-college` are completely unwritten.

#### 4. Security & Tenant Guards
- **Location:** [CollegeAccessGuard.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/security/CollegeAccessGuard.java)
- **Status:** **FULLY IMPLEMENTED & TESTED**.
- **Methods:**
  - `requireSuperAdmin()`: Validates `SUPER_ADMIN` role; throws `403 ACCESS_DENIED`.
  - `requireSameTenant(Long targetCollegeId)`: Blocks cross-tenant access for `COLLEGE_ADMIN`; throws `403 ACCESS_DENIED`.
  - `requireApprovedAndActiveCollege(Long targetCollegeId)`: Asserts college exists, is not permanently rejected (`403 REGISTRATION_PERMANENTLY_REJECTED`), is not suspended (`403 COLLEGE_SUSPENDED`), is not inactive (`403 COLLEGE_INACTIVE`), and is fully approved (`403 COLLEGE_NOT_APPROVED`).
  - `requireApprovedAndActiveCurrentCollege()`: Resolves current user's college tenant and delegates to `requireApprovedAndActiveCollege`.

#### 5. Session Revocation Infrastructure
- **Location:** [SessionRevocationService.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/security/SessionRevocationService.java)
- **Status:** **FULLY IMPLEMENTED & TESTED**.
- **Methods:**
  - `revokeAllUserSessionsForCollege(Long collegeId)`: Revokes all active sessions for all users of a college tenant (`ADR-10`).
  - `revokeAllSessionsForUser(Long userId)`: Revokes all active sessions for a specific user (`ADR-05`).

#### 6. Audit Trail Infrastructure
- **Location:** [AuditEventService.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/auth/service/AuditEventService.java) and [AuditEventType.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/auth/entity/AuditEventType.java)
- **Current State:** Supports `COLLEGE_ACTIVATED`, `COLLEGE_PERMANENTLY_REJECTED`, `COLLEGE_ADMIN_DEACTIVATED`, `ACCOUNT_SUSPENDED`, `ACCOUNT_REACTIVATED`.
- **Missing for Phase 04:** Specific tenant audit events: `COLLEGE_SUSPENDED`, `COLLEGE_DEACTIVATED`, `COLLEGE_REACTIVATED`, `COLLEGE_PROFILE_UPDATED`, `COLLEGE_ADMIN_REPLACED`.

---

### 3.2 Existing Database Schema Findings

1. **Table `colleges` (Migrations `V3` & `V4`):**
   - Active columns: `id`, `name`, `code`, `approval_status`, `status`, `permanently_rejected`, `archived_at`, `active_college_code` (`VIRTUAL` generated), `version`, `current_registration_id`, `resubmission_count`, `action_required_count`, `created_at`, `updated_at`.
   - Constraints: `uq_colleges_active_college_code` (`UNIQUE`), check constraints on statuses and counts.
   - Missing: Operational address, contact, and university fields.
2. **Table `users` (Migration `V3`):**
   - Enforces `ADR-06` via generated virtual column `active_college_admin_college_id` and unique constraint `uk_users_single_active_college_admin`:
     ```sql
     active_college_admin_college_id BIGINT GENERATED ALWAYS AS (
         CASE WHEN role = 'COLLEGE_ADMIN' AND status = 'ACTIVE' THEN college_id ELSE NULL END
     ) VIRTUAL,
     CONSTRAINT uk_users_single_active_college_admin UNIQUE (active_college_admin_college_id)
     ```
   - This ensures the database physically guarantees exactly **one active College Admin per college**.
3. **Live Database State (`localhost:3306`):**
   - Colleges #1, #3, and #4 are currently `APPROVED` and `ACTIVE`.
   - College #5 is `PENDING` (contains DEF-01 Test A evidence; untouched).
   - College #2 is `APPROVED` and `ACTIVE` (untouched).
   - Pre-existing approved colleges #1, #3, #4 provide immediate, safe real-world test data for Phase 04 operational APIs without touching College #2 or College #5.

---

### 3.3 Existing Frontend Components

1. **Routing:** [routes/index.tsx](file:///c:/React/Acadlytic/frontend/src/routes/index.tsx)
   - `/admin/colleges`: Currently configured as an alias to `SuperAdminDashboardPage.tsx`. No dedicated tenant management table exists.
   - `/college/dashboard`: Active for approved college admins via `CollegeApprovalGuard`.
   - `/college/profile`: Does not exist.
2. **Pages:**
   - [SuperAdminDashboardPage.tsx](file:///c:/React/Acadlytic/frontend/src/pages/dashboard/SuperAdminDashboardPage.tsx): Metric cards and informational overview. Lacks tenant directory table, pagination, search, and status controls.
   - [CollegeAdminDashboardPage.tsx](file:///c:/React/Acadlytic/frontend/src/pages/dashboard/CollegeAdminDashboardPage.tsx): Houses [InstitutionalReadinessRoadmapCard.tsx](file:///c:/React/Acadlytic/frontend/src/components/activation/InstitutionalReadinessRoadmapCard.tsx) outlining upcoming Phase 04+ capabilities.
3. **State Management & Query Keys:**
   - [queryKeys.ts](file:///c:/React/Acadlytic/frontend/src/services/queryKeys.ts) currently defines `reviews` and `registration` keys. Needs `colleges` query key factory for Phase 04.

---

## 4. Complete Phase 04 Module Breakdown

To maintain the modular monolith architecture and project testing conventions, Phase 04 is decomposed into **four coherent modules**:

```text
Phase 04: College Management (Tenant Management & Profile)
├── Module 4.1A: College Tenant Schema & Operational Profile Foundation (DB & Entity)
├── Module 4.1B: Super Admin College Tenant Hub APIs & Services (Backend)
├── Module 4.2A: College Admin Profile Management APIs & Services (Backend)
├── Module 4.3A: Single Active College Admin Assignment & Replacement (Backend)
├── Module 4.1C: Super Admin College Tenant Hub UI (Frontend)
├── Module 4.2B: College Admin College Profile UI (Frontend)
└── Module 4.4:  Cross-Tenant Security & Operational Hardening Verification
```

---

### Module 4.1A — College Tenant Schema & Operational Profile Foundation
- **Classification:** Database Migration & Core Entity Extension
- **Business Objective:** Establish operational profile columns on the `colleges` table so that approved institutions have permanent, editable profile records decoupled from historical onboarding registration dossiers.
- **Backend Requirements:**
  - Update [College.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/entity/College.java) with operational fields: `addressLine1`, `addressLine2`, `city`, `state`, `country`, `postalCode`, `websiteUrl`, `contactPhone`, `affiliatedUniversityName`.
  - Add audit event types to [AuditEventType.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/auth/entity/AuditEventType.java): `COLLEGE_SUSPENDED`, `COLLEGE_DEACTIVATED`, `COLLEGE_REACTIVATED`, `COLLEGE_PROFILE_UPDATED`, `COLLEGE_ADMIN_REPLACED`.
  - Update [CollegeLifecycleService.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/service/CollegeLifecycleService.java#L94) `onCollegeApproved`: upon approval, automatically copy the approved registration dossier’s profile details into the `College` entity’s operational fields.
- **Database/Migration Requirements:**
  - Flyway migration `V7__college_operational_profile.sql`:
    - `ALTER TABLE colleges ADD COLUMN address_line1 VARCHAR(255) NULL, ADD COLUMN address_line2 VARCHAR(255) NULL, ...`
    - Backfill migration query: Populates operational columns for existing approved colleges from their `current_registration_id` record in `college_registrations`.
- **Dependencies:** Flyway V1–V6.

---

### Module 4.1B — Super Admin College Tenant Hub APIs & Services
- **Classification:** Backend Service & REST APIs
- **Business Objective:** Empower `SUPER_ADMIN` to browse, search, filter, inspect, update administrative metadata, and manage the operational lifecycle (`ACTIVE`, `SUSPENDED`, `INACTIVE`) of all collegiate tenants.
- **API & Authorization Requirements:**
  - `GET /api/v1/colleges`:
    - Auth: `SUPER_ADMIN` only (via `collegeAccessGuard.requireSuperAdmin()`).
    - Query params: `page`, `size`, `sort`, `search` (name or code), `status` (`ACTIVE`, `INACTIVE`, `SUSPENDED`), `approvalStatus`.
    - Returns: Paginated list of `CollegeTenantSummaryResponse` (including active college admin name/email, operational status, approval status, creation date).
  - `GET /api/v1/colleges/{id}`:
    - Auth: `SUPER_ADMIN` only.
    - Returns: Full `CollegeTenantDetailResponse` (operational profile, active college admin user, registration history summary, audit trail highlights).
  - `PUT /api/v1/colleges/{id}`:
    - Auth: `SUPER_ADMIN` only.
    - Payload: `UpdateCollegeAdminMetadataRequest` (name, address, contact, university, `expectedVersion`).
    - Enforces optimistic concurrency (`409 STALE_APPLICATION_VERSION` if version differs).
    - Blocks modification of immutable `code` and `id`.
  - `PATCH /api/v1/colleges/{id}/status`:
    - Auth: `SUPER_ADMIN` only.
    - Payload: `UpdateCollegeStatusRequest` (`targetStatus: ACTIVE | SUSPENDED | INACTIVE`, `reason`, `expectedVersion`).
    - Transitions:
      - `SUSPENDED`: College status becomes `SUSPENDED`. Immediately calls `sessionRevocationService.revokeAllUserSessionsForCollege(collegeId)`. Emits `COLLEGE_SUSPENDED`.
      - `INACTIVE`: College status becomes `INACTIVE`. Immediately calls `sessionRevocationService.revokeAllUserSessionsForCollege(collegeId)`. Emits `COLLEGE_DEACTIVATED`.
      - `ACTIVE`: Reactivates a suspended/inactive college. Emits `COLLEGE_REACTIVATED`.
    - Validation: Cannot set `PENDING_VERIFICATION` via this endpoint.
- **Automated Testing Requirements:**
  - Testcontainers MySQL integration tests: verify directory pagination, filtering, search, optimistic version failure (409), session revocation on suspension (`ADR-10`), and audit emission.

---

### Module 4.2A — College Admin Profile Management APIs & Services
- **Classification:** Backend Service & REST APIs
- **Business Objective:** Allow approved, active `COLLEGE_ADMIN` users to inspect and maintain their institution's contact and address profile without exposing administrative platform controls or cross-tenant data.
- **API & Authorization Requirements:**
  - `GET /api/v1/colleges/my-college`:
    - Auth: Active, approved `COLLEGE_ADMIN` only (via `collegeAccessGuard.requireApprovedAndActiveCurrentCollege()`).
    - Scoping: Strictly derives `collegeId` from the authenticated session context via `securityContextService.requireCurrentCollegeId()`. Never accepts a client-provided college ID parameter (IDOR immune).
    - Returns: `MyCollegeProfileResponse` (legal name, permanent code, address, contact phone, website URL, affiliated university, approval date, version).
  - `PUT /api/v1/colleges/my-college`:
    - Auth: Active, approved `COLLEGE_ADMIN` only.
    - Payload: `UpdateMyCollegeProfileRequest` (contact phone, website URL, address line 1, address line 2, city, state, postal code, `expectedVersion`).
    - Strict Immutability Protection: Blocks any attempt to mutate `id`, `code` (permanent code), `name` (statutory legal name), `approvalStatus`, or `status`.
    - Enforces optimistic concurrency (`409 STALE_APPLICATION_VERSION`).
    - Emits audit event `COLLEGE_PROFILE_UPDATED`.
- **Automated Testing Requirements:**
  - Testcontainers MySQL integration tests: verify valid profile updates, optimistic locking (409), IDOR rejection, and assert that suspended or unapproved college admins receive 403.

---

### Module 4.3A — Single Active College Admin Assignment & Replacement
- **Classification:** Backend Service & REST APIs (`SUPER_ADMIN`)
- **Business Objective:** Implement safe administrative succession for collegiate tenants in accordance with `ADR-06` and `ADR-05`.
- **Backend & API Requirements:**
  - `PUT /api/v1/colleges/{id}/admin`:
    - Auth: `SUPER_ADMIN` only.
    - Payload: `AssignCollegeAdminRequest` (admin first name, last name, email, contact phone).
    - Workflow:
      1. Under pessimistic lock, query existing active `COLLEGE_ADMIN` for this `collegeId`.
      2. If an active admin exists: set status to `INACTIVE`, mark outgoing admin as replaced, and invoke `sessionRevocationService.revokeAllSessionsForUser(oldAdminId)` (`ADR-05`).
      3. Create new user account with `role = COLLEGE_ADMIN`, `status = ACTIVE`, `college_id = collegeId`, `email_verified_at = NOW()`.
      4. Database constraint `uk_users_single_active_college_admin` physically guarantees atomic uniqueness.
      5. Enqueue welcome/password-setup email via `outboxEmailService`.
      6. Record audit event `COLLEGE_ADMIN_REPLACED` capturing both old and new admin user IDs.
- **Automated Testing Requirements:**
  - Integration tests asserting atomic replacement, session termination of the displaced admin, outbox dispatch, and audit trail generation.

---

### Module 4.1C — Super Admin College Tenant Hub UI
- **Classification:** Frontend Presentation & Workflows (`SUPER_ADMIN`)
- **Business Objective:** Provide platform Super Administrators with a responsive, high-fidelity operational portal at `/admin/colleges` for managing all onboarded collegiate tenants.
- **Frontend Scope:**
  - Replace dashboard placeholder with dedicated `CollegeTenantListPage` at `/admin/colleges`.
  - Directory table: Columns for College Name, Code, Affiliated University, Active Administrator, Approval Status Badge, Operational Status Badge, Created Date, Actions.
  - Interactive controls: Search input (debounced), status filter tabs (`ALL`, `ACTIVE`, `SUSPENDED`, `INACTIVE`), pagination.
  - Modals:
    - `CollegeTenantDetailModal`: Full operational dossier, contact details, active admin info, approved revision milestones.
    - `CollegeTenantEditModal`: Super Admin edit form with React Hook Form + Zod.
    - `CollegeStatusTransitionModal`: Warning modal for suspending/deactivating a college with explicit notification that all active sessions will be terminated immediately.
    - `ReplaceCollegeAdminModal`: Form to designate a replacement College Administrator.
  - TanStack Query hooks in `useCollegeManagement.ts` with query invalidation.
- **Automated Testing Requirements:**
  - Vitest component tests verifying table rendering, search/filter interactions, status modal confirmations, and 409 conflict handling.

---

### Module 4.2B — College Admin College Profile UI
- **Classification:** Frontend Presentation & Workflows (`COLLEGE_ADMIN`)
- **Business Objective:** Provide approved College Administrators with an intuitive, validated institutional profile management view at `/college/profile`.
- **Frontend Scope:**
  - Page: `CollegeProfilePage` at `/college/profile` (nested under `CollegeApprovalGuard` and `RoleGuard(['COLLEGE_ADMIN'])`).
  - Institutional Credentials Card: Read-only display of statutory legal name, permanent institutional code (`DEF01-TEST-001`), and affiliated university.
  - Profile Edit Form: Editable fields for contact phone, website URL, address line 1, address line 2, city, state, postal code.
  - Concurrency Conflict Banner: Intercepts HTTP 409 `STALE_APPLICATION_VERSION`, displays conflict warning, and prompts the user to refresh fresh data.
  - Navigation: Add "College Profile" navigation item to `AppLayout` sidebar/navbar for approved `COLLEGE_ADMIN` users.
- **Automated Testing Requirements:**
  - Vitest component tests verifying profile display, validation errors, successful update mutations, and 409 concurrency banners.

---

### Module 4.4 — Cross-Tenant Security & Operational Hardening Verification
- **Classification:** Consolidated Security & Integration Testing
- **Business Objective:** Rigorously verify tenant isolation invariants and security boundaries across all Phase 04 endpoints.
- **Scope & Invariants Tested:**
  - Cross-Tenant IDOR: College Admin A cannot view or mutate College B profile.
  - Lifecycle Lockout: A college still in onboarding (`PENDING` or `ACTION_REQUIRED`) attempting to call `/api/v1/colleges/my-college` is rejected with `403 COLLEGE_NOT_APPROVED`.
  - Suspension Invariant (`ADR-10`): When Super Admin suspends College A, every active browser session of College A receives `403 COLLEGE_SUSPENDED` on its next request, and subsequent login attempts are rejected.
  - Deactivation Invariant: Deactivated colleges receive `403 COLLEGE_INACTIVE`.
  - Concurrency Invariant: Concurrent updates with mismatched version numbers consistently reject with HTTP 409.

---

## 5. Architectural Clarification: Direct Creation vs. Onboarding Intake

An important finding from inspecting the documentation:
- Early PRD and Task documents (`docs/08-task-breakdown/tasks.md` TASK-04.02) originally envisioned `POST /api/v1/colleges` where a Super Admin directly creates colleges from scratch.
- However, the approved Phase 03 architecture established that **all colleges enter the platform via public self-registration (`POST /api/v1/college-registrations`) followed by Super Admin review and approval**.
- Once approved, a college becomes `ACTIVE` and transitions into Phase 04 management.

### Architectural Recommendation:
Phase 04 should focus strictly on the management of **onboarded, approved colleges** (`GET`, `PUT`, `PATCH /status`, `my-college`, and admin succession). Direct Super Admin creation (`POST /api/v1/colleges`) should either be:
1. **Deferred to Post-MVP**, as self-registration already satisfies collegiate intake.
2. Or, if required for enterprise provisioning, implemented as a thin convenience wrapper that creates an already-approved `College` entity with an initial revision.
The project roadmap ([roadmap.md#237-243](file:///c:/React/Acadlytic/docs/08-task-breakdown/roadmap.md#L237-L243)) already reflects this: it lists only `GET`, `PUT`, and `PATCH /status` for Phase 04, confirming that direct creation is not required for Phase 04 MVP closure.

---

## 6. Phase 03 Dependencies & Compatibility Assessment

### 6.1 Can Phase 04 safely proceed while Phase 03 manual verification is pending?
**Verdict: YES, WITH CLEAR GUARDS.**

### 6.2 Detailed Compatibility Analysis:
1. **Zero Blocker from Automated Status:** Phase 03 automated verification is completely green: 296/296 backend Testcontainers MySQL tests passing, 213/213 frontend Vitest tests passing, clean package build, DEF-01 Test A (`DOCUMENTS_REJECTED`) and Test B (`DOCUMENTS_NOT_VERIFIED`) verified.
2. **Strict Downstream Boundary:** Phase 04 does not alter the Phase 03 registration intake, document review, or approval decision switch. It consumes `colleges` that are already `APPROVED` and `ACTIVE`.
3. **Built-in Guard Protection:** [CollegeAccessGuard.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/security/CollegeAccessGuard.java) guarantees that any prospective college in Phase 03 (`PENDING`, `ACTION_REQUIRED`, `REJECTED`) cannot access Phase 04 management APIs.
4. **Independent Progress Tracking:** In [ACADLYTIC_MASTER_CONTEXT.md](file:///c:/React/Acadlytic/docs/00-project-overview/ACADLYTIC_MASTER_CONTEXT.md), Phase 03 status remains strictly `IN_PROGRESS` (with manual browser/API E2E verification pending). Phase 04 will be tracked independently starting as `IN_PROGRESS` upon initiation.
5. **Preservation of Disposable Test Colleges:**
   - College #5 (`DEF01-TEST-001`): Must remain untouched to preserve DEF-01 Test A evidence.
   - College #2 (`AHIT-VERIF-001`): Must remain untouched (historical data).
   - Colleges #1, #3, and #4: Already `APPROVED` and `ACTIVE` in local MySQL; ready for safe Phase 04 testing.

---

## 7. Recommended Implementation Sequence

In alignment with Acadlytic's established backend-first, test-driven development standards:

```text
Step 1: Module 4.1A — Database Migration (Flyway V7) & Entity Extension
        └── Add operational profile columns to `colleges`, backfill from `college_registrations`, update `College.java`.

Step 2: Module 4.1B — Super Admin College Tenant Hub APIs & Tests
        └── Implement `GET /api/v1/colleges`, `GET /api/v1/colleges/{id}`, `PUT /api/v1/colleges/{id}`,
            `PATCH /api/v1/colleges/{id}/status` + Testcontainers integration tests.

Step 3: Module 4.2A — College Admin Profile Management APIs & Tests
        └── Implement `GET /api/v1/colleges/my-college`, `PUT /api/v1/colleges/my-college` +
            strict tenant isolation & immutability tests.

Step 4: Module 4.3A — College Admin Replacement API & Tests
        └── Implement `PUT /api/v1/colleges/{id}/admin` enforcing ADR-06 & ADR-05 session revocation.

Step 5: Module 4.1C — Super Admin College Tenant Hub Frontend
        └── Build `/admin/colleges` directory table, filters, detail/edit modals, status action dialogs.

Step 6: Module 4.2B — College Admin Profile Frontend
        └── Build `/college/profile` view, edit form, validation, and 409 conflict handling.

Step 7: Module 4.4 — Cross-Tenant Security & Operational Hardening Verification
        └── Consolidated regression verification: cross-tenant IDOR, suspension lockouts, unapproved lockouts.
```

---

## 8. Risks, Blockers & Unresolved Questions

| Risk / Question | Impact | Recommended Resolution |
|:---|:---:|:---|
| **Direct Creation (`POST /api/v1/colleges`) Scope** | Low | Confirm that public self-registration (`POST /api/v1/college-registrations`) is the primary intake for MVP, and omit direct creation from Phase 04 MVP scope per `roadmap.md`. |
| **Profile Data Model Ownership** | Medium | Flyway V7 must add operational profile columns directly to `colleges` so active institutions can update their contact details without modifying immutable historical registration dossiers. |
| **Accidental Mutation of College #2 or #5** | High | Enforce strict test data targeting. All Phase 04 integration tests use dynamic Testcontainers IDs; manual tests use approved colleges #1, #3, or newly registered disposable colleges. |
| **Session Revocation Multi-Device Testing** | Low | Verify that `sessionRevocationService.revokeAllUserSessionsForCollege` terminates all active Spring Session JDBC records upon suspension (`ADR-10`). |

---

## 9. Recommended First Module for Planning

It is recommended to begin with:  
**Module 4.1A: College Tenant Schema & Operational Profile Foundation (Database & Entity)**  
followed immediately by **Module 4.1B: Super Admin College Tenant Hub APIs & Services**.

This establishes the underlying persistence and directory APIs before moving into profile editing and frontend interfaces.

---
*Report compiled strictly through non-mutating source code, database schema, and architectural inspection.*
