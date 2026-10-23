package com.resultpoint.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;

/**
 * Authenticated User Principal for Spring Security Context.
 */
@Getter
@Builder
@AllArgsConstructor
public class UserPrincipal implements UserDetails {

    private static final long serialVersionUID = 1L;

    private final String id;
    private final String email;
    private final String password;
    private final String role;
    private final ArrayList<GrantedAuthority> authorities;
    private final boolean enabled;

    public static UserPrincipal create(String id, String email, String role) {
        String normalizedRole = role.toUpperCase().startsWith("ROLE_") ? role.toUpperCase() : "ROLE_" + role.toUpperCase();
        ArrayList<GrantedAuthority> authorities = new ArrayList<>(Collections.singletonList(new SimpleGrantedAuthority(normalizedRole)));

        return UserPrincipal.builder()
                .id(id)
                .email(email)
                .password(null)
                .role(normalizedRole)
                .authorities(authorities)
                .enabled(true)
                .build();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
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
        return enabled;
    }
}
