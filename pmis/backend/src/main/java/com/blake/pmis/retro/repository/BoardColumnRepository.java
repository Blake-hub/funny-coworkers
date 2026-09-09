package com.blake.pmis.retro.repository;

import com.blake.pmis.retro.entity.BoardColumn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BoardColumnRepository extends JpaRepository<BoardColumn, Long> {

    List<BoardColumn> findByBoardIdOrderByPositionAsc(Long boardId);

    @Query("SELECT MAX(c.position) FROM BoardColumn c WHERE c.boardId = :boardId")
    Optional<Integer> findMaxPosition(@Param("boardId") Long boardId);

    long deleteByBoardId(Long boardId);
}
