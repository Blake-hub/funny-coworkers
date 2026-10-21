package com.blake.pmis.patent.repository;

import com.blake.pmis.patent.entity.PatentAdmin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PatentAdminRepository extends JpaRepository<PatentAdmin, Long> {

    boolean existsByUserId(Long userId);

    Optional<PatentAdmin> findByUserId(Long userId);

    List<PatentAdmin> findAllByOrderByCreatedAtDescIdDesc();

    /** All patent admin user ids; used to fan out notifications. */
    List<PatentAdmin> findAllBy();
}
