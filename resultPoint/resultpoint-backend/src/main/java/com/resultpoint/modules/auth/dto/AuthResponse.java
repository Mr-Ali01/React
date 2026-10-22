package com.resultpoint.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    @Builder.Default
    private String tokenType = "Bearer";

    private String accessToken;

    @Builder.Default
    private long expiresIn = 900L;

    private String refreshToken;

    private UserSummaryDto user;
}
