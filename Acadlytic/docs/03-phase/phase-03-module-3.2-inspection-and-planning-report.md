# Acadlytic — Phase 03, Module 3.2 Backend Inspection & Planning Report (Revised)
## Module 3.2: Email Verification & College Admin Verification Lifecycle

**Document Version:** 2.0.0 (Planning Revision)  
**Date:** 2026-11-23  
**Status:** REVISED & AWAITING DEVELOPER APPROVAL (Planning Mode ONLY)  
**Target Module:** Phase 03 — Module 3.2 (Email Verification Backend)  
**Author:** AI Technical Agent / DeepMind Team  
**Scope Boundary:** Backend Only — Zero Frontend Changes — Zero Java/Schema Implementation Changes  

---

## 1. Executive Summary & Objective

The objective of Module 3.2 is to complete the backend email verification lifecycle for newly registered `COLLEGE_ADMIN` accounts.

In Module 3.1A, public college registration was implemented and verified:
- Atomically creates the `College` (`status = PENDING_VERIFICATION`, `approval_status = PENDING`).
- Creates the version 1 `CollegeRegistration` application (`submitted_for_review_at = NULL`).
- Creates the initial `COLLEGE_ADMIN` `User` (`status = ACTIVE`, `email_verified_at = NULL`).
- Issues a cryptographically random, single-use, DB-hashed 48-hour verification token.
- Enqueues an outgoing verification email via `outbox_emails`.
- Emits the immutable audit event `COLLEGE_REGISTRATION_CREATED`.

Module 3.2 implements the backend verification consumption and resend mechanisms:
1. Public verification intake (`POST /api/v1/auth/verify-email`) which atomically redeems the 48-hour token, updates `users.email_verified_at = NOW()`, invalidates any redundant verification tokens, and records `EMAIL_VERIFIED`.
2. Rate-limited verification resend (`POST /api/v1/auth/resend-verification`) for unverified college administrators from their Restricted Dashboard, with per-user (3 requests / 15 min) and per-IP throttling.
3. Strict enforcement of lifecycle separation: **email verification does NOT approve a college**. The college remains in `PENDING` approval status and `PENDING_VERIFICATION` operational status, and all academic management APIs remain locked (`403 COLLEGE_NOT_APPROVED`).

---

## 2. Mandatory Inspection Findings & Codebase Baseline

### 2.1 Existing Module 3.1A Foundation (Already Implemented)
- **Registration Intake Service:** [CollegeRegistrationService.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/service/CollegeRegistrationService.java#L178-L192) already issues a 48-hour `EMAIL_VERIFICATION` token via `AuthTokenService.issueToken(...)` and transactionally enqueues an outbox email using template `EMAIL_VERIFICATION`.
- **Token Generation:** 32 cryptographically secure random bytes (`SecureRandom`) are Base64 URL encoded without padding (43 characters). The SHA-256 hex hash (64 chars) is stored in `auth_tokens`. Raw tokens are never persisted in the database and never logged.
- **Initial User State:** `adminUser.getEmailVerifiedAt()` is initialized to `null`.
- **Current Integration Test Proof:** [CollegeRegistrationIntegrationTest.java](file:///c:/React/Acadlytic/backend/src/test/java/com/acadlytic/modules/colleges/CollegeRegistrationIntegrationTest.java#L150-L161) confirms that upon registration:
  - `user.getEmailVerifiedAt() == null`
  - `authTokenRepository.count() == 1`
  - `outboxEmailRepository.findAll().get(0).getTemplateKey() == "EMAIL_VERIFICATION"`

### 2.2 Existing Token Architecture (`auth_tokens`)
- **Schema:** Defined in [V1__init_schema.sql](file:///c:/React/Acadlytic/backend/src/main/resources/db/migration/V1__init_schema.sql#L104-L121).
  - Columns: `id`, `user_id`, `token_type` (`VARCHAR(30)`), `token_hash` (`CHAR(64) UNIQUE`), `target_email` (`VARCHAR(255)`), `expires_at` (`DATETIME(6)`), `used_at` (`DATETIME(6)`), `revoked_at` (`DATETIME(6)`), `created_at` (`DATETIME(6)`).
  - Indexes: `uq_auth_tokens_hash`, `idx_auth_tokens_user_type`, FK `fk_auth_tokens_user`.
- **Entity:** [AuthToken.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/auth/entity/AuthToken.java) contains `isRedeemable(Instant now)` returning `usedAt == null && revokedAt == null && expiresAt.isAfter(now)`.
- **Enum:** [AuthTokenType.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/auth/entity/AuthTokenType.java) already includes `EMAIL_VERIFICATION`.
- **Repository:** [AuthTokenRepository.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/auth/repository/AuthTokenRepository.java) has `findByTokenHashAndTokenType` and `revokeActiveTokensForUser`.
- **Service:** [AuthTokenService.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/auth/service/AuthTokenService.java) provides:
  - `issueToken(userId, tokenType, targetEmail, ttl)`: Revokes existing active tokens of that type for the user, hashes raw token with SHA-256, saves entity, returns raw token.
  - `consumeToken(rawToken, expectedType)`: Hashes input, fetches token by hash and type, validates `isRedeemable`, marks `usedAt = NOW()`, saves and returns token.

### 2.3 Outbox Email Dispatch & Mailpit Integration
- **Outbox Schema:** Defined in `V3__outbox_email_schema.sql`.
- **Outbox Enqueuing:** [OutboxEmailService.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/outbox/service/OutboxEmailService.java) inserts pending emails inside the active caller transaction (`@Transactional(propagation = Propagation.REQUIRED)`).
- **Outbox Worker:** [OutboxEmailWorker.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/outbox/service/OutboxEmailWorker.java) polls on schedule, claims batches with `FOR UPDATE SKIP LOCKED`, and dispatches emails via `EmailSender` strictly outside database transactions (`ADR-18`).
- **Template Rendering:** [EmailTemplateRenderer.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/outbox/service/EmailTemplateRenderer.java#L57-L64) already supports template `"EMAIL_VERIFICATION"`:
  ```text
  Hello {firstName},
  
  Please verify your Acadlytic email address within 48 hours:
  http://localhost:5173/verify-email?token={token}
  
  Thank you,
  Acadlytic Team
  ```
- **SMTP Sender:** [SmtpEmailSender.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/outbox/service/SmtpEmailSender.java) delivers messages to Mailpit in dev and SMTP/TLS in production.

### 2.4 Security & Session Configuration
- **Security Filter Chain:** [SecurityConfig.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/config/SecurityConfig.java#L112-L120):
  - Current `permitAll()` POST routes: `/api/v1/auth/login`, `/api/v1/auth/forgot-password`, `/api/v1/auth/reset-password`, `/api/v1/auth/verify-email-change`, `/api/v1/college-registrations`.
  - Missing from `permitAll()`: `POST /api/v1/auth/verify-email`.
  - Missing route: `POST /api/v1/auth/resend-verification`.
- **CSRF Protection:** All state-changing POST requests require the SPA CSRF token (`X-XSRF-TOKEN` header matching `XSRF-TOKEN` cookie).
- **User Principal & Authorization:**
  - [CurrentUserResponse.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/auth/dto/CurrentUserResponse.java) returns `emailVerified: boolean`.
  - [CurrentUserMapper.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/auth/mapper/CurrentUserMapper.java#L34) dynamically sets `emailVerified: user.getEmailVerifiedAt() != null`.
  - [CollegeAccessGuard.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/security/CollegeAccessGuard.java#L92-L98) checks `college.approvalStatus == APPROVED && college.status == ACTIVE`; email verification does not bypass this guard.

### 2.5 Audit Logging
- [AuditEventType.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/auth/entity/AuditEventType.java#L14) already defines `EMAIL_VERIFIED`.
- Resend event (`EMAIL_VERIFICATION_RESENT`) will be added to the enum.

---

## 3. Detailed Architectural Corrections

### 3.1 Atomic Token Consumption & Safe User Retrieval

#### Problem Analysis:
If two concurrent requests present the identical raw token simultaneously, a non-locking `SELECT` followed by in-memory check and `SAVE` could permit a race condition where both requests observe `used_at == null`. Furthermore, if the user account is in an invalid lifecycle state (e.g. inactive or already verified), we must reject the request without burning/consuming the token.

#### Solution Design (Pessimistic Row-Locking with Strict Pre-Conditions):
In `AuthTokenRepository`, add a pessimistic write-lock query:
```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT t FROM AuthToken t WHERE t.tokenHash = :tokenHash AND t.tokenType = :tokenType")
Optional<AuthToken> findByTokenHashAndTokenTypeForUpdate(
        @Param("tokenHash") String tokenHash,
        @Param("tokenType") AuthTokenType tokenType);
```

#### Safe Execution Flow in `AuthService.verifyEmail`:
Within a single transaction (`@Transactional(isolation = Isolation.READ_COMMITTED)`):
1. **Hash Token:** Compute SHA-256 hex string from `request.token().trim()`.
2. **Pessimistic Lock:** Execute `findByTokenHashAndTokenTypeForUpdate(hash, AuthTokenType.EMAIL_VERIFICATION)`.
   - In MySQL 8, this translates to `SELECT ... WHERE token_hash = ? AND token_type = ? FOR UPDATE`.
   - Any concurrent request presenting the same token is blocked at the database level until this transaction finishes.
3. **Redeemability Guard:** Validate:
   - `token.getUsedAt() == null`
   - `token.getRevokedAt() == null`
   - `token.getExpiresAt().isAfter(now)`
   If any condition fails &rarr; throw `AppException("INVALID_OR_EXPIRED_TOKEN", "The token is invalid or has expired.", HttpStatus.BAD_REQUEST)`.
4. **Safe User Retrieval & Lifecycle Validation:**
   - Retrieve `User` via `userRepository.findById(token.getUserId())`.
   - **Target Email Validation:** Check `token.getTargetEmail() != null && token.getTargetEmail().equalsIgnoreCase(user.getEmail())`. If mismatched &rarr; throw `INVALID_OR_EXPIRED_TOKEN`.
   - **User Status Validation:** Check `user.getStatus() == UserStatus.ACTIVE`. If inactive &rarr; throw `AppException("AUTH_ACCOUNT_INACTIVE", "Your account is not active.", HttpStatus.FORBIDDEN)`.
   - **Already-Verified Validation:** Check `user.getEmailVerifiedAt() == null`. If already verified &rarr; throw `AppException("EMAIL_ALREADY_VERIFIED", "Your email address is already verified.", HttpStatus.BAD_REQUEST)`.
   *(Crucial Architecture Note: Because steps 1–4 occur before commit, throwing an exception triggers complete transaction rollback. The token is NOT consumed accidentally, preserving single-use integrity).*
5. **Atomic State Mutation:**
   - Mark token consumed: `token.setUsedAt(now)`.
   - Update user email verification: `user.setEmailVerifiedAt(now)`.
   - Revoke other active verification tokens: `authTokenRepository.revokeActiveTokensForUser(user.getId(), AuthTokenType.EMAIL_VERIFICATION, now)`.
   - Record immutable audit event: `auditEventService.record(AuditEventType.EMAIL_VERIFIED, ...)`.
6. **Transaction Commit:**
   - All mutations commit atomically.
   - The row lock on `auth_tokens` is released.
   - The blocked concurrent transaction (Request 2) now unblocks, acquires the lock, reads the row, observes `used_at != null`, fails the `isRedeemable` check, and immediately throws `INVALID_OR_EXPIRED_TOKEN`.
   - **Result:** Exactly 1 successful verification; zero race conditions.

---

### 3.2 Resend Rate Limiting (Dual-Layer: User + IP)

#### Rate Limiting Policy:
1. **User-Level Quota:** Maximum **3 resend requests per authenticated user within a 15-minute sliding window**.
2. **IP-Level Protection:** Maximum **5 requests per 60-minute window** using the existing `IpRateLimiter` with trusted proxy verification.
3. **Rejection Behavior:** If either limit is exceeded, return **HTTP 429 Too Many Requests** with `errorCode: RATE_LIMIT_EXCEEDED` and a populated `Retry-After: <seconds>` HTTP header.

#### Session-Derived Identity:
- The endpoint `POST /api/v1/auth/resend-verification` accepts **NO user ID or email from the request body**.
- User identity is derived strictly from `SecurityContextService.requireCurrentPrincipal()`.
- Unauthenticated requests are rejected immediately with `401 Unauthorized`.
- Non-`COLLEGE_ADMIN` roles (or users linked to suspended/permanently rejected colleges) are rejected per `ADR-08`.

#### In-Memory Implementation & Multi-Instance Limitation:
- Implemented via a lightweight thread-safe in-memory component `UserRateLimiter` using `ConcurrentHashMap<Long, Deque<Instant>>`.
- **Architectural Limitation Notice:**  
  *In a single-instance deployment, process-local in-memory rate limiting provides robust, low-latency protection without external dependencies. However, in a multi-instance (clustered) deployment, in-memory state is local to each node. Per approved architectural rules, Redis or distributed caches are deferred from the initial MVP. For multi-node scaling in Phase 14+, rate limiting can be seamlessly transitioned to Redis or a database-backed rate-limit table per `ADR-19`.*

---

### 3.3 Transaction Boundaries

#### Verification Transaction Boundary:
```text
@Transactional(isolation = Isolation.READ_COMMITTED, rollbackFor = Exception.class)
public VerifyEmailResponse verifyEmail(VerifyEmailRequest request, HttpServletRequest httpRequest)
```
1. Begin Transaction.
2. Acquire exclusive pessimistic lock on `auth_tokens` row (`findByTokenHashAndTokenTypeForUpdate`).
3. Check token `isRedeemable(now)` (`usedAt == null`, `revokedAt == null`, `expiresAt > now`).
4. Retrieve `User` by `token.userId` and validate:
   - Target email match (`token.target_email == user.email`).
   - Account status (`user.status == ACTIVE`).
   - Not already verified (`user.email_verified_at == null`).
5. Set `token.usedAt = now`.
6. Set `user.emailVerifiedAt = now` and persist `User`.
7. Execute `authTokenRepository.revokeActiveTokensForUser(user.getId(), EMAIL_VERIFICATION, now)`.
8. Record `EMAIL_VERIFIED` audit event.
9. Commit Transaction.
*(Any unchecked or configured exception at any step rolls back all mutations; no partial state is possible).*

#### Resend Transaction Boundary:
```text
@Transactional(isolation = Isolation.READ_COMMITTED, rollbackFor = Exception.class)
public void resendVerification(HttpServletRequest httpRequest, HttpServletResponse httpResponse)
```
1. Resolve authenticated user identity from `SecurityContext` (`requireCurrentUserId()`).
2. Retrieve `User` from repository.
3. Validate account is eligible:
   - `user.getStatus() == UserStatus.ACTIVE`
   - `user.getEmailVerifiedAt() == null` (if already verified, throw `EMAIL_ALREADY_VERIFIED`).
4. Enforce rate limits:
   - `userRateLimiter.checkRateLimit(userId)` (throws `RateLimitExceededException` on 4th attempt in 15 min).
   - `ipRateLimiter.checkRateLimit(httpRequest)` (throws `RateLimitExceededException` on 6th attempt in 60 min).
5. Revoke all previous active `EMAIL_VERIFICATION` tokens for `user.getId()`.
6. Issue new 48-hour `AuthToken` and persist SHA-256 hash.
7. Enqueue `EMAIL_VERIFICATION` email in `outbox_emails` within the current transaction.
8. Record `EMAIL_VERIFICATION_RESENT` audit event.
9. Commit Transaction.
*(If outbox enqueuing fails, the transaction rolls back completely; no token is issued without its corresponding outbox email job).*

---

### 3.4 Preservation of Existing Security & Architecture

| Security Mechanism | Specification | Preservation Guarantee |
|:---|:---|:---|
| **CSRF Protection** | SPA Cookie-to-Header pattern | Both `POST /verify-email` and `POST /resend-verification` enforce valid `X-XSRF-TOKEN`. |
| **Endpoint Accessibility** | Tiered access model | `POST /verify-email` is public (`permitAll()`). `POST /resend-verification` strictly requires authenticated `COLLEGE_ADMIN`. |
| **Session Lifetime** | Stateful JDBC sessions | Verification does **NOT** invalidate or rotate the session; active college admin continues in their session. |
| **College Status Isolation** | `CollegeAccessGuard` | Verifying email strictly does **NOT** approve a college. All academic management APIs remain locked (`403 COLLEGE_NOT_APPROVED`). |
| **Token API Compatibility** | `AuthTokenService` | Adding `findByTokenHashAndTokenTypeForUpdate` and `consumeVerificationToken` leaves existing `consumeToken` signatures intact, ensuring zero breakage for password reset or email change. |

---

## 4. API Specifications

### 4.1 Endpoint: Verify Email
- **Method & Path:** `POST /api/v1/auth/verify-email`
- **Access Level:** Public (Unauthenticated or Authenticated)
- **CSRF Required:** Yes (`X-XSRF-TOKEN`)
- **Request Body:**
  ```json
  {
    "token": "43-character-base64url-token"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Email address verified successfully.",
    "data": {
      "email": "admin@horizon.edu",
      "emailVerified": true,
      "verifiedAt": "2026-11-23T19:00:00Z"
    },
    "timestamp": "2026-11-23T19:00:00.123456Z"
  }
  ```
- **Error Responses:**
  - `400 Bad Request` (`INVALID_OR_EXPIRED_TOKEN`): Token invalid, missing, expired, revoked, or already used.
  - `400 Bad Request` (`EMAIL_ALREADY_VERIFIED`): User account was already verified.
  - `403 Forbidden` (`AUTH_ACCOUNT_INACTIVE`): Associated user account is inactive.
  - `403 Forbidden` (`CSRF_TOKEN_INVALID`): Missing or invalid CSRF token.

---

### 4.2 Endpoint: Resend Verification Email
- **Method & Path:** `POST /api/v1/auth/resend-verification`
- **Access Level:** Authenticated `COLLEGE_ADMIN` only
- **CSRF Required:** Yes (`X-XSRF-TOKEN`)
- **Request Body:** None (empty body `{}`)
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "A verification email has been sent to your registered email address.",
    "timestamp": "2026-11-23T19:00:00.123456Z"
  }
  ```
- **Error Responses:**
  - `400 Bad Request` (`EMAIL_ALREADY_VERIFIED`): Account is already email-verified.
  - `401 Unauthorized` (`AUTH_UNAUTHENTICATED`): Session missing or expired.
  - `403 Forbidden` (`ACCESS_DENIED`): Caller is not `COLLEGE_ADMIN`.
  - `429 Too Many Requests` (`RATE_LIMIT_EXCEEDED`): User quota (3 / 15 min) or IP quota (5 / 60 min) exceeded. Includes `Retry-After` header.

---

## 5. File Impact Analysis (Exact Counts)

When approved for implementation, Module 3.2 will require changes to exactly **11 backend files** (4 created, 7 modified):

### Created Files (4)
1. `backend/src/main/java/com/acadlytic/modules/auth/dto/VerifyEmailRequest.java`: DTO record with `@NotBlank @Size(min = 20, max = 255) String token`.
2. `backend/src/main/java/com/acadlytic/modules/auth/dto/VerifyEmailResponse.java`: Response DTO record (`String email`, `boolean emailVerified`, `Instant verifiedAt`).
3. `backend/src/main/java/com/acadlytic/modules/auth/service/UserRateLimiter.java`: Thread-safe in-memory sliding-window rate limiter for authenticated user actions (3 requests / 15 min).
4. `backend/src/test/java/com/acadlytic/modules/auth/EmailVerificationIntegrationTest.java`: Comprehensive Testcontainers integration test suite.

### Modified Files (7)
1. `backend/src/main/java/com/acadlytic/modules/auth/repository/AuthTokenRepository.java`: Add `findByTokenHashAndTokenTypeForUpdate` with `@Lock(LockModeType.PESSIMISTIC_WRITE)`.
2. `backend/src/main/java/com/acadlytic/modules/auth/service/AuthTokenService.java`: Expose pessimistic token consumption helper without breaking `consumeToken`.
3. `backend/src/main/java/com/acadlytic/modules/auth/entity/AuditEventType.java`: Add `EMAIL_VERIFICATION_RESENT`.
4. `backend/src/main/java/com/acadlytic/modules/auth/service/AuthService.java`: Implement `verifyEmail(...)` and `resendVerification(...)`.
5. `backend/src/main/java/com/acadlytic/modules/auth/controller/AuthController.java`: Expose `POST /verify-email` and `POST /resend-verification`.
6. `backend/src/main/java/com/acadlytic/config/SecurityConfig.java`: Permit public access to `POST /api/v1/auth/verify-email`.
7. `backend/src/test/java/com/acadlytic/modules/auth/service/AuthServiceUnitTest.java`: Add unit tests for `verifyEmail` and `resendVerification` (success, invalid token, already verified, rate limited, rollback).

*Database Migrations Required:* **0**  
*Frontend Files Modified:* **0**

---

## 6. Comprehensive Test Plan

### 6.1 Unit Tests (`AuthServiceUnitTest.java`)
- `verifyEmail_Success`: Consumes token, updates user, emits `EMAIL_VERIFIED`.
- `verifyEmail_InvalidOrExpired`: Rejects expired or missing token with 400.
- `verifyEmail_TargetEmailMismatch`: Rejects when token target email does not match user email.
- `verifyEmail_UserInactive`: Rejects when user status is not ACTIVE.
- `verifyEmail_AlreadyVerified`: Rejects with 400 `EMAIL_ALREADY_VERIFIED` without consuming token.
- `resendVerification_Success`: Revokes old token, creates new 48h token, enqueues outbox email.
- `resendVerification_AlreadyVerified`: Rejects when user is already verified.
- `resendVerification_RateLimited`: Throws `RateLimitExceededException` on 4th attempt in 15 minutes.

### 6.2 Testcontainers MySQL 8.0.36 Integration Tests (`EmailVerificationIntegrationTest.java`)
1. **End-to-End Verification:** Register college &rarr; inspect outbox email &rarr; call `POST /api/v1/auth/verify-email` &rarr; verify DB `users.email_verified_at != null` and `auth_tokens.used_at != null` &rarr; verify `GET /api/v1/auth/me` returns `emailVerified: true`.
2. **Lifecycle State Separation:** Assert that verifying email does **not** set `colleges.approval_status = APPROVED` or unlock academic management APIs (`403 COLLEGE_NOT_APPROVED`).
3. **Single-Use Enforcement:** Replaying the same token fails with `400 INVALID_OR_EXPIRED_TOKEN`.
4. **Expired Token Rejection:** Token with past `expires_at` fails with `400 INVALID_OR_EXPIRED_TOKEN`.
5. **Revoked Token Rejection:** Calling resend invalidates the initial token; attempting to redeem the initial token fails with `400 INVALID_OR_EXPIRED_TOKEN`.
6. **Concurrent Safety:** Run 2 parallel threads attempting to redeem the identical token &rarr; exactly 1 succeeds (200 OK) and 1 fails (400 `INVALID_OR_EXPIRED_TOKEN`).
7. **Rollback on Target Mismatch / Inactive User:** Attempt verification on inactive user &rarr; assert error &rarr; verify in DB that `used_at` remains `NULL`.
8. **Resend User Rate Limiting:** 3 rapid calls succeed; 4th call returns `429 Too Many Requests` with `Retry-After` header.
9. **CSRF Protection:** Both POST endpoints return `403 CSRF_TOKEN_INVALID` without CSRF token.

---

## 7. Approval Statement

> [!IMPORTANT]
> **This revised plan incorporates all developer corrections and is ready for implementation.**
> - Strict backend-first scope.
> - Zero changes have been made to application source code or database migrations.
> - Implementation of Module 3.2 is awaiting your explicit instruction to proceed.
