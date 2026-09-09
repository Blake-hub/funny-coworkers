package com.blake.pmis.retro.repository;

import com.blake.pmis.retro.entity.Board;
import com.blake.pmis.retro.entity.BoardStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BoardRepository extends JpaRepository<Board, Long> {

    List<Board> findByOwnerIdOrderByUpdatedAtDesc(Long ownerId);

    List<Board> findByStatusOrderByUpdatedAtDesc(BoardStatus status);

    long countByOwnerIdAndStatus(Long ownerId, BoardStatus status);

    @Query("SELECT b FROM Board b JOIN BoardParticipant p ON p.boardId = b.id " +
           "WHERE p.userId = :userId ORDER BY b.updatedAt DESC")
    List<Board> findByParticipantUserId(@Param("userId") Long userId);

    @Query("SELECT b FROM Board b JOIN BoardParticipant p ON p.boardId = b.id " +
           "WHERE p.userId = :userId AND b.status = :status ORDER BY b.updatedAt DESC")
    List<Board> findByParticipantUserIdAndStatus(@Param("userId") Long userId, @Param("status") BoardStatus status);

    @Query("SELECT COUNT(DISTINCT b) FROM Board b JOIN BoardParticipant p ON p.boardId = b.id " +
           "WHERE p.userId = :userId AND b.status = :status")
    long countByParticipantUserIdAndStatus(@Param("userId") Long userId, @Param("status") BoardStatus status);
}
