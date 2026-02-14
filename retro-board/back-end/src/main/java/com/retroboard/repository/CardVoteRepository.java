package com.retroboard.repository;

import com.retroboard.entity.CardVote;
import com.retroboard.entity.User;
import com.retroboard.entity.Card;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CardVoteRepository extends JpaRepository<CardVote, Long> {
    Optional<CardVote> findByUserAndCard(User user, Card card);
    boolean existsByUserAndCard(User user, Card card);
    void deleteByUserAndCard(User user, Card card);
}
