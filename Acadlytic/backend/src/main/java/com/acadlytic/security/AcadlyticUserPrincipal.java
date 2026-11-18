package com.acadlytic.security;

import com.acadlytic.modules.auth.entity.Role;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.io.Serial;
import java.util.Collection;
import java.util.List;

/**
 * Serializable security principal stored in Spring Session JDBC.
 * Password hashes are intentionally excluded so credentials are never serialized into session storage.
 * Uses a stable user-ID-based principal key so session indexing remains valid across email changes (ADR-14).
 */
public class AcadlyticUserPrincipal implements UserDetails {

    @Serial
    private static final long serialVersionUID = 1L;

    private final Long userId;
    private final String email;
    private final Role role;
    private final Long collegeId;

    public AcadlyticUserPrincipal(Long userId, String email, Role role, Long collegeId) {
        this.userId = userId;
        this.email = email;
        this.role = role;
        this.collegeId = collegeId;
    }

    public static String principalKey(Long userId) {
        return "user:" + userId;
    }

    public Long getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    public Role getRole() {
        return role;
    }

    public Long getCollegeId() {
        return collegeId;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.asAuthority()));
    }

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public String getUsername() {
        return principalKey(userId);
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
