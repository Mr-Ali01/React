# Acadlytic

**Academic Intelligence and Longitudinal Academic Records Platform for University-Affiliated Colleges**

Acadlytic transforms fragmented university examination result files into centralized, validated student academic records, automated backlog lifecycles, longitudinal Academic Passports, and actionable institutional analytics within a multi-tenant collegiate architecture.

---

## 1. Architecture Overview

Acadlytic is structured as a **Modular Monolith**:
- **Backend:** Java 21, Spring Boot 3, Spring Web, Spring Security, Spring Data JPA, Hibernate, Bean Validation, Maven, and MySQL 8.
- **Frontend:** React 18+, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Zustand, Axios, Recharts, and Lucide React.
- **Database:** MySQL 8 (InnoDB, `utf8mb4`, UTC timestamps, Flyway migrations).
- **Multi-Tenancy:** College-level tenant isolation (`college_id`).
- **MVP Role Model:** Two active roles (`SUPER_ADMIN` and `COLLEGE_ADMIN`). `ACADEMIC_STAFF` and `STUDENT` are post-MVP capabilities.

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
│   │   └── test/                # Unit and integration tests
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
├── acadlytic-docs/        # Authoritative project specifications & documentation (00 to 16)
├── docker-compose.yml     # Local MySQL 8 database service
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
| `VITE_API_BASE_URL` | Frontend API client base URL | `http://localhost:8080/api/v1` |

---

## 5. Development Strategy

Acadlytic strictly implements a **backend-first, module-by-module** delivery sequence. Modules must not be built out of sequence:
1. Foundation & Infrastructure *(Current Phase)*
2. Authentication & Authorization (`SUPER_ADMIN` and `COLLEGE_ADMIN`)
3. College & Tenant Management
4. Academic Structure Configuration
5. Student Records Management
6. University Result Import
7. Result Validation & Resolution
8. Authoritative Result Processing & Attempts
9. Backlog Lifecycle Tracking
10. Academic Passport (Admin Read View)
11. College Academic Analytics
12. Integration & Hardening
13. MVP Release Gate & Pilot Deployment
14. Post-MVP Academic Staff Portal
15. Post-MVP Student Portal & Self-Service

---

## 6. Documentation Reference

For all architectural principles, feature specifications, and rules, consult `acadlytic-docs/`:
- `03-prd/mvp-scope.md` — MVP scope and boundary definitions
- `05-architecture/` — Database, API, and system architecture specifications
- `07-project-rules/` — Backend, frontend, database, security, and AI coding standards
- `08-task-breakdown/` — Roadmap and detailed development task breakdown
