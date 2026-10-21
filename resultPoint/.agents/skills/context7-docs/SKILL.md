---
name: context7-docs
description: Retrieve live, version-accurate documentation and code examples for software libraries using Context7 (React, Vite, Redux Toolkit, Tailwind CSS, Spring Boot, MySQL, Java).
---

# Context7 Documentation Assistance

Use this skill to fetch live, up-to-date documentation for any software library, preventing AI hallucinations and avoiding deprecated API usage.

## When to Use
- Looking up React 19 hooks, concurrent features, or patterns.
- Querying Redux Toolkit 2.x APIs (`createSlice`, `createAsyncThunk`).
- Querying Tailwind CSS 4 configuration and syntax.
- Querying Spring Boot 3.x, Spring Data JPA, Spring Security, or MySQL Hibernate configurations when backend work begins.

## Command-Line Usage (ctx7)

### 1. Resolve Library ID
Map a library name or topic to its Context7-compatible library ID:
```bash
npx ctx7 library <library-name> [query]
```
Examples:
```bash
# Resolve React documentation
npx ctx7 library react "hooks"

# Resolve Redux Toolkit documentation
npx ctx7 library redux-toolkit "createSlice"

# Resolve Spring Boot documentation
npx ctx7 library spring-boot "rest controller"
```

### 2. Query Documentation
Fetch verified documentation snippets and working code examples:
```bash
npx ctx7 docs <libraryId> <query>
```
Examples:
```bash
# Query React docs for useMemo
npx ctx7 docs /reactjs/react.dev "useMemo"

# Query Redux Toolkit docs
npx ctx7 docs /reduxjs/redux-toolkit "configureStore"

# Query Spring Boot docs
npx ctx7 docs /spring-projects/spring-boot "JPA Repository"
```

## MCP Server Integration
Context7 is configured as a Model Context Protocol (MCP) server in `.agents/mcp_config.json`.
When MCP tools are active, the agent can call `resolve-library-id` and `query-docs` directly.

## Optional API Key
Context7 works out-of-the-box without an API key under default rate limits.
To increase rate limits, obtain a free API key from https://context7.com/dashboard and configure:
```bash
set CONTEXT7_API_KEY=your_key_here
```
Or append `--api-key YOUR_KEY` in `.agents/mcp_config.json`.
