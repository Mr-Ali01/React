# Incident Response

## Incident Types
- Availability outage
- Security incident
- Data integrity incident
- Result processing failure
- External university integration failure
- Database failure

## Process
1. Detect
2. Classify
3. Contain
4. Investigate
5. Restore
6. Verify data integrity
7. Communicate
8. Document root cause
9. Add preventive action

## Academic Data Incident
If incorrect results or backlog states are processed:
- stop further processing if necessary;
- identify affected import jobs;
- preserve evidence;
- determine affected students;
- correct through controlled operations;
- verify downstream passport/analytics;
- document the incident.

## Principle
Data correctness is more important than silently restoring a broken process quickly.


<!-- ========================================================================= -->

# Acadlytic — Incident Response

**Document:** `15-monitoring/incident-response.md`  
**Project:** Acadlytic — The Academic Intelligence Platform for University-Affiliated Colleges  
**Status:** Draft / Under Review  
**Purpose:** Define the process for detecting, classifying, containing, resolving, documenting, and learning from production incidents affecting Acadlytic.

---

# 1. Purpose

Incident response defines how the Acadlytic team handles unexpected events that affect:

- availability
- reliability
- security
- tenant isolation
- academic data integrity
- result processing
- database integrity
- user access
- infrastructure
- deployments

The objective is not only to restore service.

The objective is to:

```text
Detect
  ↓
Contain
  ↓
Investigate
  ↓
Recover
  ↓
Verify
  ↓
Communicate
  ↓
Learn
  ↓
Prevent Recurrence
```

---

# 2. Incident Response Principle

An incident is not considered resolved merely because the application becomes available again.

For Acadlytic, resolution requires verifying that:

- the service works
- affected data is correct
- tenant boundaries remain intact
- academic history is preserved
- dependent views are consistent
- security controls remain effective

> **Restore the service without sacrificing academic data integrity or security.**

---

# 3. What Is an Incident?

An incident is an unexpected event that causes or threatens:

- service disruption
- security compromise
- data integrity problems
- academic processing failure
- unacceptable performance
- loss of critical functionality
- infrastructure failure

Examples:

- production outage
- database failure
- authentication failure
- tenant-isolation failure
- result-processing failure
- malicious file upload
- deployment failure
- incorrect academic calculation
- corrupted academic data

---

# 4. Incident Categories

Classify incidents into one or more categories.

### Application Incident

Application functionality fails.

### Infrastructure Incident

Servers, containers, networking, storage, or hosting fail.

### Database Incident

Database availability, performance, integrity, or migration problems occur.

### Security Incident

Unauthorized access, credential compromise, malicious activity, or security-control failure occurs.

### Academic Data Incident

Academic records are incorrect, corrupted, duplicated, lost, or inconsistently derived.

### Deployment Incident

A release causes unexpected production behavior.

### Integration Incident

An external or future authorized integration causes failure.

---

# 5. Incident Severity

Recommended severity model:

## SEV-1 — Critical

Immediate response required.

Examples:

- production unavailable
- confirmed cross-tenant data exposure
- authentication bypass
- academic data corruption
- widespread incorrect result processing
- major database failure
- critical security compromise

---

## SEV-2 — High

Major functionality is affected.

Examples:

- result processing unavailable
- large import workflow failure
- significant database degradation
- major Student Portal outage
- repeated processing failures affecting users

---

## SEV-3 — Medium

Limited functionality or users are affected.

Examples:

- isolated feature failure
- non-critical API degradation
- limited analytics failure
- moderate performance degradation

---

## SEV-4 — Low

Minor issue with limited operational impact.

Examples:

- cosmetic problem
- low-impact usability problem
- non-critical monitoring issue

---

# 6. Severity Decision Factors

Severity should consider:

```text
User Impact
+
Data Impact
+
Security Impact
+
Academic Impact
+
Tenant Impact
+
Duration
+
Scope
```

A small technical defect can still be SEV-1 if it compromises academic data or tenant isolation.

---

# 7. Incident Detection

Incidents may be detected through:

- monitoring alerts
- application logs
- security alerts
- automated tests
- QA
- user reports
- administrator reports
- developer observation
- database monitoring
- deployment verification

All credible reports should be evaluated.

---

# 8. Initial Incident Response

When an incident is detected:

1. Confirm that the event is real.
2. Determine initial severity.
3. Identify affected components.
4. Determine whether users are affected.
5. Determine whether data is affected.
6. Determine whether security is affected.
7. Prevent further damage where possible.
8. Record the incident.
9. Assign an incident owner.

Do not begin destructive troubleshooting before preserving necessary evidence.

---

# 9. Incident Record

Create an incident record containing:

```text
Incident ID:
Date:
Time Detected:
Environment:
Severity:
Category:
Detected By:
Incident Owner:
Affected Services:
Affected College(s):
Affected Users:
Academic Data Impact:
Security Impact:
Current Status:
```

---

# 10. Incident Lifecycle

Recommended lifecycle:

```text
DETECTED
   ↓
TRIAGED
   ↓
CONTAINING
   ↓
INVESTIGATING
   ↓
RECOVERING
   ↓
VERIFYING
   ↓
RESOLVED
   ↓
POST-INCIDENT REVIEW
```

Possible additional states:

```text
ESCALATED
MONITORING
BLOCKED
REOPENED
```

---

# 11. Incident Roles

Depending on team size, one person may perform multiple roles.

### Incident Owner

Responsible for coordinating the response.

### Technical Owner

Investigates and implements the technical resolution.

### Security Owner

Handles security-related incidents.

### Data Owner

Assesses academic data impact and correction requirements.

### QA Owner

Verifies the fix and recovery.

### Communication Owner

Coordinates required internal or external communication.

---

# 12. Incident Command

For major incidents:

```text
Incident Owner
      ├── Technical Investigation
      ├── Security Investigation
      ├── Academic Data Investigation
      ├── QA / Verification
      └── Communication
```

The exact organizational structure may be simplified for a small team.

---

# 13. Immediate Containment

Containment should prevent the incident from becoming worse.

Possible actions:

- disable affected functionality
- stop background processing
- pause result processing
- disable problematic deployment
- isolate affected service
- revoke compromised credentials
- block suspicious requests
- disable affected integration
- prevent duplicate processing

Containment must not unnecessarily destroy evidence.

---

# 14. Academic Data Incident Containment

For suspected academic data corruption:

```text
Stop Affected Processing
        ↓
Preserve Evidence
        ↓
Identify Affected Scope
        ↓
Protect Unaffected Data
```

Do not blindly rerun processing.

Do not manually edit academic records without an approved correction process.

---

# 15. Security Incident Containment

For suspected security incidents:

- [ ] Identify affected accounts.
- [ ] Identify affected tenants.
- [ ] Identify affected resources.
- [ ] Revoke compromised credentials where necessary.
- [ ] Block malicious access where appropriate.
- [ ] Preserve logs.
- [ ] Preserve relevant evidence.
- [ ] Determine whether data was exposed.
- [ ] Escalate according to security policy.

---

# 16. Tenant-Isolation Incident

A confirmed tenant-isolation failure is critical.

Immediately:

1. Stop the affected access path.
2. Determine whether unauthorized data was exposed.
3. Identify affected tenants.
4. Identify affected resources.
5. Preserve logs and evidence.
6. Review authorization logic.
7. Verify the fix.
8. Assess whether exposed data requires further action.

Do not classify a tenant-isolation failure as an ordinary authorization bug.

---

# 17. Investigation Process

Investigate systematically.

```text
Symptom
  ↓
Timeline
  ↓
Affected Component
  ↓
Recent Changes
  ↓
Logs
  ↓
Metrics
  ↓
Database
  ↓
Root Cause
```

Avoid changing multiple unrelated components simultaneously during investigation.

---

# 18. Evidence Collection

Potential evidence:

- application logs
- security logs
- audit records
- deployment records
- database logs
- monitoring metrics
- job history
- API responses
- error reports
- configuration changes
- relevant screenshots

Evidence should be stored securely.

---

# 19. Timeline

Maintain an incident timeline.

Example:

```text
10:05 — First alert
10:08 — Incident acknowledged
10:12 — SEV-2 assigned
10:18 — Result-processing jobs paused
10:27 — Root cause identified
10:41 — Fix deployed
10:47 — Verification started
11:02 — Processing resumed
11:15 — Incident resolved
```

Times should use a consistent timezone and timestamp format.

---

# 20. Root Cause Analysis

The team should identify:

### Immediate Cause

What directly caused the failure?

### Root Cause

Why did the condition exist?

### Contributing Factors

What allowed or amplified the problem?

### Detection Gap

Why was it not detected earlier?

---

# 21. Root Cause Example

```text
Symptom:
Result processing failed.

Immediate Cause:
Database constraint violation.

Root Cause:
Processing logic allowed duplicate authoritative identity.

Contributing Factor:
Missing application-level idempotency check.

Detection Gap:
No alert existed for repeated duplicate-processing failures.
```

The corrective actions should address the root cause, not only the visible symptom.

---

# 22. Result Processing Incident

If result processing fails:

- [ ] Identify affected import.
- [ ] Identify affected records.
- [ ] Determine whether any records were committed.
- [ ] Determine transaction status.
- [ ] Check duplicate-processing risk.
- [ ] Check backlog updates.
- [ ] Check Passport effects.
- [ ] Check analytics effects.
- [ ] Prevent unsafe retries.
- [ ] Correct the processing issue.
- [ ] Verify affected academic data.

---

# 23. Partial Processing Incident

If processing may have partially succeeded:

Do not assume:

```text
FAILED = NOTHING WAS SAVED
```

Investigate:

- transaction boundaries
- committed records
- processing status
- authoritative result records
- audit events
- backlog state
- Passport state
- analytics state

Only then determine the recovery procedure.

---

# 24. Database Incident

For database failures:

1. Determine availability.
2. Check connections.
3. Check errors.
4. Check locks/deadlocks.
5. Check recent migrations.
6. Check recent deployments.
7. Determine whether data integrity is affected.
8. Protect the database from further damage.
9. Recover using the approved procedure.
10. Verify data integrity.

---

# 25. Database Migration Incident

If a migration fails:

- [ ] Stop further deployment steps.
- [ ] Determine migration state.
- [ ] Determine whether partial changes occurred.
- [ ] Preserve database evidence.
- [ ] Do not blindly rerun migration.
- [ ] Determine rollback/forward-fix strategy.
- [ ] Verify backup availability.
- [ ] Test recovery in a safe environment where possible.

---

# 26. Deployment Incident

If a new release causes failure:

```text
Detect
  ↓
Compare With Previous Release
  ↓
Identify Changed Component
  ↓
Contain
  ↓
Rollback or Fix Forward
  ↓
Verify
```

Application rollback and database rollback must be considered separately.

---

# 27. Infrastructure Incident

For infrastructure failures:

Check:

- application instances
- containers
- reverse proxy
- DNS
- HTTPS
- network
- database
- storage
- CPU
- memory
- disk

Restore the minimum required infrastructure first.

---

# 28. Background Job Incident

If jobs become stuck or repeatedly fail:

- [ ] Identify affected job type.
- [ ] Identify affected jobs.
- [ ] Determine retry count.
- [ ] Determine whether jobs are safe to retry.
- [ ] Stop unsafe retries.
- [ ] Inspect dependencies.
- [ ] Resolve underlying issue.
- [ ] Retry only when safe.
- [ ] Verify resulting data.

---

# 29. File Processing Incident

For result-file processing failures:

- [ ] Preserve original file where policy permits.
- [ ] Identify import job.
- [ ] Identify parser/validation stage.
- [ ] Check file-storage status.
- [ ] Check parsing errors.
- [ ] Check mapping errors.
- [ ] Check validation errors.
- [ ] Check processing state.
- [ ] Avoid treating malformed user input as an application outage.

---

# 30. Authentication Incident

Examples:

- users cannot log in
- unexpected login failures
- password reset failure
- authentication bypass

Response:

- [ ] Check authentication service.
- [ ] Check identity configuration.
- [ ] Check database connectivity.
- [ ] Check recent deployment.
- [ ] Check security logs.
- [ ] Determine scope.
- [ ] Verify authorization after recovery.

---

# 31. Authorization Incident

If users can access something they should not:

- [ ] Stop affected endpoint where necessary.
- [ ] Identify affected role.
- [ ] Identify affected tenant.
- [ ] Identify affected resource.
- [ ] Test direct API access.
- [ ] Review server-side authorization.
- [ ] Review tenant resolution.
- [ ] Review IDOR protection.
- [ ] Verify the fix independently.

---

# 32. Student Portal Incident

If Student Portal functionality fails:

Determine whether the problem affects:

- dashboard
- results
- backlogs
- Passport
- analytics
- profile
- settings

Verify that a presentation-layer failure has not modified authoritative academic data.

---

# 33. Academic Passport Incident

If Passport data appears incorrect:

1. Compare Passport with authoritative sources.
2. Identify the first incorrect field.
3. Determine whether source data is correct.
4. Determine whether projection/composition is incorrect.
5. Fix the read layer.
6. Re-verify against authoritative data.

Do not directly edit the Passport merely to hide a source-data problem.

---

# 34. Analytics Incident

If analytics appears incorrect:

- [ ] Verify authoritative result data.
- [ ] Verify backlog state.
- [ ] Verify calculation inputs.
- [ ] Check aggregation logic.
- [ ] Check filters.
- [ ] Check tenant scope.
- [ ] Check duplicate counting.
- [ ] Check missing-value handling.
- [ ] Check caching/read models if applicable.

Analytics must not become a second source of academic truth.

---

# 35. Communication

Communication should be:

- accurate
- concise
- timely
- appropriate to the incident severity
- free from speculation

Do not communicate unverified root causes as facts.

---

# 36. Internal Incident Update

Recommended format:

```text
Incident:
Severity:
Status:
Impact:
Affected Components:
Current Findings:
Containment:
Next Action:
Owner:
Next Update:
```

---

# 37. User Communication

Where required, communicate:

- what is affected
- current status
- expected next update
- available workaround

Avoid exposing:

- internal architecture
- security-sensitive information
- credentials
- private user information
- unverified technical details

---

# 38. Academic Incident Communication

If academic records may be affected:

- clearly identify the affected workflow
- avoid making unsupported claims about correctness
- preserve evidence
- communicate through the approved institutional process
- provide verified information only

Academic incidents require additional care because users may rely on the information for academic decisions.

---

# 39. Recovery

Recovery should proceed in controlled stages:

```text
Technical Recovery
      ↓
Data Verification
      ↓
Security Verification
      ↓
Academic Verification
      ↓
User Workflow Verification
      ↓
Normal Operations
```

---

# 40. Recovery Verification

Verify:

- [ ] Application healthy.
- [ ] APIs healthy.
- [ ] Database healthy.
- [ ] Authentication works.
- [ ] Authorization works.
- [ ] Tenant isolation works.
- [ ] Background jobs work.
- [ ] Result workflows work.
- [ ] Backlogs are correct.
- [ ] Passport is correct.
- [ ] Analytics is correct.
- [ ] Monitoring is healthy.

---

# 41. Data Correction

Academic data corrections must be controlled.

Rules:

- preserve original evidence
- identify affected records
- document correction reason
- use approved correction mechanism
- preserve auditability
- avoid destructive manual SQL changes
- verify dependent data
- execute regression checks

---

# 42. Academic Data Correction Workflow

```text
Identify Incorrect Data
        ↓
Confirm Source of Truth
        ↓
Determine Correct Value
        ↓
Approve Correction
        ↓
Apply Controlled Correction
        ↓
Verify Authoritative Data
        ↓
Verify Backlog
        ↓
Verify Passport
        ↓
Verify Analytics
        ↓
Record Audit
```

---

# 43. Rollback

Rollback may be appropriate when:

- deployment introduced the incident
- previous version is known to be safe
- rollback will not compromise data integrity

Before rollback:

- [ ] preserve evidence
- [ ] determine database compatibility
- [ ] assess background jobs
- [ ] assess in-flight processing
- [ ] assess data changes
- [ ] confirm rollback plan

---

# 44. Fix Forward

Fix-forward may be preferable when:

- database schema has changed
- data has already been migrated
- rollback would create additional risk
- a small safe correction is available

The decision must be based on data safety, not deployment convenience.

---

# 45. Incident Resolution Criteria

An incident may be marked resolved when:

- [ ] root cause is understood sufficiently
- [ ] immediate impact is contained
- [ ] service is restored
- [ ] affected data is verified
- [ ] security is verified
- [ ] tenant isolation is verified
- [ ] academic workflows are verified
- [ ] monitoring is normal
- [ ] required communication is complete

---

# 46. Post-Incident Review

A significant incident should receive a post-incident review.

Review:

- what happened
- when it happened
- why it happened
- how it was detected
- how it was contained
- how it was recovered
- what data was affected
- what worked well
- what failed
- what should change

---

# 47. Blameless Review

The objective of the review is system improvement.

Focus on:

- process
- architecture
- controls
- testing
- monitoring
- deployment
- documentation
- human factors

Avoid reducing the incident to individual blame.

---

# 48. Corrective Actions

Each significant incident should produce actionable follow-ups.

Examples:

```text
Action:
Add idempotency constraint.

Owner:
Backend

Priority:
P1

Due:
TBD

Verification:
Automated regression test.
```

Corrective actions should have an owner and measurable completion criteria.

---

# 49. Preventive Actions

Possible preventive measures:

- new test cases
- additional validation
- database constraints
- authorization improvements
- monitoring alerts
- deployment safeguards
- documentation updates
- architecture changes
- runbook improvements
- dependency upgrades

---

# 50. Incident Metrics

Track:

- incident count
- incidents by severity
- incidents by category
- mean time to detect
- mean time to acknowledge
- mean time to recover
- recurring incidents
- security incidents
- academic data incidents
- deployment incidents

These metrics should be used for improvement rather than individual performance punishment.

---

# 51. Recurring Incident Review

If the same incident occurs repeatedly:

```text
Incident
  ↓
Fix
  ↓
Recurrence
  ↓
Root Cause Reassessment
  ↓
Systemic Fix
```

Repeated incidents indicate that the original corrective action was insufficient.

---

# 52. Incident Evidence

Maintain:

- incident record
- timeline
- logs
- relevant metrics
- deployment information
- affected resource identifiers
- root-cause analysis
- corrective actions
- verification evidence

Retain evidence according to the approved operational and privacy policies.

---

# 53. Incident Security

Incident records may contain sensitive information.

Therefore:

- restrict access
- protect stored evidence
- avoid unnecessary personal data
- do not include secrets
- do not expose credentials
- control incident-document sharing

---

# 54. Incident Testing

Incident-response procedures should be tested periodically.

Possible exercises:

- application outage
- database failure
- failed deployment
- stuck result-processing job
- compromised credential
- tenant-isolation failure
- backup restoration
- storage failure

The goal is to identify weaknesses before a real incident occurs.

---

# 55. Recovery Exercise

A recovery drill may follow:

```text
Simulated Failure
      ↓
Detection
      ↓
Incident Declaration
      ↓
Containment
      ↓
Recovery
      ↓
Verification
      ↓
Post-Incident Review
```

Document lessons learned.

---

# 56. Incident Runbook

For each major incident category maintain a runbook containing:

```text
Detection Signals
Severity
Initial Actions
Containment
Investigation
Recovery
Verification
Escalation
Communication
Post-Incident Actions
```

---

# 57. AI-Assisted Incident Response

AI may assist with:

- log summarization
- timeline construction
- error correlation
- anomaly analysis
- possible root-cause hypotheses
- runbook lookup
- incident documentation
- post-incident summaries

AI-generated hypotheses must be treated as hypotheses until verified.

AI must not:

- directly modify academic data
- independently execute destructive production operations
- disable security controls without authorization
- declare an incident resolved without human verification
- invent academic rules
- fabricate incident evidence

---

# 58. Incident Response Checklist

## Detection

- [ ] Incident identified.
- [ ] Incident ID created.
- [ ] Severity assigned.
- [ ] Owner assigned.

## Containment

- [ ] Impact assessed.
- [ ] Further damage prevented.
- [ ] Processing paused where necessary.
- [ ] Evidence preserved.

## Investigation

- [ ] Timeline created.
- [ ] Logs reviewed.
- [ ] Metrics reviewed.
- [ ] Recent changes reviewed.
- [ ] Root cause investigated.

## Recovery

- [ ] Fix or rollback selected.
- [ ] Service restored.
- [ ] Database verified.
- [ ] Academic data verified.
- [ ] Security verified.
- [ ] Tenant isolation verified.

## Closure

- [ ] Monitoring normal.
- [ ] Users/stakeholders informed where required.
- [ ] Incident documented.
- [ ] Root cause recorded.
- [ ] Corrective actions created.
- [ ] Post-incident review completed where required.

---

# 59. Critical Academic Incident Checklist

For any suspected academic data integrity incident:

```text
[ ] Stop affected processing
[ ] Preserve evidence
[ ] Identify affected imports
[ ] Identify affected students
[ ] Identify affected results
[ ] Determine transaction state
[ ] Determine authoritative data state
[ ] Check backlog state
[ ] Check Passport state
[ ] Check analytics state
[ ] Determine correction strategy
[ ] Apply controlled correction
[ ] Verify corrected data
[ ] Run regression tests
[ ] Record audit evidence
[ ] Complete post-incident review
```

---

# 60. Critical Security Incident Checklist

```text
[ ] Identify affected account
[ ] Identify affected tenant
[ ] Identify affected resources
[ ] Contain access
[ ] Preserve logs
[ ] Preserve evidence
[ ] Revoke credentials if required
[ ] Verify authorization
[ ] Verify tenant isolation
[ ] Determine exposure
[ ] Correct vulnerability
[ ] Regression test
[ ] Monitor after recovery
[ ] Document incident
```

---

# 61. Incident Closure Record

```text
Incident ID:
Severity:
Category:
Start Time:
End Time:
Duration:

Impact:
Affected Services:
Affected Tenants:
Affected Users:

Academic Data Impact:
Security Impact:

Root Cause:
Immediate Cause:
Contributing Factors:

Containment:
Recovery:
Verification:

Corrective Actions:
Preventive Actions:

Incident Owner:
QA Verification:
Security Verification:
Academic Data Verification:

Closure Date:
```

---

# 62. Relationship With Monitoring

Incident response depends on:

`15-monitoring/monitoring.md`

The relationship is:

```text
Monitoring
    ↓
Detection
    ↓
Alert
    ↓
Incident Response
    ↓
Recovery
    ↓
Verification
    ↓
Monitoring
```

Monitoring identifies abnormal behavior.

Incident response manages the abnormal event.

---

# 63. Relationship With Deployment

Incident response works with:

```text
13-deployment/
├── preview.md
├── production.md
└── deployment-checklist.md
```

A deployment incident may require:

- rollback
- fix-forward
- database recovery
- increased monitoring
- additional QA

---

# 64. Relationship With QA and Testing

Incident response feeds improvements back into:

```text
10-testing/
├── test-strategy.md
├── test-cases.md
└── bug-tracking.md

14-qa/
└── qa-checklist.md
```

A production incident should produce regression coverage where appropriate.

---

# 65. Relationship With Security

Security incidents connect with:

`11-security/security-review.md`

Incident findings may require:

- security-control changes
- additional tests
- authorization changes
- monitoring improvements
- security documentation updates

---

# 66. Relationship With Iteration

Incident response feeds the final improvement cycle:

```text
Incident
   ↓
Root Cause
   ↓
Corrective Action
   ↓
Implementation
   ↓
Testing
   ↓
Deployment
   ↓
Monitoring
```

This prevents the same class of failure from repeatedly returning.

---

# 67. Definition of Incident Response Complete

Incident response is complete only when:

```text
Incident Detected
      +
Impact Understood
      +
Incident Contained
      +
Root Cause Investigated
      +
Service Recovered
      +
Academic Data Verified
      +
Security Verified
      +
Tenant Isolation Verified
      +
Monitoring Verified
      +
Corrective Actions Recorded
```

---

# 68. Final Principle

Acadlytic manages academic information that users and institutions may rely upon for important decisions.

Therefore:

> **Incident response must prioritize containment, evidence preservation, security, tenant isolation, and academic data integrity—not merely restoring application availability.**

The correct response to a serious incident is:

```text
Protect the Data
      ↓
Protect the Users
      ↓
Protect the Tenant Boundary
      ↓
Restore the System
      ↓
Verify the Academic State
      ↓
Prevent Recurrence
```

---

# 69. Document Status

**Status:** Draft / Under Review

This document should be finalized after the team approves incident ownership, severity thresholds, escalation channels, communication procedures, academic-data correction authority, backup/recovery procedures, and production incident-access policies.