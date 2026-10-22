package com.resultpoint.modules.auth.repository;

import com.resultpoint.modules.auth.entity.PasswordResetToken;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    Optional<PasswordResetToken> findByTokenHashAndIsUsedFalseAndExpiresAtAfter(String tokenHash, Instant now);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM PasswordResetToken t WHERE t.tokenHash = :tokenHash AND t.isUsed = false AND t.expiresAt > :now")
    Optional<PasswordResetToken> findByTokenHashAndIsUsedFalseAndExpiresAtAfterWithLock(@Param("tokenHash") String tokenHash, @Param("now") Instant now);

    @org.springframework.transaction.annotation.Transactional
    @Modifying
    @Query("UPDATE PasswordResetToken t SET t.isUsed = true WHERE t.user.id = :userId AND t.isUsed = false")
    int invalidateAllActiveByUserId(@Param("userId") String userId);
}
