package com.blake.pmis.patent.service;

import com.blake.pmis.entity.User;
import com.blake.pmis.entity.enumeration.Role;
import com.blake.pmis.patent.dto.PatentAdminDTO;
import com.blake.pmis.patent.entity.PatentAdmin;
import com.blake.pmis.patent.repository.PatentAdminRepository;
import com.blake.pmis.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatentAdminService {

    private final PatentAdminRepository patentAdminRepository;
    private final UserRepository userRepository;

    /**
     * Module-level admin check: a row in patent_admin, or any global ADMIN
     * (superuser semantics).
     */
    @Transactional(readOnly = true)
    public boolean isPatentAdmin(User user) {
        if (user == null || user.getId() == null) {
            return false;
        }
        if (user.getRole() == Role.ADMIN) {
            return true;
        }
        return patentAdminRepository.existsByUserId(user.getId());
    }

    /** All patent admin user ids; used to fan out notifications. */
    @Transactional(readOnly = true)
    public List<Long> patentAdminUserIds() {
        return patentAdminRepository.findAll().stream()
                .map(PatentAdmin::getUserId)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PatentAdminDTO> list() {
        final List<PatentAdmin> grants = patentAdminRepository.findAllByOrderByCreatedAtDescIdDesc();
        final List<Long> userIds = grants.stream()
                .flatMap(g -> java.util.stream.Stream.of(g.getUserId(), g.getGrantedBy()))
                .distinct()
                .toList();
        final Map<Long, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        return grants.stream()
                .map(g -> PatentAdminDTO.builder()
                        .userId(g.getUserId())
                        .userName(nameOf(userMap.get(g.getUserId())))
                        .userEmail(userMap.get(g.getUserId()) != null
                                ? userMap.get(g.getUserId()).getEmail() : null)
                        .grantedBy(g.getGrantedBy())
                        .grantedByName(nameOf(userMap.get(g.getGrantedBy())))
                        .grantedAt(g.getCreatedAt())
                        .build())
                .toList();
    }

    @Transactional
    public PatentAdminDTO grant(Long userId, User actor) {
        requireGlobalAdmin(actor);
        if (userId == null) {
            throw new RuntimeException("userId is required");
        }
        final User target = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        if (patentAdminRepository.existsByUserId(userId)) {
            throw new IllegalStateException("User is already a patent admin: " + userId);
        }
        final PatentAdmin saved = patentAdminRepository.save(PatentAdmin.builder()
                .userId(userId)
                .grantedBy(actor.getId())
                .build());
        return PatentAdminDTO.builder()
                .userId(saved.getUserId())
                .userName(target.getName())
                .userEmail(target.getEmail())
                .grantedBy(saved.getGrantedBy())
                .grantedAt(saved.getCreatedAt())
                .build();
    }

    @Transactional
    public void revoke(Long userId, User actor) {
        requireGlobalAdmin(actor);
        final PatentAdmin grant = patentAdminRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User is not a patent admin: " + userId));
        patentAdminRepository.delete(grant);
    }

    private void requireGlobalAdmin(User actor) {
        if (actor == null || actor.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only the system administrator can manage patent admins");
        }
    }

    private String nameOf(User user) {
        return user != null && user.getName() != null ? user.getName() : null;
    }
}
