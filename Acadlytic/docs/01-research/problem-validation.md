# Acadlytic — Problem Validation

**Document:** `01-research/problem-validation.md`  
**Project:** Acadlytic  
**Document Status:** Draft / Under Review  
**Document Type:** Problem Validation  
**Last Updated:** 2026-10-05

---

# 1. Purpose

This document defines how Acadlytic's core problem hypotheses should be validated before significant product investment.

The purpose is not to prove that Acadlytic is a good idea.

The purpose is to determine whether the problems identified during product discovery are:

- real
- frequent
- costly
- important
- currently underserved
- sufficiently painful to justify a dedicated solution

Problem validation should happen before treating assumptions as product requirements.

---

# 2. Core Problem Hypothesis

Acadlytic is based on the hypothesis that university-affiliated colleges face difficulty managing student academic data after university results are published.

The hypothesized workflow is:

```text
University Result
      ↓
Result File
      ↓
Manual Processing
      ↓
Student Matching
      ↓
Academic Record Updates
      ↓
Backlog Tracking
      ↓
Reporting
```

The central hypothesis is that this workflow can become fragmented, repetitive, error-prone, and difficult to maintain over multiple semesters.

This remains a hypothesis until validated with real users and evidence.

---

# 3. Problem Statement

### Current Hypothesis

University-affiliated colleges may receive academic results in formats that require staff to manually process, validate, match, consolidate, and maintain student academic information.

Over time, this may make it difficult to maintain:

- complete student academic histories
- accurate backlog information
- semester-wise academic records
- consistent result data
- reliable academic reports
- student-facing academic views

---

# 4. Problem Areas

The problem should be evaluated across several independent areas.

```text
                    Academic Data Management
                              │
       ┌──────────────┬───────┼────────┬──────────────┐
       ↓              ↓       ↓        ↓              ↓
    Import        Matching Validation Processing   Reporting
       │              │       │        │              │
       └──────────────┴───────┼────────┴──────────────┘
                              ↓
                       Academic History
                              ↓
                     Backlog Management
                              ↓
                         Analytics
```

Each area must be validated independently.

---

# 5. Problem Hypothesis 1 — Result Processing

## Hypothesis

Academic staff may spend significant manual effort processing university result files.

Potential activities include:

- opening result files
- checking columns
- matching students
- matching subjects
- identifying failed subjects
- updating records
- preparing reports

## Validation Questions

Ask:

1. How are university results currently received?
2. Which file formats are used?
3. Who processes the result files?
4. How long does processing take?
5. How many students are typically processed?
6. How often are results processed?
7. Which steps are manual?
8. Which steps are most error-prone?
9. What happens when a student cannot be matched?
10. What happens when a subject cannot be matched?

---

# 6. Problem Hypothesis 2 — Student Matching

## Hypothesis

Matching university result records with existing college student records may require manual intervention.

Potential causes include:

- different identifiers
- inconsistent names
- missing records
- incorrect identifiers
- formatting differences

## Validation Questions

- What identifier is used for matching?
- Is the identifier consistent across semesters?
- How often are students unmatched?
- How are unmatched records resolved?
- Who resolves them?
- Is manual matching recorded?
- Are duplicate students a problem?
- What happens when a student changes academic context?

---

# 7. Problem Hypothesis 3 — Subject Matching

## Hypothesis

University result files may contain subject information that must be mapped to the college's academic structure.

Potential problems include:

- unknown subject codes
- changed subject codes
- semester differences
- naming differences
- regulation differences

## Validation Questions

- Are subject codes stable?
- Who maintains subject mappings?
- How are new subjects handled?
- Are subject codes reused?
- Can the same subject name have different codes?
- Does the university use different regulations?
- How often do subject mappings need updating?

---

# 8. Problem Hypothesis 4 — Academic History

## Hypothesis

Maintaining a complete longitudinal academic history may become difficult when results are processed independently each semester.

Potential information includes:

- semester results
- subject attempts
- credits
- grades
- SGPA
- CGPA
- failed subjects
- subsequent attempts

## Validation Questions

- Where is historical result information stored?
- Can staff see a student's complete academic history?
- Is information stored semester-by-semester?
- Can previous attempts be identified?
- Can staff determine when a backlog was resolved?
- Is historical data retained after updates?

---

# 9. Problem Hypothesis 5 — Backlog Tracking

## Hypothesis

Colleges may need a reliable mechanism for identifying, monitoring, and resolving student backlogs.

Potential difficulties include:

- identifying open backlogs
- tracking repeated attempts
- determining whether a backlog has been resolved
- distinguishing current failure from historical failure
- preparing backlog reports

## Validation Questions

- How are backlogs currently tracked?
- Is there a dedicated backlog register?
- Is backlog information maintained in Excel?
- How are supplementary attempts recorded?
- How is a resolved backlog identified?
- Can staff see backlog history?
- How frequently is backlog information updated?

---

# 10. Problem Hypothesis 6 — Reporting

## Hypothesis

Academic staff may spend manual effort preparing reports from fragmented academic data.

Potential reports include:

- student performance
- pass/fail statistics
- backlog reports
- semester performance
- subject performance
- course performance
- CGPA distribution

## Validation Questions

- Which reports are required?
- Who prepares them?
- How frequently are reports generated?
- How long does preparation take?
- What data sources are used?
- Are reports generated automatically?
- Which reports are most important to management?

---

# 11. Problem Hypothesis 7 — Student Visibility

## Hypothesis

Students may not have a centralized view of their complete academic history.

Potential information includes:

- semester results
- SGPA
- CGPA
- credits
- attempts
- backlogs
- academic status

## Validation Questions

- Where do students currently access results?
- Can students see their complete academic history?
- Can students identify open backlogs easily?
- Can students track improvement over semesters?
- Do students maintain personal spreadsheets or records?
- What academic information do students request from staff?

---

# 12. Problem Hypothesis 8 — Data Fragmentation

## Hypothesis

Academic information may exist across multiple systems and files.

Potential sources include:

- university result portals
- Excel files
- CSV files
- college ERP
- department spreadsheets
- student records
- manually maintained reports

## Validation Questions

- How many systems are involved?
- Which system is considered authoritative?
- Are duplicate records common?
- How are data discrepancies resolved?
- Is there a single student academic view?

---

# 13. Problem Hypothesis 9 — Data Quality

## Hypothesis

Manual academic data processing may introduce errors.

Potential error types include:

- incorrect student matching
- duplicate records
- incorrect subject mapping
- incorrect status
- missing results
- duplicate attempts
- incorrect backlog status

## Validation Questions

- How frequently are errors discovered?
- Who discovers them?
- How are corrections performed?
- Are corrections audited?
- Can previous values be recovered?
- What is the impact of an incorrect record?

---

# 14. Problem Hypothesis 10 — Repetitive Administrative Work

## Hypothesis

Academic staff may repeatedly perform the same result-processing activities after every result release.

Potential repetitive tasks include:

- downloading files
- formatting data
- matching students
- checking subjects
- updating records
- preparing reports
- identifying backlogs

## Validation Questions

- How often does this workflow occur?
- How many staff members participate?
- How many hours are spent per result cycle?
- Which steps are repetitive?
- Which steps could be automated safely?

---

# 15. Target Users for Validation

Problem validation should prioritize people who directly experience the workflow.

## Primary

### Academic Staff

Responsible for:

- result processing
- academic records
- backlog management
- student academic support

### College Administrators

Responsible for:

- institutional oversight
- reporting
- academic monitoring
- decision-making

---

## Secondary

### Students

Relevant to:

- academic history
- backlog visibility
- result access
- performance tracking

---

## Tertiary

### University-Level Stakeholders

Potentially relevant for:

- result publication
- academic regulations
- integrations
- official academic data

These users may become more important in future integrations.

---

# 16. User Interview Framework

Interviews should focus on actual behavior rather than hypothetical opinions.

Avoid asking:

> Would you use Acadlytic?

Prefer asking:

> How do you currently process university results?

Avoid asking:

> Would automated backlog tracking be useful?

Prefer asking:

> How do you currently identify students with unresolved backlogs?

Avoid asking:

> Do you want analytics?

Prefer asking:

> What academic reports do you prepare each semester?

---

# 17. Interview Structure

## Section 1 — Role

- What is your role?
- What academic processes are you responsible for?
- How many students are involved?

## Section 2 — Current Workflow

- How do university results arrive?
- What happens after receiving them?
- Who processes them?
- What systems or files are used?

## Section 3 — Pain Points

- Which step takes the most time?
- Which step creates the most errors?
- What requires repeated manual work?
- What information is difficult to find?

## Section 4 — Backlogs

- How are failed subjects tracked?
- How are repeat attempts handled?
- How do you know when a backlog is resolved?

## Section 5 — Reporting

- Which reports are required?
- Who requests them?
- How are they currently prepared?

## Section 6 — Existing Solutions

- What software is currently used?
- What works well?
- What does not work well?
- What work still happens outside the system?

---

# 18. Evidence Collection

Problem validation should use multiple evidence sources.

## Primary Evidence

Highest-value evidence includes:

- user interviews
- workflow observation
- real result-processing sessions
- actual spreadsheets
- sample result files
- existing reports
- existing academic databases

---

## Secondary Evidence

Useful supporting evidence may include:

- product documentation
- institutional documentation
- public university workflows
- competitor documentation
- academic technology research

Secondary evidence should not replace direct user validation.

---

# 19. Evidence Strength

Evidence should be classified.

### Strong Evidence

Observed behavior or actual workflow data.

Examples:

- staff processing a result file
- real spreadsheet used for backlog tracking
- documented processing time

### Medium Evidence

Repeated user reports from multiple institutions.

### Weak Evidence

A single opinion or assumption.

### Unvalidated

Product-team assumption without supporting evidence.

---

# 20. Problem Severity Framework

Each validated problem can be evaluated using:

| Dimension | Question |
|---|---|
| Frequency | How often does it occur? |
| Effort | How much work does it require? |
| Error Risk | How easily can mistakes occur? |
| Impact | What happens when it goes wrong? |
| User Count | How many people experience it? |
| Workaround | Is there an existing workaround? |
| Cost | Does it create measurable cost? |
| Urgency | Must it be solved quickly? |

---

# 21. Problem Scoring

A problem can be scored after sufficient evidence is collected.

Example:

| Score | Meaning |
|---:|---|
| 1 | Very Low |
| 2 | Low |
| 3 | Moderate |
| 4 | High |
| 5 | Very High |

Possible dimensions:

- frequency
- effort
- impact
- error risk
- urgency

The scoring system should support prioritization rather than create artificial precision.

---

# 22. Validation Matrix

| Problem | Hypothesis | Evidence | Confidence | Priority |
|---|---|---|---|---|
| Result processing | Manual processing is significant | To validate | Unknown | High |
| Student matching | Matching creates manual effort | To validate | Unknown | High |
| Subject matching | Subject mapping creates issues | To validate | Unknown | Medium |
| Academic history | Longitudinal records are fragmented | To validate | Unknown | High |
| Backlog tracking | Backlog tracking is difficult | To validate | Unknown | High |
| Reporting | Reports require manual preparation | To validate | Unknown | Medium |
| Student visibility | Students lack unified academic view | To validate | Unknown | Medium |
| Data fragmentation | Academic data exists across sources | To validate | Unknown | High |
| Data quality | Manual workflows introduce errors | To validate | Unknown | High |
| Repetitive work | Staff repeat the same workflow | To validate | Unknown | High |

This table must be updated as evidence is collected.

---

# 23. Validation Criteria

A problem should be considered strongly validated when:

- multiple relevant users report it
- the problem occurs in real workflows
- the problem is sufficiently frequent
- the problem creates measurable effort or risk
- users already have a workaround
- the workaround is inconvenient or costly
- the problem affects an important academic process

One interview should not be treated as conclusive validation.

---

# 24. Invalidating Evidence

Acadlytic should also actively search for evidence that disproves its assumptions.

Examples:

- colleges already have effective result automation
- ERP systems completely solve the workflow
- staff do not experience meaningful pain
- result processing occurs rarely
- backlog tracking is already automated
- users do not value centralized academic history
- implementation complexity exceeds the perceived value

Negative evidence should be documented rather than ignored.

---

# 25. Existing Workarounds

Validation should document how users currently solve problems.

Possible workarounds include:

```text
Excel
Google Sheets
Manual Registers
College ERP
University Portal
Custom Software
Department Database
Email
Printed Reports
```

The existence of a workaround does not mean there is no problem.

The important question is:

> Why does the current workaround continue to exist, and what does it fail to solve?

---

# 26. Switching Cost Validation

Before positioning Acadlytic as a replacement system, investigate:

- existing software contracts
- data migration requirements
- staff training
- institutional approval
- integration requirements
- existing workflows
- user resistance
- data ownership
- security requirements

A technically better product may still fail if switching costs are too high.

---

# 27. Willingness-to-Pay Validation

Problem validation should be separated from willingness-to-pay validation.

A user saying:

> "This would be useful."

does not prove:

> "The college will pay for this."

Willingness-to-pay research should investigate:

- budget ownership
- purchasing authority
- current software spending
- procurement process
- acceptable pricing model
- implementation cost expectations

---

# 28. MVP Problem Validation

The MVP should focus on the problems most closely connected to the core workflow.

Primary hypotheses:

```text
Result Import
     ↓
Result Validation
     ↓
Result Processing
     ↓
Academic Record
     ↓
Backlog Tracking
     ↓
Academic Passport
     ↓
Basic Analytics
```

The MVP should not depend on validating every future feature.

---

# 29. Features Requiring Separate Validation

The following should not automatically be included merely because they appear in the future roadmap:

- AI Query
- predictive analytics
- Academic Risk Intelligence
- What-If Simulator
- Regulation & Eligibility Engine
- automatic university result monitoring
- live university APIs
- mobile application
- advanced SaaS billing

Each should have its own problem and value validation before implementation.

---

# 30. Validation Experiment Examples

## Experiment 1 — Result Processing Observation

Observe academic staff processing one real result file.

Measure:

- processing time
- number of manual steps
- number of corrections
- number of unmatched records
- number of unknown subjects
- number of reports produced

---

## Experiment 2 — Backlog Tracking Review

Review an existing backlog spreadsheet or equivalent workflow.

Measure:

- number of fields
- update frequency
- number of students
- number of attempts
- number of manual corrections
- time required to produce a backlog report

---

## Experiment 3 — Academic History Retrieval

Ask staff to retrieve the complete academic history of selected students.

Measure:

- number of systems/files accessed
- time required
- missing information
- duplicate information
- manual calculations required

---

## Experiment 4 — Reporting Workflow

Ask staff to produce a common academic report using the current system.

Measure:

- preparation time
- data sources
- manual calculations
- spreadsheet operations
- correction cycles

---

# 31. Success Metrics for Validation

Potential validation metrics include:

### Workflow Time

Time required to process a result release.

### Manual Steps

Number of manual operations.

### Error Rate

Number of identified processing errors.

### Unmatched Records

Number or percentage of records requiring manual resolution.

### Backlog Resolution Effort

Time required to identify and update backlog status.

### Report Preparation Time

Time required to produce common reports.

### Data Retrieval Time

Time required to find complete student academic history.

These metrics should be measured using actual workflows.

---

# 32. Validation Decision Framework

After research, each hypothesis should receive one of four outcomes:

### Validated

Evidence strongly supports the problem.

### Partially Validated

Problem exists but scope or severity is uncertain.

### Invalidated

Evidence does not support the original assumption.

### Needs More Research

Evidence is insufficient.

---

# 33. Example Validation Record

```text
Problem:
Manual university result processing

Users:
Academic Staff

Observed Workflow:
Result file → Excel → student matching → subject matching → report

Evidence:
Observed in real workflow

Frequency:
Every major result release

Impact:
High administrative effort

Existing Workaround:
Spreadsheet processing

Confidence:
High

Decision:
Validated

Product Implication:
Prioritize structured result import and validation
```

---

# 34. Research Log

Each validation activity should be recorded.

| Date | User Type | Activity | Evidence | Result | Confidence |
|---|---|---|---|---|---|
| TBD | Academic Staff | Interview | TBD | TBD | TBD |
| TBD | College Admin | Interview | TBD | TBD | TBD |
| TBD | Academic Staff | Workflow Observation | TBD | TBD | TBD |
| TBD | Student | Interview | TBD | TBD | TBD |

The table should be updated as research progresses.

---

# 35. Validation Rules

### Rule 1

Do not validate features before validating problems.

### Rule 2

Prefer observed behavior over stated preferences.

### Rule 3

Ask about current workflows before presenting Acadlytic.

### Rule 4

Document negative evidence.

### Rule 5

Do not treat a single interview as market validation.

### Rule 6

Separate problem validation from solution validation.

### Rule 7

Separate usefulness from willingness to pay.

### Rule 8

Measure operational impact whenever possible.

---

# 36. Problem-to-Product Mapping

Validated problems should map to product capabilities.

| Validated Problem | Potential Product Response |
|---|---|
| Manual result processing | Result Import |
| Invalid result data | Validation Pipeline |
| Student matching difficulty | Student Matching |
| Subject mapping difficulty | Subject Mapping |
| Fragmented history | Academic Record |
| Backlog tracking difficulty | Backlog Management |
| Difficult academic history retrieval | Academic Passport |
| Manual reporting | Analytics |
| Student visibility gap | Student Portal |

This mapping should only become a commitment after problem validation.

---

# 37. What Problem Validation Does Not Prove

Successful problem validation does not prove:

- product-market fit
- willingness to pay
- technical feasibility
- institutional adoption
- retention
- scalability
- commercial success

Those require separate validation activities.

---

# 38. Research-to-Product Decision

After validation, the product team should determine:

```text
Problem Validated?
       │
   ┌───┴───┐
  Yes      No
   │        │
   ↓        ↓
Prioritize  Reassess
   │        │
   ↓        ↓
Design     Research
Solution   Further
```

A feature should not be prioritized simply because it exists in the original product idea.

---

# 39. Expected Validation Outcome

The desired outcome is a documented understanding of:

- who experiences the problem
- how frequently it occurs
- how the problem is currently solved
- what the workaround costs
- what errors occur
- what impact those errors have
- what users consider most painful
- which problems are worth solving first

---

# 40. Definition of Done

This document is ready for approval when:

- core problem hypotheses are documented
- target users are defined
- interview questions are prepared
- validation experiments are defined
- evidence standards are defined
- problem severity criteria are established
- existing workarounds are documented
- invalidating evidence is considered
- validation metrics are defined
- validation outcomes can be classified
-