package com.acadlytic.modules.auth.repository;

import com.acadlytic.modules.auth.entity.AuthToken;
import com.acadlytic.modules.auth.entity.AuthTokenType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface AuthTokenRepository extends JpaRepository<AuthToken, Long> {

    Optional<AuthToken> findByTokenHashAndTokenType(String tokenHash, AuthTokenType tokenType);

    @Modifying
    @Query("UPDATE AuthToken t SET t.revokedAt = :now "
            + "WHERE t.userId = :userId AND t.tokenType = :tokenType "
            + "AND t.usedAt IS NULL AND t.revokedAt IS NULL")
    int revokeActiveTokensForUser(
            @Param("userId") Long userId,
            @Param("tokenType") AuthTokenType tokenType,
            @Param("now") Instant now);
}
