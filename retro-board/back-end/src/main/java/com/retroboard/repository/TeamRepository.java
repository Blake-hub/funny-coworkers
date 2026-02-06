package com.retroboard.repository;

import com.retroboard.entity.Team;
import com.retroboard.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByOwner(User owner);
    
    @Query("SELECT t FROM Team t WHERE t.owner = :user OR EXISTS (SELECT tm FROM TeamMember tm WHERE tm.team = t AND tm.user = :user)")
    List<Team> findByOwnerOrMember(User user);
    
    @Query("SELECT COUNT(t) > 0 FROM Team t WHERE t.id = :teamId AND (t.owner = :user OR EXISTS (SELECT tm FROM TeamMember tm WHERE tm.team = t AND tm.user = :user))")
    boolean existsByTeamIdAndOwnerOrMember(Long teamId, User user);
}
