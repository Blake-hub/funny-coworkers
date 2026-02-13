package com.retroboard.repository;

import com.retroboard.entity.Card;
import com.retroboard.entity.BoardColumn;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CardRepository extends JpaRepository<Card, Long> {
    List<Card> findByColumnOrderByPositionAsc(BoardColumn column);
}
