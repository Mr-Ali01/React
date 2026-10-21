# Evaluation of Supabase AI Tools Plugin for ResultPoint

## 1. Executive Summary
The **Supabase AI Tools Plugin** (`supabase.com/docs/guides/ai-tools/plugins` / `supabase/agent-skills`) is an agent integration designed to connect AI coding assistants directly to Supabase-managed PostgreSQL databases and Edge Functions.

**Evaluation Verdict**: **Incompatible with ResultPoint's architectural backend roadmap.**

ResultPoint is architected around:
- **Planned Backend**: Java 17/21 + Spring Boot 3
- **Planned Database**: MySQL 8+ (InnoDB)
- **Planned ORM**: Spring Data JPA / Hibernate

Installing the Supabase database plugin would violate project safety constraints by introducing PostgreSQL-specific migrations, Row Level Security (RLS) policies, and BaaS dependencies that conflict directly with Spring Boot and MySQL.

---

## 2. Detailed Technical Comparison

| Feature / Capability | Supabase AI Tools Plugin | ResultPoint Planned Architecture | Compatibility Analysis |
| :--- | :--- | :--- | :--- |
| **Database Engine** | PostgreSQL (Supabase cloud / local PG) | MySQL 8.0+ | **Incompatible**: SQL syntax, types (`SERIAL` vs `AUTO_INCREMENT`, `JSON`, `TINYINT`), and indexing differ. |
| **Security & Auth Model** | Postgres Row-Level Security (RLS) + Supabase Auth | Spring Security + JWT Filter Chain | **Incompatible**: RLS policies do not exist in MySQL. Security is enforced at the Spring Boot service layer. |
| **Backend Framework** | Deno Edge Functions (TypeScript) | Java + Spring Boot (RESTful API) | **Incompatible**: Plugin would generate Edge Functions instead of Spring Controllers and Services. |
| **Data Access Layer** | Supabase JS Client (`@supabase/supabase-js`) | Spring Data JPA / Hibernate Repository | **Incompatible**: ResultPoint uses Java entity models and repository interfaces. |
| **Agent Prompt Guidance**| Postgres schemas & Supabase table queries | Spring Boot REST endpoints & MySQL entities | Agent would generate incorrect, unusable database code if Supabase plugin is active. |

---

## 3. Does it provide any useful capability without replacing the backend?
1. **Can it act as a secondary cache or auth provider?**
   No. ResultPoint does not require Supabase Auth or storage, as Spring Security and local MySQL / file storage handle user authentication, calculation records, and academic profiles with zero external vendor lock-in.
2. **Can it run alongside MySQL?**
   Attempting to connect the Supabase MCP plugin would require a running Supabase project (access tokens, project ref, and Postgres URL). With no Supabase database in ResultPoint, the MCP tools would perpetually error out or confuse the AI coding assistant.
3. **What is valuable from Supabase's AI tooling?**
   The valuable concept demonstrated by Supabase is **Agent Skills architecture**—providing specialized prompt engineering guidelines (`SKILL.md`) tailored to the developer's exact stack.

---

## 4. Adopted Solution: ResultPoint Spring Boot + MySQL Skill
Instead of installing an incompatible Supabase plugin, we have configured a dedicated **Spring Boot + MySQL Developer Skill** in:
`.agents/skills/spring-boot-mysql/SKILL.md`

This guarantees that:
- The AI agent writes clean Java 21, Spring Boot 3 controllers, and Spring Data JPA repositories.
- Database schemas target MySQL 8+ with proper indexing, transactions, and foreign keys.
- ResultPoint preserves full architectural control with no third-party BaaS dependencies.
