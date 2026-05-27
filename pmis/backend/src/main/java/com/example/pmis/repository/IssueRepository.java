package com.example.pmis.repository;

import com.example.pmis.entity.Issue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IssueRepository extends JpaRepository<Issue, Long> {

    List<Issue> findByProjectIdOrderByStatusIdAscSortOrderAsc(Long projectId);

    List<Issue> findByProjectIdOrderBySortOrderAsc(Long projectId);

    List<Issue> findByStatusIdOrderBySortOrderAsc(Integer statusId);

    long countByProjectId(Long projectId);

    long countByProjectIdAndStatusIdNot(Long projectId, Integer statusId);

    @Query("SELECT MAX(i.sortOrder) FROM Issue i WHERE i.statusId = :statusId")
    Optional<Integer> findMaxSortOrderByStatusId(@Param("statusId") Integer statusId);

    @Modifying
    @Query("UPDATE Issue i SET i.statusId = :statusId, i.sortOrder = :sortOrder WHERE i.id = :id")
    void updateStatusAndSortOrder(@Param("id") Long id, @Param("statusId") Integer statusId, @Param("sortOrder") Integer sortOrder);

    @Modifying
    @Query("UPDATE Issue i SET i.sortOrder = :sortOrder WHERE i.id = :id")
    void updateSortOrder(@Param("id") Long id, @Param("sortOrder") Integer sortOrder);

    @Modifying
    @Query("UPDATE Issue i SET i.sortOrder = i.sortOrder + 1 WHERE i.statusId = :statusId AND i.sortOrder >= :sortOrder AND i.id != :excludeId")
    void incrementSortOrdersFrom(@Param("statusId") Integer statusId, @Param("sortOrder") Integer sortOrder, @Param("excludeId") Long excludeId);

    long countByStatusId(Integer statusId);

    List<Issue> findByTeamIdIn(List<Long> teamIds);
}