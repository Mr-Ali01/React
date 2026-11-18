package com.acadlytic.modules.auth.service;

import com.acadlytic.common.exception.AppException;
import com.acadlytic.config.SuperAdminBootstrapProperties;
import com.acadlytic.modules.auth.entity.AuditEventType;
import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.auth.entity.User;
import com.acadlytic.modules.auth.entity.UserStatus;
import com.acadlytic.modules.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SuperAdminBootstrapRunnerUnitTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private AuditEventService auditEventService;

    private SuperAdminBootstrapProperties properties;
    private PasswordEncoder passwordEncoder;
    private SuperAdminBootstrapRunner runner;

    @BeforeEach
    void setUp() {
        properties = new SuperAdminBootstrapProperties();
        passwordEncoder = new BCryptPasswordEncoder(4);
        runner = new SuperAdminBootstrapRunner(
                properties,
                userRepository,
                new EmailNormalizer(),
                new PasswordPolicyValidator(),
                passwordEncoder,
                auditEventService
        );
    }

    @Test
    void doesNothingWhenDisabled() {
        properties.setEnabled(false);

        runner.run(new DefaultApplicationArguments());

        verify(userRepository, never()).existsByRole(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void skipsWhenSuperAdminAlreadyExists() {
        properties.setEnabled(true);
        when(userRepository.existsByRole(Role.SUPER_ADMIN)).thenReturn(true);

        runner.run(new DefaultApplicationArguments());

        verify(userRepository, never()).save(any());
    }

    @Test
    void failsFastWhenPasswordViolatesPolicy() {
        properties.setEnabled(true);
        properties.setEmail("owner@acadlytic.com");
        properties.setFirstName("Platform");
        properties.setLastName("Owner");
        properties.setPassword("short");

        when(userRepository.existsByRole(Role.SUPER_ADMIN)).thenReturn(false);

        assertThatThrownBy(() -> runner.run(new DefaultApplicationArguments()))
                .isInstanceOf(AppException.class)
                .extracting("errorCode")
                .isEqualTo("PASSWORD_POLICY_VIOLATION");

        verify(userRepository, never()).save(any());
    }

    @Test
    void bootstrapsSuperAdminAndRecordsAuditEvent() {
        properties.setEnabled(true);
        properties.setEmail("  Owner@Acadlytic.com ");
        properties.setFirstName("Platform");
        properties.setLastName("Owner");
        properties.setPassword("UltraSecureOwnerPass!2026");

        when(userRepository.existsByRole(Role.SUPER_ADMIN)).thenReturn(false);
        when(userRepository.existsByEmailAndEmailReleasedFalse("owner@acadlytic.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User saved = inv.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        runner.run(new DefaultApplicationArguments());

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User created = captor.getValue();
        assertThat(created.getEmail()).isEqualTo("owner@acadlytic.com");
        assertThat(created.getRole()).isEqualTo(Role.SUPER_ADMIN);
        assertThat(created.getCollegeId()).isNull();
        assertThat(created.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(created.getEmailVerifiedAt()).isNotNull();
        assertThat(passwordEncoder.matches("UltraSecureOwnerPass!2026", created.getPasswordHash())).isTrue();

        verify(auditEventService).record(
                eq(AuditEventType.SUPER_ADMIN_BOOTSTRAPPED),
                eq(1L),
                eq(Role.SUPER_ADMIN),
                eq(1L),
                eq(null),
                any(),
                eq(null),
                anyMap());
    }
}
