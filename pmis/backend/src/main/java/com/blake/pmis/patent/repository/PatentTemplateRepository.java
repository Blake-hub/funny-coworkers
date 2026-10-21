package com.blake.pmis.patent.repository;

import com.blake.pmis.patent.entity.PatentTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PatentTemplateRepository extends JpaRepository<PatentTemplate, Long> {

    /** Newest templates first for both admin management and download lists. */
    List<PatentTemplate> findAllByOrderByUploadedAtDescIdDesc();
}
