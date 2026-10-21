---
name: spring-boot-mysql
description: Architecture standards, JPA entities, REST controller patterns, and MySQL schema guidelines for ResultPoint backend development.
---

# ResultPoint Spring Boot + MySQL Backend Standards

This skill provides guidelines and patterns for implementing ResultPoint's planned Java + Spring Boot backend and MySQL database, replacing incompatible third-party BaaS plugins (like Supabase Postgres) with ResultPoint's true architectural stack.

## Architecture Stack
- **Language**: Java 17 / 21 LTS
- **Framework**: Spring Boot 3.x (Spring Web, Spring Data JPA, Spring Security, Spring Validation)
- **Database**: MySQL 8.0+ with InnoDB storage engine
- **Build Tool**: Maven (`pom.xml`) or Gradle
- **Authentication**: Stateless JWT token authentication with Spring Security filter chain

## Key Database & JPA Conventions

### 1. MySQL Configuration (`application.yml`)
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/resultpoint?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD:}
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: update
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQLDialect
        format_sql: true
    show-sql: false
```

### 2. JPA Entity Pattern
Use standard JPA annotations with MySQL `BIGINT AUTO_INCREMENT` primary keys:
```java
@Entity
@Table(name = "calculation_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalculationRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false, length = 100)
    private String tool;

    @Column(nullable = false, length = 50)
    private String score;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(columnDefinition = "JSON")
    private String detailsJson;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
```

### 3. REST Controller Pattern
```java
@RestController
@RequestMapping("/api/v1/calculations")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class CalculationController {

    private final CalculationService calculationService;

    @PostMapping
    public ResponseEntity<CalculationResponse> saveCalculation(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody SaveCalculationRequest request) {
        CalculationResponse saved = calculationService.save(user.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping
    public ResponseEntity<List<CalculationResponse>> getHistory(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(calculationService.getUserHistory(user.getUsername()));
    }
}
```

## Security & API Safety
- Never store raw passwords; use `BCryptPasswordEncoder`.
- Keep database credentials in environment variables (`DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`).
- Always validate incoming payload constraints using `@Valid` and Jakarta validation (`@NotNull`, `@Size`, `@Min`, `@Max`).
