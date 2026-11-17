# Preview Deployment

## Purpose
Provide a safe environment for development review and stakeholder testing.

## Requirements
- Separate database
- Non-production secrets
- Test object storage
- Test email provider
- Seed/test data clearly marked
- Logging enabled

## Preview Checks
- Authentication
- Tenant isolation
- Student CRUD
- Result import
- Backlog processing
- Passport
- Analytics
- Responsive UI

# Acadlytic — Preview Deployment

**Document:** `13-deployment/preview.md`  
**Project:** Acadlytic — The Academic Intelligence Platform for University-Affiliated Colleges  
**Status:** Draft / Under Review  
**Purpose:** Define the process for deploying Acadlytic to a preview/staging environment before production release.

---

# 1. Purpose

The preview environment provides a production-like environment where the complete Acadlytic application can be verified before production deployment.

Preview deployment exists to validate:

- application integration
- frontend/backend connectivity
- database migrations
- authentication
- authorization
- tenant isolation
- result import
- result validation
- result processing
- backlog lifecycle
- Academic Passport
- analytics
- Student Portal
- file processing
- security configuration
- performance
- deployment configuration
- production-like infrastructure behavior

Preview deployment is not a substitute for development testing.

It is the final controlled environment before production release.

---

# 2. Preview Environment Objectives

The preview environment should answer:

> Does the current release candidate behave correctly in a production-like environment?

The environment should verify:

1. Application starts correctly.
2. Frontend communicates with backend.
3. Backend connects to the database.
4. Database migrations execute correctly.
5. Authentication works.
6. Authorization works.
7. Tenant isolation works.
8. Academic workflows work end-to-end.
9. Background jobs work.
10. File uploads work.
11. APIs return expected responses.
12. Frontend routes work.
13. Security controls remain active.
14. Logs and monitoring provide useful information.
15. The application can be promoted to production safely.

---

# 3. Environment Model

Acadlytic should maintain separate environments.

Recommended model:

```text
Development
    ↓
Preview / Staging
    ↓
Production
```

## Development

Used for:

- active implementation
- local debugging
- unit testing
- local integration testing

## Preview

Used for:

- release candidate validation
- integration testing
- QA
- security verification
- production-like testing

## Production

Used for:

- real users
- real academic data
- production operations

---

# 4. Environment Isolation

Preview and production must remain separate.

Verify:

- separate database
- separate credentials
- separate secrets
- separate storage
- separate environment variables
- separate authentication configuration where appropriate
- separate external integration configuration
- separate monitoring context

Preview must never accidentally connect to the production database.

---

# 5. Preview Architecture

Recommended deployment structure:

```text
                    Internet
                       |
                    HTTPS
                       |
                Reverse Proxy
                       |
          +------------+------------+
          |                         |
       Frontend                  Backend
       React                     Spring Boot
          |                         |
          |                    MySQL Database
          |                         |
          +-------------------------+
                       |
                Background Jobs
```

Optional infrastructure components may include:

- object/file storage
- email provider
- monitoring
- centralized logging
- cache
- CI/CD system

These should be added only when required by the approved architecture.

---

# 6. Preview Infrastructure

The exact hosting provider may be selected separately.

The deployment should provide:

- Linux-compatible runtime
- Java 21
- Node.js build environment
- MySQL-compatible database
- HTTPS
- persistent database storage
- application logs
- environment variables/secrets
- automated or controlled deployment
- backup capability
- sufficient storage for result files

---

# 7. Containerization

Docker may be used to make preview deployment reproducible.

Recommended conceptual structure:

```text
docker/
├── backend/
├── frontend/
└── database/
```

The exact production container architecture should be finalized separately.

Container images should:

- use supported base images
- avoid unnecessary packages
- run as non-root where practical
- contain no secrets
- expose only required ports
- use environment configuration
- have predictable startup behavior

---

# 8. Frontend Preview Build

The frontend should be built using the production-equivalent build process.

Typical flow:

```text
Install dependencies
        ↓
Type checking
        ↓
Linting
        ↓
Tests
        ↓
Production build
        ↓
Static assets
        ↓
Deploy
```

The frontend must use the preview backend API URL.

It must not contain:

- localhost API URLs
- development credentials
- debug configuration
- test secrets
- production credentials

---

# 9. Backend Preview Build

Backend deployment should follow:

```text
Checkout release candidate
        ↓
Install dependencies
        ↓
Compile
        ↓
Run tests
        ↓
Package
        ↓
Build application image/package
        ↓
Deploy
        ↓
Run health checks
```

The backend must use:

- Java 21
- preview Spring profile
- preview database
- preview secrets
- preview storage
- preview external services

---

# 10. Spring Profiles

Recommended profiles:

```text
application.yml
application-dev.yml
application-preview.yml
application-prod.yml
```

Preview configuration should not inherit unsafe development defaults.

Verify:

- database URL
- database credentials
- API configuration
- CORS
- file storage
- logging
- security settings
- external services
- job configuration

---

# 11. Secrets Management

Secrets must not be committed to Git.

Examples:

- database password
- JWT/session secrets
- encryption keys
- email credentials
- storage credentials
- external API secrets
- Stripe secrets if later enabled
- university integration credentials

Secrets should be supplied through the deployment platform's secure configuration system.

---

# 12. Database Provisioning

Before application deployment:

1. Create preview database.
2. Configure database credentials.
3. Verify network connectivity.
4. Run migrations.
5. Verify schema.
6. Create required reference/master data.
7. Create controlled test data.
8. Verify indexes and constraints.

The preview database should not contain production personal data unless an explicitly approved sanitized-data process exists.

---

# 13. Database Migration Process

Recommended flow:

```text
Migration Files
      ↓
Automated Validation
      ↓
Preview Database
      ↓
Migration Execution
      ↓
Schema Verification
      ↓
Application Startup
      ↓
Integration Tests
```

Before production promotion:

- [ ] All migrations execute successfully.
- [ ] Existing migration history is consistent.
- [ ] Constraints are correct.
- [ ] Indexes are correct.
- [ ] No destructive operation is unexpected.
- [ ] Migration execution time is acceptable.
- [ ] Rollback/recovery strategy is understood.

---

# 14. Preview Data Strategy

Preview data should represent realistic workflows without using unnecessary real personal data.

Recommended test dataset includes:

### Colleges

- multiple colleges
- active college
- inactive/suspended college

### Users

- SUPER_ADMIN
- COLLEGE_ADMIN
- ACADEMIC_STAFF
- STUDENT

### Academic Structure

- university
- courses
- semesters
- subjects
- credits

### Students

- multiple students
- different semesters
- different academic statuses
- multiple result histories

### Results

- passed subjects
- failed subjects
- repeated attempts
- supplementary attempts
- missing values
- validation errors
- duplicate records

### Backlogs

- open backlog
- resolved backlog
- multiple attempts

---

# 15. Tenant Isolation Test Data

Preview must include at least two separate colleges.

Example:

```text
College A
 ├── Admin A
 ├── Staff A
 └── Students A

College B
 ├── Admin B
 ├── Staff B
 └── Students B
```

Tests must verify:

```text
Admin A → College A       ALLOWED
Admin A → College B       DENIED

Staff A → Student A       ALLOWED
Staff A → Student B       DENIED

Student A → Own Passport  ALLOWED
Student A → Student B     DENIED
```

This is a release-critical security test.

---

# 16. Deployment Order

Recommended deployment sequence:

```text
1. Infrastructure
       ↓
2. Database
       ↓
3. Database migrations
       ↓
4. Backend
       ↓
5. Background jobs
       ↓
6. Frontend
       ↓
7. Health checks
       ↓
8. Smoke tests
       ↓
9. Integration tests
       ↓
10. QA
```

The exact order may vary depending on infrastructure.

---

# 17. Backend Health Check

The backend should expose an appropriate health endpoint.

Example:

```text
GET /actuator/health
```

The exact endpoint and exposure configuration should follow the final security configuration.

Health checks should verify application availability and, where appropriate, critical dependencies.

Sensitive infrastructure details must not be exposed publicly.

---

# 18. Frontend Health Check

Verify:

- application loads
- static assets load
- JavaScript bundles load
- CSS loads
- routing works
- API base URL is correct
- authentication redirects work
- protected routes behave correctly

---

# 19. API Connectivity Verification

After deployment:

```text
Frontend
   ↓
HTTPS
   ↓
Backend API
   ↓
Authentication
   ↓
Database
```

Verify:

- API URL
- CORS
- authentication
- authorization
- request headers
- error handling
- response format
- API version

---

# 20. Authentication Smoke Test

Test:

- [ ] Login succeeds with valid credentials.
- [ ] Invalid credentials fail.
- [ ] Logout works.
- [ ] Current-user endpoint works.
- [ ] Protected route requires authentication.
- [ ] Inactive user cannot authenticate where required.
- [ ] Password change works.
- [ ] Unauthorized access is rejected.

---

# 21. College Management Smoke Test

As `SUPER_ADMIN`:

- [ ] Create college.
- [ ] View college.
- [ ] Update college.
- [ ] Change college status.
- [ ] Assign College Admin where supported.

As `COLLEGE_ADMIN`:

- [ ] View own college.
- [ ] Update permitted information.
- [ ] Cannot access another college.
- [ ] Cannot perform SUPER_ADMIN-only operations.

---

# 22. Academic Structure Smoke Test

Verify:

```text
University
    ↓
College
    ↓
Course / Program
    ↓
Semester
    ↓
Subject
```

Test:

- [ ] Course creation.
- [ ] Semester creation.
- [ ] Subject creation.
- [ ] Ordering.
- [ ] Credits.
- [ ] Subject code uniqueness.
- [ ] Tenant ownership.
- [ ] Invalid references rejected.

---

# 23. Student Management Smoke Test

Verify:

- [ ] Create student.
- [ ] Search student.
- [ ] View student.
- [ ] Update permitted fields.
- [ ] Change student status.
- [ ] Duplicate official identifier rejected.
- [ ] Course association validated.
- [ ] Cross-tenant access rejected.
- [ ] Student `/me` access returns correct student.

---

# 24. Result Import Smoke Test

Test the complete flow:

```text
Upload File
    ↓
Import Created
    ↓
Parsing
    ↓
Normalization
    ↓
Validation
    ↓
Preview
```

Verify:

- [ ] Valid Excel file accepted.
- [ ] Valid CSV accepted.
- [ ] Invalid file rejected.
- [ ] Oversized file rejected.
- [ ] Malformed file handled safely.
- [ ] Unknown student flagged.
- [ ] Unknown subject flagged.
- [ ] Duplicate records detected.
- [ ] Import status updates correctly.
- [ ] Errors are visible.

---

# 25. Result Validation Smoke Test

Verify:

- [ ] Validation can be started.
- [ ] Required-field errors detected.
- [ ] Student identity errors detected.
- [ ] Subject identity errors detected.
- [ ] Academic-context errors detected.
- [ ] Result-value errors detected.
- [ ] Attempt errors detected.
- [ ] Duplicate errors detected.
- [ ] Warnings are distinguishable.
- [ ] Valid records become eligible for processing.
- [ ] Invalid records cannot be processed.

---

# 26. Result Processing Smoke Test

This is a release-critical workflow.

Test:

```text
Validated Result
       ↓
Process
       ↓
Authoritative Result
       ↓
Backlog Update
       ↓
Academic Calculation
       ↓
Passport
       ↓
Analytics
```

Verify:

- [ ] Eligible records process.
- [ ] Invalid records cannot process.
- [ ] Processing is transactional.
- [ ] Duplicate processing is safe.
- [ ] Attempts are preserved.
- [ ] Backlog state is correct.
- [ ] SGPA/CGPA is correct according to approved rules.
- [ ] Passport reflects the result.
- [ ] Analytics reflects the result.

---

# 27. Backlog Smoke Test

Test:

### Failed attempt

```text
Result = Fail
      ↓
Backlog = OPEN
```

### Later pass

```text
Result = Pass
      ↓
Backlog = RESOLVED
```

Verify:

- [ ] First failure preserved.
- [ ] Attempts preserved.
- [ ] Resolution result recorded.
- [ ] Existing backlog is not duplicated.
- [ ] Tenant isolation works.

---

# 28. Academic Passport Smoke Test

Verify:

- [ ] Student profile appears.
- [ ] Program appears.
- [ ] Semester history appears.
- [ ] Subject results appear.
- [ ] Attempts appear.
- [ ] SGPA appears correctly.
- [ ] CGPA appears correctly.
- [ ] Credits appear correctly.
- [ ] Backlog summary appears.
- [ ] Unauthorized students cannot access another Passport.

---

# 29. Analytics Smoke Test

Verify:

- [ ] Dashboard loads.
- [ ] Student analytics loads.
- [ ] Course analytics loads.
- [ ] Semester analytics loads.
- [ ] Subject analytics loads.
- [ ] Backlog analytics loads.
- [ ] Filters work.
- [ ] Metrics are correct.
- [ ] Missing data is not treated as zero.
- [ ] Duplicate attempts are not double-counted.
- [ ] Tenant filtering works.

---

# 30. Student Portal Smoke Test

As a student:

- [ ] Login.
- [ ] Dashboard.
- [ ] Academic Passport.
- [ ] Results.
- [ ] Backlogs.
- [ ] Analytics.
- [ ] Profile.
- [ ] Settings.
- [ ] Password change.
- [ ] Logout.

Verify that the student cannot:

- modify authoritative results
- access another student's data
- access administration pages
- access another college's data

---

# 31. File Storage Verification

Verify:

- [ ] Uploaded result files are stored safely.
- [ ] File paths are not predictable through user input.
- [ ] Unauthorized users cannot download files.
- [ ] Temporary files are cleaned up.
- [ ] Failed imports do not leave uncontrolled files.
- [ ] Storage configuration is preview-specific.

---

# 32. Background Job Verification

If result processing uses background jobs:

- [ ] Job starts.
- [ ] Job status updates.
- [ ] Job failure is recorded.
- [ ] Job retry works safely.
- [ ] Duplicate job execution is handled.
- [ ] Tenant context is preserved.
- [ ] Job logs contain correlation information.
- [ ] Users receive meaningful processing status.

---

# 33. Security Verification

Preview must include security verification for:

### Authentication

- invalid credentials
- session/token handling
- logout
- inactive users

### Authorization

- role restrictions
- direct API access
- administrative endpoints

### Tenant Isolation

- cross-college access
- manipulated IDs
- analytics filters
- student access

### Input Security

- malformed requests
- invalid IDs
- unexpected fields
- malicious strings

### File Security

- invalid extensions
- oversized files
- malformed spreadsheets
- suspicious file names

---

# 34. IDOR Verification

Explicitly test:

```text
GET /api/v1/students/{anotherStudentId}
```

with an unauthorized student or staff member.

Expected result:

```text
403 Forbidden
```

or:

```text
404 Not Found
```

depending on the approved information-disclosure policy.

The application must not return unauthorized data.

---

# 35. Security Headers

Preview should verify appropriate security headers.

Depending on deployment architecture, verify:

- HTTPS enforcement
- Content Security Policy where appropriate
- X-Content-Type-Options
- Referrer-Policy
- frame protection
- secure cookie configuration where applicable

Exact header configuration should follow the final security design.

---

# 36. CORS Verification

Verify:

- [ ] Only approved frontend origins are allowed.
- [ ] Wildcard origins are not used unnecessarily.
- [ ] Credentials configuration is correct.
- [ ] Development origins are not accidentally enabled in preview.
- [ ] Preflight requests behave correctly.

---

# 37. Error Handling Verification

Test:

- invalid request
- unauthorized request
- forbidden request
- missing resource
- duplicate resource
- validation failure
- server failure
- database failure
- file parsing failure
- background job failure

Verify:

- user receives understandable error
- API returns consistent error format
- sensitive information is not exposed
- server logs contain diagnostic information

---

# 38. Performance Verification

Preview should be tested with realistic data volume.

At minimum consider:

```text
1,000 students
10,000 result records
50,000 result records
100,000+ result records
```

Where realistic for the MVP.

Verify:

- import processing time
- validation processing time
- database query performance
- analytics performance
- dashboard load time
- Passport load time
- large-table behavior
- frontend rendering

Actual performance thresholds should be finalized before production release.

---

# 39. Browser Verification

At minimum verify supported modern browsers.

Recommended:

- Chrome
- Edge
- Firefox
- Safari where applicable

Verify:

- authentication
- navigation
- forms
- tables
- charts
- file uploads
- responsive layout
- dialogs/drawers
- error states

---

# 40. Responsive Verification

Test:

```text
Mobile
320px
375px
430px

Tablet
768px
1024px

Desktop
1280px
1440px
1920px
```

Check:

- navigation
- dashboard
- tables
- forms
- result import
- validation
- Passport
- analytics
- student portal

No critical workflow should become unusable on supported screen sizes.

---

# 41. Accessibility Verification

Preview QA should verify:

- keyboard navigation
- visible focus
- form labels
- accessible buttons
- dialog focus
- table semantics
- error announcements
- ARIA state correctness
- color-independent status
- chart accessibility
- reduced-motion behavior

---

# 42. Logging Verification

After deployment verify:

- startup logs
- API request logs
- authentication events
- processing logs
- import failures
- background job logs
- database errors
- security events

Logs must not contain:

- passwords
- secrets
- tokens
- unnecessary sensitive personal data

---

# 43. Monitoring Verification

Verify that preview provides sufficient visibility for:

- application availability
- backend errors
- database connectivity
- job failures
- failed result processing
- file-processing failures
- authentication failures
- unusual error rates

Monitoring thresholds should be finalized before production.

---

# 44. Backup and Recovery Verification

Preview should verify the intended backup/recovery process where applicable.

Test:

- database backup
- database restore
- migration recovery
- file-storage recovery
- configuration recovery

A backup is not considered reliable until restoration has been tested.

---

# 45. Deployment Failure Handling

If deployment fails:

1. Stop promotion.
2. Inspect deployment logs.
3. Identify failure stage.
4. Preserve diagnostic information.
5. Do not manually modify production.
6. Fix the release candidate.
7. Redeploy preview.
8. Repeat smoke tests.

Do not bypass deployment gates simply to achieve a successful deployment.

---

# 46. Rollback Strategy

Preview deployment should validate the production rollback approach.

Possible rollback levels:

```text
Application rollback
Database rollback/recovery
Configuration rollback
Frontend rollback
Infrastructure rollback
```

Database rollback requires particular care because academic migrations may be destructive.

Prefer forward-safe migration strategies where possible.

---

# 47. Release Candidate Process

Recommended flow:

```text
Feature Development
       ↓
Code Review
       ↓
Automated Tests
       ↓
Merge
       ↓
Release Candidate
       ↓
Preview Deployment
       ↓
Smoke Tests
       ↓
Integration Tests
       ↓
Security Review
       ↓
QA
       ↓
Release Approval
```

Only an approved release candidate should move toward production.

---

# 48. Preview QA Checklist

## Infrastructure

- [ ] HTTPS works.
- [ ] DNS works.
- [ ] Backend is reachable.
- [ ] Frontend is reachable.
- [ ] Database is reachable.
- [ ] Storage works.
- [ ] Background jobs work.

## Application

- [ ] Frontend builds.
- [ ] Backend starts.
- [ ] API works.
- [ ] Authentication works.
- [ ] Authorization works.
- [ ] Tenant isolation works.

## Academic Workflow

- [ ] College works.
- [ ] Academic structure works.
- [ ] Student management works.
- [ ] Result import works.
- [ ] Validation works.
- [ ] Processing works.
- [ ] Backlog works.
- [ ] Passport works.
- [ ] Analytics works.
- [ ] Student Portal works.

## Quality

- [ ] Tests pass.
- [ ] Security checks pass.
- [ ] Responsive checks pass.
- [ ] Accessibility checks pass.
- [ ] Performance is acceptable.
- [ ] No critical bugs remain.

---

# 49. Release Blocking Conditions

Preview release must not be approved when:

- authentication is broken
- authorization is broken
- tenant isolation is broken
- academic data can be corrupted
- result processing is incorrect
- duplicate processing creates duplicate authoritative records
- critical migration fails
- critical security vulnerability remains
- production configuration is uncertain
- backup/recovery is unavailable where required
- critical E2E workflows fail
- unresolved S1/S2 bugs remain without explicit approval

---

# 50. Academic Data Release Gate

Before production promotion:

```text
Result Import
     ↓
Validation
     ↓
Processing
     ↓
Backlog
     ↓
Calculations
     ↓
Passport
     ↓
Analytics
```

The complete chain must be verified.

A system is not ready merely because individual pages work.

---

# 51. Preview Sign-Off

Recommended sign-off areas:

| Area | Owner | Status |
|---|---|---|
| Backend | TBD | Pending |
| Frontend | TBD | Pending |
| Database | TBD | Pending |
| Security | TBD | Pending |
| QA | TBD | Pending |
| Academic Data Integrity | TBD | Pending |
| Deployment | TBD | Pending |
| Product | TBD | Pending |

Final approval should be recorded before production deployment.

---

# 52. Preview Environment Security Rules

The preview environment must:

- never contain production credentials
- never connect to production databases accidentally
- never expose secrets in frontend bundles
- never expose unrestricted admin endpoints
- never use production personal data without approval
- maintain tenant isolation
- use HTTPS
- use secure configuration
- maintain appropriate logging
- protect uploaded files

---

# 53. CI/CD Integration

Recommended pipeline:

```text
Push / Pull Request
        ↓
Build
        ↓
Unit Tests
        ↓
Integration Tests
        ↓
Static Analysis
        ↓
Security Checks
        ↓
Build Artifacts
        ↓
Preview Deployment
        ↓
Smoke Tests
        ↓
QA
        ↓
Release Approval
```

Production deployment should require an explicit promotion step unless a later approved automation policy states otherwise.

---

# 54. Deployment Evidence

A preview release should produce evidence such as:

- build identifier
- Git commit SHA
- deployment timestamp
- migration version
- test results
- security scan results
- smoke-test results
- known issues
- QA status
- approval status

This provides traceability between source code and deployed behavior.

---

# 55. Release Candidate Identification

Each preview release should be identifiable by:

```text
Application Version
Git Commit
Build Number
Deployment Timestamp
Database Migration Version
```

Example:

```text
Acadlytic Preview
Version: 0.x.x
Commit: <commit-sha>
Build: <build-number>
Migration: <migration-version>
```

---

# 56. Post-Deployment Verification

Immediately after deployment:

1. Open application.
2. Verify frontend loads.
3. Verify backend health.
4. Verify database connectivity.
5. Login as test users.
6. Verify role-specific navigation.
7. Run critical academic workflow.
8. Verify logs.
9. Verify background jobs.
10. Verify monitoring.

Only after these checks should full QA begin.

---

# 57. Preview-to-Production Promotion Criteria

A release candidate may be promoted when:

- [ ] Preview deployment succeeded.
- [ ] Database migration succeeded.
- [ ] Smoke tests passed.
- [ ] Integration tests passed.
- [ ] Security review passed.
- [ ] Critical academic workflow passed.
- [ ] Tenant isolation passed.
- [ ] Critical bugs are resolved.
- [ ] No release-blocking findings remain.
- [ ] QA sign-off is complete.
- [ ] Deployment evidence is recorded.
- [ ] Rollback strategy is understood.

---

# 58. Incident During Preview

If a serious issue is discovered:

```text
Issue Detected
      ↓
Classify Severity
      ↓
Stop Promotion
      ↓
Create Bug
      ↓
Investigate Root Cause
      ↓
Fix
      ↓
Code Review
      ↓
Redeploy Preview
      ↓
Regression Test
      ↓
Re-approve
```

Do not promote a release containing an unresolved critical issue merely because the issue is reproducible only in preview.

---

# 59. AI-Assisted Deployment Rules

AI-generated deployment configuration must be manually reviewed.

AI must not independently decide:

- production credentials
- database credentials
- firewall rules
- security exceptions
- CORS exceptions
- authentication secrets
- backup policies
- destructive migration behavior

AI may assist with:

- deployment scripts
- Docker configuration
- CI configuration
- health checks
- documentation
- troubleshooting

All generated infrastructure changes require human review.

---

# 60. Definition of Done

Preview deployment is complete when:

- [ ] Release candidate deployed successfully.
- [ ] Correct frontend build deployed.
- [ ] Correct backend build deployed.
- [ ] Correct database version deployed.
- [ ] Environment variables verified.
- [ ] Secrets verified.
- [ ] HTTPS verified.
- [ ] Authentication verified.
- [ ] Authorization verified.
- [ ] Tenant isolation verified.
- [ ] Academic workflow verified.
- [ ] Background jobs verified.
- [ ] File processing verified.
- [ ] Analytics verified.
- [ ] Student Portal verified.
- [ ] Security checks completed.
- [ ] Performance is acceptable.
- [ ] Accessibility and responsive checks completed.
- [ ] Critical bugs resolved.
- [ ] QA sign-off completed.
- [ ] Production promotion decision recorded.

---

# 61. Unresolved Decisions

The following deployment decisions remain subject to final infrastructure selection:

1. Cloud provider.
2. Frontend hosting provider.
3. Backend hosting provider.
4. Database hosting provider.
5. Object/file storage provider.
6. Reverse proxy architecture.
7. Container orchestration approach.
8. CI/CD provider configuration.
9. Monitoring platform.
10. Centralized logging platform.
11. Backup frequency.
12. Database retention policy.
13. Disaster-recovery strategy.
14. Deployment rollback mechanism.
15. Preview environment lifecycle.
16. Preview data refresh strategy.
17. Production promotion approval model.
18. Exact performance thresholds.
19. Exact uptime targets.
20. Cost limits for preview infrastructure.

These decisions should be finalized before production deployment.

---

# 62. Relationship With Other Documents

This document depends on and should be used with:

```text
05-architecture/
├── system-architecture.md
├── integration-architecture.md
├── api-architecture.md
└── data-ownership.md

07-project-rules/
├── coding-rules.md
├── backend-rules.md
├── frontend-rules.md
├── database-rules.md
├── security-rules.md
└── ai-coding-rules.md

10-testing/
├── test-strategy.md
├── test-cases.md
└── bug-tracking.md

11-security/
└── security-review.md

12-code-review/
└── review-checklist.md
```

Deployment should happen only after the implementation has passed the applicable review, testing, and security gates.

---

# 63. Final Principle

Preview deployment is not simply putting the application on a server.

It is the controlled verification that:

```text
Code
 ↓
Build
 ↓
Infrastructure
 ↓
Database
 ↓
Application
 ↓
Security
 ↓
Academic Workflow
 ↓
User Experience
 ↓
Operational Reliability
```

all work together correctly.

For Acadlytic, the most important deployment principle is:

> **Never promote an application merely because it starts successfully. Promote it only when the complete academic workflow, security boundaries, data integrity, and operational behavior have been verified in a production-like environment.**

---

## Document Status

**Status:** Draft / Under Review

This document should be finalized after the hosting architecture, CI/CD strategy, monitoring, backup, recovery, and production deployment model are approved.