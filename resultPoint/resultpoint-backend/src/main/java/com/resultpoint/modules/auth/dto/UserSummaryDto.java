package com.resultpoint.modules.auth.dto;

import com.resultpoint.modules.user.entity.User;
import com.resultpoint.modules.user.entity.UserRole;
import com.resultpoint.modules.user.entity.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryDto {

    private String id;
    private String email;
    private String fullName;
    private UserRole role;
    private UserStatus status;
    private String avatarUrl;
    private String phone;
    private Instant createdAt;
    private Instant lastLoginAt;

    public static UserSummaryDto fromEntity(User user) {
        if (user == null) {
            return null;
        }
        return UserSummaryDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .status(user.getStatus())
                .avatarUrl(user.getAvatarUrl())
                .phone(user.getPhone())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }
}
