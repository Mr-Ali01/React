package com.acadlytic.security;

import com.acadlytic.modules.auth.entity.User;
import com.acadlytic.modules.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.session.FindByIndexNameSessionRepository;
import org.springframework.session.MapSession;
import org.springframework.session.Session;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SessionRevocationServiceUnitTest {

    @Mock
    private FindByIndexNameSessionRepository<Session> sessionRepository;
    @Mock
    private UserRepository userRepository;

    private SessionRevocationService revocationService;

    @BeforeEach
    void setUp() {
        revocationService = new SessionRevocationService(sessionRepository, userRepository);
    }

    @Test
    void revokeOtherSessionsPreservesCurrentSessionOnly() {
        Map<String, Session> activeSessions = Map.of(
                "sess-current", new MapSession("sess-current"),
                "sess-other-1", new MapSession("sess-other-1"),
                "sess-other-2", new MapSession("sess-other-2")
        );
        doReturn(activeSessions).when(sessionRepository).findByPrincipalName("user:5");

        int revoked = revocationService.revokeOtherSessions(5L, "sess-current");

        assertThat(revoked).isEqualTo(2);
        verify(sessionRepository, never()).deleteById("sess-current");
        verify(sessionRepository).deleteById("sess-other-1");
        verify(sessionRepository).deleteById("sess-other-2");
    }

    @Test
    void revokeAllSessionsForCollegeRevokesSessionsOfEveryCollegeUser() {
        User u1 = new User();
        u1.setId(11L);
        User u2 = new User();
        u2.setId(12L);
        when(userRepository.findByCollegeId(100L)).thenReturn(List.of(u1, u2));
        doReturn(Map.of("s1", new MapSession("s1"))).when(sessionRepository).findByPrincipalName("user:11");
        doReturn(Map.of("s2", new MapSession("s2"), "s3", new MapSession("s3")))
                .when(sessionRepository).findByPrincipalName("user:12");

        int revoked = revocationService.revokeAllSessionsForCollege(100L);

        assertThat(revoked).isEqualTo(3);
        verify(sessionRepository).deleteById("s1");
        verify(sessionRepository).deleteById("s2");
        verify(sessionRepository).deleteById("s3");
    }
}
