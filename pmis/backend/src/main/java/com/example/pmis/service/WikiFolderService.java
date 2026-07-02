package com.example.pmis.service;

import com.example.pmis.dto.CreateWikiFolderRequest;
import com.example.pmis.dto.UpdateWikiFolderRequest;
import com.example.pmis.dto.WikiFolderDTO;
import com.example.pmis.entity.Team;
import com.example.pmis.entity.User;
import com.example.pmis.entity.WikiFolder;
import com.example.pmis.entity.WikiPage;
import com.example.pmis.entity.enumeration.WikiVisibility;
import com.example.pmis.repository.TeamRepository;
import com.example.pmis.repository.UserRepository;
import com.example.pmis.repository.WikiFolderRepository;
import com.example.pmis.repository.WikiPageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class WikiFolderService {

    private final WikiFolderRepository wikiFolderRepository;
    private final WikiPageRepository wikiPageRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final PermissionService permissionService;

    @Transactional(readOnly = true)
    public List<WikiFolderDTO> getAllFoldersTree(User currentUser) {
        List<WikiFolder> allFolders = wikiFolderRepository.findAll();
        List<WikiFolder> accessibleFolders = allFolders.stream()
                .filter(folder -> hasViewAccess(folder, currentUser))
                .collect(Collectors.toList());

        List<WikiFolderDTO> flatDTOs = accessibleFolders.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return buildTree(flatDTOs);
    }

    @Transactional(readOnly = true)
    public WikiFolderDTO getFolderById(Long id, User currentUser) {
        WikiFolder folder = wikiFolderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wiki folder not found with id: " + id));
        if (!hasViewAccess(folder, currentUser)) {
            throw new RuntimeException("Access denied to wiki folder with id: " + id);
        }
        return convertToDTO(folder);
    }

    public WikiFolderDTO createFolder(CreateWikiFolderRequest request, User currentUser) {
        WikiVisibility visibility = parseVisibility(request.getVisibility());

        if (visibility == WikiVisibility.TEAM) {
            if (request.getTeamId() == null) {
                throw new RuntimeException("Team ID is required for TEAM visibility");
            }
            if (!permissionService.isTeamMember(currentUser, request.getTeamId())
                    && !permissionService.isTeamOwner(currentUser, request.getTeamId())
                    && !permissionService.isAdmin(currentUser)) {
                throw new RuntimeException("Current user must be a member of the team for TEAM visibility");
            }
        }

        if (request.getParentFolderId() != null) {
            WikiFolder parent = wikiFolderRepository.findById(request.getParentFolderId())
                    .orElseThrow(() -> new RuntimeException("Parent wiki folder not found with id: " + request.getParentFolderId()));
            if (!hasEditAccess(parent, currentUser)) {
                throw new RuntimeException("No edit access to parent wiki folder with id: " + request.getParentFolderId());
            }
        }

        WikiFolder folder = WikiFolder.builder()
                .name(request.getName())
                .parentFolderId(request.getParentFolderId())
                .visibility(visibility != null ? visibility : WikiVisibility.PRIVATE)
                .teamId(request.getTeamId())
                .createdBy(currentUser.getId())
                .build();

        WikiFolder saved = wikiFolderRepository.save(folder);
        return convertToDTO(saved);
    }

    public WikiFolderDTO updateFolder(Long id, UpdateWikiFolderRequest request, User currentUser) {
        WikiFolder folder = wikiFolderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wiki folder not found with id: " + id));

        if (!hasEditAccess(folder, currentUser)) {
            throw new RuntimeException("No edit access to wiki folder with id: " + id);
        }

        if (request.getName() != null) {
            folder.setName(request.getName());
        }
        if (request.getParentFolderId() != null) {
            if (isDescendant(folder.getId(), request.getParentFolderId())) {
                throw new RuntimeException("Cannot move folder into its own descendant");
            }
            WikiFolder parent = wikiFolderRepository.findById(request.getParentFolderId())
                    .orElseThrow(() -> new RuntimeException("Parent wiki folder not found with id: " + request.getParentFolderId()));
            if (!hasEditAccess(parent, currentUser)) {
                throw new RuntimeException("No edit access to parent wiki folder with id: " + request.getParentFolderId());
            }
            folder.setParentFolderId(request.getParentFolderId());
        }
        if (request.getVisibility() != null) {
            WikiVisibility newVisibility = parseVisibility(request.getVisibility());
            if (newVisibility == WikiVisibility.TEAM) {
                Long teamId = request.getTeamId() != null ? request.getTeamId() : folder.getTeamId();
                if (teamId == null) {
                    throw new RuntimeException("Team ID is required for TEAM visibility");
                }
                if (!permissionService.isTeamMember(currentUser, teamId)
                        && !permissionService.isTeamOwner(currentUser, teamId)
                        && !permissionService.isAdmin(currentUser)) {
                    throw new RuntimeException("Current user must be a member of the team for TEAM visibility");
                }
                folder.setTeamId(teamId);
            }
            folder.setVisibility(newVisibility);
        }
        if (request.getTeamId() != null) {
            folder.setTeamId(request.getTeamId());
        }

        WikiFolder saved = wikiFolderRepository.save(folder);
        return convertToDTO(saved);
    }

    public void deleteFolder(Long id, User currentUser) {
        WikiFolder folder = wikiFolderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wiki folder not found with id: " + id));

        if (!hasEditAccess(folder, currentUser)) {
            throw new RuntimeException("No edit access to wiki folder with id: " + id);
        }

        Set<Long> descendantIds = collectDescendantIds(id);
        descendantIds.add(id);

        List<WikiPage> pagesInFolders = new ArrayList<>();
        for (Long folderId : descendantIds) {
            pagesInFolders.addAll(wikiPageRepository.findByFolderId(folderId));
        }
        for (WikiPage page : pagesInFolders) {
            page.setFolderId(null);
        }
        wikiPageRepository.saveAll(pagesInFolders);

        List<WikiFolder> allFolders = wikiFolderRepository.findAll();
        Set<Long> toDelete = descendantIds;
        List<WikiFolder> foldersToDelete = allFolders.stream()
                .filter(f -> toDelete.contains(f.getId()))
                .collect(Collectors.toList());
        wikiFolderRepository.deleteAll(foldersToDelete);
    }

    public boolean hasViewAccess(WikiFolder folder, User user) {
        if (folder == null || user == null) {
            return false;
        }
        if (permissionService.isAdmin(user)) {
            return true;
        }
        WikiVisibility visibility = folder.getVisibility() != null ? folder.getVisibility() : WikiVisibility.PRIVATE;
        switch (visibility) {
            case PUBLIC:
                return true;
            case PRIVATE:
                return Objects.equals(folder.getCreatedBy(), user.getId());
            case TEAM:
                if (folder.getTeamId() == null) {
                    return false;
                }
                return permissionService.isTeamMember(user, folder.getTeamId())
                        || permissionService.isTeamOwner(user, folder.getTeamId());
            default:
                return false;
        }
    }

    public boolean hasEditAccess(WikiFolder folder, User user) {
        if (folder == null || user == null) {
            return false;
        }
        if (permissionService.isAdmin(user)) {
            return true;
        }
        if (Objects.equals(folder.getCreatedBy(), user.getId())) {
            return true;
        }
        WikiVisibility visibility = folder.getVisibility() != null ? folder.getVisibility() : WikiVisibility.PRIVATE;
        if (visibility == WikiVisibility.TEAM && folder.getTeamId() != null) {
            return permissionService.isTeamOwner(user, folder.getTeamId());
        }
        return false;
    }

    public WikiFolderDTO convertToDTO(WikiFolder folder) {
        WikiFolderDTO.WikiFolderDTOBuilder builder = WikiFolderDTO.builder()
                .id(folder.getId())
                .name(folder.getName())
                .parentFolderId(folder.getParentFolderId())
                .visibility(folder.getVisibility() != null ? folder.getVisibility().name() : WikiVisibility.PRIVATE.name())
                .teamId(folder.getTeamId())
                .createdBy(folder.getCreatedBy())
                .createdAt(folder.getCreatedAt())
                .pageCount(wikiPageRepository.countByFolderId(folder.getId()));

        if (folder.getTeamId() != null) {
            Optional<Team> teamOpt = teamRepository.findById(folder.getTeamId());
            teamOpt.ifPresent(team -> builder.teamName(team.getName()));
        }

        if (folder.getCreatedBy() != null) {
            Optional<User> userOpt = userRepository.findById(folder.getCreatedBy());
            userOpt.ifPresent(user -> builder.createdByName(user.getName()));
        }

        return builder.build();
    }

    private WikiVisibility parseVisibility(String s) {
        if (s == null || s.isEmpty()) {
            return WikiVisibility.PRIVATE;
        }
        try {
            return WikiVisibility.valueOf(s.toUpperCase());
        } catch (IllegalArgumentException e) {
            return WikiVisibility.PRIVATE;
        }
    }

    private List<WikiFolderDTO> buildTree(List<WikiFolderDTO> flatDTOs) {
        Map<Long, WikiFolderDTO> map = new HashMap<>();
        for (WikiFolderDTO dto : flatDTOs) {
            dto.setChildren(new ArrayList<>());
            map.put(dto.getId(), dto);
        }

        List<WikiFolderDTO> roots = new ArrayList<>();
        for (WikiFolderDTO dto : flatDTOs) {
            if (dto.getParentFolderId() == null || !map.containsKey(dto.getParentFolderId())) {
                roots.add(dto);
            } else {
                WikiFolderDTO parent = map.get(dto.getParentFolderId());
                parent.getChildren().add(dto);
            }
        }

        sortTree(roots);
        return roots;
    }

    private void sortTree(List<WikiFolderDTO> nodes) {
        nodes.sort(Comparator.comparing(WikiFolderDTO::getName, Comparator.nullsLast(String::compareTo)));
        for (WikiFolderDTO node : nodes) {
            if (node.getChildren() != null && !node.getChildren().isEmpty()) {
                sortTree(node.getChildren());
            }
        }
    }

    private boolean isDescendant(Long ancestorId, Long targetId) {
        if (Objects.equals(ancestorId, targetId)) {
            return true;
        }
        Set<Long> visited = new HashSet<>();
        Long current = targetId;
        while (current != null && !visited.contains(current)) {
            visited.add(current);
            Optional<WikiFolder> currentOpt = wikiFolderRepository.findById(current);
            if (!currentOpt.isPresent()) {
                break;
            }
            Long parentId = currentOpt.get().getParentFolderId();
            if (Objects.equals(parentId, ancestorId)) {
                return true;
            }
            current = parentId;
        }
        return false;
    }

    private Set<Long> collectDescendantIds(Long rootId) {
        Set<Long> result = new HashSet<>();
        List<WikiFolder> all = wikiFolderRepository.findAll();
        Map<Long, List<WikiFolder>> byParent = all.stream()
                .filter(f -> f.getParentFolderId() != null)
                .collect(Collectors.groupingBy(WikiFolder::getParentFolderId));

        Queue<Long> queue = new LinkedList<>();
        queue.add(rootId);
        while (!queue.isEmpty()) {
            Long current = queue.poll();
            List<WikiFolder> children = byParent.get(current);
            if (children != null) {
                for (WikiFolder child : children) {
                    if (result.add(child.getId())) {
                        queue.add(child.getId());
                    }
                }
            }
        }
        return result;
    }
}
