# Acadlytic — Module 4.3 Detailed Implementation Plan v1.0

**Module:** Phase 04 — Module 4.3: College Admin Profile APIs (Self-Service)  
**Parent Epic:** Epic E2 — Tenant Management & Profile  
**Document Version:** v1.0  
**Status:** DRAFT — AWAITING REVIEW & BUSINESS DECISION APPROVAL  
**Planning Baseline:** Approved Phase 04 v1.2 Module Breakdown & Dependency Plan (`docs/04-phase/Acadlytic_Phase_04_Final_Module_Breakdown_and_Dependency_Plan_v1.2.md`)  
**Dependency:** Module 4.1 — College Operational Profile & Schema Foundation (`APPROVED`)  
**Related Module:** Module 4.2 — Super Admin College Management APIs (`APPROVED`)  
**Target Completion:** Backend Self-Service Profile Endpoints for `COLLEGE_ADMIN`  

---

## 1. Executive Summary & Current-State Inspection Findings

### 1.1 Objective & Architectural Mandate
The objective of Module 4.3 is to implement the self-service backend REST APIs that allow an authenticated `COLLEGE_ADMIN` to inspect and update their own college's permitted operational profile fields.

**Strict Tenant Isolation Mandate:**
- Tenant ownership must be resolved **exclusively from trusted server-side authentication context** (`SecurityContextHolder` $\rightarrow$ `AcadlyticUserPrincipal.getCollegeId()`).
- Under no circumstance may a `COLLEGE_ADMIN` read or modify another college's profile by supplying, guessing, or manipulating a college ID.
- The endpoints must **not accept a `collegeId` parameter** in the URI path, query parameters, or request body.
- Self-service endpoints are strictly guarded by `CollegeAccessGuard.requireApprovedAndActiveCurrentCollege()`, enforcing live database validation that the tenant is approved, active, not suspended, not inactive, not archived, and not permanently rejected.

---

### 1.2 Mandatory Current-State Repository Inspection Findings

Inspection of the live codebase confirms the following concrete architectural baselines and constraints:

| Component / Artifact | File Location | Confirmed Live Implementation & Constraints |
| :--- | :--- | :--- |
| **`College` Entity** | [`College.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/entity/College.java) | Contains all 13 operational profile attributes added in Module 4.1 (`addressLine1`, `addressLine2`, `city`, `state`, `country`, `postalCode`, `contactPhone`, `contactEmail`, `websiteUrl`, `affiliatedUniversityName`, `establishedYear`, `accreditationDetails`, `logoStorageKey`), plus `@Version Long version` (optimistic locking), `status` (`CollegeStatus`), and `approvalStatus` (`CollegeApprovalStatus`). |
| **`CollegeRepository`** | [`CollegeRepository.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/repository/CollegeRepository.java) | Provides standard Spring Data JPA lookup methods (`findById`, `save`, `saveAndFlush`). Module 4.3 requires no custom repository queries. |
| **`CollegeAccessGuard`** | [`CollegeAccessGuard.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/security/CollegeAccessGuard.java#L103-L106) | Already implements `requireApprovedAndActiveCurrentCollege()`. Verifies: authenticated principal, non-null `collegeId`, live database record existence, not permanently rejected, not `SUSPENDED` (HTTP 403 `COLLEGE_SUSPENDED`), not `INACTIVE` or archived (HTTP 403 `COLLEGE_INACTIVE`), and status is `APPROVED` + `ACTIVE` (HTTP 403 `COLLEGE_NOT_APPROVED`). |
| **`SecurityContextService`** | [`SecurityContextService.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/security/SecurityContextService.java#L45-L54) | Provides `requireCurrentCollegeId()` and `requireCurrentUserId()`. Throws HTTP 401 `AUTH_UNAUTHENTICATED` if unauthenticated, and HTTP 403 `ACCESS_DENIED` if `collegeId == null`. |
| **`AuditEventType`** | [`AuditEventType.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/auth/entity/AuditEventType.java#L35) | Already defines `COLLEGE_PROFILE_UPDATED`. Used in Module 4.2 for Super Admin profile mutations. Module 4.3 reuses this exact event with `actor_role = COLLEGE_ADMIN`, `actor_college_id = collegeId`, and `target_college_id = collegeId`. |
| **`AuditEventService`** | [`AuditEventService.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/auth/service/AuditEventService.java) | Asynchronous audit event recorder accepting `eventType`, `actorUserId`, `actorRole`, `actorCollegeId`, `targetCollegeId`, `outcome`, `ipAddress`, and structured `metadata`. |
| **`GlobalExceptionHandler`** | [`GlobalExceptionHandler.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/common/exception/GlobalExceptionHandler.java) | Handles `AppException` mapping to standard error envelope (`ApiResponse.error(...)`), validation exceptions (`MethodArgumentNotValidException` mapped to HTTP 400 `VALIDATION_ERROR`), and concurrency conflicts (`OptimisticLockException` / `ObjectOptimisticLockingFailureException`). |
| **ADR Compliance** | ADR-05, ADR-06, ADR-07, ADR-10 | Strict compliance with ADR-07 (`@Version` optimistic locking and conflict resolution) and ADR-10 (immediate tenant lockout upon suspension). |

---

## 2. API Scope & Contract Specification

Module 4.3 introduces two primary self-service endpoints under the canonical path `/api/v1/college/profile`:

```
GET  /api/v1/college/profile — Retrieve own college profile
PUT  /api/v1/college/profile — Update permitted own college profile fields
```

*(Note: `/api/v1/colleges/my-college` is evaluated in Section 11 as a potential alias, with `/api/v1/college/profile` established as the canonical contract).*

---

### 2.1 Endpoint A: Own College Profile Retrieval

#### Request Contract
- **Method:** `GET`
- **Path:** `/api/v1/college/profile`
- **Headers:**
  - `Cookie: ACADLYTIC_SID=<session-id>` (Mandatory session cookie)
- **Parameters:** None. (No path variable, no query parameter).
- **Security:** `@PreAuthorize("hasRole('COLLEGE_ADMIN')")` + `CollegeAccessGuard.requireApprovedAndActiveCurrentCollege()`.

#### Response Contract (HTTP 200 OK)
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
    "websiteUrl": "https://www.apextech.edu.in",
    "affiliatedUniversityName": "Dr. A.P.J. Abdul Kalam Technical University",
    "establishedYear": 2005,
    "accreditationDetails": "NAAC A+ (Valid till 2028)",
    "hasLogo": false,
    "version": 3,
    "createdAt": "2026-11-20T10:15:30Z",
    "updatedAt": "2026-11-28T14:22:10Z"
  }
}
```

#### Field Exposure Rules for Retrieval
1. **Core Identity:** Exposes `id`, `name`, `code`, `approvalStatus`, and `status`.
2. **Operational Profile:** Exposes all 12 operational attributes (`addressLine1` through `accreditationDetails`).
3. **Logo Representation:** Exposes derived boolean `hasLogo` (`logoStorageKey != null && !logoStorageKey.isBlank()`). The raw storage key `logoStorageKey` is **never exposed**.
4. **Concurrency:** Exposes `version` (required for optimistic locking on subsequent `PUT`).
5. **Audit Timestamps:** Exposes `createdAt` and `updatedAt`.
6. **Internal / Protected Fields Excluded:**
   - `currentRegistrationId`, `currentRegistrationVersion`, `currentRegistrationStatus`, `currentRegistrationSubmittedAt`: Internal revision pointers used exclusively for Super Admin onboarding reviews; excluded from College Admin view.
   - `permanentlyRejected`, `archivedAt`: Excluded (unapproved or archived colleges are blocked with HTTP 403 anyway).
   - `resubmissionCount`, `actionRequiredCount`: Excluded.
   - `activeAdmin`: Excluded (the College Admin is the active admin inspecting their own profile).

---

### 2.2 Endpoint B: Own College Profile Update

#### Request Contract
- **Method:** `PUT`
- **Path:** `/api/v1/college/profile`
- **Headers:**
  - `Cookie: ACADLYTIC_SID=<session-id>` (Mandatory session cookie)
  - `X-XSRF-TOKEN: <csrf-token>` (Mandatory CSRF token)
  - `Content-Type: application/json`
- **Body Schema (`UpdateOwnCollegeProfileRequest`):**

```json
{
  "name": "Apex Institute of Technology",
  "code": "APEX-2026",
  "addressLine1": "Plot 42, Knowledge Park III",
  "addressLine2": "Sector 12, Institutional Area",
  "city": "Greater Noida",
  "state": "Uttar Pradesh",
  "country": "India",
  "postalCode": "201310",
  "contactPhone": "+91 98765 00000",
  "contactEmail": "admissions@apextech.edu.in",
  "websiteUrl": "https://apextech.edu.in",
  "affiliatedUniversityName": "Dr. A.P.J. Abdul Kalam Technical University",
  "establishedYear": 2005,
  "accreditationDetails": "NAAC A+ (Valid till 2028)",
  "version": 3
}
```

#### Response Contract (HTTP 200 OK)
Returns the updated `CollegeProfileResponse` envelope:
```json
{
  "success": true,
  "message": "College profile updated successfully.",
  "data": {
    "id": 101,
    "name": "Apex Institute of Technology",
    "code": "APEX-2026",
    "approvalStatus": "APPROVED",
    "status": "ACTIVE",
    "addressLine1": "Plot 42, Knowledge Park III",
    "addressLine2": "Sector 12, Institutional Area",
    "city": "Greater Noida",
    "state": "Uttar Pradesh",
    "country": "India",
    "postalCode": "201310",
    "contactPhone": "+91 98765 00000",
    "contactEmail": "admissions@apextech.edu.in",
    "websiteUrl": "https://apextech.edu.in",
    "affiliatedUniversityName": "Dr. A.P.J. Abdul Kalam Technical University",
    "establishedYear": 2005,
    "accreditationDetails": "NAAC A+ (Valid till 2028)",
    "hasLogo": false,
    "version": 4,
    "createdAt": "2026-11-20T10:15:30Z",
    "updatedAt": "2026-11-28T15:30:00Z"
  }
}
```

---

### 2.3 Detailed Error Contracts

| Condition / Scenario | HTTP Status | Error Code | Example Response Message |
| :--- | :---: | :--- | :--- |
| **Unauthenticated session** | `401 Unauthorized` | `AUTH_UNAUTHENTICATED` | `"Authentication is required."` |
| **Missing CSRF header on PUT** | `403 Forbidden` | `CSRF_ERROR` / `ACCESS_DENIED` | `"Invalid or missing CSRF token."` |
| **Non-College Admin role (e.g. Super Admin)** | `403 Forbidden` | `ACCESS_DENIED` | `"Access is denied"` |
| **College Admin without college association** | `403 Forbidden` | `ACCESS_DENIED` | `"Current user is not associated with a college tenant."` |
| **College record missing in database** | `403 Forbidden` | `COLLEGE_INACTIVE` | `"College tenant not found."` |
| **College is SUSPENDED (ADR-10)** | `403 Forbidden` | `COLLEGE_SUSPENDED` | `"This college account is currently suspended. Please contact Acadlytic support."` |
| **College is INACTIVE or archived** | `403 Forbidden` | `COLLEGE_INACTIVE` | `"This college account is inactive."` |
| **College not approved (PENDING/ACTION_REQUIRED)** | `403 Forbidden` | `COLLEGE_NOT_APPROVED` | `"College management features are locked until SUPER_ADMIN approves your registration."` |
| **College permanently rejected** | `403 Forbidden` | `REGISTRATION_PERMANENTLY_REJECTED` | `"This college registration has been permanently rejected."` |
| **Required validation failure (e.g. blank city)** | `400 Bad Request` | `VALIDATION_ERROR` | `"Validation failed for one or more fields: city: City is required"` |
| **Established year out of range (< 1800 or > 2100)**| `400 Bad Request` | `VALIDATION_ERROR` | `"Established year must be at least 1800"` |
| **Invalid contact email syntax** | `400 Bad Request` | `VALIDATION_ERROR` | `"Contact email must be a valid email address"` |
| **Attempt to modify immutable `code`** | `400 Bad Request` | `FIELD_IMMUTABLE` | `"College code is a permanent institutional identifier and cannot be modified."` |
| **Attempt to modify read-only `name`** | `400 Bad Request` | `FIELD_IMMUTABLE` | `"College legal name cannot be modified self-service. Please contact Super Admin support."` |
| **Attempt to modify read-only `affiliatedUniversityName`** | `400 Bad Request` | `FIELD_IMMUTABLE` | `"Affiliated university cannot be modified self-service. Please contact Super Admin support."` |
| **Attempt to modify read-only `accreditationDetails`** | `400 Bad Request` | `FIELD_IMMUTABLE` | `"Accreditation details cannot be modified self-service. Official verification is required."` |
| **Missing or mismatched version (stale update)** | `409 Conflict` | `STALE_COLLEGE_VERSION` | `"The college record has been modified by another administrator (version mismatch). Please reload and retry."` |

---

## 3. Field-Level Ownership & Permission Matrix

The following matrix formally specifies governance, mutability, and validation for every field of the `colleges` entity across Super Admin management (Module 4.2), College Admin self-service (Module 4.3), and system controls:

| Field Name | System Controlled | Super Admin (Mod 4.2) | College Admin (Mod 4.3) | Mutability & Governance Rules |
| :--- | :---: | :---: | :---: | :--- |
| `id` | Yes | Read-Only | Read-Only | Primary key. Never exposed as an update parameter. |
| `code` | Yes | Read-Only | **Read-Only / Immutable** | Permanent institutional code. Immutable for all roles. Attempted change throws HTTP 400 `FIELD_IMMUTABLE`. |
| `approvalStatus` | Yes | Managed (Review API) | Read-Only | Controlled exclusively by Phase 03 approval workflow. Not writable via PUT. |
| `status` | Yes | Managed (`PATCH /status`) | Read-Only | Operational lifecycle (`ACTIVE`, `SUSPENDED`, `INACTIVE`). Not writable via PUT. |
| `permanentlyRejected` | Yes | Managed (Review API) | Read-Only | Immutable onboarding rejection flag. Not writable via PUT. |
| `archivedAt` | Yes | System Managed | Read-Only | Archival timestamp. Not writable via PUT. |
| `name` | No | Editable (Audit Log) | **Read-Only (Default)** | **Flagged Business Decision 1.** Self-service rename would bypass verified legal documentation. Attempted change throws HTTP 400 `FIELD_IMMUTABLE`. |
| `affiliatedUniversityName` | No | Editable | **Read-Only (Default)** | **Flagged Business Decision 2.** University affiliation is vetted against university letters during onboarding. Attempted change throws HTTP 400 `FIELD_IMMUTABLE`. |
| `accreditationDetails` | No | Editable | **Read-Only (Default)** | **Flagged Business Decision 3.** Institutional accreditation requires official certification review. Attempted change throws HTTP 400 `FIELD_IMMUTABLE`. |
| `addressLine1` | No | Editable | **Editable (Required)** | Required, max 255 chars, trimmed. |
| `addressLine2` | No | Editable | **Editable (Optional)** | Optional, max 255 chars, blank/empty clears to `NULL`. |
| `city` | No | Editable | **Editable (Required)** | Required, max 100 chars, trimmed. |
| `state` | No | Editable | **Editable (Required)** | Required, max 100 chars, trimmed. |
| `country` | No | Editable | **Editable (Required)** | Required, max 100 chars, trimmed. |
| `postalCode` | No | Editable | **Editable (Required)** | Required, max 30 chars, trimmed. |
| `contactPhone` | No | Editable | **Editable (Optional)** | Optional, max 50 chars, blank/empty clears to `NULL`. |
| `contactEmail` | No | Editable | **Editable (Optional)** | Optional, max 255 chars, RFC 5322 format, blank/empty clears to `NULL`. Decoupled from login email. |
| `websiteUrl` | No | Editable | **Editable (Optional)** | Optional, max 255 chars, valid URL format, blank/empty clears to `NULL`. |
| `establishedYear` | No | Editable | **Editable (Optional)** | Optional, integer between 1800 and 2100. Check constraint `chk_colleges_established_year`. |
| `logoStorageKey` | System | Read-Only (Metadata) | Read-Only (Metadata) | Private storage key. Binary upload deferred to Post-MVP. Exposed only via derived `hasLogo`. |
| `version` | Yes | System Managed | **Concurrency Token** | Mandatory in `PUT` body for optimistic locking. Mismatch throws HTTP 409 `STALE_COLLEGE_VERSION`. |
| `createdAt` / `updatedAt` | Yes | Read-Only | Read-Only | Automatic JPA audit timestamps. |

---

## 4. Authentication, Authorization & Tenant-Isolation Design

### 4.1 Strict Server-Side Tenant Resolution (Zero IDOR)
- **Role Enforcement:** The controller class is secured with `@PreAuthorize("hasRole('COLLEGE_ADMIN')")`. Any request from a `SUPER_ADMIN`, unauthenticated caller, or anonymous user is rejected immediately at the Spring Security filter chain.
- **Tenant Context Extraction:** The tenant ID is extracted directly from the authenticated session principal via `securityContextService.requireCurrentCollegeId()`.
- **Zero Client-Supplied Tenant Identifiers:**
  - The URL contains no `{collegeId}`.
  - The query string contains no `?collegeId=...`.
  - The request body schema (`UpdateOwnCollegeProfileRequest`) contains **no `id` or `collegeId` field**.
  - If a client injects `"id": 999` or `"collegeId": 999` into the JSON payload, Jackson either ignores the unknown property or the service discards it.
  - The entity to update is retrieved **strictly** using `principal.getCollegeId()`.

### 4.2 Comprehensive Lifecycle Authorization Gate
Before executing any profile read or update, the service invokes:
```java
College college = collegeAccessGuard.requireApprovedAndActiveCurrentCollege();
```
This single call guarantees:
1. `principal.getCollegeId()` is non-null (else HTTP 403 `ACCESS_DENIED`).
2. The college row exists in the database (else HTTP 403 `COLLEGE_INACTIVE`).
3. The college is not permanently rejected (else HTTP 403 `REGISTRATION_PERMANENTLY_REJECTED`).
4. The college is not suspended (else HTTP 403 `COLLEGE_SUSPENDED` per ADR-10).
5. The college is not inactive or archived (else HTTP 403 `COLLEGE_INACTIVE`).
6. The college approval status is `APPROVED` and status is `ACTIVE` (else HTTP 403 `COLLEGE_NOT_APPROVED`).

### 4.3 Decoupling Institutional Contact Email from Administrator Login Credentials
- `colleges.contact_email` is strictly the institutional correspondence email (e.g. `admissions@college.edu`).
- `users.email` is strictly the personal administrator login credential.
- Updating `colleges.contact_email` via `PUT /api/v1/college/profile`:
  - **Does NOT modify** `users.email`.
  - **Does NOT invalidate** the College Admin's active session.
  - **Does NOT alter** email verification status (`email_verified_at`).
  - **Does NOT trigger** password reset or token re-issuance.

---

## 5. Validation, Normalization & Clearing Rules

### 5.1 Request DTO Definition: `UpdateOwnCollegeProfileRequest`

```java
package com.acadlytic.modules.colleges.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateOwnCollegeProfileRequest(
        @Size(max = 255, message = "College name must not exceed 255 characters")
        String name,

        @Size(max = 50, message = "College code must not exceed 50 characters")
        String code,

        @NotBlank(message = "Address line 1 is required")
        @Size(max = 255, message = "Address line 1 must not exceed 255 characters")
        String addressLine1,

        @Size(max = 255, message = "Address line 2 must not exceed 255 characters")
        String addressLine2,

        @NotBlank(message = "City is required")
        @Size(max = 100, message = "City must not exceed 100 characters")
        String city,

        @NotBlank(message = "State is required")
        @Size(max = 100, message = "State must not exceed 100 characters")
        String state,

        @NotBlank(message = "Country is required")
        @Size(max = 100, message = "Country must not exceed 100 characters")
        String country,

        @NotBlank(message = "Postal code is required")
        @Size(max = 30, message = "Postal code must not exceed 30 characters")
        String postalCode,

        @Size(max = 50, message = "Contact phone must not exceed 50 characters")
        String contactPhone,

        @Email(message = "Contact email must be a valid email address")
        @Size(max = 255, message = "Contact email must not exceed 255 characters")
        String contactEmail,

        @Size(max = 255, message = "Website URL must not exceed 255 characters")
        String websiteUrl,

        @Size(max = 255, message = "Affiliated university name must not exceed 255 characters")
        String affiliatedUniversityName,

        @Min(value = 1800, message = "Established year must be at least 1800")
        @Max(value = 2100, message = "Established year must be at most 2100")
        Integer establishedYear,

        @Size(max = 255, message = "Accreditation details must not exceed 255 characters")
        String accreditationDetails,

        @NotNull(message = "Record version is required for optimistic locking")
        Long version
) {
    public UpdateOwnCollegeProfileRequest {
        name = normalizeOptional(name);
        code = normalizeOptional(code);
        addressLine1 = normalizeRequired(addressLine1);
        addressLine2 = normalizeOptional(addressLine2);
        city = normalizeRequired(city);
        state = normalizeRequired(state);
        country = normalizeRequired(country);
        postalCode = normalizeRequired(postalCode);
        contactPhone = normalizeOptional(contactPhone);
        contactEmail = normalizeOptional(contactEmail);
        websiteUrl = normalizeOptional(websiteUrl);
        affiliatedUniversityName = normalizeOptional(affiliatedUniversityName);
        accreditationDetails = normalizeOptional(accreditationDetails);
    }

    private static String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static String normalizeRequired(String value) {
        return value != null ? value.trim() : null;
    }
}
```

### 5.2 Normalization & Clearing Rules
1. **Required Fields (`addressLine1`, `city`, `state`, `country`, `postalCode`):**
   - Whitespace is stripped via `normalizeRequired`.
   - Cannot be null, empty string, or whitespace-only (enforced by `@NotBlank`).
2. **Optional Fields (`addressLine2`, `contactPhone`, `contactEmail`, `websiteUrl`, `establishedYear`):**
   - If omitted from JSON, value is `null`.
   - If sent as explicit `null`, value is `null`.
   - If sent as empty string `""` or whitespace `"   "`, `normalizeOptional` normalizes the string to database `NULL`.
   - **Clearing Behavior:** Submitting an empty or null value for an optional field explicitly clears that field in the database.
3. **Read-Only / Immutable Field Guarding in Service Layer:**
   - To support frontend forms that serialize the entire college state (including disabled/read-only inputs), `name`, `code`, `affiliatedUniversityName`, and `accreditationDetails` are included in the DTO.
   - If the client submits the **same** value as currently stored in the database (or omits it), the request proceeds without error.
   - If the client submits a **differing** value, the service rejects the request immediately with HTTP 400 `FIELD_IMMUTABLE`:
     ```java
     validateImmutableField("code", college.getCode(), request.code(),
             "College code is a permanent institutional identifier and cannot be modified.");
     validateImmutableField("name", college.getName(), request.name(),
             "College legal name cannot be modified self-service. Please contact Super Admin support.");
     validateImmutableField("affiliatedUniversityName", college.getAffiliatedUniversityName(), request.affiliatedUniversityName(),
             "Affiliated university cannot be modified self-service. Please contact Super Admin support.");
     validateImmutableField("accreditationDetails", college.getAccreditationDetails(), request.accreditationDetails(),
             "Accreditation details cannot be modified self-service. Official verification is required.");
     ```

---

## 6. Audit & Optimistic-Locking Behavior

### 6.1 Audit Event Logging (`COLLEGE_PROFILE_UPDATED`)
- **Event Type:** `AuditEventType.COLLEGE_PROFILE_UPDATED` (reused directly from Module 4.2).
- **Actor Metadata:**
  - `actor_user_id`: Current College Admin's `userId`.
  - `actor_role`: `Role.COLLEGE_ADMIN`.
  - `actor_college_id`: College Admin's `collegeId`.
  - `target_college_id`: College Admin's `collegeId`.
  - `outcome`: `AuditOutcome.SUCCESS`.
  - `ip_address`: Resolved via `clientIpResolver.resolve(httpRequest)`.
- **Structured Payload (`metadata` JSON):**
  ```json
  {
    "collegeId": 101,
    "collegeCode": "APEX-2026",
    "source": "SELF_SERVICE",
    "changedFields": ["addressLine2", "contactPhone"],
    "diff": {
      "addressLine2": {
        "previous": "Institutional Area",
        "new": "Sector 12, Institutional Area"
      },
      "contactPhone": {
        "previous": "+91 98765 43210",
        "new": "+91 98765 00000"
      }
    }
  }
  ```
- **Sensitivity Invariant:** Audit metadata records strictly public operational field diffs. No passwords, tokens, or private storage keys are ever recorded.

### 6.2 No-Op Update Handling
- Before mutating the entity or invoking `saveAndFlush`, the service compares all permitted editable fields against current values.
- If `diff.isEmpty()`:
  - **No database update:** `collegeRepository.saveAndFlush` is NOT called.
  - **No version increment:** Version remains unchanged.
  - **No audit event:** `auditEventService.record` is NOT invoked.
  - **Return:** HTTP 200 OK with message `"College profile update resulted in no changes."` and current data.

### 6.3 Optimistic Locking & Concurrency Control (ADR-07)
- **Client Version Check:** The client must supply `version` matching the current database record version (`college.getVersion()`).
- **Pre-Check:** If `request.version() == null || !request.version().equals(college.getVersion())`, the service throws HTTP 409 `STALE_COLLEGE_VERSION`.
- **Database Flush:** `collegeRepository.saveAndFlush(college)` is executed within the transaction. If a concurrent transaction committed an update between entity load and flush, Hibernate's `OptimisticLockException` is caught and translated by `GlobalExceptionHandler` to HTTP 409 `STALE_COLLEGE_VERSION`.

---

## 7. Architecture & Component Design

### 7.1 New Class: `CollegeProfileController`
- **Location:** `backend/src/main/java/com/acadlytic/modules/colleges/controller/CollegeProfileController.java`
- **Annotations:**
  - `@RestController`
  - `@RequestMapping("/api/v1/college/profile")`
  - `@PreAuthorize("hasRole('COLLEGE_ADMIN')")`
  - `@Tag(name = "College Admin Profile", description = "Self-service operational profile inspection and modification for College Admins")`
- **Methods:**
  - `GET /api/v1/college/profile` $\rightarrow$ `ApiResponse<CollegeProfileResponse>`
  - `PUT /api/v1/college/profile` $\rightarrow$ `ApiResponse<CollegeProfileResponse>`

### 7.2 New Class: `CollegeProfileService`
- **Location:** `backend/src/main/java/com/acadlytic/modules/colleges/service/CollegeProfileService.java`
- **Responsibilities:**
  - Enforce tenant isolation and live lifecycle verification via `collegeAccessGuard.requireApprovedAndActiveCurrentCollege()`.
  - Validate read-only and immutable field constraints (`code`, `name`, `affiliatedUniversityName`, `accreditationDetails`).
  - Validate optimistic concurrency token (`version`).
  - Compute field diffs, execute safe mutations, and normalize optional attributes.
  - Detect no-op submissions.
  - Persist entity mutations with `saveAndFlush`.
  - Record `COLLEGE_PROFILE_UPDATED` audit events with actor attribution.
  - Construct and return `CollegeProfileResponse`.

### 7.3 New DTO: `CollegeProfileResponse`
- **Location:** `backend/src/main/java/com/acadlytic/modules/colleges/dto/CollegeProfileResponse.java`
- **Definition:**
  ```java
  package com.acadlytic.modules.colleges.dto;

  import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
  import com.acadlytic.modules.colleges.entity.CollegeStatus;

  import java.time.Instant;

  public record CollegeProfileResponse(
          Long id,
          String name,
          String code,
          CollegeApprovalStatus approvalStatus,
          CollegeStatus status,
          String addressLine1,
          String addressLine2,
          String city,
          String state,
          String country,
          String postalCode,
          String contactPhone,
          String contactEmail,
          String websiteUrl,
          String affiliatedUniversityName,
          Integer establishedYear,
          String accreditationDetails,
          boolean hasLogo,
          Long version,
          Instant createdAt,
          Instant updatedAt
  ) {}
  ```

---

## 8. Transaction Boundaries & Rollback Requirements

- **Transaction Scope:** `CollegeProfileService.updateOwnCollegeProfile` is annotated with `@Transactional(rollbackFor = Exception.class)`.
- **Atomicity:**
  - Entity profile mutation and optimistic locking version increment occur within a single database transaction.
  - Audit logging via `AuditEventService.record` is asynchronous / out-of-band (or executed on commit). If entity persistence fails, zero audit events are recorded.
  - If any validation, optimistic lock, or database exception occurs before commit, the transaction rolls back cleanly.
  - Zero partial updates: either all updated fields are persisted and version is incremented, or nothing is changed.

---

## 9. Comprehensive Testing Strategy

All automated integration testing must run against **Testcontainers MySQL 8.0.36** using `AbstractMySqlIntegrationTest`. No in-memory H2 databases are permitted.

### 9.1 Unit Testing: `CollegeProfileServiceUnitTest`
*Location:* `backend/src/test/java/com/acadlytic/modules/colleges/service/CollegeProfileServiceUnitTest.java`

| Test # | Test Method / Scenario | Expected Assertion |
| :---: | :--- | :--- |
| **01** | `getOwnCollegeProfile_Success` | Calls `collegeAccessGuard.requireApprovedAndActiveCurrentCollege()`, maps all 12 operational fields, computes `hasLogo` correctly. |
| **02** | `updateOwnCollegeProfile_Success_PermittedFields` | Verifies field mutation, version check, diff computation, `saveAndFlush`, and audit event recording. |
| **03** | `updateOwnCollegeProfile_StaleVersion_ThrowsConflict` | Throws HTTP 409 `STALE_COLLEGE_VERSION` when `request.version != college.version`. |
| **04** | `updateOwnCollegeProfile_ModifiedCode_ThrowsFieldImmutable` | Throws HTTP 400 `FIELD_IMMUTABLE` when `code` is altered. |
| **05** | `updateOwnCollegeProfile_ModifiedName_ThrowsFieldImmutable` | Throws HTTP 400 `FIELD_IMMUTABLE` when `name` is altered. |
| **06** | `updateOwnCollegeProfile_ModifiedUniversity_ThrowsFieldImmutable`| Throws HTTP 400 `FIELD_IMMUTABLE` when `affiliatedUniversityName` is altered. |
| **07** | `updateOwnCollegeProfile_ModifiedAccreditation_ThrowsFieldImmutable`| Throws HTTP 400 `FIELD_IMMUTABLE` when `accreditationDetails` is altered. |
| **08** | `updateOwnCollegeProfile_NoOp_SkipsSaveAndAudit` | Returns HTTP 200 with existing entity; verifies zero invocations of `collegeRepository.saveAndFlush` and `auditEventService.record`. |

---

### 9.2 Integration Testing: `CollegeProfileIntegrationTest` (48 Scenarios)
*Location:* `backend/src/test/java/com/acadlytic/modules/colleges/CollegeProfileIntegrationTest.java`

#### Category 1: Profile Retrieval (`GET /api/v1/college/profile`) (Scenarios 01–06)
- **01:** Active approved college admin successfully retrieves own profile (HTTP 200).
- **02:** Returned data matches persisted operational fields in database.
- **03:** Derived `hasLogo` is false when `logoStorageKey` is null; true when non-blank; raw key never exposed.
- **04:** Unauthenticated request rejected with HTTP 401 `AUTH_UNAUTHENTICATED`.
- **05:** Super Admin calling `GET /api/v1/college/profile` rejected with HTTP 403 `ACCESS_DENIED`.
- **06:** College Admin with missing college association (`collegeId == null`) rejected with HTTP 403 `ACCESS_DENIED`.

#### Category 2: Tenant Isolation & Lifecycle Restrictions on Retrieval (Scenarios 07–12)
- **07:** Suspended college admin rejected with HTTP 403 `COLLEGE_SUSPENDED` (ADR-10).
- **08:** Inactive college admin rejected with HTTP 403 `COLLEGE_INACTIVE`.
- **09:** Archived college admin rejected with HTTP 403 `COLLEGE_INACTIVE`.
- **10:** Unapproved college admin (`PENDING` approval status) rejected with HTTP 403 `COLLEGE_NOT_APPROVED`.
- **11:** Action required college admin (`ACTION_REQUIRED`) rejected with HTTP 403 `COLLEGE_NOT_APPROVED`.
- **12:** Permanently rejected college admin rejected with HTTP 403 `REGISTRATION_PERMANENTLY_REJECTED`.

#### Category 3: Permitted Profile Updates (`PUT /api/v1/college/profile`) (Scenarios 13–22)
- **13:** Full permitted update (address, phone, email, website, established year) succeeds (HTTP 200).
- **14:** Database entity reflects updated fields and incremented version (`version 0 -> 1`).
- **15:** Response envelope reflects updated fields and new version.
- **16:** Audit event `COLLEGE_PROFILE_UPDATED` created with `actor_role = COLLEGE_ADMIN`, `actor_college_id = collegeId`, `target_college_id = collegeId`, and accurate diff.
- **17:** Updating `contactEmail` does NOT alter `user.email` or invalidate admin login sessions.
- **18:** Clearing optional fields by sending explicit `null` sets database columns to `NULL`.
- **19:** Clearing optional fields by sending blank strings `""` or whitespace `"   "` normalizes to `NULL`.
- **20:** No-op update (submitting identical values) returns HTTP 200 without database write, without version increment, and without audit log.
- **21:** Established year boundary values (1800 and 2100) are accepted and persisted.
- **22:** Sequential updates increment version monotonically (`0 -> 1 -> 2`).

#### Category 4: Validation & Boundary Errors (Scenarios 23–31)
- **23:** Missing required field `addressLine1` returns HTTP 400 `VALIDATION_ERROR`.
- **24:** Missing required field `city` returns HTTP 400 `VALIDATION_ERROR`.
- **25:** Missing required field `state` returns HTTP 400 `VALIDATION_ERROR`.
- **26:** Missing required field `country` returns HTTP 400 `VALIDATION_ERROR`.
- **27:** Missing required field `postalCode` returns HTTP 400 `VALIDATION_ERROR`.
- **28:** Invalid `contactEmail` syntax (e.g. `not-an-email`) returns HTTP 400 `VALIDATION_ERROR`.
- **29:** `establishedYear` below 1800 (e.g. 1799) returns HTTP 400 `VALIDATION_ERROR`.
- **30:** `establishedYear` above 2100 (e.g. 2101) returns HTTP 400 `VALIDATION_ERROR`.
- **31:** Field length violations (e.g. `city` > 100 chars, `postalCode` > 30 chars) return HTTP 400 `VALIDATION_ERROR`.

#### Category 5: Protected Fields, Mass Assignment & Cross-Tenant Attacks (Scenarios 32–42)
- **32:** Attempt to modify immutable `code` returns HTTP 400 `FIELD_IMMUTABLE`.
- **33:** Attempt to modify read-only `name` returns HTTP 400 `FIELD_IMMUTABLE`.
- **34:** Attempt to modify read-only `affiliatedUniversityName` returns HTTP 400 `FIELD_IMMUTABLE`.
- **35:** Attempt to modify read-only `accreditationDetails` returns HTTP 400 `FIELD_IMMUTABLE`.
- **36:** Cross-Tenant IDOR Attack: Admin A injects `"collegeId": 999` in body — server resolves strictly Admin A's tenant (college 999 is untouched).
- **37:** Mass assignment attack: injecting `"status": "ACTIVE"` in JSON is ignored; college status is unaffected.
- **38:** Mass assignment attack: injecting `"approvalStatus": "APPROVED"` in JSON is ignored.
- **39:** Mass assignment attack: injecting `"permanentlyRejected": false` is ignored.
- **40:** Mass assignment attack: injecting `"logoStorageKey": "hacked-uuid"` is ignored.
- **41:** Super Admin attempting to call `PUT /api/v1/college/profile` returns HTTP 403 `ACCESS_DENIED`.
- **42:** Unauthenticated request to `PUT /api/v1/college/profile` returns HTTP 401 `AUTH_UNAUTHENTICATED`.

#### Category 6: Concurrency, Lifecycle & Rollback (Scenarios 43–48)
- **43:** Missing version in `PUT` returns HTTP 400 `VALIDATION_ERROR`.
- **44:** Stale version (`request.version != college.version`) returns HTTP 409 `STALE_COLLEGE_VERSION`.
- **45:** Concurrent update simulation produces HTTP 409 `STALE_COLLEGE_VERSION` on colliding transaction.
- **46:** `PUT` on `SUSPENDED` college returns HTTP 403 `COLLEGE_SUSPENDED` (ADR-10).
- **47:** `PUT` on `INACTIVE` college returns HTTP 403 `COLLEGE_INACTIVE`.
- **48:** `PUT` on unapproved college returns HTTP 403 `COLLEGE_NOT_APPROVED`.

---

## 10. Exact Files Expected to be Created or Modified

### 10.1 New Backend Production Files (4 files)
1. `backend/src/main/java/com/acadlytic/modules/colleges/controller/CollegeProfileController.java`
2. `backend/src/main/java/com/acadlytic/modules/colleges/service/CollegeProfileService.java`
3. `backend/src/main/java/com/acadlytic/modules/colleges/dto/CollegeProfileResponse.java`
4. `backend/src/main/java/com/acadlytic/modules/colleges/dto/UpdateOwnCollegeProfileRequest.java`

### 10.2 New Backend Test Files (2 files)
5. `backend/src/test/java/com/acadlytic/modules/colleges/service/CollegeProfileServiceUnitTest.java`
6. `backend/src/test/java/com/acadlytic/modules/colleges/CollegeProfileIntegrationTest.java`

### 10.3 Modified Files (0 files)
- **Zero production modifications required:**
  - `College.java`: Already contains all 13 operational columns, `@Version`, and lifecycle methods.
  - `CollegeRepository.java`: Standard JPA methods are fully sufficient.
  - `CollegeAccessGuard.java`: Already contains `requireApprovedAndActiveCurrentCollege()`.
  - `AuditEventType.java`: Already contains `COLLEGE_PROFILE_UPDATED`.
  - `GlobalExceptionHandler.java`: Already handles `AppException`, `MethodArgumentNotValidException`, and optimistic lock failures.
  - Database schema: **Zero Flyway migrations.** Existing V1–V7 baseline is fully preserved.

---

## 11. Dependencies, Risks & Implementation Sequence

### 11.1 Dependencies
- **Module 4.1 (`APPROVED`):** Provides the V7 database schema extension and `College` JPA entity with operational profile fields.
- **Module 4.2 (`APPROVED`):** Established optimistic locking conventions, error codes, and `COLLEGE_PROFILE_UPDATED` audit patterns.

### 11.2 Risks & Mitigation Strategies
1. **Risk: Cross-Tenant Data Access / Tampering (IDOR)**  
   *Mitigation:* Complete elimination of client-supplied tenant identifiers. The controller path has no ID variables, the DTO has no ID fields, and the service derives tenant context solely from `SecurityContextHolder`.
2. **Risk: Bypassing Onboarding Document Verification via Self-Service Renaming**  
   *Mitigation:* `name`, `code`, `affiliatedUniversityName`, and `accreditationDetails` are strictly Read-Only for College Admin. Any attempted modification returns HTTP 400 `FIELD_IMMUTABLE`.
3. **Risk: Concurrent Profile Edit Overwrites**  
   *Mitigation:* Strict `@Version` optimistic locking enforcement. Version mismatches return HTTP 409 `STALE_COLLEGE_VERSION`.
4. **Risk: Accidental Lockout via Email Updates**  
   *Mitigation:* Institutional contact email (`colleges.contact_email`) is decoupled from administrator login credentials (`users.email`). Updating contact email has zero effect on authentication.

### 11.3 Implementation Sequence
1. Create request and response DTOs (`CollegeProfileResponse`, `UpdateOwnCollegeProfileRequest`).
2. Implement `CollegeProfileService` with tenant guard, diff computation, no-op check, and audit logging.
3. Implement `CollegeProfileController` with Spring Security role annotations.
4. Implement `CollegeProfileServiceUnitTest` (8 unit tests).
5. Implement `CollegeProfileIntegrationTest` (48 Testcontainers MySQL integration scenarios).
6. Run full platform regression suite (382 existing + 48 new = 430 backend tests) to verify complete non-regression.

---

## 12. Explicit Exclusions & Acceptance Criteria

### 12.1 Explicit Exclusions
- **Module 4.4:** College Admin Assignment & Succession (`PUT /api/v1/super-admin/colleges/{id}/admin`).
- **Module 4.5 & 4.6:** Frontend UI implementations (`/admin/colleges` and `/college/profile`).
- **Module 4.7:** Cross-tenant security & operational hardening consolidation.
- **Binary Logo Handling:** Binary image upload, thumbnailing, resizing, streaming, or storage provider modifications (deferred to Post-MVP).
- **Database Migrations:** Zero new Flyway migrations.
- **Direct College Creation:** `POST /api/v1/colleges` is strictly excluded.

### 12.2 Acceptance Criteria
1. `GET /api/v1/college/profile` returns HTTP 200 with the authenticated College Admin's own college profile and derived `hasLogo`.
2. `PUT /api/v1/college/profile` allows updating permitted operational fields (`addressLine1`, `addressLine2`, `city`, `state`, `country`, `postalCode`, `contactPhone`, `contactEmail`, `websiteUrl`, `establishedYear`).
3. Attempting to modify `code`, `name`, `affiliatedUniversityName`, or `accreditationDetails` returns HTTP 400 `FIELD_IMMUTABLE`.
4. Supplying a mismatched version returns HTTP 409 `STALE_COLLEGE_VERSION`.
5. No-op updates return HTTP 200 without database write, without version increment, and without audit log.
6. Successful updates record `COLLEGE_PROFILE_UPDATED` in `audit_events` with `actor_role = COLLEGE_ADMIN`, `actor_college_id = collegeId`, and `diff` map.
7. Calls from unauthenticated users return HTTP 401; calls from Super Admin return HTTP 403 `ACCESS_DENIED`.
8. Calls from suspended colleges return HTTP 403 `COLLEGE_SUSPENDED`; inactive or unapproved colleges return HTTP 403 `COLLEGE_INACTIVE` or `COLLEGE_NOT_APPROVED`.
9. All 48 integration test scenarios pass on Testcontainers MySQL 8.0.36.
10. Full backend test suite passes with 0 failures, 0 errors, and 0 skipped.

---

## 13. Flagged Business Decisions Requiring User Confirmation

Before proceeding to implementation authorization, the following three business decisions are explicitly flagged for developer confirmation:

> ### Decision 1: College Legal Name Editability for College Admin
> - **Proposed Baseline (Recommended):** **Read-Only for College Admin.** College legal name was verified against government/accreditation certificates during onboarding. Allowing self-service renaming poses governance and integrity risks. Renaming must be performed by Super Admin (Module 4.2) or an official re-verification workflow. Attempted modification returns HTTP 400 `FIELD_IMMUTABLE`.
> - **Alternative:** Allow College Admin to edit legal name directly with `COLLEGE_PROFILE_UPDATED` audit log recording `previousName` and `newName`.

> ### Decision 2: Affiliated University & Accreditation Details Editability for College Admin
> - **Proposed Baseline (Recommended):** **Read-Only for College Admin.** Both fields represent official regulatory associations vetted against supporting documents. Super Admin may edit them via Module 4.2, but College Admin cannot modify them self-service. Attempted modification returns HTTP 400 `FIELD_IMMUTABLE`.
> - **Alternative:** Allow College Admin to update `affiliatedUniversityName` and `accreditationDetails` directly.

> ### Decision 3: Canonical Endpoint Path
> - **Proposed Baseline (Recommended):** Canonical path is `/api/v1/college/profile` (`GET` and `PUT`), aligning directly with the frontend route `/college/profile` in Module 4.6.
> - **Alternative:** Support `/api/v1/colleges/my-college` as the primary path or as an alias.
