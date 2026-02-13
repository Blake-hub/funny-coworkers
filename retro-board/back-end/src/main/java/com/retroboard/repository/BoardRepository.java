package com.retroboard.repository;

import com.retroboard.entity.Board;
import com.retroboard.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BoardRepository extends JpaRepository<Board, Long> {
    List<Board> findByTeam(Team team);
}
