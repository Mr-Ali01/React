# Production Deployment

## Production Components
- Frontend
- Spring Boot backend
- PostgreSQL
- Redis where required
- Object storage
- Reverse proxy
- Monitoring/logging
- Backup system

## Production Requirements
- HTTPS
- Secure secrets
- Database backups
- Migration process
- Error monitoring
- Audit logging
- Health checks
- Resource monitoring

## Deployment Strategy
1. Build
2. Run tests
3. Build container
4. Deploy to staging/preview
5. Run smoke tests
6. Approve
7. Apply database migrations safely
8. Deploy production
9. Verify health
10. Monitor


<!-- =================================================== -->
# Acadlytic — Production Deployment

**Document:** `13-deployment/production.md`  
**Project:** Acadlytic — The Academic Intelligence Platform for University-Affiliated Colleges  
**Status:** Draft / Under Review  
**Purpose:** Define the controlled process for promoting Acadlytic from an approved release candidate to production.

---

# 1. Purpose

Production deployment is the controlled transition of an approved Acadlytic release into the live environment.

Production deployment must protect:

- student academic data
- tenant isolation
- authentication and authorization
- academic result integrity
- historical result attempts
- backlog state
- Academic Passport consistency
- analytics correctness
- system availability
- secrets and infrastructure
- operational reliability

Production deployment must never be treated as a simple copy of the preview environment.

---

# 2. Production Deployment Principle

The primary principle is:

> **Only a reviewed, tested, security-approved, and operationally verified release candidate may be deployed to production.**

The production environment must never be used as the first place to discover whether a feature works.

---

# 3. Production Environment

Recommended production architecture:

```text id="0p8kzq"
                         Internet
                            |
                         HTTPS
                            |
                    DNS / Reverse Proxy
                            |
              +-------------+-------------+
              |                           |
          React Frontend             Spring Boot API
              |                           |
              |                    Application Services
              |                           |
              |                       MySQL
              |                           |
              +---------------------------+
                            |
                     Background Jobs
                            |
                 File/Object Storage
                            |
              Monitoring / Logging / Alerts
```

Additional services may be introduced only when required by the approved architecture.

---

# 4. Production Environment Isolation

Production must remain isolated from development and preview environments.

Production must have:

- production database
- production credentials
- production secrets
- production storage
- production monitoring
- production domain
- production API configuration
- production authentication configuration

Development and preview credentials must never provide access to production resources.

---

# 5. Production Deployment Preconditions

Before deployment, confirm:

- [ ] Release candidate exists.
- [ ] Code review completed.
- [ ] Automated tests pass.
- [ ] Integration tests pass.
- [ ] Security review completed.
- [ ] Preview deployment completed.
- [ ] Preview QA completed.
- [ ] Critical academic workflow verified.
- [ ] Tenant isolation verified.
- [ ] Critical bugs resolved.
- [ ] Database migration reviewed.
- [ ] Backup strategy verified.
- [ ] Rollback strategy documented.
- [ ] Deployment owner identified.
- [ ] Release notes prepared.
- [ ] Monitoring available.

---

# 6. Release Candidate

The production deployment must reference an immutable release candidate.

Recommended identifiers:

```text id="7v6q3d"
Version
Git Commit SHA
Build Number
Database Migration Version
Container/Image Version
```

Do not deploy an untracked local build directly to production.

---

# 7. Production Configuration

Production configuration must be environment-specific.

Typical configuration includes:

- database URL
- database credentials
- application secrets
- authentication configuration
- file storage
- email configuration
- allowed frontend origin
- logging configuration
- job configuration
- monitoring configuration

Configuration must be injected securely.

---

# 8. Secrets Management

Production secrets must never be:

- committed to Git
- included in source code
- included in Docker images
- printed in logs
- included in frontend bundles
- shared through chat messages
- stored in plain-text documentation

Examples:

- database passwords
- session/token signing secrets
- encryption keys
- storage credentials
- email credentials
- external API credentials

Secret rotation procedures should be defined before production launch.

---

# 9. Production Database

The production database is the authoritative persistent store for Acadlytic.

Before deployment:

- [ ] Database is available.
- [ ] Credentials are verified.
- [ ] Connectivity is verified.
- [ ] Backups are configured.
- [ ] Backup restoration has been tested.
- [ ] Database version is known.
- [ ] Required indexes exist.
- [ ] Migration status is known.
- [ ] Monitoring is available.

---

# 10. Database Migration Principle

Database migrations require elevated caution because academic data is persistent and historically important.

Never execute an unreviewed migration against production.

Before migration:

1. Review migration.
2. Test against preview data.
3. Evaluate production data impact.
4. Verify backup.
5. Estimate migration duration.
6. Identify locking risk.
7. Confirm rollback/recovery strategy.
8. Obtain required approval.

---

# 11. Migration Safety

Prefer migration strategies that are:

- incremental
- backward-compatible where practical
- observable
- reversible where practical
- safe for existing records

Avoid migrations that:

- silently delete academic history
- unexpectedly overwrite values
- remove required columns without migration planning
- create large table locks without evaluation
- change academic semantics without approval

---

# 12. Production Data Protection

Production academic data must be treated as critical information.

The deployment process must ensure:

- no accidental data deletion
- no unauthorized access
- no cross-tenant exposure
- no destructive migration
- no uncontrolled import
- no accidental test data insertion

Development test data must never be inserted into production without explicit approval.

---

# 13. Backup Before Deployment

Before a release containing database changes:

```text id="whx2tv"
Verify Backup Configuration
        ↓
Create/Verify Current Backup
        ↓
Verify Backup Availability
        ↓
Confirm Restore Procedure
        ↓
Begin Deployment
```

A backup should be considered useful only if the restoration process is known and tested.

---

# 14. Deployment Window

Production deployments should use a controlled deployment window when operationally appropriate.

Before starting:

- identify deployment owner
- identify reviewer/approver
- identify support contact
- confirm monitoring
- confirm backup
- confirm rollback plan
- confirm release version
- confirm database migration
- communicate expected impact if any

---

# 15. Deployment Sequence

Recommended production deployment:

```text id="n7szf2"
1. Release Approval
        ↓
2. Production Backup Verification
        ↓
3. Infrastructure Verification
        ↓
4. Database Migration
        ↓
5. Backend Deployment
        ↓
6. Background Job Deployment
        ↓
7. Frontend Deployment
        ↓
8. Health Checks
        ↓
9. Smoke Tests
        ↓
10. Critical Workflow Verification
        ↓
11. Monitoring
        ↓
12. Release Confirmation
```

The exact order may vary depending on the final infrastructure architecture.

---

# 16. Backend Deployment

Backend deployment should use the approved release artifact.

Verify:

- Java 21 runtime
- correct application version
- correct environment profile
- production database configuration
- production secrets
- correct API configuration
- health endpoint
- logging
- background jobs
- resource limits

The backend must not use development configuration.

---

# 17. Frontend Deployment

The frontend must be built from the approved release candidate.

Verify:

- production API URL
- correct domain
- HTTPS
- correct environment configuration
- authentication behavior
- route handling
- static asset loading
- caching strategy

The production frontend must never contain:

```text
localhost
127.0.0.1
development credentials
preview secrets
debug configuration
```

where these are inappropriate for production.

---

# 18. Backend Health Verification

After deployment:

```text id="lhl0vf"
GET /actuator/health
```

or the approved production health endpoint should be verified.

Health checks must not expose sensitive infrastructure information.

Verify:

- application is running
- critical dependencies are available
- database connectivity is healthy
- required services are available

---

# 19. Production Smoke Tests

Immediately after deployment, run a minimal smoke-test suite.

### Application

- [ ] Frontend loads.
- [ ] Backend responds.
- [ ] HTTPS works.
- [ ] Static assets load.

### Authentication

- [ ] Login works.
- [ ] Logout works.
- [ ] Current user works.
- [ ] Protected routes work.

### Authorization

- [ ] Role-based access works.
- [ ] Unauthorized routes are blocked.

### Database

- [ ] Read operations work.
- [ ] Required writes work.

---

# 20. Production Academic Workflow Smoke Test

The most important functional verification is:

```text id="9o0p89"
Student
   ↓
Academic Structure
   ↓
Result Import
   ↓
Validation
   ↓
Processing
   ↓
Backlog
   ↓
Academic Passport
   ↓
Analytics
```

Only use controlled production-safe test operations where appropriate.

Do not upload arbitrary test result files into production merely to prove that the import feature works.

---

# 21. Production Academic Data Gate

Production deployment must not proceed if the release can:

- corrupt result records
- duplicate authoritative results
- lose historical attempts
- incorrectly resolve backlogs
- calculate incorrect SGPA/CGPA
- expose another student's academic data
- expose another college's data
- bypass validation
- bypass authorization

These are release-blocking conditions.

---

# 22. Tenant Isolation Verification

After deployment verify that:

```text id="o4m2i9"
College A
   ↓
Can access College A data
   ↓
Cannot access College B data
```

and:

```text id="52z7jq"
Student A
   ↓
Can access Student A data
   ↓
Cannot access Student B data
```

Test through APIs, not only through the frontend.

---

# 23. Authentication Verification

Verify:

- valid login
- invalid login
- logout
- expired authentication state
- inactive account
- password change
- protected endpoints
- current-user endpoint

Authentication behavior must match the approved security architecture.

---

# 24. Authorization Verification

Test every critical role:

```text id="yygptb"
SUPER_ADMIN
COLLEGE_ADMIN
ACADEMIC_STAFF
STUDENT
```

Verify that each role can perform only its approved operations.

Never assume that hiding a frontend button provides authorization.

---

# 25. IDOR Verification

Production release testing should include controlled identifier manipulation.

Examples:

```text id="l7k3a8"
/students/{studentId}
/colleges/{collegeId}
/result-imports/{importId}
/courses/{courseId}
```

Verify unauthorized resource access is rejected.

This test is especially important after changes to controllers, repositories, or authorization services.

---

# 26. Result Import Production Rules

Production result imports require additional caution.

Before allowing a real import:

- verify correct college
- verify correct academic structure
- verify source file
- verify result release/context
- verify expected column mapping
- verify student matching
- verify subject matching
- preview validation results
- inspect errors and warnings

Never bypass validation simply because the source file is believed to be trustworthy.

---

# 27. Result Validation Production Gate

Before processing:

```text id="z7f3g2"
Import
 ↓
Validation
 ↓
Review
 ↓
Eligible Records
 ↓
Processing
```

Invalid records must not become authoritative academic records.

Warnings must follow the approved processing policy.

---

# 28. Result Processing Production Gate

Before processing real results verify:

- correct import
- correct college
- correct course
- correct semester
- correct result release
- correct student matching
- correct subject matching
- validation status
- duplicate status
- processing eligibility

Processing must remain transactional and idempotent.

---

# 29. Backlog Verification

After result processing verify:

- failed subjects create/open appropriate backlogs
- passing attempts resolve appropriate backlogs
- attempts remain preserved
- no duplicate backlog is created
- unrelated students are unaffected

---

# 30. Academic Passport Verification

After processing, verify the student's Passport reflects:

- latest authoritative results
- historical attempts
- SGPA
- CGPA
- credits
- backlog status

The Passport must not become inconsistent with the authoritative result data.

---

# 31. Analytics Verification

After academic processing verify:

- processed results appear
- metrics are correct
- backlog metrics are correct
- filters are tenant-safe
- duplicate attempts are not double-counted
- missing values are handled correctly

Analytics must never become an independent academic source of truth.

---

# 32. Background Jobs

If production uses asynchronous processing:

Verify:

- job starts
- job status is recorded
- job can fail safely
- retry is controlled
- duplicate execution is safe
- tenant context is preserved
- failures are observable
- jobs do not silently disappear

---

# 33. File Storage

Production file storage must be protected.

Verify:

- uploads are stored outside executable paths
- access requires authorization
- file names are controlled
- temporary files are removed
- storage permissions are restricted
- storage credentials are protected
- files are not publicly accessible unless explicitly intended

---

# 34. Email and Notifications

If enabled, verify:

- production email provider
- sender identity
- credentials
- failure handling
- retry behavior
- rate limits
- sensitive information handling

Do not send preview/test emails to real users accidentally.

---

# 35. Production Monitoring

Monitor:

### Application

- uptime
- response time
- error rate
- memory
- CPU

### Database

- connection health
- slow queries
- CPU
- storage
- locks
- failed connections

### Academic Processing

- import failures
- validation failures
- processing failures
- job failures

### Security

- authentication failures
- authorization failures
- suspicious access patterns

---

# 36. Logging

Production logs should support:

- debugging
- security investigation
- academic processing investigation
- operational troubleshooting

Logs must not contain:

- passwords
- tokens
- secrets
- unnecessary personal data
- complete sensitive academic files

---

# 37. Correlation IDs

Important requests and background operations should be traceable using a correlation/request identifier where appropriate.

Example:

```text id="3xgq5f"
Request
  ↓
Import Job
  ↓
Validation
  ↓
Processing
  ↓
Audit Event
```

A common correlation identifier can make investigation significantly easier.

---

# 38. Production Error Handling

Users should receive safe errors.

Do not expose:

- stack traces
- SQL queries
- database credentials
- internal filesystem paths
- infrastructure details
- secret values

The server should retain sufficient diagnostic information in secure logs.

---

# 39. Production Security Configuration

Verify:

- HTTPS
- secure cookies where applicable
- authentication configuration
- authorization
- CORS
- CSRF strategy
- security headers
- database permissions
- storage permissions
- firewall/network restrictions
- secret management
- dependency security

---

# 40. Database Permissions

The application database account should have only the permissions required by the application.

Avoid using unrestricted database administrator credentials for normal application runtime.

Separate:

- application runtime credentials
- migration credentials
- administrative credentials

where practical.

---

# 41. Infrastructure Security

Production infrastructure should follow least privilege.

Verify:

- only required ports are exposed
- database is not unnecessarily public
- SSH/admin access is restricted
- application containers are isolated appropriately
- secrets are protected
- backups are protected
- storage permissions are restricted

---

# 42. Dependency Security

Before production deployment:

- scan dependencies
- review critical vulnerabilities
- verify approved versions
- remove unnecessary packages
- confirm lock files/build reproducibility

Critical dependency vulnerabilities should block release unless explicitly accepted through a documented risk decision.

---

# 43. Production Performance

Production performance should be monitored after deployment.

Important areas:

- API response times
- dashboard load time
- Passport load time
- analytics queries
- result-import processing
- validation
- result processing
- database queries
- background jobs

Performance targets should be finalized as part of operational requirements.

---

# 44. Deployment Rollback

If deployment causes serious problems:

```text id="y3v0ws"
Detect Incident
      ↓
Assess Severity
      ↓
Stop Further Changes
      ↓
Preserve Evidence
      ↓
Rollback Application if Safe
      ↓
Assess Database State
      ↓
Restore/Recover if Required
      ↓
Verify Data Integrity
      ↓
Run Smoke Tests
      ↓
Communicate Status
```

Never blindly roll back a database migration involving academic data.

---

# 45. Application Rollback

Application rollback may be appropriate when:

- application startup fails
- API behavior is broken
- frontend is broken
- performance severely degrades
- security issue is introduced

Before rollback verify database compatibility.

An older application version may not be compatible with a newer database schema.

---

# 46. Database Recovery

Database recovery requires special handling.

Potential approaches:

- forward fix
- restore from backup
- point-in-time recovery
- migration correction

The selected strategy depends on the type of incident.

Academic data must be preserved whenever possible.

---

# 47. Production Incident Classification

Recommended severity:

### S1 — Critical

Examples:

- academic data corruption
- tenant data exposure
- authentication bypass
- production-wide outage
- critical security compromise

### S2 — High

Examples:

- major feature failure
- significant academic workflow failure
- large user group affected
- severe performance degradation

### S3 — Medium

Examples:

- limited feature issue
- non-critical workflow failure
- localized UI/API issue

### S4 — Low

Examples:

- cosmetic issue
- minor usability issue

---

# 48. Academic Data Incident

If academic data may be incorrect:

1. Stop affected processing.
2. Identify affected tenant(s).
3. Identify affected students/results.
4. Preserve logs and evidence.
5. Determine the root cause.
6. Prevent additional corruption.
7. Verify authoritative records.
8. Restore or correct data through an approved process.
9. Rebuild dependent views if required.
10. Re-run analytics if necessary.
11. Document the incident.
12. Add regression tests.
13. Review release process.

Never silently modify affected academic data.

---

# 49. Data Correction Rules

Production academic data corrections must:

- identify affected records
- identify the reason
- preserve auditability
- preserve history where required
- use controlled scripts/services
- be reviewed
- be tested before execution
- be logged

Direct manual database editing should be avoided for normal academic workflows.

---

# 50. Zero-Downtime Considerations

If high availability is required, deployments should consider:

- backward-compatible API changes
- backward-compatible database migrations
- rolling deployments
- health checks
- connection draining
- frontend/backend compatibility

Zero-downtime deployment is not required if the approved product SLA does not require it.

---

# 51. Maintenance Mode

If maintenance mode is required:

- display clear user messaging
- protect administrative access
- prevent unsafe academic mutations
- communicate expected duration
- verify application after maintenance

Do not allow partial academic processing while a critical maintenance operation is underway unless explicitly designed for it.

---

# 52. Production Release Communication

A production release should record:

- version
- deployment time
- major changes
- database migrations
- known limitations
- monitoring status
- rollback plan
- responsible owner

For significant releases, communicate relevant changes to affected stakeholders.

---

# 53. Release Notes

Recommended release-note structure:

```text id="d0n5lc"
Release
Version:
Date:

Summary

New Features

Bug Fixes

Security Changes

Database Changes

Academic Workflow Changes

Known Issues

Operational Changes

Rollback Notes
```

Release notes must accurately represent the deployed version.

---

# 54. Post-Deployment Observation

After deployment, observe:

- application errors
- API latency
- authentication failures
- database health
- background jobs
- file processing
- result workflows
- monitoring alerts

The observation period should be appropriate to release risk.

High-risk academic-processing releases require closer monitoring.

---

# 55. Production Smoke-Test Checklist

```text id="qgy1ig"
[ ] Frontend loads
[ ] Backend health check passes
[ ] Database connection healthy
[ ] Login works
[ ] Logout works
[ ] Role authorization works
[ ] Tenant isolation works
[ ] Student access works
[ ] College access works
[ ] API errors are safe
[ ] File storage works
[ ] Background jobs work
[ ] Monitoring works
[ ] Logs work
[ ] Critical academic workflow verified
```

---

# 56. Production Release Approval

Recommended approval areas:

| Area | Owner | Status |
|---|---|---|
| Engineering | TBD | Pending |
| Backend | TBD | Pending |
| Frontend | TBD | Pending |
| Database | TBD | Pending |
| Security | TBD | Pending |
| QA | TBD | Pending |
| Academic Data Integrity | TBD | Pending |
| Operations | TBD | Pending |
| Product | TBD | Pending |

The exact approval model should be finalized before production launch.

---

# 57. Production Deployment Checklist

## Before Deployment

- [ ] Release candidate approved.
- [ ] Code review complete.
- [ ] Tests pass.
- [ ] Security review complete.
- [ ] Preview QA complete.
- [ ] Backup verified.
- [ ] Migration reviewed.
- [ ] Rollback plan ready.
- [ ] Monitoring ready.
- [ ] Deployment owner identified.

## During Deployment

- [ ] Correct release artifact deployed.
- [ ] Database migration executed.
- [ ] Backend deployed.
- [ ] Background jobs deployed.
- [ ] Frontend deployed.
- [ ] Health checks pass.

## After Deployment

- [ ] Smoke tests pass.
- [ ] Authentication works.
- [ ] Authorization works.
- [ ] Tenant isolation works.
- [ ] Logs verified.
- [ ] Monitoring verified.
- [ ] Critical academic workflow verified.
- [ ] No release-blocking incident exists.

---

# 58. Production Release Blocking Conditions

Do not release when:

- critical security issue remains
- tenant isolation is uncertain
- authentication is broken
- authorization is broken
- academic data integrity is uncertain
- critical database migration is unsafe
- backup/recovery is unavailable
- critical tests fail
- critical preview bugs remain
- rollback strategy is unknown
- monitoring is unavailable for critical components

---

# 59. Production Definition of Done

A production deployment is complete when:

- [ ] Approved release candidate is deployed.
- [ ] Correct database schema is active.
- [ ] Backend is healthy.
- [ ] Frontend is healthy.
- [ ] Authentication is verified.
- [ ] Authorization is verified.
- [ ] Tenant isolation is verified.
- [ ] Critical academic workflows are verified.
- [ ] File processing is verified.
- [ ] Background jobs are verified.
- [ ] Monitoring is active.
- [ ] Logs are available.
- [ ] No critical release issue exists.
- [ ] Deployment evidence is recorded.
- [ ] Release is formally marked successful.

---

# 60. Unresolved Decisions

The following production decisions remain to be finalized:

1. Cloud provider.
2. Frontend hosting.
3. Backend hosting.
4. Database hosting.
5. File/object storage.
6. Reverse proxy.
7. CDN strategy.
8. Container orchestration.
9. CI/CD platform.
10. Monitoring platform.
11. Logging platform.
12. Alerting platform.
13. Backup frequency.
14. Backup retention.
15. Disaster recovery objectives.
16. Recovery Point Objective (RPO).
17. Recovery Time Objective (RTO).
18. Production uptime target.
19. Deployment window policy.
20. Production approval policy.
21. Hotfix process.
22. Rollback tooling.
23. Secret rotation policy.
24. Database maintenance process.
25. Production access policy.

These should be finalized before the first real production launch.

---

# 61. Relationship With Other Documents

Production deployment depends on:

```text id="v2sy8r"
13-deployment/
├── preview.md
├── production.md
└── deployment-checklist.md

11-security/
└── security-review.md

12-code-review/
└── review-checklist.md

10-testing/
├── test-strategy.md
├── test-cases.md
└── bug-tracking.md

05-architecture/
├── system-architecture.md
├── api-architecture.md
├── integration-architecture.md
└── data-ownership.md
```

The production deployment process must be consistent with these documents.

---

# 62. Final Principle

Production deployment is the final engineering control before real users and real academic data depend on the system.

For Acadlytic:

```text id="q4xq6v"
Reviewed Code
      ↓
Tested Release
      ↓
Secure Release
      ↓
Preview-Verified Release
      ↓
Backed-Up Production
      ↓
Controlled Deployment
      ↓
Smoke Tests
      ↓
Monitoring
      ↓
Trusted Production System
```

The most important rule is:

> **Never treat production deployment as successful merely because the application is online. It is successful only when the application is online, secure, correctly connected to its data, operationally observable, tenant-safe, and capable of preserving the integrity of student academic records.**

---

## Document Status

**Status:** Draft / Under Review

This document should be finalized after the hosting architecture, CI/CD process, backup and disaster-recovery strategy, monitoring, production access policy, and release approval workflow are formally approved.

