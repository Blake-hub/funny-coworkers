package com.example.pmis.service;

import com.example.pmis.entity.User;
import com.example.pmis.entity.enumeration.Permission;
import com.example.pmis.entity.enumeration.Role;
import com.example.pmis.repository.TeamMemberRepository;
import com.example.pmis.repository.TeamRepository;
import com.example.pmis.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.EnumSet;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;

    private static final Map<Role, EnumSet<Permission>> ROLE_PERMISSIONS = Map.of(
            Role.ADMIN, EnumSet.allOf(Permission.class),
            Role.TEAM_OWNER, EnumSet.of(
                    Permission.ORGANIZATION_READ,
                    Permission.TEAM_CREATE,
                    Permission.TEAM_READ,
                    Permission.TEAM_UPDATE,
                    Permission.TEAM_DELETE,
                    Permission.TEAM_INVITE,
                    Permission.TEAM_REMOVE_MEMBER,
                    Permission.TEAM_TRANSFER_OWNERSHIP,
                    Permission.PROJECT_CREATE,
                    Permission.PROJECT_READ,
                    Permission.PROJECT_UPDATE,
                    Permission.PROJECT_DELETE,
                    Permission.ISSUE_CREATE,
                    Permission.ISSUE_READ,
                    Permission.ISSUE_UPDATE,
                    Permission.ISSUE_DELETE_OWN,
                    Permission.ISSUE_DELETE_ANY,
                    Permission.ISSUE_ASSIGN,
                    Permission.ISSUE_COMMENT,
                    Permission.USER_READ,
                    Permission.USER_UPDATE_OWN
            ),
            Role.TEAM_MEMBER, EnumSet.of(
                    Permission.ORGANIZATION_READ,
                    Permission.TEAM_READ,
                    Permission.PROJECT_READ,
                    Permission.ISSUE_CREATE,
                    Permission.ISSUE_READ,
                    Permission.ISSUE_UPDATE,
                    Permission.ISSUE_DELETE_OWN,
                    Permission.ISSUE_ASSIGN,
                    Permission.ISSUE_COMMENT,
                    Permission.USER_READ,
                    Permission.USER_UPDATE_OWN
            )
    );

    public boolean hasPermission(User user, Permission permission) {
        if (user == null || permission == null) {
            return false;
        }
        if (isAdmin(user)) {
            return true;
        }
        EnumSet<Permission> permissions = ROLE_PERMISSIONS.get(user.getRole());
        return permissions != null && permissions.contains(permission);
    }

    public boolean isTeamOwner(User user, Long teamId) {
        if (user == null || teamId == null) {
            return false;
        }
        if (isAdmin(user)) {
            return true;
        }
        return teamRepository.existsByIdAndOwnerId(teamId, user.getId());
    }

    public boolean isTeamMember(User user, Long teamId) {
        if (user == null || teamId == null) {
            return false;
        }
        if (isAdmin(user)) {
            return true;
        }
        return teamMemberRepository.existsByTeamIdAndUserId(teamId, user.getId());
    }

    public boolean isAdmin(User user) {
        return user != null && Role.ADMIN.equals(user.getRole());
    }
}