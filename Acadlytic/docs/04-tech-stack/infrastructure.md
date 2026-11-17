# Acadlytic — Infrastructure Technology Stack

**Document:** `04-tech-stack/infrastructure.md`  
**Project:** Acadlytic  
**Document Status:** Draft / Under Review  
**Document Type:** Infrastructure Technology Stack  
**Last Updated:** 2026-10-05

---

# 1. Purpose

This document defines the infrastructure technology stack required to develop, deploy, operate, and maintain Acadlytic.

The infrastructure must support:

- local development
- preview/staging environments
- production deployment
- frontend hosting
- backend hosting
- MySQL database
- file processing
- secure configuration
- HTTPS
- domain routing
- CI/CD
- backups
- logging
- monitoring
- deployment rollback
- future scalability

The infrastructure should remain simple enough for the MVP while providing a reliable path toward production use.

---

# 2. Infrastructure Architecture

The initial deployment architecture is:

```text
                         Internet
                            │
                            ▼
                       DNS / Domain
                            │
                            ▼
                    Reverse Proxy / HTTPS
                       ┌────┴────┐
                       │         │
                       ▼         ▼
                  Frontend    Backend API
                  React       Spring Boot
                       │         │
                       │         ▼
                       │       MySQL
                       │         │
                       │         ▼
                       │     File Storage
                       │
                       └───────────────
```

The exact hosting provider may change without changing the application architecture.

---

# 3. Infrastructure Principles

Acadlytic infrastructure should follow these principles:

1. Keep the MVP operationally simple.
2. Separate development, preview, and production.
3. Never store production secrets in source control.
4. Use HTTPS in non-local environments.
5. Automate repeatable deployment tasks.
6. Maintain database backups.
7. Keep deployment configuration version controlled.
8. Make deployments reversible where practical.
9. Monitor critical application behavior.
10. Avoid premature infrastructure complexity.

---

# 4. Infrastructure Stack

| Technology / Service | Purpose | Status |
|---|---|---|
| Docker | Application/container packaging | Selected |
| Docker Compose | Local multi-container development | Selected |
| Nginx | Reverse proxy / web server | Selected |
| GitHub | Source-code hosting | Selected |
| GitHub Actions | CI/CD automation | Selected |
| MySQL | Production relational database | Selected |
| HTTPS/TLS | Transport security | Required |
| DNS | Domain routing | Required |
| Cloud hosting | Application deployment | To be finalized |
| Object storage | Production file storage | To be finalized |
| Monitoring | Application/infrastructure monitoring | Required |

---

# 5. Environment Strategy

Acadlytic should use separate environments.

```text
Development
     ↓
Preview / Staging
     ↓
Production
```

Each environment should have:

- separate configuration
- separate database
- separate credentials
- appropriate logging
- appropriate access controls

Production data must not be used casually in development or preview environments.

---

# 6. Development Environment

The development environment is used by developers for:

- feature development
- debugging
- local testing
- database development
- API development
- frontend integration

Typical local components:

```text
React / Vite
Spring Boot
MySQL
Docker
```

---

# 7. Local Development with Docker

Docker Compose should be used where practical to simplify local infrastructure.

Conceptual setup:

```text
docker-compose.yml
│
├── MySQL
├── Backend
└── Supporting Services
```

The frontend may run directly through Vite during active development.

---

# 8. Docker

Docker will provide reproducible application environments.

Docker may be used for:

- Spring Boot backend
- MySQL
- local supporting services
- preview deployments
- production application containers

---

# 9. Docker Image Principles

Application images should:

- use appropriate base images
- minimize unnecessary packages
- avoid running as root where practical
- use environment-based configuration
- avoid embedding secrets
- expose only required ports
- be reproducible

---

# 10. Backend Container

The Spring Boot backend should be packaged as a Docker image.

Conceptual flow:

```text
Java Source
    ↓
Maven Build
    ↓
JAR
    ↓
Docker Image
    ↓
Container
```

---

# 11. Frontend Deployment

The React application will be built into static assets.

Conceptually:

```text
React + TypeScript
        ↓
Vite Build
        ↓
Static Assets
        ↓
Web Server / CDN
```

The frontend should not require a Java runtime in production.

---

# 12. Nginx

Nginx may serve as the reverse proxy and frontend web server.

Potential responsibilities:

- HTTPS termination
- frontend static asset serving
- API reverse proxying
- request routing
- compression
- security headers
- connection handling

---

# 13. Request Routing

A conceptual production routing model is:

```text
https://acadlytic.example/
        ↓
Frontend

https://acadlytic.example/api/
        ↓
Spring Boot Backend
```

The exact domain structure will be finalized during deployment.

---

# 14. HTTPS

All non-local environments must use HTTPS.

HTTPS protects:

- login credentials
- authentication information
- student academic data
- API requests
- file uploads
- administrative operations

---

# 15. TLS Certificate

Production HTTPS should use a valid TLS certificate.

Certificate management should be automated where the hosting environment supports it.

Certificates must not be manually allowed to expire unnoticed.

---

# 16. DNS

DNS will route the Acadlytic domain to the deployed infrastructure.

Potential records may include:

```text
A
AAAA
CNAME
```

The exact records depend on the selected hosting architecture.

---

# 17. Domain Architecture

The project may use either:

```text
acadlytic.example
api.acadlytic.example
```

or:

```text
acadlytic.example
acadlytic.example/api
```

The final choice should prioritize:

- security
- CORS simplicity
- deployment simplicity
- maintainability

---

# 18. Cloud Hosting

The application can be deployed on a cloud platform that supports:

- Java/Spring Boot
- Docker
- MySQL
- HTTPS
- environment variables
- persistent storage
- scheduled/background processes

Possible providers may include AWS, Render, Railway, or another suitable provider.

The final provider is not locked by this document.

---

# 19. Infrastructure Portability

The application should avoid unnecessary dependence on a single cloud provider.

Infrastructure-specific services should be isolated behind configuration where practical.

This allows future migration without major application rewrites.

---

# 20. Database Hosting

Production MySQL should use persistent storage.

The production database must not rely on ephemeral container storage.

The database should support:

- automated backups
- persistent volumes/storage
- secure credentials
- controlled network access
- monitoring

---

# 21. Database Network Access

MySQL should not be exposed publicly unless absolutely required.

Preferred architecture:

```text
Internet
   ↓
Application
   ↓
Private / Restricted Database Network
   ↓
MySQL
```

Database access should be restricted to trusted application infrastructure and authorized administration paths.

---

# 22. File Storage

Acadlytic handles uploaded result files.

Development may use local storage.

Production should preferably use durable object storage rather than relying on the backend container filesystem.

Conceptually:

```text
Result File
    ↓
Backend
    ↓
Object Storage
    ↓
File Metadata in MySQL
```

---

# 23. File Storage Separation

The database should store file metadata rather than unnecessarily storing large files directly in relational tables.

Possible metadata includes:

- original filename
- stored filename/key
- file type
- file size
- upload timestamp
- uploader
- import identifier
- checksum where appropriate

---

# 24. File Upload Security

Uploaded files must be treated as untrusted input.

Infrastructure and backend controls should include:

- file-size limits
- allowed file types
- content validation
- safe storage
- controlled access
- filename sanitization
- malware/security scanning where required
- prevention of executable file serving

---

# 25. Environment Configuration

Configuration should be supplied through environment-specific configuration.

Examples:

```text
DATABASE_URL
DATABASE_USERNAME
DATABASE_PASSWORD
APP_BASE_URL
CORS_ALLOWED_ORIGINS
JWT_SECRET / AUTH_SECRET
FILE_STORAGE_CONFIG
```

Actual variable names may differ in implementation.

---

# 26. Secret Management

Secrets must never be committed to Git.

Sensitive configuration includes:

- database passwords
- authentication secrets
- API keys
- cloud credentials
- object-storage credentials
- third-party secrets

Production secrets should be stored in the deployment platform's secret manager or environment-secret mechanism.

---

# 27. GitHub

GitHub will be used for source-code management.

The repository should contain:

```text
frontend/
backend/
docs/
docker/
.github/
```

Infrastructure configuration that is safe to version control should remain in the repository.

Secrets must remain outside the repository.

---

# 28. GitHub Actions

GitHub Actions will provide CI/CD automation.

Potential pipeline:

```text
Git Push / Pull Request
          ↓
      Build
          ↓
       Tests
          ↓
    Static Checks
          ↓
   Docker Build
          ↓
 Deployment Approval
          ↓
      Deploy
```

The exact production approval workflow may depend on the hosting provider.

---

# 29. Continuous Integration

Every important pull request should trigger automated checks.

Minimum checks should include:

- frontend installation
- frontend build
- frontend tests
- backend compilation
- backend tests
- database-related tests where practical

---

# 30. Continuous Deployment

Deployment should occur only after required CI checks pass.

Preview deployments may be automated.

Production deployment should have appropriate protection against accidental releases.

---

# 31. Branch Strategy

The repository should use a controlled branch strategy.

A simple approach may be:

```text
main
  ↓
Feature Branch
```

Pull requests should be used for meaningful changes.

The exact branch strategy may evolve as the team grows.

---

# 32. Deployment Artifacts

Deployment artifacts should be reproducible.

Examples:

```text
Frontend Build
Backend JAR
Docker Image
Database Migration
Configuration
```

A production release should be traceable to a source-code revision.

---

# 33. Database Migration During Deployment

Database migrations must be coordinated with application deployments.

A safe deployment flow is:

```text
Build
 ↓
Test
 ↓
Backup / Verify
 ↓
Database Migration
 ↓
Application Deployment
 ↓
Health Check
```

The exact order may vary depending on migration compatibility.

---

# 34. Backward-Compatible Migrations

Schema changes should preferably be introduced in a backward-compatible way when zero/minimal downtime deployments are required.

Avoid immediately:

- dropping columns used by an older application version
- renaming critical fields without transition
- changing data meaning without migration

---

# 35. Health Checks

The backend should expose an appropriate health-check mechanism.

Health checks should allow infrastructure to determine whether the application is operational.

Conceptually:

```text
Application Started
      ↓
Health Check
      ↓
Ready
```

Health checks should distinguish application availability from deeper dependency failures where practical.

---

# 36. Application Monitoring

Monitoring should cover:

- application availability
- API errors
- response latency
- CPU/memory usage
- database availability
- background jobs
- result import failures
- processing failures
- disk/storage usage

---

# 37. Logging Infrastructure

Production logs should be centralized or otherwise accessible for troubleshooting.

Important log information may include:

- timestamp
- severity
- service
- request/correlation ID
- endpoint
- operation
- error code
- relevant non-sensitive context

Sensitive information must not be logged unnecessarily.

---

# 38. Error Monitoring

The production environment should capture unexpected application failures.

The monitoring system should help identify:

- exception frequency
- affected endpoint
- deployment version
- request/correlation ID
- approximate occurrence time

---

# 39. Background Job Monitoring

Background result processing requires operational visibility.

Jobs should expose or record:

```text
Job ID
Status
Start Time
End Time
Records Processed
Records Failed
Error Information
```

Possible states include:

```text
QUEUED
RUNNING
COMPLETED
COMPLETED_WITH_ERRORS
FAILED
CANCELLED
```

---

# 40. Import Processing Reliability

Large result imports must not depend on a single long-running HTTP request when processing complexity makes that unsafe.

A preferred architecture is:

```text
Upload
  ↓
Create Import
  ↓
Persist File
  ↓
Queue / Start Processing
  ↓
Background Job
  ↓
Validation
  ↓
Processing
  ↓
Completed
```

---

# 41. Resource Limits

Infrastructure should enforce appropriate limits for:

- HTTP request size
- file upload size
- memory
- CPU
- database connections
- concurrent processing jobs

Limits should protect system stability.

---

# 42. Database Connection Pool

The backend should use a managed database connection pool.

The pool must be configured according to:

- database capacity
- application workload
- concurrent requests
- background jobs

The application must avoid creating excessive database connections.

---

# 43. Caching

Caching is not a primary MVP infrastructure dependency.

Caching may be introduced later for:

- frequently accessed reference data
- expensive read operations
- analytics
- configuration

Caching must not compromise academic data correctness.

---

# 44. CDN

A CDN may be used for production frontend assets.

Potential benefits include:

- faster static asset delivery
- geographic distribution
- reduced origin load
- asset caching

It is not mandatory for the initial MVP.

---

# 45. Static Asset Caching

Frontend assets should use appropriate cache headers.

Versioned/bundled assets can be cached for longer periods.

HTML entry points should use appropriate cache behavior to ensure new releases become visible.

---

# 46. Production Backups

Production backup strategy must cover:

- MySQL database
- important uploaded result files
- relevant configuration where necessary

Backups should have:

- retention policy
- access control
- monitoring
- restoration procedures

---

# 47. Backup Verification

A backup is not considered reliable merely because it completed successfully.

Restoration should be tested periodically.

The infrastructure process should verify:

```text
Backup Created
      ↓
Backup Accessible
      ↓
Backup Restored
      ↓
Data Verified
```

---

# 48. Disaster Recovery

The system should have a basic disaster-recovery procedure.

Potential failure scenarios include:

- database corruption
- application failure
- storage failure
- deployment failure
- cloud infrastructure outage
- accidental configuration changes

The recovery process should identify:

- restoration source
- restoration procedure
- responsible operator
- validation steps

---

# 49. Rollback Strategy

Production deployments should have a rollback mechanism.

Possible rollback approaches include:

- previous Docker image
- previous application build
- deployment-platform rollback
- database recovery where necessary

Database migrations must be designed carefully because application rollback does not automatically mean schema rollback.

---

# 50. Deployment Health Verification

After deployment, verify:

```text
Frontend Loads
      ↓
API Available
      ↓
Authentication Works
      ↓
Database Connection Works
      ↓
Core API Works
      ↓
Result Import Service Works
      ↓
Monitoring Healthy
```

---

# 51. Production Access

Production infrastructure access should be restricted.

Only authorized personnel should have access to:

- production servers
- database administration
- deployment configuration
- secrets
- object storage
- monitoring systems

---

# 52. Least Privilege

Infrastructure permissions should follow least privilege.

Examples:

- application database user should not be a database administrator
- CI/CD should receive only required deployment permissions
- developers should not automatically receive unrestricted production access

---

# 53. Security Headers

The web infrastructure should support appropriate security headers.

Potential headers include:

- Content-Security-Policy
- X-Content-Type-Options
- Referrer-Policy
- Strict-Transport-Security
- appropriate frame protections

The final policy must be tested against frontend functionality.

---

# 54. CORS Infrastructure Considerations

CORS should match the actual production frontend origin.

It must not be configured as unrestricted:

```text
*
```

for authenticated production APIs unless there is a specific, reviewed reason.

---

# 55. Time and Timezone

Infrastructure should use a consistent server-side time strategy.

The application should preferably use:

```text
UTC
```

as the backend/database source of truth for timestamps.

User-facing dates and times may be converted to the appropriate user or institutional timezone.

---

# 56. System Clock

Production infrastructure should use synchronized system time.

Accurate time is important for:

- authentication
- audit events
- imports
- processing jobs
- timestamps
- security logs

---

# 57. Infrastructure Scaling

The initial architecture should support vertical scaling first.

Possible future scaling:

```text
Single Application
      ↓
Larger Application Instance
      ↓
Multiple Application Instances
      ↓
Load Balancer
```

Scaling should be introduced based on actual workload.

---

# 58. Stateless Backend

The backend should remain as stateless as practical.

Persistent state should reside in:

- MySQL
- durable file/object storage
- appropriate external infrastructure

This makes future horizontal scaling easier.

---

# 59. Session and Authentication Infrastructure

Authentication state must be designed so that multiple backend instances can operate consistently.

The final authentication implementation must account for:

- token/session storage
- expiration
- revocation
- refresh mechanisms where applicable
- secure cookies or token handling

The infrastructure must not rely on a single server's local memory for critical authentication state unless the architecture explicitly supports it.

---

# 60. Production File Storage

Uploaded result files should not depend on local container storage in production.

Preferred:

```text
Backend Container
      ↓
Object Storage
```

This allows containers to be replaced without losing uploaded files.

---

# 61. Development vs Production Storage

Development:

```text
Local Filesystem
```

Production:

```text
Durable Object Storage
```

The application should abstract file-storage operations sufficiently to support both environments.

---

# 62. Infrastructure Documentation

Infrastructure configuration should be documented in:

```text
docs/
├── deployment/
├── architecture/
└── security/
```

Deployment procedures should remain reproducible by an authorized developer/operator.

---

# 63. Infrastructure Non-Goals

The MVP will not require:

- Kubernetes
- service mesh
- multi-region deployment
- complex autoscaling
- microservice infrastructure
- distributed tracing platform
- dedicated data warehouse
- multi-cloud deployment

These may be considered only when justified by actual product requirements.

---

# 64. Initial Production Architecture

A practical MVP deployment may look like:

```text
                    Internet
                       │
                       ▼
                 DNS / HTTPS
                       │
                       ▼
                    Nginx
                  ┌────┴────┐
                  │         │
                  ▼         ▼
             React App   Spring Boot
                            │
                     ┌──────┴──────┐
                     │             │
                     ▼             ▼
                   MySQL       Object Storage
```

CI/CD:

```text
GitHub
   ↓
GitHub Actions
   ↓
Build + Test
   ↓
Docker Image
   ↓
Deployment Platform
   ↓
Production
```

---

# 65. Infrastructure Technology Decision

The selected infrastructure approach is:

```text
Docker
+
Docker Compose
+
Nginx
+
GitHub
+
GitHub Actions
+
MySQL
+
HTTPS/TLS
+
Cloud Hosting
+
Durable File/Object Storage
+
Monitoring
+
Automated Backups
```

The exact cloud provider and production storage provider remain deployment decisions rather than application architecture constraints.

---

# 66. Definition of Done

The infrastructure technology stack is sufficiently defined when:

- development environment is defined
- preview/staging environment is defined
- production environment is defined
- Docker strategy is documented
- frontend deployment model is documented
- backend deployment model is documented
- reverse proxy strategy is documented
- HTTPS requirement is defined
- DNS requirements are defined
- database hosting requirements are defined
- file-storage strategy is defined
- secret-management requirements are defined
- CI/CD strategy is defined
- health checks are defined
- monitoring requirements are defined
- logging requirements are defined
- backup requirements are defined
- disaster-recovery expectations are defined
- rollback requirements are defined
- production access controls are defined
- scaling principles are defined
- infrastructure non-goals are documented

---

# 67. Final Principle

> **Acadlytic infrastructure should provide a secure, reproducible, observable, and recoverable environment for the application while keeping the MVP operationally simple.**

The infrastructure should support reliable academic data processing without introducing unnecessary cloud complexity before actual scale requires it.