package com.blake.pmis.retro.repository;

import com.blake.pmis.retro.entity.CardVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CardVoteRepository extends JpaRepository<CardVote, Long> {

    boolean existsByCardIdAndUserId(Long cardId, Long userId);

    Optional<CardVote> findByCardIdAndUserId(Long cardId, Long userId);

    long deleteByCardIdAndUserId(Long cardId, Long userId);
}
