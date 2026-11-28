# Acadlytic — Module 4.3 Implementation Report v1.1
## College Admin Profile APIs (Self-Service Backend)

**Module:** 4.3 — College Admin Profile APIs (Self-Service)  
**Phase:** 04 — College Management (Tenant Management & Profile)  
**Parent Epic:** Epic E2 — Tenant Management & Profile  
**Approved Planning Baseline:** `docs/04-phase/Acadlytic_Module_4.3_Detailed_Implementation_Plan_v1.1.md`  
**Report Version:** 1.1 (Contract Alignment & Verification Edition)  
**Implementation Status:** COMPLETED — PENDING DEVELOPER REVIEW & APPROVAL  
**Master Context Status:** NOT MODIFIED (Preserved in strict compliance with instructions)  

---

## 1. Executive Summary & v1.0 → v1.1 Correction Summary

This report documents the completed backend implementation and verification for **Phase 04 — Module 4.3: College Admin Profile APIs (Self-Service)**, updated to **v1.1** following the developer verification and contract alignment review.

### v1.0 → v1.1 Technical Corrections & Reconciliations:

1. **Established-Year Contract Alignment (Section 1):**
   - **Verification:** Inspection of `UpdateOwnCollegeProfileRequest.java` and `CollegeProfileService.java` confirms that the production code has always strictly enforced the approved range of **1800–2100** via `@Min(value = 1800)` and `@Max(value = 2100)` on the DTO record and service-level bounds checking (`request.establishedYear() < 1800 || request.establishedYear() > 2100`).
   - **Correction:** Corrected the Report v1.0 prose misstatement that mistakenly cited "current calendar year".
   - **Test Evidence:** Four boundary tests are verified passing in `CollegeProfileIntegrationTest`: 1800 (valid lower bound), 2100 (valid upper bound), 1799 (below minimum $\rightarrow$ HTTP 400 `VALIDATION_ERROR`), and 2101 (above maximum $\rightarrow$ HTTP 400 `VALIDATION_ERROR`).

2. **GET Response Contract Alignment (Section 2):**
   - **Verification:** Inspection of `CollegeAdminProfileResponse.java` and `CollegeProfileService.buildProfileResponse` confirms that **`approvalStatus`** and **`status`** are actively exposed in the response DTO, mapped directly from `College.getApprovalStatus()` and `College.getStatus()`, and verified in integration test scenario 02 (`testGetOwnProfile_ResponseEnvelopeContract`).
   - **Correction:** Corrected the Report v1.0 note that mistakenly listed `status` and `approvalStatus` under excluded fields. What is excluded from self-service responses are internal registration pointer fields (`currentRegistrationId`, `currentRegistrationVersion`, `currentRegistrationStatus`, `currentRegistrationSubmittedAt`), private storage keys (`logoStorageKey`), and lifecycle archive flags (`permanentlyRejected`). What is prohibited from modification via PUT are `status` and `approvalStatus`.
   - **Logo Representation:** Verified that `hasLogo` is derived strictly as `college.getLogoStorageKey() != null && !college.getLogoStorageKey().isBlank()`. Raw `logoStorageKey` is never exposed.

3. **Postal-Code Validation Alignment (Section 3):**
   - **Verification:** Inspection of Flyway migrations `V4__college_registration_schema.sql` and `V7__add_college_profile_fields.sql` confirms the database column capacity is `VARCHAR(30) NOT NULL`. Inspection of `UpdateOwnCollegeProfileRequest.java` confirms `@Size(max = 30, message = "Postal code must not exceed 30 characters")`.
   - **Correction:** Corrected the Report v1.0 typo that stated "max 20 chars".
   - **Test Evidence:** Added explicit boundary tests in `CollegeProfileIntegrationTest`: postal code with 30 characters is accepted and persisted (HTTP 200), and postal code with 31 characters is rejected with HTTP 400 `VALIDATION_ERROR`.

4. **Guard and Security Contract Reconciliation (Section 4):**
   - **Verification:** Reconciled method signatures across `CollegeAccessGuard`, `SecurityContextService`, and `CollegeProfileService`:
     - Tenant identity is derived strictly from `securityContextService.requireCurrentCollegeId()`.
     - College Admin role enforcement is active via `@PreAuthorize("hasRole('COLLEGE_ADMIN')")`.
     - Lifecycle preconditions are verified on every call via `collegeAccessGuard.requireApprovedAndActiveCurrentCollege()`.
     - Suspended colleges are rejected with HTTP 403 `COLLEGE_SUSPENDED` (ADR-10).
     - Inactive colleges are rejected with HTTP 403 `COLLEGE_INACTIVE`.
     - Unapproved colleges are rejected with HTTP 409 `COLLEGE_NOT_APPROVED`.
     - Permanently rejected colleges are rejected with HTTP 409 `REGISTRATION_PERMANENTLY_REJECTED`.

5. **Audit Contract & Rollback Evidence (Section 5):**
   - **Verification:** Confirmed that `auditEventService.record(...)` executes within the exact same database transaction as profile updates (`Propagation.REQUIRED`).
   - **Schema Contract:** Confirmed that the audit metadata schema implements the approved Plan v1.1 structure: `"collegeId"`, `"collegeCode"`, `"source": "SELF_SERVICE"`, `"changedFields"`, and `"diff": { "<fieldName>": { "previous": ..., "new": ... } }`.
   - **Rollback Verification:** Implemented and executed test scenario 55 in `CollegeProfileIntegrationTest` using `@SpyBean AuditEventService`: forcing an audit persistence failure inside the transaction causes an HTTP 500 `INTERNAL_ERROR`, completely rolls back database entity modifications, leaves the entity version untouched, and commits zero audit rows.

6. **Read-Only Property Presence & Whitespace Resistance (Section 6):**
   - **Verification:** Verified `FieldPresence<String>` custom Jackson deserialization across all 4 read-only fields (`name`, `code`, `affiliatedUniversityName`, `accreditationDetails`).
   - Omitted $\rightarrow$ Accepted (persisted value retained).
   - Explicit null $\rightarrow$ Rejected with HTTP 400 `FIELD_IMMUTABLE`.
   - Same value $\rightarrow$ Accepted (idempotent confirmation).
   - Modified value $\rightarrow$ Rejected with HTTP 400 `FIELD_IMMUTABLE`.
   - Whitespace-only submission $\rightarrow$ Normalized to null presence and rejected with HTTP 400 `FIELD_IMMUTABLE`. Cannot bypass immutability.

---

## 2. API Contract Specification

### 2.1 View Own College Profile
- **Endpoint:** `GET /api/v1/college/profile`
- **Authorization:** `@PreAuthorize("hasRole('COLLEGE_ADMIN')")`
- **Tenant Resolution:** Server-side via `SecurityContextService.getCurrentPrincipal().getCollegeId()`
- **Lifecycle Preconditions:** College must be `APPROVED` and `ACTIVE` (enforced via `CollegeAccessGuard.requireApprovedAndActiveCurrentCollege()`).
- **Response Status:** HTTP 200 OK
- **Response Structure:** `ApiResponse<CollegeAdminProfileResponse>`

#### Fields Returned:
```json
{
  "success": true,
  "message": "College profile retrieved successfully.",
  "data": {
    "id": 101,
    "name": "Apex Institute of Technology",
    "code": "APEX-2026",
    "approvalStatus": "APPROVED",
    "status": "ACTIVE",
    "addressLine1": "Plot 42, Knowledge Park III",
    "addressLine2": "Institutional Area",
    "city": "Greater Noida",
    "state": "Uttar Pradesh",
    "country": "India",
    "postalCode": "201310",
    "contactPhone": "+91 98765 43210",
    "contactEmail": "info@apextech.edu.in",
    "websiteUrl": "https://apextech.edu.in",
    "affiliatedUniversityName": "AKTU",
    "establishedYear": 2005,
    "accreditationDetails": "NAAC A+",
    "hasLogo": true,
    "version": 0,
    "createdAt": "2026-11-20T10:15:30Z",
    "updatedAt": "2026-11-28T14:22:10Z"
  }
}
```

> [!IMPORTANT]
> The raw internal storage key `logoStorageKey` is **never serialized** in the API response. Its presence is represented strictly by the derived boolean `hasLogo = (logoStorageKey != null && !logoStorageKey.isBlank())`.

---

### 2.2 Update Own College Profile
- **Endpoint:** `PUT /api/v1/college/profile`
- **Authorization:** `@PreAuthorize("hasRole('COLLEGE_ADMIN')")`
- **CSRF Protection:** Enforced via `CookieCsrfTokenRepository` + `X-XSRF-TOKEN` header.
- **Tenant Resolution:** Server-side via `SecurityContextService.getCurrentPrincipal().getCollegeId()`.
- **Response Status:** HTTP 200 OK
- **Response Structure:** `ApiResponse<CollegeAdminProfileResponse>`

#### Field Permissions & Guardrails on PUT:
| Field | Modifiable by College Admin? | Presence & Validation Rules |
| :--- | :---: | :--- |
| `name` | **NO** | Read-only. Omission or unchanged string accepted. Modifications (including null/whitespace) rejected with HTTP 400 `FIELD_IMMUTABLE`. |
| `code` | **NO** | Read-only permanent code. Omission or unchanged string accepted. Modifications rejected with HTTP 400 `FIELD_IMMUTABLE`. |
| `affiliatedUniversityName` | **NO** | Read-only. Omission or unchanged string accepted. Modifications rejected with HTTP 400 `FIELD_IMMUTABLE`. |
| `accreditationDetails` | **NO** | Read-only. Omission or unchanged string accepted. Modifications rejected with HTTP 400 `FIELD_IMMUTABLE`. |
| `addressLine1` | **YES** | Mandatory. Required non-blank, max 255 chars. Trimmed. |
| `addressLine2` | **YES** | Optional. Max 255 chars. Blank trimmed to `null`. Full replacement: omitted/null clears value. |
| `city` | **YES** | Mandatory. Required non-blank, max 100 chars. Trimmed. |
| `state` | **YES** | Mandatory. Required non-blank, max 100 chars. Trimmed. |
| `country` | **YES** | Mandatory. Required non-blank, max 100 chars. Trimmed. |
| `postalCode` | **YES** | Mandatory. Required non-blank, max 30 chars. Trimmed. |
| `contactPhone` | **YES** | Optional. Max 50 chars. Blank trimmed to `null`. Full replacement clears value. |
| `contactEmail` | **YES** | Optional. Valid email format, max 255 chars. Trimmed. Decoupled from user login credentials. |
| `websiteUrl` | **YES** | Optional. Validated via `WebsiteUrlValidator`. Scheme `http`/`https`, valid host/port, max 255 chars. Blank trimmed to `null`. |
| `establishedYear` | **YES** | Optional. Integer range 1800 to 2100. Cleared if omitted/null. |
| `version` | **REQUIRED** | Mandatory. Long integer. Must match current database version for optimistic locking. |

---

## 3. Exact File Inventory

### 3.1 Production Files Created (9 files)
| # | File Path | Purpose / Responsibilities |
| :-: | :--- | :--- |
| 1 | `backend/src/main/java/com/acadlytic/modules/colleges/controller/CollegeProfileController.java` | REST Controller exposing `GET` and `PUT /api/v1/college/profile` secured by `hasRole('COLLEGE_ADMIN')`. |
| 2 | `backend/src/main/java/com/acadlytic/modules/colleges/service/CollegeProfileService.java` | Core business service: tenant ownership, lifecycle validation, read-only field presence checks, optimistic locking, diff computation, no-op handling, and transactional audit logging. |
| 3 | `backend/src/main/java/com/acadlytic/modules/colleges/dto/CollegeAdminProfileResponse.java` | Response DTO returning 12 operational fields, `approvalStatus`, `status`, `hasLogo`, `version`, and timestamps. Dedicated name avoids collision with Phase 03 registration revision DTO. |
| 4 | `backend/src/main/java/com/acadlytic/modules/colleges/dto/UpdateOwnCollegeProfileRequest.java` | Request record using `FieldPresence<String>` for read-only fields, bean validation constraints (`@Size(max = 30)` for `postalCode`, `@Min(1800)` / `@Max(2100)` for `establishedYear`, `@ValidWebsiteUrl`). |
| 5 | `backend/src/main/java/com/acadlytic/modules/colleges/dto/UpdateOwnCollegeProfileRequestDeserializer.java` | Custom Jackson deserializer inspecting JSON AST tokens (`has` and `isNull`) to populate `FieldPresence<T>` accurately before Bean Validation runs. |
| 6 | `backend/src/main/java/com/acadlytic/modules/colleges/dto/FieldPresence.java` | Three-state presence container (`OMITTED`, `PRESENT_WITH_NULL`, `PRESENT_WITH_VALUE`) implementing Guardrail A. |
| 7 | `backend/src/main/java/com/acadlytic/modules/colleges/dto/WebsiteUrlValidator.java` | Robust static validator using `java.net.URI` for scheme (`http`/`https`), non-blank host, and port range (1–65535) (Guardrail B). |
| 8 | `backend/src/main/java/com/acadlytic/modules/colleges/dto/ValidWebsiteUrl.java` | JSR-380 validation annotation for website URL. |
| 9 | `backend/src/main/java/com/acadlytic/modules/colleges/dto/WebsiteUrlConstraintValidator.java` | Constraint validator bridge binding `ValidWebsiteUrl` to `WebsiteUrlValidator`. |

### 3.2 Test Files Created (2 files)
| # | File Path | Purpose / Responsibilities |
| :-: | :--- | :--- |
| 10 | `backend/src/test/java/com/acadlytic/modules/colleges/service/CollegeProfileServiceUnitTest.java` | 14 Mockito unit tests validating service logic, tenant resolution, read-only field verification, diff computation, stale version conflict, and no-op handling. |
| 11 | `backend/src/test/java/com/acadlytic/modules/colleges/CollegeProfileIntegrationTest.java` | 62 end-to-end integration tests on Testcontainers MySQL 8.0.36 covering retrieval, updates, validation, boundaries, immutability, CSRF, concurrency race conditions, allowlist filtering, and transactional rollback. |

### 3.3 Documentation Files (2 files)
| # | File Path | Purpose |
| :-: | :--- | :--- |
| 12 | `docs/04-phase/Acadlytic_Module_4.3_Implementation_Report_v1.0.md` | Initial implementation report. |
| 13 | `docs/04-phase/Acadlytic_Module_4.3_Implementation_Report_v1.1.md` | Updated contract alignment & verification report (this document). |

### 3.4 Unmodified Files Confirmation
- **Module 4.1 files:** Zero modifications.
- **Module 4.2 files:** Zero modifications.
- **Phase 03 files:** Zero modifications.
- **Database Migrations:** Zero Flyway migrations created or modified. V1–V7 intact.
- **ADRs:** Zero ADR modifications.
- **Master Context:** `docs/00-project-overview/ACADLYTIC_MASTER_CONTEXT.md` was **not** modified in this implementation turn. Reserved for explicit post-approval authorization.

---

## 4. Guard & Security Contract Reconciliation

| Security Layer | Implementation Mechanism | Enforced Behavior | Error Code & Status |
| :--- | :--- | :--- | :--- |
| **Authentication** | Spring Session JDBC (`ACADLYTIC_SID`) | Anonymous requests rejected | HTTP 401 `AUTH_UNAUTHENTICATED` |
| **CSRF Protection** | `SpaCsrfTokenRequestHandler` | Missing or invalid `X-XSRF-TOKEN` on PUT rejected | HTTP 403 `CSRF_TOKEN_INVALID` |
| **Role Authorization** | `@PreAuthorize("hasRole('COLLEGE_ADMIN')")` | Super Admin or other roles calling self-service endpoints rejected | HTTP 403 `ACCESS_DENIED` |
| **Tenant Derivation** | `SecurityContextService.requireCurrentCollegeId()` | Tenant ID extracted strictly from session principal; path/query `collegeId` ignored | HTTP 403 `ACCESS_DENIED` (if null) |
| **Suspended College** | `CollegeAccessGuard.requireApprovedAndActiveCollege()` | Suspended colleges locked out immediately (ADR-10) | HTTP 403 `COLLEGE_SUSPENDED` |
| **Inactive College** | `CollegeAccessGuard.requireApprovedAndActiveCollege()` | Inactive or archived colleges locked out | HTTP 403 `COLLEGE_INACTIVE` |
| **Unapproved College** | `CollegeAccessGuard.requireApprovedAndActiveCollege()` | Colleges in `PENDING` or `ACTION_REQUIRED` status locked out | HTTP 409 `COLLEGE_NOT_APPROVED` |
| **Permanently Rejected** | `CollegeAccessGuard.requireApprovedAndActiveCollege()` | Permanently rejected colleges locked out | HTTP 409 `REGISTRATION_PERMANENTLY_REJECTED` |

---

## 5. Audit Contract & Rollback Verification

### 5.1 Audit Metadata Schema
```json
{
  "collegeId": 101,
  "collegeCode": "APEX-2026",
  "source": "SELF_SERVICE",
  "changedFields": ["city", "websiteUrl", "contactPhone"],
  "diff": {
    "city": {
      "previous": "Greater Noida",
      "new": "Noida"
    },
    "websiteUrl": {
      "previous": "https://old.apextech.edu.in",
      "new": "https://apextech.edu.in"
    },
    "contactPhone": {
      "previous": "+91 98765 43210",
      "new": "+91 98765 00000"
    }
  }
}
```

### 5.2 Ten-Field Allowlist Enforcement
The diff calculation is strictly constrained to the ten editable operational fields:
`[addressLine1, addressLine2, city, state, country, postalCode, contactPhone, contactEmail, websiteUrl, establishedYear]`.

Disallowed, internal, and sensitive columns are mathematically prevented from entering audit metadata:
- `password` / `passwordHash`: Never present on `College`.
- `token`: Never present on `College`.
- `logoStorageKey`: Excluded from diff; logo presence is represented via derived `hasLogo`.
- `currentRegistrationId`: Internal pointer, excluded.
- `permanentlyRejected`: Lifecycle flag, excluded.

### 5.3 Transactional Rollback Evidence
Verified via `CollegeProfileIntegrationTest:testUpdateOwnProfile_TransactionalRollback_AuditFailureRollsBackAll`:
1. Simulated an unhandled persistence failure in `auditEventService.record(...)` using `@SpyBean`.
2. The caller transaction rolled back completely.
3. Reloaded the college entity from MySQL: `city` remained the original `"Greater Noida"` and `version` remained `0`.
4. Queried `audit_events`: zero audit rows were committed.
5. Client received HTTP 500 `INTERNAL_ERROR`.

---

## 6. Comprehensive Automated Test Evidence

### 6.1 Test Suite Summary

| Test Suite | Scope | Target Class / Module | Scenarios | Result | Time |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Module 4.3 Unit Tests** | Unit / Mockito | `CollegeProfileServiceUnitTest` | 14 | **14 / 14 PASS** | 0.11s |
| **Module 4.3 Integration Tests** | Full Testcontainers MySQL | `CollegeProfileIntegrationTest` | 62 | **62 / 62 PASS** | 260.3s |
| **Module 4.2 Unit Tests** | Unit / Mockito | `CollegeManagementServiceUnitTest` | 6 | **6 / 6 PASS** | 0.42s |
| **Module 4.2 Integration Tests** | Full Testcontainers MySQL | `SuperAdminCollegeIntegrationTest` | 46 | **46 / 46 PASS** | 120.5s |
| **Module 4.1 Unit Tests** | Unit / Mockito | `CollegeLifecycleServiceUnitTest` | 21 | **21 / 21 PASS** | 3.20s |
| **Module 4.1 Integration Tests** | Full Testcontainers MySQL | `CollegeApprovalIntegrationTest` | 25 | **25 / 25 PASS** | 78.4s |
| **Module 4.1 Migration Tests** | Flyway V7 Migration | `V7CollegeProfileMigrationTest` | 18 | **18 / 18 PASS** | 33.2s |
| **Full Platform Backend Tests** | Complete Platform Suite | 39 test classes | **458** | **458 / 458 PASS** | 11:02m |
| **Maven Clean Package** | Full Packaging Verification | `mvn clean package -DskipTests` | — | **BUILD SUCCESS** | 51.9s |

---

### 6.2 Module 4.3 Integration Test Inventory (62 Scenarios)

1. **Profile Retrieval (01–06):**
   - `01`: Active approved college admin successfully retrieves own profile (HTTP 200).
   - `02`: Response envelope exposes exactly 12 profile fields, `approvalStatus`, `status`, derived `hasLogo`, `version`, `createdAt`, `updatedAt`.
   - `03`: Response envelope never exposes raw internal `logoStorageKey`.
   - `04`: Derived `hasLogo` is false when `logoStorageKey` is null; true when non-blank.
   - `05`: Tenant isolation on GET: Admin A never sees Admin B's profile; `collegeId` query parameter ignored.
   - `06`: College Admin with missing college association rejected with HTTP 403 `COLLEGE_INACTIVE`.

2. **Tenant Isolation & Lifecycle Restrictions on Retrieval (07–12):**
   - `07`: Suspended college admin rejected with HTTP 403 `COLLEGE_SUSPENDED` (ADR-10).
   - `08`: Inactive college admin rejected with HTTP 403 `COLLEGE_INACTIVE`.
   - `09`: Pending verification college admin rejected with HTTP 409 `COLLEGE_NOT_APPROVED`.
   - `10`: Permanently rejected college admin rejected with HTTP 409 `REGISTRATION_PERMANENTLY_REJECTED`.
   - `11`: Super Admin calling `GET /api/v1/college/profile` rejected with HTTP 403 `ACCESS_DENIED`.
   - `12`: Unauthenticated request to `GET /api/v1/college/profile` rejected with HTTP 401 `AUTH_UNAUTHENTICATED`.

3. **Valid Profile Updates (13–17):**
   - `13`: Updating address, city, state, country, postalCode succeeds (HTTP 200).
   - `14`: Response envelope reflects updated version (`initialVersion + 1`).
   - `15`: Database entity persisted with updated fields and incremented version.
   - `16`: `AuditEventType.COLLEGE_PROFILE_UPDATED` created with `source: SELF_SERVICE`, changed fields, accurate diff.
   - `17`: Updating `contactEmail` does NOT alter `user.email` or invalidate admin session.

4. **Optional Fields & Normalization (18–22):**
   - `18`: Clearing optional fields by sending explicit null sets database columns to `NULL`.
   - `19`: Clearing optional fields by sending blank strings or whitespace normalizes to `NULL`.
   - `20`: No-op update returns HTTP 200 without database write, without version increment, and without audit log.
   - `21`: Leading and trailing whitespace on text fields trimmed before saving.
   - `22`: Sequential updates increment version monotonically (`0 -> 1 -> 2`).

5. **Validation Failures on Modifiable Fields (23–37):**
   - `23`: Blank `addressLine1` returns HTTP 400 `VALIDATION_ERROR`.
   - `24`: `addressLine1` exceeding 255 chars returns HTTP 400 `VALIDATION_ERROR`.
   - `25`: Blank `city` returns HTTP 400 `VALIDATION_ERROR`.
   - `26`: Blank `state` returns HTTP 400 `VALIDATION_ERROR`.
   - `27`: Missing required field `postalCode` returns HTTP 400 `VALIDATION_ERROR`.
   - `27b`: Postal code with exactly 30 characters is valid and persisted.
   - `27c`: Postal code with 31 characters exceeds max 30 and returns HTTP 400 `VALIDATION_ERROR`.
   - `28`: Invalid `contactEmail` format returns HTTP 400 `VALIDATION_ERROR`.
   - `29`: `establishedYear` below 1800 (1799) returns HTTP 400 `VALIDATION_ERROR`.
   - `30`: `establishedYear` above 2100 (2101) returns HTTP 400 `VALIDATION_ERROR`.
   - `31`: Established year boundary values (1800 and 2100) are accepted and persisted.
   - `32`: Valid website URLs accepted (`http`, `https`, ports, subdomains).
   - `33`: Malformed website URL (missing scheme, not a URL) returns HTTP 400 `VALIDATION_ERROR`.
   - `34`: Unsupported URL scheme (`ftp`, `javascript`, `data`, `file`) returns HTTP 400 `VALIDATION_ERROR`.
   - `35`: Website URL with invalid/out-of-range port returns HTTP 400 `VALIDATION_ERROR`.
   - `36`: Website URL exceeding 255 chars returns HTTP 400 `VALIDATION_ERROR`.
   - `37`: Blank or whitespace website URL normalizes to `NULL` without validation failure.

6. **Read-Only Property Presence Semantics — Guardrail A (38–43f):**
   - `38`: Omitted read-only fields in JSON are accepted and preserve persisted values.
   - `39`: Explicitly supplied read-only fields equal to persisted values are accepted.
   - `40`: Explicit null for `name` when persisted is non-null returns HTTP 400 `FIELD_IMMUTABLE`.
   - `41`: Explicit null for `code` when persisted is non-null returns HTTP 400 `FIELD_IMMUTABLE`.
   - `42`: Explicit null for university when persisted is non-null returns HTTP 400 `FIELD_IMMUTABLE`.
   - `43`: Explicit null for accreditation when persisted is non-null returns HTTP 400 `FIELD_IMMUTABLE`.
   - `43b`: Whitespace-only submission for read-only `name` cannot bypass immutability and returns HTTP 400 `FIELD_IMMUTABLE`.
   - `43c`: Attempt to modify read-only `name` returns HTTP 400 `FIELD_IMMUTABLE`.
   - `43d`: Attempt to modify read-only `code` returns HTTP 400 `FIELD_IMMUTABLE`.
   - `43e`: Attempt to modify read-only `affiliatedUniversityName` returns HTTP 400 `FIELD_IMMUTABLE`.
   - `43f`: Attempt to modify read-only `accreditationDetails` returns HTTP 400 `FIELD_IMMUTABLE`.

7. **Security, Tenant Isolation & Mass Assignment (44–49):**
   - `44`: Injected `collegeId: 999` in JSON body is ignored; caller's college updated; 999 untouched.
   - `45`: Query parameter `?collegeId=999` on PUT is ignored; caller's college updated; 999 untouched.
   - `46`: Cross-tenant update prevention: College Admin A cannot update College B's profile.
   - `47`: Super Admin calling `PUT /api/v1/college/profile` returns HTTP 403 `ACCESS_DENIED`.
   - `48`: Unauthenticated request to `PUT /api/v1/college/profile` returns HTTP 401 `AUTH_UNAUTHENTICATED`.
   - `49`: Missing CSRF token on PUT returns HTTP 403 `CSRF_TOKEN_INVALID`.

8. **Concurrency, Audit Allowlist & Rollback (50–55):**
   - `50`: Missing version in PUT returns HTTP 400 `VALIDATION_ERROR`.
   - `51`: Stale version (`request.version != college.version`) returns HTTP 409 `STALE_COLLEGE_VERSION`.
   - `52`: Real concurrent update race: competing request receives HTTP 409 `STALE_COLLEGE_VERSION`.
   - `53`: Audit diff allowlist: verified protected/internal fields never enter audit metadata.
   - `54`: PUT on `SUSPENDED` college returns HTTP 403 `COLLEGE_SUSPENDED` (ADR-10).
   - `55`: Transactional Rollback: Audit failure inside transaction rolls back database entity mutation and version.

---

## 7. Strict Scope & Invariant Compliance

| Boundary / Invariant | Status | Verification Evidence |
| :--- | :---: | :--- |
| **Backend Only** | **VERIFIED** | Zero frontend files modified; all work confined to `backend/src/main` and `backend/src/test`. |
| **No Migration Changes** | **VERIFIED** | Zero new Flyway migrations created. Migrations V1–V7 intact. |
| **No Prior Module Code Changes** | **VERIFIED** | Modules 4.1 and 4.2 classes and tests unchanged; 100% regression tests pass. |
| **Phase 03 Preserved as IN_PROGRESS** | **VERIFIED** | Phase 03 state unchanged; zero regressions across Phase 03 registration review code. |
| **Master Context Untouched** | **VERIFIED** | `docs/00-project-overview/ACADLYTIC_MASTER_CONTEXT.md` was NOT modified in this turn. Reserved for post-approval authorization. |
| **Clean Package Build** | **VERIFIED** | `mvn clean package -DskipTests` produces valid JAR with `BUILD SUCCESS`. |

---

## 8. Conclusion

Phase 04 — Module 4.3: College Admin Profile APIs (Self-Service) has undergone complete implementation verification, boundary testing, transactional rollback validation, and full platform regression testing.

The module is marked **COMPLETED — PENDING DEVELOPER REVIEW & APPROVAL**.
