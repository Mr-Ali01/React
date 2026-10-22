# ResultPoint Backend — Spring Boot Folder Structure & Layer Responsibilities

## 1. Architectural Style: Modular Monolith

The ResultPoint backend is designed as a **Modular Monolith** using **Spring Boot 3.4** and **Java 21 LTS**.

### Architectural Rationale
1. **Domain Cohesion:** ResultPoint's primary workflows (academic catalog navigation, student semester result entry, credit calculation, and transcript generation) operate on a strongly interrelated data domain. Splitting these into microservices (e.g., "Catalog Service", "Result Service", "User Service") would introduce distributed transaction overhead (Saga patterns), eventual consistency latency, and network serialization costs without any real organizational benefit.
2. **Operational Simplicity:** A modular monolith can be built, tested, and deployed as a single executable artifact (JAR or container image) with a single HikariCP connection pool to MySQL 8.0, drastically simplifying CI/CD, local debugging, and operational monitoring.
3. **Future Extensibility:** By enforcing strict package-private visibility, interface-driven service contracts, and domain event boundaries within the monolith, individual modules (such as Website Analytics or PDF Exporting) can be decoupled into independent worker services in the future if specific compute workloads demand it.

---

## 2. Directory Tree & Package Organization

The recommended root package is `com.resultpoint`. Below is the complete source and test hierarchy:

```
resultpoint-backend/
├── pom.xml                                   # Maven project descriptor (Spring Boot 3.4, Java 21)
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── resultpoint/
│   │   │           ├── ResultPointApplication.java    # Spring Boot entry point (@SpringBootApplication)
│   │   │           │
│   │   │           ├── common/                         # Cross-cutting foundational utilities
│   │   │           │   ├── constants/                  # System-wide static constants & regex patterns
│   │   │           │   ├── dto/                        # Generic API response envelopes (ApiResponse, PageResponse)
│   │   │           │   ├── event/                      # Internal Spring application events
│   │   │           │   ├── exception/                  # Global exception hierarchy & error codes
│   │   │           │   ├── util/                       # DateTime, String, Math, and Masking helpers
│   │   │           │   └── validation/                 # Custom Jakarta validation annotations (@ValidFormula, etc.)
│   │   │           │
│   │   │           ├── config/                         # Infrastructure & framework configuration
│   │   │           │   ├── AppProperties.java          # Type-safe @ConfigurationProperties
│   │   │           │   ├── AsyncConfig.java            # ThreadPoolTaskExecutor for async events & telemetry
│   │   │           │   ├── CacheConfig.java            # Caffeine (L1) and Redis (L2) cache manager setup
│   │   │           │   ├── CorsConfig.java             # Explicit CORS policy matching frontend origin
│   │   │           │   ├── JpaConfig.java              # JPA Auditing (@EnableJpaAuditing) & transaction setup
│   │   │           │   └── OpenApiConfig.java          # Swagger / SpringDoc OpenAPI 3.0 specification
│   │   │           │
│   │   │           ├── security/                       # Authentication & authorization engine
│   │   │           │   ├── SecurityConfig.java         # Spring Security 6 filter chain configuration
│   │   │           │   ├── CustomUserDetailsService.java # Database-backed user principal loader
│   │   │           │   ├── UserPrincipal.java          # SecurityContext principal wrapper
│   │   │           │   ├── jwt/                        # Stateless token infrastructure
│   │   │           │   │   ├── JwtTokenProvider.java   # Secret key signing, validation, claims extraction
│   │   │           │   │   ├── JwtAuthenticationFilter.java # Per-request Bearer token parser
│   │   │           │   │   └── JwtAuthenticationEntryPoint.java # 401 Unauthorized handler
│   │   │           │   ├── handler/                    # AccessDeniedHandler, AuthenticationFailureHandler
│   │   │           │   └── ratelimit/                  # Bucket4j / Redis-backed request rate limit filter
│   │   │           │
│   │   │           └── modules/                        # Domain feature modules (Modular Monolith)
│   │   │               ├── auth/                       # Authentication & account lifecycle
│   │   │               │   ├── controller/             # AuthController (/api/v1/auth)
│   │   │               │   ├── dto/                    # LoginRequest, SignupRequest, AuthResponse, PasswordResetRequest
│   │   │               │   └── service/                # AuthService (login, signup, token refresh, logout)
│   │   │               │
│   │   │               ├── user/                       # User management & administration
│   │   │               │   ├── controller/             # UserController, AdminUserController (/api/v1/users)
│   │   │               │   ├── dto/                    # UserSummaryDto, UserDetailDto, UpdateUserStatusDto
│   │   │               │   ├── entity/                 # User.java, Role.java (enum: STUDENT, ADMIN)
│   │   │               │   ├── repository/             # UserRepository.java
│   │   │               │   └── service/                # UserService.java
│   │   │               │
│   │   │               ├── catalog/                    # Academic Catalog & University Governance
│   │   │               │   ├── controller/             # UniversityController, CourseController, RegulationController
│   │   │               │   ├── dto/                    # UniversityDto, CourseDto, RegulationDto, SubjectDto
│   │   │               │   ├── entity/                 # University, Course, Regulation, Batch, Subject, RegulationSubject
│   │   │               │   ├── repository/             # UniversityRepository, RegulationRepository, SubjectRepository
│   │   │               │   └── service/                # AcademicCatalogService (catalog lookup & admin CRUD)
│   │   │               │
│   │   │               ├── calculation/                # Calculation Engine & Grading Strategies
│   │   │               │   ├── engine/                 # Core AcademicCalculationEngine (pure domain logic)
│   │   │               │   ├── formula/                # FormulaEvaluator (safe parser, zero script/eval injection)
│   │   │               │   ├── strategy/               # University-specific calculation strategies
│   │   │               │   │   ├── CalculationStrategy.java          # Strategy interface (calculateSgpa, calculateCgpa, convertToPercentage)
│   │   │               │   │   ├── StandardUgcStrategy.java          # Standard 10-point scale: (CGPA - 0.75) * 10
│   │   │               │   │   ├── OsmaniaUniversityStrategy.java    # S-grade scheme (Super=10pts) & CGPA * 10
│   │   │               │   │   ├── JntuhR18Strategy.java             # O-grade scheme & (CGPA - 0.5) * 10
│   │   │               │   │   ├── JntuhR22Strategy.java             # Revised boundaries (90%+ for O) & (CGPA - 0.5) * 10
│   │   │               │   │   └── CalculationStrategyFactory.java   # Strategy lookup by university and regulation
│   │   │               │   ├── entity/                 # GradingScale, GradeBoundary, CalculationRule
│   │   │               │   ├── repository/             # GradingScaleRepository, CalculationRuleRepository
│   │   │               │   └── service/                # CalculationRuleService
│   │   │               │
│   │   │               ├── student/                    # Student Profile, Results, Backlogs & History
│   │   │               │   ├── controller/             # StudentProfileController, ResultController, BacklogController
│   │   │               │   ├── dto/                    # StudentProfileDto, SemesterResultDto, SubjectResultDto, BacklogDto
│   │   │               │   ├── entity/                 # StudentProfile, SemesterResult, SubjectResult, Backlog, EducationRecord
│   │   │               │   ├── repository/             # StudentProfileRepository, SemesterResultRepository, BacklogRepository
│   │   │               │   ├── snapshot/               # ResultSnapshotService (freezes rule versions on save)
│   │   │               │   └── service/                # StudentService, ResultService, BacklogService, EducationRecordService
│   │   │               │
│   │   │               ├── tool/                       # Public Calculators & Saved Tools Management
│   │   │               │   ├── controller/             # PublicToolController, AdminToolController (/api/v1/tools)
│   │   │               │   ├── dto/                    # ToolDto, ToolConfigDto, SavedCalculationDto
│   │   │               │   ├── entity/                 # ToolConfiguration, SavedCalculation
│   │   │               │   ├── repository/             # ToolConfigurationRepository, SavedCalculationRepository
│   │   │               │   └── service/                # ToolManagementService, SavedCalculationService
│   │   │               │
│   │   │               ├── content/                    # Announcements, Resources, Blogs
│   │   │               │   ├── controller/             # AnnouncementController, ResourceController, BlogController
│   │   │               │   ├── dto/                    # AnnouncementDto, ResourceDto, BlogDto
│   │   │               │   ├── entity/                 # Announcement, AnnouncementRead, ResourceItem, BlogPost
│   │   │               │   ├── repository/             # AnnouncementRepository, ResourceRepository, BlogRepository
│   │   │               │   └── service/                # AnnouncementService, ResourceService, BlogService
│   │   │               │
│   │   │               ├── support/                    # Helpdesk & Query Management
│   │   │               │   ├── controller/             # SupportQueryController (/api/v1/support)
│   │   │               │   ├── dto/                    # SupportQueryCreateDto, SupportQueryDetailDto, ReplyDto
│   │   │               │   ├── entity/                 # SupportQuery, SupportQueryReply
│   │   │               │   ├── repository/             # SupportQueryRepository, SupportQueryReplyRepository
│   │   │               │   └── service/                # SupportQueryService
│   │   │               │
│   │   │               ├── audit/                      # Administrative Audit Trail
│   │   │               │   ├── controller/             # AdminAuditController (/api/v1/admin/audit)
│   │   │               │   ├── dto/                    # AuditLogDto, AuditFilterCriteria
│   │   │               │   ├── entity/                 # AuditLog (actor, action, entity, diff JSON, IP)
│   │   │               │   ├── listener/               # AuditEventListener (async event persistence)
│   │   │               │   ├── repository/             # AuditLogRepository
│   │   │               │   └── service/                # AuditService
│   │   │               │
│   │   │               ├── analytics/                  # Website Visitor Telemetry & Aggregate Rollups
│   │   │               │   ├── controller/             # TelemetryController (public ingestion), AdminAnalyticsController
│   │   │               │   ├── dto/                    # TelemetryEventDto, VisitorStatsSummaryDto, RouteMetricDto
│   │   │               │   ├── entity/                 # DailyVisitorMetric, RoutePageView, CalculatorUsageStat
│   │   │               │   ├── job/                    # AnalyticsAggregationCronJob (hourly rollup of Redis buffer)
│   │   │               │   ├── repository/             # DailyVisitorMetricRepository, RoutePageViewRepository
│   │   │               │   └── service/                # TelemetryBufferService (Redis), AnalyticsReportService
│   │   │               │
│   │   │               └── export/                     # Document Rendering (PDF & Image Generation)
│   │   │                   ├── controller/             # ExportController (/api/v1/export)
│   │   │                   ├── dto/                    # ExportRequestDto
│   │   │                   └── service/                # PdfExportService (OpenPDF / iText7 server-side generation)
│   │   │
│   │   └── resources/
│   │       ├── application.yml                         # Base configuration
│   │       ├── application-dev.yml                     # Local development (H2 or local MySQL)
│   │       ├── application-prod.yml                    # Production MySQL, Redis, AWS/GCP secrets
│   │       ├── db/
│   │       │   └── migration/                          # Flyway or Liquibase versioned migration scripts
│   │       │       ├── V1__initial_schema.sql
│   │       │       ├── V2__seed_academic_catalog.sql
│   │       │       └── V3__seed_baseline_tools.sql
│   │       └── templates/                              # Thymeleaf / HTML templates for PDF scorecard rendering
│   │
│   └── test/
│       ├── java/
│       │   └── com/
│       │       └── resultpoint/
│       │           ├── ResultPointApplicationTests.java # Context loading smoke test
│       │           ├── common/                         # Common utility unit tests
│       │           ├── security/                       # JWT, AuthFilter, and SecurityConfig unit tests
│       │           ├── modules/
│       │           │   ├── calculation/                # Calculation engine & strategy unit tests
│       │           │   ├── student/                    # Snapshot integrity & student result tests
│       │           │   ├── catalog/                    # Catalog repository & service integration tests
│       │           │   └── analytics/                  # Telemetry buffering & rollup tests
│       │           └── integration/                    # End-to-end REST API integration tests (Testcontainers)
│       └── resources/
│           └── application-test.yml                    # In-memory H2 / Testcontainers configuration
```

---

## 3. Layer Responsibilities & Strict Design Rules

### 1. Controllers (`controller/`)
- **Responsibility:** Expose HTTP endpoints, map incoming JSON to DTOs, perform declarative request validation via `@Valid`, extract authenticated user context from `SecurityContextHolder`, invoke application services, and wrap responses in standardized envelopes (`ApiResponse<T>`).
- **Rule:** Controllers **MUST NOT** directly interact with `SpringDataJpa` repositories. All business queries and transactional operations must pass through a service.
- **Rule:** Controllers **MUST NOT** contain calculations, score derivations, or business validation logic.

### 2. Services (`service/`)
- **Responsibility:** Orchestrate application workflows, manage transaction boundaries via `@Transactional`, enforce domain security rules (e.g., verifying a student owns the record they are modifying), coordinate cross-module interactions, and dispatch domain events.
- **Rule:** Domain methods modifying data must declare `@Transactional`. Read-only query methods must declare `@Transactional(readOnly = true)` to optimize Hibernate dirty-checking overhead.

### 3. Domain Calculation Engine (`calculation/engine/` and `calculation/strategy/`)
- **Responsibility:** Pure mathematical calculation of SGPA, CGPA, target requirements, grade boundaries, and percentage conversions.
- **Rule:** The calculation engine **MUST BE completely decoupled from database entities**. It accepts plain domain value objects (credits, grades, grade points, formula parameters) and outputs calculated results with deterministic rounding. This ensures that calculations can be unit-tested without any database or Spring context dependencies.

### 4. Repositories (`repository/`)
- **Responsibility:** Data access abstraction via Spring Data JPA `JpaRepository`.
- **Rule:** Use Spring Data query derivation for simple queries (`findByUserIdAndSemesterNumber`). For complex joins or analytics rollups, use JPQL (`@Query`) with projection DTO interfaces or Native SQL where database-specific window functions are required.
- **Rule:** Always enforce pagination via `Pageable` on collection queries to prevent memory exhaustion.

### 5. Entities (`entity/`)
- **Responsibility:** Relational persistence mappings using Jakarta Persistence annotations (`@Entity`, `@Table`, `@Id`, `@Column`, `@ManyToOne`, etc.).
- **Rule:** Avoid bidirectional `@OneToMany` cascades where possible; favor unidirectional `@ManyToOne` references to prevent unintended cascading deletions and N+1 query traps.
- **Rule:** All entities must extend a base audit mapped superclass (`BaseAuditableEntity`) containing `createdAt`, `updatedAt`, `createdBy`, and `updatedBy`.
