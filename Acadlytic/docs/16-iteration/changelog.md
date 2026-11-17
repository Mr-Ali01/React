# Changelog

Maintain a chronological record of meaningful product changes.

## Format
### YYYY-MM-DD — Version
#### Added
- ...

#### Changed
- ...

#### Fixed
- ...

#### Security
- ...

#### Breaking Changes
- ...

Do not use the changelog as a substitute for architecture decision records.


<!-- ========================================================================= -->


# Acadlytic — Product Changelog

**Document:** `16-iteration/changelog.md`  
**Project:** Acadlytic — The Academic Intelligence Platform for University-Affiliated Colleges  
**Status:** Draft / Under Review  
**Purpose:** Define the standard for recording released product changes, fixes, improvements, security updates, academic-data changes, infrastructure changes, and other meaningful modifications to Acadlytic.

---

# 1. Purpose

The changelog provides a human-readable history of meaningful changes made to Acadlytic.

It answers:

- What changed?
- Why did it change?
- Which version or release contained the change?
- Which users or modules were affected?
- Was the change a feature, fix, security improvement, or other modification?
- Were database or academic-data changes involved?
- Which documentation or requirements were affected?

The changelog is a communication and traceability artifact.

It is not a replacement for:

- Git history
- pull requests
- issue tracking
- bug tracking
- deployment records
- migration history
- audit logs
- incident records

---

# 2. Changelog Principle

The changelog should communicate important product changes clearly without requiring readers to inspect source code or internal implementation details.

The guiding principle is:

> **Record meaningful changes clearly, accurately, and traceably so the evolution of Acadlytic remains understandable.**

---

# 3. What Should Be Recorded?

Record meaningful changes such as:

- new features
- major feature improvements
- bug fixes
- security fixes
- academic-data integrity fixes
- usability improvements
- accessibility improvements
- performance improvements
- database changes
- API changes
- frontend changes
- backend changes
- infrastructure changes
- deployment changes
- dependency changes with user or operational impact
- configuration changes
- breaking changes
- deprecations
- removed features
- major documentation changes

---

# 4. What Should Not Be Recorded?

Do not record every internal development action.

Normally exclude:

- trivial code formatting
- variable renaming
- internal refactoring with no meaningful impact
- temporary development experiments
- local debugging
- failed implementation attempts
- unmerged changes
- development-only changes with no release impact

Internal details may still be referenced when they are important for traceability or operations.

---

# 5. Changelog vs Git History

Git records implementation history.

The changelog records meaningful product/release history.

Example:

```text
Git:
37 commits
12 refactors
8 test changes
4 configuration changes

Changelog:
Improved result validation
Fixed duplicate result processing
Improved Student Portal loading
Updated authentication security
```

The changelog should not become a copy of commit messages.

---

# 6. Changelog vs Release Notes

A changelog is the long-term historical record.

Release notes are communication for a specific release.

Relationship:

```text
Implementation
      ↓
Release
      ↓
Changelog
      ↓
Release Notes
```

A release may have detailed release notes while the changelog contains a concise historical entry.

---

# 7. Changelog Entry Structure

Each release should follow a consistent structure.

Recommended:

```text
## [Version] — YYYY-MM-DD

### Added
- ...

### Changed
- ...

### Fixed
- ...

### Security
- ...

### Academic Data
- ...

### Deprecated
- ...

### Removed
- ...

### Infrastructure
- ...
```

Only relevant sections need to be included.

---

# 8. Versioning

The project should use an approved versioning strategy.

A recommended model is:

```text
MAJOR.MINOR.PATCH
```

Example:

```text
1.0.0
1.1.0
1.1.1
2.0.0
```

Versioning rules must be finalized before production release.

---

# 9. Version Meaning

A possible semantic interpretation:

### MAJOR

Used for significant incompatible changes.

Examples:

- breaking API contract
- major product architecture change
- incompatible migration
- removal of critical supported behavior

### MINOR

Used for backward-compatible features.

Examples:

- new analytics feature
- new dashboard capability
- new supported workflow

### PATCH

Used primarily for backward-compatible fixes.

Examples:

- bug fix
- minor usability fix
- security patch

The exact versioning policy should be approved before production.

---

# 10. Release Date

Every release entry should contain the actual release date.

Format:

```text
YYYY-MM-DD
```

Example:

```text
## 1.2.0 — 2026-10-05
```

Do not record an estimated date as the actual release date.

---

# 11. Release Status

Possible release statuses:

```text
PLANNED
RELEASED
PARTIALLY_DEPLOYED
ROLLED_BACK
SUPERSEDED
```

The primary changelog should generally contain released changes.

Planned changes should normally remain in the roadmap or release planning artifacts.

---

# 12. Change Categories

Use consistent categories.

Recommended categories:

```text
Added
Changed
Fixed
Security
Academic Data
Performance
Accessibility
Deprecated
Removed
Infrastructure
Documentation
```

A change may belong to multiple conceptual categories, but avoid unnecessary duplication.

---

# 13. Added

Use **Added** for new functionality.

Example:

```text
### Added

- Added student Academic Passport view.
- Added CSV result import.
- Added backlog history display.
```

The entry should describe the user-visible capability rather than implementation details.

---

# 14. Changed

Use **Changed** for modifications to existing behavior.

Example:

```text
### Changed

- Improved result validation feedback.
- Updated student dashboard navigation.
- Changed analytics filters to preserve selected context.
```

---

# 15. Fixed

Use **Fixed** for defects that have been corrected.

Example:

```text
### Fixed

- Fixed duplicate processing of the same result import.
- Fixed incorrect backlog resolution after a supplementary result.
```

Where appropriate, reference the associated bug ID.

---

# 16. Security

Security-related changes should be explicitly identifiable.

Examples:

```text
### Security

- Improved authorization checks for student academic records.
- Strengthened tenant isolation for student lookup.
- Improved uploaded-file validation.
```

Do not expose sensitive exploit details.

---

# 17. Academic Data

Academic-data changes require additional care.

Examples:

```text
### Academic Data

- Fixed processing behavior for repeated subject attempts.
- Improved preservation of historical result attempts.
- Corrected backlog resolution behavior after a passing attempt.
```

Academic changes should be traceable to:

- requirement
- bug
- incident
- approved change request

where applicable.

---

# 18. Performance

Performance changes should be recorded when they materially affect the product.

Example:

```text
### Performance

- Improved student search performance for large college datasets.
- Reduced unnecessary analytics queries on dashboard load.
```

Avoid unsupported claims such as:

> "Made the system 10x faster"

unless measured evidence supports the statement.

---

# 19. Accessibility

Meaningful accessibility improvements may be recorded.

Examples:

```text
### Accessibility

- Improved keyboard navigation for result tables.
- Added clearer accessible labels to dashboard controls.
- Improved focus handling for modal workflows.
```

---

# 20. Infrastructure

Infrastructure changes should be recorded when they affect deployment, reliability, or operations.

Examples:

```text
### Infrastructure

- Updated production deployment configuration.
- Added backend health-check monitoring.
- Improved background-job failure handling.
```

Avoid exposing:

- secrets
- internal credentials
- sensitive infrastructure details
- private network information

---

# 21. Deprecation

Use **Deprecated** when functionality remains available but should no longer be used for new work.

Example:

```text
### Deprecated

- Deprecated the legacy result-import endpoint in favor of `/api/v1/result-imports`.
```

A deprecation entry should explain:

- what is deprecated
- recommended replacement
- expected removal timeline, if approved

---

# 22. Removed

Use **Removed** when supported functionality has been removed.

Example:

```text
### Removed

- Removed the legacy result-import workflow after migration to the new processing pipeline.
```

Removal of academic functionality requires special review.

---

# 23. Breaking Changes

Breaking changes must be clearly identified.

Example:

```text
### Breaking Changes

- Updated the result-processing API contract.
- Clients using the previous request structure must migrate to the new DTO format.
```

Breaking changes should reference the migration or upgrade documentation.

---

# 24. API Changes

Meaningful API changes should be recorded.

Examples:

- new endpoint
- endpoint removal
- request schema change
- response schema change
- authentication change
- authorization behavior change
- pagination change
- error-code change

Example:

```text
### Changed

- Added pagination metadata to the student results endpoint.
```

---

# 25. Database Changes

Record database changes that affect:

- schema
- constraints
- indexes
- migrations
- data transformations
- performance
- retention

Example:

```text
### Infrastructure

- Added database indexes supporting student identifier lookup during result validation.
```

Do not expose raw credentials or sensitive database configuration.

---

# 26. Academic Database Changes

Changes affecting authoritative academic data require additional documentation.

Examples:

- result schema
- attempt history
- backlog relationships
- academic calculations
- processing state
- Passport projections

Such changes should be linked to the appropriate:

- migration
- feature specification
- test evidence
- deployment record
- incident/change record

---

# 27. Migration-Related Changes

If a release includes a migration:

```text
### Infrastructure

- Added migration for the new result-attempt tracking structure.
```

The release process must separately verify:

- migration success
- rollback/recovery strategy
- data integrity
- application compatibility

The changelog should not be used as the migration execution record.

---

# 28. Dependency Updates

Meaningful dependency updates may be recorded when they affect:

- security
- compatibility
- performance
- supported runtime
- application behavior

Example:

```text
### Security

- Updated a backend dependency to address a published security vulnerability.
```

Routine dependency updates with no meaningful impact do not require individual changelog entries.

---

# 29. Documentation Changes

Significant documentation changes may be recorded.

Examples:

```text
### Documentation

- Added result-processing implementation documentation.
- Updated production deployment requirements.
```

Small wording corrections generally do not require a changelog entry.

---

# 30. Release Entry Example

Example:

```text
## 1.1.0 — 2026-10-05

### Added

- Added student Academic Passport.
- Added student backlog history.
- Added semester-level academic analytics.

### Changed

- Improved student dashboard navigation.
- Improved result-validation error presentation.

### Fixed

- Fixed duplicate result processing for retried imports.

### Security

- Strengthened tenant-isolation checks for student academic endpoints.

### Academic Data

- Preserved historical result attempts during reprocessing.

### Performance

- Improved student search query performance.
```

This is the preferred level of detail for a normal release.

---

# 31. Entry Quality

A good changelog entry should be:

- concise
- factual
- understandable
- user-oriented
- traceable
- non-sensitive

Avoid implementation-heavy statements unless they provide useful operational context.

---

# 32. Poor vs Good Changelog Entry

### Poor

```text
Changed ResultProcessingService.java.
```

This tells users almost nothing.

### Better

```text
Fixed duplicate processing when the same result import is retried.
```

The second entry communicates the actual behavior.

---

# 33. Avoid Unsupported Claims

Do not write:

```text
Improved system reliability.
```

unless there is evidence or a meaningful change supporting that statement.

Prefer:

```text
Improved background-job failure handling and retry visibility.
```

---

# 34. Traceability

Important changelog entries should link conceptually to:

```text
Feedback
   ↓
Requirement
   ↓
Task/Bug
   ↓
Pull Request
   ↓
Commit
   ↓
Release
   ↓
Changelog
```

The exact tooling may vary.

The important requirement is that meaningful changes remain traceable.

---

# 35. Change IDs

Where useful, include stable internal references.

Example:

```text
- Fixed duplicate result processing (BUG-024).
- Added CSV import validation (TASK-118).
```

IDs should use the project's approved tracking system.

Do not invent tracking IDs merely to make an entry appear traceable.

---

# 36. Feedback-Driven Changes

When a change originated from user feedback:

```text
### Changed

- Improved result-import error visibility based on recurring academic-staff feedback.
```

Where appropriate, reference the underlying feedback or product decision internally.

---

# 37. Bug-Fix Entries

Bug fixes should communicate the user-visible problem.

Preferred:

```text
- Fixed students being unable to view their latest processed result.
```

Avoid:

```text
- Fixed null pointer in StudentResultService.
```

unless the technical detail is operationally important.

---

# 38. Security Fix Entries

Security entries should communicate the protection improvement without publishing exploit instructions.

Preferred:

```text
- Strengthened authorization checks for student academic-record access.
```

Avoid:

```text
- Fixed exploit allowing attackers to enumerate student IDs through endpoint X.
```

unless disclosure has been explicitly approved.

---

# 39. Academic Integrity Changes

Any change affecting academic correctness should be reviewed carefully.

Examples:

- result processing
- attempt preservation
- backlog lifecycle
- SGPA/CGPA calculations
- credit calculations
- Passport data
- analytics metrics

The changelog must not be used to approve academic logic.

Approval must happen through the relevant requirements, review, testing, and release processes.

---

# 40. Changelog and Academic Calculations

If academic calculation behavior changes, record:

- what changed
- why it changed
- affected scope
- relevant approved academic configuration
- verification status

Never claim a university-specific calculation is correct merely because it was implemented.

University-specific formulas must come from approved authoritative requirements or configuration.

---

# 41. Result Processing Changes

Result-processing changes deserve special attention.

A changelog entry should identify meaningful changes such as:

```text
- Improved retry behavior for failed result-processing jobs.
- Preserved historical attempts when processing supplementary results.
- Prevented invalid validation records from entering authoritative processing.
```

---

# 42. Backlog Changes

Backlog changes should communicate lifecycle behavior.

Examples:

```text
- Fixed backlog resolution after a successful supplementary attempt.
- Improved visibility of historical backlog attempts.
```

Do not describe a backlog as simply a failed result.

A backlog represents an unresolved academic requirement.

---

# 43. Academic Passport Changes

Examples:

```text
- Added semester-level result history to the Academic Passport.
- Improved display of resolved and open backlogs.
```

The changelog should preserve the distinction between Passport presentation and authoritative academic data.

---

# 44. Analytics Changes

Analytics changes should clearly identify metric changes.

Example:

```text
### Changed

- Updated backlog analytics to distinguish unique students from result attempts.
```

If a metric definition changes, documentation and test cases must also be updated.

---

# 45. Student Portal Changes

Examples:

```text
### Added

- Added student backlog history to the Student Portal.

### Changed

- Improved dashboard loading states for academic data.
```

The Student Portal must remain a presentation/access layer.

---

# 46. Tenant-Isolation Changes

Tenant isolation is a release-critical concern.

Meaningful improvements should be recorded.

Example:

```text
### Security

- Strengthened college-scoped authorization for student and academic-record queries.
```

---

# 47. Authentication Changes

Record important changes to:

- login
- logout
- password reset
- account activation
- session/token behavior
- failed-login protection
- role authorization

Example:

```text
### Security

- Improved account protection against repeated failed authentication attempts.
```

---

# 48. Frontend Changes

Frontend entries should focus on user-visible changes.

Examples:

```text
### Changed

- Improved mobile navigation for the Student Portal.
- Improved empty states for result and backlog pages.
```

Avoid listing every component refactor.

---

# 49. Backend Changes

Backend changes should be recorded when they affect:

- API behavior
- business behavior
- reliability
- security
- performance
- integrations

Internal refactoring alone generally does not require a changelog entry.

---

# 50. Integration Changes

Integration changes may include:

- new authorized integration
- changed connector behavior
- import adapter improvements
- external service changes
- notification integration
- storage integration

Example:

```text
### Added

- Added support for the approved university result-file format.
```

Only authorized integrations should be documented as supported product capabilities.

---

# 51. Deployment Changes

Significant deployment changes may be recorded.

Examples:

```text
### Infrastructure

- Added preview-environment deployment validation.
- Improved production health-check verification.
```

Deployment execution details belong in deployment records.

---

# 52. Rollback

If a release is rolled back:

```text
## 1.4.0 — 2026-10-12

### Release Status

Rolled back.
```

A rollback should reference the relevant incident or deployment record.

Do not silently remove the release from historical records.

---

# 53. Hotfix Releases

Emergency fixes should still receive normal changelog treatment.

Example:

```text
## 1.3.1 — 2026-10-14

### Fixed

- Fixed an issue preventing result-processing jobs from completing after deployment.

### Security

- Applied the approved production security fix.
```

---

# 54. Emergency Academic Fix

If an urgent academic-data issue requires a production fix:

- follow incident response
- preserve evidence
- verify affected data
- perform controlled correction
- test the fix
- deploy through the approved emergency process
- document the change

The changelog records the resulting product change; the incident record contains the full investigation.

---

# 55. Release Notes Relationship

A release may have:

```text
Changelog:
Long-term historical record

Release Notes:
User-facing explanation

Deployment Record:
Operational deployment evidence

Incident Record:
Problem investigation and response
```

These artifacts should complement one another.

---

# 56. Changelog Ordering

Use reverse chronological order.

Newest release:

```text
Top
```

Oldest release:

```text
Bottom
```

This allows readers to immediately see recent changes.

---

# 57. Unreleased Section

An optional section may be maintained:

```text
# Changelog

## [Unreleased]

### Added

### Changed

### Fixed
```

Only changes that are actually committed to the release scope should be placed there.

Do not use `Unreleased` as a general idea backlog.

---

# 58. Release Freeze

During release preparation:

- finalize changelog entries
- verify release version
- verify release date
- verify important bug fixes
- verify security changes
- verify academic-data changes
- verify breaking changes
- verify migration information

The changelog should be reviewed before release approval.

---

# 59. Changelog Review

Reviewers should verify:

- no major released change is missing
- no unreleased change is incorrectly listed
- wording is accurate
- security details are safe
- academic claims are supported
- version is correct
- release date is correct
- breaking changes are clearly marked

---

# 60. Changelog Accuracy

The changelog must not:

- claim a feature exists when it does not
- claim a bug was fixed when it remains unresolved
- claim a calculation is correct without evidence
- hide a rollback
- hide a significant breaking change
- expose confidential information

Accuracy is more important than making a release appear successful.

---

# 61. Changelog Corrections

If an entry is found to be incorrect:

- correct the historical entry
- preserve the fact that a correction was made when appropriate
- do not rewrite history to hide an incident
- maintain consistency with release records

For significant corrections, document the reason.

---

# 62. Documentation Synchronization

A release may require updates to:

- PRD
- feature specification
- architecture
- API documentation
- database documentation
- testing documentation
- security documentation
- deployment documentation
- QA documentation
- roadmap
- feedback records

The changelog should not become the only place where the change is documented.

---

# 63. Change Impact Review

Before releasing a significant change, identify affected areas:

```text
Feature
API
Database
Security
Tenant Isolation
Academic Data
Frontend
Testing
Deployment
Documentation
Monitoring
```

This helps prevent incomplete releases.

---

# 64. Changelog for MVP

During MVP development, maintain enough changelog discipline to establish the habit, but do not create unnecessary overhead for every development commit.

MVP changelog entries should focus on:

- completed capabilities
- meaningful fixes
- security improvements
- academic-data changes
- release milestones

---

# 65. Changelog After MVP

After production launch, changelog maintenance becomes more important because it provides a historical record of product evolution.

It should help answer:

> How did Acadlytic change over time?

---

# 66. Future Product Changes

Future capabilities such as:

- authorized university integrations
- Regulation & Credit Eligibility Engine
- Academic What-If Simulator
- Academic Risk Intelligence
- AI Academic Query
- SaaS billing
- multi-campus enterprise

should receive changelog entries only after they are actually released.

Roadmap items do not belong in the released changelog.

---

# 67. AI-Assisted Changelog Generation

AI may assist with:

- summarizing release commits
- grouping changes
- drafting entries
- identifying potentially missing categories
- comparing release scope with changelog entries

AI must not independently determine that a change is safe to release.

AI-generated entries must be verified against:

- actual implementation
- tests
- release scope
- security review
- academic requirements
- deployment evidence

---

# 68. AI Changelog Rules

AI must not:

- invent changes
- invent bug fixes
- invent performance improvements
- invent security improvements
- invent academic correctness
- fabricate release dates
- fabricate version numbers
- expose sensitive security information
- claim a feature was released when it was only developed

Use source evidence.

---

# 69. Changelog Quality Checklist

Before publishing a release entry:

### Release

- [ ] Version is correct
- [ ] Date is correct
- [ ] Release status is correct

### Changes

- [ ] Added features are actually released
- [ ] Changed behavior is accurate
- [ ] Fixed issues are verified
- [ ] Removed/deprecated functionality is clearly identified

### Security

- [ ] Security changes are reviewed
- [ ] Sensitive details are excluded

### Academic Data

- [ ] Academic changes are verified
- [ ] No unsupported academic claims are present
- [ ] Historical-data implications were reviewed

### Documentation

- [ ] Related documentation is updated
- [ ] Breaking changes are documented

---

# 70. Definition of Done

A changelog release entry is complete when:

```text
Release Scope Verified
        +
Version Verified
        +
Date Verified
        +
Changes Categorized
        +
Security Reviewed
        +
Academic Changes Reviewed
        +
Breaking Changes Identified
        +
Entry Reviewed
        +
Release Published
```

---

# 71. Recommended Entry Template

Use the following template for future releases:

```markdown
## [VERSION] — YYYY-MM-DD

### Added

- New feature.

### Changed

- Meaningful behavior change.

### Fixed

- Important bug fix.

### Security

- Security-related improvement.

### Academic Data

- Academic-data or processing change.

### Performance

- Meaningful performance improvement.

### Accessibility

- Accessibility improvement.

### Deprecated

- Deprecated functionality.

### Removed

- Removed functionality.

### Infrastructure

- Important deployment, database, or operational change.

### Documentation

- Important documentation change.

### Breaking Changes

- Breaking change and migration requirement.
```

Only include applicable sections.

---

# 72. Example Acadlytic Release

```markdown
## 1.0.0 — 2026-XX-XX

### Added

- Added multi-tenant college management.
- Added academic structure management.
- Added student management.
- Added Excel/CSV result import.
- Added result validation and processing.
- Added backlog tracking.
- Added Academic Passport.
- Added academic analytics.
- Added Student Portal.

### Security

- Added role-based authorization.
- Added college tenant isolation.
- Added protected student self-service endpoints.

### Academic Data

- Added historical result-attempt preservation.
- Added backlog lifecycle tracking.
```

This is an example structure only. The actual release entry must reflect the features that were genuinely released.

---

# 73. Relationship With Feedback

Feedback may lead to a released change:

```text
Feedback
   ↓
Validation
   ↓
Product Decision
   ↓
Task
   ↓
Implementation
   ↓
Testing
   ↓
Release
   ↓
Changelog
```

The changelog records the resulting product change, not the entire feedback discussion.

---

# 74. Relationship With Bug Tracking

Bug lifecycle:

```text
Bug
 ↓
Fix
 ↓
QA Verification
 ↓
Release
 ↓
Changelog
```

Only verified/released fixes should appear as completed changelog entries.

---

# 75. Relationship With Security Review

Security changes should be supported by the security process.

```text
Security Finding
      ↓
Assessment
      ↓
Fix
      ↓
Security Verification
      ↓
Release
      ↓
Changelog
```

The changelog should not replace the security review record.

---

# 76. Relationship With QA

QA verifies that the released behavior works as expected.

The changelog communicates the resulting change.

```text
Implementation
      ↓
Testing
      ↓
QA
      ↓
Release
      ↓
Changelog
```

---

# 77. Relationship With Deployment

Deployment documentation records:

- where
- when
- how
- deployment status
- verification
- rollback

The changelog records:

- what changed

These responsibilities should remain separate.

---

# 78. Relationship With Monitoring

Monitoring confirms whether the release behaves correctly after deployment.

Relevant observations may result in:

- bug
- hotfix
- incident
- follow-up improvement

The final change may then be recorded in the changelog.

---

# 79. Relationship With Future Roadmap

The roadmap answers:

> What are we planning?

The changelog answers:

> What have we released?

Therefore:

```text
Roadmap ≠ Changelog
```

Do not copy planned roadmap items into the released changelog.

---

# 80. Changelog Governance

The product/release owner should be responsible for ensuring that the changelog remains accurate.

Engineering, QA, security, and academic-data stakeholders should review entries relevant to their areas.

---

# 81. Unresolved Decisions

The following decisions remain to be finalized:

1. Exact versioning scheme.
2. Whether semantic versioning will be formally adopted.
3. Release numbering ownership.
4. Exact release-note format.
5. Whether changelog entries will be maintained manually or generated partially from release metadata.
6. Whether change IDs will link to an issue tracker.
7. Exact production release cadence.
8. Whether an `Unreleased` section will be maintained.
9. Who has final changelog approval authority.
10. Retention and archival policy for historical release records.

---

# 82. Final Principle

The changelog is the historical memory of Acadlytic's product evolution.

It should make meaningful changes understandable without replacing the deeper engineering, security, academic-data, testing, and deployment records.

The complete release trace should remain:

```text
Problem / Requirement
        ↓
Product Decision
        ↓
Implementation
        ↓
Testing
        ↓
Security / Academic Review
        ↓
Release
        ↓
Deployment
        ↓
Monitoring
        ↓
Changelog
        ↓
Future Iteration
```

> **A trustworthy changelog records what actually changed, communicates it accurately, preserves important traceability, and never sacrifices technical, security, or academic truth for the appearance of a successful release.**

---

# 83. Document Status

**Status:** Draft / Under Review

This document should be finalized after the team approves the versioning scheme, release process, changelog ownership, release-note relationship, and change-traceability mechanism.