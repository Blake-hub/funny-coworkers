package com.example.pmis.service;

import com.example.pmis.dto.CreateWikiPageRequest;
import com.example.pmis.dto.UpdateWikiPageRequest;
import com.example.pmis.dto.WikiPageDTO;
import com.example.pmis.entity.User;
import com.example.pmis.entity.WikiFolder;
import com.example.pmis.entity.WikiPage;
import com.example.pmis.entity.enumeration.WikiVisibility;
import com.example.pmis.repository.UserRepository;
import com.example.pmis.repository.WikiFolderRepository;
import com.example.pmis.repository.WikiPageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WikiPageService {

    private final WikiPageRepository wikiPageRepository;
    private final UserRepository userRepository;
    private final WikiFolderRepository wikiFolderRepository;
    private final PermissionService permissionService;

    @Transactional(readOnly = true)
    public List<WikiPageDTO> getAllWikiPages(Optional<Long> folderIdOpt, User currentUser) {
        List<WikiPage> pages;
        if (folderIdOpt.isPresent()) {
            Long folderId = folderIdOpt.get();
            pages = wikiPageRepository.findByFolderId(folderId).stream()
                    .filter(p -> hasViewAccess(p, currentUser))
                    .collect(Collectors.toList());
        } else {
            pages = wikiPageRepository.findAll().stream()
                    .filter(p -> hasViewAccess(p, currentUser))
                    .collect(Collectors.toList());
        }
        return pages.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WikiPageDTO getWikiPageById(Long id, User currentUser) {
        WikiPage wikiPage = wikiPageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wiki page not found with id: " + id));
        if (!hasViewAccess(wikiPage, currentUser)) {
            throw new RuntimeException("Access denied to wiki page with id: " + id);
        }
        return convertToDTO(wikiPage);
    }

    @Transactional(readOnly = true)
    public String getWikiPageHtml(Long id, User currentUser) {
        WikiPage wikiPage = wikiPageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wiki page not found with id: " + id));
        if (!hasViewAccess(wikiPage, currentUser)) {
            throw new RuntimeException("Access denied to wiki page with id: " + id);
        }
        return wikiPage.getContentHtml();
    }

    @Transactional
    public WikiPageDTO createWikiPage(CreateWikiPageRequest request, User currentUser) {
        Long teamId = request.getTeamId();
        if (request.getFolderId() != null && teamId == null) {
            Optional<WikiFolder> folderOpt = wikiFolderRepository.findById(request.getFolderId());
            if (folderOpt.isPresent() && folderOpt.get().getTeamId() != null) {
                teamId = folderOpt.get().getTeamId();
            }
        }

        WikiPage wikiPage = WikiPage.builder()
                .title(request.getTitle())
                .contentHtml(request.getContentHtml())
                .contentJson(request.getContentJson())
                .parentPageId(request.getParentPageId())
                .folderId(request.getFolderId())
                .isPublished(request.getIsPublished() != null ? request.getIsPublished() : false)
                .teamId(teamId)
                .createdBy(currentUser.getId())
                .lastModifiedBy(currentUser.getId())
                .build();

        WikiPage savedWikiPage = wikiPageRepository.save(wikiPage);
        return convertToDTO(savedWikiPage);
    }

    @Transactional
    public WikiPageDTO updateWikiPage(Long id, UpdateWikiPageRequest request, User currentUser) {
        WikiPage wikiPage = wikiPageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wiki page not found with id: " + id));

        if (!hasEditAccess(wikiPage, currentUser)) {
            throw new RuntimeException("No edit access to wiki page with id: " + id);
        }

        if (request.getTitle() != null) {
            wikiPage.setTitle(request.getTitle());
        }
        if (request.getContentHtml() != null) {
            wikiPage.setContentHtml(request.getContentHtml());
        }
        if (request.getContentJson() != null) {
            wikiPage.setContentJson(request.getContentJson());
        }
        if (request.getParentPageId() != null) {
            wikiPage.setParentPageId(request.getParentPageId());
        }
        if (request.getFolderId() != null) {
            wikiPage.setFolderId(request.getFolderId());
            if (request.getTeamId() == null) {
                Optional<WikiFolder> folderOpt = wikiFolderRepository.findById(request.getFolderId());
                if (folderOpt.isPresent() && folderOpt.get().getTeamId() != null) {
                    wikiPage.setTeamId(folderOpt.get().getTeamId());
                }
            }
        }
        if (request.getIsPublished() != null) {
            wikiPage.setIsPublished(request.getIsPublished());
        }
        if (request.getTeamId() != null) {
            wikiPage.setTeamId(request.getTeamId());
        }

        wikiPage.setLastModifiedBy(currentUser.getId());

        WikiPage savedWikiPage = wikiPageRepository.save(wikiPage);
        return convertToDTO(savedWikiPage);
    }

    @Transactional
    public WikiPageDTO publishWikiPage(Long id, User currentUser) {
        WikiPage wikiPage = wikiPageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wiki page not found with id: " + id));

        if (!hasEditAccess(wikiPage, currentUser)) {
            throw new RuntimeException("No edit access to wiki page with id: " + id);
        }

        wikiPage.setIsPublished(true);
        wikiPage.setLastModifiedBy(currentUser.getId());

        WikiPage savedWikiPage = wikiPageRepository.save(wikiPage);
        return convertToDTO(savedWikiPage);
    }

    @Transactional
    public void deleteWikiPage(Long id, User currentUser) {
        WikiPage wikiPage = wikiPageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wiki page not found with id: " + id));
        if (!hasEditAccess(wikiPage, currentUser)) {
            throw new RuntimeException("No edit access to wiki page with id: " + id);
        }
        wikiPageRepository.deleteById(id);
    }

    public boolean hasViewAccess(WikiPage page, User user) {
        if (page == null || user == null) {
            return false;
        }
        if (permissionService.isAdmin(user)) {
            return true;
        }

        if (page.getFolderId() != null) {
            Optional<WikiFolder> folderOpt = wikiFolderRepository.findById(page.getFolderId());
            if (folderOpt.isPresent()) {
                WikiFolder folder = folderOpt.get();
                WikiVisibility visibility = folder.getVisibility() != null ? folder.getVisibility() : WikiVisibility.PRIVATE;
                switch (visibility) {
                    case PUBLIC:
                        return true;
                    case PRIVATE:
                        return Objects.equals(folder.getCreatedBy(), user.getId())
                                || Objects.equals(page.getCreatedBy(), user.getId());
                    case TEAM:
                        if (folder.getTeamId() != null) {
                            return permissionService.isTeamMember(user, folder.getTeamId())
                                    || permissionService.isTeamOwner(user, folder.getTeamId())
                                    || Objects.equals(page.getCreatedBy(), user.getId());
                        }
                        return Objects.equals(page.getCreatedBy(), user.getId());
                    default:
                        return false;
                }
            }
        }

        if (Objects.equals(page.getCreatedBy(), user.getId())) {
            return true;
        }
        if (page.getTeamId() == null) {
            return true;
        }
        return permissionService.isTeamMember(user, page.getTeamId())
                || permissionService.isTeamOwner(user, page.getTeamId());
    }

    public boolean hasEditAccess(WikiPage page, User user) {
        if (page == null || user == null) {
            return false;
        }
        if (permissionService.isAdmin(user)) {
            return true;
        }

        if (page.getFolderId() != null) {
            Optional<WikiFolder> folderOpt = wikiFolderRepository.findById(page.getFolderId());
            if (folderOpt.isPresent()) {
                WikiFolder folder = folderOpt.get();
                if (Objects.equals(folder.getCreatedBy(), user.getId())) {
                    return true;
                }
                WikiVisibility visibility = folder.getVisibility() != null ? folder.getVisibility() : WikiVisibility.PRIVATE;
                if (visibility == WikiVisibility.TEAM && folder.getTeamId() != null) {
                    if (permissionService.isTeamOwner(user, folder.getTeamId())) {
                        return true;
                    }
                }
            }
        }

        if (Objects.equals(page.getCreatedBy(), user.getId())) {
            return true;
        }
        if (page.getTeamId() != null && permissionService.isTeamOwner(user, page.getTeamId())) {
            return true;
        }
        return false;
    }

    private WikiPageDTO convertToDTO(WikiPage wikiPage) {
        WikiPageDTO.WikiPageDTOBuilder builder = WikiPageDTO.builder()
                .id(wikiPage.getId())
                .title(wikiPage.getTitle())
                .contentHtml(wikiPage.getContentHtml())
                .contentJson(wikiPage.getContentJson())
                .parentPageId(wikiPage.getParentPageId())
                .folderId(wikiPage.getFolderId())
                .isPublished(wikiPage.getIsPublished())
                .teamId(wikiPage.getTeamId())
                .createdBy(wikiPage.getCreatedBy())
                .lastModifiedBy(wikiPage.getLastModifiedBy())
                .lastModifiedAt(wikiPage.getLastModifiedAt());

        if (wikiPage.getCreatedBy() != null) {
            userRepository.findById(wikiPage.getCreatedBy())
                    .ifPresent(user -> builder.createdByName(user.getName()));
        }

        if (wikiPage.getLastModifiedBy() != null) {
            userRepository.findById(wikiPage.getLastModifiedBy())
                    .ifPresent(user -> builder.lastModifiedByName(user.getName()));
        }

        return builder.build();
    }
}
