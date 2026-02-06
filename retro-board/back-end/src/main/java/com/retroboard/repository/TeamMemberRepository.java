package com.retroboard.repository;

import com.retroboard.entity.TeamMember;
import com.retroboard.entity.Team;
import com.retroboard.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    List<TeamMember> findByTeam(Team team);
    List<TeamMember> findByUser(User user);
    Optional<TeamMember> findByTeamAndUser(Team team, User user);
}
