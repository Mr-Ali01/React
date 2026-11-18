package com.acadlytic.modules.auth;

import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.auth.entity.User;
import com.acadlytic.modules.auth.entity.UserStatus;
import com.acadlytic.modules.auth.repository.AuditEventRepository;
import com.acadlytic.modules.auth.repository.AuthTokenRepository;
import com.acadlytic.modules.auth.repository.UserRepository;
import com.acadlytic.modules.colleges.entity.College;
import com.acadlytic.modules.colleges.entity.CollegeApprovalStatus;
import com.acadlytic.modules.colleges.entity.CollegeStatus;
import com.acadlytic.modules.colleges.repository.CollegeRepository;
import com.acadlytic.support.AbstractMySqlIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SchemaAndConstraintsIntegrationTest extends AbstractMySqlIntegrationTest {

    @Autowired
    private CollegeRepository collegeRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private AuthTokenRepository authTokenRepository;
    @Autowired
    private AuditEventRepository auditEventRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void cleanDatabase() {
        authTokenRepository.deleteAll();
        auditEventRepository.deleteAll();
        userRepository.deleteAll();
        collegeRepository.deleteAll();
    }

    @Test
    void flywayMigrationsAndSpringSessionTablesExist() {
        Integer migrationCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM flyway_schema_history WHERE success = 1", Integer.class);
        assertThat(migrationCount).isGreaterThanOrEqualTo(3);

        Integer springSessionTables = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables "
                        + "WHERE table_schema = DATABASE() "
                        + "AND table_name IN ('SPRING_SESSION', 'SPRING_SESSION_ATTRIBUTES')",
                Integer.class);
        assertThat(springSessionTables).isEqualTo(2);
    }

    @Test
    void virtualGeneratedColumnEnforcesMaximumOneActiveCollegeAdminPerCollege() {
        College college = createCollege("St. Xavier Engineering", "SXIE");

        User firstAdmin = buildUser("admin1@sxie.edu", Role.COLLEGE_ADMIN, college.getId(), UserStatus.ACTIVE);
        userRepository.saveAndFlush(firstAdmin);

        // Second ACTIVE COLLEGE_ADMIN for the SAME college must be rejected by uk_users_single_active_college_admin
        User duplicateActiveAdmin = buildUser("admin2@sxie.edu", Role.COLLEGE_ADMIN, college.getId(), UserStatus.ACTIVE);
        assertThatThrownBy(() -> userRepository.saveAndFlush(duplicateActiveAdmin))
                .isInstanceOf(DataIntegrityViolationException.class);

        // Multiple INACTIVE COLLEGE_ADMIN rows for the same college are permitted (users.college_id is non-unique)
        User inactiveHistorical1 = buildUser("former1@sxie.edu", Role.COLLEGE_ADMIN, college.getId(), UserStatus.INACTIVE);
        User inactiveHistorical2 = buildUser("former2@sxie.edu", Role.COLLEGE_ADMIN, college.getId(), UserStatus.INACTIVE);
        userRepository.saveAndFlush(inactiveHistorical1);
        userRepository.saveAndFlush(inactiveHistorical2);

        // Deactivating the active admin frees the unique slot for a replacement active admin
        firstAdmin.setStatus(UserStatus.INACTIVE);
        userRepository.saveAndFlush(firstAdmin);

        User replacementAdmin = buildUser("replacement@sxie.edu", Role.COLLEGE_ADMIN, college.getId(), UserStatus.ACTIVE);
        User savedReplacement = userRepository.saveAndFlush(replacementAdmin);
        assertThat(savedReplacement.getId()).isNotNull();
    }

    @Test
    void allowsMultipleActiveSuperAdminsWithNullCollegeId() {
        User sa1 = buildUser("sa1@acadlytic.com", Role.SUPER_ADMIN, null, UserStatus.ACTIVE);
        User sa2 = buildUser("sa2@acadlytic.com", Role.SUPER_ADMIN, null, UserStatus.ACTIVE);
        userRepository.saveAndFlush(sa1);
        userRepository.saveAndFlush(sa2);

        assertThat(userRepository.count()).isEqualTo(2);
    }

    @Test
    void virtualActiveEmailEnforcesUniquenessAndReleasesOnlyWhenEmailReleasedTrue() {
        College college = createCollege("Alpha College", "ALPH");
        User first = buildUser("principal@alpha.edu", Role.COLLEGE_ADMIN, college.getId(), UserStatus.INACTIVE);
        first.setEmailReleased(false);
        userRepository.saveAndFlush(first);

        // Still blocked even when INACTIVE because email_released = FALSE
        User collision = buildUser("principal@alpha.edu", Role.SUPER_ADMIN, null, UserStatus.ACTIVE);
        assertThatThrownBy(() -> userRepository.saveAndFlush(collision))
                .isInstanceOf(DataIntegrityViolationException.class);

        // Setting email_released = TRUE (permanent rejection / 7-day cleanup) frees the email
        first.setEmailReleased(true);
        userRepository.saveAndFlush(first);

        User reused = buildUser("principal@alpha.edu", Role.COLLEGE_ADMIN, college.getId(), UserStatus.ACTIVE);
        assertThat(userRepository.saveAndFlush(reused).getId()).isNotNull();
    }

    @Test
    void virtualActiveCollegeCodeReleasesOnPermanentRejectionOrArchive() {
        College first = createCollege("Beta Institute", "BETA");

        College duplicate = new College();
        duplicate.setName("Beta Duplicate");
        duplicate.setCode("BETA");
        assertThatThrownBy(() -> collegeRepository.saveAndFlush(duplicate))
                .isInstanceOf(DataIntegrityViolationException.class);

        first.setPermanentlyRejected(true);
        first.setApprovalStatus(CollegeApprovalStatus.REJECTED);
        first.setStatus(CollegeStatus.INACTIVE);
        collegeRepository.saveAndFlush(first);

        College reapplied = createCollege("Beta Reapplied", "BETA");
        assertThat(reapplied.getId()).isNotNull();

        reapplied.setArchivedAt(Instant.now());
        reapplied.setStatus(CollegeStatus.INACTIVE);
        collegeRepository.saveAndFlush(reapplied);

        College third = createCollege("Beta Fresh", "BETA");
        assertThat(third.getId()).isNotNull();
    }

    private College createCollege(String name, String code) {
        College college = new College();
        college.setName(name);
        college.setCode(code);
        college.setApprovalStatus(CollegeApprovalStatus.PENDING);
        college.setStatus(CollegeStatus.PENDING_VERIFICATION);
        return collegeRepository.saveAndFlush(college);
    }

    private User buildUser(String email, Role role, Long collegeId, UserStatus status) {
        User user = new User();
        user.setEmail(email);
        user.setFirstName("Test");
        user.setLastName("Admin");
        user.setRole(role);
        user.setCollegeId(collegeId);
        user.setStatus(status);
        user.setPasswordHash(passwordEncoder.encode("StrongPassword!2026"));
        return user;
    }
}
