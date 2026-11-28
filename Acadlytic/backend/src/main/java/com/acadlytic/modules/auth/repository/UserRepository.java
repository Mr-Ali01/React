package com.acadlytic.modules.auth.repository;

import com.acadlytic.modules.auth.entity.Role;
import com.acadlytic.modules.auth.entity.User;
import com.acadlytic.modules.auth.entity.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailAndEmailReleasedFalse(String email);

    boolean existsByEmailAndEmailReleasedFalse(String email);

    boolean existsByRole(Role role);

    List<User> findByCollegeId(Long collegeId);

    Optional<User> findByCollegeIdAndRoleAndStatus(Long collegeId, Role role, UserStatus status);

    List<User> findByCollegeIdInAndRoleAndStatus(Collection<Long> collegeIds, Role role, UserStatus status);
}
