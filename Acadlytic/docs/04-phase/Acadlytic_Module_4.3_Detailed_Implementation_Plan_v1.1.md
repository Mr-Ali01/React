# Acadlytic — Module 4.3 Detailed Implementation Plan v1.1

**Module:** Phase 04 — Module 4.3: College Admin Profile APIs (Self-Service)  
**Parent Epic:** Epic E2 — Tenant Management & Profile  
**Document Version:** v1.1 (Consolidated Revision)  
**Status:** READY FOR APPROVAL  
**Planning Baseline:** Approved Phase 04 v1.2 Module Breakdown & Dependency Plan (`docs/04-phase/Acadlytic_Phase_04_Final_Module_Breakdown_and_Dependency_Plan_v1.2.md`)  
**Dependency:** Module 4.1 — College Operational Profile & Schema Foundation (`APPROVED`)  
**Related Module:** Module 4.2 — Super Admin College Management APIs (`APPROVED`)  
**Target Completion:** Backend Self-Service Profile Endpoints for `COLLEGE_ADMIN`  

---

## 1. Locked Business Decisions

The project owner has explicitly reviewed and formally locked the following three business decisions:

1. **College Name Editability (`name`):**  
   `name` is **Read-Only** for `COLLEGE_ADMIN`. College legal name was verified against official registration and incorporation certificates during Phase 03 onboarding. Self-service renaming by College Admin is strictly prohibited to prevent bypassing institutional verification. Super Admin may update college name through Module 4.2 (`PUT /api/v1/super-admin/colleges/{id}`) with mandatory `previousName` and `newName` audit logging. If a College Admin submits a modified name, the request is rejected with HTTP 400 `FIELD_IMMUTABLE`.
2. **Affiliated University & Accreditation Details Editability (`affiliatedUniversityName`, `accreditationDetails`):**  
   Both fields are **Read-Only** for `COLLEGE_ADMIN`. Both represent official regulatory and institutional associations vetted against supporting documents (university affiliation letters, NAAC/NBA certificates) during onboarding. Super Admin may update them through Module 4.2. If a College Admin submits modified values for either field, the request is rejected with HTTP 400 `FIELD_IMMUTABLE`.
3. **Canonical Self-Service API Path:**  
   The canonical self-service API path is `GET /api/v1/college/profile` and `PUT /api/v1/college/profile`. The legacy planning suggestion `/api/v1/colleges/my-college` is **NOT** introduced, eliminating alias confusion and aligning directly with the frontend route `/college/profile` in Module 4.6.

These decisions are locked and will not be reopened.

---

## 2. Current-State Source Inspection & Architectural Findings

Inspection of the live codebase confirms the following concrete baselines, constraints, and boundaries:

| Component / Artifact | File Location | Confirmed Live Implementation & Constraints |
| :--- | :--- | :--- |
| **`College` Entity** | [`College.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/entity/College.java) | Contains all 13 operational profile attributes added in Module 4.1 (`addressLine1`, `addressLine2`, `city`, `state`, `country`, `postalCode`, `contactPhone`, `contactEmail`, `websiteUrl`, `affiliatedUniversityName`, `establishedYear`, `accreditationDetails`, `logoStorageKey`), plus `@Version Long version` (optimistic locking), `status` (`CollegeStatus`), and `approvalStatus` (`CollegeApprovalStatus`). |
| **`CollegeRepository`** | [`CollegeRepository.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/repository/CollegeRepository.java) | Provides standard Spring Data JPA lookup and persistence methods (`findById`, `save`, `saveAndFlush`). Module 4.3 requires no custom SQL or repository queries. |
| **`CollegeAccessGuard`** | [`CollegeAccessGuard.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/security/CollegeAccessGuard.java#L103-L106) | Implements `requireApprovedAndActiveCurrentCollege()`. Verifies: authenticated principal, non-null `collegeId`, live database record existence, not permanently rejected, not `SUSPENDED` (HTTP 403 `COLLEGE_SUSPENDED`), not `INACTIVE` or archived (HTTP 403 `COLLEGE_INACTIVE`), and status is `APPROVED` + `ACTIVE` (HTTP 403 `COLLEGE_NOT_APPROVED`). |
| **`SecurityContextService`** | [`SecurityContextService.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/security/SecurityContextService.java#L45-L54) | Provides `requireCurrentCollegeId()` and `requireCurrentUserId()`. Throws HTTP 401 `AUTH_UNAUTHENTICATED` if unauthenticated, and HTTP 403 `ACCESS_DENIED` if `collegeId == null`. |
| **`AuditEventType`** | [`AuditEventType.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/auth/entity/AuditEventType.java#L35) | Defines `COLLEGE_PROFILE_UPDATED`. Used in Module 4.2 for Super Admin profile updates. Module 4.3 reuses this exact event with `actor_role = Role.COLLEGE_ADMIN`, `actor_college_id = collegeId`, and `target_college_id = collegeId`. |
| **`AuditEventService`** | [`AuditEventService.java`](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/auth/service/AuditEventService.java#L38-L49) | `record(...)` executes with `@Transactional(propagation = Propagation.REQUIRED)`. It runs within the caller's database transaction. If the caller transaction rolls back, audit event rows are atomically rolled back. Strips forbidden key substrings (`password`, `token`, `secret`, `hash`, etc.). |
| **V7 Migration Schema** | [`V7__add_college_profile_fields.sql`](file:///c:/React/Acadlytic/backend/src/main/resources/db/migration/V7__add_college_profile_fields.sql#L14-L27) | Confirmed: `established_year INT NULL` was added as a plain nullable integer column without a database-level `CHECK` constraint (to ensure maximum MySQL 8.0 / MariaDB cross-compatibility). The constraint `chk_colleges_established_year` does **NOT** exist in the schema. Established year validation (1800–2100) is enforced strictly at DTO and service level. No schema changes will be made. |
| **Jackson Configuration** | [`application.yml`](file:///c:/React/Acadlytic/backend/src/main/resources/application.yml#L12-L15) | Standard Spring Boot Jackson configuration (`default-property-inclusion: non_null`). Deserialization safety is guaranteed by annotating the request DTO with `@JsonIgnoreProperties(ignoreUnknown = true)` and strictly resolving tenant context on the server side. |
| **ADR Compliance** | ADR-05, ADR-06, ADR-07, ADR-10 | Strict compliance with ADR-07 (`@Version` optimistic locking and conflict resolution) and ADR-10 (immediate tenant lockout upon suspension). |

---

## 3. API Scope & Contract Specification

### 3.1 Endpoint A: Own College Profile Retrieval

#### Request Contract
- **Method:** `GET`
- **Path:** `/api/v1/college/profile`
- **Headers:** `Cookie: ACADLYTIC_SID=<session-id>` (Mandatory session cookie)
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
   - `currentRegistrationId`, `currentRegistrationVersion`, `currentRegistrationStatus`, `currentRegistrationSubmittedAt`: Excluded.
   - `permanentlyRejected`, `archivedAt`: Excluded.
   - `resubmissionCount`, `actionRequiredCount`: Excluded.
   - `activeAdmin`: Excluded (the caller is the active administrator inspecting their own institution).

---

### 3.2 Endpoint B: Own College Profile Update (Full-Replacement Semantics)

#### Full-Replacement Semantics
`PUT /api/v1/college/profile` is a **full replacement of the College Admin editable profile subset**, not a PATCH:
- **Complete State Requirement:** The client must submit the complete desired state of all editable fields on every PUT.
- **Required Fields:** Mandatory on every update (`addressLine1`, `city`, `state`, `country`, `postalCode`, `version`). Omitting or submitting blank values returns HTTP 400 `VALIDATION_ERROR`.
- **Optional Fields Clearing Behavior:** If an optional editable field (`addressLine2`, `contactPhone`, `contactEmail`, `websiteUrl`, `establishedYear`) is omitted from JSON, submitted as explicit `null`, empty string `""`, or whitespace-only `"   "`, it normalizes to database `NULL`. Clients must resubmit existing values to retain them.
- **Read-Only Fields Invariance:** Read-only fields (`name`, `code`, `affiliatedUniversityName`, `accreditationDetails`) may be omitted or submitted matching their current database values. Submitting a modified value returns HTTP 400 `FIELD_IMMUTABLE`.
- **System Fields Invariance:** System-controlled fields (`id`, `approvalStatus`, `status`, `permanentlyRejected`, `logoStorageKey`, `createdAt`, `updatedAt`, `currentRegistrationId`, etc.) cannot be modified via PUT and are ignored or rejected.

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

### 3.3 Error Response Contracts

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
| **Malformed website URL or unsupported scheme** | `400 Bad Request` | `VALIDATION_ERROR` | `"Website URL must be a valid HTTP or HTTPS URL"` |
| **Attempt to modify immutable `code`** | `400 Bad Request` | `FIELD_IMMUTABLE` | `"College code is a permanent institutional identifier and cannot be modified."` |
| **Attempt to modify read-only `name`** | `400 Bad Request` | `FIELD_IMMUTABLE` | `"College legal name cannot be modified self-service. Please contact Super Admin support."` |
| **Attempt to modify read-only `affiliatedUniversityName`** | `400 Bad Request` | `FIELD_IMMUTABLE` | `"Affiliated university cannot be modified self-service. Please contact Super Admin support."` |
| **Attempt to modify read-only `accreditationDetails`** | `400 Bad Request` | `FIELD_IMMUTABLE` | `"Accreditation details cannot be modified self-service. Official verification is required."` |
| **Missing or mismatched version (stale update)** | `409 Conflict` | `STALE_COLLEGE_VERSION` | `"The college record has been modified by another administrator (version mismatch). Please reload and retry."` |

---

## 4. Field-Level Ownership & Permission Matrix

| Field Name | System Controlled | Super Admin (Mod 4.2) | College Admin (Mod 4.3) | Mutability & Governance Rules |
| :--- | :---: | :---: | :---: | :--- |
| `id` | Yes | Read-Only | Read-Only | Primary key. Immutable. |
| `code` | Yes | Read-Only | **Read-Only / Immutable** | Permanent code. Modifying returns HTTP 400 `FIELD_IMMUTABLE`. |
| `approvalStatus` | Yes | Review API | Read-Only | Controlled exclusively by Phase 03 review workflow. |
| `status` | Yes | Managed (`PATCH /status`) | Read-Only | Operational lifecycle (`ACTIVE`, `SUSPENDED`, `INACTIVE`). |
| `permanentlyRejected` | Yes | Review API | Read-Only | Permanent rejection flag. |
| `archivedAt` | Yes | System Managed | Read-Only | Archival timestamp. |
| `name` | No | Editable (Audit Log) | **Read-Only (Locked)** | Legal name verified during onboarding. Modifying returns HTTP 400 `FIELD_IMMUTABLE`. |
| `affiliatedUniversityName` | No | Editable | **Read-Only (Locked)** | Affiliation verified during onboarding. Modifying returns HTTP 400 `FIELD_IMMUTABLE`. |
| `accreditationDetails` | No | Editable | **Read-Only (Locked)** | Regulatory credentials. Modifying returns HTTP 400 `FIELD_IMMUTABLE`. |
| `addressLine1` | No | Editable | **Editable (Required)** | Required, max 255 chars, trimmed. |
| `addressLine2` | No | Editable | **Editable (Optional)** | Optional, max 255 chars, blank clears to `NULL`. |
| `city`, `state`, `country` | No | Editable | **Editable (Required)** | Required, max 100 chars, trimmed. |
| `postalCode` | No | Editable | **Editable (Required)** | Required, max 30 chars, trimmed. |
| `contactPhone` | No | Editable | **Editable (Optional)** | Optional, max 50 chars, blank clears to `NULL`. |
| `contactEmail` | No | Editable | **Editable (Optional)** | Optional, max 255 chars, RFC 5322 format, blank clears to `NULL`. Decoupled from user credentials. |
| `websiteUrl` | No | Editable | **Editable (Optional)** | Optional, max 255 chars, HTTP/HTTPS URL syntax, blank clears to `NULL`. |
| `establishedYear` | No | Editable | **Editable (Optional)** | Optional, integer between 1800 and 2100. DTO validation `@Min(1800)`, `@Max(2100)`. |
| `logoStorageKey` | System | Read-Only (Metadata) | Read-Only (Metadata) | Private storage key. Binary upload deferred. Exposed as `hasLogo`. |
| `version` | Yes | System Managed | **Concurrency Token** | Mandatory in `PUT` body for optimistic locking. Mismatch returns HTTP 409 `STALE_COLLEGE_VERSION`. |
| `createdAt` / `updatedAt` | Yes | Read-Only | Read-Only | Automatic JPA audit timestamps. |

---

## 5. Validation, Normalization & URL Verification Rules

### 5.1 Request DTO Definition: `UpdateOwnCollegeProfileRequest`

```java
package com.acadlytic.modules.colleges.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@JsonIgnoreProperties(ignoreUnknown = true)
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
        @Pattern(
                regexp = "^(?i)https?://[a-zA-Z0-9.-]+(?:\\.[a-zA-Z0-9.-]+)*(?::[0-9]{1,5})?(?:/[^\\s]*)?$",
                message = "Website URL must be a valid HTTP or HTTPS URL"
        )
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

### 5.2 Normalization, Clearing & URL Rules
1. **Compact Constructor Normalization Ordering:**  
   In Java records, the compact constructor executes **before** standard Bean Validation (`@Valid`) annotations are evaluated.
   - If `websiteUrl` is sent as `""` or `"   "`, `normalizeOptional` converts it to `null`.
   - Bean Validation specifications dictate that `@Pattern` constraints are evaluated only when the field is non-null (`null` is valid). Thus, blank strings safely clear the URL to `NULL` without triggering validation errors.
2. **Robust Website URL Validation Rules:**
   - **Allowed Schemes:** Strictly `http://` and `https://` (case-insensitive).
   - **Disallowed Schemes:** `ftp://`, `javascript:`, `data:`, `file:`, etc., fail validation with HTTP 400 `VALIDATION_ERROR`.
   - **Malformed URLs:** Unparseable strings, missing schemes (e.g. `apextech.edu.in`), or invalid host characters fail validation with HTTP 400 `VALIDATION_ERROR`.
   - **Supported Valid Formats:** `https://apextech.edu.in`, `http://www.college.ac.in/admissions?ref=web`, `http://localhost:8080`.
3. **Established Year Validation (DTO/Service Level):**
   - Verified: Flyway V7 added `established_year INT NULL` without a DB-level `CHECK` constraint.
   - Validation is enforced at DTO level via `@Min(1800)` and `@Max(2100)` and checked in the service.
   - Boundary values `1800` and `2100` are valid. Values `< 1800` or `> 2100` return HTTP 400 `VALIDATION_ERROR`.

---

## 6. Tenant Isolation, Unknown Properties & Attack Mitigation

### 6.1 Server-Side Tenant Resolution (Zero IDOR)
- **Role Guard:** The controller is secured with `@PreAuthorize("hasRole('COLLEGE_ADMIN')")`.
- **Identity Source:** The tenant ID is retrieved strictly via:
  ```java
  Long collegeId = securityContextService.requireCurrentCollegeId();
  ```
  This reads `SecurityContextHolder.getContext().getAuthentication().getPrincipal().getCollegeId()`.
- **Zero Client-Supplied Tenant Identifiers:** The URI path `/api/v1/college/profile` has no `{collegeId}`. The query string has no `collegeId`. The DTO record contains no `collegeId` or `id` component.

### 6.2 Unknown Property Injections & Mass-Assignment Protection
- **DTO Annotations:** Annotated with `@JsonIgnoreProperties(ignoreUnknown = true)`.
- **Protection Against Injected Fields:** If an attacker injects `"collegeId": 999`, `"id": 999`, `"status": "ACTIVE"`, `"approvalStatus": "APPROVED"`, `"permanentlyRejected": false`, or `"logoStorageKey": "attacker-key"` into the request body:
  1. Jackson ignores the unrecognized property during deserialization.
  2. The service layer references strictly the validated getter methods of `UpdateOwnCollegeProfileRequest`.
  3. The entity to update is retrieved strictly by the authenticated admin's `collegeId`.
  4. The database row for College 999 is never queried or mutated.
  5. The target college's `status`, `approvalStatus`, `permanentlyRejected`, and `logoStorageKey` remain completely untouched.

---

## 7. Audit Transaction Semantics & Diff Allowlist

### 7.1 Audit Transaction Guarantees (`AuditEventService`)
Inspection of `AuditEventService.java` reveals that `record(...)` is annotated with:
```java
@Transactional(propagation = Propagation.REQUIRED)
public AuditEvent record(...) { ... }
```
- **Same-Transaction Guarantee:** `auditEventService.record(...)` executes **within the exact same database transaction** as `CollegeProfileService.updateOwnCollegeProfile`.
- **Atomic Rollback Guarantee:** If any step in `updateOwnCollegeProfile` fails (e.g. database flush error, optimistic locking failure, constraint violation), the entire transaction rolls back. **Zero audit event rows are committed to `audit_events`.**
- **Atomic Commit Guarantee:** If and only if the profile update transaction commits successfully, both the modified `colleges` row and the `audit_events` row are committed together atomically.

### 7.2 Audit Diff Allowlist (Strict Whitelist)
To prevent internal metadata, credentials, or protected fields from leaking into audit history, diff calculation is constrained strictly to the **10 permitted editable operational fields**:

```java
private static final Set<String> ALLOWED_DIFF_FIELDS = Set.of(
        "addressLine1",
        "addressLine2",
        "city",
        "state",
        "country",
        "postalCode",
        "contactPhone",
        "contactEmail",
        "websiteUrl",
        "establishedYear"
);
```

**Strict Diff Exclusion Rules:**
- `id`, `code`, `name`, `affiliatedUniversityName`, `accreditationDetails`: Read-only/immutable; never enter the diff.
- `status`, `approvalStatus`, `permanentlyRejected`, `archivedAt`: System-controlled; never enter the diff.
- `logoStorageKey`: Raw storage key is private; never entered into diff.
- `version`, `createdAt`, `updatedAt`, `currentRegistrationId`: Concurrency and revision pointers; never entered into diff.

### 7.3 Structured Audit Payload Schema
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

### 7.4 No-Op Update Handling
- If `diff.isEmpty()` (i.e. every permitted editable field in the request matches the current entity value):
  - No database update is performed (`collegeRepository.saveAndFlush` is skipped).
  - Version is not incremented.
  - Zero audit events are written (`auditEventService.record` is skipped).
  - Returns HTTP 200 OK with message `"College profile update resulted in no changes."` and current entity state.

---

## 8. Concurrency Control & Real Race Testing (ADR-07)

### 8.1 Optimistic Locking Mechanics
- **Mandatory Version:** The client must provide the `version` attribute obtained from the retrieval response.
- **Pre-Flush Version Check:** If `request.version() == null || !request.version().equals(college.getVersion())`, the service throws HTTP 409 `STALE_COLLEGE_VERSION`.
- **Database-Level Flush Check:** In `updateOwnCollegeProfile`, `collegeRepository.saveAndFlush(college)` forces Hibernate to execute the SQL `UPDATE colleges SET ... version = version + 1 WHERE id = ? AND version = ?`. If a concurrent transaction committed first, Hibernate throws `OptimisticLockException`, which `GlobalExceptionHandler` translates to HTTP 409 `STALE_COLLEGE_VERSION`.

### 8.2 Real Concurrent Update Test Design (Testcontainers MySQL)
Mocking optimistic lock exceptions is insufficient. The integration test suite (`CollegeProfileIntegrationTest`) must execute **real concurrent database updates against Testcontainers MySQL 8.0.36**:
1. **Sequential Stale Update Test:**
   - Admin A and Admin B read profile at `version = 0`.
   - Admin A updates `city = "City A"` with `version = 0` $\rightarrow$ Commits (DB version becomes `1`).
   - Admin B submits update with `version = 0` $\rightarrow$ Rejected with HTTP 409 `STALE_COLLEGE_VERSION`.
   - Assert: DB version is `1`, `city = "City A"`, exactly 1 audit event exists.
2. **Simultaneous Thread Race Test:**
   - Two concurrent threads execute `PUT /api/v1/college/profile` simultaneously against the same college at `version = 0` using a `CountDownLatch` or `CompletableFuture`.
   - Exactly one thread succeeds with HTTP 200 (`version = 1`).
   - The colliding thread receives HTTP 409 `STALE_COLLEGE_VERSION`.
   - Assert: Database version is incremented exactly once (`version = 1`), no dirty writes occur, and exactly one audit event is persisted.

---

## 9. Architecture & Component Design

### 9.1 New Class: `CollegeProfileController`
- **Location:** `backend/src/main/java/com/acadlytic/modules/colleges/controller/CollegeProfileController.java`
- **Annotations:**
  - `@RestController`
  - `@RequestMapping("/api/v1/college/profile")`
  - `@PreAuthorize("hasRole('COLLEGE_ADMIN')")`
  - `@Tag(name = "College Admin Profile", description = "Self-service operational profile inspection and modification for College Admins")`
- **Endpoints:**
  - `GET /api/v1/college/profile` $\rightarrow$ `ApiResponse<CollegeProfileResponse>`
  - `PUT /api/v1/college/profile` $\rightarrow$ `ApiResponse<CollegeProfileResponse>`

### 9.2 New Class: `CollegeProfileService`
- **Location:** `backend/src/main/java/com/acadlytic/modules/colleges/service/CollegeProfileService.java`
- **Dependencies:**
  - `CollegeRepository`
  - `CollegeAccessGuard`
  - `SecurityContextService`
  - `AuditEventService`
  - `ClientIpResolver`
- **Methods:**
  - `public CollegeProfileResponse getOwnCollegeProfile()`
  - `@Transactional(rollbackFor = Exception.class) public CollegeProfileResponse updateOwnCollegeProfile(UpdateOwnCollegeProfileRequest request, HttpServletRequest httpRequest)`

### 9.3 New DTO: `CollegeProfileResponse`
- **Location:** `backend/src/main/java/com/acadlytic/modules/colleges/dto/CollegeProfileResponse.java`

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

## 10. Comprehensive Test Matrix

All automated integration testing runs against **Testcontainers MySQL 8.0.36** using `AbstractMySqlIntegrationTest`.

### 10.1 Unit Testing: `CollegeProfileServiceUnitTest` (8 Tests)
*Location:* `backend/src/test/java/com/acadlytic/modules/colleges/service/CollegeProfileServiceUnitTest.java`

| Test # | Test Method / Scenario | Expected Assertion |
| :---: | :--- | :--- |
| **01** | `getOwnCollegeProfile_Success` | Calls `requireApprovedAndActiveCurrentCollege()`, maps 12 operational fields, computes `hasLogo` correctly. |
| **02** | `updateOwnCollegeProfile_Success_PermittedFields` | Verifies field mutation, version check, diff computation, `saveAndFlush`, and audit recording. |
| **03** | `updateOwnCollegeProfile_StaleVersion_ThrowsConflict` | Throws HTTP 409 `STALE_COLLEGE_VERSION` when `request.version != college.version`. |
| **04** | `updateOwnCollegeProfile_ModifiedCode_ThrowsFieldImmutable` | Throws HTTP 400 `FIELD_IMMUTABLE` when `code` is altered. |
| **05** | `updateOwnCollegeProfile_ModifiedName_ThrowsFieldImmutable` | Throws HTTP 400 `FIELD_IMMUTABLE` when `name` is altered. |
| **06** | `updateOwnCollegeProfile_ModifiedUniversity_ThrowsFieldImmutable`| Throws HTTP 400 `FIELD_IMMUTABLE` when `affiliatedUniversityName` is altered. |
| **07** | `updateOwnCollegeProfile_ModifiedAccreditation_ThrowsFieldImmutable`| Throws HTTP 400 `FIELD_IMMUTABLE` when `accreditationDetails` is altered. |
| **08** | `updateOwnCollegeProfile_NoOp_SkipsSaveAndAudit` | Returns HTTP 200 with existing entity; zero invocations of `collegeRepository.saveAndFlush` and `auditEventService.record`. |

---

### 10.2 Integration Testing: `CollegeProfileIntegrationTest` (48 Scenarios)
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

#### Category 5: URL Validation & Injected Properties Mitigation (Scenarios 32–40)
- **32:** Valid website URLs (`https://apextech.edu.in`, `http://www.college.ac.in`) accepted and persisted.
- **33:** Malformed website URL (e.g. `not a url`, `apextech.edu.in` without scheme) returns HTTP 400 `VALIDATION_ERROR`.
- **34:** Unsupported URL scheme (e.g. `ftp://apextech.edu.in`, `javascript:alert(1)`) returns HTTP 400 `VALIDATION_ERROR`.
- **35:** Blank or whitespace website URL normalizes to `NULL` without validation failure.
- **36:** Injected tenant identifier (`"collegeId": 999` in body) is safely ignored; caller's own college is updated, and College 999 is untouched.
- **37:** Injected system fields (`"status": "SUSPENDED"`, `"approvalStatus": "APPROVED"`, `"permanentlyRejected": false`) are ignored; college status is unaffected.
- **38:** Injected `logoStorageKey` is ignored; raw storage key is unaffected.
- **39:** Super Admin attempting to call `PUT /api/v1/college/profile` returns HTTP 403 `ACCESS_DENIED`.
- **40:** Unauthenticated request to `PUT /api/v1/college/profile` returns HTTP 401 `AUTH_UNAUTHENTICATED`.

#### Category 6: Protected Fields, Concurrency & Rollback (Scenarios 41–48)
- **41:** Attempt to modify immutable `code` returns HTTP 400 `FIELD_IMMUTABLE`.
- **42:** Attempt to modify read-only `name` returns HTTP 400 `FIELD_IMMUTABLE`.
- **43:** Attempt to modify read-only `affiliatedUniversityName` returns HTTP 400 `FIELD_IMMUTABLE`.
- **44:** Attempt to modify read-only `accreditationDetails` returns HTTP 400 `FIELD_IMMUTABLE`.
- **45:** Stale version (`request.version != college.version`) returns HTTP 409 `STALE_COLLEGE_VERSION`.
- **46:** Real concurrent update race: competing thread receives HTTP 409 `STALE_COLLEGE_VERSION`, exactly one version increment and one audit event persisted.
- **47:** `PUT` on `SUSPENDED` college returns HTTP 403 `COLLEGE_SUSPENDED` (ADR-10).
- **48:** Transaction rollback: failure during flush or audit rolls back all entity modifications atomically.

---

## 11. Exact Files Expected to be Created or Modified

### 11.1 New Production Files (4 files)
1. `backend/src/main/java/com/acadlytic/modules/colleges/controller/CollegeProfileController.java`
2. `backend/src/main/java/com/acadlytic/modules/colleges/service/CollegeProfileService.java`
3. `backend/src/main/java/com/acadlytic/modules/colleges/dto/CollegeProfileResponse.java`
4. `backend/src/main/java/com/acadlytic/modules/colleges/dto/UpdateOwnCollegeProfileRequest.java`

### 11.2 New Test Files (2 files)
5. `backend/src/test/java/com/acadlytic/modules/colleges/service/CollegeProfileServiceUnitTest.java`
6. `backend/src/test/java/com/acadlytic/modules/colleges/CollegeProfileIntegrationTest.java`

### 11.3 Modified Files (0 files)
- **Zero production modifications required:**
  - `College.java`: Unchanged.
  - `CollegeRepository.java`: Unchanged.
  - `CollegeAccessGuard.java`: Unchanged.
  - `AuditEventType.java`: Unchanged.
  - `GlobalExceptionHandler.java`: Unchanged.
  - Database schema: **Zero Flyway migrations.** Existing V1–V7 baseline is completely preserved.

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

## 13. Implementation Readiness

Following the incorporation of all three locked business decisions and the resolution of all technical corrections, **no P0 or P1 architectural blockers remain**. Module 4.3 Detailed Implementation Plan v1.1 is **COMPLETE and READY FOR FORMAL IMPLEMENTATION AUTHORIZATION**.
