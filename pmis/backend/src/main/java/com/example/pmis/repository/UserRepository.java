package com.example.pmis.repository;

import com.example.pmis.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByRole(String role);
    List<User> findByOrganizationId(Long organizationId);
    List<User> findByDepartmentId(Long departmentId);
    boolean existsByEmail(String email);
}