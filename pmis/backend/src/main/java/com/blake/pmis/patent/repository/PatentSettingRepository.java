package com.blake.pmis.patent.repository;

import com.blake.pmis.patent.entity.PatentSetting;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Singleton repository: only the id=1 row is expected. Use
 * {@code findPatentSettingById(PATENT_SETTING_ID)} / {@code getReferenceById}.
 */
public interface PatentSettingRepository extends JpaRepository<PatentSetting, Long> {
}
