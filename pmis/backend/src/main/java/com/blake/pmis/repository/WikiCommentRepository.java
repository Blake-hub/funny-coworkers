package com.blake.pmis.repository;

import com.blake.pmis.entity.WikiComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WikiCommentRepository extends JpaRepository<WikiComment, Long> {

    List<WikiComment> findByWikiPageIdOrderByCreatedAtAsc(Long wikiPageId);

    int countByWikiPageId(Long wikiPageId);

    void deleteByWikiPageId(Long wikiPageId);
}