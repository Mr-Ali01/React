# Acadlytic Modular Monolith Architecture

The `com.acadlytic.modules` package houses the domain feature modules of the platform.

In accordance with the development roadmap (`08-task-breakdown/roadmap.md`), each module will be built **backend-first, module-by-module** according to its feature specification in `acadlytic-docs/09-development/feature-specifications/`.

## Module Directory Structure

```text
com.acadlytic.modules/
├── auth/          # Authentication, JWT/Session, Password Management, User Provisioning (Phase 2)
├── colleges/      # College Tenant Management, Subscriptions, College Profile (Phase 3)
├── academic/      # Programs, Regulations, Semesters, Subjects, Credits (Phase 4)
├── students/      # Student Records, Roll Numbers, Enrollments (Phase 5)
├── results/       # Result File Ingestion, Validation Pipeline, Authoritative Processing (Phases 6-8)
├── backlogs/      # Automated Backlog Lifecycle Engine (Phase 9)
├── passport/      # Academic Passport Read Model & Longitudinal Projections (Phase 10)
└── analytics/     # Institutional KPIs, Cohort Metrics, Performance Hot-spots (Phase 11)
```

## Module Isolation Rules

1. Each module owns its internal domain logic, entities, and repositories.
2. Cross-module queries should use service interfaces rather than directly injecting foreign repositories.
3. Every tenant-scoped entity and query must enforce the `college_id` boundary.
4. Business logic belongs in domain services, never in REST controllers.
