package com.example.pmis.service;

import com.example.pmis.dto.CreateWikiPageRequest;
import com.example.pmis.dto.UpdateWikiPageRequest;
import com.example.pmis.dto.WikiPageDTO;
import com.example.pmis.entity.User;
import com.example.pmis.entity.WikiPage;
import com.example.pmis.repository.UserRepository;
import com.example.pmis.repository.WikiPageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WikiPageService {

    private final WikiPageRepository wikiPageRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<WikiPageDTO> getAllWikiPages() {
        return wikiPageRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WikiPageDTO getWikiPageById(Long id) {
        WikiPage wikiPage = wikiPageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wiki page not found with id: " + id));
        return convertToDTO(wikiPage);
    }

    @Transactional(readOnly = true)
    public String getWikiPageHtml(Long id) {
        WikiPage wikiPage = wikiPageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wiki page not found with id: " + id));

        return wikiPage.getContentHtml();
    }

    @Transactional
    public WikiPageDTO createWikiPage(CreateWikiPageRequest request, Long userId) {
        WikiPage wikiPage = WikiPage.builder()
                .title(request.getTitle())
                .contentHtml(request.getContentHtml())
                .contentJson(request.getContentJson())
                .parentPageId(request.getParentPageId())
                .isPublished(request.getIsPublished() != null ? request.getIsPublished() : false)
                .teamId(request.getTeamId())
                .createdBy(userId)
                .lastModifiedBy(userId)
                .build();

        WikiPage savedWikiPage = wikiPageRepository.save(wikiPage);
        return convertToDTO(savedWikiPage);
    }

    @Transactional
    public WikiPageDTO updateWikiPage(Long id, UpdateWikiPageRequest request, Long userId) {
        WikiPage wikiPage = wikiPageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wiki page not found with id: " + id));

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
        if (request.getIsPublished() != null) {
            wikiPage.setIsPublished(request.getIsPublished());
        }
        if (request.getTeamId() != null) {
            wikiPage.setTeamId(request.getTeamId());
        }

        wikiPage.setLastModifiedBy(userId);

        WikiPage savedWikiPage = wikiPageRepository.save(wikiPage);
        return convertToDTO(savedWikiPage);
    }

    @Transactional
    public WikiPageDTO publishWikiPage(Long id, Long userId) {
        WikiPage wikiPage = wikiPageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wiki page not found with id: " + id));

        wikiPage.setIsPublished(true);
        wikiPage.setLastModifiedBy(userId);

        WikiPage savedWikiPage = wikiPageRepository.save(wikiPage);
        return convertToDTO(savedWikiPage);
    }

    @Transactional
    public void deleteWikiPage(Long id) {
        if (!wikiPageRepository.existsById(id)) {
            throw new RuntimeException("Wiki page not found with id: " + id);
        }
        wikiPageRepository.deleteById(id);
    }

    private WikiPageDTO convertToDTO(WikiPage wikiPage) {
        WikiPageDTO.WikiPageDTOBuilder builder = WikiPageDTO.builder()
                .id(wikiPage.getId())
                .title(wikiPage.getTitle())
                .contentHtml(wikiPage.getContentHtml())
                .contentJson(wikiPage.getContentJson())
                .parentPageId(wikiPage.getParentPageId())
                .isPublished(wikiPage.getIsPublished())
                .teamId(wikiPage.getTeamId())
                .createdBy(wikiPage.getCreatedBy())
                .lastModifiedBy(wikiPage.getLastModifiedBy())
                .lastModifiedAt(wikiPage.getLastModifiedAt());

        // Set created by name
        if (wikiPage.getCreatedBy() != null) {
            userRepository.findById(wikiPage.getCreatedBy())
                    .ifPresent(user -> builder.createdByName(user.getName()));
        }

        // Set last modified by name
        if (wikiPage.getLastModifiedBy() != null) {
            userRepository.findById(wikiPage.getLastModifiedBy())
                    .ifPresent(user -> builder.lastModifiedByName(user.getName()));
        }

        return builder.build();
    }
}
