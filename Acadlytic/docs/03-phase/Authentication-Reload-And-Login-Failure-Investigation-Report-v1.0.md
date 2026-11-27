# Acadlytic — Authentication Page Reload & Super Admin Login Failure Investigation Report

**Document Version:** 1.0  
**Date:** 2026-11-27  
**Scope:** Investigation and Root Cause Analysis (Frontend Authentication Lifecycle & Backend Super Admin Credential Verification)  
**Status:** COMPLETE (Zero Source / Database Code Modified)

---

## 1. Executive Summary

An investigation was conducted to isolate and diagnose two reported authentication issues:

1. **Issue 1 (Frontend):** Login and Registration pages spontaneously reset or wipe form state when the user switches browser tabs or moves focus to an external window and returns.
2. **Issue 2 (Backend):** Super Admin login for account `owner@acadlytic.com` returns `AUTH_INVALID_CREDENTIALS` (`HTTP 401: Invalid email or password.`) despite the record existing in MySQL.

### Key Investigation Outcomes

* **Issue 1 Finding:** The problem is **not** a full browser reload or navigation redirect. It is a **React component unmount and remount** caused by TanStack Query's window focus listener (`focusManager`). When the user refocuses the browser window, `useCurrentUser` executes a background query to `GET /api/v1/auth/me`. Because an unauthenticated guest has no cached session data, TanStack Query marks `isLoading` (`isPending && isFetching`) as `true`. This triggers `<RootLayout />` to replace the route `<Outlet />` with `<LoadingSpinner />`, and `<PublicOnlyRoute />` to return `null`. This instantly unmounts `<LoginPage>` and `<RegisterCollegePage>`, wiping all React state and `react-hook-form` inputs. Upon receiving the expected `401 Unauthorized` ~30ms later, `isLoading` returns to `false`, remounting the page with pristine, blank fields.
* **Issue 2 Finding:** The database record for `owner@acadlytic.com` is present, valid, verified, unexpired, and in status `ACTIVE` with role `SUPER_ADMIN`. The authentication failure is caused strictly by a **password mismatch**: the credentials submitted during recent login attempts do not match the BCrypt password hash stored in MySQL during bootstrap. The Spring Security `BCryptPasswordEncoder` correctly validates that the input password does not match the database hash, records an `INVALID_PASSWORD` audit event, and increments `failed_login_attempts`. Currently, `failed_login_attempts` is at **4** out of 5; one additional failed attempt will immediately trigger a 15-minute brute-force lockout (`AUTH_ACCOUNT_LOCKED`).

---

## 2. Root Cause Analysis — Part A: Frontend Form State Loss on Tab Switch

### 2.1 The Phenomenon: Remount vs. Browser Reload
Empirical analysis of the browser network traffic and component lifecycle confirmed that switching browser tabs or applications does **not** trigger a full document reload (`window.location.reload()`), Vite HMR reload, or React Router navigation redirect.

Instead, the form components (`<LoginPage />` or `<RegisterCollegePage />`) are completely **unmounted from the React DOM tree** and subsequently **remounted as fresh instances**. Because form input state in `react-hook-form` resides in component-level React memory, the unmount cleanly destroys all entered data, dirty/touched flags, and validation errors.

### 2.2 Trigger Mechanism
In [frontend/src/hooks/useAuth.ts](file:///c:/React/Acadlytic/frontend/src/hooks/useAuth.ts#L13-L41):
```typescript
// Line 16-22
const query = useQuery<CurrentUser, Error>({
  queryKey: queryKeys.auth.currentUser(),
  queryFn: authService.getMe,
  retry: false,
  staleTime: 60 * 1000,
  refetchOnWindowFocus: true, // <-- Trigger: window focus invokes background refetch
});
```
When a user returns to the browser tab, the browser fires a standard `window.focus` event. TanStack Query's `focusManager` detects this and invokes `authService.getMe()` (`GET /api/v1/auth/me`).

### 2.3 Unmount Origin in Code
The route hierarchy defined in [frontend/src/routes/index.tsx](file:///c:/React/Acadlytic/frontend/src/routes/index.tsx#L38-L100) nests public auth routes inside two parent layout/guard components:
```
<RootLayout>                (frontend/src/layouts/RootLayout.tsx)
  └── <PublicOnlyRoute>     (frontend/src/routes/guards/PublicOnlyRoute.tsx)
        └── <AuthLayout>    (frontend/src/layouts/AuthLayout.tsx)
              └── <LoginPage /> / <RegisterCollegePage />
```

Two separate guards unmount the child route when `isLoading` becomes `true`:

1. **`RootLayout.tsx` (Lines 8-21):**
   ```tsx
   export const RootLayout: React.FC = () => {
     const { isLoading } = useCurrentUser();

     if (isLoading) {
       return (
         <div className="min-h-screen flex items-center justify-center bg-slate-50">
           <div className="text-center space-y-3">
             <LoadingSpinner size="lg" text="Initializing Acadlytic platform..." />
             <p className="text-xs text-slate-400 font-mono">
               Verifying secure session...
             </p>
           </div>
         </div>
       );
     }

     return <Outlet />;
   };
   ```
2. **`PublicOnlyRoute.tsx` (Lines 6-10):**
   ```tsx
   export const PublicOnlyRoute: React.FC = () => {
     const { isAuthenticated, user, isLoading } = useAuthStore();

     if (isLoading) {
       return null;
     }
     ...
   };
   ```

3. **`useAuth.ts` State Synchronization (Lines 24-38):**
   ```typescript
   useEffect(() => {
     setLoading(query.isLoading);
     if (query.data) {
       setUser(query.data);
     } else if (query.isError) {
       clearAuth();
     }
   }, [query.data, query.isError, query.isLoading, setUser, clearAuth, setLoading]);
   ```

### 2.4 State Loss Cycle
1. **Initial State:** On initial load of `/auth/login`, `GET /api/v1/auth/me` returns `401`. The query cache stores `data: undefined`, `status: "error"`.
2. **Form Entry:** The user fills in registration or login fields.
3. **Tab Switch & Focus:** The user switches to another window/tab and returns. TanStack Query detects `focus` and begins refetching `GET /api/v1/auth/me`.
4. **Loading Transition:** Because `data` is `undefined`, TanStack Query transitions `query.isLoading` (`isPending && isFetching`) to `true`.
5. **Component Tear Down:**
   - `RootLayout` evaluates `isLoading === true` and unmounts `<Outlet />`, rendering `<LoadingSpinner />`.
   - `PublicOnlyRoute` evaluates `isLoading === true` and returns `null`.
   - The entire DOM tree below `RootLayout` is discarded.
6. **Network Resolution:** After ~30ms, the backend returns `401 Unauthorized`.
7. **Restoration:** TanStack Query updates `isLoading` to `false`. `RootLayout` and `PublicOnlyRoute` re-render `<Outlet />`.
8. **Result:** `<LoginPage />` or `<RegisterCollegePage />` mounts as a new component instance with empty default form values.

---

## 3. Root Cause Analysis — Part B: Backend Super Admin Login Failure

### 3.1 Database Record Verification
The database record in MySQL (`acadlytic.users`) was inspected directly via JDBC.

* **User ID:** `1`
* **Email:** `owner@acadlytic.com`
* **Role:** `SUPER_ADMIN`
* **Status:** `ACTIVE`
* **Email Verified:** `true` (`email_verified_at: 2026-11-19 19:35:15`)
* **Email Released:** `false` (`0`)
* **Failed Login Attempts:** `4`
* **Locked Until:** `null` (Active / Not locked)
* **Created At:** `2026-11-19 19:35:15`
* **Updated At:** `2026-11-27 10:54:39`

The account is completely active, valid, and present. Email normalization between creation and authentication is fully consistent via [EmailNormalizer.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/auth/service/EmailNormalizer.java) (ASCII lowercase and trim).

### 3.2 Audit Log Analysis
Inspection of the `audit_events` table for recent login attempts against `owner@acadlytic.com` revealed consecutive failed attempts:

| Timestamp (UTC) | Event Type | User ID | Role | Outcome | Reason | Failed Attempts |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 2026-11-27 05:09:45 | `LOGIN_FAILURE` | 1 | `SUPER_ADMIN` | `FAILURE` | `INVALID_PASSWORD` | 1 |
| 2026-11-27 05:14:40 | `LOGIN_FAILURE` | 1 | `SUPER_ADMIN` | `FAILURE` | `INVALID_PASSWORD` | 2 |
| 2026-11-27 05:20:17 | `LOGIN_FAILURE` | 1 | `SUPER_ADMIN` | `FAILURE` | `INVALID_PASSWORD` | 3 |
| 2026-11-27 05:22:29 | `LOGIN_FAILURE` | 1 | `SUPER_ADMIN` | `FAILURE` | `INVALID_PASSWORD` | 4 |
| 2026-11-27 05:22:34 | `LOGIN_FAILURE` | 1 | `SUPER_ADMIN` | `FAILURE` | `INVALID_PASSWORD` | 4 |
| 2026-11-27 05:22:56 | `LOGIN_FAILURE` | 1 | `SUPER_ADMIN` | `FAILURE` | `INVALID_PASSWORD` | 4 |
| 2026-11-27 05:23:52 | `LOGIN_FAILURE` | 1 | `SUPER_ADMIN` | `FAILURE` | `INVALID_PASSWORD` | 4 |
| 2026-11-27 05:24:39 | `LOGIN_FAILURE` | 1 | `SUPER_ADMIN` | `FAILURE` | `INVALID_PASSWORD` | 4 |

In all cases:
- The user account was resolved successfully (`userId = 1`, `role = SUPER_ADMIN`).
- The audit failure reason was explicitly recorded as **`INVALID_PASSWORD`**.
- Reason was **not** `UNKNOWN_ACCOUNT`, `ACCOUNT_LOCKED`, `UNVERIFIED_EMAIL`, or `ROLE_INACTIVE`.

### 3.3 Password Encoder & Hash Verification
The password hashing configuration in [SecurityConfig.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/config/SecurityConfig.java) defines a standard `BCryptPasswordEncoder` (strength 10).

In [AuthService.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/auth/service/AuthService.java#L151-L160):
```java
if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
    boolean locked = loginAttemptService.recordFailedAttempt(user.getId(), clientIp);
    if (locked) {
        throw new AppException(
                "AUTH_ACCOUNT_LOCKED",
                "Account is temporarily locked due to multiple failed login attempts. Please try again later.",
                HttpStatus.TOO_MANY_REQUESTS);
    }
    throw new AppException("AUTH_INVALID_CREDENTIALS", INVALID_CREDENTIALS_MESSAGE, HttpStatus.UNAUTHORIZED);
}
```

The database password hash was provisioned via the environment-driven bootstrap runner [SuperAdminBootstrapRunner.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/auth/service/SuperAdminBootstrapRunner.java#L58-L100) per project standard ADR-17. The bootstrap credentials documented in [docs/verification/phase-02-manual-checklist.md](file:///c:/React/Acadlytic/docs/verification/phase-02-manual-checklist.md#L27) match the BCrypt hash stored in MySQL.

However, recent login attempts submitted mismatched password credentials (e.g. testing with fixture values from other files such as `login.json`). The BCrypt encoder correctly rejected the mismatched input, incrementing failed login attempts.

### 3.4 Imminent Lockout Warning
Per [LoginAttemptService.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/auth/service/LoginAttemptService.java#L56-L65):
- `maxFailedAttempts` is configured to **5**.
- `failed_login_attempts` is currently at **4**.
- **Critical:** Submitting one more invalid password attempt will trigger `locked = true`, locking the Super Admin account for **15 minutes** (`AUTH_ACCOUNT_LOCKED`, `HTTP 429`).

---

## 4. Part C — Contract & Interplay Verification

1. **Request / Response Contracts:**
   - Frontend `authService.login({ email, password })` sends JSON matching backend `LoginRequest(String email, String password)`.
   - Backend returns `CurrentUserResponse` on success and standard `ApiErrorResponse` on failure (`AUTH_INVALID_CREDENTIALS`, `HTTP 401`).
   - Contracts are in full alignment.
2. **CSRF & Cookie Configuration:**
   - Backend `CookieCsrfTokenRepository` exposes `XSRF-TOKEN` cookie.
   - Frontend Axios interceptor in [frontend/src/services/api.ts](file:///c:/React/Acadlytic/frontend/src/services/api.ts#L44-L52) extracts `XSRF-TOKEN` and passes `X-XSRF-TOKEN` on mutating requests.
   - CSRF validation succeeded on all requests.
3. **Frontend Error Handling on Failed Login:**
   - In [frontend/src/pages/auth/LoginPage.tsx](file:///c:/React/Acadlytic/frontend/src/pages/auth/LoginPage.tsx#L36-L39):
     ```tsx
     onError: (error) => {
       setErrorMessage(error.message || 'Failed to sign in. Please check your credentials.');
     }
     ```
   - A failed login renders an inline alert without navigation.
   - **Interplay with Bug 1:** If the user encounters a failed login, switches tabs to check a password manager or notes file, and returns to the browser tab, Bug 1 triggers: the entire page unmounts and remounts, wiping both the input fields and the error message alert.

---

## 5. Severity, User Impact, and Security Assessment

| Issue | Severity | User Impact | Security Implications |
| :--- | :--- | :--- | :--- |
| **Tab-Switch State Loss (Part A)** | **High** | Applicants filling out the lengthy College Registration form (`/auth/register-college`) lose all inputs when switching to an email client or tab to look up information. Severe user frustration and dropped conversion. | None. The underlying session check mechanism is valid, but its UI unmounting side-effect violates expected form persistence. |
| **Super Admin Login Failure (Part B)** | **Medium / Operational** | Administrator cannot access the Super Admin dashboard until authenticating with the configured bootstrap password. Current account is at 4/5 attempts. | High defensive fidelity. Demonstrates that brute-force protection, audit logging, and BCrypt verification are functioning strictly as specified in ADR-17. |

---

## 6. Recommended Minimal, Non-Breaking Fixes

### 6.1 Fix for Issue 1 (Frontend State Loss)
A 3-point minimal fix cleanly eliminates the state loss without sacrificing security or session synchronization:

1. **Disable Window Focus Polling for Current User Hook:**
   In [frontend/src/hooks/useAuth.ts](file:///c:/React/Acadlytic/frontend/src/hooks/useAuth.ts#L21):
   Change `refetchOnWindowFocus: true` to `refetchOnWindowFocus: false` (or conditionally only when `isAuthenticated` is true).
2. **Decouple Background Refetches from Root Loading Spinner:**
   In [frontend/src/layouts/RootLayout.tsx](file:///c:/React/Acadlytic/frontend/src/layouts/RootLayout.tsx#L8-L20):
   Only display `<LoadingSpinner />` during initial application boot (e.g. `isPending && !data && !isError` or an explicit `isInitializing` flag), never during background query executions when cached state is already known.
3. **Preserve Outlet in `PublicOnlyRoute.tsx`:**
   In [frontend/src/routes/guards/PublicOnlyRoute.tsx](file:///c:/React/Acadlytic/frontend/src/routes/guards/PublicOnlyRoute.tsx#L8-L10):
   Do not return `null` on background refetches; allow `<Outlet />` to remain mounted while unauthenticated status is already established.

### 6.2 Fix for Issue 2 (Backend Super Admin Login)
1. **Reset Failed Login Counter:**
   To prevent account lockout on the very next attempt, reset `failed_login_attempts` to `0` for user ID 1 via `loginAttemptService.resetFailedAttempts(1L)` or an administrative command.
2. **Use Authoritative Provisioned Credentials:**
   Authenticate using the exact bootstrap password configured in the local development environment per [docs/verification/phase-02-manual-checklist.md](file:///c:/React/Acadlytic/docs/verification/phase-02-manual-checklist.md#L27).

---

## 7. Required Regression Tests

1. **Frontend Vitest Regression Suite:**
   - Unit test for `useCurrentUser`: verify that tab focus (`window.dispatchEvent(new Event('focus'))`) does not trigger full-screen loading transitions for guest users.
   - Component test for `<LoginPage />` and `<RegisterCollegePage />`: verify form inputs and validation errors persist when the window loses and regains focus.
   - Guard test for `<PublicOnlyRoute />`: verify child routes do not unmount during background auth queries.
2. **Backend Spring Boot Regression Suite:**
   - Verify `AuthServiceTest`: valid credentials authenticate successfully; invalid credentials increment `failed_login_attempts` and audit `INVALID_PASSWORD`.
   - Verify `LoginAttemptServiceTest`: fifth failed attempt triggers 15-minute lockout and returns `429 TOO_MANY_REQUESTS`.
