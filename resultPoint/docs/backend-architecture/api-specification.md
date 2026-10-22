# ResultPoint REST API Specification (OpenAPI 3.0 Standard)

## 1. Global API Standards & Conventions

All ResultPoint RESTful endpoints adhere to the following standards:
- **Base URI:** `/api/v1`
- **Data Exchange Format:** `application/json` (UTF-8 encoding)
- **Authentication:** Stateless JSON Web Token (`Bearer <jwt_token>`) transmitted in the standard HTTP `Authorization` header.
- **Date & Time Format:** ISO-8601 extended format with UTC millisecond precision (`YYYY-MM-DDTHH:mm:ss.sssZ`).
- **Pagination Standard:** Zero-indexed query parameters `page` (default `0`), `size` (default `20`), and `sort` (e.g. `createdAt,desc`).

### Standard Success Envelope (`ApiResponse<T>`)
```json
{
  "success": true,
  "timestamp": "2026-10-22T05:30:00.000Z",
  "data": { },
  "error": null
}
```

### Standard Error Envelope (`ApiErrorResponse`)
```json
{
  "success": false,
  "timestamp": "2026-10-22T05:30:00.000Z",
  "data": null,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Invalid request parameters provided.",
    "status": 400,
    "details": [
      {
        "field": "email",
        "rejectedValue": "invalid-email",
        "message": "Email must be a valid email address."
      }
    ]
  }
}
```

---

## 2. API Endpoints by Domain

### 2.1 Authentication & Account Lifecycle (`/api/v1/auth`)

| Method | Endpoint | Access | Summary |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/signup` | Public | Register a new student account. |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user; returns JWT & refresh token (enforces max 3 active sessions). |
| `POST` | `/api/v1/auth/refresh` | Public | Exchange refresh token with single-use rotation and 30s concurrency cache. |
| `POST` | `/api/v1/auth/logout` | Authenticated | Revoke the specific refresh token session associated with this device. |
| `POST` | `/api/v1/auth/logout-all` | Authenticated | Revoke all active refresh sessions for the current authenticated user. |
| `GET`  | `/api/v1/auth/me` | Authenticated | Fetch current authenticated user principal and role. |
| `POST` | `/api/v1/auth/forgot-password` | Public | Request password reset token via registered email. |
| `POST` | `/api/v1/auth/reset-password` | Public | Reset password using verified single-use reset token. |

#### Session Management, Token Rotation & Concurrency Architecture

1. **Maximum 3 Active Refresh-Token Sessions:**
   - ResultPoint permits at most **3 active concurrent sessions** per user.
   - Upon successful login when 3 sessions already exist, the backend applies deterministic **FIFO eviction**, revoking the oldest active session record (`is_revoked = TRUE, revocation_reason = 'SESSION_LIMIT_EXCEEDED'`).

2. **Single-Use Refresh Token Rotation & Irreversible Hashing:**
   - Raw refresh tokens (cryptographically secure 256-bit random strings) are never stored in plaintext. MySQL stores `token_hash = SHA-256(raw_token)`.
   - Every invocation of `POST /api/v1/auth/refresh` marks the presented token revoked (`is_revoked = TRUE, revoked_at = NOW(6)`) and issues a fresh token pair.

3. **30-Second Encrypted Concurrency Grace Window:**
   - **Client Coordination:** React services use the Web Locks API (`navigator.locks.request('rp_token_refresh', ...)`) or a `BroadcastChannel` to coordinate token refresh across open browser tabs, preventing parallel refresh calls.
   - **Server Resiliency Cache:** On token rotation, the server encrypts the new response payload using **AES-256-GCM** (with a server-managed 256-bit secret and unique 96-bit nonce) and persists it in `cached_response_payload` on the revoked token record.
   - **Replay Within 30 Seconds:** If a duplicate refresh request arrives with the rotated token within 30 seconds of revocation (`NOW() - revoked_at <= 30s`), the server decrypts and re-serves the identical token payload without revoking sessions.
   - **Theft Detection (> 30 Seconds):** If a revoked token is presented after 30 seconds, the server flags **Token Theft**, immediately revokes **all** active sessions for the user, and generates a high-severity audit log.

#### Example: `POST /api/v1/auth/login`
**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "Password123!"
}
```
**Response (`200 OK`):**
```json
{
  "success": true,
  "timestamp": "2026-10-22T05:30:00.000Z",
  "data": {
    "tokenType": "Bearer",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "refreshToken": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "user": {
      "id": "usr_student_01",
      "email": "student@example.com",
      "fullName": "Student User",
      "role": "STUDENT"
    }
  },
  "error": null
}
```

---

### 2.2 Academic Catalog & Governance (`/api/v1/catalog`)

| Method | Endpoint | Access | Summary |
| :--- | :--- | :--- | :--- |
| `GET`  | `/api/v1/catalog/universities` | Public | List universities with filtering (`search`, `status`, `type`). |
| `GET`  | `/api/v1/catalog/universities/{id}` | Public | Get university details, courses, and regulations. |
| `POST` | `/api/v1/catalog/universities` | `ADMIN` | Create a new accredited university. |
| `PUT`  | `/api/v1/catalog/universities/{id}` | `ADMIN` | Update university details. |
| `GET`  | `/api/v1/catalog/courses` | Public | Search courses by university, level, or name. |
| `POST` | `/api/v1/catalog/courses` | `ADMIN` | Create a new academic degree course. |
| `GET`  | `/api/v1/catalog/regulations` | Public | List syllabus regulations. |
| `POST` | `/api/v1/catalog/regulations` | `ADMIN` | Create a new regulation with calculation rule mappings. |
| `GET`  | `/api/v1/catalog/regulations/{id}/curriculum` | Public | Get complete semester-wise curriculum subjects. |
| `POST` | `/api/v1/catalog/regulations/{id}/curriculum` | `ADMIN` | Map subject to regulation semester with credits. |

---

### 2.3 Student Profile, Results & Backlogs (`/api/v1/student`)

| Method | Endpoint | Access | Summary |
| :--- | :--- | :--- | :--- |
| `GET`  | `/api/v1/student/profile` | `STUDENT` | Get student academic profile, enrolled regulation, and stats. |
| `PUT`  | `/api/v1/student/profile` | `STUDENT` | Update student profile details (batch, hall ticket). |
| `GET`  | `/api/v1/student/results` | `STUDENT` | List all verified semester results with frozen snapshots. |
| `POST` | `/api/v1/student/results` | `STUDENT` | Submit a semester result scorecard (triggers rule snapshotting). |
| `GET`  | `/api/v1/student/results/{semesterNumber}` | `STUDENT` | Get detailed scorecard for a specific semester. |
| `PUT`  | `/api/v1/student/results/{semesterNumber}` | `STUDENT` | Update semester result (re-computes SGPA/CGPA with rules). |
| `DELETE`| `/api/v1/student/results/{semesterNumber}` | `STUDENT` | Remove semester scorecard. |
| `GET`  | `/api/v1/student/backlogs` | `STUDENT` | List active and historical cleared backlogs. |
| `POST` | `/api/v1/student/backlogs/clear` | `STUDENT` | Mark backlog as cleared in a supplementary exam session. |
| `GET`  | `/api/v1/student/education-records` | `STUDENT` | List multi-qualification records (10th, 12th, UG, PG). |
| `POST` | `/api/v1/student/education-records` | `STUDENT` | Add an education qualification record. |
| `GET`  | `/api/v1/student/goals` | `STUDENT` | List active, achieved, and historical academic CGPA goals. |
| `POST` | `/api/v1/student/goals` | `STUDENT` | Create target CGPA goal with target semester and milestones. |
| `PUT`  | `/api/v1/student/goals/{id}` | `STUDENT` | Update target goal metrics, target SGPA, or status. |
| `DELETE`| `/api/v1/student/goals/{id}` | `STUDENT` | Remove an academic target goal. |
| `GET`  | `/api/v1/student/activity-history` | `STUDENT` | Paginated personal history of calculations, views, and exports. |

#### Example: `POST /api/v1/student/results`
**Request Body:**
```json
{
  "semesterNumber": 3,
  "academicPeriod": "Fall 2024",
  "subjects": [
    {
      "subjectCode": "CS301",
      "subjectName": "Data Structures & Algorithms",
      "credits": 4.0,
      "gradeLetter": "A+",
      "internalMarks": 28.0,
      "externalMarks": 65.0
    },
    {
      "subjectCode": "CS302",
      "subjectName": "Computer Organization & Architecture",
      "credits": 3.0,
      "gradeLetter": "A",
      "internalMarks": 25.0,
      "externalMarks": 58.0
    }
  ]
}
```

---

### 2.4 Calculation Engine & Verification (`/api/v1/calculate`)

| Method | Endpoint | Access | Summary |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/calculate/sgpa` | Public | Compute SGPA given subjects, credits, and grades. |
| `POST` | `/api/v1/calculate/cgpa` | Public | Compute CGPA across multiple semesters or credits. |
| `POST` | `/api/v1/calculate/percentage` | Public | Convert CGPA to percentage using institutional formula. |
| `POST` | `/api/v1/calculate/target-cgpa` | Public | Calculate required SGPA in remaining semesters for target CGPA. |
| `POST` | `/api/v1/calculate/regulation-sgpa` | Public | Compute SGPA dynamically bound to `universityId`/`regulationId` with official verified grade boundaries. |

> [!NOTE]
> **Regulatory Verification Boundary:**
> Calculation requests referencing regulations marked `UNDER_REVIEW` (such as Osmania University B.Com CBCS) will compute using catalog baseline rules but will include an explicit response warning: `verificationStatus: "UNDER_REVIEW"`. Official academic certifications are restricted to `VERIFIED` regulations.

#### Example: `POST /api/v1/calculate/target-cgpa`
**Request Body:**
```json
{
  "currentCgpa": 7.42,
  "completedSemesters": 4,
  "totalSemesters": 8,
  "targetCgpa": 8.50
}
```
**Response (`200 OK`):**
```json
{
  "success": true,
  "timestamp": "2026-10-22T05:30:00.000Z",
  "data": {
    "requiredSgpa": 9.58,
    "remainingSemesters": 4,
    "isAchievable": true,
    "feasibility": "CHALLENGING",
    "recommendation": "Maintain an average SGPA of 9.58 across remaining semesters to reach your 8.50 target."
  },
  "error": null
}
```

---

### 2.5 Tools & Calculators Management (`/api/v1/tools`)

> *Runtime Context:* In the active frontend (Phases F-1 to F-4), tool registry management and availability toggling are handled client-side via `toolManagementService.js` and `localStorage` (`resultpoint_tools`). The endpoints below define the target Spring Boot REST API for server-side migration.

| Method | Endpoint | Access | Summary |
| :--- | :--- | :--- | :--- |
| `GET`  | `/api/v1/tools` | Public | List all active tools available to the current user/guest. |
| `GET`  | `/api/v1/tools/{id}` | Public | Get tool metadata, route path, status, and config parameters. |
| `GET`  | `/api/v1/admin/tools` | `ADMIN` | Admin listing of all tools with stats and university scoping. |
| `PUT`  | `/api/v1/admin/tools/{id}/metadata` | `ADMIN` | Update title, description, category, and keywords. |
| `PATCH`| `/api/v1/admin/tools/{id}/status` | `ADMIN` | Enable or disable tool globally. |
| `PUT`  | `/api/v1/admin/tools/{id}/config` | `ADMIN` | Update mathematical bounds (precision, rounding, scales). |
| `PUT`  | `/api/v1/admin/tools/{id}/applicability` | `ADMIN` | Scope tool to specific universities or make global. |
| `POST` | `/api/v1/admin/tools/reset` | `ADMIN` | Reset tools registry to baseline defaults. |
| `POST` | `/api/v1/tools/{id}/save` | `STUDENT` | Save calculator execution output to user history. |
| `GET`  | `/api/v1/student/saved-calculations` | `STUDENT` | Retrieve saved calculator outputs for user. |
| `POST` | `/api/v1/student/saved-calculations/import-guest` | `STUDENT` | Idempotent batch import of guest calculation history after user confirmation. |

#### Guest Calculation Import Idempotency Protocol

To prevent accidental data overwrites and avoid duplicate entries upon network retries:
1. **Explicit Student Confirmation:** Guest calculations in browser `localStorage` (`resultpoint_saved_calculations`) are **never imported silently** upon authentication. An explicit modal prompts the student: *"Import your offline guest calculations to your account?"*.
2. **Client-Generated Idempotency Keys:** For every guest item to import, the React frontend generates a unique UUIDv4 `client_idempotency_key`.
3. **Database-Level Deduplication:** The backend executes the import in a `@Transactional` boundary against `uq_saved_calc_idempotency UNIQUE (user_id, client_idempotency_key)`. If network drops cause the client to retry the batch, duplicate items are safely ignored or idempotently resolved.
4. **Guaranteed Client Storage Purge:** The frontend clears the guest calculation items from `localStorage` **only upon receiving an HTTP 200/201 response** from the server.

---

### 2.6 Content, Community & Administration

#### Platform Settings & System Configuration (`/api/v1/settings`)
- `GET /api/v1/settings/public`: Public retrieval of application environment, active maintenance mode status, global banner messages, supported grading frameworks, and active feature flags.

#### Personal Student Notifications (`/api/v1/student/notifications`)
- `GET /api/v1/student/notifications`: List personal notifications with unread counts (`isRead = false`).
- `PATCH /api/v1/student/notifications/{id}/read`: Mark an individual notification as read.
- `POST /api/v1/student/notifications/read-all`: Mark all notifications as read for current user.
- `DELETE /api/v1/student/notifications/{id}`: Dismiss/delete a student notification.

#### Editorial Blog & Regulation Guides (`/api/v1/blogs`, `/api/v1/admin/blogs`)
- `GET /api/v1/blogs`: Public paginated listing of published articles (`status = 'PUBLISHED'`).
- `GET /api/v1/blogs/{slug}`: Public retrieval of an individual article by slug.
- `GET /api/v1/admin/blogs`: Admin listing across all statuses (`DRAFT`, `PUBLISHED`, `ARCHIVED`).
- `POST /api/v1/admin/blogs`: **Admin-Only** article creation (`@PreAuthorize("hasRole('ADMIN')")`).
- `PUT /api/v1/admin/blogs/{id}`: **Admin-Only** content and metadata update.
- `PATCH /api/v1/admin/blogs/{id}/status`: **Admin-Only** publishing transition (`DRAFT` -> `PUBLISHED` -> `ARCHIVED`).
- `DELETE /api/v1/admin/blogs/{id}`: **Admin-Only** article deletion.

> [!NOTE]
> **Admin-Only Authorization:**  
> All editorial authoring, modification, and publishing endpoints strictly require the `ADMIN` role. Students and unauthenticated guests are restricted to read-only access on published posts.

#### Academic Study Resources (`/api/v1/resources`, `/api/v1/admin/resources`)
- `GET /api/v1/resources`: Public search for syllabus PDFs, past question papers, and guides (filtered by `universityId`, `courseId`, `regulationId`, `semesterNumber`).
- `GET /api/v1/resources/{id}/download`: Stream resource binary and increment download counter.
- `POST /api/v1/admin/resources`: **Admin-Only** file upload and resource cataloging.
- `PUT /api/v1/admin/resources/{id}`: **Admin-Only** resource metadata update.
- `DELETE /api/v1/admin/resources/{id}`: **Admin-Only** resource deletion.

#### Announcements (`/api/v1/announcements`)
- `GET /api/v1/announcements`: Public/Student listing of published, non-expired announcements.
- `POST /api/v1/admin/announcements`: Admin creation of announcements with audience targeting.
- `PUT /api/v1/admin/announcements/{id}`: Admin update of announcement content or publishing status.
- `POST /api/v1/announcements/{id}/read`: Mark announcement as read/dismissed for authenticated user.

#### Support & Helpdesk (`/api/v1/support`)
- `POST /api/v1/support/queries`: Public/Student ticket submission (generates unique ticket number).
- `GET /api/v1/support/queries/{ticketNumber}`: Public tracking of query status using ticket number.
- `GET /api/v1/admin/support/queries`: Admin list and filter support tickets.
- `POST /api/v1/admin/support/queries/{id}/reply`: Admin response or internal note.
- `PATCH /api/v1/admin/support/queries/{id}/status`: Transition ticket status (`IN_PROGRESS`, `RESOLVED`, `CLOSED`).

#### Audit Trail (`/api/v1/admin/audit`)
- `GET /api/v1/admin/audit/logs`: Paginated read-only search across administrative audit events by actor, action, date, or entity.
- *Audit Immutability:* No `POST`, `PUT`, or `DELETE` endpoints exist for audit logs. Records are immutable, guaranteed by database triggers, and pruned strictly via the scheduled maintenance stored procedure `sp_purge_expired_audit_logs`.

#### Analytics & Telemetry (`/api/v1/analytics`, `/api/v1/telemetry`)
- `POST /api/v1/telemetry/events`: Lightweight beacon ingestion for page views and calculator events.
- `GET /api/v1/admin/analytics/overview`: Admin rollup metrics (unique visitors, sessions, top routes, tool completions).

#### Document Export (`/api/v1/export`)
- `POST /api/v1/export/semester-pdf`: Generates authenticated, tamper-evident PDF scorecard using server-side OpenPDF.
- `POST /api/v1/export/transcript-pdf`: Generates complete multi-semester official consolidated academic transcript.
