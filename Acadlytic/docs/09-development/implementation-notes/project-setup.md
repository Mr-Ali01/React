# Acadlytic — Project Setup

**Document:** `09-development/implementation-notes/project-setup.md`  
**Project:** Acadlytic — The Academic Intelligence Platform for University-Affiliated Colleges  
**Document Type:** Development Implementation Note  
**Status:** Draft / Under Review  
**Version:** 1.0

---

# 1. Purpose

This document defines the practical setup required to begin developing Acadlytic.

It converts the approved project structure, technology decisions, architecture, and development rules into a repeatable local development environment.

This document covers:

- repository setup
- project directory structure
- frontend setup
- backend setup
- database setup
- environment configuration
- development commands
- frontend/backend connectivity
- Git setup
- local verification
- initial development checklist

This document does **not** define individual feature implementation details.

Feature implementation must follow the corresponding documents in:

```text
09-development/feature-specifications/
```

---

# 2. Implementation Baseline

Acadlytic will initially use a modular monolith architecture.

```text
Frontend
React + TypeScript
        ↓
REST API
        ↓
Spring Boot
        ↓
Application / Domain Modules
        ↓
Spring Data JPA / Hibernate
        ↓
MySQL
```

The initial implementation should avoid unnecessary microservices.

---

# 3. Technology Baseline

## 3.1 Frontend

| Technology | Purpose |
|---|---|
| React | UI framework |
| TypeScript | Type safety |
| Vite | Development/build tooling |
| Tailwind CSS | Styling |
| React Router | Routing |
| TanStack Query | Server state |
| Zustand | Client state where required |
| Axios | HTTP communication |
| React Hook Form | Form handling |
| Zod | Client-side schema validation |
| Recharts | Data visualization |
| Lucide React | Icons |

---

## 3.2 Backend

| Technology | Purpose |
|---|---|
| Java 21 | Runtime/language |
| Spring Boot | Application framework |
| Spring Web | REST APIs |
| Spring Security | Authentication/authorization |
| Spring Data JPA | Persistence |
| Hibernate | ORM |
| Bean Validation | Request/domain validation |
| Maven | Build/dependency management |
| Apache POI | Excel processing |
| OpenCSV | CSV processing |
| Springdoc OpenAPI | API documentation |

---

## 3.3 Database

Primary database:

```text
MySQL
```

Persistence:

```text
Spring Data JPA
        ↓
Hibernate
        ↓
MySQL
```

Database migrations must be used instead of relying on uncontrolled schema generation in shared environments.

---

# 4. Repository Structure

The repository should follow the established project structure.

```text
acadlytic/
│
├── frontend/
│
├── backend/
│
├── docs/
│
├── docker/
│
├── docker-compose.yml
│
├── .github/
│   └── workflows/
│
├── .gitignore
└── README.md
```

---

# 5. Frontend Structure

The frontend should use a feature-oriented structure.

```text
frontend/
├── public/
│
├── src/
│   ├── app/
│   │   ├── router/
│   │   ├── providers/
│   │   └── layouts/
│   │
│   ├── pages/
│   │   ├── public/
│   │   ├── auth/
│   │   ├── admin/
│   │   ├── college/
│   │   └── student/
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── students/
│   │   ├── academic/
│   │   ├── results/
│   │   ├── backlogs/
│   │   ├── passport/
│   │   └── analytics/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── shared/
│   │   └── layouts/
│   │
│   ├── hooks/
│   ├── services/
│   ├── store/
│   ├── types/
│   └── utils/
│
├── package.json
└── vite.config.ts
```

---

# 6. Backend Structure

The backend should follow the established modular monolith structure.

```text
backend/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── acadlytic/
│   │   │           ├── AcadlyticApplication.java
│   │   │           │
│   │   │           ├── config/
│   │   │           ├── security/
│   │   │           ├── common/
│   │   │           ├── exception/
│   │   │           │
│   │   │           ├── modules/
│   │   │           │   ├── auth/
│   │   │           │   ├── users/
│   │   │           │   ├── colleges/
│   │   │           │   ├── students/
│   │   │           │   ├── academic/
│   │   │           │   ├── results/
│   │   │           │   ├── backlogs/
│   │   │           │   ├── passport/
│   │   │           │   └── analytics/
│   │   │           │
│   │   │           └── jobs/
│   │   │
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       └── application-prod.yml
│   │
│   └── test/
│
└── pom.xml
```

---

# 7. Backend Module Structure

Each major module should remain internally organized.

A module may follow:

```text
module/
├── controller/
├── service/
├── domain/
├── repository/
├── dto/
├── mapper/
└── validation/
```

The exact package organization may vary when justified by the module.

The project must avoid creating unnecessary layers that do not provide value.

---

# 8. Development Environment

The development machine should provide:

- Java 21
- Maven
- Node.js
- npm
- MySQL
- Git
- IDE/editor
- browser
- optional Docker

Verify installations before starting development.

Example checks:

```bash
java -version
mvn -version
node -v
npm -v
mysql --version
git --version
```

Expected Java baseline:

```text
Java 21
```

---

# 9. Repository Initialization

Create the project repository before feature implementation.

Example:

```bash
mkdir acadlytic
cd acadlytic
git init
```

Create the initial directory structure:

```bash
mkdir frontend
mkdir backend
mkdir docs
mkdir docker
mkdir .github
```

The exact commands may vary by operating system.

---

# 10. Frontend Initialization

Create the React application using Vite.

Example:

```bash
npm create vite@latest frontend -- --template react-ts
```

Then:

```bash
cd frontend
npm install
```

The project should use TypeScript rather than JavaScript.

---

# 11. Frontend Dependencies

Install the approved application dependencies as required.

Core routing:

```text
react-router-dom
```

Server state:

```text
@tanstack/react-query
```

HTTP:

```text
axios
```

Forms:

```text
react-hook-form
zod
```

State:

```text
zustand
```

Charts:

```text
recharts
```

Icons:

```text
lucide-react
```

Dependencies should only be added when they provide a justified project requirement.

---

# 12. Tailwind CSS

Configure Tailwind according to the project's design system.

The implementation must follow:

```text
06-design/design-system.md
07-project-rules/frontend-rules.md
```

Do not create arbitrary colors, spacing, typography, or component styles when an established design token already exists.

---

# 13. Frontend Environment Configuration

Frontend environment-specific configuration should use environment variables.

Example:

```text
VITE_API_BASE_URL=
```

Development example:

```text
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

The actual value should be environment-specific.

Do not commit secrets.

---

# 14. Backend Initialization

Create the Spring Boot project with:

```text
Java 21
Maven
Spring Boot
```

Required baseline capabilities:

- Spring Web
- Spring Data JPA
- Spring Security
- Bean Validation
- MySQL driver

Additional dependencies should be introduced only when required.

---

# 15. Maven Structure

The backend should contain:

```text
backend/
├── pom.xml
└── src/
```

The Maven build must support:

```bash
mvn clean
mvn test
mvn package
```

Development execution may use:

```bash
mvn spring-boot:run
```

---

# 16. Backend Application Profiles

Use environment-specific Spring profiles.

Recommended baseline:

```text
application.yml
application-dev.yml
application-prod.yml
```

The default configuration should contain only safe shared configuration.

Development-specific values belong in the development configuration.

Production secrets must not be committed.

---

# 17. Database Setup

Create a dedicated development database.

Example:

```sql
CREATE DATABASE acadlytic_dev;
```

The actual database name may be changed according to the deployment environment.

---

# 18. Database Configuration

The backend should obtain database configuration through environment-specific configuration.

Conceptually:

```text
DB_HOST
DB_PORT
DB_NAME
DB_USERNAME
DB_PASSWORD
```

Do not hard-code credentials inside Java source code.

---

# 19. Database Migration Strategy

Database schema changes must be version controlled.

Every schema change should:

1. create a migration
2. review the migration
3. apply it locally
4. verify constraints
5. verify indexes
6. run tests
7. commit the migration with the related code

Avoid using automatic schema generation as the authoritative production migration mechanism.

---

# 20. Initial Database Foundation

The first database implementation should establish only the structures required by the initial modules.

Do not create every future table immediately.

Initial tables should be introduced according to the implementation dependency order.

Expected early dependencies include:

```text
Users
   ↓
Colleges
   ↓
Academic Structure
   ↓
Students
   ↓
Results
```

Backlog, Passport, and Analytics depend on authoritative academic result data.

---

# 21. Database Ownership

The implementation must follow:

```text
College
    → College Management

Student
    → Student Management

Course/Semester/Subject
    → Academic Structure

Import Job
    → Result Import

Validation State
    → Result Validation

Processed Result
    → Result Processing

Backlog
    → Backlog Tracking

Academic Passport
    → Read Model

Analytics
    → Derived Read Layer
```

Ownership must not be duplicated merely for convenience.

---

# 22. Backend–Frontend Connection

The communication flow is:

```text
React
   ↓
Axios
   ↓
HTTP/HTTPS
   ↓
Spring Boot REST API
   ↓
Application Services
   ↓
Repositories
   ↓
MySQL
```

The frontend must not access MySQL directly.

---

# 23. API Base Path

The application API baseline is:

```text
/api/v1
```

Examples:

```text
/api/v1/auth/login
/api/v1/me
/api/v1/colleges
/api/v1/students
/api/v1/result-imports
/api/v1/analytics/dashboard
```

The API architecture document remains authoritative for API conventions.

---

# 24. CORS Configuration

During local development, configure backend CORS to allow the local frontend origin.

Example development origins may include:

```text
http://localhost:5173
```

CORS must not be opened broadly in production without explicit justification.

---

# 25. Local Development Ports

A possible development configuration is:

```text
Frontend:
http://localhost:5173

Backend:
http://localhost:8080

MySQL:
3306
```

These are development defaults and may be changed when necessary.

---

# 26. Running the Application

## Start MySQL

Ensure the MySQL service is running.

---

## Start Backend

From:

```text
backend/
```

run:

```bash
mvn spring-boot:run
```

Backend should become available on the configured port.

---

## Start Frontend

From:

```text
frontend/
```

run:

```bash
npm run dev
```

The frontend should become available on the configured Vite development port.

---

# 27. Initial Health Verification

After starting the backend, verify:

- application starts successfully
- database connection works
- no migration errors occur
- no dependency errors occur
- health endpoint responds
- logs do not expose secrets

---

# 28. Initial Frontend Verification

Verify:

- application starts
- Vite build succeeds
- browser loads application
- routing works
- no console errors
- API base URL is correct
- environment variables are loaded

---

# 29. API Verification

Before implementing business features, verify basic API communication.

Example flow:

```text
Frontend
   ↓
GET /api/v1/...
   ↓
Spring Boot
   ↓
Response
   ↓
Frontend
```

A temporary health endpoint or approved diagnostic endpoint may be used for verification.

Do not introduce permanent development-only endpoints into production without review.

---

# 30. Git Configuration

The repository must contain an appropriate `.gitignore`.

It should exclude at minimum:

```text
node_modules/
dist/
target/
.env
.env.*
*.log
IDE-specific files
OS-specific files
```

Do not blindly ignore files that may be required by the project.

---

# 31. Environment Files

Local environment files may contain:

- database credentials
- API URLs
- application secrets
- local configuration

These must not be committed.

Use safe example files when documentation requires it.

Example:

```text
.env.example
```

The example must contain placeholders rather than real secrets.

---

# 32. Secret Management

Never store:

- database passwords
- authentication secrets
- API keys
- private keys
- production credentials

inside:

- Java source
- TypeScript source
- committed `.env` files
- Git history
- documentation

Production secrets must be supplied through the deployment environment or approved secret-management mechanism.

---

# 33. Docker Strategy

Docker may be used to standardize development and deployment environments.

Potential services:

```text
frontend
backend
mysql
```

However, Docker should not be introduced merely for complexity.

The initial local environment must remain understandable and reproducible.

---

# 34. Docker Compose

If Docker Compose is adopted for development, the root configuration may follow:

```text
docker-compose.yml
```

Potential structure:

```text
services:
  mysql:
    ...

  backend:
    ...

  frontend:
    ...
```

The exact implementation should be finalized when the infrastructure configuration is implemented.

---

# 35. Initial Logging

Backend logs should provide enough information to diagnose:

- application startup
- database connection
- request failures
- processing failures
- background jobs
- unexpected exceptions

Do not log sensitive information.

Examples of information that should not be logged unnecessarily:

- passwords
- authentication secrets
- database credentials
- sensitive personal information
- tokens

---

# 36. Initial Error Handling

The backend should establish a consistent error response before feature development expands.

Conceptually:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable message",
  "details": {},
  "timestamp": "...",
  "path": "..."
}
```

The exact contract must follow `api-architecture.md`.

Do not expose stack traces to normal API consumers.

---

# 37. Initial Validation

Bean Validation should be established for request DTOs.

Examples:

```text
@NotNull
@NotBlank
@Size
@Email
@Pattern
```

Only validations appropriate to the actual domain should be applied.

Frontend validation improves user experience, but backend validation remains authoritative.

---

# 38. Initial Security Foundation

Before implementing feature APIs:

- [ ] Establish Spring Security
- [ ] Establish authentication context
- [ ] Establish authorization foundation
- [ ] Establish protected route strategy
- [ ] Establish tenant context strategy
- [ ] Establish secure password handling
- [ ] Establish error handling
- [ ] Establish security logging requirements

Feature-specific authorization must be implemented with the relevant feature.

---

# 39. Initial API Documentation

Configure OpenAPI documentation for the backend.

The documentation should eventually describe:

- endpoints
- request schemas
- response schemas
- authentication requirements
- validation errors
- pagination
- filtering
- authorization behavior

API documentation must remain synchronized with implementation.

---

# 40. Initial Testing Foundation

Before feature implementation:

## Backend

- [ ] Application context test
- [ ] Repository test foundation
- [ ] Service test foundation
- [ ] Controller/API test foundation

## Frontend

- [ ] Component test foundation
- [ ] Page test foundation
- [ ] Route test foundation
- [ ] API/service test foundation

Testing tools should be selected consistently with the project stack and documented before broad adoption.

---

# 41. Initial Quality Checks

The first project build should verify:

```text
Frontend
    ↓
Install
    ↓
Build
    ↓
Test

Backend
    ↓
Compile
    ↓
Test
    ↓
Package
```

The project should not proceed to feature implementation while the baseline build is unstable.

---

# 42. Initial Development Checklist

## Repository

- [ ] Repository created
- [ ] Directory structure created
- [ ] `.gitignore` created
- [ ] README created
- [ ] Git workflow established

## Frontend

- [ ] React configured
- [ ] TypeScript configured
- [ ] Vite configured
- [ ] Tailwind configured
- [ ] Router configured
- [ ] Axios configured
- [ ] TanStack Query configured
- [ ] Shared application structure created

## Backend

- [ ] Java 21 configured
- [ ] Spring Boot configured
- [ ] Maven configured
- [ ] Spring Web configured
- [ ] Spring Data JPA configured
- [ ] Spring Security foundation configured
- [ ] Validation configured
- [ ] Exception handling configured
- [ ] OpenAPI configured

## Database

- [ ] MySQL running
- [ ] Development database created
- [ ] Connection configured
- [ ] Migration strategy configured
- [ ] Initial migration tested

## Environment

- [ ] Development variables configured
- [ ] `.env` excluded
- [ ] No secrets committed
- [ ] Frontend API URL configured
- [ ] Backend database configuration verified

## Verification

- [ ] Frontend starts
- [ ] Backend starts
- [ ] Database connection works
- [ ] API responds
- [ ] Frontend can reach backend
- [ ] Tests run
- [ ] Build succeeds

---

# 43. Project Setup Acceptance Criteria

Project setup is complete when:

1. frontend starts successfully
2. backend starts successfully
3. MySQL connection works
4. frontend can communicate with backend
5. project structure matches the approved architecture
6. environment configuration works
7. secrets are excluded from source control
8. database migration mechanism works
9. baseline tests execute successfully
10. frontend build succeeds
11. backend build succeeds
12. OpenAPI foundation is available
13. security foundation exists
14. no unresolved setup blocker prevents feature development

---

# 44. What This Setup Does Not Decide

The following decisions remain subject to their respective architecture/design documents and implementation review:

- final authentication/session mechanism
- production hosting provider
- production file-storage provider
- background job implementation details
- email provider
- notification provider
- caching technology
- API gateway requirements
- advanced observability platform
- production scaling strategy

These must not be silently decided during basic project setup.

---

# 45. Relationship With Other Documents

This implementation note depends on:

```text
04-tech-stack/
05-architecture/
06-design/
07-project-rules/
08-task-breakdown/
```

It supports:

```text
09-development/feature-specifications/
09-development/implementation-notes/
```

The implementation must remain consistent with:

- `system-architecture.md`
- `frontend-architecture.md`
- `backend-architecture.md`
- `database-architecture.md`
- `api-architecture.md`
- `data-ownership.md`
- `integration-architecture.md`
- `design-system.md`
- `navigation.md`
- `responsive-design.md`
- `coding-rules.md`
- `frontend-rules.md`
- `backend-rules.md`
- `database-rules.md`
- `security-rules.md`
- `ai-coding-rules.md`

---

# 46. AI-Assisted Setup Rules

When using AI to perform project setup:

1. provide the existing project structure
2. provide the relevant architecture document
3. provide the project rules
4. identify the exact setup task
5. ask AI to inspect existing files before changing them
6. avoid unnecessary dependency installation
7. avoid replacing approved architecture
8. review every generated configuration
9. verify build/test results
10. document important setup decisions

AI must not:

- create microservices without approval
- introduce arbitrary libraries
- change Java versions
- replace MySQL
- replace React
- modify architecture silently
- add production secrets
- create undocumented business rules

---

# 47. Setup Definition of Done

The project setup is considered complete when the development team can clone the repository and, using the documented setup process:

```text
Clone Repository
      ↓
Install Dependencies
      ↓
Configure Environment
      ↓
Start MySQL
      ↓
Start Backend
      ↓
Start Frontend
      ↓
Run Tests
      ↓
Open Application
```

without undocumented manual configuration being required.

---

# 48. Next Implementation Step

After this setup is reviewed and approved, implementation should proceed with the application foundation.

Recommended order:

```text
project-setup.md
        ↓
backend-foundation.md
        ↓
frontend-foundation.md
        ↓
database-setup.md
        ↓
authentication-implementation.md
        ↓
college-management-implementation.md
        ↓
academic-structure-implementation.md
        ↓
...
```

The next implementation note should not begin detailed feature coding until the project setup is stable.

---

# 49. Status

**Status:** Draft / Under Review

Document lifecycle:

```text
Draft
   ↓
Under Review
   ↓
Approved
   ↓
Implementation Ready
   ↓
Implemented
   ↓
Maintained
```

---

# 50. Final Principle

> **The project setup must make Acadlytic reproducible, secure, maintainable, and ready for controlled feature development.**

Setup is complete when the foundation is reliable enough that feature development can proceed without repeatedly changing the project's basic structure, tooling, environment, or architectural assumptions.