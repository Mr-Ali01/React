# Code Review Checklist

## Correctness
- Does implementation satisfy the requirement?
- Are edge cases handled?
- Are errors explicit?

## Security
- Is authorization enforced?
- Is tenant scope enforced?
- Are sensitive values protected?

## Data Integrity
- Can duplicate academic records occur?
- Can records be silently overwritten?
- Is processing idempotent?
- Are transactions correct?

## Maintainability
- Is the code understandable?
- Is existing architecture reused?
- Is unnecessary complexity avoided?

## Testing
- Are important paths tested?
- Are regressions covered?

## Documentation
- Does a material architecture decision require documentation?
- Are API/feature docs updated?

## Review Outcome
Approve / Request Changes / Block pending clarification.

# Acadlytic — Code Review Checklist

**Document:** `12-code-review/review-checklist.md`  
**Project:** Acadlytic — The Academic Intelligence Platform for University-Affiliated Colleges  
**Status:** Draft / Under Review  
**Audience:** Developers, reviewers, technical leads, QA, security reviewers, and AI-assisted development workflows

---

## 1. Purpose

This document defines the code review standards for the Acadlytic project.

The purpose of code review is not only to determine whether code works. Review must verify that the implementation:

- follows the approved architecture
- respects module boundaries
- preserves academic data integrity
- enforces authentication and authorization
- preserves tenant isolation
- follows database ownership rules
- handles failures safely
- remains maintainable
- is testable
- meets frontend and backend standards
- does not introduce unnecessary technical debt
- does not silently expand product scope
- is safe for production

Code review is a quality and risk-control process.

---

# 2. Code Review Principles

Every review should follow these principles:

1. **Correctness before convenience**
2. **Security before usability shortcuts**
3. **Academic data integrity before implementation speed**
4. **Server-side enforcement before frontend assumptions**
5. **Clear ownership before shared-state shortcuts**
6. **Simple architecture before unnecessary abstraction**
7. **Tests before approval**
8. **Explicit behavior before implicit behavior**
9. **Historical data preservation before destructive updates**
10. **Maintainability before clever code**

A reviewer should ask:

> Does this implementation solve the requested problem without weakening the rest of Acadlytic?

---

# 3. When Code Review Is Required

Code review is required for:

- new features
- bug fixes
- security fixes
- database schema changes
- API changes
- authentication changes
- authorization changes
- tenant-isolation changes
- result-import changes
- result-validation changes
- result-processing changes
- academic calculation changes
- backlog logic changes
- Academic Passport changes
- analytics changes
- Student Portal changes
- dependency changes
- configuration changes
- deployment changes
- background-job changes
- file-processing changes
- refactoring that changes behavior
- performance-related changes

Small changes may use a lighter review, but security and academic-data rules still apply.

---

# 4. Pull Request Requirements

Every pull request should contain:

- clear title
- concise description
- problem statement
- implementation summary
- affected modules
- API changes, if applicable
- database changes, if applicable
- frontend changes, if applicable
- security considerations
- test coverage
- manual testing performed
- screenshots for relevant UI changes
- migration information
- configuration/environment changes
- known limitations
- unresolved issues, if any

A reviewer should not be expected to reconstruct the purpose of a change from the code alone.

---

# 5. Pull Request Title Convention

Recommended format:

```text
<type>: <short description>
```

Examples:

```text
feat: add result import validation
fix: prevent duplicate result processing
refactor: simplify student query service
security: enforce tenant isolation on analytics
test: add backlog lifecycle tests
docs: update result processing specification
```

Recommended types:

- `feat`
- `fix`
- `refactor`
- `test`
- `security`
- `docs`
- `perf`
- `build`
- `chore`

---

# 6. Review Classification

Review findings should be classified according to impact.

## 6.1 Blocking

A blocking issue must be fixed before approval.

Examples:

- tenant isolation failure
- unauthorized access
- IDOR vulnerability
- incorrect academic result mutation
- incorrect backlog resolution
- data loss
- duplicate authoritative records
- broken transaction boundary
- critical security vulnerability
- migration that can corrupt production data
- failing critical tests
- API behavior contradicting approved specification

---

## 6.2 Major

A major issue should normally be fixed before merge.

Examples:

- significant architecture violation
- incorrect business logic
- missing authorization
- incorrect analytics calculation
- incorrect historical-attempt handling
- missing important validation
- severe performance problem
- inadequate error handling

---

## 6.3 Minor

A minor issue does not normally block the change but should be addressed when practical.

Examples:

- naming inconsistency
- unnecessary duplication
- weak documentation
- small maintainability issue
- minor UI inconsistency
- non-critical test improvement

---

## 6.4 Suggestion

Suggestions are optional improvements.

Examples:

- readability improvement
- alternative implementation
- minor refactoring
- future optimization

Suggestions must not be presented as blocking requirements unless they affect correctness, security, maintainability, or project standards.

---

# 7. General Code Quality Checklist

Reviewer should verify:

- [ ] Code is readable.
- [ ] Naming is meaningful.
- [ ] Functions have a clear responsibility.
- [ ] Classes have a clear responsibility.
- [ ] Methods are not unnecessarily large.
- [ ] Complex logic is understandable.
- [ ] Business rules are explicit.
- [ ] Duplicate logic is avoided where appropriate.
- [ ] Dead code is removed.
- [ ] Unused imports are removed.
- [ ] Debug statements are removed.
- [ ] Temporary development code is removed.
- [ ] No hard-coded secrets exist.
- [ ] No unnecessary magic numbers exist.
- [ ] Comments explain why rather than obvious syntax.
- [ ] Error handling is intentional.
- [ ] Exceptions are not silently swallowed.
- [ ] Logging is appropriate.
- [ ] Code follows project conventions.
- [ ] Existing behavior is preserved unless intentionally changed.

---

# 8. Architecture Review

Every significant change must be reviewed against the approved modular-monolith architecture.

Reviewer should verify:

- [ ] Correct module owns the behavior.
- [ ] Module boundaries are respected.
- [ ] No unnecessary cross-module database manipulation exists.
- [ ] Data ownership is respected.
- [ ] Business logic is not incorrectly placed in controllers.
- [ ] Controllers remain thin.
- [ ] Application/service layer coordinates use cases.
- [ ] Domain logic remains close to the relevant domain.
- [ ] Repositories handle persistence concerns.
- [ ] DTOs are used at API boundaries.
- [ ] JPA entities are not exposed directly as API contracts.
- [ ] No unnecessary abstraction has been introduced.
- [ ] No premature microservice architecture has been introduced.
- [ ] Existing architecture is not bypassed for convenience.

---

# 9. Module Ownership Review

Reviewers must verify that each module modifies only data and behavior it owns.

### College Management

Owns:

- colleges
- college lifecycle
- college configuration where applicable

### Student Management

Owns:

- student identity
- student profile
- student academic association

### Academic Structure

Owns:

- university references
- courses/programs
- semesters
- subjects
- academic structure

### Result Import

Owns:

- import jobs
- uploaded source processing
- normalized import records
- import-specific errors

### Result Validation

Owns:

- validation status
- validation errors
- validation warnings

### Result Processing

Owns:

- authoritative academic result mutation
- attempt history
- processing state
- authoritative academic calculations where approved

### Backlog Tracking

Owns:

- backlog lifecycle
- backlog state
- backlog resolution references

### Academic Passport

Owns:

- read-oriented academic representation where implemented as a projection/read model

It must not become an independent academic source of truth.

### Analytics

Owns:

- derived analytics queries
- aggregations
- reporting projections where applicable

### Student Portal

Owns:

- student-facing presentation and access behavior

It must not become a second source of academic truth.

---

# 10. Authentication Review

For authentication-related changes:

- [ ] Identity is authenticated correctly.
- [ ] Authentication failures are handled safely.
- [ ] Passwords are never stored in plaintext.
- [ ] Password-related responses do not expose sensitive information.
- [ ] Session/token behavior follows the approved authentication design.
- [ ] Logout invalidates the required authentication state.
- [ ] Current-user endpoint returns only authorized information.
- [ ] Account status is checked.
- [ ] Disabled/suspended accounts cannot perform unauthorized operations.
- [ ] Failed-login protections are preserved.
- [ ] Authentication events are auditable where required.

---

# 11. Authorization Review

Authentication alone is insufficient.

Reviewer must verify:

- [ ] Every protected endpoint has authorization.
- [ ] Role permissions are enforced server-side.
- [ ] Frontend visibility is not treated as authorization.
- [ ] Users cannot invoke unauthorized APIs directly.
- [ ] Resource ownership is verified.
- [ ] Role escalation is prevented.
- [ ] Student users cannot perform administrative actions.
- [ ] College users cannot access unauthorized colleges.
- [ ] SUPER_ADMIN-only operations remain protected.

---

# 12. Tenant Isolation Review

Tenant isolation is a critical Acadlytic security requirement.

For every college-scoped operation:

- [ ] Tenant context is derived from trusted authentication context.
- [ ] Tenant identity is not trusted from arbitrary request parameters.
- [ ] Repository queries enforce tenant boundaries.
- [ ] Service-layer authorization verifies tenant access.
- [ ] Resource IDs cannot be used to cross tenant boundaries.
- [ ] List endpoints do not return another college's data.
- [ ] Detail endpoints reject cross-tenant access.
- [ ] Update endpoints reject cross-tenant access.
- [ ] Delete/deactivation operations reject cross-tenant access.
- [ ] Analytics filters cannot bypass tenant boundaries.
- [ ] Student `/me` endpoints remain tenant-safe.
- [ ] Background jobs preserve tenant context.

### Critical rule

Never approve code that effectively implements:

```text
findById(id)
```

when authorization requires:

```text
findByIdAndCollegeId(id, tenantId)
```

or equivalent verified ownership logic.

---

# 13. IDOR Review

For every endpoint containing an identifier:

```text
/{id}
```

or:

```text
/{studentId}
/{collegeId}
/{importId}
/{courseId}
```

reviewers must ask:

> What prevents a user from replacing this ID with another user's or another college's ID?

Verify:

- [ ] Resource ownership is checked.
- [ ] Tenant boundary is checked.
- [ ] Role permission is checked.
- [ ] The response does not leak unauthorized information.
- [ ] Update/delete operations perform the same checks.
- [ ] Nested resources cannot bypass authorization.

---

# 14. Backend Review

## Controller

Verify:

- [ ] Controller handles HTTP concerns only.
- [ ] Request validation is applied.
- [ ] Authorization is enforced.
- [ ] DTOs are used.
- [ ] HTTP status codes are correct.
- [ ] Business logic is not unnecessarily embedded in controllers.
- [ ] Errors use the standard error format.

---

## Service

Verify:

- [ ] Service represents a meaningful use case.
- [ ] Business rules are explicit.
- [ ] Transaction boundaries are appropriate.
- [ ] Authorization assumptions are validated.
- [ ] Tenant context is preserved.
- [ ] Domain invariants are protected.
- [ ] External operations are handled safely.
- [ ] Retry behavior is considered where necessary.

---

## Repository

Verify:

- [ ] Query matches the actual use case.
- [ ] Tenant filtering is present where required.
- [ ] Indexes support important queries.
- [ ] N+1 queries are avoided.
- [ ] Pagination is used for large collections.
- [ ] Fetch strategy is intentional.
- [ ] No unnecessary native SQL exists.
- [ ] Native SQL is justified when used.

---

# 15. DTO Review

Verify:

- [ ] API request DTOs contain only required input.
- [ ] API response DTOs contain only required output.
- [ ] Sensitive fields are not exposed.
- [ ] Entity objects are not returned directly.
- [ ] Validation annotations are appropriate.
- [ ] DTO naming is consistent.
- [ ] Backward compatibility is considered for public API contracts.

---

# 16. Validation Review

Input validation must happen at appropriate boundaries.

Verify:

- [ ] Required fields are validated.
- [ ] Length constraints are defined.
- [ ] Numeric ranges are validated.
- [ ] Enum values are validated.
- [ ] IDs are validated.
- [ ] File type/size is validated.
- [ ] Business rules are validated server-side.
- [ ] Validation failures return stable error information.
- [ ] Client-side validation does not replace server-side validation.

---

# 17. Exception Handling Review

Verify:

- [ ] Expected business errors are represented consistently.
- [ ] Global exception handling is used.
- [ ] Internal stack traces are not exposed to users.
- [ ] Sensitive implementation details are not returned.
- [ ] HTTP status codes match the failure type.
- [ ] Errors contain stable machine-readable codes where required.
- [ ] Unexpected exceptions are logged appropriately.
- [ ] Errors do not silently cause partial academic mutations.

---

# 18. Transaction Review

Transactions require special attention when academic data changes.

Verify:

- [ ] Transaction boundary covers the complete required mutation.
- [ ] Partial updates cannot leave inconsistent academic state.
- [ ] Result persistence and dependent backlog updates are coordinated.
- [ ] Calculation updates are consistent with processed results.
- [ ] Passport updates cannot expose incomplete state.
- [ ] Failures roll back where required.
- [ ] External calls are not unnecessarily placed inside long transactions.
- [ ] Batch operations are designed safely.

---

# 19. Academic Data Integrity Review

This is one of the highest-priority review areas.

For academic mutations verify:

- [ ] Only validated data becomes authoritative.
- [ ] Invalid records cannot be processed.
- [ ] Student identity is correctly matched.
- [ ] Subject identity is correctly matched.
- [ ] Academic context is correct.
- [ ] Attempts are preserved.
- [ ] Historical results are not silently overwritten.
- [ ] Regular/supplementary distinction is preserved.
- [ ] Missing values are not converted to zero without explicit semantics.
- [ ] Failed results are not incorrectly treated as passes.
- [ ] Pass results do not incorrectly erase history.
- [ ] Backlog state follows authoritative result processing.
- [ ] SGPA/CGPA calculations use approved rules.
- [ ] No university-specific formula is invented by the implementation.
- [ ] Source traceability is preserved where required.

---

# 20. Result Import Review

For result-import changes:

- [ ] File size is restricted.
- [ ] Allowed file types are restricted.
- [ ] File content is validated.
- [ ] File names are not trusted.
- [ ] File paths are not user-controlled.
- [ ] Uploaded files cannot execute server-side.
- [ ] Parsing failures are handled safely.
- [ ] Headers are mapped explicitly.
- [ ] Raw values are not silently transformed into authoritative values.
- [ ] Unknown students are flagged rather than automatically created.
- [ ] Unknown subjects are flagged rather than automatically created.
- [ ] Duplicate detection is applied.
- [ ] Import status transitions are valid.
- [ ] Long-running processing is asynchronous where appropriate.
- [ ] Import history is preserved.

---

# 21. Result Validation Review

Verify the validation pipeline preserves the approved order:

```text
Required Fields
      ↓
Student Identity
      ↓
Student Context
      ↓
Subject Identity
      ↓
Academic Context
      ↓
Result Values
      ↓
Attempt
      ↓
Duplicate
      ↓
Business Rules
```

Review:

- [ ] Validation status is explicit.
- [ ] Errors and warnings are distinguishable.
- [ ] Validation does not mutate authoritative academic records.
- [ ] Missing and zero values are distinguished.
- [ ] Student matching is deterministic.
- [ ] Subject matching is deterministic.
- [ ] Duplicate rules are deterministic.
- [ ] Validation results are reproducible.

---

# 22. Result Processing Review

Result Processing is an authoritative mutation boundary.

Verify:

- [ ] Only eligible validated records are processed.
- [ ] Server re-checks processing eligibility.
- [ ] Processing is transactional.
- [ ] Processing is idempotent.
- [ ] Duplicate authoritative records cannot be created.
- [ ] Historical attempts remain available.
- [ ] Regular/supplementary information is preserved.
- [ ] Backlog state is updated correctly.
- [ ] SGPA/CGPA updates follow approved academic rules.
- [ ] Passport representation remains consistent.
- [ ] Analytics reads the authoritative result state.
- [ ] Processing is auditable.
- [ ] Retry behavior is safe.
- [ ] Concurrent processing cannot corrupt state.

---

# 23. Backlog Review

Verify:

- [ ] Backlog is derived from authoritative academic results.
- [ ] Manual unrestricted backlog creation is not introduced.
- [ ] Failed attempts open or preserve backlog.
- [ ] Passing attempt resolves the appropriate backlog.
- [ ] Attempt history remains intact.
- [ ] Multiple attempts are represented correctly.
- [ ] Backlog state is not duplicated independently of source results.
- [ ] Student/subject/academic context is preserved.
- [ ] Tenant isolation is enforced.

---

# 24. Academic Passport Review

Verify:

- [ ] Passport is read-oriented.
- [ ] Passport does not become a second source of truth.
- [ ] Results come from authoritative academic data.
- [ ] Backlog information comes from the backlog domain.
- [ ] Student profile information comes from the correct owner.
- [ ] Attempts remain visible where required.
- [ ] SGPA/CGPA values are consistent.
- [ ] Credits are represented correctly.
- [ ] Unauthorized students cannot view another student's Passport.
- [ ] Passport remains consistent after result processing.

---

# 25. Analytics Review

Analytics must explain authoritative data rather than redefine it.

Verify:

- [ ] Analytics uses processed academic data.
- [ ] Unprocessed imports are excluded.
- [ ] Missing values are not treated as zero.
- [ ] Attempts and unique students are distinguished.
- [ ] Duplicate counting is prevented.
- [ ] Filters are tenant-safe.
- [ ] Aggregations are mathematically correct.
- [ ] SGPA/CGPA are not independently recalculated without approved reason.
- [ ] Backlog metrics use the correct lifecycle state.
- [ ] Small-group data exposure is considered where relevant.
- [ ] Large queries are optimized.
- [ ] Pagination is used where applicable.

---

# 26. Database Review

For schema/query changes:

- [ ] Table ownership is clear.
- [ ] Foreign keys are correct.
- [ ] Unique constraints are appropriate.
- [ ] Required fields are `NOT NULL` where appropriate.
- [ ] Indexes support important queries.
- [ ] Tenant-related indexes are considered.
- [ ] Academic identifiers have appropriate uniqueness rules.
- [ ] Cascading behavior is intentional.
- [ ] Historical data is preserved.
- [ ] Destructive migrations are avoided unless explicitly approved.
- [ ] Migration is reversible where practical.
- [ ] Existing production data is considered.
- [ ] Migration performance is considered.
- [ ] No silent data truncation can occur.

---

# 27. Database Migration Review

Every migration should answer:

1. What changes?
2. Why is it required?
3. Which existing records are affected?
4. Is data transformation required?
5. Can the migration fail halfway?
6. What happens if deployment is rolled back?
7. Are indexes/constraints safe for existing data?
8. Could the migration lock a large production table?
9. Is a backfill required?
10. Has the migration been tested against realistic data?

Never approve a migration that can silently destroy academic history.

---

# 28. API Review

Verify:

- [ ] API follows `/api/v1`.
- [ ] Endpoint naming follows REST conventions.
- [ ] HTTP method is appropriate.
- [ ] Status codes are correct.
- [ ] Request DTO is appropriate.
- [ ] Response DTO is appropriate.
- [ ] Pagination is implemented for large lists.
- [ ] Filtering is validated.
- [ ] Sorting is validated.
- [ ] Search behavior is defined.
- [ ] Authorization is enforced.
- [ ] Tenant isolation is enforced.
- [ ] Errors use standard structure.
- [ ] Long-running operations use asynchronous behavior where required.
- [ ] Idempotency is considered for retryable mutations.
- [ ] API documentation is updated.

---

# 29. API Backward Compatibility

For existing APIs:

- [ ] Existing response fields are not unexpectedly removed.
- [ ] Existing semantics are not silently changed.
- [ ] New required request fields are carefully introduced.
- [ ] Clients are considered before breaking changes.
- [ ] Versioning is used when necessary.
- [ ] API documentation reflects the actual implementation.

---

# 30. Frontend Review

Verify:

- [ ] Component follows the feature-oriented architecture.
- [ ] Business logic is not unnecessarily duplicated in components.
- [ ] API calls use the service/data-access layer.
- [ ] Server state uses the approved query mechanism.
- [ ] Client state is used only where necessary.
- [ ] Forms use the approved validation strategy.
- [ ] Loading states exist.
- [ ] Empty states exist.
- [ ] Error states exist.
- [ ] Success feedback is appropriate.
- [ ] Unauthorized behavior is handled.
- [ ] Responsive behavior is implemented.
- [ ] Keyboard interaction works.
- [ ] Focus states are visible.
- [ ] Accessible names are present.
- [ ] No sensitive data is unnecessarily stored in browser storage.

---

# 31. React Review

Verify:

- [ ] Components have clear responsibilities.
- [ ] Props are typed.
- [ ] State is minimized.
- [ ] Derived values are not unnecessarily duplicated in state.
- [ ] Effects are used only when required.
- [ ] Effects have correct dependencies.
- [ ] Lists have stable keys.
- [ ] API requests are not duplicated unnecessarily.
- [ ] Query invalidation is correct.
- [ ] Loading/error states are consistent.
- [ ] Unmounted/stale request behavior is considered.
- [ ] Large lists are handled efficiently.
- [ ] Accessibility is preserved.

---

# 32. UI/UX Review

Verify:

- [ ] UI follows the approved design system.
- [ ] Action hierarchy is clear.
- [ ] Destructive actions require appropriate confirmation.
- [ ] Form validation is understandable.
- [ ] Error messages explain what the user can do.
- [ ] Tables remain usable on smaller screens.
- [ ] Import/validation/processing states are understandable.
- [ ] Empty states are meaningful.
- [ ] Loading states do not cause confusing layout shifts.
- [ ] No unnecessary animations are introduced.
- [ ] Reduced-motion preferences are respected where relevant.

---

# 33. Accessibility Review

Verify:

- [ ] Keyboard navigation works.
- [ ] Focus is visible.
- [ ] Interactive elements are keyboard accessible.
- [ ] Buttons use button elements.
- [ ] Links use link elements.
- [ ] Form fields have accessible labels.
- [ ] Error messages are associated with fields where appropriate.
- [ ] Dialogs manage focus correctly.
- [ ] ARIA attributes are used only when needed.
- [ ] `aria-expanded` reflects actual state.
- [ ] `aria-controls` references valid controlled elements.
- [ ] Color is not the only indicator of state.
- [ ] Charts have accessible alternatives where appropriate.
- [ ] Tables have appropriate semantics.

---

# 34. Responsive Review

Test relevant pages at:

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

Verify:

- [ ] No horizontal page overflow.
- [ ] Navigation works.
- [ ] Tables remain usable.
- [ ] Forms remain usable.
- [ ] Modals/drawers fit the viewport.
- [ ] Charts remain readable.
- [ ] Touch targets are usable.
- [ ] Long academic identifiers do not break layout.
- [ ] Result import screens remain functional.
- [ ] Student Passport remains readable.

---

# 35. Security Review

For every significant PR:

- [ ] Authentication reviewed.
- [ ] Authorization reviewed.
- [ ] Tenant isolation reviewed.
- [ ] IDOR reviewed.
- [ ] Input validation reviewed.
- [ ] SQL injection risk reviewed.
- [ ] XSS risk reviewed.
- [ ] CSRF implications reviewed.
- [ ] CORS reviewed where relevant.
- [ ] File upload security reviewed.
- [ ] Secrets reviewed.
- [ ] Sensitive logging reviewed.
- [ ] Error responses reviewed.
- [ ] Dependency changes reviewed.
- [ ] Rate limiting considered where appropriate.

Critical security findings block approval.

---

# 36. File Upload Review

For any file upload feature:

- [ ] Extension validation exists.
- [ ] MIME/content validation exists where appropriate.
- [ ] File size limit exists.
- [ ] File name is sanitized.
- [ ] Storage path is controlled by the server.
- [ ] Uploaded files cannot execute.
- [ ] Temporary files are cleaned up.
- [ ] Parser failures are safely handled.
- [ ] Malformed files do not crash the application.
- [ ] ZIP/XML/parser-related risks are considered where relevant.
- [ ] Uploaded data cannot bypass academic validation.

---

# 37. Logging Review

Verify logs:

- [ ] contain enough information for troubleshooting
- [ ] include correlation/request identifiers where appropriate
- [ ] record important processing failures
- [ ] record important security events
- [ ] avoid passwords
- [ ] avoid tokens
- [ ] avoid unnecessary personal data
- [ ] avoid full uploaded academic files
- [ ] avoid exposing secrets

Logging must support troubleshooting without becoming a data-leak mechanism.

---

# 38. Audit Review

Audit events should be considered for:

- user provisioning
- role changes
- college lifecycle changes
- important academic processing
- result processing
- backlog-changing academic operations
- security-sensitive actions
- configuration changes
- administrative actions

Verify:

- [ ] actor is identifiable
- [ ] timestamp exists
- [ ] action is clear
- [ ] target/resource is identifiable
- [ ] tenant context is available where appropriate
- [ ] outcome is recorded
- [ ] sensitive information is not unnecessarily captured

---

# 39. Performance Review

Review performance when changes affect:

- large student datasets
- result imports
- result validation
- result processing
- analytics
- tables
- dashboards
- file parsing
- database queries

Verify:

- [ ] N+1 queries are avoided.
- [ ] Pagination is used.
- [ ] Large files are processed safely.
- [ ] Batch processing is considered.
- [ ] Appropriate indexes exist.
- [ ] Expensive queries are reviewed.
- [ ] Frontend rendering is reasonable.
- [ ] Unnecessary network requests are avoided.
- [ ] Background processing is used for long-running tasks.

---

# 40. Concurrency Review

For state-changing academic operations:

- [ ] Duplicate requests are considered.
- [ ] Idempotency is implemented where required.
- [ ] Unique constraints support correctness.
- [ ] Concurrent result processing is safe.
- [ ] Concurrent imports are safe.
- [ ] Race conditions are considered.
- [ ] Optimistic/pessimistic locking is used when justified.
- [ ] Retry behavior does not duplicate academic data.

---

# 41. Testing Review

Every code change should have appropriate tests.

Verify:

- [ ] Unit tests exist where business logic warrants them.
- [ ] Integration tests exist where module interaction matters.
- [ ] API tests exist for important endpoints.
- [ ] Security tests exist for authorization-sensitive changes.
- [ ] Tenant-isolation tests exist where applicable.
- [ ] Database tests exist for persistence behavior.
- [ ] Frontend tests exist for important UI behavior.
- [ ] Regression tests exist for fixed bugs.
- [ ] Edge cases are tested.
- [ ] Failure paths are tested.
- [ ] Tests are deterministic.
- [ ] Tests do not depend unnecessarily on external systems.

---

# 42. Academic Calculation Review

Any change affecting SGPA, CGPA, grades, credits, or percentages requires elevated review.

Reviewer must verify:

- [ ] Formula source is defined.
- [ ] University/regulation context is known.
- [ ] No formula has been invented.
- [ ] Rounding rules are explicit.
- [ ] Missing values are handled correctly.
- [ ] Failed subjects are handled according to approved rules.
- [ ] Repeated attempts are handled correctly.
- [ ] Credits are interpreted correctly.
- [ ] Historical results remain available.
- [ ] Test cases cover boundary values.

If the required academic rule is not defined, implementation should not guess.

---

# 43. Result Processing Review Gate

Before approving result-processing changes, confirm:

```text
Import
  ↓
Normalization
  ↓
Validation
  ↓
Eligible Records
  ↓
Processing
  ↓
Authoritative Results
  ↓
Backlog Update
  ↓
Academic Calculations
  ↓
Passport/Analytics Availability
```

Every stage must preserve the correctness of the next stage.

---

# 44. Analytics Review Gate

Before approving analytics changes:

- [ ] Source data is identified.
- [ ] Metric definition is documented.
- [ ] Population is defined.
- [ ] Time period is defined.
- [ ] Attempt semantics are defined.
- [ ] Unique-student semantics are defined.
- [ ] Missing data behavior is defined.
- [ ] Duplicate behavior is tested.
- [ ] Tenant filtering is tested.
- [ ] Results are compared against known expected values.

---

# 45. Refactoring Review

Refactoring must not be approved merely because the code looks cleaner.

Verify:

- [ ] Existing behavior is preserved.
- [ ] Tests prove behavioral preservation.
- [ ] Security behavior remains intact.
- [ ] API behavior remains compatible.
- [ ] Tenant isolation remains intact.
- [ ] Academic history remains intact.
- [ ] Database behavior remains safe.
- [ ] Performance has not materially regressed.
- [ ] Refactoring scope is controlled.

---

# 46. Dependency Review

For new or updated dependencies:

- [ ] Dependency is necessary.
- [ ] Existing dependency cannot reasonably solve the problem.
- [ ] Version is appropriate.
- [ ] License is acceptable.
- [ ] Known security vulnerabilities are reviewed.
- [ ] Maintenance status is acceptable.
- [ ] Bundle/runtime impact is considered.
- [ ] Dependency does not create unnecessary architectural coupling.

Avoid adding libraries for trivial functionality.

---

# 47. Configuration Review

Verify:

- [ ] Environment-specific configuration is separated.
- [ ] Secrets are externalized.
- [ ] Production credentials are not committed.
- [ ] Development defaults are safe.
- [ ] CORS configuration is appropriate.
- [ ] Database configuration is environment-specific.
- [ ] File-storage configuration is environment-specific.
- [ ] External integration credentials are protected.
- [ ] Logging configuration is appropriate for the environment.

---

# 48. Background Job Review

For asynchronous jobs:

- [ ] Job state is persisted appropriately.
- [ ] Job ownership/tenant context is preserved.
- [ ] Retry behavior is defined.
- [ ] Duplicate execution is safe.
- [ ] Failure state is visible.
- [ ] Job can be diagnosed.
- [ ] Long-running operations do not block web requests unnecessarily.
- [ ] Job authorization is enforced.
- [ ] Job identifiers cannot expose another tenant's job.

---

# 49. API and Frontend Contract Review

When backend and frontend change together:

- [ ] Request schema matches frontend usage.
- [ ] Response schema matches frontend expectations.
- [ ] Error schema is handled.
- [ ] Loading behavior is correct.
- [ ] Empty response behavior is correct.
- [ ] Pagination metadata is handled.
- [ ] Authorization failures are handled.
- [ ] API version remains correct.
- [ ] OpenAPI documentation is updated where required.

---

# 50. Documentation Review

A code change should update documentation when it changes:

- API behavior
- database structure
- business rules
- architecture
- security behavior
- user workflow
- configuration
- deployment
- testing requirements

Documentation should describe actual behavior, not intended behavior that the code does not implement.

---

# 51. AI-Assisted Code Review

AI-generated code must receive the same review standard as manually written code.

Never approve AI-generated code solely because:

- it compiles
- it looks professional
- tests pass superficially
- an AI tool recommended it
- it uses familiar patterns

Reviewer must independently verify:

- architecture
- security
- authorization
- tenant isolation
- academic logic
- transaction behavior
- database behavior
- error handling
- performance
- test correctness

AI must not invent:

- university rules
- academic formulas
- authorization rules
- database ownership
- business requirements
- security exceptions

---

# 52. AI Coding Review Questions

For AI-assisted changes ask:

1. What assumption did the generated code make?
2. Is that assumption documented?
3. Could the assumption affect academic correctness?
4. Could the implementation bypass authorization?
5. Could an IDOR vulnerability exist?
6. Could another tenant's data be returned?
7. Could a retry duplicate academic data?
8. Could historical attempts be lost?
9. Could missing data be misinterpreted?
10. Did the AI introduce unnecessary dependencies?
11. Did it modify unrelated files?
12. Did it silently change existing behavior?

---

# 53. Code Review Checklist by Risk

## Critical Risk

Always inspect manually:

- authentication
- authorization
- tenant isolation
- result processing
- academic calculations
- database migrations
- file uploads
- security configuration
- production configuration

## High Risk

Review carefully:

- analytics
- backlog lifecycle
- Passport
- concurrency
- background jobs
- API contracts
- data imports

## Medium Risk

Review normally:

- CRUD
- forms
- UI components
- filters
- search
- pagination

## Lower Risk

Still review:

- styling
- copy changes
- documentation
- non-functional UI changes

Risk classification never eliminates review.

---

# 54. Review of Bug Fixes

For a bug fix:

- [ ] Bug is reproducible or evidence exists.
- [ ] Root cause is identified.
- [ ] Fix addresses root cause.
- [ ] Regression test exists.
- [ ] Existing behavior is not unintentionally changed.
- [ ] Related edge cases are tested.
- [ ] Academic data is verified if applicable.
- [ ] Security implications are checked.
- [ ] Bug-tracking status is updated.

A symptom-only fix should not be approved when the underlying defect remains.

---

# 55. Review of Security Fixes

For security fixes:

- [ ] Attack scenario is understood.
- [ ] Vulnerable path is identified.
- [ ] Fix blocks the attack.
- [ ] Alternative attack paths are checked.
- [ ] Regression tests are added.
- [ ] Existing authorization remains correct.
- [ ] Tenant isolation remains correct.
- [ ] Logging/audit behavior is appropriate.
- [ ] Sensitive information is not exposed during error handling.

---

# 56. Review of Database Changes

Before approval:

- [ ] Schema ownership is correct.
- [ ] Migration tested.
- [ ] Existing data tested.
- [ ] Constraints verified.
- [ ] Indexes verified.
- [ ] Query performance considered.
- [ ] Rollback strategy considered.
- [ ] Production impact considered.
- [ ] Academic history preservation verified.

---

# 57. Review of API Changes

Before approval:

- [ ] Endpoint follows API architecture.
- [ ] Authentication required where appropriate.
- [ ] Authorization verified.
- [ ] Tenant isolation verified.
- [ ] Request validation verified.
- [ ] Response data verified.
- [ ] Error behavior verified.
- [ ] Pagination/filtering verified.
- [ ] OpenAPI updated.
- [ ] Tests added.
- [ ] Breaking changes identified.

---

# 58. Review of Frontend Changes

Before approval:

- [ ] Correct route.
- [ ] Correct role visibility.
- [ ] Correct API service.
- [ ] Correct query key.
- [ ] Correct cache invalidation.
- [ ] Correct loading state.
- [ ] Correct error state.
- [ ] Correct empty state.
- [ ] Responsive layout.
- [ ] Accessibility.
- [ ] No unauthorized information exposed.
- [ ] No business-rule enforcement relies only on frontend.

---

# 59. Review Comment Guidelines

Review comments should be:

- specific
- actionable
- technically justified
- respectful
- proportional to severity

Good:

> This query filters by `studentId` but does not verify the student's college. A user could potentially access another tenant's record. Please enforce tenant ownership before returning the resource.

Weak:

> Security issue.

Reviewers should explain:

1. what is wrong
2. why it matters
3. what behavior is expected

---

# 60. Reviewer Questions

Before approval, ask:

### Correctness

> Does the implementation actually satisfy the requirement?

### Architecture

> Is the behavior implemented in the correct module?

### Security

> Can an unauthorized user invoke this behavior?

### Tenant Isolation

> Can another college's data be accessed?

### Academic Integrity

> Can this change create incorrect academic data?

### History

> Can existing academic history be lost or overwritten?

### Reliability

> What happens if the request fails halfway?

### Retry

> What happens if the same request is submitted twice?

### Concurrency

> What happens if two requests run simultaneously?

### Performance

> What happens with 100,000 students?

### Maintainability

> Will another developer understand this six months later?

### Testing

> What proves that this behavior works?

---

# 61. Reviewer Approval Conditions

A reviewer should approve only when:

- requirements are satisfied
- architecture is respected
- security is acceptable
- tenant isolation is verified
- academic data integrity is preserved
- appropriate tests exist
- critical findings are resolved
- documentation is updated where required
- no unexplained high-risk behavior remains

Approval means the reviewer accepts responsibility for the reviewed change at the expected level of review.

---

# 62. Reviewer Rejection Conditions

Do not approve when:

- requirements are unclear and implementation guesses
- authorization is missing
- tenant isolation is uncertain
- academic calculations are invented
- result processing can corrupt data
- migration can destroy data
- critical tests fail
- security vulnerability remains
- code bypasses module ownership
- sensitive information is exposed
- behavior is undocumented and high-risk
- implementation significantly exceeds approved scope without review

---

# 63. Code Review Workflow

Recommended workflow:

```text
Developer Creates Change
        ↓
Developer Self-Review
        ↓
Automated Checks
        ↓
Pull Request
        ↓
Reviewer Analysis
        ↓
Comments / Findings
        ↓
Developer Fixes Issues
        ↓
Automated Checks Again
        ↓
Reviewer Re-check
        ↓
Approval
        ↓
Merge
        ↓
Post-Merge Verification
```

---

# 64. Developer Self-Review

Before requesting review, the developer should verify:

- [ ] Requirements understood.
- [ ] Correct module selected.
- [ ] No unrelated changes included.
- [ ] Code formatted.
- [ ] Tests pass.
- [ ] New tests added.
- [ ] Security reviewed.
- [ ] Tenant isolation reviewed.
- [ ] Academic integrity reviewed.
- [ ] Database migration tested.
- [ ] Logs reviewed.
- [ ] Debug code removed.
- [ ] Documentation updated.
- [ ] Git diff inspected.

---

# 65. Automated Review Gates

Where configured, CI should verify:

```text
Build
 ↓
Unit Tests
 ↓
Integration Tests
 ↓
Static Analysis
 ↓
Dependency/Security Checks
 ↓
Frontend Checks
 ↓
Backend Checks
 ↓
Migration Validation
 ↓
Packaging
```

A failed critical automated check should normally block merge.

---

# 66. Review Checklist — Quick Version

Use this checklist for routine pull requests:

```text
[ ] Requirement satisfied
[ ] Correct module ownership
[ ] Architecture respected
[ ] Authentication checked
[ ] Authorization checked
[ ] Tenant isolation checked
[ ] IDOR checked
[ ] Validation checked
[ ] Error handling checked
[ ] Transaction boundaries checked
[ ] Academic data integrity checked
[ ] Historical data preserved
[ ] Idempotency checked
[ ] Concurrency considered
[ ] Database changes reviewed
[ ] API contract reviewed
[ ] Frontend behavior reviewed
[ ] Responsive behavior reviewed
[ ] Accessibility reviewed
[ ] Security reviewed
[ ] Performance considered
[ ] Tests added/updated
[ ] Regression coverage added
[ ] Documentation updated
[ ] No unrelated changes
[ ] CI passes
[ ] No blocking findings
```

---

# 67. Feature-Specific Review Matrix

| Feature | Security | Tenant | Academic Integrity | Tests | Performance |
|---|---|---|---|---|---|
| Authentication | Critical | High | Medium | Critical | Medium |
| College Management | Critical | Critical | Medium | High | Medium |
| Academic Structure | High | Critical | Critical | Critical | Medium |
| Student Management | Critical | Critical | Critical | Critical | High |
| Result Import | Critical | Critical | Critical | Critical | High |
| Result Validation | High | Critical | Critical | Critical | High |
| Result Processing | Critical | Critical | Critical | Critical | Critical |
| Backlogs | Critical | Critical | Critical | Critical | High |
| Academic Passport | Critical | Critical | Critical | High | High |
| Analytics | Critical | Critical | Critical | Critical | Critical |
| Student Portal | Critical | Critical | High | High | Medium |

---

# 68. Academic Data Integrity Gate

Any change that can affect academic data must pass this gate.

The reviewer must be able to answer **yes** to all applicable questions:

- [ ] Is the source of truth respected?
- [ ] Is the correct student identified?
- [ ] Is the correct academic context identified?
- [ ] Are subject identities correct?
- [ ] Are attempts preserved?
- [ ] Are missing values preserved correctly?
- [ ] Are duplicates controlled?
- [ ] Are transactions safe?
- [ ] Is retry behavior safe?
- [ ] Is tenant isolation preserved?
- [ ] Are calculations based on approved rules?
- [ ] Can the result be traced to its source?
- [ ] Are affected Passport and analytics views consistent?

If any critical answer is **no**, the change should not be approved.

---

# 69. Security Gate

A change affecting security-sensitive behavior must pass:

```text
Authentication
      +
Authorization
      +
Tenant Isolation
      +
IDOR Protection
      +
Input Validation
      +
Secure Error Handling
      +
Auditability
      +
Security Tests
```

Critical security findings block release.

---

# 70. Definition of Done for Code Review

A code change is considered review-complete when:

- [ ] Implementation satisfies approved requirements.
- [ ] Code follows project architecture.
- [ ] Correct module owns the behavior.
- [ ] Authentication and authorization are correct.
- [ ] Tenant isolation is verified.
- [ ] Academic integrity is preserved.
- [ ] Tests are sufficient.
- [ ] Security concerns are addressed.
- [ ] Database changes are safe.
- [ ] API contracts are correct.
- [ ] Frontend behavior is correct where applicable.
- [ ] Responsive/accessibility requirements are satisfied where applicable.
- [ ] Performance is acceptable.
- [ ] Documentation is updated where required.
- [ ] CI checks pass.
- [ ] Blocking and major findings are resolved.
- [ ] Reviewer approves the final implementation.

---

# 71. Unresolved Decisions

The following may require project-level decisions before implementation becomes final:

1. Required number of reviewers for critical academic/security changes.
2. Whether CODEOWNERS will be used.
3. Required CI quality gates.
4. Static analysis tool selection.
5. Backend code-quality tool selection.
6. Frontend linting/formatting tool configuration.
7. Dependency vulnerability scanning tool.
8. Required test coverage thresholds.
9. Branch protection rules.
10. Whether security-sensitive PRs require dedicated security review.
11. Whether database migration review requires a separate approval.
12. Production hotfix review procedure.
13. Emergency change approval process.
14. Automated architecture checks.
15. Required review evidence for production academic-data changes.

These decisions should be finalized before the project reaches production governance maturity.

---

# 72. Relationship With Other Documentation

This document should be used together with:

```text
07-project-rules/
├── coding-rules.md
├── frontend-rules.md
├── backend-rules.md
├── database-rules.md
├── security-rules.md
└── ai-coding-rules.md

09-development/
├── feature-specifications/
└── implementation-notes/

10-testing/
├── test-strategy.md
├── test-cases.md
└── bug-tracking.md

11-security/
└── security-review.md
```

Relationship:

```text
Requirements
      ↓
Architecture
      ↓
Implementation
      ↓
Code Review
      ↓
Testing
      ↓
Security Review
      ↓
QA
      ↓
Release
```

Code review does not replace testing or security review.

It connects implementation quality with those later verification stages.

---

# 73. Final Review Principle

The goal of code review is not to make code look perfect.

The goal is to ensure that the implementation is:

- correct
- secure
- maintainable
- testable
- architecturally consistent
- tenant-safe
- academically trustworthy
- operationally reliable

For Acadlytic, the most important question is:

> **Can this change be trusted with student academic data and still behave correctly when users, tenants, files, retries, failures, and real-world data become more complex?**

If the answer is not confidently yes, the change is not ready for approval.

---

## Document Status

**Status:** Draft / Under Review

This document should be reviewed against the final architecture, security model, testing strategy, CI/CD process, and team workflow before being marked **Approved**.