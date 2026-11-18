package com.acadlytic.security;

import com.acadlytic.common.exception.AppException;
import com.acadlytic.modules.auth.entity.Role;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Provides trusted authenticated identity and tenant context strictly from server-side Spring Security state.
 * Never trusts client-supplied role or collegeId parameters.
 */
@Component
public class SecurityContextService {

    public Optional<AcadlyticUserPrincipal> getCurrentPrincipalOptional() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof AcadlyticUserPrincipal principal)) {
            return Optional.empty();
        }
        return Optional.of(principal);
    }

    public AcadlyticUserPrincipal requireCurrentPrincipal() {
        return getCurrentPrincipalOptional()
                .orElseThrow(() -> new AppException(
                        "AUTH_UNAUTHENTICATED",
                        "Authentication is required.",
                        HttpStatus.UNAUTHORIZED));
    }

    public Long requireCurrentUserId() {
        return requireCurrentPrincipal().getUserId();
    }

    public Role requireCurrentRole() {
        return requireCurrentPrincipal().getRole();
    }

    public Long requireCurrentCollegeId() {
        Long collegeId = requireCurrentPrincipal().getCollegeId();
        if (collegeId == null) {
            throw new AppException(
                    "ACCESS_DENIED",
                    "Current user is not associated with a college tenant.",
                    HttpStatus.FORBIDDEN);
        }
        return collegeId;
    }
}
