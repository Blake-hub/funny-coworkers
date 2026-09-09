package com.blake.pmis.retro.repository;

import com.blake.pmis.retro.entity.Card;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CardRepository extends JpaRepository<Card, Long> {

    List<Card> findByColumnIdOrderByPositionAsc(Long columnId);

    @Query("SELECT MAX(c.position) FROM Card c WHERE c.columnId = :columnId")
    Optional<Integer> findMaxPosition(@Param("columnId") Long columnId);

    @Query("SELECT COUNT(c) FROM Card c WHERE c.columnId IN " +
           "(SELECT col.id FROM BoardColumn col WHERE col.boardId = :boardId)")
    long countByBoardId(@Param("boardId") Long boardId);

    long deleteByColumnId(Long columnId);
}
