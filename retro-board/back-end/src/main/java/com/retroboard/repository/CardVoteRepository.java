package com.retroboard.repository;

import com.retroboard.entity.CardVote;
import com.retroboard.entity.User;
import com.retroboard.entity.Card;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.Set;

public interface CardVoteRepository extends JpaRepository<CardVote, Long> {
    Optional<CardVote> findByUserAndCard(User user, Card card);
    boolean existsByUserAndCard(User user, Card card);
    void deleteByUserAndCard(User user, Card card);
    
    @Query("SELECT cv.card.id FROM CardVote cv WHERE cv.user = :user")
    Set<Long> findCardIdsByUser(@Param("user") User user);
}
