# Acadlytic — Market Research

**Document:** `01-research/market-research.md`  
**Project:** Acadlytic  
**Document Status:** Draft / Under Review  
**Document Type:** Market Research  
**Last Updated:** 2026-10-05

---

## 1. Purpose

This document establishes the market-research foundation for Acadlytic.

The purpose is to understand the broader problem environment in which Acadlytic is intended to operate, with particular attention to:

- university-affiliated colleges
- academic result management
- student academic records
- result processing
- backlog tracking
- academic reporting
- academic analytics
- fragmented academic workflows
- opportunities for a specialized academic intelligence platform

This document is intended to guide product decisions.

It is not a final market-sizing report, investment report, or commercial validation study.

---

# 2. Research Scope

The research focuses on the academic workflow surrounding university examination results.

The primary workflow under consideration is:

```text
University Result
        ↓
College Receives Result
        ↓
Result Processing
        ↓
Student Academic Records
        ↓
Backlog Tracking
        ↓
Academic Reporting
        ↓
Academic Insights
```

The research does not treat Acadlytic as a general-purpose college ERP.

The primary area of interest is the transformation of academic result data into structured and useful academic information.

---

# 3. Market Problem

The underlying market problem is not simply the absence of software.

The larger problem is the difficulty of maintaining reliable academic information across multiple academic events and result cycles.

A college may need to manage:

- student identities
- academic programs
- semesters
- subjects
- examination results
- failed subjects
- subsequent attempts
- backlog status
- SGPA
- CGPA
- credits
- historical academic records
- academic reports

When these are maintained through disconnected workflows, the college may have difficulty obtaining a consistent longitudinal view.

---

# 4. Academic Data Fragmentation

A central market problem is academic data fragmentation.

Conceptually:

```text
University Result Files
        │
        ├── Semester Result
        ├── Supplementary Result
        ├── Revised Result
        └── Other Result Releases
                 │
                 ▼
        College Academic Records
                 │
        ┌────────┼─────────┐
        ↓        ↓         ↓
   Spreadsheets  Files   Manual Records
        │        │         │
        └────────┼─────────┘
                 ↓
        Difficult Consolidation
```

The more result cycles a student completes, the more important centralized historical records become.

---

# 5. Result Processing Problem

Result processing can involve multiple activities.

A typical workflow may require:

1. receiving a result file
2. identifying the result release
3. reading the file
4. identifying students
5. matching students with college records
6. identifying subjects
7. matching subjects with academic structure
8. validating result values
9. identifying duplicates
10. processing valid results
11. preserving attempts
12. updating academic records
13. updating backlog state
14. generating reports

A platform that handles only file upload does not solve the complete academic workflow.

---

# 6. Student Matching Problem

Student matching is a critical part of the result workflow.

A result source may provide information such as:

- registration number
- enrollment number
- student name
- course
- semester

Names alone are not sufficiently reliable as a primary identity mechanism.

Potential problems include:

- duplicate names
- spelling variations
- formatting differences
- abbreviations
- changed names
- inconsistent source formatting

Therefore, a reliable academic platform should prefer an official student identifier where available.

Acadlytic adopts this as a core product principle.

---

# 7. Subject Matching Problem

The same principle applies to academic subjects.

Subject names can vary because of:

- formatting
- abbreviations
- punctuation
- naming conventions
- source-system differences

Where available, the subject code should be treated as the stronger matching identifier.

Conceptually:

```text
External Subject
      ↓
Subject Code
      ↓
Acadlytic Subject
      ↓
Academic Structure
```

Unknown subjects should be identified for review rather than silently created.

---

# 8. Backlog Management Problem

A student's failed subject may require additional examination attempts.

A simple result list does not necessarily provide enough context to answer:

- When did the backlog originate?
- How many attempts occurred?
- Is the backlog still open?
- Which attempt resolved it?
- What was the student's historical result?

A structured backlog model should therefore distinguish:

```text
Attempt History
       ≠
Backlog State
```

For example:

```text
Subject A
   │
   ├── Attempt 1 → Fail
   │
   ├── Attempt 2 → Fail
   │
   └── Attempt 3 → Pass
                    │
                    └── Backlog Resolved
```

This distinction is central to Acadlytic.

---

# 9. Longitudinal Academic Record Problem

Academic performance becomes more meaningful when information from multiple semesters is available together.

A longitudinal record may include:

```text
Student
  ↓
Semester 1
  ├── Subjects
  ├── Results
  └── SGPA
  ↓
Semester 2
  ├── Subjects
  ├── Results
  └── SGPA
  ↓
Semester 3
  ├── Subjects
  ├── Results
  └── SGPA
  ↓
...
  ↓
Current Academic State
```

Without centralized historical data, creating this view may require manual consolidation.

Acadlytic's Academic Passport is intended to address this problem.

---

# 10. Academic Reporting Problem

Colleges may need information at different levels.

### Student

- result history
- SGPA
- CGPA
- backlogs
- progress

### Subject

- performance
- pass/fail outcomes
- backlog patterns

### Semester

- overall semester performance
- result distribution
- academic trends

### Course / Program

- student performance
- backlog patterns
- performance trends

### College

- academic KPIs
- overall performance
- backlog trends
- semester outcomes

A structured data foundation makes these views easier to generate consistently.

---

# 11. Academic Analytics Opportunity

Once academic records are structured, the same underlying data can support multiple analytical views.

The conceptual relationship is:

```text
Authoritative Academic Data
          ↓
     Analytics Layer
          ↓
 ┌────────┼─────────┐
 ↓        ↓         ↓
Student  Subject   College
 ↓        ↓         ↓
Semester Course   Trends
```

This creates an opportunity for Acadlytic to provide more value than simple result storage.

---

# 12. Market Opportunity Hypothesis

The initial product hypothesis is:

> Colleges that regularly process university examination results and maintain student academic records may benefit from a specialized platform that centralizes result processing, academic history, backlog tracking, and academic analytics.

This is a hypothesis that requires validation through actual college workflows and user interviews.

It should not be treated as proven market demand until validated.

---

# 13. Target Institutional Environment

The initial target environment is:

- university-affiliated colleges
- colleges receiving university examination results
- colleges maintaining student academic records
- academic departments
- examination/result administration teams
- academic coordinators

The initial focus should remain narrow enough to validate the core result-management problem.

---

# 14. Primary Operational Users

The core operational users are:

### SUPER_ADMIN

Platform-level administration.

### COLLEGE_ADMIN

College-level administration.

### ACADEMIC_STAFF

Academic operations and result workflows.

### STUDENT

Self-service academic access.

These roles represent different points in the academic information lifecycle.

---

# 15. User Value Hypothesis

## 15.1 College Admin

Potential value:

- centralized academic information
- easier student management
- controlled result processing
- better academic visibility
- reduced manual consolidation

## 15.2 Academic Staff

Potential value:

- structured result import
- validation workflow
- student/result matching
- backlog tracking
- easier academic record review

## 15.3 Students

Potential value:

- centralized academic history
- Academic Passport
- result visibility
- backlog visibility
- academic progress

## 15.4 Platform Administrator

Potential value:

- centralized tenant management
- controlled user provisioning
- platform-wide administration
- consistent security model

---

# 16. Existing Workflow Categories

The academic result-management environment can broadly be considered in several categories.

### Category 1 — Manual Workflows

Examples:

- spreadsheets
- documents
- manually maintained records
- manual result matching

### Category 2 — General Student Information Systems

These may manage broader institutional information.

### Category 3 — College ERP Platforms

These may provide multiple administrative modules such as:

- fees
- attendance
- student management
- examination
- communication

### Category 4 — University Systems

These are systems operated by universities for official academic processes.

### Category 5 — Specialized Academic Analytics

These focus on analysis and reporting rather than complete academic record workflows.

Acadlytic's intended position is between academic record processing and academic intelligence.

---

# 17. Acadlytic's Intended Market Position

Acadlytic should not initially compete by trying to replace every college ERP system.

Instead, it should focus on:

```text
University Result Data
        ↓
Result Processing
        ↓
Academic Records
        ↓
Backlog Intelligence
        ↓
Academic Passport
        ↓
Academic Analytics
```

This creates a more specific product position.

---

# 18. Differentiation Hypothesis

Potential differentiation areas include:

### 18.1 Result Lifecycle

Instead of only storing results, manage:

```text
Import
  ↓
Validate
  ↓
Process
  ↓
Track
  ↓
Analyze
```

### 18.2 Historical Academic Context

Preserve attempts and historical academic information.

### 18.3 Backlog Intelligence

Represent backlog state separately from attempt history.

### 18.4 Academic Passport

Provide a unified longitudinal academic representation.

### 18.5 Academic Analytics

Generate useful views from authoritative academic records.

### 18.6 University-Aware Architecture

Support different academic environments without hard-coding unsupported university rules.

---

# 19. Product Moat Hypothesis

Over time, Acadlytic could develop defensibility through a combination of:

- structured academic data
- longitudinal student records
- result-processing workflows
- academic rule configuration
- university integrations
- backlog history
- analytics
- institutional workflows
- accumulated domain knowledge

The potential moat is therefore more likely to come from **academic data structure, workflow integration, and institutional adoption** than from UI alone.

This remains a product hypothesis and requires market validation.

---

# 20. Data Accumulation Advantage

A student's academic history becomes more valuable when multiple result cycles are connected.

For example:

```text
Semester 1
    ↓
Semester 2
    ↓
Semester 3
    ↓
Supplementary Attempt
    ↓
Semester 4
    ↓
Backlog Resolution
    ↓
Graduation
```

A platform that maintains this history can provide increasingly useful longitudinal information.

The value of the platform can therefore increase as reliable academic history accumulates.

---

# 21. Automation Opportunity

The result workflow contains several repetitive activities that may be suitable for automation.

Potential areas include:

- file parsing
- column mapping
- student matching
- subject matching
- duplicate detection
- validation
- result processing
- backlog state updates
- reporting
- notifications

However, automation must preserve:

- academic correctness
- traceability
- human review where necessary
- authorization
- tenant isolation

The product principle is:

> **Automate repetitive work without removing academic control.**

---

# 22. Integration Opportunity

A future opportunity is authorized integration with university systems.

Potential integration models include:

- API
- webhook
- approved data feed
- scheduled export
- authorized synchronization

Future integration could reduce manual file handling.

The intended architecture is:

```text
University System
       ↓
Authorized Connector
       ↓
Acadlytic Import Pipeline
       ↓
Validation
       ↓
Processing
       ↓
Academic Records
```

Unauthorized scraping is outside the product direction.

---

# 23. Research Questions

The following questions should be validated through market research.

### Institutional Workflow

1. How do colleges currently receive university results?
2. Which file formats are commonly used?
3. Who processes the results?
4. How much manual work is involved?
5. How frequently are results processed?

### Student Matching

6. Which student identifiers are available?
7. How are result records matched today?
8. What types of matching errors occur?

### Backlogs

9. How are failed subjects tracked?
10. How are supplementary attempts recorded?
11. How is backlog resolution confirmed?

### Academic Records

12. Where are historical semester results stored?
13. Can staff view a student's complete academic history?
14. How are SGPA and CGPA maintained?

### Reporting

15. What reports are generated regularly?
16. Who needs academic analytics?
17. Which reports require manual preparation?

### Existing Software

18. What software is currently used?
19. Which features are considered useful?
20. Which workflows remain manual?
21. What are the biggest complaints about current tools?

### Purchasing

22. Who makes the purchasing decision?
23. Is the problem important enough to justify paid software?
24. What pricing model would be acceptable?
25. What would prevent adoption?

---

# 24. Validation Methods

The market hypotheses should eventually be validated through:

- interviews with College Admins
- interviews with academic staff
- interviews with examination/result staff
- student interviews
- workflow observation
- existing software evaluation
- sample result-file analysis
- pilot deployments
- prototype testing
- usability testing
- quantitative surveys where appropriate

The goal is to observe actual workflows rather than relying only on assumptions.

---

# 25. Research Evidence Hierarchy

Not all research evidence should be treated equally.

A useful hierarchy is:

```text
Actual User Workflow
        ↓
Observed Operational Problem
        ↓
Repeated User Feedback
        ↓
Pilot Usage Data
        ↓
Structured Interviews
        ↓
Survey Data
        ↓
Secondary Research
        ↓
Product Assumptions
```

Direct evidence from actual college workflows should receive greater weight than assumptions.

---

# 26. Research Validation Principle

A product hypothesis should not automatically become a product requirement.

The intended flow is:

```text
Hypothesis
    ↓
Research
    ↓
Evidence
    ↓
Validated Problem
    ↓
Product Requirement
    ↓
Feature
```

If evidence contradicts a hypothesis, the product requirement should be reconsidered.

---

# 27. Market Research Boundaries

This document does not currently establish:

- exact total addressable market
- serviceable available market
- serviceable obtainable market
- verified number of target colleges
- verified market revenue
- confirmed competitor market share
- confirmed willingness to pay
- confirmed pricing
- confirmed customer acquisition cost
- confirmed retention
- confirmed product-market fit

These require dedicated research and evidence.

---

# 28. Research Risks

Several assumptions require validation.

### Risk 1 — Existing Systems May Already Solve the Problem

Colleges may already have ERP or academic software that covers some of the intended functionality.

### Risk 2 — Manual Work May Be Considered Acceptable

The operational pain may not be strong enough to motivate software adoption.

### Risk 3 — Data Formats May Vary Significantly

University result formats may differ across institutions.

### Risk 4 — Academic Rules May Be Complex

Different universities may have substantially different academic structures and calculation rules.

### Risk 5 — Purchasing Decisions May Be Difficult

The user experiencing the problem may not be the person responsible for purchasing software.

### Risk 6 — Integration May Be the Strongest Requirement

Colleges may value automatic university integration more than manual result import.

### Risk 7 — Data Privacy Requirements May Affect Adoption

Academic records are sensitive institutional information and may require strong security and governance.

---

# 29. Market Research Priorities

Research should initially prioritize:

1. actual result-processing workflows
2. current academic record systems
3. backlog tracking methods
4. result-file formats
5. student/result matching problems
6. academic reporting requirements
7. existing software gaps
8. willingness to adopt a specialized solution
9. purchasing process
10. integration expectations

These questions directly influence the MVP.

---

# 30. Research-to-Product Relationship

Market research should influence product development as follows:

```text
Market Research
       ↓
Problem Validation
       ↓
User Definition
       ↓
PRD
       ↓
MVP Scope
       ↓
Architecture
       ↓
Implementation
```

Research should therefore be completed and reviewed before major product assumptions are treated as final requirements.

---

# 31. MVP Research Hypothesis

The initial MVP hypothesis is:

> A university-affiliated college can benefit from a centralized system that imports university result files, validates and processes academic records, tracks backlogs, maintains a longitudinal Academic Passport, and provides academic analytics.

This hypothesis must be validated with real target users.

---

# 32. Research Success Criteria

Market research should be considered sufficiently informative when the project has evidence for:

- a clearly defined operational problem
- identifiable target users
- repeated pain points
- current workflow understanding
- existing solution understanding
- meaningful gaps in existing workflows
- realistic MVP scope
- evidence supporting or challenging the product hypothesis
- clear unresolved assumptions
- prioritized research gaps

---

# 33. Research Outputs

The research phase should ultimately produce:

```text
Market Research
      ↓
Competitor Analysis
      ↓
Problem Validation
      ↓
Research Conclusions
      ↓
Product Decisions
```

The four research documents should work together.

### `market-research.md`

Defines the broader problem and market environment.

### `competitor-analysis.md`

Evaluates existing solutions and alternatives.

### `problem-validation.md`

Tests whether the identified problems actually exist and matter.

### `research-conclusions.md`

Converts research evidence into product conclusions and decisions.

---

# 34. Important Research Principle

> **Acadlytic should be built around validated academic problems, not assumptions about what colleges might need.**

The purpose of research is not to prove that the original idea is correct.

The purpose is to determine:

- what problem actually exists
- who experiences it
- how severe it is
- how it is currently solved
- whether existing solutions are sufficient
- whether Acadlytic can provide meaningful additional value

---

# 35. Definition of Done

This document is ready for approval when:

- the research scope is clear
- the target institutional environment is clear
- the core academic workflow problem is documented
- result processing challenges are identified
- backlog challenges are identified
- longitudinal academic record challenges are identified
- analytics opportunities are identified
- target users are identified
- market hypotheses are clearly labeled as hypotheses
- research questions are documented
- validation methods are defined
- research risks are identified
- unsupported market claims are avoided
- research gaps are explicitly documented

---

# 36. Final Principle

> **Market research for Acadlytic should focus on understanding real academic workflows, validating real operational problems, identifying gaps in existing solutions, and determining whether a specialized academic intelligence platform provides enough value to justify adoption.**