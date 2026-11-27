# Acadlytic — Module 3.6C: Replacement Document Active-Set Verification Report v1.0

**Phase:** 03 — Super Admin Review Workflow  
**Module:** 3.6C — Backend College Approval Integration & Lifecycle  
**Investigation Topic:** Replacement Document Active-Set Calculation & `replacesDocumentId` Semantics  
**Date:** 2026-11-26  
**Reference:** Approved Planning Specification v1.1 + BF-07 through BF-12 Clarification Addendum  
**Status:** VERIFIED & VALIDATED

---

## 1. Executive Summary

A review inquiry was raised regarding the active-document calculation description in `Module-3.6C-Implementation-Report-v1.0.md`, which stated:
> *"Superseded documents (replacesDocumentId != null) within the revision are excluded, computing the active verification set."*

The concern was whether excluding documents where `replacesDocumentId != null` would erroneously exclude the **replacement document itself**, since replacement documents carry the non-null ID of the document they replace.

Following a thorough inspection of the database schema (V4 and V6 migrations), the `CollegeRegistrationDocument` entity, `CollegeOnboardingService`, `CollegeReviewService`, and end-to-end integration tests:

1. **Production Code is 100% Correct:** The production Java implementation in `CollegeReviewService.java` (lines 517–524) does **not** exclude documents where `d.getReplacesDocumentId() != null`. Instead, it extracts the collection of IDs referenced by `replacesDocumentId` (`supersededIds`) and excludes only documents **whose primary key `d.getId()` is in that set**.
2. **Replacement Document is Retained:** The replacement document itself carries `d.getId() = newId` (which is not in `supersededIds`), so it is correctly retained in `activeDocs`.
3. **No Production Code Fix Required:** Zero production code modifications were needed. The issue was purely an ambiguous summary shorthand in Report v1.0.
4. **Concrete Lifecycle Evidence:** A comprehensive end-to-end integration test (`replacementDocument_activeSetVerification_exactLifecycle`) was added to `CollegeApprovalIntegrationTest.java` (Scenario 15) and passed across all stages (Pending blocks approval -> Rejected blocks approval -> Accepted permits approval).
5. **Full Suite Green:** The full test suite passed with **291/291 tests passing (0 failures, 0 errors, 0 skips)**, and a clean Maven package build completed with **BUILD SUCCESS**.

---

## 2. Source Code & Database Schema Inspection

### 2.1 Database Schema & `replaces_document_id` Constraint
In `backend/src/main/resources/db/migration/V4__college_registration_schema.sql` (lines 55–59):
```sql
CREATE TABLE college_registration_documents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    college_id BIGINT NOT NULL,
    registration_id BIGINT NOT NULL,
    document_category VARCHAR(60) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    storage_key VARCHAR(100) NOT NULL,
    ...
    replaces_document_id BIGINT NULL,
    CONSTRAINT fk_crd_replaces_document_id 
        FOREIGN KEY (replaces_document_id) REFERENCES college_registration_documents (id)
);
```
In `backend/src/main/resources/db/migration/V6__document_level_review.sql` (lines 78–81):
```sql
ALTER TABLE college_registration_documents
    ADD CONSTRAINT uq_crd_registration_replacement UNIQUE (registration_id, replaces_document_id);
```

**Schema Semantics:**
- `id`: The primary key of the document record.
- `replaces_document_id`: A nullable foreign key pointing to the **preceding document** that this document replaces.
- When an applicant uploads a replacement document $D_{\text{new}}$ for an existing document $D_{\text{old}}$:
  - $D_{\text{new}}.\text{id} = \text{newId}$
  - $D_{\text{new}}.\text{replaces\_document\_id} = D_{\text{old}}.\text{id}$
  - $D_{\text{old}}.\text{id} = \text{oldId}$
  - $D_{\text{old}}.\text{replaces\_document\_id} = \text{null}$ (or a previous historical pointer).

---

### 2.2 Entity Mapping in `CollegeRegistrationDocument.java`
Lines 54–55 of [CollegeRegistrationDocument.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/entity/CollegeRegistrationDocument.java#L54-L55):
```java
@Column(name = "replaces_document_id")
private Long replacesDocumentId;
```
The entity faithfully maps the column as a `Long` representing the target superseded document ID.

---

### 2.3 Replacement Creation in `CollegeOnboardingService.java`
Lines 576–580 of [CollegeOnboardingService.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/service/CollegeOnboardingService.java#L576-L580):
```java
// Target replacement ID is the ID of the document being replaced (resolvedTargetId)
doc.setReplacesDocumentId(targetReplacementId);
doc.setVerificationStatus(DocumentVerificationStatus.PENDING);
doc.setVerificationProvenance(DocumentVerificationProvenance.NOT_REVIEWED);
doc.setVersion(0L);
doc = collegeRegistrationDocumentRepository.save(doc);
```
When uploading a replacement document during a correction draft:
- $D_{\text{new}}$ is inserted into `college_registration_documents` with `registration_id = v2.id` and `replaces_document_id = v1_target_doc.id`.
- The rejected $D_{\text{old}}$ from revision v1 was already filtered out and never carried forward into revision v2 (lines 317–321 of `CollegeOnboardingService.java`).

---

### 2.4 Active-Document Selection Logic in `CollegeReviewService.java`
Lines 513–524 of [CollegeReviewService.java](file:///c:/React/Acadlytic/backend/src/main/java/com/acadlytic/modules/colleges/service/CollegeReviewService.java#L513-L524):
```java
List<CollegeRegistrationDocument> docs = collegeRegistrationDocumentRepository
        .findByRegistrationIdWithLock(submittedRevision.getId());

// Filter to active documents (excluding superseded documents)
Set<Long> supersededIds = docs.stream()
        .map(CollegeRegistrationDocument::getReplacesDocumentId)
        .filter(Objects::nonNull)
        .collect(Collectors.toSet());

List<CollegeRegistrationDocument> activeDocs = docs.stream()
        .filter(d -> !supersededIds.contains(d.getId()))
        .toList();
```

**Mathematical Trace of Active-Document Selection:**

1. **Step 1 — Document Scope:**  
   `findByRegistrationIdWithLock(submittedRevision.getId())` queries **strictly** rows where `registration_id = submittedRevision.getId()`.  
   Historical documents from revision v1 ($D_{\text{old}}$) are **not** in `docs` because their `registration_id` is revision v1's ID.
2. **Step 2 — Superseded IDs Collection:**  
   For each document $d \in \text{docs}$, `d.getReplacesDocumentId()` extracts the target ID that $d$ superseded.
   - If $D_{\text{new}}$ replaces $D_{\text{old}}$ (where $D_{\text{old}} \in \text{v1}$):  
     `supersededIds` contains $\{ D_{\text{old}}.\text{id} \}$.
   - If an applicant uploaded $D_{\text{draft1}}$ in v2 and later replaced it with $D_{\text{draft2}}$ in v2:  
     `supersededIds` contains $\{ D_{\text{draft1}}.\text{id} \}$.
3. **Step 3 — Predicate Filtering:**  
   `docs.stream().filter(d -> !supersededIds.contains(d.getId()))`
   - For $D_{\text{new}}$: $D_{\text{new}}.\text{id}$ is **not** in $\text{supersededIds}$ (unless $D_{\text{new}}$ was itself replaced).  
     Therefore, `!supersededIds.contains(D_new.getId())` evaluates to `true`!  
     **Result:** $D_{\text{new}}$ is **RETAINED in `activeDocs`**.
   - For an intra-revision superseded document $D_{\text{draft1}}$: $D_{\text{draft1}}.\text{id} \in \text{supersededIds}$.  
     Therefore, `!supersededIds.contains(D_draft1.getId())` evaluates to `false`!  
     **Result:** $D_{\text{draft1}}$ is **EXCLUDED from `activeDocs`**.

---

## 3. Analysis: Was Production Code Modification Necessary?

### Finding: NO PRODUCTION CODE MODIFICATION WAS NECESSARY

The production code in `CollegeReviewService.java`, `CollegeOnboardingService.java`, and `CollegeRegistrationDocumentRepository.java` is **100% correct and aligned with architectural intent**.

| Query / Operation | What Report v1.0 Stated | What Production Code Actually Executes | Impact on Replacement Documents |
| :--- | :--- | :--- | :--- |
| **Active Filtering** | Shorthand text: `"(replacesDocumentId != null) within the revision are excluded"` | `!supersededIds.contains(d.getId())` where `supersededIds` = all non-null `replacesDocumentId` values | Replacement document is **retained**; only documents whose IDs are referenced as superseded are excluded |
| **Cross-Revision Isolation** | Isolated to submitted revision | `findByRegistrationIdWithLock(submittedRevision.getId())` | Preceding revision documents cannot satisfy gates |

The confusion stemmed solely from the shorthand notation in Section 2.1 of Report v1.0 (`"Superseded documents (replacesDocumentId != null)"`), which abbreviated the explanation of which rows *defined* the superseded set, rather than explaining the set difference operation.

---

## 4. Exact Test Evidence: Replacement Document Lifecycle

To prove this behavior beyond any ambiguity, a dedicated multi-stage lifecycle integration test was implemented in [CollegeApprovalIntegrationTest.java](file:///c:/React/Acadlytic/backend/src/test/java/com/acadlytic/modules/colleges/CollegeApprovalIntegrationTest.java#L784-L925):

### Scenario 15: `replacementDocument_activeSetVerification_exactLifecycle`

This test executes the full real-world lifecycle across two registration revisions with MySQL 8.0.36 Testcontainers:

1. **Revision v1 (Initial Submission):**
   - Upload `UNIVERSITY_AFFILIATION_CERTIFICATE` (ID 1, `ACCEPTED`).
   - Upload `AUTHORIZED_SIGNATORY_ID` (ID 2, `REJECTED`).
   - Super Admin issues `REQUEST_ACTION` (`reviewNotes = "Signatory ID unreadable. Please replace."`).
   - College transitions to `ACTION_REQUIRED`.

2. **Correction Draft v2 Creation:**
   - College Admin creates correction draft v2 (`POST /api/v1/onboarding/corrections/draft`).
   - Assert: Affiliation certificate (ID 1) is carried forward into v2 with `sourceDocumentId = 1`, `replacesDocumentId = null`, `status = ACCEPTED`.
   - Assert: Rejected signatory ID (ID 2) is **not** carried forward into v2 (active draft has exactly 1 document).

3. **Replacement Document Upload referencing v1 Document:**
   - College Admin uploads `signatory_v2_replacement.pdf` with:
     - `documentCategory = AUTHORIZED_SIGNATORY_ID`
     - `replacesDocumentId = 2` (explicitly referencing the rejected v1 document).
   - Assert: Database row for replacement document has `id = 3`, `registration_id = v2.id`, `replaces_document_id = 2`, `verification_status = PENDING`.

4. **Resubmission:**
   - College Admin resubmits revision v2 (`POST /api/v1/onboarding/submit`).
   - College transitions to `PENDING` awaiting review with `currentRegistrationId = v2.id`.

5. **Stage A — Approval Blocked when Replacement is PENDING:**
   - Super Admin calls `recordDecision(APPROVE)`.
   - Assert: HTTP 409 Conflict with `DOCUMENTS_NOT_VERIFIED`:
     ```json
     {
       "errorCode": "DOCUMENTS_NOT_VERIFIED",
       "message": "Cannot approve application: Document 'signatory_v2_replacement.pdf' (AUTHORIZED_SIGNATORY_ID) is pending verification."
     }
     ```
   - **Significance:**
     - Proves replacement document ID 3 **IS included in v2's active verification set**.
     - If it were excluded, the gate would have failed with `400 REQUIRED_DOCUMENTS_MISSING` (missing mandatory signatory ID). Instead, it recognized ID 3 as the active signatory document and enforced its `PENDING` status.
     - Proves the superseded v1 document (which was rejected) cannot satisfy v2's gate.

6. **Stage B — Approval Blocked when Replacement is REJECTED:**
   - Super Admin calls `POST /api/v1/super-admin/colleges/reviews/{collegeId}/documents/{docId}/decision` with `REJECT` (`rejectionReason = "Still blurry and unreadable."`).
   - Super Admin calls `recordDecision(APPROVE)`.
   - Assert: HTTP 409 Conflict with `DOCUMENTS_REJECTED`:
     ```json
     {
       "errorCode": "DOCUMENTS_REJECTED",
       "message": "Cannot approve application: Document 'signatory_v2_replacement.pdf' (AUTHORIZED_SIGNATORY_ID) was rejected. Action must be requested to allow document replacement."
     }
     ```
   - **Significance:** Proves the replacement document's `REJECTED` status actively gates approval.

7. **Stage C — Approval Succeeds when Replacement is ACCEPTED:**
   - Super Admin calls `POST /api/v1/super-admin/colleges/reviews/{collegeId}/documents/{docId}/decision` with `ACCEPT`.
   - Super Admin calls `recordDecision(APPROVE)`.
   - Assert: HTTP 200 OK with `approvalStatus = APPROVED`.
   - Assert: `college.getStatus() == CollegeStatus.ACTIVE`.
   - **Significance:** Proves that once the replacement document in v2 is accepted, the approval gate recognizes all mandatory categories as satisfied and successfully transitions the college to `APPROVED` and `ACTIVE`.

---

## 5. Verification Results

### 5.1 Focused Replacement & Approval Suite Execution
Command:
```powershell
mvn -f backend/pom.xml test -Dtest=CollegeApprovalIntegrationTest
```
Output:
```
[INFO] Running com.acadlytic.modules.colleges.CollegeApprovalIntegrationTest
[INFO] Tests run: 15, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 49.33 s
[INFO] BUILD SUCCESS
```

### 5.2 Targeted Module 3.6 Regression Suite Execution
Command:
```powershell
mvn -f backend/pom.xml test '-Dtest=CollegeApprovalIntegrationTest,CollegeReviewIntegrationTest,DocumentReviewIntegrationTest,CollegeLifecycleIntegrationTest,CollegeOnboardingIntegrationTest,V6DocumentLevelReviewMigrationTest'
```
Output:
```
[INFO] Running com.acadlytic.modules.colleges.CollegeApprovalIntegrationTest
[INFO] Tests run: 15, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 48.71 s
[INFO] Running com.acadlytic.modules.colleges.CollegeLifecycleIntegrationTest
[INFO] Tests run: 23, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 17.65 s
[INFO] Running com.acadlytic.modules.colleges.CollegeOnboardingIntegrationTest
[INFO] Tests run: 40, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 39.88 s
[INFO] Running com.acadlytic.modules.colleges.CollegeReviewIntegrationTest
[INFO] Tests run: 20, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 28.51 s
[INFO] Running com.acadlytic.modules.colleges.DocumentReviewIntegrationTest
[INFO] Tests run: 15, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 24.52 s
[INFO] Running com.acadlytic.modules.colleges.V6DocumentLevelReviewMigrationTest
[INFO] Tests run: 27, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 36.32 s
[INFO] 
[INFO] Results:
[INFO] Tests run: 140, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS (03:33 min)
```

### 5.3 Full Backend Test Suite Execution
Command:
```powershell
mvn -f backend/pom.xml test
```
Output:
```
[INFO] Results:
[INFO] Tests run: 291, Failures: 0, Errors: 0, Skipped: 0
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  05:08 min
[INFO] Finished at: 2026-11-26T20:49:33+05:30
```

### 5.4 Clean Package Build Verification
Command:
```powershell
mvn -f backend/pom.xml clean package -DskipTests
```
Output:
```
[INFO] Building jar: C:\React\Acadlytic\backend\target\acadlytic-backend-0.0.1-SNAPSHOT.jar
[INFO] Replacing main artifact with repackaged archive.
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  38.895 s
[INFO] Finished at: 2026-11-26T20:50:17+05:30
```

---

## 6. Summary of Verification Answers

1. **Relationship Semantics:**  
   `replaces_document_id` on document $B$ stores the ID of document $A$ ($B$ replaces $A$). $B$ is the replacement document; $A$ is the superseded document.
2. **Active Selection Logic:**  
   The code computes $\text{supersededIds} = \{ d.\text{replacesDocumentId} \mid d \in \text{revisionDocs} \}$. The active documents are $\{ d \in \text{revisionDocs} \mid d.\text{id} \notin \text{supersededIds} \}$. Thus, the replacement document ($B$) is retained, and only document $A$ is excluded.
3. **Production Code Correction:**  
   **None required.** The production code was already correct.
4. **Lifecycle Verification:**  
   Demonstrated in Scenario 15 of `CollegeApprovalIntegrationTest.java`:
   - Replacement document is included in v2's active verification set.
   - Superseded original document cannot satisfy v2's approval gate.
   - Replacement document's verification status (`PENDING` -> `REJECTED` -> `ACCEPTED`) strictly determines whether approval is allowed.
   - Historical documents from earlier revisions cannot satisfy the new revision's mandatory categories.
5. **Final Status:**  
   All 291 backend tests pass with zero failures and clean packaging.
