# DEF-01 Manual API Verification — Preflight Report v1.0

**Document Version:** 1.0  
**Date:** 2026-11-27  
**Scope:** Preflight Inspection for DEF-01 Document Verification Gate Manual API Verification  
**Target:** Disposable college `DEF01 Gate Test College`  
**Status:** `NOT READY — SETUP REQUIRED` (Backend Process Restart Required)

---

## 1. Executive Summary & Readiness Verdict

### Overall Verdict: `NOT READY — SETUP REQUIRED`

A complete, non-mutating preflight inspection was conducted on the development environment and MySQL database (`localhost:3306`). 

The database entities for `DEF01 Gate Test College` (College ID: `5`, Registration ID: `6`) are in the **exact required state** to verify the DEF-01 approval block:
- College status is `PENDING` with optimistic version `1`.
- Registration status is `PENDING`.
- All mandatory document categories are present (`UNIVERSITY_AFFILIATION_CERTIFICATE` and `AUTHORIZED_SIGNATORY_ID`).
- Active mandatory document `AUTHORIZED_SIGNATORY_ID` (Document ID: `20`) has verification status `REJECTED` and is **not superseded**.
- The Super Admin account (`owner@acadlytic.com`) is in status `ACTIVE` with `0` failed login attempts.

**Reason for `NOT READY` Verdict:**
The active backend process listening on port `8080` (PID `22844`, child of `mvn spring-boot:run` PID `17104`) has been running continuously since **10:52:04 AM**. The DEF-01 remediation (which placed the document verification gate inside `case APPROVE ->` in `CollegeReviewService.java`) and the `saveAndFlush` test stabilization were compiled into `backend/target/classes` between **7:15 PM and 7:22 PM**. Because standard JVM execution does not dynamically hot-reload modified classes, the running backend in memory is currently executing **pre-remediation bytecode**. Executing the approval request against PID `22844` prior to a restart would test stale code.

**Remediation to Achieve `READY FOR MANUAL TEST`:**
Stop the running backend process (PID `17104` / `22844`) and restart it using `mvn spring-boot:run` (or launch `target/acadlytic-backend-0.0.1-SNAPSHOT.jar`).

---

## 2. Live Environment & Process Inspection

| Inspection Item | Value / Finding | Status / Detail |
|:---|:---|:---:|
| **Active Port** | `8080` | `LISTENING` on `0.0.0.0:8080` and `[::]:8080` |
| **Backend Process PID** | `22844` (`java.exe`) | Spawned by `mvn spring-boot:run` (PID `17104`) |
| **Process Start Time** | `11/27/2026 10:52:04 AM` | Pre-dates DEF-01 implementation (~6:00 PM) |
| **Compiled Class Timestamp** | `11/27/2026 7:19:36 PM` | `target/classes/.../CollegeReviewService.class` |
| **Running Code State** | **STALE (Pre-remediation)** | **Needs process restart to load latest bytecode** |
| **Database Host / Port** | `localhost:3306` | MySQL Service (`mysqld.exe` PID `7492`) |

---

## 3. Source Code Verification

### 3.1 Document Verification Gate Placement
Inspected `backend/src/main/java/com/acadlytic/modules/colleges/service/CollegeReviewService.java` (lines 528–585):
- `case APPROVE ->` contains the hierarchical document lock:
  ```java
  List<CollegeRegistrationDocument> docs = collegeRegistrationDocumentRepository
          .findByRegistrationIdWithLock(submittedRevision.getId());
  ```
- Evaluates active (non-superseded) documents.
- Asserts mandatory categories (`UNIVERSITY_AFFILIATION_CERTIFICATE` and `AUTHORIZED_SIGNATORY_ID`).
- Identifies any active document with `verificationStatus == REJECTED`:
  ```java
  CollegeRegistrationDocument rejectedDoc = activeDocs.stream()
          .filter(d -> d.getVerificationStatus() == DocumentVerificationStatus.REJECTED)
          .findFirst()
          .orElse(null);

  if (rejectedDoc != null) {
      throw new AppException(
              "DOCUMENTS_REJECTED",
              "Cannot approve application: Document '"
                      + rejectedDoc.getOriginalFilename() + "' ("
                      + rejectedDoc.getDocumentCategory()
                      + ") was rejected. Action must be requested to allow document replacement.",
              HttpStatus.CONFLICT);
  }
  ```
- Throws `AppException` with HTTP status `409 Conflict` and error code `DOCUMENTS_REJECTED`.

### 3.2 `saveAndFlush` Correction
Inspected `backend/src/main/java/com/acadlytic/modules/colleges/service/CollegeReviewService.java` (line 921):
- `CollegeRegistrationDocument savedDoc = collegeRegistrationDocumentRepository.saveAndFlush(doc);` is confirmed present.

---

## 4. Target Entity State (`DEF01 Gate Test College`)

Read-only SQL queries executed against MySQL (`acadlytic` database) verified the following exact state:

### 4.1 College Record
| Field | Value | Notes |
|:---|:---|:---|
| **`id`** | `5` | Target disposable college |
| **`name`** | `DEF01 Gate Test College` | Matches target name |
| **`code`** | `DEF01-TEST-001` | Permanent code |
| **`approval_status`** | `PENDING` | Awaiting Super Admin decision |
| **`status`** | `PENDING_VERIFICATION` | Pre-operational status |
| **`version`** | `1` | Optimistic locking version for request |
| **`current_registration_id`** | `6` | Active submitted registration |

### 4.2 Registration Revision Record
| Field | Value | Notes |
|:---|:---|:---|
| **`id`** | `6` | Revision ID |
| **`college_id`** | `5` | Matches parent college |
| **`version_number`** | `1` | Revision 1 |
| **`status`** | `PENDING` | Submitted and awaiting review |
| **`submitted_for_review_at`** | `2026-11-27 10:15:39` | Valid submission timestamp |
| **`reviewer_user_id`** | `NULL` | No prior review committed |
| **`review_notes`** | `NULL` | Clean |
| **`rejection_reason`** | `NULL` | Clean |

### 4.3 Active Verification Documents
| Document ID | Category | Original Filename | Verification Status | Provenance | Replaces ID | Version | Notes |
|:---:|:---|:---|:---:|:---:|:---:|:---:|:---|
| **19** | `INSTITUTION_REGISTRATION_PROOF` | `Resultpoint.png` | `ACCEPTED` | `DIRECT_REVIEW` | `NULL` | `1` | Active optional document |
| **20** | `AUTHORIZED_SIGNATORY_ID` | `IMG_20261124_081613477_HDR.jpg.jpeg` | **`REJECTED`** | `DIRECT_REVIEW` | `NULL` | `1` | **Target rejected mandatory document** |
| **21** | `UNIVERSITY_AFFILIATION_CERTIFICATE` | `Resultpoint.png` | `ACCEPTED` | `DIRECT_REVIEW` | `NULL` | `1` | Active mandatory document |

### 4.4 Supersession / Replacement Verification
- No documents exist in the database with `replaces_document_id = 20`.
- Document `20` belongs to active submitted revision `6`.
- Document `20` is **active, rejected, and non-superseded**.
- Stored rejection reason: `"Authorized Signatory ID not upload again"`.

### 4.5 Super Admin Account Status
- **User ID:** `1`
- **Email:** `owner@acadlytic.com`
- **Role:** `SUPER_ADMIN`
- **Status:** `ACTIVE`
- **Email Verified At:** `2026-11-19 14:05:15`
- **Failed Login Attempts:** `0` (clean, unthrottled)
- **Account Lock Status:** Unlocked (`locked_until` is `NULL`)

---

## 5. Security & CSRF Contract Verification

Per `backend/src/main/java/com/acadlytic/config/SecurityConfig.java`:
1. **CSRF Protection:**
   - Spring Security uses `CookieCsrfTokenRepository.withHttpOnlyFalse()` with `SpaCsrfTokenRequestHandler`.
   - The token is exposed to clients in cookie `XSRF-TOKEN` (`Path=/; SameSite=Lax`).
   - A dedicated public token refresh endpoint exists at `GET /api/v1/auth/csrf`.
   - All state-modifying requests (`POST`, `PUT`, `DELETE`) require:
     - Header: `X-XSRF-TOKEN: <token>`
     - Cookie: `XSRF-TOKEN=<token>`
2. **Session Authentication:**
   - Super Admin calls require cookie `ACADLYTIC_SID=<session_id>`.
   - Role must evaluate to `SUPER_ADMIN`.
3. **Zero Secrets Disclosed:**
   - In accordance with safety policies, no live cookies, tokens, BCrypt hashes, or credentials were retrieved, logged, or exposed in this report.

---

## 6. Manual Test Preparation (Pending Backend Restart)

Once the backend is restarted with the latest compiled classes, the exact manual API approval request is structured as follows:

### Request Specification
- **HTTP Method:** `POST`
- **Full Path:** `http://localhost:8080/api/v1/super-admin/colleges/reviews/5/decision`
- **Headers:**
  - `Content-Type: application/json`
  - `X-XSRF-TOKEN: <SUPER_ADMIN_CSRF_TOKEN>`
  - `Cookie: ACADLYTIC_SID=<SUPER_ADMIN_SESSION_ID>; XSRF-TOKEN=<SUPER_ADMIN_CSRF_TOKEN>`
- **Request Body (JSON):**
  ```json
  {
    "action": "APPROVE",
    "expectedVersion": 1,
    "reviewNotes": "Attempting manual approval verification for DEF-01 gate."
  }
  ```

### Expected Response
- **HTTP Status:** `409 Conflict` (HTTP 409)
- **Content-Type:** `application/json`
- **Response Body Structure:**
  ```json
  {
    "success": false,
    "errorCode": "DOCUMENTS_REJECTED",
    "message": "Cannot approve application: Document 'IMG_20261124_081613477_HDR.jpg.jpeg' (AUTHORIZED_SIGNATORY_ID) was rejected. Action must be requested to allow document replacement.",
    "timestamp": "<ISO-8601-TIMESTAMP>"
  }
  ```

### Database Verification Invariants (Post-Test)
Following test execution, the database state must remain completely unmutated:
- `colleges.approval_status` must remain `PENDING`.
- `colleges.version` must remain `1`.
- `college_registrations.status` must remain `PENDING`.
- Zero audit records of type `COLLEGE_REGISTRATION_APPROVED` must be created.
