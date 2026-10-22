package com.resultpoint.modules.auth.repository;

import com.resultpoint.modules.auth.entity.UserRefreshToken;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRefreshTokenRepository extends JpaRepository<UserRefreshToken, Long> {

    Optional<UserRefreshToken> findByTokenHash(String tokenHash);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM UserRefreshToken t WHERE t.tokenHash = :tokenHash")
    Optional<UserRefreshToken> findByTokenHashWithLock(@Param("tokenHash") String tokenHash);

    List<UserRefreshToken> findAllByUserIdAndIsRevokedFalseAndExpiresAtAfterOrderByCreatedAtAsc(String userId, Instant now);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM UserRefreshToken t WHERE t.user.id = :userId AND t.isRevoked = false AND t.expiresAt > :now ORDER BY t.createdAt ASC")
    List<UserRefreshToken> findAllActiveByUserIdWithLock(@Param("userId") String userId, @Param("now") Instant now);

    List<UserRefreshToken> findAllByUserIdAndIsRevokedFalse(String userId);

    @org.springframework.transaction.annotation.Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    @Modifying
    @Query("UPDATE UserRefreshToken t SET t.isRevoked = true, t.revokedAt = :now, t.revocationReason = :reason " +
           "WHERE t.user.id = :userId AND t.isRevoked = false")
    int revokeAllActiveByUserId(@Param("userId") String userId, @Param("now") Instant now, @Param("reason") String reason);
}
