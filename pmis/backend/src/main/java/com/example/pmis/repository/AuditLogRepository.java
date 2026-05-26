package com.example.pmis.repository;

import com.example.pmis.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByUserId(Long userId);
    List<AuditLog> findByResourceType(String resourceType);
    List<AuditLog> findByResourceTypeAndResourceId(String resourceType, Long resourceId);
}