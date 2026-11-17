# Acadlytic — Integration Architecture

**Project:** Acadlytic  
**Document:** Integration Architecture  
**Version:** 1.0  
**Status:** Draft / Implementation Ready  

---

# 1. Purpose

This document defines the integration architecture of Acadlytic.

It describes how Acadlytic will communicate with:

- University result systems
- Excel/CSV result files
- Authorized university APIs
- Webhooks
- Email providers
- File/object storage
- Future notification providers
- Future external APIs
- Other third-party services

The primary architectural goal is:

> External integrations must remain isolated from Acadlytic's core business modules.

A university-specific integration must not require rewriting the Result Processing, Backlog Tracking, Academic Passport, or Analytics modules.

---

# 2. Integration Architecture Goals

The integration architecture must provide:

- loose coupling
- provider independence
- university-specific adapter support
- secure external communication
- predictable data normalization
- failure isolation
- retry support
- idempotency
- integration logging
- auditability
- extensibility
- tenant isolation
- backward compatibility

---

# 3. Core Integration Principle

Acadlytic should not directly couple its business logic to an external university system.

Incorrect:

```text
Result Processing
      ↓
OU Website/API Logic
      ↓
University System
```

Preferred:

```text
University System
      ↓
University Connector
      ↓
Common Result Format
      ↓
Result Import / Result Processing
```

The core academic modules should work with normalized Acadlytic data rather than university-specific formats.

---

# 4. Integration Architecture Overview

The overall architecture is:

```text
                    External Systems
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    University API      File Upload      Webhook
          │                │                │
          └────────────────┼────────────────┘
                           ↓
                 Integration Layer
                           │
                 ┌─────────┴─────────┐
                 │                   │
             Connectors          Adapters
                 │                   │
                 └─────────┬─────────┘
                           ↓
                    Normalization
                           ↓
                    Result Engine
                           ↓
              Acadlytic Core Modules
```

---

# 5. External Integration Categories

Acadlytic integrations can be divided into:

### Category 1 — Result Sources

- Excel
- CSV
- University API
- Authorized university feed
- Authorized webhook

### Category 2 — Infrastructure Services

- Object/file storage
- Email service
- Cache
- Background job infrastructure

### Category 3 — Future External Services

- Notification providers
- SMS
- WhatsApp
- Payment providers
- External reporting systems
- Public APIs

Only integrations required by the MVP should be implemented initially.

---

# 6. MVP Integration Scope

The MVP should support:

```text
Excel
CSV
```

for university result imports.

The MVP should not depend on direct university API integration.

Future integrations may include:

```text
University API
University Webhook
Authorized Feed
Email Provider
SMS Provider
Object Storage
```

---

# 7. File-Based Result Integration

The first integration mechanism is:

```text
University Result File
        ↓
Excel / CSV
        ↓
Upload
        ↓
Result Import
        ↓
Validation
        ↓
Processing
```

This provides a practical integration path even when a university does not expose an API.

---

# 8. Excel Integration

Acadlytic should support university result Excel files where their structure can be mapped to the Acadlytic result model.

Possible formats:

```text
.xlsx
.xls
```

The exact supported formats should be defined during implementation based on the selected Java libraries.

---

# 9. CSV Integration

CSV files should support:

- configurable column mapping
- encoding handling
- delimiter handling where required
- header validation
- row validation
- duplicate detection

The parser should not assume that every university uses the same CSV structure.

---

# 10. File Adapter

File-based imports should use an adapter abstraction.

Conceptually:

```text
File
 ↓
File Adapter
 ↓
Raw Result Records
 ↓
Normalized Result Records
```

Possible adapters:

```text
ExcelAdapter
CsvAdapter
```

---

# 11. University-Specific File Formats

Different universities may use different result structures.

Example:

```text
University A
Hall Ticket | Subject Code | Marks | Grade

University B
Student ID | Course | Subject | Internal | External | Result
```

The integration layer should convert these formats into a common internal representation.

---

# 12. Common Result Representation

The integration layer should produce a normalized result structure.

Conceptually:

```text
NormalizedResult
├── universityCode
├── resultReleaseId
├── studentIdentifier
├── courseCode
├── semester
├── academicYear
├── subjectCode
├── subjectName
├── marks
├── grade
├── gradePoint
├── resultStatus
└── attempt
```

The exact fields must follow the Result Import and Result Processing specifications.

---

# 13. University Connector Architecture

Future university integrations should implement a common connector contract.

Conceptually:

```java
public interface UniversityConnector {

    boolean supports(String universityCode);

    List<ResultRelease> fetchResultReleases();

    ResultData fetchResults(String resultReleaseId);

    ResultStatus getStatus(String resultReleaseId);
}
```

The interface is conceptual and may evolve during implementation.

---

# 14. University Connector Implementations

Examples:

```text
connectors/
├── ou/
│   └── OuConnector
├── jntuh/
│   └── JntuhConnector
└── generic/
    └── GenericFileConnector
```

A connector must contain university-specific integration logic.

---

# 15. Connector Responsibility

A university connector may be responsible for:

- authentication with the external system
- requesting result releases
- retrieving result data
- interpreting university-specific responses
- handling university-specific errors
- converting data to the common format

It should not be responsible for:

- updating backlogs
- calculating Acadlytic analytics
- updating Academic Passport
- deciding application-level authorization

Those responsibilities remain inside Acadlytic.

---

# 16. Connector Isolation

The connector should communicate with the external system through a defined boundary.

```text
External University
        ↓
University Connector
        ↓
Normalized Data
        ↓
Acadlytic Application
```

Core modules should not contain code such as:

```text
if university == OU
if university == JNTUH
if university == XYZ
```

throughout business logic.

University-specific branching should remain inside the integration layer.

---

# 17. Integration Registry

A connector registry may be used to locate the appropriate connector.

Conceptually:

```text
University Code
       ↓
Connector Registry
       ↓
Matching Connector
       ↓
External System
```

Example:

```text
OU → OUConnector
JNTUH → JNTUHConnector
```

---

# 18. Connector Selection

Connector selection should be based on a stable university identifier.

Preferred:

```text
university_id
university_code
```

Avoid using:

```text
university_name
```

as the primary connector selection key because names may change.

---

# 19. Authorized Integration Rule

Acadlytic should only integrate with university systems where the integration is:

- officially supported
- authorized
- permitted by the relevant institution
- technically accessible
- compliant with applicable rules

The architecture must not depend on bypassing:

- CAPTCHA
- authentication controls
- rate limits
- access restrictions
- security mechanisms

---

# 20. No Unauthorized Scraping

Unauthorized scraping must not be treated as a core integration strategy.

Reasons include:

- CAPTCHA
- authentication changes
- HTML structure changes
- rate limiting
- blocking
- reliability problems
- legal/contractual restrictions
- privacy concerns

If an authorized API or feed exists, it should be preferred.

---

# 21. University API Integration

A future university API integration may follow:

```text
Acadlytic Scheduler / User Action
             ↓
University Connector
             ↓
University API
             ↓
Raw Response
             ↓
Normalization
             ↓
Result Import Pipeline
```

The connector should not directly modify academic records.

---

# 22. API Authentication

University APIs may require:

- API keys
- OAuth
- client credentials
- signed requests
- institutional credentials

The selected authentication mechanism depends on the university integration.

Credentials must be stored securely.

---

# 23. Integration Credentials

External credentials must never be stored in:

- frontend source code
- Git repositories
- logs
- exception messages
- API responses

They should be stored using an appropriate secure server-side mechanism.

---

# 24. Tenant-Specific Integrations

A college may eventually have its own university integration configuration.

Conceptually:

```text
College
   ↓
University
   ↓
Integration Configuration
   ↓
Credential / Connection
   ↓
University Connector
```

The configuration must remain tenant-isolated.

---

# 25. Integration Configuration Ownership

Integration configuration belongs to the integration/domain configuration layer.

It should not be owned by:

- Student Management
- Backlog Tracking
- Academic Passport
- Analytics

Those modules consume the normalized academic data.

---

# 26. Webhook Integration

Future university systems may provide webhooks.

Example:

```text
University
    ↓
Webhook
    ↓
Acadlytic Webhook Endpoint
    ↓
Verify Request
    ↓
Create Integration Event
    ↓
Fetch / Process Result
```

The webhook should generally trigger processing rather than contain the complete academic processing logic itself.

---

# 27. Webhook Security

Webhook endpoints must validate:

- signature
- authentication
- timestamp where applicable
- event identity
- duplicate delivery

Never trust arbitrary webhook payloads.

---

# 28. Webhook Idempotency

Webhook events may be delivered more than once.

Therefore:

```text
Webhook Event
      ↓
Event ID
      ↓
Already Processed?
      ├── Yes → Ignore / Return Success
      └── No → Process
```

An external event must not create duplicate academic records.

---

# 29. Integration Events

Integration events can be represented conceptually as:

```text
IntegrationEvent
├── id
├── provider
├── eventType
├── externalEventId
├── receivedAt
├── status
├── payloadReference
└── processedAt
```

The exact database design belongs to `database-architecture.md`.

---

# 30. Raw External Data

External data should be preserved where useful for:

- debugging
- audit
- reprocessing
- traceability
- integration troubleshooting

However, sensitive information should be handled according to the project's security and retention policies.

---

# 31. Raw Data vs Normalized Data

The architecture distinguishes:

```text
Raw External Data
        ↓
Normalization
        ↓
Acadlytic Data
```

Raw external data is not automatically the application's authoritative academic record.

The normalized and successfully processed academic data becomes part of Acadlytic's authoritative domain model.

---

# 32. Result Integration Pipeline

The complete result integration pipeline is:

```text
University / File
       ↓
Connector / Adapter
       ↓
Raw Result Data
       ↓
Parsing
       ↓
Normalization
       ↓
Result Import
       ↓
Validation
       ↓
Processing
       ↓
Academic Records
       ↓
Backlogs
       ↓
Academic Passport
       ↓
Analytics
```

---

# 33. Integration and Result Import

The integration layer feeds the Result Import pipeline.

It should not bypass Result Import.

Preferred:

```text
University API
     ↓
Connector
     ↓
Result Import
     ↓
Validation
     ↓
Processing
```

Not:

```text
University API
     ↓
Direct Database Update
```

---

# 34. Integration and Result Validation

Integration adapters should perform structural normalization.

Result Validation remains responsible for application-level validation.

Example:

```text
Connector:
"PASS" → normalized result status

Validation:
Is PASS valid for this result context?
```

---

# 35. Integration and Result Processing

Result Processing remains responsible for:

- persisting processed results
- preserving attempts
- updating academic outcomes
- triggering backlog updates
- updating academic calculations
- updating Academic Passport
- maintaining processing integrity

The integration layer must not duplicate these responsibilities.

---

# 36. Integration Failure Isolation

An external integration failure should not corrupt the core database.

Example:

```text
University API unavailable
        ↓
Connector Failure
        ↓
Integration Job FAILED
        ↓
Retry / Manual Review
```

Existing academic records remain unchanged.

---

# 37. Retry Strategy

Temporary external failures may be retried.

Examples:

- timeout
- temporary network error
- HTTP 429
- temporary 5xx response

Permanent failures should not be retried indefinitely.

Examples:

- invalid credentials
- unsupported university
- invalid request
- revoked integration

---

# 38. Retry Policy

A future implementation may use exponential backoff.

Conceptually:

```text
Attempt 1
   ↓
Wait
   ↓
Attempt 2
   ↓
Longer Wait
   ↓
Attempt 3
```

The maximum retry count must be configurable.

---

# 39. Rate Limiting

External systems may impose rate limits.

Acadlytic integrations must respect:

- API request limits
- concurrency limits
- provider policies
- retry-after instructions

Do not aggressively retry a rate-limited provider.

---

# 40. Timeout Strategy

External requests must have bounded timeouts.

A university system that does not respond should not block application threads indefinitely.

Conceptually:

```text
Request
   ↓
Timeout
   ↓
Integration Failure
   ↓
Retry / Failure State
```

---

# 41. Integration Job

Long-running integrations should execute through background jobs.

Example:

```text
User / Scheduler
      ↓
Create Integration Job
      ↓
Background Worker
      ↓
Connector
      ↓
External System
      ↓
Result
```

The frontend should receive job status rather than waiting for the entire integration synchronously.

---

# 42. Integration Job Status

Possible statuses:

```text
PENDING
RUNNING
COMPLETED
COMPLETED_WITH_ERRORS
FAILED
CANCELLED
```

The final implementation may use the statuses defined by the relevant feature specifications.

---

# 43. Integration Job Tracking

An integration job should provide enough information to determine:

- what integration ran
- for which university
- for which college/tenant
- when it started
- when it finished
- what source was used
- number of records
- successful records
- failed records
- error summary
- current status

---

# 44. Integration Logging

Integration logs should capture useful operational information.

Example:

```text
Integration:
OU Connector

Job:
12345

Started:
10:00

Status:
FAILED

Reason:
External API timeout
```

Logs must not contain credentials or sensitive payloads unnecessarily.

---

# 45. Correlation ID

Integration operations should support correlation IDs.

Conceptually:

```text
User Request
     ↓
Correlation ID
     ↓
Integration Job
     ↓
Connector Request
     ↓
Logs
```

This allows developers to trace a failed integration.

---

# 46. Integration Audit

Security-sensitive integration actions should be auditable.

Possible events:

```text
INTEGRATION_CREATED
INTEGRATION_UPDATED
INTEGRATION_ENABLED
INTEGRATION_DISABLED
INTEGRATION_EXECUTED
INTEGRATION_FAILED
INTEGRATION_CREDENTIAL_UPDATED
```

The exact audit model follows the security architecture.

---

# 47. Integration and Tenant Isolation

Every tenant-specific integration must be isolated.

Example:

```text
College A
   ↓
Integration A
   ↓
University Connection A

College B
   ↓
Integration B
   ↓
University Connection B
```

College A must never access College B's integration configuration or credentials.

---

# 48. Integration Authorization

Only authorized roles should manage integrations.

For example:

```text
SUPER_ADMIN
    → Platform integration configuration

COLLEGE_ADMIN
    → Own college integration where permitted

ACADEMIC_STAFF
    → Execute authorized academic operations where permitted

STUDENT
    → No integration management
```

Exact permissions follow the authorization model.

---

# 49. External API Data Validation

External responses must be treated as untrusted input.

The application must validate:

- response structure
- required fields
- identifiers
- data types
- expected ranges
- result status
- subject information

Never assume an external system always returns correct data.

---

# 50. External System Availability

External integrations should not make the entire application dependent on external availability.

For example:

```text
University API DOWN
        ↓
Result Import unavailable
        ↓
Existing Student Portal
Existing Passport
Existing Analytics
Existing Backlogs
        ↓
Continue to operate
```

Where possible, core Acadlytic features should remain available.

---

# 51. File Storage Integration

Acadlytic may use object storage for:

- uploaded result files
- generated reports
- exports
- temporary processing files

Potential technologies include:

- Amazon S3
- Cloudflare R2
- compatible object storage

The final provider is an infrastructure decision.

---

# 52. File Storage Abstraction

Application code should preferably depend on an abstraction.

Conceptually:

```text
FileStorageService
        ↓
Object Storage Provider
```

Possible implementations:

```text
S3StorageService
R2StorageService
LocalStorageService
```

This keeps the application provider-independent.

---

# 53. Uploaded File Lifecycle

Result files should follow:

```text
Upload
  ↓
Secure Storage
  ↓
Processing
  ↓
Validation
  ↓
Result Import
  ↓
Retention / Deletion
```

Retention policy must be defined separately.

---

# 54. File Security

Uploaded files are untrusted.

The system should validate:

- file type
- extension
- size
- structure
- content
- storage access

Files should not be publicly accessible by default.

---

# 55. Email Integration

Future email integration may support:

- account activation
- password reset
- result processing notifications
- import completion
- administrative notifications

The application should use an email provider abstraction.

---

# 56. Email Provider Abstraction

Conceptually:

```text
EmailService
     ↓
Email Provider
```

Possible providers:

```text
SMTP
Transactional Email API
```

The exact provider should be decided during infrastructure planning.

---

# 57. Email Failure Handling

Email failure should generally not roll back a successfully completed academic transaction unless explicitly required.

Example:

```text
Result Processing
       ↓
SUCCESS
       ↓
Email Notification
       ↓
FAILED
```

The academic result should remain successfully processed.

The notification can be retried separately.

---

# 58. Notification Architecture

Future notification channels may include:

```text
Email
SMS
Push
WhatsApp
```

A common notification abstraction may be introduced later.

Example:

```text
NotificationService
        ↓
┌───────┼────────┐
Email   SMS     Push
```

This is outside the MVP unless specifically required.

---

# 59. Integration Configuration

Configuration should be environment-aware.

Example:

```text
Development
Staging
Production
```

External endpoints and credentials must not be hard-coded.

---

# 60. Configuration Management

Integration configuration may include:

```text
provider
baseUrl
timeout
retryLimit
enabled
credentialReference
```

Sensitive credentials should be stored separately from ordinary configuration where appropriate.

---

# 61. Secrets Management

Secrets may eventually be managed using:

- environment secrets
- cloud secret managers
- deployment secret stores

Never commit secrets to Git.

---

# 62. Integration Testing

Each integration should have tests for:

- successful connection
- authentication failure
- timeout
- malformed response
- duplicate response
- partial response
- rate limiting
- retry behavior
- invalid data
- authorization
- tenant isolation

---

# 63. Connector Testing

University connectors should be tested independently.

Example:

```text
OUConnector
    ↓
Mock University Response
    ↓
Expected Normalized Result
```

Connector tests should not require the complete application to run.

---

# 64. Contract Testing

Where an external API provides a documented contract, integration tests should verify that Acadlytic still understands the expected response structure.

External API changes should be detected before production processing.

---

# 65. Integration Sandbox

Where available, external providers should be tested against:

- sandbox
- test environment
- mock server

Production university endpoints should not be used for routine development testing.

---

# 66. Integration Monitoring

Future monitoring should track:

- integration success rate
- failure rate
- response time
- timeout rate
- retry count
- records processed
- records rejected
- provider availability

---

# 67. Integration Health

An integration may expose a health state:

```text
HEALTHY
DEGRADED
UNAVAILABLE
DISABLED
```

This is useful for administrative monitoring.

---

# 68. Integration Health Check

Where supported:

```text
Health Check
    ↓
Connector
    ↓
External System
    ↓
Response
```

A health check must not perform unnecessary expensive operations.

---

# 69. Integration Versioning

University APIs may change over time.

Connector implementations should be version-aware where required.

Example:

```text
OU API v1
OU API v2
```

Avoid changing the common internal result model unnecessarily when only an external API changes.

---

# 70. Integration Evolution

The architecture should support:

```text
Current
Excel / CSV
    ↓
Future
University API
    ↓
Future
Webhook
    ↓
Future
Authorized Feed
```

The internal Result Engine should remain stable as much as possible.

---

# 71. Integration Dependency Direction

The preferred dependency direction is:

```text
External System
      ↓
Integration Adapter
      ↓
Application Service
      ↓
Domain Module
```

Not:

```text
Domain Module
      ↓
Specific External Website
```

---

# 72. Integration and Domain Boundaries

The integration layer may depend on domain contracts.

Domain modules should not depend directly on individual external providers.

This maintains separation of concerns.

---

# 73. Integration and Data Ownership

Integration components do not automatically own academic data.

Example:

```text
University API
     ↓
Integration
     ↓
Result Import
     ↓
Result Processing
     ↓
Academic Result
```

Result Processing remains responsible for authoritative processed academic records.

---

# 74. Integration and Academic Passport

Academic Passport consumes successfully processed academic information.

It should not consume raw university API responses.

```text
University
   ↓
Integration
   ↓
Result Processing
   ↓
Academic Passport
```

---

# 75. Integration and Analytics

Analytics should consume authoritative processed data.

It should not calculate metrics directly from:

```text
raw API response
raw Excel file
raw CSV
```

unless explicitly required for operational import diagnostics.

---

# 76. Integration and Backlog Tracking

Integration should never directly manipulate backlog state.

Correct:

```text
Integration
    ↓
Result Import
    ↓
Validation
    ↓
Result Processing
    ↓
Backlog Tracking
```

---

# 77. Integration and Student Management

A university connector should identify students using the university-issued identifier.

Student Management remains responsible for the Acadlytic student record.

Example:

```text
University Hall Ticket
        ↓
Student Matching
        ↓
Acadlytic Student
```

If an exact match cannot be established, the result should be flagged for review rather than silently creating a student.

---

# 78. Integration and Academic Structure

External subject/course identifiers should be mapped to Acadlytic's academic structure.

Example:

```text
University Subject Code
        ↓
Subject Mapping
        ↓
Acadlytic Subject
```

Unknown subjects should be flagged.

---

# 79. Integration Mapping

Future university connectors may require mapping tables for:

- university course → Acadlytic course
- university subject → Acadlytic subject
- university semester → Acadlytic semester
- university result status → Acadlytic result status
- university grade → configured grade model

Mapping must be explicit and auditable.

---

# 80. Mapping Ownership

Integration-specific mappings belong to the integration/configuration boundary.

Academic Structure remains the owner of Acadlytic's academic entities.

This distinction prevents external identifiers from becoming the application's primary academic model.

---

# 81. Duplicate Integration Protection

Integration operations must prevent duplicate processing.

Potential identity:

```text
provider
+
externalResultReleaseId
+
studentIdentifier
+
subjectCode
+
attempt
```

The final uniqueness constraints belong to database architecture.

---

# 82. Reprocessing

Failed integrations should support controlled reprocessing where safe.

Example:

```text
Integration Job FAILED
        ↓
Review Error
        ↓
Retry
        ↓
Successful Import
```

Reprocessing must respect idempotency.

---

# 83. Partial Success

An integration may produce:

```text
10,000 records
9,800 valid
200 invalid
```

The system should preserve the processing outcome.

The integration layer should report the result to the Result Import/Validation workflow rather than hiding failed records.

---

# 84. Integration Error Categories

Errors should be categorized.

Examples:

```text
AUTHENTICATION_ERROR
AUTHORIZATION_ERROR
NETWORK_ERROR
TIMEOUT
RATE_LIMITED
INVALID_RESPONSE
MAPPING_ERROR
VALIDATION_ERROR
DUPLICATE
UNSUPPORTED_FORMAT
PROVIDER_ERROR
```

The exact error-code catalog should be centralized.

---

# 85. User-Facing Integration Errors

Technical details should not always be exposed directly.

Example:

```text
Internal:
HTTP 504 Gateway Timeout

User:
"The university result service did not respond. Please retry later."
```

Detailed diagnostics remain available to authorized administrators/logs.

---

# 86. Integration Security Principles

The integration layer must:

- validate external input
- authenticate external requests
- protect credentials
- use HTTPS where applicable
- enforce tenant isolation
- prevent replay where required
- validate webhook signatures
- apply rate limits
- avoid sensitive logging
- maintain audit trails

---

# 87. Integration Privacy

Academic information may contain sensitive student data.

Therefore:

- minimize stored external data
- avoid unnecessary duplication
- restrict access
- protect stored files
- limit logs
- define retention policies
- delete temporary data when no longer required

---

# 88. Integration Transaction Boundary

External API calls should not be treated as part of a long-running database transaction.

Avoid:

```text
BEGIN DB TRANSACTION
    ↓
Call University API
    ↓
Wait 30 seconds
    ↓
Commit
```

Prefer:

```text
External Call
    ↓
Receive Data
    ↓
Validate
    ↓
Short Database Transaction
    ↓
Commit
```

This reduces database lock duration.

---

# 89. Integration and Background Processing

External integrations should preferably execute outside normal web request threads when they are:

- slow
- large
- retryable
- scheduled
- batch-based

Spring scheduling/background processing may be used.

---

# 90. Scheduler-Based Integration

Future automatic monitoring may use:

```text
Scheduler
    ↓
Check University
    ↓
Detect New Result
    ↓
Create Import Job
    ↓
Process Result
```

Scheduler frequency must respect university/provider policies.

---

# 91. Manual Integration Trigger

Even after automatic integration exists, authorized users may need:

```text
Check for New Results
```

This provides a fallback when:

- scheduler fails
- provider is delayed
- administrator wants an immediate check

---

# 92. Automatic Monitoring

Automatic monitoring is a future capability.

Possible methods:

```text
Webhook
Polling
Scheduled Feed
```

Preference order:

```text
Official Webhook
      ↓
Official API / Feed
      ↓
Authorized Polling
      ↓
Manual File Upload
```

The actual availability depends on the university.

---

# 93. No Universal University Integration

Acadlytic should not assume every university provides the same integration capability.

Therefore:

```text
University
   ↓
Integration Capability
   ├── API
   ├── Webhook
   ├── Feed
   ├── File
   └── Manual
```

The platform should support multiple integration modes.

---

# 94. Generic File Integration

Where no university API exists:

```text
College Staff
      ↓
Download University Result
      ↓
Upload Excel / CSV
      ↓
Acadlytic Result Import
```

This remains an important fallback even after API integrations are introduced.

---

# 95. Integration Abstraction

The application should expose a common abstraction around result acquisition.

Conceptually:

```java
public interface ResultSource {

    ResultSourceType getType();

    ResultData fetch(ResultRequest request);
}
```

Possible implementations:

```text
FileResultSource
UniversityApiResultSource
WebhookResultSource
FeedResultSource
```

The exact interface should be finalized during backend implementation.

---

# 96. Integration Architecture Example

Example future OU integration:

```text
Osmania University
       ↓
OU API
       ↓
OUConnector
       ↓
Normalize OU Response
       ↓
Result Import Job
       ↓
Result Validation
       ↓
Result Processing
       ↓
Backlog Tracking
       ↓
Academic Passport
       ↓
Analytics
```

No other core module needs to understand the OU API format.

---

# 97. Integration Architecture Example — File

```text
University Excel File
       ↓
ExcelAdapter
       ↓
Column Mapping
       ↓
Normalized Result
       ↓
Result Import
       ↓
Validation
       ↓
Processing
```

---

# 98. Integration Architecture Example — Webhook

```text
University
     ↓
Webhook
     ↓
Signature Verification
     ↓
Event Deduplication
     ↓
Integration Job
     ↓
Connector / Fetch Result
     ↓
Result Import
     ↓
Validation
     ↓
Processing
```

---

# 99. Recommended Backend Integration Structure

A conceptual Spring Boot structure:

```text
backend/
└── modules/
    └── integrations/
        ├── domain/
        ├── application/
        ├── infrastructure/
        ├── connectors/
        │   ├── ou/
        │   ├── jntuh/
        │   └── generic/
        ├── webhook/
        ├── storage/
        └── notification/
```

The exact package structure should follow the final backend architecture.

---

# 100. Integration Infrastructure

Infrastructure-specific implementations should be isolated.

Example:

```text
infrastructure/
├── http/
├── storage/
├── email/
├── scheduling/
└── secrets/
```

This prevents provider-specific code from spreading across the domain layer.

---

# 101. Integration API Boundary

External integration endpoints exposed by Acadlytic may include:

```text
POST /api/v1/result-imports
POST /api/v1/integrations/{integrationId}/sync
GET  /api/v1/integrations/{integrationId}/status
POST /api/v1/webhooks/{provider}
```

Exact endpoints must follow `api-architecture.md`.

---

# 102. Integration API Authorization

Integration management endpoints must enforce:

- authentication
- role authorization
- tenant isolation
- resource ownership
- audit logging

Public users must not access private integration endpoints.

---

# 103. Integration Documentation

Every production integration should document:

- provider
- purpose
- endpoint
- authentication
- request format
- response format
- mapping rules
- retry behavior
- rate limits
- error codes
- credentials
- monitoring
- test environment
- operational owner

---

# 104. Integration Change Management

When an external provider changes its API:

```text
Provider Change
      ↓
Connector Update
      ↓
Connector Tests
      ↓
Integration Testing
      ↓
Staging
      ↓
Production
```

Core academic modules should remain unaffected where possible.

---

# 105. Integration Backward Compatibility

A connector should preserve the normalized internal contract even when the external provider changes.

Example:

```text
OU API v1
     ↓
OUConnectorV1
     ↓
Normalized Result

OU API v2
     ↓
OUConnectorV2
     ↓
Same Normalized Result
```

---

# 106. Integration Observability

Production integrations should eventually provide:

```text
Logs
Metrics
Traces / Correlation IDs
Job Status
Audit Events
Alerts
```

This becomes increasingly important as automatic university integrations are added.

---

# 107. Integration Alerts

Future alerts may notify administrators when:

- integration repeatedly fails
- authentication expires
- provider becomes unavailable
- result processing fails
- unexpected response format appears
- error rate exceeds threshold

Notifications should be separated from integration execution.

---

# 108. Integration Performance

The integration layer should:

- avoid unnecessary requests
- use batching where supported
- respect provider limits
- avoid duplicate downloads
- process large files efficiently
- use background jobs for large operations
- avoid blocking HTTP requests

---

# 109. Integration Scalability

The architecture should support:

```text
1 University
      ↓
Multiple Universities
      ↓
Multiple Colleges
      ↓
Multiple Integrations
      ↓
Concurrent Integration Jobs
```

The MVP should remain a modular monolith while keeping integration boundaries clear.

---

# 110. Integration and Modular Monolith

Acadlytic will initially use a modular monolith.

Therefore:

```text
One Spring Boot Application
        │
        ├── Authentication
        ├── Colleges
        ├── Students
        ├── Academic
        ├── Results
        ├── Backlogs
        ├── Passport
        ├── Analytics
        └── Integrations
```

Integrations should be modular even though they are deployed together.

---

# 111. Future Microservice Consideration

If integration volume becomes very large, the integration subsystem could eventually be extracted.

Possible future architecture:

```text
Acadlytic Core
      │
      ↓
Integration Service
      │
      ├── University Connectors
      ├── Webhooks
      └── External Providers
```

This is not required for MVP.

---

# 112. Integration Data Ownership

The ownership model remains:

```text
Integration
     ↓
Owns integration configuration,
jobs, events and raw integration artifacts

Result Import
     ↓
Owns imported result records

Result Processing
     ↓
Owns processed academic results

Backlog Tracking
     ↓
Owns backlog state

Academic Passport
     ↓
Owns/read-models academic presentation

Analytics
     ↓
Owns derived analytics
```

---

# 113. AI Coding Agent Rules

AI coding agents must:

1. read the relevant feature specification
2. read `data-ownership.md`
3. read `api-architecture.md`
4. read `backend-architecture.md`
5. follow this integration architecture
6. isolate provider-specific code
7. never bypass authorization
8. never bypass result validation
9. never directly update academic records from connectors
10. preserve idempotency
11. implement retry behavior carefully
12. avoid infinite retries
13. never expose credentials
14. avoid logging sensitive information
15. maintain tenant isolation
16. add connector tests
17. preserve normalized result contracts
18. avoid coupling core modules to external providers

---

# 114. Integration Testing Strategy

The testing hierarchy should be:

```text
Unit Tests
    ↓
Connector Tests
    ↓
Integration Tests
    ↓
Application Tests
    ↓
End-to-End Tests
```

External systems should be mocked or sandboxed where possible.

---

# 115. Integration Definition of Done

An integration is complete when:

- connector/adapter is implemented
- authentication is secure
- configuration is externalized
- request/response mapping is defined
- normalized data contract is implemented
- validation is implemented
- timeout is configured
- retry policy is defined
- idempotency is implemented
- tenant isolation is verified
- audit events are implemented where required
- logging is implemented without sensitive data
- tests are implemented
- failure cases are tested
- documentation exists
- staging testing is completed

---

# 116. MVP vs Future Integration Scope

## MVP

```text
Excel
CSV
File Upload
Result Import Pipeline
```

## Future

```text
University APIs
University Webhooks
Authorized Feeds
Automatic Result Monitoring
Email
SMS
Push Notifications
External Reporting APIs
```

---

# 117. Integration Roadmap

### Phase 1

```text
Excel / CSV
     ↓
Result Import
```

### Phase 2

```text
University-Specific File Adapters
```

### Phase 3

```text
University API Connector Framework
```

### Phase 4

```text
Automatic Monitoring
Webhooks
Authorized Feeds
```

### Phase 5

```text
Notification Integrations
External APIs
Enterprise Integrations
```

---

# 118. Relationship With Result Engine

The integration architecture directly supports the Result Engine:

```text
External Source
      ↓
Integration Layer
      ↓
Result Import
      ↓
Result Validation
      ↓
Result Processing
      ↓
Backlog
      ↓
Academic Passport
      ↓
Analytics
```

This architecture allows the source of result data to change without redesigning the academic processing pipeline.

---

# 119. Relationship With Data Ownership

`data-ownership.md` defines which module owns the resulting data.

This document defines how external data enters the system.

Therefore:

```text
Integration Architecture
        ↓
How data enters
        ↓
Data Ownership
        ↓
Who owns it
```

Neither document should silently override the other.

---

# 120. Relationship With Database Architecture

Database architecture defines the persistent structures for:

- integrations
- integration jobs
- external identifiers
- raw artifacts
- mappings
- webhook events

This document defines the behavior and boundaries.

Therefore:

```text
Integration Architecture
        ↓
Database Architecture
        ↓
Tables / Constraints / Indexes
```

---

# 121. Relationship With API Architecture

API Architecture defines the public application API.

Integration Architecture defines how Acadlytic communicates with external systems.

Conceptually:

```text
Frontend
   ↓
Acadlytic REST API
   ↓
Application
   ↓
Integration Layer
   ↓
External System
```

---

# 122. Relationship With Frontend Architecture

Frontend users may trigger integrations through:

```text
College Admin
      ↓
Result Import / Sync UI
      ↓
Acadlytic API
      ↓
Integration Job
```

The frontend should never communicate directly with university APIs using private credentials.

---

# 123. Final Integration Architecture

Acadlytic follows an adapter-based integration architecture.

The core principle is:

> **External systems communicate with Acadlytic through isolated adapters/connectors, while the core academic modules operate on normalized Acadlytic data.**

Final flow:

```text
                         External Sources
                              │
             ┌────────────────┼────────────────┐
             │                │                │
          Excel/CSV       University API    Webhook
             │                │                │
             └────────────────┼────────────────┘
                              ↓
                    Integration Layer
                              │
                 ┌────────────┴────────────┐
                 │                         │
              Adapters                 Connectors
                 │                         │
                 └────────────┬────────────┘
                              ↓
                         Normalization
                              ↓
                        Result Import
                              ↓
                       Result Validation
                              ↓
                       Result Processing
                              ↓
              ┌───────────────┼────────────────┐
              │               │                │
           Backlogs       Academic Passport   Analytics
```

The architecture keeps university-specific integration logic outside the core academic domain and allows Acadlytic to evolve from manual Excel/CSV imports toward authorized automatic university integrations without redesigning the entire platform.

---

# 124. Document Status

**Document:** Integration Architecture  
**Project:** Acadlytic  
**Version:** 1.0  
**Status:** Draft / Implementation Ready  

This document defines the architectural boundary for external integrations and future university result connectivity.

Detailed provider-specific implementation should be documented separately when an actual university integration is introduced.