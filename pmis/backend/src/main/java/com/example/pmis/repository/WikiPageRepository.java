package com.example.pmis.repository;

import com.example.pmis.entity.WikiPage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WikiPageRepository extends JpaRepository<WikiPage, Long> {
    List<WikiPage> findByParentPageId(Long parentPageId);
    List<WikiPage> findByLastModifiedBy(Long userId);
    List<WikiPage> findByFolderId(Long folderId);
    List<WikiPage> findByFolderIdIsNull();
    long countByFolderId(Long folderId);

    @Query("SELECT p FROM WikiPage p WHERE LOWER(TRIM(p.title)) = LOWER(TRIM(:title)) AND p.id <> :excludeId")
    List<WikiPage> findConflictingByTitleGlobally(
            @Param("title") String title,
            @Param("excludeId") Long excludeId);
}