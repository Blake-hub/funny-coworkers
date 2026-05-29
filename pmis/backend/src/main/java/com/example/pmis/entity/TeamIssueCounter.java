package com.example.pmis.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Entity
@Table(name = "team_issue_counter")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamIssueCounter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "team_id", nullable = false, unique = true)
    private Long teamId;

    @Column(name = "next_issue_number", nullable = false)
    @Builder.Default
    private Integer nextIssueNumber = 1;
}