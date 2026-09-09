package com.blake.pmis.retro.repository;

import com.blake.pmis.retro.entity.BoardParticipant;
import com.blake.pmis.retro.entity.ParticipantRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BoardParticipantRepository extends JpaRepository<BoardParticipant, Long> {

    List<BoardParticipant> findByBoardId(Long boardId);

    Optional<BoardParticipant> findByBoardIdAndUserId(Long boardId, Long userId);

    boolean existsByBoardIdAndUserId(Long boardId, Long userId);

    boolean existsByBoardIdAndUserIdAndRole(Long boardId, Long userId, ParticipantRole role);

    long deleteByBoardIdAndUserId(Long boardId, Long userId);
}
