# Phase 02 — End-to-End Manual Browser Verification Checklist

**Document Version:** 1.0  
**Phase:** Phase 02 — Authentication & Authorization Foundation  
**Target:** Local Development Environment (`http://localhost:5173` & `http://localhost:8080`)  

This checklist provides step-by-step instructions for human manual verification of the stateful session-based authentication flow, security cookies, CSRF defense, password recovery, multi-session management, and account status synchronization.

---

## Prerequisites (Start Services)

Before beginning the browser verification, ensure the backing services and backend application are running:

### 1. Start MySQL 8 & Mailpit
Using Docker Compose:
```bash
docker compose up -d
```
Or start local MySQL 8.x (with databases `acadlytic` and `acadlytic_test`) and Mailpit (`1025` SMTP, `8025` UI).

### 2. Start Backend with Dev Profile & Super Admin Bootstrap
```bash
# In backend directory
set APP_BOOTSTRAP_SUPER_ADMIN_ENABLED=true
set SUPER_ADMIN_EMAIL=owner@acadlytic.com
set SUPER_ADMIN_PASSWORD=SuperAdmin@Acadlytic2026!
set SUPER_ADMIN_FIRST_NAME=System
set SUPER_ADMIN_LAST_NAME=Owner

mvn clean spring-boot:run -Dspring-boot.run.profiles=dev
```
Backend will start on `http://localhost:8080`.

### 3. Start Frontend Development Server
```bash
# In frontend directory
npm run dev
```
Frontend will be available at `http://localhost:5173`.

---

## Verification Test Cases

### 1. Super Admin Login & Session Persistence
- [ ] Open a browser and navigate to `http://localhost:5173/auth/login`.
- [ ] Enter credentials:
  - **Email:** `owner@acadlytic.com`
  - **Password:** `SuperAdmin@Acadlytic2026!`
- [ ] Click **Sign In**.
- [ ] Verify you are redirected to `/admin/dashboard`.
- [ ] Verify the header displays user identity: `SUPER_ADMIN` and `owner@acadlytic.com`.
- [ ] Press `F5` / Refresh the browser page.
- [ ] **Expected Result:** The authenticated session persists seamlessly; no login prompt appears.

---

### 2. Protected Route Guard & Deep Linking
- [ ] While logged in as Super Admin, click **Logout** in the top navigation header.
- [ ] Verify you are redirected to `/auth/login`.
- [ ] In the browser address bar, directly navigate to `http://localhost:5173/admin/dashboard`.
- [ ] **Expected Result:** The application intercepts the request and redirects to `/auth/login`, preserving the target location.
- [ ] Log in again as Super Admin.
- [ ] **Expected Result:** Upon successful authentication, the router automatically returns you to the originally requested URL (`/admin/dashboard`).

---

### 3. DevTools Cookie, CSRF & Storage Audit
Open Browser Developer Tools (`F12`):
- [ ] Navigate to the **Application / Storage** tab:
  - **Cookies (`http://localhost:5173`):**
    - `ACADLYTIC_SID`: Must have **HttpOnly = true**, **SameSite = Lax**, **Path = /**. JavaScript cannot read this cookie.
    - `XSRF-TOKEN`: Must have **HttpOnly = false** (readable by frontend), **SameSite = Lax**, **Path = /**.
  - **Local Storage (`http://localhost:5173`):** Must be completely **empty** of tokens, user identity, or auth secrets. Zero JWT or auth tokens.
  - **Session Storage (`http://localhost:5173`):** Must be completely **empty** of tokens or auth secrets.
- [ ] Navigate to the **Network** tab:
  - Perform a mutating action (e.g. Change Password or Logout).
  - Inspect the request headers: verify the request header `X-XSRF-TOKEN` matches the value of the `XSRF-TOKEN` cookie.

---

### 4. Brute-Force Lockout & Password Recovery Flow
- [ ] Log out of any active session and navigate to `/auth/login`.
- [ ] Enter `owner@acadlytic.com` and type an incorrect password 5 consecutive times.
- [ ] **Expected Result on 5th attempt:** The login form displays:
  `"Account is temporarily locked due to multiple failed login attempts. Please try again later."` (HTTP 429).
- [ ] Click **Forgot password?** to navigate to `/auth/forgot-password`.
- [ ] Enter `owner@acadlytic.com` and click **Send Reset Instructions**.
- [ ] Verify the generic non-enumerating success message is shown:
  `"If an eligible account exists for owner@acadlytic.com, a password reset link has been sent."`
- [ ] Open Mailpit Web UI at `http://localhost:8025`.
- [ ] Find the password reset email with subject *"Reset your Acadlytic password"*.
- [ ] Verify the reset link format: `http://localhost:5173/auth/reset-password?token=<RAW_TOKEN>`.
- [ ] Click the link (or copy into the browser).
- [ ] Notice that upon page load, the token is stripped from the browser address bar for security.
- [ ] In the reset form, attempt to enter a weak password (e.g. `short` or `alllowercase123`).
- [ ] Verify client-side Zod validation flags the policy requirement (12-128 chars, uppercase, digit, special).
- [ ] Enter a valid new password: `NewSuperAdminSecretPass@2026!` and submit.
- [ ] **Expected Result:** A success alert appears and redirects to `/auth/login`.
- [ ] Log in with the new password `NewSuperAdminSecretPass@2026!` and verify access is restored.

---

### 5. Multi-Device Session Isolation & Revocation
- [ ] Open **Browser A** (e.g. Google Chrome) and log in as Super Admin.
- [ ] Open **Browser B** (or an Incognito window) and log in as the same Super Admin.
- [ ] Verify both browsers have independent active sessions and can navigate dashboards.
- [ ] In **Browser A**, navigate to `/settings/change-password`.
- [ ] Change the password (enter current password and a new valid password).
- [ ] Switch to **Browser B** and refresh or click any protected action.
- [ ] **Expected Result:** Browser B's session has been revoked by the backend per ADR-05. Browser B is immediately cleared and redirected to `/auth/login`.

---

### 6. Account Status / Suspension Synchronization
- [ ] Create or log in with a College Administrator account.
- [ ] In the database (via MySQL CLI or MySQL Workbench), update the college or user status:
  ```sql
  UPDATE colleges SET status = 'SUSPENDED' WHERE college_code = 'SXIE';
  ```
- [ ] Wait for the 1-minute `staleTime` window (or switch browser window focus to trigger re-validation).
- [ ] **Expected Result:** As soon as `/api/v1/auth/me` refetches or the next API call executes, the frontend detects suspension, resets auth state, and displays the appropriate status error without a crash.

---

## Sign-off
- **Tester Name:** _______________________
- **Date Tested:** _______________________
- **Verification Status:** [ ] PASSED  [ ] FAILED
