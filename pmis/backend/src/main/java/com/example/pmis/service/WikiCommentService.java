package com.example.pmis.service;

import com.example.pmis.dto.CreateWikiCommentRequest;
import com.example.pmis.dto.WikiCommentDTO;
import com.example.pmis.entity.User;
import com.example.pmis.entity.WikiComment;
import com.example.pmis.repository.UserRepository;
import com.example.pmis.repository.WikiCommentRepository;
import com.example.pmis.repository.WikiPageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WikiCommentService {

    private final WikiCommentRepository wikiCommentRepository;
    private final WikiPageRepository wikiPageRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<WikiCommentDTO> getCommentsByWikiPageId(Long wikiPageId) {
        return wikiCommentRepository.findByWikiPageIdOrderByCreatedAtAsc(wikiPageId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public int getCommentCount(Long wikiPageId) {
        return wikiCommentRepository.countByWikiPageId(wikiPageId);
    }

    @Transactional
    public WikiCommentDTO createComment(CreateWikiCommentRequest request, Long userId) {
        wikiPageRepository.findById(request.getWikiPageId())
                .orElseThrow(() -> new RuntimeException("Wiki page not found with id: " + request.getWikiPageId()));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        WikiComment comment = WikiComment.builder()
                .wikiPageId(request.getWikiPageId())
                .userId(userId)
                .content(request.getContent())
                .build();

        WikiComment savedComment = wikiCommentRepository.save(comment);
        log.info("Created wiki comment with id: {}", savedComment.getId());

        return convertToDTO(savedComment, user);
    }

    @Transactional
    public void deleteComment(Long commentId) {
        WikiComment comment = wikiCommentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Wiki comment not found with id: " + commentId));
        wikiCommentRepository.delete(comment);
        log.info("Deleted wiki comment with id: {}", commentId);
    }

    private WikiCommentDTO convertToDTO(WikiComment comment) {
        String userName = comment.getUser() != null ? comment.getUser().getName() : "Unknown";
        return WikiCommentDTO.builder()
                .id(comment.getId())
                .wikiPageId(comment.getWikiPageId())
                .userId(comment.getUserId())
                .userName(userName)
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build();
    }

    private WikiCommentDTO convertToDTO(WikiComment comment, User user) {
        return WikiCommentDTO.builder()
                .id(comment.getId())
                .wikiPageId(comment.getWikiPageId())
                .userId(comment.getUserId())
                .userName(user.getName())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}