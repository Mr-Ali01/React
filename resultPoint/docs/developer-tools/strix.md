# Strix: AI-Powered Application Security Testing Guide

## 1. Overview
**Strix** (`usestrix/strix`) is an open-source, autonomous AI penetration testing platform. It deploys multi-agent AI workflows to perform dynamic reconnaissance, endpoint mapping, payload generation, and proof-of-concept (PoC) exploit validation against authorized applications, APIs, and cloud infrastructure.

---

## 2. Environment Compatibility & Requirements

| Requirement | Required by Strix | Current ResultPoint Environment | Status / Compatibility |
| :--- | :--- | :--- | :--- |
| **Operating System** | Linux, macOS, or Windows (via WSL2 / Docker Desktop) | Windows 10/11 | Supported via Docker Desktop |
| **Python Version** | Python 3.12+ | Python 3.11.3 | Upgrade required for host pip install |
| **Container Engine**| Docker Daemon running locally | Not installed on host | Required for sandboxed exploit verification |
| **Application Target**| Running backend REST APIs / web services | Frontend only (Spring Boot backend planned) | Target not available yet |
| **LLM Provider** | OpenAI (GPT-4o), Anthropic (Claude 3.5), or Ollama | Developer's choice | API key required |

> [!IMPORTANT]
> **Safety & Scope Protection**:
> In accordance with safety requirements, automated security penetration testing should only be run against authorized local development environments once the Java + Spring Boot backend is active. Never run security scans against third-party or production targets without explicit written authorization.

---

## 3. Installation Instructions (When Backend is Ready)

### Step 1: Install Prerequisites
1. **Install Docker Desktop for Windows**:
   Download and install Docker Desktop with WSL2 backend from [docker.com](https://www.docker.com/products/docker-desktop). Ensure Docker daemon is running (`docker --version`).
2. **Install Python 3.12+**:
   Install Python 3.12 or newer, or run Strix directly via Docker.

### Step 2: Install Strix CLI
Using `pipx` (recommended) or `pip`:
```bash
pipx install strix-agent
# or
pip install strix-agent
```

Alternatively, run directly from the official container:
```bash
docker pull usestrix/strix:latest
```

---

## 4. Secure Credential Configuration
Strix requires an LLM to power its agentic reasoning. Configure credentials securely using environment variables—never commit API keys into git:

```powershell
# Set your chosen LLM provider and API key in PowerShell:
$env:STRIX_LLM = "openai/gpt-4o"          # Or "anthropic/claude-3-5-sonnet-20241022"
$env:LLM_API_KEY = "sk-proj-YOUR_ACTUAL_API_KEY"

# For local privacy using Ollama (no external API keys needed):
$env:STRIX_LLM = "ollama/deepseek-r1"
$env:OLLAMA_BASE_URL = "http://localhost:11434"
```

---

## 5. Practical Security Review Workflow

Once your Spring Boot backend is developed and running on `http://localhost:8080`:

### 1. Start ResultPoint Backend & Frontend Locally
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Spring Boot Backend
./mvnw spring-boot:run
```

### 2. Run Strix Security Assessment
```bash
# Scan local backend endpoints and API routes:
strix --target http://localhost:8080/api/v1 --mode api

# Or run full-stack containerized scan:
strix --target http://localhost:8080 --scope ./src --report ./docs/security-report.json
```

### 3. What Strix Tests For
- **Broken Object Level Authorization (BOLA / IDOR)**: Verifies that Student A cannot access or save results under Student B's account ID.
- **SQL Injection**: Validates that Spring Data JPA parameterized queries prevent raw SQL manipulation on MySQL.
- **JWT Tampering**: Tests token expiration, signature validation, and replay prevention in Spring Security.
- **Cross-Site Scripting (XSS)**: Tests calculator input fields and custom formulas.

---

## 6. How to Update, Disable, or Uninstall
- **Update**: `pipx upgrade strix-agent` (or `docker pull usestrix/strix:latest`)
- **Disable**: No background service runs; simply stop invoking `strix`.
- **Uninstall**: `pipx uninstall strix-agent` or `pip uninstall strix-agent`
