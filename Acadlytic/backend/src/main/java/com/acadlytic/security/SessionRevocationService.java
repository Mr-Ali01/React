package com.acadlytic.security;

import com.acadlytic.modules.auth.entity.User;
import com.acadlytic.modules.auth.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.session.FindByIndexNameSessionRepository;
import org.springframework.session.Session;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Server-side session revocation service backed by Spring Session JDBC (ADR-02, ADR-05).
 *
 * Revocation Matrix (ADR-05):
 * - Normal Logout: current session only
 * - Password Change / Email Change: all OTHER sessions + rotate current session ID
 * - Password Reset / User Suspension / College Suspension / Permanent Rejection /
 *   Admin Replacement / SUPER_ADMIN Suspension: ALL active sessions
 */
@Service
public class SessionRevocationService {

    private final FindByIndexNameSessionRepository<? extends Session> sessionRepository;
    private final UserRepository userRepository;

    public SessionRevocationService(
            FindByIndexNameSessionRepository<? extends Session> sessionRepository,
            UserRepository userRepository) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
    }

    public void revokeCurrentSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            String sessionId = session.getId();
            try {
                session.invalidate();
            } catch (IllegalStateException ignored) {
                // Already invalidated
            }
            sessionRepository.deleteById(sessionId);
        }
        SecurityContextHolder.clearContext();
    }

    public int revokeOtherSessions(Long userId, String currentSessionId) {
        String principalName = AcadlyticUserPrincipal.principalKey(userId);
        Map<String, ? extends Session> sessions = sessionRepository.findByPrincipalName(principalName);
        int revoked = 0;
        for (String sessionId : sessions.keySet()) {
            if (currentSessionId == null || !sessionId.equals(currentSessionId)) {
                sessionRepository.deleteById(sessionId);
                revoked++;
            }
        }
        return revoked;
    }

    public int revokeAllSessionsForUser(Long userId) {
        String principalName = AcadlyticUserPrincipal.principalKey(userId);
        Map<String, ? extends Session> sessions = sessionRepository.findByPrincipalName(principalName);
        int revoked = 0;
        for (String sessionId : sessions.keySet()) {
            sessionRepository.deleteById(sessionId);
            revoked++;
        }
        return revoked;
    }

    public int revokeAllSessionsForCollege(Long collegeId) {
        List<User> users = userRepository.findByCollegeId(collegeId);
        int totalRevoked = 0;
        for (User user : users) {
            totalRevoked += revokeAllSessionsForUser(user.getId());
        }
        return totalRevoked;
    }

    public int countActiveSessionsForUser(Long userId) {
        String principalName = AcadlyticUserPrincipal.principalKey(userId);
        return sessionRepository.findByPrincipalName(principalName).size();
    }
}
