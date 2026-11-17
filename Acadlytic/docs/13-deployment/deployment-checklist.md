# Deployment Checklist

## Before Deploy
- [ ] Tests pass
- [ ] Security checks pass
- [ ] Database migration reviewed
- [ ] Environment variables verified
- [ ] Backup verified
- [ ] Rollback plan known
- [ ] Release notes prepared

## After Deploy
- [ ] Application health check
- [ ] Login test
- [ ] Tenant isolation smoke test
- [ ] Result import smoke test
- [ ] Database connectivity
- [ ] Background jobs
- [ ] Error monitoring
- [ ] Logs
- [ ] Performance

## Rollback
Document the exact application and database rollback strategy before high-risk releases.

<!-- ================================================================= -->

# Acadlytic — Deployment Checklist

**Document:** `13-deployment/deployment-checklist.md`  
**Project:** Acadlytic — The Academic Intelligence Platform for University-Affiliated Colleges  
**Status:** Draft / Under Review  
**Purpose:** Provide a repeatable checklist for validating and executing Acadlytic deployments across preview and production environments.

---

# 1. Purpose

This checklist converts the deployment requirements defined in the preview and production deployment documents into an actionable release checklist.

It is intended to reduce deployment mistakes and ensure that every release is evaluated consistently.

The checklist covers:

- release preparation
- code review
- testing
- security
- database
- infrastructure
- configuration
- preview deployment
- QA
- production deployment
- smoke testing
- monitoring
- rollback
- post-deployment verification

---

# 2. Deployment Principle

A deployment is not complete when the application starts.

A deployment is complete when:

```text
Release
  ↓
Build
  ↓
Deploy
  ↓
Verify
  ↓
Test
  ↓
Monitor
  ↓
Approve
```

all required gates have passed.

---

# 3. Deployment Types

This checklist supports:

### Preview Deployment

Used for:

- release-candidate testing
- integration testing
- QA
- security verification
- production-like validation

### Production Deployment

Used for:

- real users
- real academic data
- live operations

Production requires all applicable preview gates plus additional production safety checks.

---

# 4. Release Information

Complete before deployment.

```text
Release Version:
Git Commit SHA:
Build Number:
Release Date:
Deployment Environment:
Database Migration Version:
Backend Version:
Frontend Version:
Deployment Owner:
Reviewer:
QA Owner:
Security Reviewer:
```

---

# 5. Release Scope

Document:

```text
Release Summary:

New Features:

Bug Fixes:

Security Changes:

Database Changes:

Academic Workflow Changes:

Infrastructure Changes:

Configuration Changes:

Known Issues:
```

Verify:

- [ ] Release scope is documented.
- [ ] All included changes are intentional.
- [ ] No unrelated changes are included.
- [ ] Known limitations are documented.

---

# 6. Code Review Gate

Before deployment:

- [ ] Pull requests reviewed.
- [ ] Required reviewers approved.
- [ ] Blocking review findings resolved.
- [ ] Major review findings resolved or explicitly accepted.
- [ ] Architecture reviewed.
- [ ] Security reviewed.
- [ ] Tenant isolation reviewed.
- [ ] Academic data integrity reviewed.
- [ ] Database changes reviewed.
- [ ] API changes reviewed.
- [ ] Frontend changes reviewed.

---

# 7. Automated Build Gate

Verify:

- [ ] Dependencies install successfully.
- [ ] Backend compiles.
- [ ] Frontend builds.
- [ ] Type checking passes.
- [ ] Linting passes.
- [ ] Static analysis passes where configured.
- [ ] No unexpected build warnings.
- [ ] Build artifact is generated.
- [ ] Build uses the intended commit.
- [ ] Build is reproducible.

---

# 8. Automated Test Gate

Verify:

- [ ] Unit tests pass.
- [ ] Backend integration tests pass.
- [ ] API tests pass.
- [ ] Database tests pass.
- [ ] Frontend tests pass.
- [ ] Security tests pass.
- [ ] Contract tests pass where configured.
- [ ] End-to-end tests pass.
- [ ] Regression tests pass.
- [ ] No critical test is skipped without approval.

---

# 9. Security Gate

Verify:

- [ ] Authentication tests pass.
- [ ] Authorization tests pass.
- [ ] Tenant-isolation tests pass.
- [ ] IDOR tests pass.
- [ ] Input validation tests pass.
- [ ] File-upload security tests pass.
- [ ] SQL injection protections verified.
- [ ] XSS protections verified.
- [ ] CSRF strategy verified.
- [ ] CORS configuration verified.
- [ ] Security headers verified.
- [ ] Dependency vulnerabilities reviewed.
- [ ] Secrets are not committed.
- [ ] Production secrets are not included in build artifacts.

---

# 10. Academic Data Integrity Gate

This is a mandatory gate for releases affecting academic workflows.

Verify:

- [ ] Student identity remains correct.
- [ ] Academic structure remains correct.
- [ ] Result matching remains correct.
- [ ] Validation rules remain correct.
- [ ] Invalid results cannot be processed.
- [ ] Duplicate processing is prevented.
- [ ] Historical attempts are preserved.
- [ ] Regular/supplementary context is preserved.
- [ ] Backlog lifecycle is correct.
- [ ] SGPA/CGPA behavior follows approved rules.
- [ ] Passport remains consistent.
- [ ] Analytics remains consistent.
- [ ] Missing values are not incorrectly converted to zero.
- [ ] Cross-tenant academic access is prevented.

---

# 11. Database Review Gate

Verify:

- [ ] Database migration has been reviewed.
- [ ] Migration has been tested in preview.
- [ ] Existing-data compatibility has been tested.
- [ ] Constraints are correct.
- [ ] Indexes are correct.
- [ ] Foreign keys are correct.
- [ ] No unintended destructive operation exists.
- [ ] Migration execution time has been evaluated.
- [ ] Database backup is available.
- [ ] Recovery procedure is known.

---

# 12. Production Database Backup Gate

Before production migration:

- [ ] Backup configuration is active.
- [ ] Recent backup exists.
- [ ] Backup is accessible.
- [ ] Backup integrity is known.
- [ ] Restore procedure is documented.
- [ ] Restore has been tested according to the operational policy.
- [ ] Deployment owner confirms backup readiness.

**Release blocking condition:**

> Do not execute a risky production database migration when the required backup/recovery mechanism is unavailable.

---

# 13. Configuration Gate

Verify:

- [ ] Correct environment profile.
- [ ] Correct database URL.
- [ ] Correct database credentials.
- [ ] Correct API configuration.
- [ ] Correct frontend origin.
- [ ] Correct CORS configuration.
- [ ] Correct storage configuration.
- [ ] Correct email configuration.
- [ ] Correct job configuration.
- [ ] Correct monitoring configuration.
- [ ] No development configuration remains enabled accidentally.

---

# 14. Secret Management Gate

Verify:

- [ ] Secrets are stored in approved secret management.
- [ ] Secrets are not committed.
- [ ] Secrets are not inside Docker images.
- [ ] Secrets are not inside frontend bundles.
- [ ] Secrets are not printed in logs.
- [ ] Preview secrets are not reused in production.
- [ ] Production secrets are not exposed to developers unnecessarily.

---

# 15. Infrastructure Gate

Verify:

- [ ] DNS is configured.
- [ ] HTTPS certificate is valid.
- [ ] Reverse proxy is healthy.
- [ ] Backend infrastructure is available.
- [ ] Frontend hosting is available.
- [ ] Database is available.
- [ ] Storage is available.
- [ ] Required network access is configured.
- [ ] Firewall rules are correct.
- [ ] Monitoring is active.
- [ ] Alerting is available where required.

---

# 16. Preview Deployment Gate

Before preview deployment:

- [ ] Release candidate identified.
- [ ] Preview database available.
- [ ] Preview secrets configured.
- [ ] Preview storage configured.
- [ ] Preview API configured.
- [ ] Preview frontend configured.

After deployment:

- [ ] Frontend loads.
- [ ] Backend starts.
- [ ] Database connection works.
- [ ] Health check passes.
- [ ] Authentication works.
- [ ] API connectivity works.
- [ ] Background jobs work.
- [ ] File storage works.

---

# 17. Preview Smoke Test

Run:

### Authentication

- [ ] Login.
- [ ] Logout.
- [ ] Current user.
- [ ] Protected route.

### Authorization

- [ ] SUPER_ADMIN.
- [ ] COLLEGE_ADMIN.
- [ ] ACADEMIC_STAFF.
- [ ] STUDENT.

### Tenant Isolation

- [ ] College A cannot access College B.
- [ ] Student A cannot access Student B.
- [ ] Direct API manipulation is blocked.

---

# 18. Preview Academic Workflow

Run the complete controlled workflow:

```text
College
  ↓
Academic Structure
  ↓
Student
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

Verify:

- [ ] Each stage succeeds.
- [ ] Data remains consistent between stages.
- [ ] Failures do not create partial authoritative data.
- [ ] Historical attempts remain available.
- [ ] Analytics reflects authoritative data.

---

# 19. Preview Result Import Checklist

- [ ] Valid Excel file accepted.
- [ ] Valid CSV file accepted.
- [ ] Invalid file rejected.
- [ ] Oversized file rejected.
- [ ] Malformed file handled safely.
- [ ] Column mapping works.
- [ ] Student matching works.
- [ ] Subject matching works.
- [ ] Unknown students are flagged.
- [ ] Unknown subjects are flagged.
- [ ] Duplicate records are detected.
- [ ] Validation status is correct.
- [ ] Import errors are visible.
- [ ] Processing cannot bypass validation.

---

# 20. Preview Result Processing Checklist

- [ ] Valid records process.
- [ ] Invalid records are blocked.
- [ ] Warnings follow approved policy.
- [ ] Transaction completes correctly.
- [ ] Duplicate processing is safe.
- [ ] Attempts are preserved.
- [ ] Backlogs update correctly.
- [ ] SGPA/CGPA updates correctly.
- [ ] Passport updates correctly.
- [ ] Analytics updates correctly.
- [ ] Audit information is available.

---

# 21. Preview Student Portal Checklist

Verify:

- [ ] Student dashboard.
- [ ] Academic Passport.
- [ ] Results.
- [ ] Backlogs.
- [ ] Analytics.
- [ ] Profile.
- [ ] Settings.
- [ ] Password change.
- [ ] Logout.

Verify students cannot:

- [ ] edit authoritative results
- [ ] access another student's data
- [ ] access administrative pages
- [ ] access another college's data

---

# 22. Preview Responsive Gate

Verify supported viewport sizes:

```text
320px
375px
430px
768px
1024px
1280px
1440px
1920px
```

Check:

- [ ] navigation
- [ ] forms
- [ ] tables
- [ ] dashboards
- [ ] result import
- [ ] validation
- [ ] Passport
- [ ] analytics
- [ ] student portal

---

# 23. Preview Accessibility Gate

Verify:

- [ ] keyboard navigation
- [ ] visible focus
- [ ] accessible form labels
- [ ] accessible buttons
- [ ] dialog focus
- [ ] table semantics
- [ ] error messaging
- [ ] ARIA states
- [ ] color-independent status
- [ ] reduced-motion behavior

---

# 24. Preview Performance Gate

Use realistic data volumes.

Verify:

- [ ] dashboard performance
- [ ] student search
- [ ] result import
- [ ] validation
- [ ] processing
- [ ] backlog queries
- [ ] Passport queries
- [ ] analytics
- [ ] large tables
- [ ] background jobs

Investigate unexpected performance regressions before production promotion.

---

# 25. Preview QA Approval

Before production promotion:

- [ ] QA completed.
- [ ] Critical test cases passed.
- [ ] Regression suite passed.
- [ ] No unresolved release-blocking bugs.
- [ ] Security review completed.
- [ ] Academic data integrity verified.
- [ ] Deployment evidence recorded.
- [ ] Release candidate approved.

---

# 26. Production Deployment Gate

Before production deployment:

- [ ] Preview approved.
- [ ] Release candidate unchanged after approval, or re-approved after changes.
- [ ] Production backup verified.
- [ ] Production configuration verified.
- [ ] Production secrets verified.
- [ ] Database migration verified.
- [ ] Rollback strategy confirmed.
- [ ] Monitoring confirmed.
- [ ] Deployment owner confirmed.
- [ ] Required stakeholders informed.

---

# 27. Production Deployment Execution

Follow:

```text
Release Approval
      ↓
Backup Verification
      ↓
Infrastructure Check
      ↓
Database Migration
      ↓
Backend Deployment
      ↓
Background Jobs
      ↓
Frontend Deployment
      ↓
Health Checks
      ↓
Smoke Tests
```

Record the deployment timestamp and release identifier.

---

# 28. Production Health Check

Immediately after deployment:

- [ ] Frontend available.
- [ ] Backend available.
- [ ] API health check passes.
- [ ] Database connectivity works.
- [ ] Storage works.
- [ ] Background jobs are running.
- [ ] Monitoring receives data.
- [ ] Logs are available.

---

# 29. Production Authentication Check

Test:

- [ ] Valid login.
- [ ] Invalid login.
- [ ] Logout.
- [ ] Current user.
- [ ] Protected route.
- [ ] Inactive account.
- [ ] Password operation.

---

# 30. Production Authorization Check

Verify:

```text
SUPER_ADMIN
COLLEGE_ADMIN
ACADEMIC_STAFF
STUDENT
```

For each applicable role:

- [ ] permitted actions work
- [ ] restricted actions fail
- [ ] direct API access is protected
- [ ] resource ownership is enforced

---

# 31. Production Tenant-Isolation Check

Verify through API and application behavior:

```text
College A → College A data       ALLOWED
College A → College B data       DENIED

Student A → Own data             ALLOWED
Student A → Student B data       DENIED
```

Test manipulated resource identifiers.

This is a release-critical gate.

---

# 32. Production Academic Smoke Test

Verify the deployed release does not break:

- [ ] student management
- [ ] academic structure
- [ ] result import
- [ ] validation
- [ ] processing
- [ ] backlog
- [ ] Passport
- [ ] analytics
- [ ] Student Portal

For real production data, use controlled operational verification rather than arbitrary test records.

---

# 33. Production Monitoring Gate

After deployment monitor:

### Application

- [ ] error rate
- [ ] response time
- [ ] uptime
- [ ] CPU
- [ ] memory

### Database

- [ ] connection count
- [ ] failed connections
- [ ] slow queries
- [ ] storage
- [ ] locks

### Academic Processing

- [ ] import failures
- [ ] validation failures
- [ ] processing failures
- [ ] background job failures

### Security

- [ ] authentication failures
- [ ] authorization failures
- [ ] suspicious access patterns

---

# 34. Production Log Verification

Verify logs contain useful diagnostic information without exposing:

- [ ] passwords
- [ ] tokens
- [ ] secrets
- [ ] unnecessary personal data
- [ ] complete sensitive result files

Verify important processing failures are traceable.

---

# 35. Post-Deployment Smoke Test

Immediately after production deployment:

```text
[ ] Application opens
[ ] HTTPS works
[ ] Backend health passes
[ ] Database healthy
[ ] Login works
[ ] Logout works
[ ] Authorization works
[ ] Tenant isolation works
[ ] Critical APIs work
[ ] Storage works
[ ] Background jobs work
[ ] Monitoring works
[ ] Logs work
```

---

# 36. Deployment Observation Period

After deployment, monitor the system for an appropriate period.

Watch for:

- elevated error rates
- authentication failures
- database errors
- job failures
- file-processing failures
- unusual response times
- academic workflow problems
- security alerts

High-risk releases should receive enhanced observation.

---

# 37. Rollback Decision Gate

Consider rollback when:

- application is unavailable
- critical functionality is broken
- serious security issue is introduced
- production data integrity is threatened
- severe performance degradation occurs

Before rollback:

- [ ] identify failure
- [ ] preserve evidence
- [ ] determine database compatibility
- [ ] confirm rollback method
- [ ] identify affected users/data
- [ ] notify responsible stakeholders

---

# 38. Database Rollback Warning

Do not blindly roll back database migrations.

If a migration has already changed production data:

```text
Application Rollback
        ≠
Database Rollback
```

The database may require:

- forward migration
- controlled correction
- backup restoration
- point-in-time recovery

The selected strategy must preserve academic history.

---

# 39. Deployment Incident Checklist

If deployment fails:

- [ ] Stop further changes.
- [ ] Record deployment state.
- [ ] Identify failed stage.
- [ ] Preserve logs.
- [ ] Classify severity.
- [ ] Protect academic data.
- [ ] Determine rollback/recovery strategy.
- [ ] Fix root cause.
- [ ] Re-test.
- [ ] Re-deploy preview if required.
- [ ] Re-approve release.
- [ ] Document incident.

---

# 40. Academic Data Incident Checklist

If incorrect academic data is detected:

- [ ] Stop affected processing.
- [ ] Identify affected college.
- [ ] Identify affected students.
- [ ] Identify affected results.
- [ ] Preserve audit/log evidence.
- [ ] Determine root cause.
- [ ] Prevent further processing.
- [ ] Verify authoritative records.
- [ ] Correct through controlled procedure.
- [ ] Rebuild dependent views if required.
- [ ] Verify Passport.
- [ ] Verify analytics.
- [ ] Add regression tests.
- [ ] Document incident.

---

# 41. Release Blocking Conditions

Deployment must stop when any applicable condition is true:

- [ ] critical security vulnerability
- [ ] authentication bypass
- [ ] authorization bypass
- [ ] tenant isolation failure
- [ ] academic data corruption risk
- [ ] unsafe database migration
- [ ] failed critical test
- [ ] unresolved critical bug
- [ ] backup unavailable for required migration
- [ ] rollback strategy unknown
- [ ] monitoring unavailable for critical services

---

# 42. Emergency Hotfix Checklist

For an urgent production fix:

- [ ] Incident identified.
- [ ] Severity classified.
- [ ] Minimal fix identified.
- [ ] Root cause understood sufficiently.
- [ ] Security impact assessed.
- [ ] Academic data impact assessed.
- [ ] Fix reviewed.
- [ ] Regression test added where possible.
- [ ] Preview tested when time permits.
- [ ] Backup verified if database is affected.
- [ ] Production deployment approved.
- [ ] Post-deployment verification performed.
- [ ] Follow-up full review scheduled.

Emergency status must not become an excuse to permanently bypass normal engineering controls.

---

# 43. Post-Deployment Documentation

After a successful deployment record:

```text
Release Version:
Commit SHA:
Build Number:
Deployment Time:
Database Migration:
Deployment Owner:
QA Approval:
Security Approval:
Result:
Known Issues:
Rollback Required:
Incident Reference:
```

---

# 44. Release Completion Gate

A release is complete when:

- [ ] Production deployment succeeded.
- [ ] Health checks passed.
- [ ] Smoke tests passed.
- [ ] Authentication passed.
- [ ] Authorization passed.
- [ ] Tenant isolation passed.
- [ ] Academic workflow passed.
- [ ] Monitoring is healthy.
- [ ] No release-blocking incident exists.
- [ ] Deployment evidence is recorded.
- [ ] Release is marked successful.

---

# 45. Deployment Status

Recommended statuses:

```text
PLANNED
   ↓
READY
   ↓
DEPLOYING
   ↓
VERIFYING
   ↓
SUCCESSFUL
```

Failure states:

```text
FAILED
ROLLED_BACK
BLOCKED
CANCELLED
```

---

# 46. Deployment Decision

Use:

### GO

All required gates passed.

### NO-GO

One or more release-blocking conditions remain.

### CONDITIONAL GO

A non-critical known issue exists and has been explicitly accepted by the authorized release owner.

Conditional approval must be documented.

---

# 47. Deployment Sign-Off

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

---

# 48. Quick Release Checklist

For experienced deployment operators:

```text
RELEASE
[ ] Correct version
[ ] Correct commit
[ ] Code review complete
[ ] Tests pass
[ ] Security pass
[ ] Academic integrity pass

DATABASE
[ ] Migration reviewed
[ ] Backup verified
[ ] Recovery known

CONFIG
[ ] Environment correct
[ ] Secrets correct
[ ] CORS correct
[ ] Storage correct

PREVIEW
[ ] Deploy
[ ] Smoke test
[ ] QA approval

PRODUCTION
[ ] Deploy
[ ] Health check
[ ] Authentication
[ ] Authorization
[ ] Tenant isolation
[ ] Academic workflow
[ ] Monitoring

CLOSE
[ ] Smoke tests pass
[ ] Release evidence recorded
[ ] Release marked successful
```

---

# 49. AI-Assisted Deployment Checklist

AI-generated deployment changes require human review.

Verify:

- [ ] Docker configuration reviewed.
- [ ] CI/CD configuration reviewed.
- [ ] Environment configuration reviewed.
- [ ] Database migration reviewed.
- [ ] Security configuration reviewed.
- [ ] Network configuration reviewed.
- [ ] No secrets generated or committed.
- [ ] No destructive command is executed automatically.
- [ ] Rollback behavior is understood.

AI must not independently authorize a production deployment.

---

# 50. Relationship With Deployment Documents

This checklist works with:

```text
13-deployment/
├── preview.md
├── production.md
└── deployment-checklist.md
```

The relationship is:

```text
preview.md
    ↓
Preview Environment Rules
    ↓
production.md
    ↓
Production Deployment Rules
    ↓
deployment-checklist.md
    ↓
Operational Execution
```

The checklist operationalizes the requirements defined in the other deployment documents.

---

# 51. Relationship With Testing and Security

Deployment must also follow:

```text
10-testing/
├── test-strategy.md
├── test-cases.md
└── bug-tracking.md

11-security/
└── security-review.md

12-code-review/
└── review-checklist.md
```

Deployment does not replace:

- code review
- testing
- security review
- QA

It verifies that those completed activities are represented in the deployed release.

---

# 52. Final Principle

A deployment checklist exists to prevent predictable mistakes.

For Acadlytic, the most important deployment checks are:

```text
Correct Release
      +
Secure Configuration
      +
Safe Database
      +
Tenant Isolation
      +
Academic Data Integrity
      +
Successful Verification
      +
Operational Monitoring
```

The final rule is:

> **If the team cannot confidently prove that the release is the correct build, the database is safe, tenant boundaries are intact, academic data remains trustworthy, and the deployed system is observable, the deployment is not complete.**

---

## Document Status

**Status:** Draft / Under Review

This checklist should be finalized after the hosting platform, CI/CD workflow, monitoring system, backup/recovery strategy, release approval process, and production access policy are formally approved.