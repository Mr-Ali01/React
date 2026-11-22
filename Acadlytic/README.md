# Acadlytic

[![CI](https://github.com/your-org/acadlytic/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/acadlytic/actions/workflows/ci.yml)

**Academic Intelligence and Longitudinal Academic Records Platform for University-Affiliated Colleges**

Acadlytic transforms fragmented university examination result files into centralized, validated student academic records, automated backlog lifecycles, longitudinal Academic Passports, and actionable institutional analytics within a multi-tenant collegiate architecture.

---

## 1. Architecture Overview

Acadlytic is structured as a **Modular Monolith**:
- **Backend:** Java 21, Spring Boot 3, Spring Web, Spring Security, Spring Session JDBC (stateful HTTP-only sessions + SPA CSRF; no JWT), Spring Data JPA, Hibernate, Bean Validation, Maven, and MySQL 8.
- **Frontend:** React 18+, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Zustand, Axios, Recharts, and Lucide React.
- **Database:** MySQL 8 (InnoDB, `utf8mb4`, UTC timestamps, Flyway migrations, Spring Session JDBC tables, transactional email outbox).
- **Multi-Tenancy:** College-level tenant isolation (`college_id`) with public college registration, restricted pre-approval onboarding dashboard, and `SUPER_ADMIN` verification/approval.
- **MVP Role Model:** Two active roles (`SUPER_ADMIN` and `COLLEGE_ADMIN`, with exactly one active `COLLEGE_ADMIN` per college in MVP). `ACADEMIC_STAFF`, `STUDENT` authentication/portal, and `BRANCH_ADMIN` (multi-campus/branch management) are Post-MVP capabilities; student academic records remain in MVP.

```text
acadlytic/
├── backend/               # Spring Boot 3 REST API modular monolith
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/acadlytic/
│   │   │   │   ├── config/      # Security, OpenAPI, CORS configuration
│   │   │   │   ├── common/      # Exception handling, standard API responses, health
│   │   │   │   └── modules/     # Domain feature modules (auth, colleges, academic, etc.)
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       ├── application-dev.yml
│   │   │       ├── application-prod.yml
│   │   │       └── db/migration/# Flyway SQL schema migrations
│   │   └── test/                # Unit tests (JUnit 5/Mockito) & Testcontainers MySQL 8 integration tests
│   └── pom.xml
│
├── frontend/              # React + TypeScript + Vite SPA
│   ├── src/
│   │   ├── assets/              # Static media & styles
│   │   ├── components/          # Reusable UI components
│   │   ├── layouts/             # Root & App shell layouts
│   │   ├── pages/               # Route pages (Home, Health Check, Admin, College)
│   │   ├── routes/              # Client-side router configuration
│   │   ├── services/            # Axios API clients & endpoint callers
│   │   ├── hooks/               # Custom React hooks (TanStack Query hooks)
│   │   ├── stores/              # Zustand global client stores
│   │   ├── types/               # TypeScript interfaces & DTOs
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── docs/                  # Authoritative project specifications & documentation (00 to 16)
├── docker-compose.yml     # Local MySQL 8 database service (plus Mailpit dev SMTP in Phase 02)
├── .env.example           # Environment variable template
├── .gitignore
└── README.md
```

---

## 2. Prerequisites

Ensure the following tools are installed:
- **Java Development Kit (JDK):** Version 21 (LTS)
- **Apache Maven:** 3.9+
- **Node.js:** 20+ (with npm or pnpm)
- **Docker & Docker Compose:** For running MySQL container locally (or local MySQL 8.0 server)

---

## 3. Quick Start (Development Environment)

### Step 1: Clone and Configure Environment

```bash
# Clone the repository
git clone https://github.com/your-org/acadlytic.git
cd acadlytic

# Create your local environment file
cp .env.example .env
```

### Step 2: Start the MySQL Database

Using Docker Compose:
```bash
docker compose up -d mysql
```

Verify that MySQL is up and responding:
```bash
docker compose ps
```

*Note: If you have a local MySQL 8 installation instead of Docker, create a database named `acadlytic` with UTF-8 character set.*

### Step 3: Start the Backend (Spring Boot)

```bash
cd backend

# Build and run with development profile
mvn clean spring-boot:run -Dspring-boot.run.profiles=dev
```

The backend starts at `http://localhost:8080`.
- **Health Check:** `http://localhost:8080/api/v1/health`
- **Swagger / OpenAPI UI:** `http://localhost:8080/swagger-ui.html`
- **OpenAPI JSON Spec:** `http://localhost:8080/api-docs`

### Step 4: Start the Frontend (Vite + React)

Open a new terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

The frontend will be available at `http://localhost:5173`.
- Navigate to `http://localhost:5173/health` to verify live communication between the React frontend and Spring Boot backend.

---

## 4. Environment Variables

| Variable | Description | Default (Dev) |
|---|---|---|
| `SERVER_PORT` | Backend HTTP listening port | `8080` |
| `SPRING_PROFILES_ACTIVE` | Active Spring profile (`dev` or `prod`) | `dev` |
| `SPRING_DATASOURCE_URL` | JDBC MySQL connection URL | `jdbc:mysql://localhost:3306/acadlytic?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true` |
| `SPRING_DATASOURCE_USERNAME` | Database username | `acadlytic_user` |
| `SPRING_DATASOURCE_PASSWORD` | Database password | `acadlytic_password` |
| `CORS_ALLOWED_ORIGINS` | Permitted frontend origins | `http://localhost:5173,http://localhost:3000` |
| `VITE_API_BASE_URL` | Frontend API client base URL (prefer same-origin `/api/v1` via Vite dev proxy for session & CSRF cookies) | `/api/v1` (or `http://localhost:8080/api/v1`) |

---

## 5. Development Strategy

Acadlytic strictly implements a **backend-first, module-by-module** delivery sequence aligned with `docs/08-task-breakdown/roadmap.md`. Modules must not be built out of sequence:

### MVP Phases (Active Roles: `SUPER_ADMIN` and `COLLEGE_ADMIN`)
1. **Phase 01:** Project & Application Foundation *(Completed)*
2. **Phase 02:** Authentication & Authorization Foundation *(Next Phase)*
3. **Phase 03:** College Registration, Restricted Dashboard & Approval Workflow
4. **Phase 04:** College Management (Tenant Management & Profile)
5. **Phase 05:** Academic Structure (Programs, Semesters, Subjects, Credits)
6. **Phase 06:** Student Records Management (Records & Enrollment)
7. **Phase 07:** Result Import (Excel & CSV Parsing & Ingestion)
8. **Phase 08:** Result Validation & Error Resolution
9. **Phase 09:** Result Processing (Authoritative Mutation & Attempt Histories)
10. **Phase 10:** Backlog Lifecycle Tracking (`OPEN` / `RESOLVED` States)
11. **Phase 11:** Academic Passport (Administrative Read Model)
12. **Phase 12:** College Academic Analytics (Institutional Dashboards)
13. **Phase 13:** End-to-End Integration & Release Hardening
14. **Phase 14:** MVP Release Gate & Pilot Deployment

### Post-MVP Phases (Role Expansion & Advanced Capabilities)
15. **Phase 15:** Post-MVP `ACADEMIC_STAFF` Support & Delegated Portal
16. **Phase 16:** Post-MVP `STUDENT` Authentication & Student Self-Service Portal
17. **Phase 17:** Post-MVP Subscription-Based Self-Service Onboarding & SaaS Billing
18. **Phase 18:** Future Platform Capabilities (University API Connectors, Regulation Engine, What-If Simulator, Predictive Risk, AI Query, `BRANCH_ADMIN` & Multi-Campus Management, Automated Document Malware Scanning)

---

## 6. Documentation Reference

For all architectural principles, feature specifications, and rules, consult `docs/`:
- `docs/03-prd/mvp-scope.md` — MVP scope, role boundaries, and onboarding rules
- `docs/05-architecture/` — Database, API, backend, frontend, integration, data ownership, and system architecture specifications
- `docs/07-project-rules/` — Backend, frontend, database, security, and AI coding standards
- `docs/08-task-breakdown/` — Master roadmap (`roadmap.md`) and detailed development task breakdown
- `docs/09-development/feature-specifications/` — Feature specifications (including `authentication.md`)
- `docs/09-development/implementation-notes/` — Technical implementation blueprints (including `authentication-implementation.md`)
