package com.blake.pmis.retro.service;

import com.blake.pmis.entity.Team;
import com.blake.pmis.entity.User;
import com.blake.pmis.repository.TeamRepository;
import com.blake.pmis.repository.UserRepository;
import com.blake.pmis.retro.dto.*;
import com.blake.pmis.retro.entity.*;
import com.blake.pmis.retro.repository.*;
import com.blake.pmis.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class BoardService {

    private final BoardRepository boardRepository;
    private final BoardParticipantRepository boardParticipantRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final CardRepository cardRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final RetroAuthService retroAuthService;
    private final NotificationService notificationService;

    public BoardDTO createBoard(CreateBoardRequest req, User currentUser) {
        Board board = Board.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .ownerId(currentUser.getId())
                .teamId(req.getTeamId())
                .status(BoardStatus.ACTIVE)
                .build();
        board = boardRepository.save(board);

        // Create owner participant
        BoardParticipant owner = BoardParticipant.builder()
                .boardId(board.getId())
                .userId(currentUser.getId())
                .role(ParticipantRole.OWNER)
                .build();
        boardParticipantRepository.save(owner);

        // Create invited participants
        Set<Long> inviteeIds = req.getParticipantUserIds() != null
                ? new LinkedHashSet<>(req.getParticipantUserIds())
                : Collections.emptySet();
        inviteeIds.remove(currentUser.getId()); // skip self

        List<Long> actualInvitees = new ArrayList<>();
        for (Long userId : inviteeIds) {
            if (!boardParticipantRepository.existsByBoardIdAndUserId(board.getId(), userId)) {
                boardParticipantRepository.save(BoardParticipant.builder()
                        .boardId(board.getId())
                        .userId(userId)
                        .role(ParticipantRole.PARTICIPANT)
                        .build());
                actualInvitees.add(userId);
            }
        }

        // Send invite notifications
        if (!actualInvitees.isEmpty()) {
            notificationService.notifyRetroInvite(
                    board.getId(), board.getTitle(),
                    new LinkedHashSet<>(actualInvitees), currentUser);
        }

        return convertToDTO(board, currentUser);
    }

    @Transactional(readOnly = true)
    public BoardDTO getBoardById(Long id, User currentUser) {
        retroAuthService.assertParticipant(id, currentUser.getId());
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Board not found: " + id));
        return convertToDTO(board, currentUser);
    }

    @Transactional(readOnly = true)
    public List<BoardDTO> listBoards(String view, User currentUser) {
        List<Board> boards;
        if ("owned".equalsIgnoreCase(view)) {
            boards = boardRepository.findByOwnerIdOrderByUpdatedAtDesc(currentUser.getId());
        } else if ("joined".equalsIgnoreCase(view)) {
            boards = boardRepository.findByParticipantUserId(currentUser.getId());
        } else {
            // "all" = all boards the user participates in (owned + joined)
            boards = boardRepository.findByParticipantUserId(currentUser.getId());
        }
        return boards.stream()
                .map(b -> convertToDTO(b, currentUser))
                .collect(Collectors.toList());
    }

    public BoardDTO updateBoard(Long id, UpdateBoardRequest req, User currentUser) {
        retroAuthService.assertOwner(id, currentUser.getId());
        Board board = retroAuthService.assertActive(id);
        if (req.getTitle() != null) {
            board.setTitle(req.getTitle());
        }
        if (req.getDescription() != null) {
            board.setDescription(req.getDescription());
        }
        board = boardRepository.save(board);
        return convertToDTO(board, currentUser);
    }

    public void deleteBoard(Long id, User currentUser) {
        retroAuthService.assertOwner(id, currentUser.getId());
        boardRepository.deleteById(id);
    }

    public void endBoard(Long id, User currentUser) {
        retroAuthService.assertOwner(id, currentUser.getId());
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Board not found: " + id));
        board.setStatus(BoardStatus.ENDED);
        boardRepository.save(board);
    }

    public void inviteParticipants(Long id, InviteRequest req, User currentUser) {
        retroAuthService.assertOwner(id, currentUser.getId());
        Board board = retroAuthService.assertActive(id);

        Set<Long> userIds = req.getUserIds() != null
                ? new LinkedHashSet<>(req.getUserIds())
                : Collections.emptySet();
        List<Long> newInvitees = new ArrayList<>();
        for (Long userId : userIds) {
            if (!boardParticipantRepository.existsByBoardIdAndUserId(id, userId)) {
                boardParticipantRepository.save(BoardParticipant.builder()
                        .boardId(id)
                        .userId(userId)
                        .role(ParticipantRole.PARTICIPANT)
                        .build());
                newInvitees.add(userId);
            }
        }
        if (!newInvitees.isEmpty()) {
            notificationService.notifyRetroInvite(
                    board.getId(), board.getTitle(),
                    new LinkedHashSet<>(newInvitees), currentUser);
        }
    }

    public void removeParticipant(Long boardId, Long userId, User currentUser) {
        retroAuthService.assertOwner(boardId, currentUser.getId());
        BoardParticipant p = boardParticipantRepository
                .findByBoardIdAndUserId(boardId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Participant not found"));
        if (p.getRole() == ParticipantRole.OWNER) {
            throw new IllegalStateException("Cannot remove the board owner");
        }
        boardParticipantRepository.delete(p);
    }

    @Transactional(readOnly = true)
    public long countActiveForUser(User user) {
        return boardRepository.countByParticipantUserIdAndStatus(
                user.getId(), BoardStatus.ACTIVE);
    }

    private BoardDTO convertToDTO(Board board, User currentUser) {
        // Owner name
        String ownerName = null;
        if (board.getOwner() != null) {
            ownerName = board.getOwner().getName();
        } else if (board.getOwnerId() != null) {
            ownerName = userRepository.findById(board.getOwnerId())
                    .map(User::getName).orElse(null);
        }

        // Team name
        String teamName = null;
        if (board.getTeam() != null) {
            teamName = board.getTeam().getName();
        } else if (board.getTeamId() != null) {
            teamName = teamRepository.findById(board.getTeamId())
                    .map(Team::getName).orElse(null);
        }

        // Participants
        List<BoardParticipant> participants = boardParticipantRepository.findByBoardId(board.getId());
        List<ParticipantDTO> participantDTOs = participants.stream()
                .map(p -> {
                    User u = userRepository.findById(p.getUserId()).orElse(null);
                    return ParticipantDTO.builder()
                            .userId(p.getUserId())
                            .name(u != null ? u.getName() : null)
                            .email(u != null ? u.getEmail() : null)
                            .role(p.getRole().name())
                            .build();
                })
                .collect(Collectors.toList());

        // Current user role
        String currentUserRole = participants.stream()
                .filter(p -> Objects.equals(p.getUserId(), currentUser.getId()))
                .map(p -> p.getRole().name())
                .findFirst().orElse(null);

        // Card count
        long cardCount = cardRepository.countByBoardId(board.getId());

        return BoardDTO.builder()
                .id(board.getId())
                .title(board.getTitle())
                .description(board.getDescription())
                .ownerId(board.getOwnerId())
                .ownerName(ownerName)
                .teamId(board.getTeamId())
                .teamName(teamName)
                .status(board.getStatus())
                .participantCount(participants.size())
                .cardCount(cardCount)
                .currentUserRole(currentUserRole)
                .participants(participantDTOs)
                .createdAt(board.getCreatedAt())
                .updatedAt(board.getUpdatedAt())
                .build();
    }
}
