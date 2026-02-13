package com.retroboard.repository;

import com.retroboard.entity.BoardColumn;
import com.retroboard.entity.Board;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BoardColumnRepository extends JpaRepository<BoardColumn, Long> {
    List<BoardColumn> findByBoardOrderByPositionAsc(Board board);
}
