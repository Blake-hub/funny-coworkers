package com.example.pmis.repository;

import com.example.pmis.entity.WikiFolder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WikiFolderRepository extends JpaRepository<WikiFolder, Long> {
    List<WikiFolder> findByParentFolderIdIsNull();
    List<WikiFolder> findByParentFolderId(Long parentFolderId);
    List<WikiFolder> findByCreatedBy(Long createdBy);
    List<WikiFolder> findByTeamId(Long teamId);
    boolean existsByIdAndParentFolderId(Long id, Long parentFolderId);
}
