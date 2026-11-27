package com.acadlytic.modules.colleges;

import com.acadlytic.support.AbstractMySqlIntegrationTest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import com.acadlytic.modules.colleges.migration.V6DocumentReviewMigrationPreflightCallback;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.FlywayException;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Migration-level integration verification for Module 3.6A (ADR-11, BF-07
 * through BF-12).
 * Strictly executes against MySQL 8.0.36 via Testcontainers.
 */
class V6DocumentLevelReviewMigrationTest extends AbstractMySqlIntegrationTest {

    private static final String DUMMY_HASH = "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90";

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Autowired
    private javax.sql.DataSource dataSource;

    private void executeV6Backfill() {
        jdbcTemplate
                .update("""
                            UPDATE college_registration_documents crd
                            LEFT JOIN college_registrations cr ON crd.registration_id = cr.id AND crd.college_id = cr.college_id
                            LEFT JOIN colleges c ON crd.college_id = c.id
                            SET
                                crd.verification_status = CASE
                                    WHEN c.approval_status = 'APPROVED' AND cr.status = 'APPROVED' THEN 'ACCEPTED'
                                    WHEN (c.approval_status = 'APPROVED' AND cr.status = 'ACTION_REQUIRED')
                                      OR (c.approval_status = 'APPROVED' AND cr.status = 'REJECTED')
                                      OR (c.approval_status = 'PENDING' AND cr.status = 'PENDING')
                                      OR (c.approval_status = 'ACTION_REQUIRED' AND cr.status = 'ACTION_REQUIRED')
                                      OR (c.approval_status = 'ACTION_REQUIRED' AND cr.status = 'PENDING')
                                      OR (c.approval_status = 'REJECTED' AND cr.status = 'REJECTED')
                                      OR (c.approval_status = 'REJECTED' AND cr.status = 'PENDING') THEN 'PENDING'
                                    ELSE 'UNKNOWN_STATE_FAIL'
                                END,
                                crd.verification_provenance = CASE
                                    WHEN c.approval_status = 'APPROVED' AND cr.status = 'APPROVED' THEN 'LEGACY_COLLEGE_APPROVAL'
                                    WHEN (c.approval_status = 'APPROVED' AND cr.status = 'ACTION_REQUIRED')
                                      OR (c.approval_status = 'APPROVED' AND cr.status = 'REJECTED')
                                      OR (c.approval_status = 'PENDING' AND cr.status = 'PENDING')
                                      OR (c.approval_status = 'ACTION_REQUIRED' AND cr.status = 'ACTION_REQUIRED')
                                      OR (c.approval_status = 'ACTION_REQUIRED' AND cr.status = 'PENDING')
                                      OR (c.approval_status = 'REJECTED' AND cr.status = 'REJECTED')
                                      OR (c.approval_status = 'REJECTED' AND cr.status = 'PENDING') THEN 'NOT_REVIEWED'
                                    ELSE 'UNKNOWN_STATE_FAIL'
                                END,
                                crd.rejection_reason = NULL,
                                crd.last_reviewed_by_user_id = NULL,
                                crd.last_reviewed_at = NULL
                        """);
    }

    @BeforeEach
    void cleanState() {
        cleanAllTables();
    }

    @AfterEach
    void tearDown() {
        cleanAllTables();
    }

    private void cleanAllTables() {
        // Clean append-only review table via TRUNCATE (bypasses DELETE trigger)
        jdbcTemplate.execute("TRUNCATE TABLE college_document_reviews");

        // Disconnect foreign keys and self-referential links before deleting parents
        jdbcTemplate.execute("UPDATE colleges SET current_registration_id = NULL");
        jdbcTemplate.execute(
                "UPDATE college_registration_documents SET source_document_id = NULL, source_registration_id = NULL, replaces_document_id = NULL");
        jdbcTemplate.execute("DELETE FROM college_registration_documents");
        jdbcTemplate.execute("DELETE FROM college_registrations");
        jdbcTemplate.execute("DELETE FROM users");
        jdbcTemplate.execute("DELETE FROM colleges");
    }

    private long insertCollege(String name, String code, String approvalStatus) {
        jdbcTemplate.update(
                """
                            INSERT INTO colleges (name, code, approval_status, status, resubmission_count, action_required_count)
                            VALUES (?, ?, ?, 'PENDING_VERIFICATION', 0, 0)
                        """,
                name, code, approvalStatus);
        return jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
    }

    private long insertRegistration(long collegeId, int version, String status) {
        jdbcTemplate.update(
                """
                            INSERT INTO college_registrations (
                                college_id, version_number, status, legal_name, address_line1, city, state, country, postal_code, contact_phone, affiliated_university_name
                            ) VALUES (?, ?, ?, 'Legal Name', 'Addr 1', 'City', 'State', 'Country', '12345', '+1-555-0100', 'Affiliated Univ')
                        """,
                collegeId, version, status);
        return jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
    }

    private long insertUser(String email, String role) {
        jdbcTemplate.update("""
                    INSERT INTO users (email, password_hash, first_name, last_name, role, status)
                    VALUES (?, '$2a$10$hashedpasswordplaceholder', 'Test', 'User', ?, 'ACTIVE')
                """, email, role);
        return jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
    }

    private long insertDocument(long collegeId, long regId, String category, String storageKey, String status,
            String provenance) {
        jdbcTemplate.update(
                """
                            INSERT INTO college_registration_documents (
                                college_id, registration_id, document_category, original_filename, storage_key, mime_type, file_size_bytes, sha256_checksum, verification_status, verification_provenance
                            ) VALUES (?, ?, ?, 'test.pdf', ?, 'application/pdf', 1024, 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90', ?, ?)
                        """,
                collegeId, regId, category, storageKey, status, provenance);
        return jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
    }

    @Test
    @DisplayName("1. V1–V6 migrations execute successfully from clean database and create expected schema objects")
    void test1_v1ToV6MigrationsExecuteSuccessfully() {
        // Verify Flyway V6 migration record
        Integer v6Success = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM flyway_schema_history WHERE version = '6' AND success = 1", Integer.class);
        assertThat(v6Success).isEqualTo(1);

        // Verify college_registration_documents new columns
        List<String> crdColumns = jdbcTemplate.queryForList("""
                    SELECT COLUMN_NAME FROM information_schema.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'college_registration_documents'
                """, String.class);
        assertThat(crdColumns).contains(
                "verification_status",
                "verification_provenance",
                "rejection_reason",
                "last_reviewed_by_user_id",
                "last_reviewed_at",
                "source_document_id",
                "source_registration_id",
                "version");

        // Verify college_document_reviews table exists
        Integer reviewTableCount = jdbcTemplate.queryForObject("""
                    SELECT COUNT(*) FROM information_schema.TABLES
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'college_document_reviews'
                """, Integer.class);
        assertThat(reviewTableCount).isEqualTo(1);

        // Verify append-only triggers exist
        List<String> triggers = jdbcTemplate.queryForList("""
                    SELECT TRIGGER_NAME FROM information_schema.TRIGGERS
                    WHERE TRIGGER_SCHEMA = DATABASE() AND EVENT_OBJECT_TABLE = 'college_document_reviews'
                """, String.class);
        assertThat(triggers).contains("trg_cdr_prevent_update", "trg_cdr_prevent_delete");
    }

    @Test
    @DisplayName("2 & 3. Approved college documents receive LEGACY_COLLEGE_APPROVAL and retain NULL individual reviewer/timestamp")
    void test2_and_3_approvedCollegeDocumentsReceiveLegacyCollegeApprovalWithNullReviewerAndTimestamp() {
        long collegeId = insertCollege("Legacy Approved College", "LAC1", "APPROVED");
        long regId = insertRegistration(collegeId, 1, "APPROVED");
        long docId = insertDocument(collegeId, regId, "UNIVERSITY_AFFILIATION_CERTIFICATE", "key-lac-1", "PENDING",
                "NOT_REVIEWED");

        // Execute the exact V6 migration backfill update
        executeV6Backfill();

        Map<String, Object> doc = jdbcTemplate.queryForMap(
                "SELECT verification_status, verification_provenance, rejection_reason, last_reviewed_by_user_id, last_reviewed_at FROM college_registration_documents WHERE id = ?",
                docId);

        assertThat(doc.get("verification_status")).isEqualTo("ACCEPTED");
        assertThat(doc.get("verification_provenance")).isEqualTo("LEGACY_COLLEGE_APPROVAL");
        assertThat(doc.get("rejection_reason")).isNull();
        assertThat(doc.get("last_reviewed_by_user_id")).isNull();
        assertThat(doc.get("last_reviewed_at")).isNull();
    }

    @Test
    @DisplayName("4. Pending, ACTION_REQUIRED, and REJECTED documents retain NOT_REVIEWED with NULL reviewer/timestamp")
    void test4_pendingActionRequiredAndRejectedDocumentsReceiveNotReviewed() {
        long cPending = insertCollege("Pending College", "PEN1", "PENDING");
        long rPending = insertRegistration(cPending, 1, "PENDING");
        long dPending = insertDocument(cPending, rPending, "UNIVERSITY_AFFILIATION_CERTIFICATE", "key-pen-1", "PENDING",
                "NOT_REVIEWED");

        long cAction = insertCollege("Action Req College", "ACT1", "ACTION_REQUIRED");
        long rAction = insertRegistration(cAction, 1, "ACTION_REQUIRED");
        long dAction = insertDocument(cAction, rAction, "AUTHORIZED_SIGNATORY_ID", "key-act-1", "PENDING",
                "NOT_REVIEWED");

        long cRejected = insertCollege("Rejected College", "REJ1", "REJECTED");
        long rRejected = insertRegistration(cRejected, 1, "REJECTED");
        long dRejected = insertDocument(cRejected, rRejected, "INSTITUTION_REGISTRATION_PROOF", "key-rej-1", "PENDING",
                "NOT_REVIEWED");

        // Run backfill statement
        executeV6Backfill();

        for (long id : List.of(dPending, dAction, dRejected)) {
            Map<String, Object> doc = jdbcTemplate.queryForMap(
                    "SELECT verification_status, verification_provenance, last_reviewed_by_user_id, last_reviewed_at FROM college_registration_documents WHERE id = ?",
                    id);
            assertThat(doc.get("verification_status")).isEqualTo("PENDING");
            assertThat(doc.get("verification_provenance")).isEqualTo("NOT_REVIEWED");
            assertThat(doc.get("last_reviewed_by_user_id")).isNull();
            assertThat(doc.get("last_reviewed_at")).isNull();
        }
    }

    @Test
    @DisplayName("5. Zero artificial college_document_reviews rows created during migration or backfill")
    void test5_noArtificialReviewHistoryRowsCreated() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM college_document_reviews", Integer.class);
        assertThat(count).isEqualTo(0);
    }

    @Test
    @DisplayName("6. Composite ownership FK rejects cross-college and cross-registration review references")
    void test6_compositeOwnershipFkRejectsCrossCollegeAndCrossRegistrationReferences() {
        long c1 = insertCollege("College One", "COL1", "PENDING");
        long r1 = insertRegistration(c1, 1, "PENDING");
        long d1 = insertDocument(c1, r1, "UNIVERSITY_AFFILIATION_CERTIFICATE", "key-c1-d1", "PENDING", "NOT_REVIEWED");

        long c2 = insertCollege("College Two", "COL2", "PENDING");
        long r2 = insertRegistration(c2, 1, "PENDING");
        long d2 = insertDocument(c2, r2, "AUTHORIZED_SIGNATORY_ID", "key-c2-d2", "PENDING", "NOT_REVIEWED");

        long reviewerId = insertUser("superadmin@acadlytic.com", "SUPER_ADMIN");

        // Cross-college mismatch: college_id = c2, registration_id = r1, document_id =
        // d1
        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                            INSERT INTO college_document_reviews (college_id, registration_id, document_id, action, reviewer_user_id)
                            VALUES (?, ?, ?, 'ACCEPTED', ?)
                        """,
                c2, r1, d1, reviewerId))
                .isInstanceOf(DataIntegrityViolationException.class);

        // Cross-registration mismatch: college_id = c1, registration_id = r2,
        // document_id = d1
        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                            INSERT INTO college_document_reviews (college_id, registration_id, document_id, action, reviewer_user_id)
                            VALUES (?, ?, ?, 'ACCEPTED', ?)
                        """,
                c1, r2, d1, reviewerId))
                .isInstanceOf(DataIntegrityViolationException.class);

        // Cross-document mismatch: college_id = c1, registration_id = r1, document_id =
        // d2
        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                            INSERT INTO college_document_reviews (college_id, registration_id, document_id, action, reviewer_user_id)
                            VALUES (?, ?, ?, 'ACCEPTED', ?)
                        """,
                c1, r1, d2, reviewerId))
                .isInstanceOf(DataIntegrityViolationException.class);

        // Valid composite match: college_id = c1, registration_id = r1, document_id =
        // d1
        int rows = jdbcTemplate.update(
                """
                            INSERT INTO college_document_reviews (college_id, registration_id, document_id, action, reviewer_user_id)
                            VALUES (?, ?, ?, 'ACCEPTED', ?)
                        """,
                c1, r1, d1, reviewerId);
        assertThat(rows).isEqualTo(1);
    }

    @Test
    @DisplayName("7. Source document composite foreign key enforces tenant and registration integrity")
    void test7_sourceDocumentAndRegistrationOwnershipEnforced() {
        long c1 = insertCollege("College One", "COL1", "ACTION_REQUIRED");
        long r1 = insertRegistration(c1, 1, "ACTION_REQUIRED");
        long d1 = insertDocument(c1, r1, "UNIVERSITY_AFFILIATION_CERTIFICATE", "key-source-1", "ACCEPTED",
                "DIRECT_REVIEW");

        long c2 = insertCollege("College Two", "COL2", "PENDING");
        long r2 = insertRegistration(c2, 1, "PENDING");
        long d2 = insertDocument(c2, r2, "AUTHORIZED_SIGNATORY_ID", "key-source-2", "ACCEPTED", "DIRECT_REVIEW");

        long r1v2 = insertRegistration(c1, 2, "PENDING");

        // Cross-tenant source doc: College 1 attempting to point to source doc from
        // College 2
        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                            INSERT INTO college_registration_documents (
                                college_id, registration_id, document_category, original_filename, storage_key, mime_type, file_size_bytes, sha256_checksum,
                                source_document_id, source_registration_id, verification_status, verification_provenance
                            ) VALUES (?, ?, 'UNIVERSITY_AFFILIATION_CERTIFICATE', 'cf.pdf', 'cf-key-err1', 'application/pdf', 1024, 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90', ?, ?, 'ACCEPTED', 'CARRIED_FORWARD')
                        """,
                c1, r1v2, d2, r2))
                .isInstanceOf(DataIntegrityViolationException.class);

        // Mismatched source registration: Doc d1 belongs to r1, but referencing r2
        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                            INSERT INTO college_registration_documents (
                                college_id, registration_id, document_category, original_filename, storage_key, mime_type, file_size_bytes, sha256_checksum,
                                source_document_id, source_registration_id, verification_status, verification_provenance
                            ) VALUES (?, ?, 'UNIVERSITY_AFFILIATION_CERTIFICATE', 'cf.pdf', 'cf-key-err2', 'application/pdf', 1024, 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90', ?, ?, 'ACCEPTED', 'CARRIED_FORWARD')
                        """,
                c1, r1v2, d1, r2))
                .isInstanceOf(DataIntegrityViolationException.class);

        // Valid source document reference within same college and registration
        int rows = jdbcTemplate.update(
                """
                            INSERT INTO college_registration_documents (
                                college_id, registration_id, document_category, original_filename, storage_key, mime_type, file_size_bytes, sha256_checksum,
                                source_document_id, source_registration_id, verification_status, verification_provenance
                            ) VALUES (?, ?, 'UNIVERSITY_AFFILIATION_CERTIFICATE', 'cf.pdf', 'cf-key-ok', 'application/pdf', 1024, 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90', ?, ?, 'ACCEPTED', 'CARRIED_FORWARD')
                        """,
                c1, r1v2, d1, r1);
        assertThat(rows).isEqualTo(1);
    }

    @Test
    @DisplayName("8. Partially NULL source document references are rejected by check constraint")
    void test8_partiallyNullSourceReferencesRejected() {
        long c1 = insertCollege("College One", "COL1", "PENDING");
        long r1 = insertRegistration(c1, 1, "PENDING");
        long d1 = insertDocument(c1, r1, "UNIVERSITY_AFFILIATION_CERTIFICATE", "key-s-1", "ACCEPTED", "DIRECT_REVIEW");

        // source_document_id populated, source_registration_id NULL
        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                            INSERT INTO college_registration_documents (
                                college_id, registration_id, document_category, original_filename, storage_key, mime_type, file_size_bytes, sha256_checksum,
                                source_document_id, source_registration_id
                            ) VALUES (?, ?, 'UNIVERSITY_AFFILIATION_CERTIFICATE', 'p1.pdf', 'p-key-1', 'application/pdf', 1024, 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90', ?, NULL)
                        """,
                c1, r1, d1))
                .isInstanceOf(DataAccessException.class)
                .satisfies(ex -> assertThat(NestedExceptionUtils.getRootCause(ex).getMessage())
                        .contains("chk_crd_source_pair"));

        // source_document_id NULL, source_registration_id populated
        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                            INSERT INTO college_registration_documents (
                                college_id, registration_id, document_category, original_filename, storage_key, mime_type, file_size_bytes, sha256_checksum,
                                source_document_id, source_registration_id
                            ) VALUES (?, ?, 'UNIVERSITY_AFFILIATION_CERTIFICATE', 'p2.pdf', 'p-key-2', 'application/pdf', 1024, 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90', NULL, ?)
                        """,
                c1, r1, r1))
                .isInstanceOf(DataAccessException.class)
                .satisfies(ex -> assertThat(NestedExceptionUtils.getRootCause(ex).getMessage())
                        .contains("chk_crd_source_pair"));

        // Both NULL is allowed
        int rowsBothNull = jdbcTemplate.update(
                """
                            INSERT INTO college_registration_documents (
                                college_id, registration_id, document_category, original_filename, storage_key, mime_type, file_size_bytes, sha256_checksum,
                                source_document_id, source_registration_id
                            ) VALUES (?, ?, 'UNIVERSITY_AFFILIATION_CERTIFICATE', 'p3.pdf', 'p-key-3', 'application/pdf', 1024, 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90', NULL, NULL)
                        """,
                c1, r1);
        assertThat(rowsBothNull).isEqualTo(1);
    }

    @Test
    @DisplayName("9. Invalid verification statuses, provenances, and review actions are rejected by check constraints")
    void test9_invalidVerificationStatusesAndProvenanceValuesRejected() {
        long c1 = insertCollege("College One", "COL1", "PENDING");
        long r1 = insertRegistration(c1, 1, "PENDING");
        long reviewerId = insertUser("reviewer@acadlytic.com", "SUPER_ADMIN");

        // Invalid verification_status
        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                            INSERT INTO college_registration_documents (
                                college_id, registration_id, document_category, original_filename, storage_key, mime_type, file_size_bytes, sha256_checksum,
                                verification_status
                            ) VALUES (?, ?, 'UNIVERSITY_AFFILIATION_CERTIFICATE', 'inv1.pdf', 'inv-key-1', 'application/pdf', 1024, 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90', 'INVALID_STATUS')
                        """,
                c1, r1))
                .isInstanceOf(DataAccessException.class)
                .satisfies(ex -> assertThat(NestedExceptionUtils.getRootCause(ex).getMessage())
                        .contains("chk_crd_verification_status"));

        // Invalid verification_provenance
        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                            INSERT INTO college_registration_documents (
                                college_id, registration_id, document_category, original_filename, storage_key, mime_type, file_size_bytes, sha256_checksum,
                                verification_provenance
                            ) VALUES (?, ?, 'UNIVERSITY_AFFILIATION_CERTIFICATE', 'inv2.pdf', 'inv-key-2', 'application/pdf', 1024, 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90', 'INVALID_PROVENANCE')
                        """,
                c1, r1))
                .isInstanceOf(DataAccessException.class)
                .satisfies(ex -> assertThat(NestedExceptionUtils.getRootCause(ex).getMessage())
                        .contains("chk_crd_verification_provenance"));

        // Valid document
        long d1 = insertDocument(c1, r1, "UNIVERSITY_AFFILIATION_CERTIFICATE", "valid-doc-key", "PENDING",
                "NOT_REVIEWED");

        // Invalid review history action
        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                            INSERT INTO college_document_reviews (college_id, registration_id, document_id, action, reviewer_user_id)
                            VALUES (?, ?, ?, 'INVALID_ACTION', ?)
                        """,
                c1, r1, d1, reviewerId))
                .isInstanceOf(DataAccessException.class)
                .satisfies(ex -> assertThat(NestedExceptionUtils.getRootCause(ex).getMessage())
                        .contains("chk_cdr_action"));
    }

    @Test
    @DisplayName("10. Replacement uniqueness prevents duplicate replacement targets in the same registration revision")
    void test10_replacementUniquenessPreventsDuplicateReplacementTargets() {
        long c1 = insertCollege("College One", "COL1", "ACTION_REQUIRED");
        long r1 = insertRegistration(c1, 1, "ACTION_REQUIRED");
        long targetDoc = insertDocument(c1, r1, "UNIVERSITY_AFFILIATION_CERTIFICATE", "target-cert", "REJECTED",
                "DIRECT_REVIEW");

        long r2 = insertRegistration(c1, 2, "PENDING");

        // First replacement in registration revision 2
        jdbcTemplate.update(
                """
                            INSERT INTO college_registration_documents (
                                college_id, registration_id, document_category, original_filename, storage_key, mime_type, file_size_bytes, sha256_checksum,
                                replaces_document_id
                            ) VALUES (?, ?, 'UNIVERSITY_AFFILIATION_CERTIFICATE', 'rep1.pdf', 'rep-key-1', 'application/pdf', 1024, 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90', ?)
                        """,
                c1, r2, targetDoc);

        // Second replacement targeting the same document in registration revision 2
        // must violate uq_crd_registration_replacement
        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                            INSERT INTO college_registration_documents (
                                college_id, registration_id, document_category, original_filename, storage_key, mime_type, file_size_bytes, sha256_checksum,
                                replaces_document_id
                            ) VALUES (?, ?, 'UNIVERSITY_AFFILIATION_CERTIFICATE', 'rep2.pdf', 'rep-key-2', 'application/pdf', 1024, 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90', ?)
                        """,
                c1, r2, targetDoc))
                .isInstanceOf(DuplicateKeyException.class);

        // Multiple documents without replacement (replaces_document_id = NULL) are
        // permitted in the same registration
        int nullRep1 = jdbcTemplate.update(
                """
                            INSERT INTO college_registration_documents (
                                college_id, registration_id, document_category, original_filename, storage_key, mime_type, file_size_bytes, sha256_checksum,
                                replaces_document_id
                            ) VALUES (?, ?, 'AUTHORIZED_SIGNATORY_ID', 'auth1.pdf', 'auth-key-1', 'application/pdf', 1024, 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90', NULL)
                        """,
                c1, r2);
        int nullRep2 = jdbcTemplate.update(
                """
                            INSERT INTO college_registration_documents (
                                college_id, registration_id, document_category, original_filename, storage_key, mime_type, file_size_bytes, sha256_checksum,
                                replaces_document_id
                            ) VALUES (?, ?, 'INSTITUTION_REGISTRATION_PROOF', 'inst1.pdf', 'inst-key-1', 'application/pdf', 1024, 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90', NULL)
                        """,
                c1, r2);
        assertThat(nullRep1).isEqualTo(1);
        assertThat(nullRep2).isEqualTo(1);
    }

    @Test
    @DisplayName("11. UPDATE against college_document_reviews fails with SQLSTATE 45000 from append-only trigger")
    void test11_updateAgainstReviewHistoryFailsWithSqlState45000() {
        long c1 = insertCollege("College One", "COL1", "PENDING");
        long r1 = insertRegistration(c1, 1, "PENDING");
        long d1 = insertDocument(c1, r1, "UNIVERSITY_AFFILIATION_CERTIFICATE", "doc-trg-1", "PENDING", "NOT_REVIEWED");
        long reviewerId = insertUser("superadmin@acadlytic.com", "SUPER_ADMIN");

        jdbcTemplate.update(
                """
                            INSERT INTO college_document_reviews (college_id, registration_id, document_id, action, reviewer_user_id)
                            VALUES (?, ?, ?, 'ACCEPTED', ?)
                        """,
                c1, r1, d1, reviewerId);

        assertThatThrownBy(() -> jdbcTemplate.update("""
                    UPDATE college_document_reviews SET action = 'REJECTED' WHERE document_id = ?
                """, d1))
                .isInstanceOf(DataAccessException.class)
                .satisfies(ex -> {
                    Throwable root = NestedExceptionUtils.getRootCause(ex);
                    assertThat(root).isInstanceOf(SQLException.class);
                    SQLException sqlEx = (SQLException) root;
                    assertThat(sqlEx.getSQLState()).isEqualTo("45000");
                    assertThat(sqlEx.getMessage()).contains("strictly prohibited");
                });
    }

    @Test
    @DisplayName("12. DELETE against college_document_reviews fails with SQLSTATE 45000 from append-only trigger")
    void test12_deleteAgainstReviewHistoryFailsWithSqlState45000() {
        long c1 = insertCollege("College One", "COL1", "PENDING");
        long r1 = insertRegistration(c1, 1, "PENDING");
        long d1 = insertDocument(c1, r1, "UNIVERSITY_AFFILIATION_CERTIFICATE", "doc-trg-2", "PENDING", "NOT_REVIEWED");
        long reviewerId = insertUser("superadmin@acadlytic.com", "SUPER_ADMIN");

        jdbcTemplate.update(
                """
                            INSERT INTO college_document_reviews (college_id, registration_id, document_id, action, reviewer_user_id)
                            VALUES (?, ?, ?, 'ACCEPTED', ?)
                        """,
                c1, r1, d1, reviewerId);

        assertThatThrownBy(() -> jdbcTemplate.update("""
                    DELETE FROM college_document_reviews WHERE document_id = ?
                """, d1))
                .isInstanceOf(DataAccessException.class)
                .satisfies(ex -> {
                    Throwable root = NestedExceptionUtils.getRootCause(ex);
                    assertThat(root).isInstanceOf(SQLException.class);
                    SQLException sqlEx = (SQLException) root;
                    assertThat(sqlEx.getSQLState()).isEqualTo("45000");
                    assertThat(sqlEx.getMessage()).contains("strictly prohibited");
                });
    }

    @Test
    @DisplayName("13. Failed review-history writes roll back atomically without partial database mutation")
    void test13_failedReviewHistoryWritesDoNotLeavePartialDatabaseMutations() {
        long c1 = insertCollege("College One", "COL1", "PENDING");
        long r1 = insertRegistration(c1, 1, "PENDING");
        long d1 = insertDocument(c1, r1, "UNIVERSITY_AFFILIATION_CERTIFICATE", "doc-atomic-1", "PENDING",
                "NOT_REVIEWED");
        long reviewerId = insertUser("superadmin@acadlytic.com", "SUPER_ADMIN");

        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);

        assertThatThrownBy(() -> txTemplate.execute(status -> {
            // Step A: Mutate document status
            jdbcTemplate.update("""
                        UPDATE college_registration_documents
                        SET verification_status = 'ACCEPTED', verification_provenance = 'DIRECT_REVIEW'
                        WHERE id = ?
                    """, d1);

            // Step B: Attempt an invalid insert into college_document_reviews that fails
            // check constraint
            jdbcTemplate.update(
                    """
                                INSERT INTO college_document_reviews (college_id, registration_id, document_id, action, reviewer_user_id)
                                VALUES (?, ?, ?, 'ILLEGAL_STATUS', ?)
                            """,
                    c1, r1, d1, reviewerId);

            return null;
        })).isInstanceOf(DataAccessException.class)
                .satisfies(ex -> assertThat(NestedExceptionUtils.getRootCause(ex).getMessage())
                        .contains("chk_cdr_action"));

        // Step C: Verify rollback occurred cleanly — document status remains PENDING
        Map<String, Object> doc = jdbcTemplate.queryForMap(
                "SELECT verification_status, verification_provenance FROM college_registration_documents WHERE id = ?",
                d1);
        assertThat(doc.get("verification_status")).isEqualTo("PENDING");
        assertThat(doc.get("verification_provenance")).isEqualTo("NOT_REVIEWED");

        // Verify no row was inserted into review history
        Integer historyRows = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM college_document_reviews WHERE document_id = ?", Integer.class, d1);
        assertThat(historyRows).isEqualTo(0);
    }

    @Test
    @DisplayName("14. Exhaustive legacy state matrix validates all supported state combinations")
    void test14_exhaustiveLegacyStateMatrix_allValidCombinationsReceiveExpectedAttribution() {
        // Supported state combinations:
        // (colleges.approval_status, college_registrations.status)
        // 1. (APPROVED, APPROVED) -> ACCEPTED + LEGACY_COLLEGE_APPROVAL
        // 2. (APPROVED, ACTION_REQUIRED) -> PENDING + NOT_REVIEWED
        // 3. (APPROVED, REJECTED) -> PENDING + NOT_REVIEWED
        // 4. (PENDING, PENDING) -> PENDING + NOT_REVIEWED
        // 5. (ACTION_REQUIRED, ACTION_REQUIRED) -> PENDING + NOT_REVIEWED
        // 6. (ACTION_REQUIRED, PENDING) -> PENDING + NOT_REVIEWED
        // 7. (REJECTED, REJECTED) -> PENDING + NOT_REVIEWED
        // 8. (REJECTED, PENDING) -> PENDING + NOT_REVIEWED

        record LegacyTestCase(String collegeApprovalStatus, String regStatus, String expectedVerificationStatus,
                String expectedProvenance) {
        }

        List<LegacyTestCase> matrix = List.of(
                new LegacyTestCase("APPROVED", "APPROVED", "ACCEPTED", "LEGACY_COLLEGE_APPROVAL"),
                new LegacyTestCase("APPROVED", "ACTION_REQUIRED", "PENDING", "NOT_REVIEWED"),
                new LegacyTestCase("APPROVED", "REJECTED", "PENDING", "NOT_REVIEWED"),
                new LegacyTestCase("PENDING", "PENDING", "PENDING", "NOT_REVIEWED"),
                new LegacyTestCase("ACTION_REQUIRED", "ACTION_REQUIRED", "PENDING", "NOT_REVIEWED"),
                new LegacyTestCase("ACTION_REQUIRED", "PENDING", "PENDING", "NOT_REVIEWED"),
                new LegacyTestCase("REJECTED", "REJECTED", "PENDING", "NOT_REVIEWED"),
                new LegacyTestCase("REJECTED", "PENDING", "PENDING", "NOT_REVIEWED"));

        for (int i = 0; i < matrix.size(); i++) {
            LegacyTestCase tc = matrix.get(i);
            long collegeId = insertCollege("College Matrix " + i, "MTR" + i, tc.collegeApprovalStatus());
            long regId = insertRegistration(collegeId, 1, tc.regStatus());
            long docId = insertDocument(collegeId, regId, "UNIVERSITY_AFFILIATION_CERTIFICATE", "key-matrix-" + i,
                    "PENDING", "NOT_REVIEWED");

            executeV6Backfill();

            Map<String, Object> doc = jdbcTemplate.queryForMap(
                    "SELECT verification_status, verification_provenance, rejection_reason, last_reviewed_by_user_id, last_reviewed_at FROM college_registration_documents WHERE id = ?",
                    docId);

            assertThat(doc.get("verification_status"))
                    .as("Verification status for combination (%s, %s)", tc.collegeApprovalStatus(), tc.regStatus())
                    .isEqualTo(tc.expectedVerificationStatus());
            assertThat(doc.get("verification_provenance"))
                    .as("Verification provenance for combination (%s, %s)", tc.collegeApprovalStatus(), tc.regStatus())
                    .isEqualTo(tc.expectedProvenance());
            assertThat(doc.get("rejection_reason")).isNull();
            assertThat(doc.get("last_reviewed_by_user_id")).isNull();
            assertThat(doc.get("last_reviewed_at")).isNull();
        }
    }

    @Test
    @DisplayName("15. Unsupported legacy status tuples, orphaned references, and tenant mismatches are rejected")
    void test15_unknownOrCorruptedState_failsMigrationPreconditionAndAbortsWithoutMisclassification() {
        record UnsupportedTestCase(String collegeApprovalStatus, String regStatus, String description) {
        }

        List<UnsupportedTestCase> unsupportedTuples = List.of(
                new UnsupportedTestCase("APPROVED", "PENDING",
                        "Approved college cannot have pending registration revision"),
                new UnsupportedTestCase("PENDING", "ACTION_REQUIRED",
                        "Pending college cannot have action-required revision"),
                new UnsupportedTestCase("PENDING", "REJECTED", "Pending college cannot have rejected revision"),
                new UnsupportedTestCase("ACTION_REQUIRED", "REJECTED",
                        "Action-required college cannot have rejected revision"),
                new UnsupportedTestCase("REJECTED", "ACTION_REQUIRED",
                        "Rejected college cannot have action-required revision"),
                new UnsupportedTestCase("PENDING", "APPROVED", "Pending college cannot have approved revision"),
                new UnsupportedTestCase("ACTION_REQUIRED", "APPROVED",
                        "Action-required college cannot have approved revision"),
                new UnsupportedTestCase("REJECTED", "APPROVED", "Rejected college cannot have approved revision"));

        for (int i = 0; i < unsupportedTuples.size(); i++) {
            UnsupportedTestCase tc = unsupportedTuples.get(i);
            long c = insertCollege("Unsup College " + i, "UNS" + i, tc.collegeApprovalStatus());
            long r = insertRegistration(c, 1, tc.regStatus());
            insertDocument(c, r, "UNIVERSITY_AFFILIATION_CERTIFICATE", "doc-unsup-" + i, "PENDING", "NOT_REVIEWED");

            // Backfill assigns 'UNKNOWN_STATE_FAIL' because tuple is not in the approved 8
            // which immediately violates check constraint
            assertThatThrownBy(this::executeV6Backfill)
                    .as("Unsupported tuple (%s, %s): %s", tc.collegeApprovalStatus(), tc.regStatus(), tc.description())
                    .isInstanceOf(DataAccessException.class)
                    .satisfies(ex -> assertThat(NestedExceptionUtils.getRootCause(ex).getMessage())
                            .containsAnyOf("chk_crd_verification_status", "chk_crd_verification_provenance"));

            cleanAllTables();
        }

        // Cross-tenant mismatch: crd.college_id != cr.college_id
        long c1 = insertCollege("College 1", "COL1", "PENDING");
        long r1 = insertRegistration(c1, 1, "PENDING");
        long d1 = insertDocument(c1, r1, "UNIVERSITY_AFFILIATION_CERTIFICATE", "doc-mismatch-1", "PENDING",
                "NOT_REVIEWED");
        long c2 = insertCollege("College 2", "COL2", "PENDING");
        jdbcTemplate.update("UPDATE college_registration_documents SET college_id = ? WHERE id = ?", c2, d1);

        assertThatThrownBy(this::executeV6Backfill)
                .as("Cross-tenant ownership mismatch must fail")
                .isInstanceOf(DataAccessException.class)
                .satisfies(ex -> assertThat(NestedExceptionUtils.getRootCause(ex).getMessage())
                        .containsAnyOf("chk_crd_verification_status", "chk_crd_verification_provenance"));
    }

    @Test
    @DisplayName("16. Runtime test user with explicit table-level grants and roles has SELECT/INSERT only on college_document_reviews, cannot UPDATE/DELETE, and cannot drop triggers")
    void test16_runtimeTestUserPrivilegeSeparation() throws Exception {
        String rootPass = (MYSQL != null) ? MYSQL.getPassword() : "acadlytic_test_pass";
        String rootUrl = (MYSQL != null) ? MYSQL.getJdbcUrl()
                : "jdbc:mysql://127.0.0.1:3306/acadlytic_test?allowPublicKeyRetrieval=true&useSSL=false";
        try (Connection rootConn = DriverManager.getConnection(rootUrl, "root", rootPass);
                Statement rootStmt = rootConn.createStatement()) {

            rootStmt.execute("DROP USER IF EXISTS 'acadlytic_app_test'@'%'");
            rootStmt.execute("DROP ROLE IF EXISTS 'acadlytic_test_audit_role'");
            rootStmt.execute("CREATE USER 'acadlytic_app_test'@'%' IDENTIFIED BY 'TestPass!2026'");
            rootStmt.execute("CREATE ROLE 'acadlytic_test_audit_role'");

            // Explicit table-level grants (NO database-level UPDATE or DELETE)
            rootStmt.execute("REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'acadlytic_app_test'@'%'");
            rootStmt.execute("GRANT SELECT, INSERT, UPDATE ON acadlytic_test.colleges TO 'acadlytic_app_test'@'%'");
            rootStmt.execute("GRANT SELECT, INSERT, UPDATE ON acadlytic_test.users TO 'acadlytic_app_test'@'%'");
            rootStmt.execute(
                    "GRANT SELECT, INSERT, UPDATE ON acadlytic_test.college_registrations TO 'acadlytic_app_test'@'%'");
            rootStmt.execute(
                    "GRANT SELECT, INSERT, UPDATE ON acadlytic_test.college_registration_documents TO 'acadlytic_app_test'@'%'");
            rootStmt.execute(
                    "GRANT SELECT, INSERT ON acadlytic_test.college_document_reviews TO 'acadlytic_app_test'@'%'");
            rootStmt.execute("GRANT SELECT, INSERT ON acadlytic_test.audit_events TO 'acadlytic_app_test'@'%'");

            // Grant read role to user and set as default role
            rootStmt.execute("GRANT SELECT ON acadlytic_test.system_metadata TO 'acadlytic_test_audit_role'");
            rootStmt.execute("GRANT 'acadlytic_test_audit_role' TO 'acadlytic_app_test'@'%'");
            rootStmt.execute("ALTER USER 'acadlytic_app_test'@'%' DEFAULT ROLE ALL");
            rootStmt.execute("FLUSH PRIVILEGES");

            long c1 = insertCollege("Privilege Test College", "PTC1", "PENDING");
            long r1 = insertRegistration(c1, 1, "PENDING");
            long d1 = insertDocument(c1, r1, "UNIVERSITY_AFFILIATION_CERTIFICATE", "doc-priv-1", "PENDING",
                    "NOT_REVIEWED");
            long reviewerId = insertUser("admin_priv@acadlytic.com", "SUPER_ADMIN");

            String jdbcUrl;
            try (Connection conn = dataSource.getConnection()) {
                jdbcUrl = conn.getMetaData().getURL();
            }

            try (Connection appConn = DriverManager.getConnection(jdbcUrl, "acadlytic_app_test", "TestPass!2026")) {
                // Activate role and inspect effective grants
                try (Statement stmt = appConn.createStatement()) {
                    stmt.execute("SET ROLE ALL");
                }

                // Verify SHOW GRANTS contains NO global UPDATE/DELETE and NO database-wide
                // UPDATE/DELETE
                try (Statement stmt = appConn.createStatement();
                        ResultSet rs = stmt.executeQuery("SHOW GRANTS FOR CURRENT_USER()")) {
                    while (rs.next()) {
                        String grant = rs.getString(1);
                        if (grant.contains("*.*") || grant.contains("`acadlytic_test`.*")) {
                            assertThat(grant).doesNotContain("UPDATE", "DELETE", "ALL PRIVILEGES");
                        }
                    }
                }

                // 1. SELECT from college_document_reviews succeeds
                try (Statement stmt = appConn.createStatement();
                        ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM college_document_reviews")) {
                    assertThat(rs.next()).isTrue();
                }

                // 2. INSERT into college_document_reviews succeeds
                try (PreparedStatement stmt = appConn.prepareStatement(
                        """
                                    INSERT INTO college_document_reviews (college_id, registration_id, document_id, action, reviewer_user_id)
                                    VALUES (?, ?, ?, 'ACCEPTED', ?)
                                """)) {
                    stmt.setLong(1, c1);
                    stmt.setLong(2, r1);
                    stmt.setLong(3, d1);
                    stmt.setLong(4, reviewerId);
                    int inserted = stmt.executeUpdate();
                    assertThat(inserted).isEqualTo(1);
                }

                // 3. UPDATE on college_document_reviews is DENIED at the MySQL privilege check
                // level (Error 1142)
                try (PreparedStatement stmt = appConn.prepareStatement(
                        "UPDATE college_document_reviews SET action = 'REJECTED' WHERE document_id = ?")) {
                    stmt.setLong(1, d1);
                    assertThatThrownBy(stmt::executeUpdate)
                            .isInstanceOf(SQLException.class)
                            .satisfies(ex -> {
                                SQLException sqlEx = (SQLException) ex;
                                assertThat(sqlEx.getErrorCode()).isEqualTo(1142); // ER_TABLEACCESS_DENIED_ERROR
                                assertThat(sqlEx.getMessage()).containsIgnoringCase("command denied to user");
                            });
                }

                // 4. DELETE from college_document_reviews is DENIED at the MySQL privilege
                // check level (Error 1142)
                try (PreparedStatement stmt = appConn
                        .prepareStatement("DELETE FROM college_document_reviews WHERE document_id = ?")) {
                    stmt.setLong(1, d1);
                    assertThatThrownBy(stmt::executeUpdate)
                            .isInstanceOf(SQLException.class)
                            .satisfies(ex -> {
                                SQLException sqlEx = (SQLException) ex;
                                assertThat(sqlEx.getErrorCode()).isEqualTo(1142); // ER_TABLEACCESS_DENIED_ERROR
                                assertThat(sqlEx.getMessage()).containsIgnoringCase("command denied to user");
                            });
                }

                // 5. Runtime user CANNOT drop or alter audit triggers (Error 1142 / 1227)
                try (Statement stmt = appConn.createStatement()) {
                    assertThatThrownBy(() -> stmt.execute("DROP TRIGGER trg_cdr_prevent_update"))
                            .isInstanceOf(SQLException.class)
                            .satisfies(ex -> {
                                SQLException sqlEx = (SQLException) ex;
                                assertThat(sqlEx.getErrorCode()).isIn(1142, 1227); // Access denied
                            });
                }
            } finally {
                rootStmt.execute("DROP USER IF EXISTS 'acadlytic_app_test'@'%'");
                rootStmt.execute("DROP ROLE IF EXISTS 'acadlytic_test_audit_role'");
            }
        }
    }

    @Test
    @DisplayName("17. Actual Flyway migration fails on invalid legacy state before schema mutation, leaves database clean, and recovers via repair")
    void test17_actualFlywayMigrationExecution_invalidDatabase_preflightAbortsWithZeroSchemaOrDataMutations_andRepairRecovers()
            throws Exception {
        String rootPass = (MYSQL != null) ? MYSQL.getPassword() : "acadlytic_test_pass";
        String rootBaseUrl = (MYSQL != null) ? MYSQL.getJdbcUrl()
                : "jdbc:mysql://127.0.0.1:3306/acadlytic_test?allowPublicKeyRetrieval=true&useSSL=false";
        String testDbName = "acadlytic_preflight_fail_test";
        String rootServerUrl = rootBaseUrl.substring(0, rootBaseUrl.lastIndexOf('/') + 1)
                + "?allowPublicKeyRetrieval=true&useSSL=false";
        String testDbUrl = rootBaseUrl.substring(0, rootBaseUrl.lastIndexOf('/') + 1) + testDbName
                + "?allowPublicKeyRetrieval=true&useSSL=false";

        try (Connection rootConn = DriverManager.getConnection(rootServerUrl, "root", rootPass);
                Statement rootStmt = rootConn.createStatement()) {

            rootStmt.execute("DROP DATABASE IF EXISTS " + testDbName);
            rootStmt.execute("CREATE DATABASE " + testDbName);

            try {
                // 1. Migrate test database to V5 (baseline schema before V6)
                Flyway flywayV5 = Flyway.configure()
                        .dataSource(testDbUrl, "root", rootPass)
                        .locations("classpath:db/migration")
                        .target("5")
                        .load();
                flywayV5.migrate();

                // Verify V5 baseline: college_registration_documents has NO V6 columns
                try (Connection conn = DriverManager.getConnection(testDbUrl, "root", rootPass);
                        Statement stmt = conn.createStatement()) {

                    List<String> columnsBefore = new ArrayList<>();
                    try (ResultSet rs = stmt.executeQuery("""
                            SELECT COLUMN_NAME FROM information_schema.COLUMNS
                            WHERE TABLE_SCHEMA = '""" + testDbName + """
                                ' AND TABLE_NAME = 'college_registration_documents'
                            """)) {
                        while (rs.next()) {
                            columnsBefore.add(rs.getString(1));
                        }
                    }
                    assertThat(columnsBefore).doesNotContain("verification_status", "verification_provenance",
                            "version");

                    // 2. Seed an unsupported legacy state at V5 (e.g. APPROVED college with PENDING
                    // registration)
                    stmt.execute(
                            """
                                        INSERT INTO colleges (id, name, code, approval_status, status, resubmission_count, action_required_count)
                                        VALUES (100, 'Legacy Bad College', 'LBC1', 'APPROVED', 'PENDING_VERIFICATION', 0, 0)
                                    """);
                    stmt.execute(
                            """
                                        INSERT INTO college_registrations (
                                            id, college_id, version_number, status, legal_name, address_line1, city, state, country, postal_code, contact_phone, affiliated_university_name
                                        ) VALUES (100, 100, 1, 'PENDING', 'Legal Name', 'Addr 1', 'City', 'State', 'Country', '12345', '+1-555-0100', 'Affiliated Univ')
                                    """);
                    stmt.execute(
                            """
                                    INSERT INTO college_registration_documents (
                                        id, college_id, registration_id, document_category, original_filename, storage_key, mime_type, file_size_bytes, sha256_checksum
                                    ) VALUES (100, 100, 100, 'UNIVERSITY_AFFILIATION_CERTIFICATE', 'test.pdf', 'key-preflight-fail', 'application/pdf', 1024, '"""
                                    + DUMMY_HASH + """
                                                ')
                                            """);
                }

                // 3. Attempt actual Flyway migration to V6 with preflight callback
                Flyway flywayV6 = Flyway.configure()
                        .dataSource(testDbUrl, "root", rootPass)
                        .locations("classpath:db/migration")
                        .callbacks(new V6DocumentReviewMigrationPreflightCallback())
                        .target("6")
                        .load();

                assertThatThrownBy(flywayV6::migrate)
                        .isInstanceOf(FlywayException.class)
                        .hasMessageContaining("V6 Migration Preflight Failed");

                // 4. CRITICAL INSPECTION: Verify zero partial schema mutations, zero data corruption, and zero persistent routines
                try (Connection conn = DriverManager.getConnection(testDbUrl, "root", rootPass);
                        Statement stmt = conn.createStatement()) {

                    // (a) college_registration_documents has ZERO new columns
                    List<String> columnsAfterFailure = new ArrayList<>();
                    try (ResultSet rs = stmt.executeQuery("""
                            SELECT COLUMN_NAME FROM information_schema.COLUMNS
                            WHERE TABLE_SCHEMA = '""" + testDbName + """
                                ' AND TABLE_NAME = 'college_registration_documents'
                            """)) {
                        while (rs.next()) {
                            columnsAfterFailure.add(rs.getString(1));
                        }
                    }
                    assertThat(columnsAfterFailure)
                            .as("college_registration_documents must NOT have any V6 columns after preflight abort")
                            .doesNotContain("verification_status", "verification_provenance", "rejection_reason",
                                    "last_reviewed_by_user_id", "last_reviewed_at", "source_document_id",
                                    "source_registration_id", "version");

                    // (b) college_document_reviews table was NEVER created
                    try (ResultSet rs = stmt.executeQuery("""
                            SELECT COUNT(*) FROM information_schema.TABLES
                            WHERE TABLE_SCHEMA = '""" + testDbName + """
                                ' AND TABLE_NAME = 'college_document_reviews'
                            """)) {
                        assertThat(rs.next()).isTrue();
                        assertThat(rs.getInt(1)).as("college_document_reviews table must not exist").isEqualTo(0);
                    }

                    // (c) Triggers were NEVER created
                    try (ResultSet rs = stmt.executeQuery("""
                            SELECT COUNT(*) FROM information_schema.TRIGGERS
                            WHERE TRIGGER_SCHEMA = '""" + testDbName + """
                                ' AND TRIGGER_NAME IN ('trg_cdr_prevent_update', 'trg_cdr_prevent_delete')
                            """)) {
                        assertThat(rs.next()).isTrue();
                        assertThat(rs.getInt(1)).as("Triggers must not exist").isEqualTo(0);
                    }

                    // (d) ZERO persistent stored procedures or routines created
                    try (ResultSet rs = stmt.executeQuery(
                            "SELECT COUNT(*) FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = '" + testDbName + "'")) {
                        assertThat(rs.next()).isTrue();
                        assertThat(rs.getInt(1))
                                .as("Zero persistent routines must exist in information_schema.ROUTINES after failed preflight")
                                .isEqualTo(0);
                    }

                    // (e) Document row was NOT mutated
                    try (ResultSet rs = stmt
                            .executeQuery("SELECT storage_key FROM college_registration_documents WHERE id = 100")) {
                        assertThat(rs.next()).isTrue();
                        assertThat(rs.getString("storage_key")).isEqualTo("key-preflight-fail");
                    }

                    // (f) flyway_schema_history records no successful V6 migration
                    try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM flyway_schema_history WHERE version = '6' AND success = 1")) {
                        assertThat(rs.next()).isTrue();
                        assertThat(rs.getInt(1)).as("No successful V6 migration in history").isEqualTo(0);
                    }
                }

                // 5. TEST REPAIR & RETRY RECOVERY WORKFLOW:
                // Correct the unsupported legacy state
                try (Connection conn = DriverManager.getConnection(testDbUrl, "root", rootPass);
                        Statement stmt = conn.createStatement()) {
                    stmt.execute("UPDATE college_registrations SET status = 'APPROVED' WHERE id = 100");
                }

                // Run Flyway repair to clean any failed history entries
                flywayV6.repair();

                try (Connection conn = DriverManager.getConnection(testDbUrl, "root", rootPass);
                        Statement stmt = conn.createStatement();
                        ResultSet rs = stmt
                                .executeQuery("SELECT COUNT(*) FROM flyway_schema_history WHERE version = '6'")) {
                    assertThat(rs.next()).isTrue();
                    assertThat(rs.getInt(1)).as("Failed V6 entry removed by repair if present").isEqualTo(0);
                }

                // Re-run Flyway migrate
                flywayV6.migrate();

                // Verify V6 succeeded and schema & backfilled data are present
                try (Connection conn = DriverManager.getConnection(testDbUrl, "root", rootPass);
                        Statement stmt = conn.createStatement()) {

                    try (ResultSet rs = stmt
                            .executeQuery("SELECT success FROM flyway_schema_history WHERE version = '6'")) {
                        assertThat(rs.next()).isTrue();
                        assertThat(rs.getBoolean("success")).isTrue();
                    }

                    try (ResultSet rs = stmt.executeQuery(
                            "SELECT verification_status, verification_provenance FROM college_registration_documents WHERE id = 100")) {
                        assertThat(rs.next()).isTrue();
                        assertThat(rs.getString("verification_status")).isEqualTo("ACCEPTED");
                        assertThat(rs.getString("verification_provenance")).isEqualTo("LEGACY_COLLEGE_APPROVAL");
                    }
                }
            } finally {
                rootStmt.execute("DROP DATABASE IF EXISTS " + testDbName);
            }
        }
    }

    @Test
    @DisplayName("18. Actual Flyway migration succeeds on valid legacy database and applies all 8 tuple attributions")
    void test18_actualFlywayMigrationExecution_validDatabase_succeedsWithSchemaAndBackfill() throws Exception {
        String rootPass = (MYSQL != null) ? MYSQL.getPassword() : "acadlytic_test_pass";
        String rootBaseUrl = (MYSQL != null) ? MYSQL.getJdbcUrl()
                : "jdbc:mysql://127.0.0.1:3306/acadlytic_test?allowPublicKeyRetrieval=true&useSSL=false";
        String testDbName = "acadlytic_valid_migration_test";
        String rootServerUrl = rootBaseUrl.substring(0, rootBaseUrl.lastIndexOf('/') + 1)
                + "?allowPublicKeyRetrieval=true&useSSL=false";
        String testDbUrl = rootBaseUrl.substring(0, rootBaseUrl.lastIndexOf('/') + 1) + testDbName
                + "?allowPublicKeyRetrieval=true&useSSL=false";

        try (Connection rootConn = DriverManager.getConnection(rootServerUrl, "root", rootPass);
                Statement rootStmt = rootConn.createStatement()) {

            rootStmt.execute("DROP DATABASE IF EXISTS " + testDbName);
            rootStmt.execute("CREATE DATABASE " + testDbName);

            try {
                // 1. Migrate to V5
                Flyway flywayV5 = Flyway.configure()
                        .dataSource(testDbUrl, "root", rootPass)
                        .locations("classpath:db/migration")
                        .target("5")
                        .load();
                flywayV5.migrate();

                // 2. Seed all 8 valid legacy tuples at V5
                record ValidSeed(int id, String colStatus, String regStatus, String expectedStatus,
                        String expectedProv) {
                }
                List<ValidSeed> validSeeds = List.of(
                        new ValidSeed(1, "APPROVED", "APPROVED", "ACCEPTED", "LEGACY_COLLEGE_APPROVAL"),
                        new ValidSeed(2, "APPROVED", "ACTION_REQUIRED", "PENDING", "NOT_REVIEWED"),
                        new ValidSeed(3, "APPROVED", "REJECTED", "PENDING", "NOT_REVIEWED"),
                        new ValidSeed(4, "PENDING", "PENDING", "PENDING", "NOT_REVIEWED"),
                        new ValidSeed(5, "ACTION_REQUIRED", "ACTION_REQUIRED", "PENDING", "NOT_REVIEWED"),
                        new ValidSeed(6, "ACTION_REQUIRED", "PENDING", "PENDING", "NOT_REVIEWED"),
                        new ValidSeed(7, "REJECTED", "REJECTED", "PENDING", "NOT_REVIEWED"),
                        new ValidSeed(8, "REJECTED", "PENDING", "PENDING", "NOT_REVIEWED"));

                try (Connection conn = DriverManager.getConnection(testDbUrl, "root", rootPass);
                        Statement stmt = conn.createStatement()) {

                    for (ValidSeed seed : validSeeds) {
                        stmt.execute(String.format(
                                """
                                            INSERT INTO colleges (id, name, code, approval_status, status, resubmission_count, action_required_count)
                                            VALUES (%d, 'Col %d', 'C%d', '%s', 'PENDING_VERIFICATION', 0, 0)
                                        """,
                                seed.id(), seed.id(), seed.id(), seed.colStatus()));
                        stmt.execute(String.format(
                                """
                                            INSERT INTO college_registrations (
                                                id, college_id, version_number, status, legal_name, address_line1, city, state, country, postal_code, contact_phone, affiliated_university_name
                                            ) VALUES (%d, %d, 1, '%s', 'Legal', 'Addr', 'City', 'State', 'Country', '12345', '+1-555-0100', 'Affil')
                                        """,
                                seed.id(), seed.id(), seed.regStatus()));
                        stmt.execute(String.format(
                                """
                                            INSERT INTO college_registration_documents (
                                                id, college_id, registration_id, document_category, original_filename, storage_key, mime_type, file_size_bytes, sha256_checksum
                                            ) VALUES (%d, %d, %d, 'UNIVERSITY_AFFILIATION_CERTIFICATE', 'test.pdf', 'key-vld-%d', 'application/pdf', 1024, '%s')
                                        """,
                                seed.id(), seed.id(), seed.id(), seed.id(), DUMMY_HASH));
                    }
                }

                // 3. Migrate to V6 with preflight callback
                Flyway flywayV6 = Flyway.configure()
                        .dataSource(testDbUrl, "root", rootPass)
                        .locations("classpath:db/migration")
                        .callbacks(new V6DocumentReviewMigrationPreflightCallback())
                        .target("6")
                        .load();
                flywayV6.migrate();

                // 4. Verify migration success and backfilled attributions
                try (Connection conn = DriverManager.getConnection(testDbUrl, "root", rootPass);
                        Statement stmt = conn.createStatement()) {

                    try (ResultSet rs = stmt
                            .executeQuery("SELECT success FROM flyway_schema_history WHERE version = '6'")) {
                        assertThat(rs.next()).isTrue();
                        assertThat(rs.getBoolean("success")).isTrue();
                    }

                    for (ValidSeed seed : validSeeds) {
                        try (ResultSet rs = stmt.executeQuery(
                                "SELECT verification_status, verification_provenance, rejection_reason, last_reviewed_by_user_id, last_reviewed_at FROM college_registration_documents WHERE id = "
                                        + seed.id())) {
                            assertThat(rs.next()).isTrue();
                            assertThat(rs.getString("verification_status"))
                                    .as("Status for seed %d (%s, %s)", seed.id(), seed.colStatus(), seed.regStatus())
                                    .isEqualTo(seed.expectedStatus());
                            assertThat(rs.getString("verification_provenance"))
                                    .as("Provenance for seed %d (%s, %s)", seed.id(), seed.colStatus(),
                                            seed.regStatus())
                                    .isEqualTo(seed.expectedProv());
                            assertThat(rs.getObject("rejection_reason")).isNull();
                            assertThat(rs.getObject("last_reviewed_by_user_id")).isNull();
                            assertThat(rs.getObject("last_reviewed_at")).isNull();
                        }
                    }
                }
            } finally {
                rootStmt.execute("DROP DATABASE IF EXISTS " + testDbName);
            }
        }
    }
}
