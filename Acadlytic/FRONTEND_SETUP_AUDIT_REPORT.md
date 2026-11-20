# Acadlytic — Frontend Setup Audit Report

**Date of Audit:** November 20, 2026  
**Auditor:** Software Architecture & Quality Engineering Agent  
**Target Repository:** `c:\React\Acadlytic`  
**Target Directory:** `c:\React\Acadlytic\frontend`  
**Audit Scope:** Inspection and verification of existing frontend structure, dependencies, configuration, routing, state management, UI components, and build readiness.

---

## Section 1 — Project Structure

The project has a dedicated `frontend` folder cleanly decoupled from `backend/`:

```text
c:\React\Acadlytic\
├── .env.example
├── .gitignore
├── .vscode/
├── backend/                  # Spring Boot 3 Modular Monolith
├── docker-compose.yml
├── docs/                     # Architectural, PRD, and design documentation
├── README.md
└── frontend/                 # React 18 + Vite + TypeScript application
    ├── index.html            # HTML shell with #root container
    ├── package.json          # Dependencies and npm scripts
    ├── postcss.config.js     # PostCSS config (Tailwind + Autoprefixer)
    ├── tailwind.config.js    # Tailwind configuration with brand theme
    ├── tsconfig.json         # TypeScript compiler config with @/ path alias
    ├── tsconfig.node.json    # TypeScript Vite node config
    ├── vite.config.ts        # Vite configuration with React plugin & /api proxy
    └── src/
        ├── App.tsx           # RouterProvider & QueryClientProvider setup
        ├── main.tsx          # Application bootstrap & DOM root render
        ├── index.css         # Tailwind base/components/utilities & global styles
        ├── assets/
        │   └── README.md
        ├── components/
        │   └── ui/
        │       ├── Button.tsx # Button with variants, sizes, and spinner
        │       └── Card.tsx   # Generic Card container
        ├── hooks/
        │   └── useHealth.ts  # TanStack Query hook for /api/v1/health
        ├── layouts/
        │   ├── AppLayout.tsx  # Child route wrapper
        │   └── RootLayout.tsx # Shell with header navigation, outlet, footer
        ├── pages/
        │   ├── HealthCheckPage.tsx # Live API & DB connectivity probe UI
        │   ├── HomePage.tsx        # Hero banner & platform overview
        │   └── NotFoundPage.tsx    # 404 fallback page
        ├── routes/
        │   └── index.tsx     # React Router createBrowserRouter definition
        ├── services/
        │   ├── api.ts           # Axios instance with baseURL & error interceptor
        │   └── healthService.ts # API health check call
        ├── stores/
        │   └── appStore.ts   # Zustand app store (appName, sidebarOpen)
        └── types/
            └── index.ts      # TypeScript interfaces (ApiResponse, HealthStatus, UserRole)
```

**Key Structural Finding:**
While the complete source code, configurations, components, and routing structure exist, **no `node_modules/` directory exists**, and **no package lockfile (`package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock`) is present**.

---

## Section 2 — Technology Verification

| Technology / Requirement | Status | Evidence / Existing Configuration | Missing Work |
|---|---|---|---|
| **React** | Partially Configured | Declared in `package.json` (`react: ^18.3.1`, `react-dom: ^18.3.1`). Root mount configured in `src/main.tsx` (`ReactDOM.createRoot`). Core component hierarchy in `src/App.tsx`. | Dependencies are not installed (`node_modules/` absent). |
| **Vite** | Partially Configured | Declared in `package.json` (`vite: ^5.4.8`, `@vitejs/plugin-react: ^4.3.2`). Configured in `vite.config.ts` with React plugin, `@/` path alias, port 5173, and `/api` proxy to `http://localhost:8080`. | Dependencies are not installed; dev server and build tools cannot run. |
| **Tailwind CSS** | Partially Configured | Declared in `package.json` (`tailwindcss: ^3.4.13`, `postcss: ^8.4.47`, `autoprefixer: ^10.4.20`). `postcss.config.js` and `tailwind.config.js` present with brand color extensions. `@tailwind` directives in `src/index.css`. | Dependencies are not installed. |
| **React Router** | Partially Configured | Declared in `package.json` (`react-router-dom: ^6.26.2`). Defined via `createBrowserRouter` in `src/routes/index.tsx` (`/`, `/health`, `*`). `<RouterProvider router={router} />` rendered in `src/App.tsx`. | Dependencies are not installed; protected route guards (`/admin/*`, `/college/*`) and auth routes not yet created. |
| **Redux Toolkit** | Not Installed | Not declared in `frontend/package.json`. No Redux store or `<Provider>` exists. The project architecture deliberately specifies Zustand for lightweight client state (`docs/04-tech-stack/frontend.md`). | If Redux is required, `@reduxjs/toolkit` and `react-redux` must be added; otherwise, follow the confirmed Zustand architecture. |
| **Axios** | Partially Configured | Declared in `package.json` (`axios: ^1.7.7`). Reusable `apiClient` instance configured in `src/services/api.ts` with `baseURL`, JSON headers, and error interceptor. Used by `src/services/healthService.ts`. | Dependencies not installed; `withCredentials: true` is missing (required for session cookie `ACADLYTIC_SID` per `ADR-03`); CSRF cookie/header interceptor (`X-XSRF-TOKEN`) is missing per `ADR-04`. |
| **TanStack Query** | Partially Configured | Declared in `package.json` (`@tanstack/react-query: ^5.59.0`). Instantiated with defaults (2-min stale time) and wrapped via `<QueryClientProvider>` in `src/App.tsx`. Consumed by `src/hooks/useHealth.ts`. | Dependencies are not installed. |
| **Zustand** | Partially Configured | Declared in `package.json` (`zustand: ^5.0.0`). Global store created in `src/stores/appStore.ts` managing `appName` and `sidebarOpen` toggle. | Dependencies are not installed; authentication store (`useAuthStore`) not yet implemented. |
| **Reusable Layouts** | Partially Configured | `src/layouts/RootLayout.tsx` (top navigation header, main outlet, footer) and `src/layouts/AppLayout.tsx` exist. | Dedicated `AuthLayout` (for login/registration), collapsible `Sidebar` component, and college/admin dashboard layouts are missing. |
| **Reusable UI Components** | Partially Configured | `src/components/ui/Button.tsx` (variants, sizes, loading spinner, disabled state) and `src/components/ui/Card.tsx` (title, subtitle, styling) exist. | Form `Input`, `Textarea`, `Select`, `Checkbox`, `Modal`/Dialog, `Alert`/Banner, `Badge`, and `Toast` components are missing. |

---

## Section 3 — Configuration Details

### 3.1 Installed vs. Declared Status
- All dependencies are declared in `frontend/package.json`, but **zero dependencies are installed** on the file system (`frontend/node_modules/` does not exist).
- No package lockfile exists.
- The machine environment has **Node.js v24.19.0** and **npm 11.17.0** available.

### 3.2 Configuration Files
1. **`vite.config.ts`**:
   - Plugin: `@vitejs/plugin-react`
   - Path mapping: `@` resolves to `./src`
   - Server: Port 5173, `host: true`
   - Proxy: `/api` routes proxy to `http://localhost:8080` (aligning with `ADR-04` same-origin cookie development proxy)
2. **`tsconfig.json` & `tsconfig.node.json`**:
   - Target: `ES2020`
   - Module: `ESNext` with `"moduleResolution": "bundler"`
   - Strict mode enabled (`"strict": true`)
   - Path mapping: `"@/*": ["./src/*"]`
3. **`tailwind.config.js` & `postcss.config.js`**:
   - Content paths: `"./index.html"`, `"./src/**/*.{js,ts,jsx,tsx}"`
   - Theme extensions: Custom `brand` sky/blue color palette (`50` through `900`)
   - PostCSS plugins: `tailwindcss` and `autoprefixer`
4. **`src/index.css`**:
   - Injects `@tailwind base`, `@tailwind components`, `@tailwind utilities`
   - Configures base body font features and colors (`bg-slate-50 text-slate-800 antialiased`)
5. **`src/services/api.ts`**:
   - Sets `baseURL` from `import.meta.env.VITE_API_BASE_URL` or fallback `/api/v1`
   - Missing: `withCredentials: true` and CSRF header interceptor

---

## Section 4 — Build and Verification Results

### 4.1 Dependency Verification
- **Command:** `dir /a c:\React\Acadlytic\frontend\node_modules`
- **Result:** `File Not Found` (Exit code 1).
- **Finding:** Package dependencies have never been installed via `npm install` or `pnpm install`.

### 4.2 Production Build Verification
- **Command:** `cd c:\React\Acadlytic\frontend && npm run build`
- **Result:**
  ```text
  > acadlytic-frontend@0.0.1 build
  > tsc && vite build

  'tsc' is not recognized as an internal or external command,
  operable program or batch file.
  ```
- **Exit Code:** `1` (Failure).
- **Finding:** Build cannot execute because TypeScript compiler (`tsc`) and Vite CLI binaries are absent without `node_modules`.

### 4.3 Lint Verification
- **Command:** `cd c:\React\Acadlytic\frontend && npm run lint`
- **Result:** Cannot execute (`eslint` is not installed, and no `.eslintrc` configuration file is present).

---

## Section 5 — Missing Requirements

To bring the frontend from its current scaffolded state to a production-ready application for Phase 02/03 development, the following work must be completed:

1. **Package Installation:**
   - Execute package installation (`npm install`) to create `node_modules` and generate a reproducible lockfile.
2. **Axios Session & CSRF Synchronization (`ADR-03`, `ADR-04`):**
   - Add `withCredentials: true` to `apiClient` in `src/services/api.ts` so the browser transmits `ACADLYTIC_SID` on same-origin requests.
   - Configure Axios interceptor to read the `XSRF-TOKEN` cookie and attach it as the `X-XSRF-TOKEN` request header on mutating calls (`POST`, `PUT`, `PATCH`, `DELETE`).
   - Add automatic retry/refresh on `403 CSRF_TOKEN_INVALID`.
3. **Authentication Store & Service:**
   - Create `src/stores/authStore.ts` using Zustand to track the authenticated user, role, approval status, and `managementUnlocked` state.
   - Create `src/services/authService.ts` implementing `login`, `logout`, `getMe`, `changePassword`, `forgotPassword`, and `resetPassword`.
4. **Missing UI Component Library:**
   - Create `src/components/ui/Input.tsx` (accessible text input with label, error message, and helper text).
   - Create `src/components/ui/Modal.tsx` (accessible dialog overlay).
   - Create `src/components/ui/Alert.tsx` (status banners for info, success, warning, and error).
   - Create `src/components/ui/Select.tsx` and `Textarea.tsx`.
5. **Missing Layouts & Navigation:**
   - Create `src/layouts/AuthLayout.tsx` (centered branded card layout for login, college registration, password recovery).
   - Create `src/components/navigation/Sidebar.tsx` and integrate with `useAppStore` for dashboard views.
6. **Route Protection & Guards (`ADR-09`, `ADR-10`):**
   - Implement `ProtectedRoute` and `RoleGuard` components in React Router to protect `/admin/*` and `/college/*` routes.
   - Implement `CollegeApprovalGuard` to route `PENDING` colleges to the restricted onboarding view and `APPROVED` colleges to full management.

---

## Section 6 — Recommended Frontend Setup Plan

When authorized to proceed with Frontend Setup, execute the following staged plan:

### Stage 1: Dependency Installation & Clean Baseline Verification
1. Run `npm install` inside `c:\React\Acadlytic\frontend`.
2. Verify package lockfile creation (`package-lock.json`).
3. Run `npm run build` to verify clean compilation with TypeScript 5 and Vite 5.

### Stage 2: Security & Network Integration (`ADR-03`, `ADR-04`)
1. Update `src/services/api.ts`:
   - Set `withCredentials: true`.
   - Add request interceptor to auto-read `XSRF-TOKEN` cookie via `document.cookie` and attach `X-XSRF-TOKEN`.
   - Add response interceptor handling `401 Unauthorized` (session invalidation) and `403 CSRF_TOKEN_INVALID` (bootstrap retry via `/api/v1/auth/csrf`).

### Stage 3: Core UI Component Kit
1. Implement missing primitive components in `src/components/ui/`:
   - `Input.tsx`
   - `Select.tsx`
   - `Textarea.tsx`
   - `Modal.tsx`
   - `Alert.tsx`
2. Ensure components support Tailwind styling, accessibility, and react-hook-form integration via `forwardRef`.

### Stage 4: Authentication & Session State Architecture
1. Implement `src/stores/authStore.ts` using Zustand.
2. Implement `src/services/authService.ts`.
3. Implement `src/hooks/useAuth.ts` integrating TanStack Query for `/api/v1/auth/me`.

### Stage 5: Routing & Layout Architecture
1. Create `src/layouts/AuthLayout.tsx`.
2. Implement route guards: `RequireAuth`, `RequireRole`, `RequireCollegeApproved`.
3. Build placeholder authentication routes: `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, `/register-college`.

### Stage 6: End-to-End Build & Verification
1. Run `npm run build` to verify zero TypeScript or bundler errors.
2. Start Vite dev server (`npm run dev`) and test live health probe against running Spring Boot backend.

---

## Section 7 — Final Assessment

- **Is the frontend application already created?**  
  **Yes.** A well-architected project structure exists in `c:\React\Acadlytic\frontend` containing TypeScript configuration, Vite setup, Tailwind styles, core layout, router setup, and sample health probe pages.
- **Is React + Vite ready?**  
  **No, not until dependencies are installed.** The configuration and source code are valid, but `node_modules/` is absent, preventing execution of `tsc`, `vite dev`, or `vite build`.
- **Which requested libraries are ready?**  
  - Ready in code (pending `npm install`): React 18, Vite 5, Tailwind CSS 3, React Router 6, TanStack Query 5, Zustand 5, Axios 1.7.
  - Not installed/Not planned: Redux Toolkit (Zustand is used instead per architecture).
- **Which configurations are incomplete?**  
  - `axios` instance is missing `withCredentials: true` and `X-XSRF-TOKEN` cookie-to-header interceptors.
  - Form UI components (`Input`, `Modal`, `Alert`) are not yet implemented.
  - Auth layout and route protection guards are not yet implemented.
- **Is the frontend ready for feature/module development?**  
  **Not yet.** Executing Stage 1 (`npm install`) and Stage 2 (Axios credentials/CSRF setup) is required before feature pages (such as Login, Registration, or Dashboards) can be built and tested.
