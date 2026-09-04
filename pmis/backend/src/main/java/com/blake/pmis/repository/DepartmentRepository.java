package com.blake.pmis.repository;

import com.blake.pmis.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    List<Department> findByOrganizationId(Long organizationId);
    List<Department> findByParentDepartmentId(Long parentDepartmentId);
}